"""Weekly "full stories" long video: the week's Part 1 + Part 2 Shorts joined into one landscape compilation.

Long videos count toward watch hours (Shorts views do not) and turn Shorts viewers into subscribers.
Each story: a title card, Part 1, a "PART 2" card, Part 2; YouTube chapters in the description.

    python scripts/compilation.py              # find, build and upload
    python scripts/compilation.py --no-upload  # build only (output_comp/video.mp4)
"""
import argparse
import io
import json
import os
import re
import subprocess
import sys
import urllib.request
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from autotube.util import load_config, log  # noqa: E402

REPO = os.environ.get("GITHUB_REPOSITORY", "jagoipraveen1998-bot/youtube-auto")
OUT = ROOT / "output_comp"
HIST = ROOT / "data" / "compilation_history.json"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def gh(url: str, raw: bool = False):
    req = urllib.request.Request(url if url.startswith("http") else f"https://api.github.com/repos/{REPO}/{url}",
                                 headers={"Authorization": f"Bearer {os.environ['GH_TOKEN']}",
                                          "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
    return data if raw else json.loads(data)


def collect(days: int = 9) -> list[dict]:
    """Every uploaded Short from the last few days that still has its files: [{video_id, part, pair, title, dir}]."""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    runs = gh(f"actions/workflows/horror-shorts.yml/runs?status=success&per_page=60&created=>={since}")["workflow_runs"]
    got = []
    for run in runs:
        for art in gh(f"actions/runs/{run['id']}/artifacts")["artifacts"]:
            if art["expired"] or not art["name"].startswith("horror-short"):
                continue
            d = OUT / "src" / str(run["id"])
            if not d.exists():
                zipfile.ZipFile(io.BytesIO(gh(art["archive_download_url"], raw=True))).extractall(d)
            up = d / "uploaded.json"
            if up.exists() and (d / "short.mp4").exists():
                info = json.loads(up.read_text())
                story = json.loads((d / "story.json").read_text()) if (d / "story.json").exists() else {}
                info.update(dir=str(d), story_title=story.get("title", info["title"]))
                got.append(info)
    return sorted(got, key=lambda x: x["date"])


def pairs(shorts: list[dict], done: set) -> list[tuple[dict, dict]]:
    by = {}
    for s in shorts:
        if s.get("pair") and s["video_id"] not in done:
            by.setdefault(s["pair"], {})[s.get("part")] = s     # a remake replaces the older upload
    return [(p[1], p[2]) for p in by.values() if 1 in p and 2 in p]


def clean_title(t: str) -> str:
    return re.sub(r"\s*\(part \d\)|#\S+", "", t, flags=re.I).strip()


def card(text: str, sub: str, path: Path, bg: Path | None = None) -> None:
    """A 1920x1080 title card (blurred frame of the story behind it)."""
    im = Image.new("RGB", (1920, 1080), (8, 6, 14))
    if bg and bg.exists():
        b = Image.open(bg).convert("RGB")
        b = b.resize((1920, int(1920 * b.height / b.width))).crop((0, 300, 1920, 1380)).filter(ImageFilter.GaussianBlur(24))
        im = Image.blend(im, b, 0.45)
    d = ImageDraw.Draw(im)
    big = ImageFont.truetype(FONT, 100 if len(text) < 26 else 76)
    small = ImageFont.truetype(FONT, 54)
    words, lines, cur = text.upper().split(), [], ""
    for w in words:
        if d.textlength((cur + " " + w).strip(), font=big) > 1700:
            lines.append(cur.strip()); cur = w
        else:
            cur += " " + w
    lines.append(cur.strip())
    y = 540 - len(lines) * 60 - 40
    d.text((960, y - 90), sub, font=small, fill=(255, 210, 63), anchor="mm", stroke_width=6, stroke_fill=(0, 0, 0))
    for i, l in enumerate(lines):
        d.text((960, y + i * 120 + 30), l, font=big, fill=(255, 255, 255), anchor="mm", stroke_width=10, stroke_fill=(0, 0, 0))
    im.save(path, quality=92)


def seg_still(img: Path, secs: float, out: Path) -> None:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-t", str(secs), "-i", str(img),
                    "-f", "lavfi", "-t", str(secs), "-i", "anullsrc=r=48000:cl=stereo",
                    "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                    "-c:a", "aac", "-b:a", "160k", "-shortest", str(out)], check=True)


def seg_short(mp4: Path, out: Path) -> None:
    """The vertical Short in the middle of a landscape frame, its own blurred picture filling the sides."""
    vf = ("[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=28:2,eq=brightness=-0.18[bg];"
          "[0:v]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:0,fps=30,format=yuv420p[v]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp4), "-filter_complex", vf, "-map", "[v]", "-map", "0:a",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
                    "-ac", "2", str(out)], check=True)


def duration(p: Path) -> float:
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True).stdout.strip())


def thumbnail(pr: list, n: int, path: Path) -> None:
    im = Image.new("RGB", (1280, 720), (10, 6, 16))
    covers = [Path(p[0]["dir"]) / "cover.jpg" for p in pr[:3]]
    w = 1280 // max(1, len(covers))
    for i, c in enumerate(covers):
        if c.exists():
            a = Image.open(c).convert("RGB"); a = a.resize((w, int(w * a.height / a.width)))
            im.paste(a.crop((0, (a.height - 720) // 3, w, (a.height - 720) // 3 + 720)), (i * w, 0))
    ov = Image.new("RGBA", (1280, 720), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    for y in range(720):
        od.line([(0, y), (1280, y)], fill=(0, 0, 0, int(200 * max(0, y - 330) / 390)))
    im = Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")
    d = ImageDraw.Draw(im)
    d.text((640, 540), f"{n} SCARY STORIES", font=ImageFont.truetype(FONT, 104), fill=(255, 210, 63), anchor="mm",
           stroke_width=10, stroke_fill=(0, 0, 0))
    d.text((640, 645), "WHAT WOULD YOU DO?", font=ImageFont.truetype(FONT, 64), fill=(255, 255, 255), anchor="mm",
           stroke_width=8, stroke_fill=(0, 0, 0))
    im.save(path, quality=92)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-upload", action="store_true")
    ap.add_argument("--min", type=int, default=2, help="fewest stories worth a compilation")
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    hist = json.loads(HIST.read_text()) if HIST.exists() else {"videos": [], "used": []}
    pr = pairs(collect(), set(hist["used"]))
    log(f"Complete two-part stories this week: {len(pr)}")
    if len(pr) < args.min:
        log("Not enough finished stories for a compilation yet; skipping."); return
    segs, chapters, t = [], [], 0.0
    intro = OUT / "intro.jpg"; card(f"{len(pr)} scary stories", "WHAT WOULD YOU DO?", intro, Path(pr[0][0]["dir"]) / "cover.jpg")
    seg_still(intro, 3.0, OUT / "s000.mp4"); segs.append(OUT / "s000.mp4")
    chapters.append((0.0, "Intro")); t += duration(OUT / "s000.mp4")
    for i, (p1, p2) in enumerate(pr, 1):
        name = clean_title(p1["story_title"])
        chapters.append((t, name))
        c = OUT / f"c{i}.jpg"; card(name, f"STORY {i}", c, Path(p1["dir"]) / "cover.jpg")
        for k, (src, secs) in enumerate([(c, 2.5), (Path(p1["dir"]) / "short.mp4", None)]):
            o = OUT / f"s{i:02d}{k}.mp4"
            seg_still(src, secs, o) if secs else seg_short(src, o)
            segs.append(o); t += duration(o)
        c2 = OUT / f"c{i}b.jpg"; card(name, "PART 2", c2, Path(p2["dir"]) / "cover.jpg")
        for k, (src, secs) in enumerate([(c2, 1.8), (Path(p2["dir"]) / "short.mp4", None)], 2):
            o = OUT / f"s{i:02d}{k}.mp4"
            seg_still(src, secs, o) if secs else seg_short(src, o)
            segs.append(o); t += duration(o)
    (OUT / "list.txt").write_text("".join(f"file '{s.name}'\n" for s in segs))
    video = OUT / "video.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(OUT / "list.txt"),
                    "-c", "copy", "-movflags", "+faststart", str(video)], check=True)
    thumb = OUT / "cover.jpg"; thumbnail(pr, len(pr), thumb)
    stamp = lambda s: f"{int(s // 60)}:{int(s % 60):02d}"
    title = f"{len(pr)} Scary \"What Would You Do?\" Stories | Animated Horror Compilation"
    desc = "\n".join([f"{len(pr)} full two-part horror stories in one video. What would YOU do? Tell me in the comments.", "",
                      *[f"{stamp(s)} {n}" for s, n in chapters], "",
                      *[f"▶ {clean_title(p1['story_title'])}: https://youtube.com/shorts/{p1['video_id']}" for p1, _ in pr], "",
                      "A Creepy Cartoon Tale: original animated horror stories every day. Subscribe for new ones!", "",
                      "#horror #scarystories #animation #horrorstories #creepy"])
    (OUT / "description.txt").write_text(desc, encoding="utf-8")
    log(f"Compilation: {len(pr)} stories, {duration(video) / 60:.1f} min")
    if args.no_upload:
        return
    from autotube.uploader import upload
    from autotube.localize import add_languages
    cfg = load_config(); hcfg = cfg["horror"]
    vid = upload(video, thumb, title, desc, ["horror", "scary stories", "animated horror", "what would you do", "horror compilation"],
                 {"youtube": hcfg["youtube"], "channel": {"language": "en"}}, token_env="YT_HORROR_REFRESH_TOKEN")
    hist["videos"].append({"date": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "video_id": vid, "title": title})
    hist["used"] += [s["video_id"] for p in pr for s in p]
    HIST.parent.mkdir(parents=True, exist_ok=True); HIST.write_text(json.dumps(hist, indent=1))
    log(f"Compilation uploaded: https://youtu.be/{vid}")
    add_languages(cfg, vid, title, desc, [])


if __name__ == "__main__":
    main()
