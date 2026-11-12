"""Tamil world-trend Short for the Inner Mechanics channel (being renamed for Tamil trends).

    python run_trends.py --no-upload     # build only (output_trends/short.mp4)
    python run_trends.py                 # build and upload

Praveen's rules: world trends, Tamil audio, quick and fun; light stories only; the storyteller (acted Gemini)
voice only: if it isn't available, nothing is uploaded and the next run tries again.
"""
import argparse
import base64
import json
import os
import random
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np

from autotube import horror_audio as ha
from autotube import horror_video as hv
from autotube.trend_writer import write_trend
from autotube.util import ROOT, check_playable, load_config, log, run

IST = timezone(timedelta(hours=5, minutes=30))
FPS = 30
OUTRO_S = 2.2
STYLE = ("Bright, colourful 2D cartoon illustration for a fun explainer video, bold clean outlines, flat vivid colours, "
         "soft shading, cheerful lighting, simple readable composition with one clear subject, no text, no letters, "
         "no logos, no watermark, no real people's faces. ")


def music(total: float, seed: int) -> np.ndarray:
    """A light, bouncy pluck loop under the voice (made here, so no music rights to worry about)."""
    sr, rng = ha.SR, random.Random(seed)
    n = int(total * sr); out = np.zeros(n)
    root = rng.choice([220.0, 246.9, 261.6])
    chords = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]] if rng.random() < 0.5 else [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]]
    beat = 60 / 112
    t = 0.0; k = 0
    while t < total:
        ch = chords[(k // 8) % 4]
        f = root * 2 ** (ch[k % 3] / 12) * (2 if k % 4 == 3 else 1)
        L = int(0.35 * sr); x = np.arange(L) / sr
        note = (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(4 * np.pi * f * x)) * np.exp(-x * 9)
        i0 = int(t * sr); out[i0:i0 + L] += note[: max(0, min(L, n - i0))] * 0.5
        if k % 2 == 0:                                       # soft kick + shaker
            kx = np.arange(int(0.12 * sr)) / sr
            kick = np.sin(2 * np.pi * (55 + 90 * np.exp(-kx * 40)) * kx) * np.exp(-kx * 22)
            out[i0:i0 + len(kick)] += kick[: max(0, min(len(kick), n - i0))] * 0.6
        sh = np.random.default_rng(k).standard_normal(int(0.04 * sr)) * np.exp(-np.arange(int(0.04 * sr)) / sr * 90)
        j0 = int((t + beat / 2) * sr); out[j0:j0 + len(sh)] += sh[: max(0, min(len(sh), n - j0))] * 0.08
        t += beat / 2; k += 1
    return out / (np.abs(out).max() + 1e-9)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-upload", action="store_true")
    args = ap.parse_args()
    cfg = load_config()
    tcfg = cfg.get("trends", {})
    channel = tcfg.get("channel_label", "உலக Trend")
    out = ROOT / "output_trends"; shutil.rmtree(out, ignore_errors=True)
    work = out / "work"; work.mkdir(parents=True)
    hist_path = ROOT / "data" / "trends_history.json"
    hist = json.loads(hist_path.read_text(encoding="utf-8")) if hist_path.exists() else {"topics": [], "links": [], "videos": []}

    d = write_trend(cfg, hist["topics"], set(hist["links"]))
    (out / "script.json").write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding="utf-8")
    lines = [l["ta"].strip() for l in d["lines"]]

    # 1. the voice: the acted Tamil storyteller, or nothing
    from autotube.voice import acted_take
    take = acted_take(lines, tcfg.get("voice", {"gemini_voice": "Puck", "persona":
                      "a cheerful young Tamil YouTuber from Chennai explaining world news to friends, fast, fun and expressive"}),
                      work / "take")
    if take is None:
        log("Storyteller voice not available: nothing uploaded; the next run tries again")
        (out / "WAITING_FOR_VOICE").write_text(d["topic"], encoding="utf-8")
        return
    story = {"beats": [{"line": l, "beat_word": ""} for l in lines], "split_words": True}
    voice, timing = hv.voice_from_take(story, take)

    # 2. one painting per line
    from autotube import illustrate
    illustrate.STYLE = STYLE
    painter = illustrate.Painter(cfg, work / "img"); painter.budget = len(lines) + 2
    images = []
    for i, l in enumerate(d["lines"]):
        p = painter.paint(l["img"], f"l{i}", "9:16")
        if p is None and images:
            images.append(images[-1]); continue
        if p is None:
            raise RuntimeError("No illustration could be painted")
        images.append("data:image/png;base64," + base64.b64encode(Path(p).read_bytes()).decode())

    # 3. the plan: one shot per line, then a follow card
    lead = 0.15
    end = max(t["end"] for t in timing) + lead
    total = end + OUTRO_S
    shots = []
    for k, (l, t) in enumerate(zip(d["lines"], timing)):
        a = 0 if k == 0 else int(round((t["start"] + lead) * FPS))
        b = int(round(((timing[k + 1]["start"] if k + 1 < len(timing) else end) + lead) * FPS))
        ws = l["ta"].split(); dur = (b - a) / FPS
        chars = [max(1, len(w)) for w in ws]; acc = 0; words = []
        speak = max(0.4, (t["end"] - t["start"]))
        off = (t["start"] + lead) - a / FPS
        for w, c in zip(ws, chars):
            s0 = off + speak * acc / sum(chars); acc += c
            words.append([s0, off + speak * acc / sum(chars), w])
        shots.append({"a": a, "b": b, "sticker": l.get("sticker", ""), "words": words})
    frames = int(round(total * FPS))
    plan = {"frames": frames, "end": int(round(end * FPS)), "shots": shots, "images": images, "channel": channel}

    # 4. render
    hv.WEB = ROOT / "trends" / "web"
    frames_dir = work / "frames"
    hv.render(plan, work, frames_dir)
    full = np.zeros(int(total * ha.SR))
    v = voice[: len(full) - int(lead * ha.SR)]
    full[int(lead * ha.SR):int(lead * ha.SR) + len(v)] += v / (np.abs(v).max() + 1e-9) * 0.9
    m = music(total, random.randint(0, 9999)) * 10 ** (-19 / 20)
    m[int(end * ha.SR):] *= 1.8
    full += m
    wav = work / "mix.wav"; ha.save(wav, full / (np.abs(full).max() + 1e-9) * 0.95)
    master = work / "master.wav"
    run(["ffmpeg", "-y", "-v", "error", "-i", str(wav), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", str(master)])
    video = hv.encode(frames_dir, master, out / "short.mp4")
    cover = out / "cover.jpg"
    shutil.copy(sorted(frames_dir.glob("*.jpg"))[min(len(list(frames_dir.glob('*.jpg'))) - 1, int(1.2 * FPS))], cover)
    shutil.rmtree(frames_dir, ignore_errors=True)
    length = check_playable(video, 15, 75)
    log(f"Trend Short ready: {length:.0f}s, '{d['title_ta']}'")
    if args.no_upload:
        return

    # 5. upload
    from autotube.uploader import upload
    src = d["source"]
    title = f"{d['title_ta']} | {d['title_en']} #shorts"[:100]
    desc = "\n".join([d["title_ta"], d["title_en"], "",
                      "இன்றைய உலக trending news, ஒரு நிமிஷத்துல, தமிழில்! 🌍 Follow for daily world trends in Tamil.", "",
                      f"Source: {src.get('source') or 'news'} – {src['title']}", src["link"], "",
                      " ".join(d.get("hashtags", [])[:5] + ["#tamil", "#tamilnews", "#trending", "#shorts"])])
    vid = upload(video, cover, title, desc, ["tamil", "tamil news", "world news tamil", "trending", d["topic"]],
                 {"youtube": tcfg.get("youtube", {"privacy": "public", "category_id": "25", "made_for_kids": False}),
                  "channel": {"language": "ta"}}, token_env="YT_REFRESH_TOKEN")
    log(f"Trend Short uploaded: https://youtube.com/shorts/{vid}")
    hist["topics"].append(d["topic"]); hist["links"] = (hist["links"] + [src["link"]])[-400:]
    hist["videos"].append({"date": datetime.now(IST).strftime("%Y-%m-%d"), "video_id": vid, "title": title})
    hist_path.parent.mkdir(parents=True, exist_ok=True)
    hist_path.write_text(json.dumps(hist, indent=1, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
