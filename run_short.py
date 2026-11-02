"""Make (and upload) today's Short.

    python run_short.py --no-upload        # build it only
    python run_short.py --topic "why ..."  # pick the subject yourself
"""
import argparse
import json
import shutil
from datetime import datetime, timedelta, timezone

from autotube import shorts_video as sv
from autotube.shorts_writer import write_short
from autotube.util import ROOT, check_playable, load_config, log

IST = timezone(timedelta(hours=5, minutes=30))
MAX_SECONDS = 58.0          # over 60 and YouTube stops treating it as a Short


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-upload", action="store_true")
    ap.add_argument("--topic", default=None)
    args = ap.parse_args()

    cfg = load_config()
    from autotube import explainer_art as _art
    _art.use_style(cfg.get("shorts", {}).get("style") or cfg.get("explainers", {}).get("style"))
    sc = cfg.get("shorts", {})
    channel = cfg["channel"]["name"]
    today = datetime.now(IST).strftime("%Y-%m-%d")
    out = ROOT / "output_short"
    shutil.rmtree(out, ignore_errors=True)
    work = out / "work"
    work.mkdir(parents=True)

    hist_path = ROOT / "data" / "shorts_history.json"
    hist = (json.loads(hist_path.read_text(encoding="utf-8"))
            if hist_path.exists() else {"topics": [], "videos": []})

    data = write_short(cfg, hist["topics"], args.topic)
    (out / "script.json").write_text(json.dumps(data, indent=2, ensure_ascii=False),
                                     encoding="utf-8")

    vcfg = sc.get("voice") or cfg["explainers"]["voice"]
    back = sv.backdrop(channel, work / "back.png")
    threed = sc.get("threed", cfg.get("explainers", {}).get("threed", {}))

    parts, elapsed = [], 0.0
    recent: list[str] = []         # recent 3D models, so no two beats in a row repeat one
    for i, beat in enumerate(data["beats"], start=1):
        log(f"Beat {i}/{len(data['beats'])}: {beat['caption']}")
        clip, secs = sv.render_beat(
            beat, vcfg, work, f"b{i}", back, threed_cfg=threed,
            context=" ".join([str(data.get("topic", "")), str(beat.get("caption", "")),
                              str(beat.get("narration", ""))]),
            avoid=tuple(recent[-2:]))
        if beat.get("_model"):
            recent.append(beat["_model"])
        if elapsed + secs > MAX_SECONDS and parts:
            log(f"Stopping at {len(parts)} beats to stay under {MAX_SECONDS:.0f}s")
            break
        parts.append(clip)
        elapsed += secs

    video = sv.join(parts, out / "short.mp4")
    length = check_playable(video, 12, 60)
    thumb = sv.cover(data["title"], channel, out / "cover.jpg")
    log(f"Short ready ({length:.0f}s)")

    description = "\n".join([data["description"], "",
                             f"{channel} explains how everyday systems actually work.",
                             "#Shorts"])
    (out / "description.txt").write_text(description, encoding="utf-8")
    tags = list(dict.fromkeys(list(data.get("tags", [])) +
                              ["shorts", "how it works", "explained", "technology explained",
                               "science", "engineering"]))

    if args.no_upload:
        log(f"Upload skipped. Files are in {out.name}/")
        return

    from autotube.uploader import upload
    video_id = upload(video, thumb, data["title"], description, tags, cfg)
    hist["topics"] = (hist["topics"] + [data.get("topic", data["title"])])[-200:]
    hist["videos"] = (hist["videos"] + [{"date": today, "title": data["title"],
                                         "video_id": video_id,
                                         "length": f"{length:.0f}s"}])[-200:]
    hist_path.parent.mkdir(parents=True, exist_ok=True)
    hist_path.write_text(json.dumps(hist, indent=2, ensure_ascii=False), encoding="utf-8")
    log(f"Short uploaded: https://youtu.be/{video_id}")


if __name__ == "__main__":
    main()
