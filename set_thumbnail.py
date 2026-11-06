"""Set a custom thumbnail on a video that is already on YouTube.

    python set_thumbnail.py VIDEO_ID cover.jpg [TOKEN_ENV]
"""
import sys
from pathlib import Path

from googleapiclient.http import MediaFileUpload

from autotube.uploader import _client
from autotube.util import log

video_id, image = sys.argv[1], Path(sys.argv[2])
token_env = sys.argv[3] if len(sys.argv) > 3 else "YT_HORROR_REFRESH_TOKEN"
if not image.exists():
    raise SystemExit(f"Thumbnail not found: {image}")
yt = _client(token_env)
yt.thumbnails().set(videoId=video_id, media_body=MediaFileUpload(str(image), mimetype="image/jpeg")).execute()
log(f"Thumbnail set on https://youtu.be/{video_id}")
