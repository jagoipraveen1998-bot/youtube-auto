"""Replace the thumbnail of a CreepyCartoonTales video: python scripts/set_thumbnail.py VIDEO_ID path/to/image.jpg"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from googleapiclient.http import MediaFileUpload
from autotube.uploader import _client
from autotube.util import log

vid, img = sys.argv[1], sys.argv[2]
_client("YT_HORROR_REFRESH_TOKEN").thumbnails().set(videoId=vid, media_body=MediaFileUpload(img, mimetype="image/jpeg")).execute()
log(f"New thumbnail on https://youtu.be/{vid}: {img}")
