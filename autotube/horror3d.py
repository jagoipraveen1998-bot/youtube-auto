"""3D Shorts (cartoon-short-kit): the storyteller's take is cut into lines, a 3D shot is timed to every line,
headless Chromium renders the frames (three.js, software GL), and captions + sound are added here.

A story is made in 3D when its script says  "three_d": "<folder in horror3d/stories>".  If anything fails,
run_horror.py makes the Short in the usual drawn style instead, so an upload is never lost."""
from __future__ import annotations

import importlib.util
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np

from . import horror_audio as ha
from .util import ROOT, log

FPS = 30
KIT = ROOT / "horror3d"
TAIL = 1.6          # seconds held on the last shot after the final word


def line_frames(timing: list[dict]) -> tuple[list[dict], int]:
    """Each line owns the frames from its first word to the next line's first word (the last one also gets the tail)."""
    starts = [int(round(t["start"] * FPS)) for t in timing]
    starts[0] = 0
    total = int(round((timing[-1]["end"] + TAIL) * FPS))
    out = []
    for i, t in enumerate(timing):
        a = starts[i]
        b = (starts[i + 1] if i + 1 < len(timing) else total) - 1
        out.append({"a": a, "b": max(a + 1, b), "beat": min(max(a + 2, int(round(t["beat"] * FPS))), max(a + 2, b - 2))})
    return out, total


def _captions(frames_dir: Path, lines: list[str], shots: list[dict], total: int):
    """Yield every frame as JPEG bytes with the word-by-word caption burned in."""
    from io import BytesIO
    from PIL import Image, ImageDraw, ImageFont
    fonts = ["/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
             "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]
    font = ImageFont.truetype(next(f for f in fonts if Path(f).exists()), 64)
    for f in range(total):
        im = Image.open(frames_dir / f"f{f:05d}.jpg").convert("RGB")
        k = next((i for i, s in enumerate(shots) if s["a"] <= f <= s["b"]), None)
        if k is not None:
            d = ImageDraw.Draw(im)
            words = lines[k].split()
            said = shots[k].get("said", shots[k]["b"])                      # frame where the line's last word ends
            shown = min(len(words), int((f - shots[k]["a"]) / max(1, said - shots[k]["a"]) * len(words)) + 1)
            rows, cur = [], ""
            for w in words:
                t = (cur + " " + w).strip()
                if d.textlength(t, font=font) > 920 and cur:
                    rows.append(cur); cur = w
                else:
                    cur = t
            rows.append(cur)
            y, n = 1500 - (len(rows) - 1) * 42, 0
            for row in rows:
                x = 540 - d.textlength(row, font=font) / 2
                for w in row.split():
                    if n < shown:
                        d.text((x, y), w, font=font, fill=(255, 225, 74) if n == shown - 1 else (255, 255, 255),
                               stroke_width=9, stroke_fill=(20, 12, 28))
                    x += d.textlength(w + " ", font=font); n += 1
                y += 84
        buf = BytesIO(); im.save(buf, "JPEG", quality=93)
        yield f, im, buf.getvalue()


def make_short(story: dict, take: Path, work: Path) -> tuple[Path, Path, dict]:
    from . import horror_video as hv
    name = story["three_d"]
    src = KIT / "stories" / name
    if not (src / "story.js").exists():
        raise FileNotFoundError(f"no 3D set for '{name}' in horror3d/stories")
    voice, timing = hv.voice_from_take(story, take)
    shots, total = line_frames(timing)
    for s, t in zip(shots, timing):
        s["said"] = int(round(t["end"] * FPS))
    need = int((src / "LINES").read_text().strip()) if (src / "LINES").exists() else len(shots)
    if len(shots) != need:
        raise ValueError(f"the 3D set '{name}' was built for {need} lines but the script has {len(shots)}")
    web = work / "web3d"
    shutil.rmtree(web, ignore_errors=True)
    shutil.copytree(KIT / "web", web)
    shutil.copy(src / "story.js", web / "story.js")
    (web / "timing.js").write_text(f"export const TIMING = {json.dumps(shots)};\nexport const TOTAL = {total};\n", encoding="utf-8")
    log(f"3D Short '{name}': {len(shots)} shots, {total} frames ({total / FPS:.1f}s)")

    frames = work / "frames3d"
    shutil.rmtree(frames, ignore_errors=True)
    n = max(1, int(os.environ.get("RENDER_WORKERS") or (os.cpu_count() or 2)))
    procs = [subprocess.Popen([sys.executable, str(KIT / "render_worker.py"), str(web), str(frames), str(total), str(n), str(k)])
             for k in range(n)]
    codes = [p.wait() for p in procs]
    missing = [f for f in range(total) if not (frames / f"f{f:05d}.jpg").exists()]
    if any(codes) or missing:
        raise RuntimeError(f"3D render failed (worker exit codes {codes}, {len(missing)} frames missing)")

    # sound: the voice on top of the set's own room tone, knocks, creaks and music
    spec = importlib.util.spec_from_file_location("sound3d", src / "sound.py")
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    n_s = int(total / FPS * ha.SR)
    bed = mod.build(shots, total, FPS, ha.SR)[:n_s]
    tw_i = next((i for i, b in enumerate(story["beats"]) if b.get("twist")), None)
    music = score([dict(s, twist=(i == tw_i)) for i, s in enumerate(shots)], total, ha.SR)[:n_s]
    bed = bed + music * 0.22                     # the music bed sits under every Short, never alone in silence
    v = np.zeros(n_s); v[:min(n_s, len(voice))] = voice[:n_s]
    env = np.convolve(np.abs(v), np.ones(2400) / 2400, "same"); duck = 1 - 0.5 * np.clip(env / max(1e-6, env.max()) * 5, 0, 1)
    mix = v / max(1e-6, np.abs(v).max()) * 0.9 + bed * duck
    mix /= max(1.0, np.abs(mix).max() / 0.97)
    wav = work / "mix3d.wav"
    ha.save(wav, mix)

    out_dir = work.parent
    video, thumb = out_dir / "short.mp4", out_dir / "cover.jpg"
    lines = [b["line"].replace("*", "") for b in story["beats"]]
    tw = next((i for i, b in enumerate(story["beats"]) if b.get("twist")), len(shots) - 2)
    cover_f = min(total - 1, shots[tw]["beat"] + 14)
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-", "-i", str(wav),
                           "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                           "-ac", "2", "-shortest", "-movflags", "+faststart", str(video)], stdin=subprocess.PIPE)
    for f, im, data in _captions(frames, lines, shots, total):
        ff.stdin.write(data)
        if f == cover_f:
            Image_open = __import__("PIL.Image", fromlist=["open"]).open
            Image_open(frames / f"f{f:05d}.jpg").save(thumb, quality=92)      # the thumbnail carries no caption
    ff.stdin.close()
    if ff.wait() != 0 or not video.exists():
        raise RuntimeError("ffmpeg could not encode the 3D Short")
    shutil.rmtree(frames, ignore_errors=True)
    plan = {"frames": total, "three_d": name,
            "shots": [{"a": s["a"], "b": s["b"], "ls": s["a"], "le": s["said"], "scene": "3d"} for s in shots]}
    (work / "plan.json").write_text(json.dumps(plan, indent=1), encoding="utf-8")
    log(f"3D Short ready: {video.name} ({total / FPS:.1f}s)")
    return video, thumb, plan

def score(shots: list[dict], total: int, sr: int, seed: int = 7) -> np.ndarray:
    """An original horror music bed for the whole Short: a low string pad that moves with the story, a slow
    music-box piano, a heartbeat pulse that grows towards the twist, and a hit on the twist itself."""
    from scipy.signal import lfilter
    rng = np.random.default_rng(seed)
    n = int(total / FPS * sr); t = np.arange(n) / sr
    lp = lambda x, fc: (lambda a: lfilter([1 - a], [1, -a], lfilter([1 - a], [1, -a], x)))(np.exp(-2 * np.pi * fc / sr))
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    out = np.zeros(n)
    twist = next((s for s in shots if s.get("twist")), shots[max(0, len(shots) - 3)])
    tw = twist["beat"] / FPS
    # string pad: a minor progression, one chord per ~4 s, darker after the twist
    prog = [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 58], [40, 47, 52, 56]]
    seg = 4.0
    for k in range(int(n / sr / seg) + 1):
        a, b = int(k * seg * sr), min(n, int((k + 1.15) * seg * sr))
        if a >= n: break
        tt = np.arange(b - a) / sr
        chord = prog[k % 4] if k * seg < tw else [m - 1 for m in prog[k % 4]]
        x = sum(lp(2 * ((hz(m) * (1 + d) * tt) % 1) - 1, 900) for m in chord for d in (-0.003, 0.003)) / (2 * len(chord))
        e = np.minimum(1, tt / 0.8) * np.minimum(1, (tt[-1] - tt + 1e-3) / 0.8)
        out[a:b] += x * e * 0.5
    # music-box piano, sparse, until the twist
    mel = [76, 74, 72, 71, 72, 69, 71, 67]
    for i, at in enumerate(np.arange(0.8, tw - 0.5, 1.6)):
        f0 = hz(mel[i % len(mel)]); tt = np.arange(int(1.5 * sr)) / sr
        note = (np.sin(2 * np.pi * f0 * tt) + 0.3 * np.sin(2 * np.pi * f0 * 2.01 * tt)) * np.exp(-tt * 2.6) * 0.32
        a = int(at * sr); m = min(len(note), n - a)
        if m > 0: out[a:a + m] += note[:m]
    # heartbeat pulse that speeds up and grows towards the twist
    at = max(1.0, tw - 12)
    while at < tw:
        k = 1 - (tw - at) / 12
        for off, g in ((0, 1.0), (0.18, 0.7)):
            tt = np.arange(int(0.25 * sr)) / sr; th = np.sin(2 * np.pi * 52 * tt) * np.exp(-tt * 22) * g * (0.3 + 0.7 * k)
            a = int((at + off) * sr); m = min(len(th), n - a)
            if m > 0: out[a:a + m] += th[:m] * 0.9
        at += 1.0 - 0.45 * k
    # the hit on the twist, then a low drone to the end
    tt = np.arange(int(3.5 * sr)) / sr
    hit = (np.sin(2 * np.pi * (36 + 30 * np.exp(-tt * 6)) * tt) * np.exp(-tt * 1.4) * 1.3
           + lp(rng.standard_normal(len(tt)), 3000) * np.exp(-tt * 4) * 0.4
           + sum(np.sin(2 * np.pi * hz(m) * tt) for m in (51, 57, 63)) * np.exp(-tt * 0.8) * 0.12)
    a = int(max(0, tw - 0.08) * sr); m = min(len(hit), n - a)
    if m > 0: out[a:a + m] += hit[:m]
    out += lp(np.sin(2 * np.pi * 41.2 * t) + 0.5 * np.sin(2 * np.pi * 61.7 * t), 200) * np.clip((t - tw) / 2, 0, 1) * 0.35
    return out / max(1e-6, np.percentile(np.abs(out), 99.7))

