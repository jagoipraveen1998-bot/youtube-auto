"""Turn an explainer script into a finished video.

Sections use either the existing 2D diagrams or optional Blender-rendered
3D mechanism scenes. Narration and bottom subtitles stay shared by both modes.
"""
import json
import math
import re
from pathlib import Path

from . import explainer_3d
from . import explainer_art as art
from . import explainer_scene as scene
from .util import FPS, log, media_duration, run
from .voice import say, words_to_cues

ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
       "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]


def _t(seconds: float) -> str:
    cs = max(0, int(round(seconds * 100)))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def _safe_ass(text: str) -> str:
    text = str(text).replace("{", "(").replace("}", ")").replace("\n", " ")
    return re.sub(r"\s+([,.;:!?])", r"\1", text).strip(" ,;:")


def write_subs(path: Path, cues: list[dict], family: str = "DejaVu Sans",
               heading: str = "", seconds: float = 0) -> Path:
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {art.W}
PlayResY: {art.H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Say,{family},54,&H00FFFFFF,&H00FFFFFF,&H00241A0E,&HA0000000,-1,0,0,0,100,100,0,0,3,0,0,2,220,220,70,1
Style: Heading,{family},44,&H0000E6F2,&H0000E6F2,&H00101828,&HA0000000,-1,0,0,0,100,100,0,0,1,3,1,8,120,120,65,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    rows = []
    title = _safe_ass(heading)
    if title and seconds > 0:
        rows.append(f"Dialogue: 1,0:00:00.00,{_t(seconds)},Heading,,0,0,0,,{title}")
    for c in cues:
        text = _safe_ass(c["text"])
        if text:
            rows.append(f"Dialogue: 0,{_t(c['start'])},{_t(c['end'])},Say,,0,0,0,,{text}")
    path.write_text(head + "\n".join(rows) + "\n", encoding="utf-8")
    return path


def _escf(p) -> str:
    return str(p).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")


def render_section(section: dict, vcfg: dict, work: Path, name: str,
                   threed_cfg: dict | None = None, context: str = "",
                   avoid: tuple = ()) -> tuple[Path, float]:
    """Render one narrated section with a looped diagram or 3D scene."""
    work.mkdir(parents=True, exist_ok=True)
    narration = str(section.get("narration", "")).strip()
    mp3 = work / f"{name}.mp3"
    cache = work / f"{name}.json"
    if mp3.exists() and cache.exists():
        dur, words = json.loads(cache.read_text())
    else:
        dur, words = say(narration, vcfg, mp3)
        cache.write_text(json.dumps([dur, words], ensure_ascii=False))
    seconds = dur + 0.5
    visual = dict(section.get("visual") or {})
    visual.setdefault("heading", section.get("heading", ""))
    # 3D suits a mechanism; a list, a contrast or a figure has to stay 2D, or its
    # content would be replaced by a generic loop. Either way a 3D failure must
    # never cost us the day's video, so it falls back to the drawn scene.
    model = None
    if threed_cfg and threed_cfg.get("enabled", False) and scene.is_scene(visual.get("type")):
        model = explainer_3d.choose_model(context, visual, avoid, strict=True)
    use_3d = False
    if model:
        try:
            pattern, _count, source_fps = explainer_3d.render(visual, context, work, name,
                                                              threed_cfg, avoid)
            use_3d = True
            section["_model"] = model
        except Exception as exc:
            log(f"3D scene for {name} fell back to the drawn version: {exc}")
    if not use_3d:
        pattern, _count = scene.animate(visual, seconds, work / "frames", name)
        source_fps = scene.FPS_ART

    # the drawn scenes already carry their heading inside the frame
    subs = write_subs(work / f"{name}.ass", words_to_cues(words, narration, dur, max_words=9),
                      heading=str(visual.get("heading", "")) if use_3d else "", seconds=seconds)
    video_input = ["-framerate", str(source_fps)]
    if use_3d:
        video_input += ["-stream_loop", "-1"]
    video_input += ["-i", pattern]
    clip = work / f"{name}.mp4"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *video_input, "-i", str(mp3),
         "-filter_complex",
         f"[0:v]fps={FPS},scale={art.W}:{art.H},setsar=1,ass=filename='{_escf(subs)}',"
         f"fade=t=in:st=0:d=0.25,fade=t=out:st={max(0.1, seconds - 0.3):.2f}:d=0.3[v];"
         f"[1:a]aresample=48000,apad=pad_dur=0.5[a]",
         "-map", "[v]", "-map", "[a]", "-t", f"{seconds:.2f}", *ENC, str(clip)])

    frame_path = Path(pattern)
    for frame in frame_path.parent.glob("*.png" if use_3d else f"{name}_*.jpg"):
        frame.unlink()
    if use_3d:
        try:
            frame_path.parent.rmdir()
        except OSError:
            pass
    return clip, seconds


MOTIONS = ("in", "right", "out", "left")
XFADE = 0.5


def _still(src: Path, out: Path) -> Path:
    """Cover-crop a painting to 16:9 at twice the frame size, so the slow moves stay sharp."""
    from PIL import Image
    img = Image.open(src).convert("RGB")
    W2, H2 = art.W * 2, art.H * 2
    k = max(W2 / img.width, H2 / img.height)
    img = img.resize((math.ceil(img.width * k), math.ceil(img.height * k)), Image.LANCZOS)
    left, top = (img.width - W2) // 2, (img.height - H2) // 2
    img.crop((left, top, left + W2, top + H2)).save(out)
    return out


def _move(kind: str, frames: int) -> str:
    n = max(1, frames - 1)
    centre_x, centre_y = "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"
    if kind == "in":
        z, x, y = f"1.0+0.12*on/{n}", centre_x, centre_y
    elif kind == "out":
        z, x, y = f"1.12-0.12*on/{n}", centre_x, centre_y
    elif kind == "right":
        z, x, y = "1.12", f"(iw-iw/zoom)*on/{n}", centre_y
    else:
        z, x, y = "1.12", f"(iw-iw/zoom)*(1-on/{n})", centre_y
    return f"zoompan=z='{z}':x='{x}':y='{y}':d=1:s={art.W}x{art.H}:fps={FPS}"


def _illustrated_subs(path: Path, cues: list[dict], spans: list[tuple[float, float, str]],
                      heading: str, seconds: float, title: str = "") -> Path:
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {art.W}
PlayResY: {art.H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Say,DejaVu Sans,52,&H00FFFFFF,&H00FFFFFF,&H00301A10,&H96100A06,-1,0,0,0,100,100,0,0,3,14,0,2,240,240,64,1
Style: Label,DejaVu Sans,44,&H00FFFFFF,&H00FFFFFF,&H00A0602A,&H00A0602A,-1,0,0,0,100,100,1,0,3,12,0,7,70,70,60,1
Style: Heading,DejaVu Sans,62,&H0060D8FF,&H0060D8FF,&H00180C06,&H80000000,-1,0,0,0,100,100,0,0,1,5,2,8,120,120,70,1
Style: Title,DejaVu Sans,92,&H00FFFFFF,&H00FFFFFF,&H00180C06,&H80000000,-1,0,0,0,100,100,0,0,1,7,3,5,140,140,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    rows = []
    if title:
        rows.append(f"Dialogue: 2,0:00:00.00,{_t(min(seconds, 4.5))},Title,,0,0,0,,"
                    f"{{\\fad(400,500)}}{_safe_ass(title)}")
    elif heading:
        rows.append(f"Dialogue: 2,0:00:00.00,{_t(min(seconds, 3.8))},Heading,,0,0,0,,"
                    f"{{\\fad(300,500)}}{_safe_ass(heading)}")
    for start, end, label in spans:
        label = _safe_ass(label)
        if label:
            delay = 4.0 if (start == 0 and (title or heading)) else 0.4
            if end - start > delay + 1.5:
                rows.append(f"Dialogue: 1,{_t(start + delay)},{_t(end - 0.2)},Label,,0,0,0,,"
                            f"{{\\fad(250,250)}}{label.upper()}")
    for c in cues:
        text = _safe_ass(c["text"])
        if text:
            rows.append(f"Dialogue: 0,{_t(c['start'])},{_t(c['end'])},Say,,0,0,0,,{text}")
    path.write_text(head + "\n".join(rows) + "\n", encoding="utf-8")
    return path


def render_illustrated(narration: str, shots: list[dict], vcfg: dict, work: Path, name: str,
                       heading: str = "", title: str = "") -> tuple[Path, float]:
    """One narrated part over a run of paintings, each slowly moving, cross-faded."""
    from .illustrate import timings
    work.mkdir(parents=True, exist_ok=True)
    mp3, cache = work / f"{name}.mp3", work / f"{name}.json"
    if mp3.exists() and cache.exists():
        dur, words = json.loads(cache.read_text())
    else:
        dur, words = say(narration, vcfg, mp3)
        cache.write_text(json.dumps([dur, words], ensure_ascii=False))
    seconds = dur + 0.5
    durs = timings(narration, seconds, len(shots))

    inputs, chains, spans, t = [], [], [], 0.0
    for k, (shot, d) in enumerate(zip(shots, durs)):
        length = d + (XFADE if k < len(shots) - 1 else 0)
        frames = max(2, round(length * FPS))
        still = _still(Path(shot["image"]), work / f"{name}_still{k}.png")
        inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{length:.3f}", "-i", str(still)]
        chains.append(f"[{k}:v]{_move(MOTIONS[(k + len(name)) % 4], frames)},"
                      f"trim=end_frame={frames},setsar=1,format=yuv420p[p{k}]")
        spans.append((t, t + d, shot.get("label", "")))
        t += d
    graph = ";".join(chains)
    last, offset = "p0", 0.0
    for k in range(1, len(shots)):
        offset += durs[k - 1]
        graph += (f";[{last}][p{k}]xfade=transition=fade:duration={XFADE}:"
                  f"offset={offset:.3f}[x{k}]")
        last = f"x{k}"
    subs = _illustrated_subs(work / f"{name}.ass",
                             words_to_cues(words, narration, dur, max_words=8),
                             spans, heading, seconds, title)
    audio_index = len(shots)
    graph += (f";[{last}]ass=filename='{_escf(subs)}',"
              f"fade=t=in:st=0:d=0.3,fade=t=out:st={max(0.1, seconds - 0.35):.2f}:d=0.35[v];"
              f"[{audio_index}:a]aresample=48000,apad=pad_dur=0.5[a]")
    clip = work / f"{name}.mp4"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs, "-i", str(mp3),
         "-filter_complex", graph, "-map", "[v]", "-map", "[a]", "-t", f"{seconds:.2f}",
         *ENC, str(clip)])
    for f in work.glob(f"{name}_still*.png"):
        f.unlink()
    return clip, seconds


def render_card(image_path: Path, seconds: float, work: Path, name: str,
                mp3: Path | None = None) -> tuple[Path, float]:
    """A still card (the opening title, or the closing frame)."""
    clip = work / f"{name}.mp4"
    audio = (["-i", str(mp3)] if mp3 else
             ["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"])
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-loop", "1", "-t", f"{seconds:.2f}", "-i", str(image_path), *audio,
         "-vf", f"fps={FPS},scale={art.W}:{art.H},setsar=1,fade=t=in:st=0:d=0.3,"
                f"fade=t=out:st={seconds - 0.4:.2f}:d=0.4",
         "-t", f"{seconds:.2f}", *ENC, str(clip)])
    return clip, seconds


def join(parts: list[Path], out: Path) -> Path:
    lst = out.with_suffix(".txt")
    lst.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in parts))
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0",
         "-i", str(lst), "-c", "copy", "-movflags", "+faststart", str(out)])
    log(f"Joined {len(parts)} parts -> {out.name} ({media_duration(out):.0f}s)")
    return out


def _painted_thumb(image: Path, text: str, channel: str):
    """The painting full-bleed, darkened on the left, with a few huge words over it."""
    from PIL import Image, ImageDraw
    import numpy as np
    W, H = art.W, art.H
    img = Image.open(image).convert("RGB")
    k = max(W / img.width, H / img.height)
    img = img.resize((math.ceil(img.width * k), math.ceil(img.height * k)), Image.LANCZOS)
    img = img.crop(((img.width - W) // 2, (img.height - H) // 2,
                    (img.width - W) // 2 + W, (img.height - H) // 2 + H))
    # a soft dark band behind the words, fading out towards the right
    ramp = np.clip(1.0 - np.linspace(0, 1, W) / 0.72, 0, 1) ** 1.3 * 0.78
    shade = (ramp[None, :, None] * np.ones((H, 1, 1))).astype(np.float32)
    arr = np.asarray(img, dtype=np.float32)
    arr = arr * (1 - shade) + np.array([10, 8, 30], dtype=np.float32) * shade
    img = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    words = (text or channel).strip().upper()
    size, lines = 170, []
    while size > 80:
        f = art.font(size, True)
        lines = art.wrap(d, words, f, int(W * 0.56))
        if len(lines) <= 3:
            break
        size -= 10
    f = art.font(size, True)
    gap = int(size * 1.08)
    y = H / 2 - (len(lines) * gap) / 2
    for i, line in enumerate(lines):
        colour = art.ACCENTS[0] if (len(lines) > 1 and i == len(lines) - 1) else (255, 255, 255)
        d.text((110, y), line, font=f, fill=colour, stroke_width=10, stroke_fill=(12, 8, 28))
        y += gap
    d.text((112, H - 70), channel.upper(), font=art.font(40, True), fill=art.ACCENTS[0],
           anchor="ls", stroke_width=4, stroke_fill=(12, 8, 28))
    return img


def thumbnail(text: str, channel: str, out: Path, image: Path | None = None) -> Path:
    """A few huge words, readable at thumbnail size on a phone."""
    from PIL import ImageDraw
    img = None
    if image:
        try:
            img = _painted_thumb(image, text, channel)
        except Exception as exc:
            log(f"Painted thumbnail failed, using the plain one: {exc}")
    if img is None:
        img = art.thumb_card(text, channel)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([art.W - 430, 70, art.W - 90, 170], 18, fill=art.ACCENTS[0])
    d.text((art.W - 260, 120), "EXPLAINED", font=art.font(40, True), fill=art.BG, anchor="mm")
    img.resize((1280, 720)).save(out, quality=92)
    return out
