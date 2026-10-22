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
