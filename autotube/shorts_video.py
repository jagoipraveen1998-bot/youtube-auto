"""Build the vertical video for a Short.

The diagram keeps the 16:9 shape it was drawn in and sits in the upper third;
below it the narration runs as large word-grouped captions, which is what makes
a Short readable with the sound off. Everything else is the same engine the long
videos use, so the two formats look like one channel.
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

from . import explainer_art as art
from . import explainer_scene as scene
from .explainer_video import ENC, _escf, _safe_ass, _t
from .util import FPS, log, media_duration, run
from .voice import say, words_to_cues

SW, SH = 1080, 1920            # what YouTube wants for a Short
# The diagram is drawn 16:9, then zoomed and cropped to the sides so it fills the
# width of a phone instead of sitting in a thin band. Everything below y=1500 is
# left clear, because that is where the Shorts player puts its own buttons.
ZOOM_W, ZOOM_H = 1250, 703
ART_W, ART_H = 1080, 703
ART_Y = 430


def backdrop(channel: str, out: Path) -> Path:
    """The still background every beat is composited onto."""
    img = Image.new("RGB", (SW, SH), art.BG)
    d = ImageDraw.Draw(img)
    for y in range(SH):
        k = y / SH
        d.line([(0, y), (SW, y)], fill=tuple(int(a + (b - a) * (1 - k) * 0.5)
                                             for a, b in zip(art.BG, art.BG2)))
    glow = Image.new("RGB", (SW, SH), art.BG)
    ImageDraw.Draw(glow).ellipse([-260, ART_Y - 220, SW + 260, ART_Y + ART_H + 220],
                                 fill=(30, 52, 88))
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(140)), 0.75)
    if art.STYLE == "anime":
        from .anime_style import sky
        img = sky(SW, SH, 0.7).copy()
    d = ImageDraw.Draw(img)
    d.text((SW / 2, 128), channel.upper(), font=art.font(44, True), fill=art.ACCENTS[0],
           anchor="mm")
    d.rounded_rectangle([SW / 2 - 90, 168, SW / 2 + 90, 176], 4, fill=art.ACCENTS[0])
    img.save(out)
    return out


def write_caps(path: Path, cues: list[dict], caption: str, seconds: float) -> Path:
    """Big captions under the diagram, plus the beat's own two-word label."""
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {SW}
PlayResY: {SH}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,DejaVu Sans,74,&H00FFFFFF,&H00FFFFFF,&H00120A04,&H90000000,-1,0,0,0,100,100,0,0,1,7,3,2,60,60,470,1
Style: Label,DejaVu Sans,54,&H003DC4FF,&H003DC4FF,&H00120A04,&H90000000,-1,0,0,0,100,100,0,0,1,5,2,8,70,70,205,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    rows = []
    label = _safe_ass(caption)
    if label:
        rows.append(f"Dialogue: 1,0:00:00.00,{_t(seconds)},Label,,0,0,0,,{label.upper()}")
    for c in cues:
        text = _safe_ass(c["text"])
        if text:
            rows.append(f"Dialogue: 0,{_t(c['start'])},{_t(c['end'])},Cap,,0,0,0,,{text}")
    path.write_text(head + "\n".join(rows) + "\n", encoding="utf-8")
    return path


def render_beat(beat: dict, vcfg: dict, work: Path, name: str, back: Path,
                threed_cfg: dict | None = None, context: str = "",
                avoid: tuple = ()) -> tuple[Path, float]:
    """One narrated beat of a Short. Returns (clip, seconds)."""
    work.mkdir(parents=True, exist_ok=True)
    narration = str(beat.get("narration", "")).strip()
    mp3 = work / f"{name}.mp3"
    cache = work / f"{name}.json"
    if mp3.exists() and cache.exists():
        dur, words = json.loads(cache.read_text())
    else:
        dur, words = say(narration, vcfg, mp3)
        cache.write_text(json.dumps([dur, words], ensure_ascii=False))
    seconds = dur + 0.25
    visual = dict(beat.get("visual") or {})
    visual["heading"] = ""                      # the label above the diagram says it instead

    pattern, source_fps, loop, model = _frames(visual, context, seconds, work, name,
                                               threed_cfg, avoid)
    beat["_model"] = model
    caps = write_caps(work / f"{name}.ass",
                      words_to_cues(words, narration, dur, max_words=3), beat.get("caption", ""),
                      seconds)
    clip = work / f"{name}.mp4"
    vin = ["-framerate", str(source_fps)]
    if loop:
        vin += ["-stream_loop", "-1"]
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         *vin, "-i", pattern, "-loop", "1", "-i", str(back), "-i", str(mp3),
         "-filter_complex",
         f"[0:v]fps={FPS},scale={ZOOM_W}:{ZOOM_H},crop={ART_W}:{ART_H},setsar=1[a];"
         f"[1:v]fps={FPS},scale={SW}:{SH},setsar=1[bg];"
         f"[bg][a]overlay=0:{ART_Y}:shortest=0,"
         f"ass=filename='{_escf(caps)}',"
         f"fade=t=in:st=0:d=0.2,fade=t=out:st={max(0.1, seconds - 0.25):.2f}:d=0.25[v];"
         f"[2:a]aresample=48000,apad=pad_dur=0.25[out]",
         "-map", "[v]", "-map", "[out]", "-t", f"{seconds:.2f}", *ENC, str(clip)])
    for frame in Path(pattern).parent.glob("*.png" if loop else f"{name}_*.jpg"):
        frame.unlink()
    return clip, seconds


def _frames(visual, context, seconds, work, name, threed_cfg, avoid=()):
    """3D only when the beat's own words name something we have a model of, and
    that model was not just used; otherwise the drawn scene. Returns
    (pattern, fps, loops, model)."""
    if threed_cfg and threed_cfg.get("enabled") and scene.is_scene(visual.get("type")):
        from . import explainer_3d
        model = explainer_3d.choose_model(context, visual, avoid, strict=True)
        if model:
            try:
                pattern, _n, fps = explainer_3d.render(visual, context, work, name,
                                                       threed_cfg, avoid)
                return pattern, fps, True, model
            except Exception as exc:
                log(f"3D beat {name} fell back to the drawn scene: {exc}")
    pattern, _n = scene.animate(visual, seconds, work / "frames", name)
    return pattern, scene.FPS_ART, False, None


def join(parts: list[Path], out: Path) -> Path:
    lst = out.with_suffix(".txt")
    lst.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in parts))
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0",
         "-i", str(lst), "-c", "copy", "-movflags", "+faststart", str(out)])
    log(f"Short joined: {out.name} ({media_duration(out):.0f}s)")
    return out


def cover(title: str, channel: str, out: Path) -> Path:
    """A vertical cover frame. Shorts mostly ignore it, but the feed sometimes shows it."""
    img = Image.open(backdrop(channel, out.with_name("_back.png"))).copy()
    d = ImageDraw.Draw(img)
    words = title.replace("#Shorts", "").strip().upper()
    size, lines = 120, [words]
    while size > 54:
        f = art.font(size, True)
        lines = art.wrap(d, words, f, SW - 140)
        if len(lines) <= 4:
            break
        size -= 8
    f = art.font(size, True)
    y = SH / 2 - len(lines) * size * 0.6
    for i, line in enumerate(lines):
        colour = art.ACCENTS[0] if i == len(lines) - 1 and len(lines) > 1 else art.FG
        d.text((SW / 2 + 4, y + 5), line, font=f, fill=(0, 0, 0), anchor="mm")
        d.text((SW / 2, y), line, font=f, fill=colour, anchor="mm")
        y += size * 1.16
    img.save(out, quality=92)
    return out
