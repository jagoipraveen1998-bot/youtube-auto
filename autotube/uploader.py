"""Step 6: upload the video (and thumbnail) with the YouTube Data API."""
from pathlib import Path

from .util import env, log

SCOPES = ["https://www.googleapis.com/auth/youtube.upload",
          "https://www.googleapis.com/auth/youtube"]


def _client():
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    creds = Credentials(
        None,
        refresh_token=env("YT_REFRESH_TOKEN"),
        client_id=env("YT_CLIENT_ID"),
        client_secret=env("YT_CLIENT_SECRET"),
        token_uri="https://oauth2.googleapis.com/token",
        scopes=SCOPES,
    )
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def _clean(text: str, limit: int) -> str:
    return text.replace("<", "").replace(">", "").strip()[:limit]


def _tags(tags: list[str]) -> list[str]:
    out, total = [], 0
    for t in tags:
        t = _clean(str(t), 100).replace(",", " ")
        if t and t.lower() not in (x.lower() for x in out) and total + len(t) + 2 <= 480:
            out.append(t)
            total += len(t) + 2
    return out


def upload(video: Path, thumb: Path | None, title: str, description: str, tags: list[str],
           cfg: dict) -> str:
    from googleapiclient.http import MediaFileUpload

    yt_cfg = cfg["youtube"]
    lang = cfg["channel"]["language"]
    body = {
        "snippet": {
            "title": _clean(title, 100),
            "description": _clean(description, 4900),
            "tags": _tags(tags),
            "categoryId": str(yt_cfg.get("category_id", "25")),
            "defaultLanguage": lang,
            "defaultAudioLanguage": lang,
        },
        "status": {
            "privacyStatus": yt_cfg.get("privacy", "private"),
            "selfDeclaredMadeForKids": bool(yt_cfg.get("made_for_kids", False)),
            "containsSyntheticMedia": bool(yt_cfg.get("contains_synthetic_media", False)),
        },
    }
    yt = _client()
    request = yt.videos().insert(
        part="snippet,status", body=body,
        media_body=MediaFileUpload(str(video), mimetype="video/mp4", chunksize=8 << 20, resumable=True),
    )
    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            log(f"Uploading... {int(status.progress() * 100)}%")
    video_id = response["id"]
    log(f"Uploaded: https://youtu.be/{video_id} ({body['status']['privacyStatus']})")

    if thumb and thumb.exists():
        try:
            yt.thumbnails().set(videoId=video_id, media_body=MediaFileUpload(str(thumb))).execute()
            log("Thumbnail set")
        except Exception as exc:  # needs a phone-verified channel
            log(f"Thumbnail not set (verify your channel by phone to allow it): {exc}")
    return video_id
