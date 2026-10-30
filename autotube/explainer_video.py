"""Turn an explainer script into a finished video.

Each section is narrated, its diagram builds up while the narrator talks, and
clean subtitles run along the bottom. No 3D, so a whole video renders in a
couple of minutes rather than an hour.
"""
import json
import re
from pathlib import Path

from . import explainer_art as art
from . import explainer_scene as scene
from .util import FPS, log, media_duration, run
from .voice import say, words_to_cues

ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
       "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]


def _t(seconds: float) -> str:
    cs = max(0, int(round(seconds * 100)))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def write_subs(path: Path, cues: list[dict], family: str = "DejaVu Sans") -> Path:
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {art.W}
PlayResY: {art.H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Say,{family},54,&H00FFFFFF,&H00FFFFFF,&H00241A0E,&HA0000000,-1,0,0,0,100,100,0,0,3,0,0,2,220,220,70,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    rows = []
    for c in cues:
        text = str(c["text"]).replace("{", "(").replace("}", ")").replace("\n", " ")
        text = re.sub(r"\s+([,.;:!?])", r"\1", text).strip(" ,;:")   # no floating punctuation
        if not text:
            continue
        rows.append(f"Dialogue: 0,{_t(c['start'])},{_t(c['end'])},Say,,0,0,0,,{text}")
    path.write_text(head + "\n".join(rows) + "\n", encoding="utf-8")
    return path


def _escf(p) -> str:
    return str(p).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")


def render_section(section: dict, vcfg: dict, work: Path, name: str) -> tuple[Path, float]:
    """One narrated section with its diagram. Returns (clip, seconds)."""
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
    pattern, _count = scene.animate(visual, seconds, work / "frames", name)
    subs = write_subs(work / f"{name}.ass", words_to_cues(words, narration, dur, max_words=9))
    clip = work / f"{name}.mp4"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-framerate", str(scene.FPS_ART), "-i", pattern, "-i", str(mp3),
         "-filter_complex",
         f"[0:v]fps={FPS},scale={art.W}:{art.H},setsar=1,ass=filename='{_escf(subs)}',"
         f"fade=t=in:st=0:d=0.25,fade=t=out:st={seconds - 0.3:.2f}:d=0.3[v];"
         f"[1:a]aresample=48000,apad=pad_dur=0.5[a]",
         "-map", "[v]", "-map", "[a]", "-t", f"{seconds:.2f}", *ENC, str(clip)])
    for frame in (work / "frames").glob(f"{name}_*.jpg"):
        frame.unlink()          # the clip holds them now; keep peak disk small
    return clip, seconds


def render_card(image_path: Path, seconds: float, work: Path, name: str,
                mp3: Path | None = None) -> tuple[Path, float]:
    """A still card (the opening title, or the closing frame)."""
    clip = work / f"{name}.mp4"
    audio = (["-i", str(mp3)] if mp3 else
             ["-f", "lavfi", "-i", f"anullsrc=channel_layout=stereo:sample_rate=48000"])
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


def thumbnail(text: str, channel: str, out: Path) -> Path:
    """A few huge words, readable at thumbnail size on a phone."""
    from PIL import ImageDraw
    img = art.thumb_card(text, channel)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([art.W - 430, 70, art.W - 90, 170], 18, fill=art.ACCENTS[0])
    d.text((art.W - 260, 120), "EXPLAINED", font=art.font(40, True), fill=art.BG, anchor="mm")
    img.resize((1280, 720)).save(out, quality=92)
    return out
