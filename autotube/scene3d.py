"""Render toy-style 3D cartoon loops with Blender (free) for rhymes and stories.

render_loop() returns a looping mp4 of the scene, synced to the song's beat, plus a
transparent close-up of the main character for thumbnails. If Blender is missing or
fails, callers fall back to the old 2D look.
"""
import hashlib
import json
import os
import random
import re
import shutil
import subprocess
import time
from pathlib import Path

from .util import log, run

SCRIPT = Path(__file__).with_name("blender_scene.py")

CHARACTERS = ["cow", "dog", "cat", "duck", "chick", "pig", "frog", "bear", "bunny", "mouse", "parrot",
              "elephant", "lion", "monkey", "sheep", "owl", "turtle", "giraffe", "dino", "banana", "moon",
              "sun", "star", "cloud", "ball", "bus", "rickshaw", "train", "robot", "snowman", "cupcake"]
SETTINGS = ["meadow", "garden", "farm", "night", "beach", "snow", "town"]

KEYWORDS = [
    ("milo", "mouse"), ("pippa", "parrot"), ("mouse", "mouse"), ("parrot", "parrot"), ("puppy", "dog"),
    ("dog", "dog"), ("kitten", "cat"), ("kitty", "cat"), ("cat", "cat"), ("cow", "cow"), ("calf", "cow"),
    ("duck", "duck"), ("chick", "chick"), ("hen", "chick"), ("rooster", "chick"), ("pig", "pig"),
    ("frog", "frog"), ("bear", "bear"), ("bunny", "bunny"), ("rabbit", "bunny"), ("elephant", "elephant"),
    ("lion", "lion"), ("monkey", "monkey"), ("sheep", "sheep"), ("lamb", "sheep"), ("owl", "owl"),
    ("turtle", "turtle"), ("tortoise", "turtle"), ("giraffe", "giraffe"), ("dinosaur", "dino"),
    ("dino", "dino"), ("crocodile", "dino"), ("banana", "banana"), ("moon", "moon"), ("sun", "sun"),
    ("star", "star"), ("cloud", "cloud"), ("ball", "ball"), ("bus", "bus"), ("rickshaw", "rickshaw"),
    ("auto", "rickshaw"), ("car", "rickshaw"), ("train", "train"), ("robot", "robot"),
    ("snowman", "snowman"), ("cupcake", "cupcake"), ("cake", "cupcake"), ("bird", "parrot"),
]
SET_WORDS = [
    ("night", "night"), ("moon", "night"), ("star", "night"), ("sleep", "night"), ("owl", "night"),
    ("beach", "beach"), ("sea", "beach"), ("sand", "beach"), ("fish", "beach"), ("snow", "snow"),
    ("winter", "snow"), ("farm", "farm"), ("cow", "farm"), ("hay", "farm"), ("rooster", "farm"),
    ("pig", "farm"), ("sheep", "farm"), ("bus", "town"), ("train", "town"), ("rickshaw", "town"),
    ("road", "town"), ("city", "town"), ("garden", "garden"), ("flower", "garden"), ("bee", "garden"),
]

_ENGINE = None  # decided once per run


def blender_bin() -> str | None:
    b = os.environ.get("BLENDER") or shutil.which("blender")
    return b if b and Path(b).exists() else None


def enabled(cfg: dict) -> bool:
    return bool(cfg.get("threed", {}).get("enabled", True)) and blender_bin() is not None


def _all(text: str, table) -> list:
    """Every match in the text, in order of first appearance."""
    t = (text or "").lower()
    hits = []
    for word, val in table:
        m = re.search(rf"\b{word}(s|es)?\b", t)
        if m:
            hits.append((m.start(), val))
    out = []
    for _, val in sorted(hits):
        if val not in out:
            out.append(val)
    return out


def _guess(text: str, table, default):
    hits = _all(text, table)
    return hits[0] if hits else default


def cast(rhyme: dict, seed: int) -> tuple[str, list[str], str]:
    """(main character id, friend ids, setting) for a rhyme / story scene."""
    r = random.Random(seed)
    text = " ".join([str(rhyme.get("character", "")), str(rhyme.get("title_en", "")), str(rhyme.get("title", ""))])
    main = rhyme.get("character_id") if rhyme.get("character_id") in CHARACTERS else None
    chars = [c for c in rhyme.get("characters", []) if c in CHARACTERS] if isinstance(rhyme.get("characters"), list) else []
    named = _all(text, KEYWORDS)
    if not chars:
        chars = named
    if not main:
        main = chars[0] if chars else None
    if not main:
        main = r.choice(["dog", "cat", "bunny", "bear", "duck", "elephant", "monkey", "chick"])
    friends = [c for c in chars if c != main]
    for f in rhyme.get("friends", []) if isinstance(rhyme.get("friends"), list) else []:
        if f in CHARACTERS and f != main and f not in friends:
            friends.append(f)
    pool = [c for c in ["dog", "cat", "bunny", "bear", "duck", "chick", "pig", "frog", "monkey", "elephant",
                        "sheep", "lion"] if c != main and c not in friends]
    r.shuffle(pool)
    friends = (friends + pool)[:2]
    setting = rhyme.get("setting") if rhyme.get("setting") in SETTINGS else _guess(text, SET_WORDS, None)
    if not setting:
        setting = r.choice(["meadow", "garden", "meadow", "farm", "town"])
    return main, friends, setting


def _run_blender(spec: dict, spec_path: Path, timeout: int) -> tuple[bool, str]:
    spec_path.write_text(json.dumps(spec))
    cmd = [blender_bin(), "-b", "--factory-startup", "-noaudio", "-P", str(SCRIPT), "--", str(spec_path)]
    if shutil.which("xvfb-run") and spec.get("engine") in ("EEVEE", "WORKBENCH"):
        cmd = ["xvfb-run", "-a", "-s", "-screen 0 1280x720x24"] + cmd
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return False, "timeout"
    tail = (p.stdout[-1500:] + "\n" + p.stderr[-1500:]).strip()
    return p.returncode == 0, tail


def _frames_ok(folder: Path, n: int) -> bool:
    files = sorted(folder.glob("f_*.png"))
    if len(files) < n:
        return False
    try:
        from PIL import Image, ImageStat
        st = ImageStat.Stat(Image.open(files[0]).convert("L"))
        return st.mean[0] > 12  # not a black frame
    except Exception:
        return True


def _pick_engine(cfg: dict, work: Path) -> str:
    """Use EEVEE if it renders on this machine (fast), otherwise Cycles on the CPU."""
    global _ENGINE
    if _ENGINE:
        return _ENGINE
    want = cfg.get("threed", {}).get("engine", "auto").upper()
    if want in ("EEVEE", "CYCLES", "WORKBENCH"):
        _ENGINE = want
        return _ENGINE
    probe = work / "_engine_probe"
    shutil.rmtree(probe, ignore_errors=True)
    probe.mkdir(parents=True)
    spec = {"mode": "loop", "out_dir": str(probe), "width": 320, "height": 180, "fps": 15, "frames": 2,
            "engine": "EEVEE", "samples": 8, "seed": 1, "setting": "meadow", "main": "dog", "friends": []}
    t0 = time.time()
    ok, tail = _run_blender(spec, probe / "spec.json", 300)
    if ok and _frames_ok(probe, 2):
        _ENGINE = "EEVEE"
    else:
        log(f"EEVEE not usable here, using Cycles. ({tail[-300:]})")
        _ENGINE = "CYCLES"
    log(f"3D engine: {_ENGINE} (probe {time.time() - t0:.0f}s)")
    return _ENGINE


def render_loop(rhyme: dict, vertical: bool, bpm: int, seed: int, work: Path, cfg: dict,
                out_size: tuple[int, int]) -> tuple[Path, Path | None, float]:
    """Render (or reuse) a seamless 2-bar loop. Returns (loop.mp4, portrait.png, loop_seconds)."""
    tc = cfg.get("threed", {})
    fps = int(tc.get("fps", 15))
    rw, rh = (tc.get("width", 960), tc.get("height", 540))
    if vertical:
        rw, rh = rh, rw
    beat = 60.0 / bpm
    frames = max(16, round(8 * beat * fps))
    main, friends, setting = cast(rhyme, seed)
    key = hashlib.md5(json.dumps([main, friends, setting, vertical, frames, fps, rw, rh, seed]).encode()).hexdigest()[:10]
    folder = work / f"3d_{'v' if vertical else 'h'}_{key}"
    loop = folder / "loop.mp4"
    portrait = folder / "portrait.png"
    if loop.exists():
        return loop, (portrait if portrait.exists() else None), frames / fps
    shutil.rmtree(folder, ignore_errors=True)
    folder.mkdir(parents=True)
    engine = _pick_engine(cfg, work.parent if work.parent.exists() else work)
    spec = {"mode": "loop", "out_dir": str(folder), "width": rw, "height": rh, "fps": fps, "frames": frames,
            "engine": engine, "samples": int(tc.get(f"samples_{engine.lower()}", 16 if engine == "EEVEE" else 12)),
            "seed": seed, "setting": setting, "main": main, "friends": friends, "vertical": vertical,
            "portrait": str(portrait)}
    log(f"3D: {main} + {', '.join(friends)} in the {setting} ({'9:16' if vertical else '16:9'}, {frames} frames, {engine})")
    t0 = time.time()
    ok, tail = _run_blender(spec, folder / "spec.json", int(tc.get("timeout", 1500)))
    if not ok or not _frames_ok(folder, frames):
        raise RuntimeError(f"Blender render failed: {tail[-800:]}")
    log(f"3D: rendered in {time.time() - t0:.0f}s ({(time.time() - t0) / frames:.1f}s/frame)")
    W, H = out_size
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-framerate", str(fps), "-i", str(folder / "f_%04d.png"),
         "-vf", f"scale={W}:{H}:flags=lanczos,fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "veryfast",
         "-crf", "18", str(loop)])
    for f in folder.glob("f_*.png"):
        f.unlink()
    return loop, (portrait if portrait.exists() else None), frames / fps


def render_portraits(ids: list[str], out_dir: Path, cfg: dict, size: int = 320) -> bool:
    out_dir.mkdir(parents=True, exist_ok=True)
    engine = _pick_engine(cfg, out_dir)
    spec = {"mode": "portraits", "out_dir": str(out_dir), "width": size, "height": size, "fps": 24, "frames": 1,
            "engine": engine, "samples": 16, "seed": 3, "ids": ids}
    ok, tail = _run_blender(spec, out_dir / "spec.json", 1800)
    if not ok:
        log(f"Portraits failed: {tail[-800:]}")
    return ok
