"""Small helpers shared by every step."""
import json
import os
import shutil
import subprocess
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
W, H, FPS = 1920, 1080, 30


def log(msg: str) -> None:
    print(f"[autotube] {msg}", flush=True)


def load_config(path: Path | None = None) -> dict:
    with open(path or ROOT / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def env(name: str, required: bool = True) -> str | None:
    value = os.environ.get(name, "").strip()
    if required and not value:
        raise SystemExit(f"Missing secret/environment variable: {name}")
    return value or None


def run(cmd: list[str]) -> None:
    """Run a command (ffmpeg) and show its error output if it fails."""
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd[:6])} ...\n{result.stderr[-3000:]}")


def media_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    return float(json.loads(out)["format"]["duration"])


_FONT_CACHE: dict[str, str] = {}


def font_path(language: str = "en", bold: bool = True) -> str:
    """Find a font file that can draw the channel language."""
    key = f"{language}-{bold}"
    if key in _FONT_CACHE:
        return _FONT_CACHE[key]
    weight = ":bold" if bold else ""
    wanted = ["Noto Sans Tamil", "Noto Sans"] if language == "ta" else ["Noto Sans", "DejaVu Sans"]
    found = ""
    if shutil.which("fc-match"):
        for family in wanted:
            out = subprocess.run(["fc-match", "-f", "%{file}|%{family}", family + weight],
                                 capture_output=True, text=True).stdout
            file, _, fam = out.partition("|")
            if file and family.split()[-1].lower() in fam.lower():
                found = file
                break
    if not found:
        for candidate in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                          "C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/Nirmala.ttf"]:
            if Path(candidate).exists():
                found = candidate
                break
    _FONT_CACHE[key] = found
    return found


def font_family(language: str = "en") -> str:
    """Font family name used inside subtitle (ASS) files."""
    return "Noto Sans Tamil" if language == "ta" else "Noto Sans"


def check_playable(path, min_seconds: float, max_seconds: float) -> float:
    """Refuse to publish a file that is not a real, watchable video.

    Nothing reviews these before they go live, so a silent clip, a truncated
    render or a stray zero-byte file has to stop here rather than on the channel.
    """
    import json as _json
    import subprocess as _sp
    from pathlib import Path as _Path

    path = _Path(path)
    if not path.exists() or path.stat().st_size < 200_000:
        raise RuntimeError(f"{path.name} is missing or too small to be a real video")
    out = _sp.run(["ffprobe", "-v", "error", "-show_entries",
                   "format=duration:stream=codec_type,width,height",
                   "-of", "json", str(path)], capture_output=True, text=True)
    if out.returncode:
        raise RuntimeError(f"{path.name} could not be read back by ffprobe")
    data = _json.loads(out.stdout or "{}")
    kinds = [s.get("codec_type") for s in data.get("streams", [])]
    if "video" not in kinds:
        raise RuntimeError(f"{path.name} has no video stream")
    if "audio" not in kinds:
        raise RuntimeError(f"{path.name} has no audio: the narration did not make it in")
    seconds = float(data.get("format", {}).get("duration", 0) or 0)
    if not (min_seconds <= seconds <= max_seconds):
        raise RuntimeError(f"{path.name} is {seconds:.0f}s, outside the "
                           f"{min_seconds:.0f}-{max_seconds:.0f}s a publishable video should be")
    log(f"{path.name} checks out: {seconds:.0f}s, video and audio present")
    return seconds
