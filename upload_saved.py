"""Upload a long video that an earlier run already rendered (kept as a GitHub artifact).

Usage: python upload_saved.py ART_DIR SCRIPT_NAME
Exit code 0 and "LIMIT" printed when YouTube's daily upload limit is still in force (try again later).
"""
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import yaml

from autotube.util import log

ROOT = Path(__file__).parent
IST = timezone(timedelta(hours=5, minutes=30))


def main():
    art, script = Path(sys.argv[1]), sys.argv[2]
    video = next(art.rglob("video.mp4"))
    cover = next(art.rglob("cover.jpg"), None)
    description = next(art.rglob("description.txt")).read_text(encoding="utf-8")
    story = json.loads((ROOT / "scripts" / script).read_text(encoding="utf-8")) if script.endswith(".json") else {}
    hcfg = yaml.safe_load((ROOT / "config.yaml").read_text(encoding="utf-8"))["horror"]
    title = (story.get("title") or video.parent.name).replace("#shorts", "").strip()[:100]
    tags = list(dict.fromkeys(story.get("tags", []) + hcfg.get("extra_tags", []) + ["horror story animated", "scary story"]))

    from autotube.uploader import _client, upload
    me = _client("YT_HORROR_REFRESH_TOKEN").channels().list(part="snippet", mine=True).execute()
    names = [c["snippet"]["title"] for c in me.get("items", [])]
    want = hcfg.get("channel", "CreepyCartoonTales").lower().replace(" ", "")
    if not any(want in n.lower().replace(" ", "").replace(".", "") for n in names):
        raise SystemExit(f"YT_HORROR_REFRESH_TOKEN belongs to {names}, not {hcfg.get('channel')}.")
    ycfg = {"youtube": hcfg["youtube"], "channel": {"language": "en"}}
    try:
        video_id = upload(video, cover, title, description, tags, ycfg, token_env="YT_HORROR_REFRESH_TOKEN")
    except Exception as e:  # noqa: BLE001
        if "uploadLimitExceeded" in str(e) or "exceeded the number of videos" in str(e):
            log("YouTube's daily upload limit is still in force; will try again later.")
            print("LIMIT")
            return
        raise
    hist_path = ROOT / "data" / "horror_history.json"
    hist = json.loads(hist_path.read_text(encoding="utf-8")) if hist_path.exists() else {"stories": [], "videos": []}
    hist.setdefault("long_videos", []).append({"date": datetime.now(IST).strftime("%Y-%m-%d %H:%M"), "title": title,
                                               "video_id": video_id, "script": script, "uploaded_from_saved_run": True})
    hist_path.write_text(json.dumps(hist, indent=2, ensure_ascii=False), encoding="utf-8")
    (ROOT / "data" / "pending_long_upload.json").unlink(missing_ok=True)
    log(f"Long video published: https://youtu.be/{video_id}")
    print("DONE")


if __name__ == "__main__":
    main()
