"""Voice the story, time every shot to the narration, render the cartoon frames and encode the video.

Works for both formats: vertical 9:16 Shorts and landscape 16:9 long videos.
"""
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

import numpy as np

from . import horror_audio as ha
from .horror_cast import cast_story
from .util import ROOT, log, run

FPS = 30
WEB = ROOT / "horror" / "web"
LEAD = 0.45          # silence before the first line
GAP = 0.32           # pause between lines
LONG_GAP = 0.75      # pause before a time jump or the twist
CHAPTER_GAP = 1.4    # pause between chapters of a long video
TAIL = 1.4           # picture after the last word (final hold + static)


def _norm(w: str) -> str:
    return re.sub(r"[^a-z0-9']", "", w.lower())


def _echo(path: Path) -> np.ndarray:
    """A faint creepy echo for villain lines (the words stay clear)."""
    out = path.with_name(path.stem + "_fx.wav")
    run(["ffmpeg", "-y", "-v", "error", "-i", str(path), "-af",
         "aecho=0.8:0.55:90|170:0.32|0.18,lowpass=f=7000", "-ar", str(ha.SR), "-ac", "1", str(out)])
    return ha.load(out)


def voice_for_speaker(beat: dict, voices: dict) -> dict:
    sp = beat.get("speaker") or "narrator"
    return voices.get(sp) or voices.get("narrator")


def voice_lines(story: dict, voices: dict, work: Path) -> tuple[np.ndarray, list[dict]]:
    """Speak each beat in its speaker's voice and join them with natural pauses."""
    from .voice import say

    parts, timing = [np.zeros(int(LEAD * ha.SR))], []
    t = LEAD
    beats = story["beats"]
    for i, b in enumerate(beats):
        mp3 = work / f"line{i:03d}.mp3"
        vcfg = voice_for_speaker(b, voices)
        dur, words = say(b["line"], vcfg, mp3)
        audio = _echo(mp3) if vcfg.get("echo") else ha.load(mp3)
        dur = len(audio) / ha.SR
        bw = b.get("beat_word")
        hit = next((w for w in words if bw and _norm(w["text"]) == _norm(bw)), None)
        if hit is None and bw:
            hit = next((w for w in words if _norm(bw) and _norm(bw) in _norm(w["text"])), None)
        tword = hit["start"] if hit else dur * 0.6
        timing.append({"start": t, "end": t + dur, "beat": t + min(tword, dur)})
        parts.append(audio)
        t += dur
        nxt = beats[i + 1] if i + 1 < len(beats) else None
        if nxt:
            gap = CHAPTER_GAP if nxt.get("chapter") else LONG_GAP if (nxt.get("jump") or nxt.get("twist")) else GAP
            if (nxt.get("speaker") or "narrator") != (b.get("speaker") or "narrator"):
                gap = max(gap, 0.4)
            parts.append(np.zeros(int(gap * ha.SR)))
            t += gap
        if i and i % 25 == 0:
            log(f"Voiced {i}/{len(beats)} lines")
    return np.concatenate(parts), timing


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
    for s in segs:
        if merged and (s[0] - merged[-1][1]) * 0.05 < 0.5: merged[-1][1] = s[1]
        else: merged.append(s)
    beats = story["beats"]
    while len(merged) > len(beats):
        gaps = [merged[i + 1][0] - merged[i][1] for i in range(len(merged) - 1)]
        k = int(np.argmin(gaps)); merged[k][1] = merged[k + 1][1]; del merged[k + 1]
    timing = []
    for b, (s0, s1) in zip(beats, merged):
        st, en = s0 * 0.05, s1 * 0.05
        words = b["line"].split()
        idx = next((i for i, x in enumerate(words) if _norm(x) == _norm(b.get("beat_word", ""))), int(len(words) * 0.6))
        timing.append({"start": st, "end": en, "beat": st + (en - st) * (idx + 0.3) / max(1, len(words))})
    return audio, timing


def build_plan(story: dict, timing: list[dict], total: float, casting: dict, fmt: str = "vertical") -> dict:
    frames = int(round(total * FPS))
    shots = []
    for i, (b, tm) in enumerate(zip(story["beats"], timing)):
        a = 0 if i == 0 else max(shots[-1]["a"] + 6, int(round(tm["start"] * FPS)) - 4)
        sh = {k: v for k, v in b.items() if k not in ("line", "beat_word")}
        sh["a"] = a
        sh["beat"] = int(round(tm["beat"] * FPS)) - 2 if b.get("react", "none") != "none" or b.get("twist") else None
        if sh["beat"] is not None:
            sh["beat"] = max(a + 3, sh["beat"])
        sp = b.get("speaker") or "narrator"
        sh["talk"] = "hero" if sp == "hero" else "other" if sp == "villain" else "side" if sp in casting["cast"] else None
        if sh["talk"] == "side" and not sh.get("side"):
            sh["side"] = sp
        sh["ls"], sh["le"] = int(tm["start"] * FPS), int(tm["end"] * FPS)
        shots.append(sh)
    for i, sh in enumerate(shots):
        sh["b"] = shots[i + 1]["a"] if i + 1 < len(shots) else frames
        if sh["beat"] is not None:
            sh["beat"] = min(sh["beat"], sh["b"] - 3)
    return {"frames": frames, "format": fmt, "hero": casting["hero"], "other": casting["other"],
            "cast": casting["cast"], "shots": shots}


def render(plan: dict, work: Path, frames_dir: Path, stills: list[int] | None = None) -> None:
    from playwright.sync_api import sync_playwright
    import base64

    web = work / "web"
    shutil.rmtree(web, ignore_errors=True)
    shutil.copytree(WEB, web)
    (web / "plan.js").write_text("window.PLAN = " + json.dumps(plan) + ";", encoding="utf-8")
    frames_dir.mkdir(parents=True, exist_ok=True)
    todo = stills if stills is not None else list(range(plan["frames"]))
    w, h = (1920, 1080) if plan.get("format") == "landscape" else (1080, 1920)
    with sync_playwright() as p:
        kw = {"args": ["--allow-file-access-from-files"]}
        if os.environ.get("CHROME_PATH"):
            kw["executable_path"] = os.environ["CHROME_PATH"]
        browser = p.chromium.launch(**kw)
        page = browser.new_page(viewport={"width": w, "height": h})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto((web / "index.html").resolve().as_uri())
        page.wait_for_function("window.ready === true")
        if errors:
            raise RuntimeError(f"Cartoon player failed to load: {errors[0]}")
        for n, f in enumerate(todo):
            data = page.evaluate("f => { renderFrame(f); return document.getElementById('c').toDataURL('image/jpeg', 0.92); }", f)
            (frames_dir / f"f{f:05d}.jpg").write_bytes(base64.b64decode(data.split(",", 1)[1]))
            if errors:
                raise RuntimeError(f"Cartoon player error at frame {f}: {errors[0]}")
            if n and n % 500 == 0:
                log(f"Rendered {n}/{len(todo)} frames")
        browser.close()


def encode(frames_dir: Path, audio: Path, out: Path) -> Path:
    run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", str(frames_dir / "f%05d.jpg"), "-i", str(audio),
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-shortest", "-movflags", "+faststart", str(out)])
    return out


def cover(frames_dir: Path, plan: dict, out: Path, title: str | None = None) -> Path:
    """Thumbnail: the frame at the twist (or two thirds in); long videos get the title in big letters."""
    from PIL import Image, ImageDraw, ImageFont

    tw = next((s for s in plan["shots"] if s.get("twist")), None)
    f = (tw.get("beat") or tw["a"]) + 6 if tw else int(plan["frames"] * 0.66)
    f = min(f, plan["frames"] - 1)
    img = Image.open(frames_dir / f"f{f:05d}.jpg").convert("RGB")
    if plan.get("format") == "landscape" and title:
        img = img.resize((1280, 720))
        d = ImageDraw.Draw(img)
        words = re.sub(r"#\w+", "", title).strip().upper().split()
        text = " ".join(words[:5])
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 92)
        except OSError:
            font = ImageFont.load_default()
        lines, cur = [], ""
        for w in text.split():
            t = (cur + " " + w).strip()
            if d.textlength(t, font=font) > 1180 and cur:
                lines.append(cur); cur = w
            else:
                cur = t
        lines.append(cur)
        y = 720 - 40 - len(lines) * 104
        for ln in lines[:2]:
            d.text((44, y), ln, font=font, fill="#fff2e0", stroke_width=10, stroke_fill="#140a1c")
            y += 104
    img.save(out, quality=92)
    return out


def make_video(story: dict, work: Path, seed: int, fmt: str = "vertical", voice_file: Path | None = None,
               title: str | None = None) -> tuple[Path, Path, dict]:
    work.mkdir(parents=True, exist_ok=True)
    casting = cast_story(story, seed)
    (work / "casting.json").write_text(json.dumps(casting, indent=1), encoding="utf-8")
    log("Cast: " + ", ".join(f"{k}={v['kokoro_voice']}" for k, v in casting["voices"].items() if k != "narrator"))
    if voice_file:
        voice, timing = voice_from_file(story, voice_file)
    else:
        voice, timing = voice_lines(story, casting["voices"], work)
    total = max(len(voice) / ha.SR, timing[-1]["end"]) + TAIL
    plan = build_plan(story, timing, total, casting, fmt)
    (work / "plan.json").write_text(json.dumps(plan, indent=1), encoding="utf-8")
    log(f"Plan: {len(plan['shots'])} shots, {plan['frames']} frames ({total:.1f}s, {fmt})")
    master = ha.make_soundtrack(voice, plan, work, seed)
    frames_dir = work / "frames"
    render(plan, work, frames_dir)
    video = encode(frames_dir, master, work.parent / ("short.mp4" if fmt == "vertical" else "video.mp4"))
    thumb = cover(frames_dir, plan, work.parent / "cover.jpg", title)
    shutil.rmtree(frames_dir, ignore_errors=True)
    return video, thumb, plan


def make_short(story: dict, vcfg: dict, work: Path, seed: int, voice_file: Path | None = None):
    """Kept for run_horror.py: one vertical Short (vcfg is no longer used; every story is cast fresh)."""
    return make_video(story, work, seed, "vertical", voice_file)
