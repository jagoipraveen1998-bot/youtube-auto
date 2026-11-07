"""Upload videos that earlier runs already made (kept as GitHub artifacts), as soon as YouTube allows.

data/upload_queue.json holds a list of items:
  {"run_id": "...", "artifact": "horror-short-11", "title": "...", "description": "...", "tags": [...],
   "publish_at": "2026-11-08T18:00"   (India time; omit or past = publish straight away)}
Each run downloads and uploads items in order, stops quietly at YouTube's daily limit, and removes what went up.
"""
import json
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path

import yaml

from autotube.util import log

ROOT = Path(__file__).parent
IST = timezone(timedelta(hours=5, minutes=30))
QUEUE = ROOT / "data" / "upload_queue.json"
REPO = "jagoipraveen1998-bot/youtube-auto"


def publish_time(s: str | None) -> str | None:
    if not s:
        return None
    t = datetime.fromisoformat(s).replace(tzinfo=IST)
    if t <= datetime.now(IST) + timedelta(minutes=20):
        return None                                  # too late to schedule: publish straight away
    return t.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def main():
    queue = json.loads(QUEUE.read_text(encoding="utf-8")) if QUEUE.exists() else []
    if not queue:
        log("Nothing waiting to upload.")
        return
    hcfg = yaml.safe_load((ROOT / "config.yaml").read_text(encoding="utf-8"))["horror"]
    from autotube.uploader import _client, upload
    me = _client("YT_HORROR_REFRESH_TOKEN").channels().list(part="snippet", mine=True).execute()
    names = [c["snippet"]["title"] for c in me.get("items", [])]
    if not any("creepycartoontales" in n.lower().replace(" ", "").replace(".", "") for n in names):
        raise SystemExit(f"YT_HORROR_REFRESH_TOKEN belongs to {names}, not CreepyCartoonTales.")
    ycfg = {"youtube": hcfg["youtube"], "channel": {"language": "en"}}
    hist_path = ROOT / "data" / "horror_history.json"
    hist = json.loads(hist_path.read_text(encoding="utf-8")) if hist_path.exists() else {"stories": [], "videos": []}
    left = []
    for i, item in enumerate(queue):
        art = ROOT / "art" / item["artifact"]
        try:
            subprocess.run(["gh", "run", "download", str(item["run_id"]), "-R", REPO, "-n", item["artifact"], "-D", str(art)], check=True)
        except subprocess.CalledProcessError:
            log(f"Artifact {item['artifact']} is gone (older than its keep time); dropping it from the queue.")
            continue
        video = next(art.rglob("*.mp4"))
        cover = next(art.rglob("cover.jpg"), None)
        desc = item.get("description") or next(art.rglob("description.txt")).read_text(encoding="utf-8")
        tags = list(dict.fromkeys(item.get("tags", []) + hcfg.get("extra_tags", [])))
        try:
            vid = upload(video, cover, item["title"], desc, tags, ycfg, token_env="YT_HORROR_REFRESH_TOKEN",
                         publish_at=publish_time(item.get("publish_at")))
        except Exception as e:  # noqa: BLE001
            if "uploadLimitExceeded" in str(e) or "exceeded the number of videos" in str(e):
                log(f"YouTube's daily upload limit is still on; {len(queue) - i} video(s) wait for the next try.")
                left += queue[i:]
                break
            raise
        log(f"Uploaded {item['title'][:60]} -> https://youtu.be/{vid} (goes public {item.get('publish_at') or 'now'})")
        hist.setdefault("videos", []).append({"date": datetime.now(IST).strftime("%Y-%m-%d %H:%M"), "title": item["title"],
                                             "video_id": vid, "from_queue": True, "publish_at": item.get("publish_at")})
    QUEUE.write_text(json.dumps(left, indent=2, ensure_ascii=False), encoding="utf-8")
    hist_path.write_text(json.dumps(hist, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
