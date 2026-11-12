"""Inner Mechanics: list every video on the channel, or delete them all (Praveen asked: delete forever).

    python scripts/inner/cleanup.py list
    python scripts/inner/cleanup.py delete <count-from-list>   # refuses unless the count matches what is on the channel
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from autotube.uploader import _client  # noqa: E402

yt = _client("YT_REFRESH_TOKEN")
ch = yt.channels().list(part="snippet,contentDetails,statistics", mine=True).execute()["items"][0]
uploads = ch["contentDetails"]["relatedPlaylists"]["uploads"]
vids, page = [], None
while True:
    r = yt.playlistItems().list(part="snippet,status", playlistId=uploads, maxResults=50, pageToken=page).execute()
    vids += [{"id": i["snippet"]["resourceId"]["videoId"], "title": i["snippet"]["title"],
              "date": i["snippet"]["publishedAt"][:10], "status": i["status"]["privacyStatus"]} for i in r["items"]]
    page = r.get("nextPageToken")
    if not page:
        break
print(f"CHANNEL: {ch['snippet']['title']} ({ch['id']}) subscribers={ch['statistics'].get('subscriberCount')} "
      f"views={ch['statistics'].get('viewCount')} videos={len(vids)}")
for v in vids:
    print(f"  {v['date']}  {v['id']}  [{v['status']}]  {v['title']}")
Path("inner_videos.json").write_text(json.dumps({"channel": ch["snippet"]["title"], "id": ch["id"], "videos": vids}, indent=1))

if sys.argv[1:2] == ["delete"]:
    if ch["snippet"]["title"].lower().replace(" ", "") != "innermechanics":
        raise SystemExit(f"Refusing: this token is for '{ch['snippet']['title']}', not Inner Mechanics")
    if len(sys.argv) < 3 or int(sys.argv[2]) != len(vids):
        raise SystemExit(f"Refusing: confirmed count {sys.argv[2:3]} does not match the {len(vids)} videos on the channel")
    gone = 0
    for v in vids:
        try:
            yt.videos().delete(id=v["id"]).execute(); gone += 1
            print(f"DELETED {v['id']}  {v['title']}")
        except Exception as exc:
            print(f"FAILED  {v['id']}  {v['title']}: {str(exc)[:200]}")
    print(f"Deleted {gone} of {len(vids)} videos")
