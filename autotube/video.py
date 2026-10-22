"""Step 5: assemble each segment with ffmpeg and join them into the final video."""
from pathlib import Path

from .util import FPS, H, W, font_family, font_path, log, run

ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p",
       "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]
TAIL = 0.7  # seconds of breathing room after each segment's speech


def _ass_time(t: float) -> str:
    cs = int(round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def write_subtitles(cues: list[dict], out: Path, lang: str, margin_bottom: int) -> Path:
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,{font_family(lang)},60,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,4,2,2,160,160,{margin_bottom},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    for c in cues:
        text = c["text"].replace("{", "(").replace("}", ")").replace("\n", " ")
        lines.append(f"Dialogue: 0,{_ass_time(c['start'])},{_ass_time(c['end'])},Sub,,0,0,0,,{text}")
    out.write_text(head + "\n".join(lines) + "\n", encoding="utf-8")
    return out


def _escape(path: Path) -> str:
    return str(path).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")


def build_segment(out: Path, audio: Path, duration: float, cues: list[dict], lang: str,
                  clips: list[Path], card: Path | None, overlay: Path | None) -> float:
    """Render one segment. Background = stock clips (if any) else a still card."""
    total = duration + TAIL
    inputs: list[str] = []
    filters: list[str] = []
    norm = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},setsar=1,format=yuv420p"

    if clips:
        part = total / len(clips) + 0.1
        for i, clip in enumerate(clips):
            inputs += ["-stream_loop", "-1", "-t", f"{part:.2f}", "-i", str(clip)]
            filters.append(f"[{i}:v]{norm},trim=duration={part:.2f},setpts=PTS-STARTPTS[c{i}]")
        joined = "".join(f"[c{i}]" for i in range(len(clips)))
        filters.append(f"{joined}concat=n={len(clips)}:v=1:a=0,eq=brightness=-0.07:saturation=1.08[bg]")
        n = len(clips)
    else:
        inputs += ["-loop", "1", "-t", f"{total:.2f}", "-i", str(card)]
        filters.append(f"[0:v]{norm}[bg]")
        n = 1

    last = "bg"
    if overlay:
        inputs += ["-loop", "1", "-t", f"{total:.2f}", "-i", str(overlay)]
        filters.append(f"[{last}][{n}:v]overlay=0:0:format=auto,format=yuv420p[ov]")
        last, n = "ov", n + 1

    subs = write_subtitles(cues, out.with_suffix(".ass"), lang, 215 if overlay else 55)
    fonts_dir = Path(font_path(lang)).parent if font_path(lang) else None
    ass = f"ass=filename='{_escape(subs)}'" + (f":fontsdir='{_escape(fonts_dir)}'" if fonts_dir else "")
    filters.append(f"[{last}]{ass},fade=t=in:st=0:d=0.4,fade=t=out:st={total - 0.4:.2f}:d=0.4[v]")

    inputs += ["-i", str(audio)]
    filters.append(f"[{n}:a]apad,atrim=duration={total:.2f},aresample=48000[a]")

    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs,
         "-filter_complex", ";".join(filters), "-map", "[v]", "-map", "[a]",
         "-t", f"{total:.2f}", *ENC, str(out)])
    return total


def join_segments(segments: list[Path], out: Path, music: Path | None, music_volume: float) -> Path:
    listing = out.with_name("segments.txt")
    listing.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in segments))
    joined = out.with_name("joined.mp4")
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0",
         "-i", str(listing), "-c", "copy", str(joined)])
    if music and music.exists():
        log("Mixing background music")
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(joined),
             "-stream_loop", "-1", "-i", str(music), "-filter_complex",
             f"[1:a]volume={music_volume},aresample=48000[m];"
             "[0:a][m]amix=inputs=2:duration=first:normalize=0[a]",
             "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
             "-movflags", "+faststart", str(out)])
    else:
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(joined),
             "-c", "copy", "-movflags", "+faststart", str(out)])
    joined.unlink(missing_ok=True)
    return out


def grab_frame(clip: Path, out: Path, at: float = 1.5) -> Path | None:
    try:
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", str(at), "-i", str(clip),
             "-frames:v", "1", str(out)])
        return out
    except RuntimeError:
        return None
