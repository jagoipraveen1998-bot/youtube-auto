#!/usr/bin/env python3
"""Stream Snipz clip maker.

Takes a YouTube/Twitch link (or a local video file) plus a start/end time,
cuts just that part, transcribes it with faster-whisper and renders a
finished 1080x1920 clip:
  * blurred full-frame background, original 16:9 video centred
  * hook title at the top
  * word-timed subtitles (3 words at a time, current word highlighted)
  * last 3 s: "Subscribe to Tomo on YouTube  @Tomovids" end card text

Usage:
  python tools/clipmaker.py --url URL --start 1:02:10 --end 1:02:55 \
      --hook "Tomo finds the secret Vice City cop" --out clips/tomo-01.mp4
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

W, H = 1080, 1920


def secs(t):
    """'1:02:03.5' / '62:03' / '3723' -> seconds (float)."""
    t = str(t).strip()
    parts = [float(p) for p in t.split(":")]
    v = 0.0
    for p in parts:
        v = v * 60 + p
    return v


def run(cmd):
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, check=True)


def download(url, start, end, work):
    out = os.path.join(work, "src.%(ext)s")
    run([
        "yt-dlp", "--no-playlist", "-f", "bv*[height<=1080]+ba/b[height<=1080]/b",
        "--download-sections", f"*{start}-{end}", "--force-keyframes-at-cuts",
        "--merge-output-format", "mp4", "-o", out, url,
    ])
    for f in os.listdir(work):
        if f.startswith("src."):
            return os.path.join(work, f)
    sys.exit("download failed: no file")


def cut_local(path, start, end, work):
    out = os.path.join(work, "src.mp4")
    run(["ffmpeg", "-y", "-ss", str(start), "-to", str(end), "-i", path, "-vf", "fps=30", "-fps_mode", "cfr",   # browser recordings are variable-rate
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-c:a", "aac", out])
    return out


def duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "json", path], capture_output=True, text=True, check=True)
    return float(json.loads(r.stdout)["format"]["duration"])


def transcribe(path, model_name):
    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segs, _ = model.transcribe(path, language="en", word_timestamps=True,
                               vad_filter=True)
    words = []
    for s in segs:
        for w in (s.words or []):
            txt = w.word.strip()
            if txt:
                words.append((w.start, w.end, txt))
    return words


def ts(t):
    t = max(0.0, t)
    h = int(t // 3600)
    m = int(t % 3600 // 60)
    s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def esc(s):
    return s.replace("\\", "/").replace("{", "(").replace("}", ")").replace("\n", " ")


def wrap(text, n=22):
    out, line = [], ""
    for w in text.split():
        if len(line) + len(w) + 1 > n and line:
            out.append(line)
            line = w
        else:
            line = (line + " " + w).strip()
    if line:
        out.append(line)
    return "\\N".join(out)


def cta_text(cta):
    parts = re.split(r"\\N|\|", cta)
    return "\\N".join(wrap(esc(p.strip()), 20) for p in parts if p.strip())


def build_ass(words, dur, hook, cta, cta_secs, path):
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,DejaVu Sans,74,&H00FFFFFF,&H00FFFFFF,&H00000000,&HAA000000,1,0,0,0,100,100,0,0,3,6,0,8,60,60,190,1
Style: Sub,DejaVu Sans,86,&H00FFFFFF,&H0000E5FF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,7,3,2,60,60,520,1
Style: Cta,DejaVu Sans,70,&H0000E5FF,&H00FFFFFF,&H00000000,&HC8000000,1,0,0,0,100,100,0,0,3,6,0,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    cta_from = max(0.0, dur - cta_secs)
    if hook:
        ev.append(f"Dialogue: 2,{ts(0)},{ts(cta_from)},Hook,,0,0,0,,{wrap(esc(hook.upper()), 24)}")
    # 3-word chunks, highlight the word being spoken (yellow)
    i = 0
    while i < len(words):
        chunk = words[i:i + 3]
        c_end = words[i + 3][0] if i + 3 < len(words) else chunk[-1][1] + 0.3
        c_end = min(c_end, chunk[-1][1] + 0.6)
        for k, (ws, we, _) in enumerate(chunk):
            s = ws if k else chunk[0][0]
            e = chunk[k + 1][0] if k + 1 < len(chunk) else c_end
            if s >= cta_from:
                break
            e = min(e, cta_from)
            parts = []
            for j, (_, _, t) in enumerate(chunk):
                t = esc(t.upper())
                parts.append("{\\c&H00E5FF&}" + t + "{\\c&HFFFFFF&}" if j == k else t)
            ev.append(f"Dialogue: 1,{ts(s)},{ts(e)},Sub,,0,0,0,,{' '.join(parts)}")
        i += 3
    ev.append(f"Dialogue: 3,{ts(cta_from)},{ts(dur + 1)},Cta,,0,0,0,,{cta_text(cta)}")
    with open(path, "w", encoding="utf-8") as f:
        f.write(head + "\n".join(ev) + "\n")


def render(src, ass, out):
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    ass_arg = ass.replace("\\", "/").replace(":", "\\:")
    vf = (f"[0:v]scale=-2:{H},crop={W}:{H},boxblur=20:2,eq=brightness=-0.18[bg];"
          f"[0:v]scale={W}:-2[fg];[bg][fg]overlay=0:(H-h)/2,ass='{ass_arg}',format=yuv420p[v]")
    run(["ffmpeg", "-y", "-i", src, "-filter_complex", vf, "-map", "[v]", "-map", "0:a?",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-r", "30",
         "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url")
    ap.add_argument("--file", help="local video instead of --url")
    ap.add_argument("--start", required=True)
    ap.add_argument("--end", required=True)
    ap.add_argument("--hook", default="")
    ap.add_argument("--cta", default="Subscribe to Tomo on YouTube\\N@Tomovids")
    ap.add_argument("--cta-secs", type=float, default=3.0)
    ap.add_argument("--model", default="small.en")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    if not (a.url or a.file):
        sys.exit("give --url or --file")
    s, e = secs(a.start), secs(a.end)
    if e <= s:
        sys.exit("end must be after start")
    if e - s > 180:
        sys.exit("clip longer than 3 minutes; pick a shorter range")
    work = tempfile.mkdtemp(prefix="clip_")
    src = download(a.url, s, e, work) if a.url else cut_local(a.file, s, e, work)
    dur = duration(src)
    words = transcribe(src, a.model)
    print(f"{len(words)} words transcribed, {dur:.1f}s", flush=True)
    ass = os.path.join(work, "subs.ass")
    build_ass(words, dur, a.hook, a.cta, a.cta_secs, ass)
    render(src, ass, a.out)
    with open(os.path.splitext(a.out)[0] + ".txt", "w", encoding="utf-8") as f:
        f.write(" ".join(w[2] for w in words) + "\n")
    print("done:", a.out)


if __name__ == "__main__":
    main()
