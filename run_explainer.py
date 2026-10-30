"""Make (and upload) today's explainer video.

    python run_explainer.py --no-upload        # build it only
    python run_explainer.py --topic "how ..."  # pick the subject yourself

Uploads are private by default, so nothing goes live until you have watched it.
"""
import argparse
import json
import shutil
from datetime import datetime, timedelta, timezone

from autotube import explainer_art as art
from autotube import explainer_video as ev
from autotube.explainer_writer import write_explainer
from autotube.util import ROOT, load_config, log

IST = timezone(timedelta(hours=5, minutes=30))


def fmt(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 60:02d}:{s % 60:02d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-upload", action="store_true")
    ap.add_argument("--topic", default=None)
    args = ap.parse_args()

    cfg = load_config()
    xc = cfg.get("explainers", {})
    channel = cfg["channel"]["name"]
    today = datetime.now(IST).strftime("%Y-%m-%d")
    out = ROOT / "output_explainer"
    shutil.rmtree(out, ignore_errors=True)
    work = out / "work"
    work.mkdir(parents=True)

    hist_path = ROOT / "data" / "explainer_history.json"
    hist = json.loads(hist_path.read_text(encoding="utf-8")) if hist_path.exists() else {"topics": [], "videos": []}

    data = write_explainer(cfg, hist["topics"], args.topic)
    (out / "script.json").write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    vcfg = (cfg.get("explainers", {}).get("voice")
            or cfg["rhymes"]["voices"]["en"])  # falls back to the voice already configured

    parts, chapters, elapsed = [], [], 0.0

    # 1. opening card, with the hook read over it
    art.title_card(data["title"], channel).save(work / "title.png")
    if data.get("hook"):
        hook_clip, secs = ev.render_section(
            {"heading": "", "narration": data["hook"],
             "visual": {"type": "number", "value": "", "caption": ""}}, vcfg, work, "hook")
        # the hook plays over the title card rather than a diagram
        card, _ = ev.render_card(work / "title.png", secs, work, "title", work / "hook.mp3")
        parts.append(card)
        elapsed += secs
    else:
        card, secs = ev.render_card(work / "title.png", 3.0, work, "title")
        parts.append(card)
        elapsed += secs
    chapters.append((0.0, "Introduction"))

    # 2. the sections
    for i, section in enumerate(data["sections"], start=1):
        log(f"Section {i}/{len(data['sections'])}: {section['heading']}")
        clip, secs = ev.render_section(section, vcfg, work, f"s{i}")
        chapters.append((elapsed, section["heading"] or f"Part {i}"))
        parts.append(clip)
        elapsed += secs

    # 3. closing line
    if data.get("takeaway"):
        clip, secs = ev.render_section(
            {"heading": "In short", "narration": data["takeaway"],
             "visual": {"type": "points", "items": [data["thumbnail_text"]]}}, vcfg, work, "end")
        parts.append(clip)
        elapsed += secs

    video = ev.join(parts, out / "explainer.mp4")
    thumb = ev.thumbnail(data["title"], channel, out / "thumbnail.jpg")
    log(f"Explainer ready ({fmt(elapsed)})")

    description = "\n".join([
        data["description"], "",
        "Chapters"] + [f"{fmt(at)} {name}" for at, name in chapters] +
        ["", f"{channel} explains how everyday systems actually work."])
    (out / "description.txt").write_text(description, encoding="utf-8")
    tags = list(dict.fromkeys(list(data.get("tags", [])) + ["how it works", "explained", "retail",
                                                            "supply chain", "logistics"]))

    if args.no_upload:
        log(f"Upload skipped. Files are in {out.name}/")
        return

    from autotube.uploader import upload
    cfg["youtube"]["made_for_kids"] = False
    cfg["youtube"]["category_id"] = str(cfg["youtube"].get("category_id", "27"))
    video_id = upload(video, thumb, data["title"], description, tags, cfg)
    hist["topics"] = (hist["topics"] + [data.get("topic", data["title"])])[-200:]
    hist["videos"] = (hist["videos"] + [{"date": today, "title": data["title"], "video_id": video_id,
                                         "length": fmt(elapsed)}])[-200:]
    hist_path.write_text(json.dumps(hist, indent=2, ensure_ascii=False), encoding="utf-8")
    log(f"Uploaded (private, waiting for your review): https://youtu.be/{video_id}")


if __name__ == "__main__":
    main()
