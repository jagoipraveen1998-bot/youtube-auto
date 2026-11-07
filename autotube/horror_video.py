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


def caption_words(line: str, words: list, dur: float) -> list:
    """[[start_s, end_s, WORD, highlighted]] relative to the line, for word-by-word captions."""
    hl = {_norm(w) for chunk in re.findall(r"\*(.+?)\*", line) for w in chunk.split()}
    shown = [w for w in re.sub(r"\[[a-z\-]+\]", " ", line.replace("*", "")).split() if re.search(r"[A-Za-z0-9]", w)]
    spoken = [w for w in (words or []) if w.get("start") is not None and re.search(r"[A-Za-z0-9]", w.get("text", ""))]
    out = []
    if len(spoken) >= len(shown) * 0.8 and spoken:
        j = 0
        for w in shown:                                   # follow the spoken timings in order
            while j < len(spoken) - 1 and _norm(spoken[j]["text"]) not in _norm(w) and _norm(w) not in _norm(spoken[j]["text"]):
                j += 1
            sw = spoken[min(j, len(spoken) - 1)]
            out.append([float(sw["start"]), float(sw.get("end") or sw["start"] + 0.3), w.strip(), _norm(w) in hl])
            j += 1
    else:                                                 # no timings: spread the words over the line
        n = max(1, len(shown))
        out = [[dur * i / n, dur * (i + 1) / n, w, _norm(w) in hl] for i, w in enumerate(shown)]
    return out


def mouth_env(audio: np.ndarray) -> list[float]:
    """How open the speaker's mouth is on each video frame, from the loudness of the line (lip sync)."""
    hop = ha.SR // FPS
    n = max(1, int(np.ceil(len(audio) / hop)))
    pad = np.pad(audio, (0, n * hop - len(audio)))
    rms = np.sqrt((pad.reshape(n, hop) ** 2).mean(1))
    ref = np.percentile(rms[rms > 0], 92) if (rms > 0).any() else 1.0
    v = np.clip(rms / max(ref, 1e-6), 0, 1.15)
    v = np.where(v < 0.12, 0, v)
    out, prev = [], 0.0
    for x in v:                                 # open fast, close a little slower: reads as natural speech
        prev = x if x > prev else prev * 0.55 + x * 0.45
        out.append(round(float(prev), 2))
    return out


def _phone(audio: np.ndarray, stem: Path) -> np.ndarray:
    """A voice heard through a phone: narrow band, a little crunch, slightly quieter."""
    src, out = stem.with_name(stem.name + "_raw.wav"), stem.with_name(stem.name + "_phone.wav")
    ha.save(src, audio)
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af",
         "highpass=f=320,lowpass=f=3300,acompressor=threshold=0.1:ratio=4,volume=0.9", "-ar", str(ha.SR), "-ac", "1", str(out)])
    return ha.load(out)


def _muffle(audio: np.ndarray, stem: Path) -> np.ndarray:
    src, out = stem.with_name(stem.name + "_rawm.wav"), stem.with_name(stem.name + "_muff.wav")
    ha.save(src, audio)
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", "lowpass=f=750,aecho=0.6:0.4:18:0.25,volume=0.8",
         "-ar", str(ha.SR), "-ac", "1", str(out)])
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
        if b.get("silent"):                       # an action beat with no words (a photo, a knock, a door)
            dur = float(b["silent"])
            audio = np.zeros(int(dur * ha.SR))
            tword = dur * float(b.get("beat_at", 0.5))
        else:
            mp3 = work / f"line{i:03d}.mp3"
            vcfg = dict(voice_for_speaker(b, voices))
            if b.get("vspeed"):
                vcfg["speed"] = vcfg.get("speed", 1.0) * float(b["vspeed"])
            text = b["line"].replace("*", "")            # *key words* are highlighted in captions, not spoken
            dur, words = say(text, vcfg, mp3)
            audio = _echo(mp3) if vcfg.get("echo") else ha.load(mp3)
            if b.get("layer"):                    # a second, lower take under the first (the laugh grows)
                lay = dict(vcfg, **{k: v for k, v in b["layer"].items() if k != "gain"})
                mp2 = work / f"line{i:03d}_layer.mp3"
                say(b["line"], lay, mp2)
                a2 = _echo(mp2) if lay.get("echo") else ha.load(mp2)
                n2 = max(len(audio), len(a2) + int(0.12 * ha.SR))
                mix = np.zeros(n2); mix[:len(audio)] += audio
                mix[int(0.12 * ha.SR):int(0.12 * ha.SR) + len(a2)] += a2 * float(b["layer"].get("gain", 0.6))
                audio = mix / max(1.0, np.abs(mix).max() / 0.98)
            if b.get("phone"):
                audio = _phone(audio, work / f"line{i:03d}")
            if b.get("muffle"):                   # heard through a closed door
                audio = _muffle(audio, work / f"line{i:03d}")
            if b.get("gain"):
                audio = audio * float(b["gain"])
            dur = len(audio) / ha.SR
            bw = b.get("beat_word")
            hit = next((w for w in words if bw and _norm(w["text"]) == _norm(bw)), None)
            if hit is None and bw:
                hit = next((w for w in words if _norm(bw) and _norm(bw) in _norm(w["text"])), None)
            tword = hit["start"] if hit else dur * float(b.get("beat_at", 0.6))
        caps = None if b.get("silent") else caption_words(b["line"], words, dur)
        timing.append({"start": t, "end": t + dur, "beat": t + min(tword, dur), "env": None if b.get("silent") else mouth_env(audio),
                       "caps": caps})
        parts.append(audio)
        t += dur
        nxt = beats[i + 1] if i + 1 < len(beats) else None
        if nxt:
            gap = CHAPTER_GAP if nxt.get("chapter") else LONG_GAP if (nxt.get("jump") or nxt.get("twist")) else GAP
            if b.get("silent") or nxt.get("silent"):
                gap = 0.12                        # action beats already carry their own timing
            if "gap" in b:
                gap = float(b["gap"])
            if (nxt.get("speaker") or "narrator") != (b.get("speaker") or "narrator"):
                gap = max(gap, 0.4)
            if nxt.get("react") == "gag":
                gap += 0.25          # comic timing: a beat before the punchline
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


def build_plan(story: dict, timing: list[dict], total: float, casting: dict, fmt: str = "vertical",
               intro_f: int = 0) -> dict:
    frames = int(round(total * FPS))
    shots = []
    for i, (b, tm) in enumerate(zip(story["beats"], timing)):
        a = intro_f if i == 0 else max(shots[-1]["a"] + 6, int(round(tm["start"] * FPS)) - 4)
        sh = {k: v for k, v in b.items() if k not in ("line", "beat_word")}
        sh["a"] = a
        sh["beat"] = int(round(tm["beat"] * FPS)) - 2 if b.get("react", "none") != "none" or b.get("twist") else None
        if sh["beat"] is not None:
            sh["beat"] = max(a + 3, sh["beat"])
        sp = b.get("speaker") or "narrator"
        sh["talk"] = "hero" if sp == "hero" else "other" if sp == "villain" else "side" if sp in casting["cast"] else None
        if sh["talk"] == "side" and not sh.get("side"):
            sh["side"] = sp
        sh["ls"], sh["le"] = int(round(tm["start"] * FPS)), int(round(tm["end"] * FPS))
        if tm.get("env"):
            sh["env"] = tm["env"]
        if tm.get("caps"):
            sh["caps"] = [[sh["ls"] + int(round(a * FPS)), sh["ls"] + int(round(b * FPS)), w, h] for a, b, w, h in tm["caps"]]
        shots.append(sh)
    for i, sh in enumerate(shots):
        sh["b"] = shots[i + 1]["a"] if i + 1 < len(shots) else frames
        if sh["beat"] is not None:
            sh["beat"] = min(sh["beat"], sh["b"] - 3)
    return {"frames": frames, "format": fmt, "hero": casting["hero"], "other": casting["other"],
            "cast": casting["cast"], "shots": shots, "series": story.get("series"), "captions": bool(story.get("captions")),
            "music": story.get("music"), "scary": bool(story.get("scary"))}


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
    if plan.get("cover_frame"):
        f = plan["cover_frame"]
    title = plan.get("cover_text") or title
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


LAUGH_TEXT = "Heh heh heh... Ha ha ha ha haaa!"
LAUGH_VOICE = {"engine": "kokoro", "kokoro_lang": "b", "kokoro_voice": "bm_george", "speed": 0.8, "semitones": -3.0,
               "omni": "male, middle-aged, very low pitch", "omni_key": "signature-laugh", "omni_text": "Heh heh heh... [laughter]",
               "omni_speed": 0.9,
               "name": "en-GB-RyanNeural", "rate": "-20%", "pitch": "-12Hz"}


def signature_laugh(work: Path) -> np.ndarray:
    """The channel's signature: the same deep, echoing evil laugh at the end of every video."""
    try:
        from .voice import say
        mp3 = work / "laugh.mp3"
        say(LAUGH_TEXT, LAUGH_VOICE, mp3)
        out = work / "laugh_fx.wav"
        run(["ffmpeg", "-y", "-v", "error", "-i", str(mp3), "-af",
             "aecho=0.8:0.72:110|240|400:0.5|0.32|0.2,lowpass=f=6500,volume=1.15", "-ar", str(ha.SR), "-ac", "1", str(out)])
        return ha.load(out)
    except Exception as exc:
        log(f"Signature laugh skipped: {exc}")
        return np.zeros(int(0.5 * ha.SR))


def make_video(story: dict, work: Path, seed: int, fmt: str = "vertical", voice_file: Path | None = None,
               title: str | None = None) -> tuple[Path, Path, dict]:
    work.mkdir(parents=True, exist_ok=True)
    casting = cast_story(story, seed, funny=(fmt == "vertical"))
    (work / "casting.json").write_text(json.dumps(casting, indent=1), encoding="utf-8")
    log("Cast: " + ", ".join(f"{k}={v['kokoro_voice']}" for k, v in casting["voices"].items() if k != "narrator"))
    if voice_file:
        voice, timing = voice_from_file(story, voice_file)
    else:
        voice, timing = voice_lines(story, casting["voices"], work)
    # brand: a short logo sting before the story, the signature laugh after it
    intro = 0.8 if fmt == "vertical" else 2.0
    outro = 3.2
    laugh = np.zeros(1) if voice_file else signature_laugh(work)
    story_end = intro + max(len(voice) / ha.SR, timing[-1]["end"]) + TAIL
    total = story_end + max(outro, len(laugh) / ha.SR + 0.6)
    timing = [{k: (v + intro if isinstance(v, (int, float)) else v) for k, v in tm.items()} for tm in timing]
    full = np.zeros(int(total * ha.SR) + ha.SR)
    full[int(intro * ha.SR):int(intro * ha.SR) + len(voice)] = voice
    i0 = int((story_end + 0.35) * ha.SR)
    full[i0:i0 + len(laugh)] += laugh[: len(full) - i0]
    voice = full[: int(total * ha.SR)]
    plan = build_plan(story, timing, story_end, casting, fmt, intro_f=int(round(intro * FPS)))
    plan["intro"] = int(round(intro * FPS))
    if story.get("cover_beat") is not None:      # a storyboard can pick its thumbnail shot
        cs = plan["shots"][story["cover_beat"]]
        plan["cover_frame"] = cs["b"] - 6
    if story.get("cover_text"):
        plan["cover_text"] = story["cover_text"]
    plan["outro"] = int(round(total * FPS)) - plan["frames"]
    plan["frames"] = int(round(total * FPS))
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
