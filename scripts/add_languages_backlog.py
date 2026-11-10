"""One-off: add translated titles, descriptions (and subtitles when the timing is known) to videos already uploaded."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from autotube.localize import add_languages
from autotube.uploader import _client
from autotube.util import load_config, log

cfg = load_config()
ids = []
for f in ("data/horror_history.json", "data/horror_long_history.json"):
    p = Path(f)
    if p.exists():
        d = json.loads(p.read_text(encoding="utf-8"))
        ids += [v["video_id"] for v in d.get("videos", []) + d.get("long_videos", []) if v.get("video_id")]
ids = list(dict.fromkeys(ids))
yt = _client("YT_HORROR_REFRESH_TOKEN")
done = 0
for vid in ids:
    try:
        items = yt.videos().list(part="snippet,localizations", id=vid).execute().get("items", [])
        if not items or len(items[0].get("localizations", {})) >= 10:
            continue
        sn = items[0]["snippet"]
        if add_languages(cfg, vid, sn["title"], sn.get("description", ""), []):
            done += 1
        __import__("time").sleep(30)                 # stay under the free per-minute limit
    except Exception as exc:
        log(f"{vid}: {str(exc)[:150]}")
log(f"Other languages added to {done} older videos")
