"""Make (and upload) today's explainer video.

    python run_explainer.py --no-upload        # build it only
    python run_explainer.py --topic "how ..."  # pick the subject yourself

Uploads are private by default, so nothing goes live until you have watched it.
"""
import argparse
import json
import os
import shutil
from datetime import datetime, timedelta, timezone

from autotube import explainer_art as art
from autotube import explainer_video as ev
from autotube.explainer_writer import write_explainer
from autotube.util import ROOT, check_playable, load_config, log

IST = timezone(timedelta(hours=5, minutes=30))


def next_queued():
    """The oldest script waiting as data/next_*.json, if any."""
    files = sorted((ROOT / "data").glob("next_*.json"))
    return files[0] if files else None


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
    art.use_style(xc.get("style"))
    channel = cfg["channel"]["name"]
    today = datetime.now(IST).strftime("%Y-%m-%d")
    out = ROOT / "output_explainer"
    shutil.rmtree(out, ignore_errors=True)
    work = out / "work"
    work.mkdir(parents=True)

    hist_path = ROOT / "data" / "explainer_history.json"
    hist = json.loads(hist_path.read_text(encoding="utf-8")) if hist_path.exists() else {"topics": [], "videos": []}
    if (not args.no_upload and os.environ.get("GITHUB_EVENT_NAME") == "schedule"
            and any(v.get("date") == today for v in hist["videos"])):
        # Today's explainer already went out from a manual run; one a day is enough.
        log(f"An explainer was already uploaded on {today}; the scheduled run stops here.")
        return

    queued = next_queued()
    if queued and not args.topic:
        # A script written ahead of time goes out instead of a generated one.
        from autotube.explainer_writer import _clean
        data = _clean(json.loads(queued.read_text(encoding="utf-8")),
                      int(xc.get("sections", 8)))
        data.setdefault("topic", data["title"])
        log(f"Using queued script {queued.name}: {data['title']}")
    else:
        queued = None
        data = write_explainer(cfg, hist["topics"], args.topic)
    (out / "script.json").write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    vcfg = (cfg.get("explainers", {}).get("voice")
            or cfg["rhymes"]["voices"]["en"])  # falls back to the voice already configured

    parts, chapters, elapsed = [], [], 0.0
    recent: list[str] = []        # the last two 3D models, so sections do not repeat one

    # Painted shots: a storyboard, then one picture every few seconds. Anything that
    # fails here falls back to the drawn diagrams below, part by part.
    painter = None
    ic = xc.get("illustrate", {})
    if ic.get("enabled"):
        from autotube import illustrate
        try:
            if illustrate.storyboard(cfg, data):
                painter = illustrate.Painter(cfg, work / "paint")
        except Exception as exc:
            log(f"Storyboard failed, using diagrams: {exc}")

    def painted(shots, name):
        if not painter or not shots:
            return []
        got = illustrate.paint_shots(painter, shots, name)
        return got if len(got) == len(shots) or len(got) >= 2 else []

    # 1. opening: the hook over painted shots with the title, or the title card
    hook_shots = painted(data.get("hook_shots"), "hook") if data.get("hook") else []
    if hook_shots:
        clip, secs = ev.render_illustrated(data["hook"], hook_shots, vcfg, work, "hook",
                                           title=data["title"])
        parts.append(clip)
        elapsed += secs
    else:
        art.title_card(data["title"], channel).save(work / "title.png")
        if data.get("hook"):
            hook_clip, secs = ev.render_section(
                {"heading": "", "narration": data["hook"],
                 "visual": {"type": "number", "value": "", "caption": ""}}, vcfg, work, "hook")
            # the hook plays over the title card rather than a diagram
            card, _ = ev.render_card(work / "title.png", secs, work, "title", work / "hook.mp3")
        else:
            card, secs = ev.render_card(work / "title.png", 3.0, work, "title")
        parts.append(card)
        elapsed += secs
    chapters.append((0.0, "Introduction"))

    # 2. the sections
    painted_count = 0
    for i, section in enumerate(data["sections"], start=1):
        log(f"Section {i}/{len(data['sections'])}: {section['heading']}")
        shots = painted(section.get("shots"), f"s{i}")
        clip = None
        if shots:
            try:
                clip, secs = ev.render_illustrated(section["narration"], shots, vcfg, work,
                                                   f"s{i}", heading=section["heading"])
                painted_count += 1
            except Exception as exc:
                log(f"Painted section {i} failed to render, using the diagram: {exc}")
                clip = None
        if clip is None:
            clip, secs = ev.render_section(
                section, vcfg, work, f"s{i}", threed_cfg=xc.get("threed", {}),
                context=" ".join([str(data.get("topic", "")), str(section.get("heading", "")),
                                  str(section.get("narration", ""))]),
                avoid=tuple(recent[-2:]))
            if section.get("_model"):
                recent.append(section["_model"])
        chapters.append((elapsed, section["heading"] or f"Part {i}"))
        parts.append(clip)
        elapsed += secs
    if painter:
        log(f"Painted {painted_count}/{len(data['sections'])} sections with {painter.made} new images")

    # 3. closing line
    if data.get("takeaway"):
        end_shots = painted(data.get("end_shots"), "end")
        if end_shots:
            clip, secs = ev.render_illustrated(data["takeaway"], end_shots, vcfg, work, "end",
                                               heading="In short")
        else:
            clip, secs = ev.render_section(
                {"heading": "In short", "narration": data["takeaway"],
                 "visual": {"type": "number", "value": data["thumbnail_text"], "caption": ""}},
                vcfg, work, "end", threed_cfg=xc.get("threed", {}), context=" ".join([str(data.get("topic", "")), str(data.get("takeaway", ""))]))
        parts.append(clip)
        elapsed += secs

    thumb_image = None
    if painter and data.get("thumb_prompt"):
        thumb_image = painter.paint(data["thumb_prompt"], "thumb")

    video = ev.join(parts, out / "explainer.mp4")
    thumb = ev.thumbnail(data.get("thumbnail_text") or data["title"], channel, out / "thumbnail.jpg",
                         image=thumb_image)
    log(f"Explainer ready ({fmt(elapsed)})")

    description = "\n".join([
        data["description"], "",
        "Chapters"] + [f"{fmt(at)} {name}" for at, name in chapters] +
        ["", f"{channel} explains how everyday systems actually work."])
    (out / "description.txt").write_text(description, encoding="utf-8")
    tags = list(dict.fromkeys(list(data.get("tags", [])) + ["how it works", "explained",
                                                            "technology explained", "science",
                                                            "engineering", "how things work"]))

    check_playable(video, 60, 900)

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
    if queued:
        queued.unlink()          # used: the next run goes back to writing its own
    log(f"Uploaded ({cfg['youtube'].get('privacy', 'private')}): https://youtu.be/{video_id}")


if __name__ == "__main__":
    main()
