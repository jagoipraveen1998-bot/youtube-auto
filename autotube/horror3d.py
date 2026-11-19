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


def line_frames(timing: list[dict], tail: float = TAIL) -> tuple[list[dict], int]:
    """Each line owns the frames from its first word to the next line's first word (the last one also gets the tail)."""
    starts = [int(round(t["start"] * FPS)) for t in timing]
    starts[0] = 0
    total = int(round((timing[-1]["end"] + tail) * FPS))
    out = []
    for i, t in enumerate(timing):
        a = starts[i]
        b = (starts[i + 1] if i + 1 < len(timing) else total) - 1
        out.append({"a": a, "b": max(a + 1, b), "beat": min(max(a + 2, int(round(t["beat"] * FPS))), max(a + 2, b - 2))})
    return out, total


def _captions(frames_dir: Path, lines: list[str], shots: list[dict], total: int, cta: str = ""):
    """Yield every frame as JPEG bytes with the word-by-word caption burned in."""
    from io import BytesIO
    from PIL import Image, ImageDraw, ImageFont
    fonts = ["/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
             "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]
    font = ImageFont.truetype(next(f for f in fonts if Path(f).exists()), 64)
    for f in range(total):
        im = Image.open(frames_dir / f"f{f:05d}.jpg").convert("RGB")
        cx, wrap = im.width / 2, min(920, im.width * 0.7)
        base = 1500 if im.height > im.width else im.height - 190            # captions low on a horizontal frame
        k = next((i for i, s in enumerate(shots) if s["a"] <= f <= s["b"]), None)
        last = shots[-1]
        if cta and f > last.get("said", last["b"]) + int(0.5 * FPS):          # the end line: "Tag a friend who..."
            d = ImageDraw.Draw(im, "RGBA")
            rows, cur = [], ""
            for w in cta.split():
                t = (cur + " " + w).strip()
                if d.textlength(t, font=font) > wrap - 60 and cur:
                    rows.append(cur); cur = w
                else:
                    cur = t
            rows.append(cur)
            y0 = base - (len(rows) - 1) * 42
            wmax = max(d.textlength(r, font=font) for r in rows)
            d.rounded_rectangle((cx - wmax / 2 - 44, y0 - 26, cx + wmax / 2 + 44, y0 + len(rows) * 84 + 14), 34, fill=(20, 12, 28, 215))
            for i, row in enumerate(rows):
                d.text((cx - d.textlength(row, font=font) / 2, y0 + i * 84), row, font=font, fill=(255, 225, 74), stroke_width=4, stroke_fill=(20, 12, 28))
        elif k is not None:
            d = ImageDraw.Draw(im)
            words = lines[k].split()
            said = shots[k].get("said", shots[k]["b"])                      # frame where the line's last word ends
            shown = min(len(words), int((f - shots[k]["a"]) / max(1, said - shots[k]["a"]) * len(words)) + 1)
            rows, cur = [], ""
            for w in words:
                t = (cur + " " + w).strip()
                if d.textlength(t, font=font) > wrap and cur:
                    rows.append(cur); cur = w
                else:
                    cur = t
            rows.append(cur)
            y, n = base - (len(rows) - 1) * 42, 0
            for row in rows:
                x = cx - d.textlength(row, font=font) / 2
                for w in row.split():
                    if n < shown:
                        d.text((x, y), w, font=font, fill=(255, 225, 74) if n == shown - 1 else (255, 255, 255),
                               stroke_width=9, stroke_fill=(20, 12, 28))
                    x += d.textlength(w + " ", font=font); n += 1
                y += 84
        buf = BytesIO(); im.save(buf, "JPEG", quality=93)
        yield f, im, buf.getvalue()


def render_frames(web: Path, frames: Path, total: int, machines: int = 1, k: int = 0) -> None:
    """Render this machine's share of the frames (every machines-th frame from k), split over all its CPU cores."""
    mine = [f for f in range(total) if f % machines == k]
    n = max(1, min(len(mine), int(os.environ.get("RENDER_WORKERS") or (os.cpu_count() or 2))))
    procs = [subprocess.Popen([sys.executable, str(KIT / "render_worker.py"), str(web), str(frames), str(total), "1", "0",
                               ",".join(map(str, mine[j::n]))]) for j in range(n)]
    codes = [p.wait() for p in procs]
    missing = [f for f in mine if not (frames / f"f{f:05d}.jpg").exists()]
    if any(codes) or missing:
        raise RuntimeError(f"3D render failed (worker exit codes {codes}, {len(missing)} frames missing)")


def make_short(story: dict, take: Path | None, work: Path, stage: str = "all"):
    """stage "all": everything on this machine.  "prepare": set up web3d + state3d.json and stop (the frames are
    rendered on several machines by the workflow).  "finish": frames are already in work/frames3d: sound, captions, encode."""
    from . import horror_video as hv
    name = story["three_d"]
    src = KIT / "stories" / name
    if not (src / "story.js").exists():
        raise FileNotFoundError(f"no 3D set for '{name}' in horror3d/stories")
    web, frames, state = work / "web3d", work / "frames3d", work / "state3d.json"
    if stage == "finish":
        st = json.loads(state.read_text(encoding="utf-8"))
        shots, total = st["shots"], st["total"]
        voice = np.load(work / "voice3d.npy")
        missing = [f for f in range(total) if not (frames / f"f{f:05d}.jpg").exists()]
        if missing:
            raise RuntimeError(f"3D render incomplete: {len(missing)} of {total} frames missing")
        return _finish(story, work, src, name, shots, total, voice, frames)
    if story.get("speed") and take:              # a faster read (e.g. 1.1x): same pitch, the whole film follows the voice
        fast = work / "take_fast.wav"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(take), "-filter:a", f"atempo={float(story['speed'])}", str(fast)], check=True)
        log(f"Voice sped up {story['speed']}x")
        take = fast
    voice, timing = hv.voice_from_take(story, take)
    shots, total = line_frames(timing, 3.4 if story.get("cta") else TAIL)       # hold longer when an end line is shown
    for s, t in zip(shots, timing):
        s["said"] = int(round(t["end"] * FPS))
    need = int((src / "LINES").read_text().strip()) if (src / "LINES").exists() else len(shots)
    if len(shots) != need:
        raise ValueError(f"the 3D set '{name}' was built for {need} lines but the script has {len(shots)}")
    shutil.rmtree(web, ignore_errors=True)
    shutil.copytree(KIT / "web", web)
    shutil.copy(src / "story.js", web / "story.js")
    (web / "timing.js").write_text(f"export const TIMING = {json.dumps(shots)};\nexport const TOTAL = {total};\n", encoding="utf-8")
    log(f"3D Short '{name}': {len(shots)} shots, {total} frames ({total / FPS:.1f}s)")
    shutil.rmtree(frames, ignore_errors=True)
    if stage == "prepare":
        state.write_text(json.dumps({"name": name, "shots": shots, "total": total}), encoding="utf-8")
        np.save(work / "voice3d.npy", np.asarray(voice, dtype=np.float64))
        return total
    render_frames(web, frames, total)
    return _finish(story, work, src, name, shots, total, voice, frames)


def _finish(story, work, src, name, shots, total, voice, frames):
    # sound: the voice on top of the set's own room tone, knocks, creaks and music
    spec = importlib.util.spec_from_file_location("sound3d", src / "sound.py")
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    n_s = int(total / FPS * ha.SR)
    bed = mod.build(shots, total, FPS, ha.SR)[:n_s]
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
    if story.get("cover_line") is not None:      # a chosen moment for the thumbnail (line index, frames after its beat)
        cover_f = min(total - 1, shots[int(story["cover_line"])]["beat"] + int(story.get("cover_offset", 0)))
    if story.get("parts"):                       # a series episode cut into vertical Shorts: Part 1, Part 2, ...
        return _finish_parts(story, work, name, shots, total, frames, lines, mix, bed, out_dir)
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-", "-i", str(wav),
                           "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                           "-ac", "2", "-shortest", "-movflags", "+faststart", str(video)], stdin=subprocess.PIPE)
    for f, im, data in _captions(frames, lines, shots, total, cta=story.get("cta") or ""):
        ff.stdin.write(data)
        if f == cover_f:
            Image_open = __import__("PIL.Image", fromlist=["open"]).open
            Image_open(frames / f"f{f:05d}.jpg").save(thumb, quality=92)      # the thumbnail carries no caption
            if story.get("cover_text"):
                _text_cover(thumb, story["cover_text"])
    ff.stdin.close()
    if ff.wait() != 0 or not video.exists():
        raise RuntimeError("ffmpeg could not encode the 3D Short")
    shutil.rmtree(frames, ignore_errors=True)
    plan = {"frames": total, "three_d": name,
            "shots": [{"a": s["a"], "b": s["b"], "ls": s["a"], "le": s["said"], "scene": "3d"} for s in shots]}
    (work / "plan.json").write_text(json.dumps(plan, indent=1), encoding="utf-8")
    log(f"3D Short ready: {video.name} ({total / FPS:.1f}s)")
    return video, thumb, plan


def _font(size: int):
    from PIL import ImageFont
    fonts = ["/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
             "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]
    return ImageFont.truetype(next(f for f in fonts if Path(f).exists()), size)


def _badge(im, series: str, k: int, n: int):
    """The part badge at the top of every frame: series name small, PART k/n big, so any frame works as the cover."""
    from PIL import ImageDraw
    d = ImageDraw.Draw(im, "RGBA")
    f1, f2 = _font(40), _font(78)
    t1, t2 = series.upper(), f"PART {k} OF {n}"
    w = max(d.textlength(t1, font=f1), d.textlength(t2, font=f2)) + 80
    cx, y = im.width / 2, 200
    d.rounded_rectangle((cx - w / 2, y, cx + w / 2, y + 150), 30, fill=(12, 8, 20, 200))
    d.text((cx - d.textlength(t1, font=f1) / 2, y + 16), t1, font=f1, fill=(225, 230, 255))
    d.text((cx - d.textlength(t2, font=f2) / 2, y + 56), t2, font=f2, fill=(255, 225, 74), stroke_width=3, stroke_fill=(12, 8, 20))


def _end_card(im, rows: list[str]):
    from PIL import ImageDraw
    d = ImageDraw.Draw(im, "RGBA")
    f = _font(66)
    cx, y0 = im.width / 2, 1380
    w = max(d.textlength(r, font=f) for r in rows) + 100
    d.rounded_rectangle((cx - w / 2, y0 - 30, cx + w / 2, y0 + len(rows) * 92 + 10), 36, fill=(12, 8, 20, 225))
    for i, r in enumerate(rows):
        d.text((cx - d.textlength(r, font=f) / 2, y0 + i * 92), r, font=f, fill=(255, 225, 74) if i == 0 else (255, 255, 255),
               stroke_width=4, stroke_fill=(12, 8, 20))


def _text_cover(path: Path, rows: list[str]):
    """Thumbnail words: up to three short rows, huge and outlined, high in the frame so the face and the danger stay
    clear below. Row 1 white, the rest yellow; a row starting with ! is red. Readable at phone-grid size."""
    from PIL import Image, ImageDraw, ImageEnhance
    im = ImageEnhance.Contrast(Image.open(path).convert("RGB")).enhance(1.12)
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle((0, 0, im.width, int(im.height * 0.36)), fill=(0, 0, 0, 70))
    y = int(im.height * 0.06)
    for i, r in enumerate(rows):
        col = (255, 60, 50) if r.startswith("!") else (255, 255, 255) if i == 0 else (255, 225, 74)
        r = r.lstrip("!")
        size = 200
        while size > 60 and d.textlength(r, font=_font(size)) > im.width * 0.92:
            size -= 6
        f = _font(size)
        d.text((im.width / 2 - d.textlength(r, font=f) / 2, y), r, font=f, fill=col, stroke_width=max(8, size // 14), stroke_fill=(10, 6, 16))
        y += int(size * 1.08)
    im.save(path, quality=92)


def _cover(frame_path: Path, out: Path, series: str, k: int, n: int):
    """Thumbnail: a strong frame, PART k huge in the middle, the series name under it. Readable at phone-grid size."""
    from PIL import Image, ImageDraw, ImageEnhance
    im = ImageEnhance.Brightness(Image.open(frame_path).convert("RGB")).enhance(0.8)
    d = ImageDraw.Draw(im, "RGBA")
    d.rectangle((0, 0, im.width, im.height), fill=(0, 0, 0, 60))
    big, mid = _font(250), _font(92)
    t = f"PART {k}"
    d.text((im.width / 2 - d.textlength(t, font=big) / 2, 640), t, font=big, fill=(255, 225, 74), stroke_width=14, stroke_fill=(10, 6, 16))
    words = series.upper().split()
    rows = [" ".join(words[:2]), " ".join(words[2:])] if len(words) > 2 else [series.upper()]
    for i, r in enumerate(rows):
        d.text((im.width / 2 - d.textlength(r, font=mid) / 2, 960 + i * 110), r, font=mid, fill=(255, 255, 255), stroke_width=8, stroke_fill=(10, 6, 16))
    d.text((im.width / 2 - d.textlength(f"{k} / {n}", font=mid) / 2, 1250), f"{k} / {n}", font=mid, fill=(255, 225, 74), stroke_width=8, stroke_fill=(10, 6, 16))
    im.save(out, quality=92)


def _finish_parts(story, work, name, shots, total, frames, lines, mix, bed, out_dir):
    """Cut the finished episode into Shorts at the cliffhangers given in story["parts"] ([first line, last line] each).
    Every part has the PART k OF n badge, ends on its cliffhanger held about 2.5 s with "PART k+1 IS NEXT"
    (the last part ends on the story's end line), and gets its own cover: partK.mp4 and partK.jpg."""
    from io import BytesIO
    from PIL import Image
    parts, n, series = story["parts"], len(story["parts"]), story.get("series", "")
    hold = int(2.5 * FPS)
    caps = _captions(frames, lines, shots, total, cta=story.get("cta") or "")
    cache = {}
    def frame(f):                                   # captioned frame f (the generator runs forward once)
        while f not in cache:
            g, im, _ = next(caps)
            cache[g] = im
        return cache.pop(f)
    covers = story.get("part_covers") or [p[1] for p in parts]
    videos = []
    for k, (l0, l1) in enumerate(parts, 1):
        a = shots[l0]["a"]
        said = shots[l1].get("said", shots[l1]["b"])
        last = k == n
        b = total - 1 if last else min(shots[l1]["b"], said + hold)
        extra = 0 if last else max(0, said + hold - b)          # freeze the last frame if the next line starts too soon
        nf = b - a + 1 + extra
        sa, sb = int(a / FPS * ha.SR), int((b + 1) / FPS * ha.SR)
        audio = mix[sa:sb].copy()
        if extra:                                    # the hold: this shot's own room tone, no voice
            pad = bed[max(0, sb - int(extra / FPS * ha.SR)):sb]
            audio = np.concatenate([audio, pad[:int(extra / FPS * ha.SR)]])
        fade = int(0.4 * ha.SR)
        audio[-fade:] *= np.linspace(1, 0, fade)
        wav = work / f"part{k}.wav"
        ha.save(wav, audio)
        video = out_dir / f"part{k}.mp4"
        ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-", "-i", str(wav),
                               "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                               "-ac", "2", "-shortest", "-movflags", "+faststart", str(video)], stdin=subprocess.PIPE)
        cover_f = min(b, shots[covers[k - 1]]["beat"] + 14)
        end_from = said + int(0.4 * FPS)
        def ending(f):                               # the held cliffhanger: no subtitle, "PART k+1 IS NEXT"
            e = Image.open(frames / f"f{min(f, b):05d}.jpg").convert("RGB")
            _badge(e, series, k, n)
            _end_card(e, [f"PART {k + 1} IS NEXT", "Follow so you don't miss it"])
            out = BytesIO(); e.save(out, "JPEG", quality=93)
            return out.getvalue()
        for f in range(a, b + 1):
            im = frame(f)
            if f == cover_f:
                _cover(frames / f"f{f:05d}.jpg", out_dir / f"part{k}.jpg", series, k, n)
            if not last and f > end_from:
                ff.stdin.write(ending(f))
                continue
            _badge(im, series, k, n)
            buf = BytesIO(); im.save(buf, "JPEG", quality=93); ff.stdin.write(buf.getvalue())
        if extra:
            held = ending(b)
            for _ in range(extra):
                ff.stdin.write(held)
        ff.stdin.close()
        if ff.wait() != 0 or not video.exists():
            raise RuntimeError(f"ffmpeg could not encode part {k}")
        log(f"Part {k} of {n}: lines {l0 + 1}-{l1 + 1}, {nf / FPS:.1f}s")
        videos.append(video)
    shutil.rmtree(frames, ignore_errors=True)
    plan = {"frames": total, "three_d": name, "parts": [str(v.name) for v in videos],
            "shots": [{"a": s["a"], "b": s["b"], "ls": s["a"], "le": s["said"], "scene": "3d"} for s in shots]}
    (work / "plan.json").write_text(json.dumps(plan, indent=1), encoding="utf-8")
    return videos[0], out_dir / "part1.jpg", plan


if __name__ == "__main__":
    # one render machine of the workflow:  python -m autotube.horror3d <work dir> <machines> <k>
    w, m, k = Path(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
    st = json.loads((w / "state3d.json").read_text(encoding="utf-8"))
    log(f"Rendering part {k + 1} of {m}: {len(range(k, st['total'], m))} of {st['total']} frames")
    render_frames(w / "web3d", w / "frames3d", st["total"], m, k)
    log(f"Part {k + 1} of {m} rendered")
