"""Voice the story, time every shot to the narration, render the cartoon frames and encode the Short."""
import json
import os
import random
import re
import shutil
from pathlib import Path

import numpy as np

from . import horror_audio as ha
from .util import ROOT, log, run

FPS = 30
WEB = ROOT / "horror" / "web"
LEAD = 0.45          # silence before the first line
GAP = 0.32           # pause between lines
LONG_GAP = 0.75      # pause before a time jump or the twist
TAIL = 1.4           # picture after the last word (final hold + static)

SKINS = ["#c98d62", "#e0b48c", "#a86e48", "#8a5a3a", "#d9a07a"]
HAIRS = ["#1d1420", "#3b2618", "#5a3a22", "#1a1a2a"]
DOUBLE_SHIRTS = {"pj": "shirt", "hoodie": "tee", "tee": "hoodie", "nightie": "shirt", "shirt": "hoodie"}


def _norm(w: str) -> str:
    return re.sub(r"[^a-z0-9']", "", w.lower())


def voice_lines(story: dict, vcfg: dict, work: Path) -> tuple[np.ndarray, list[dict]]:
    """Speak each beat, join them with natural pauses. Returns (voice samples, per-beat timing)."""
    from .voice import say

    parts, timing = [np.zeros(int(LEAD * ha.SR))], []
    t = LEAD
    beats = story["beats"]
    for i, b in enumerate(beats):
        mp3 = work / f"line{i:02d}.mp3"
        dur, words = say(b["line"], vcfg, mp3)
        audio = ha.load(mp3)
        dur = len(audio) / ha.SR
        bw = b.get("beat_word")
        hit = next((w for w in words if bw and _norm(w["text"]) == _norm(bw)), None)
        if hit is None and bw:
            hit = next((w for w in words if bw and _norm(bw) and _norm(bw) in _norm(w["text"])), None)
        tword = hit["start"] if hit else dur * 0.6
        timing.append({"start": t, "end": t + dur, "beat": t + min(tword, dur)})
        parts.append(audio)
        t += dur
        nxt = beats[i + 1] if i + 1 < len(beats) else None
        gap = LONG_GAP if nxt and (nxt.get("jump") or nxt.get("twist")) else GAP
        if nxt:
            parts.append(np.zeros(int(gap * ha.SR)))
            t += gap
    voice = np.concatenate(parts)
    return voice, timing


def voice_from_file(story: dict, path: Path) -> tuple[np.ndarray, list[dict]]:
    """Local testing: use a recorded narration and find the lines from its pauses."""
    audio = ha.load(path)
    w = int(0.05 * ha.SR); n = len(audio) // w
    rms = np.sqrt((audio[:n * w].reshape(n, w) ** 2).mean(1))
    speech = rms > rms.max() * 10 ** (-32 / 20)
    segs, cur = [], None
    for i, s in enumerate(speech):
        if s and cur is None: cur = i
        if not s and cur is not None:
            segs.append([cur, i]); cur = None
    if cur is not None: segs.append([cur, n])
    merged = []
    for s in segs:  # pauses shorter than 0.5 s stay inside one line
        if merged and (s[0] - merged[-1][1]) * 0.05 < 0.5: merged[-1][1] = s[1]
        else: merged.append(s)
    beats = story["beats"]
    while len(merged) > len(beats):  # join the closest pair
        gaps = [merged[i + 1][0] - merged[i][1] for i in range(len(merged) - 1)]
        k = int(np.argmin(gaps)); merged[k][1] = merged[k + 1][1]; del merged[k + 1]
    timing = []
    for b, (s0, s1) in zip(beats, merged):
        st, en = s0 * 0.05, s1 * 0.05
        words = b["line"].split()
        idx = next((i for i, x in enumerate(words) if _norm(x) == _norm(b.get("beat_word", ""))), int(len(words) * 0.6))
        timing.append({"start": st, "end": en, "beat": st + (en - st) * (idx + 0.3) / max(1, len(words))})
    return audio, timing


def build_plan(story: dict, timing: list[dict], total: float, seed: int) -> dict:
    rnd = random.Random(seed)
    frames = int(round(total * FPS))
    shots = []
    for i, (b, tm) in enumerate(zip(story["beats"], timing)):
        a = 0 if i == 0 else max(shots[-1]["a"] + 6, int(round(tm["start"] * FPS)) - 4)
        sh = {k: v for k, v in b.items() if k not in ("line", "beat_word")}
        sh["a"] = a
        sh["beat"] = int(round(tm["beat"] * FPS)) - 2 if b.get("react", "none") != "none" or b.get("twist") else None
        if sh["beat"] is not None:
            sh["beat"] = max(a + 3, sh["beat"])
        shots.append(sh)
    for i, sh in enumerate(shots):
        sh["b"] = shots[i + 1]["a"] if i + 1 < len(shots) else frames
        if sh["beat"] is not None:
            sh["beat"] = min(sh["beat"], sh["b"] - 3)
    hero = story["hero"]
    girl = hero["look"] == "girl"
    return {
        "frames": frames,
        "hero": {"outfit": hero["outfit"], "skin": rnd.choice(SKINS), "hair": rnd.choice(HAIRS),
                 "hairStyle": "bob" if girl else "spiky"},
        "other": {"kind": story["villain"], "outfit": DOUBLE_SHIRTS.get(hero["outfit"], "shirt")},
        "shots": shots,
    }


def render(plan: dict, work: Path, frames_dir: Path, stills: list[int] | None = None) -> None:
    from playwright.sync_api import sync_playwright
    import base64

    web = work / "web"
    shutil.rmtree(web, ignore_errors=True)
    shutil.copytree(WEB, web)
    (web / "plan.js").write_text("window.PLAN = " + json.dumps(plan) + ";", encoding="utf-8")
    frames_dir.mkdir(parents=True, exist_ok=True)
    todo = stills if stills is not None else list(range(plan["frames"]))
    with sync_playwright() as p:
        kw = {"args": ["--allow-file-access-from-files"]}
        if os.environ.get("CHROME_PATH"):
            kw["executable_path"] = os.environ["CHROME_PATH"]
        browser = p.chromium.launch(**kw)
        page = browser.new_page(viewport={"width": 1080, "height": 1920})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto((web / "index.html").resolve().as_uri())
        page.wait_for_function("window.ready === true")
        if errors:
            raise RuntimeError(f"Cartoon player failed to load: {errors[0]}")
        for n, f in enumerate(todo):
            data = page.evaluate("f => { renderFrame(f); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }", f)
            (frames_dir / f"f{f:04d}.jpg").write_bytes(base64.b64decode(data.split(",", 1)[1]))
            if errors:
                raise RuntimeError(f"Cartoon player error at frame {f}: {errors[0]}")
            if n and n % 200 == 0:
                log(f"Rendered {n}/{len(todo)} frames")
        browser.close()


def encode(frames_dir: Path, audio: Path, out: Path) -> Path:
    run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", str(frames_dir / "f%04d.jpg"), "-i", str(audio),
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-shortest", "-movflags", "+faststart", str(out)])
    return out


def cover(frames_dir: Path, plan: dict, out: Path) -> Path:
    """Thumbnail: the frame at the twist beat (or two thirds in)."""
    tw = next((s for s in plan["shots"] if s.get("twist")), None)
    f = (tw.get("beat") or tw["a"]) + 6 if tw else int(plan["frames"] * 0.66)
    f = min(f, plan["frames"] - 1)
    shutil.copy(frames_dir / f"f{f:04d}.jpg", out)
    return out


def make_short(story: dict, vcfg: dict, work: Path, seed: int, voice_file: Path | None = None) -> tuple[Path, Path, dict]:
    work.mkdir(parents=True, exist_ok=True)
    if voice_file:
        voice, timing = voice_from_file(story, voice_file)
    else:
        voice, timing = voice_lines(story, vcfg, work)
    total = max(len(voice) / ha.SR, timing[-1]["end"]) + TAIL
    plan = build_plan(story, timing, total, seed)
    (work / "plan.json").write_text(json.dumps(plan, indent=1), encoding="utf-8")
    log(f"Plan: {len(plan['shots'])} shots, {plan['frames']} frames ({total:.1f}s)")
    master = ha.make_soundtrack(voice, plan, work, seed)
    frames_dir = work / "frames"
    render(plan, work, frames_dir)
    video = encode(frames_dir, master, work.parent / "short.mp4")
    thumb = cover(frames_dir, plan, work.parent / "cover.jpg")
    return video, thumb, plan
