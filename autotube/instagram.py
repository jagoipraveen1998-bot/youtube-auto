"""Post a finished Short to Instagram as a Reel (Instagram Graph API, resumable upload: no public URL needed).

Needs the GitHub secret IG_ACCESS_TOKEN (a never-expiring system-user token from the Meta app
"CreepyCartoonTales Publisher"). If the token is missing or Instagram refuses, the run just logs it:
YouTube is never held back by Instagram.
"""
import os
import time
from pathlib import Path

import requests
import subprocess

from .util import log

GRAPH = "https://graph.facebook.com/v22.0"
RUPLOAD = "https://rupload.facebook.com/ig-api-upload/v22.0"
DEFAULT_IG_USER = "17841479893920110"     # @creepycartoontales


def ig_caption(title: str, description: str, hashtags: list[str]) -> str:
    """YouTube title/description -> an Instagram caption (no #shorts, Instagram hashtags)."""
    words = [w for w in title.split() if not w.startswith("#")]
    head = " ".join(words).strip()
    tags = " ".join(dict.fromkeys(hashtags))
    first = (description or "").split("\n")[0].strip()
    parts = [head, first, "Full stories on YouTube (link in bio) 👻", tags]
    return "\n\n".join(p for p in parts if p)[:2150]


def reel_copy(video: Path) -> Path:
    """Instagram's API is strict: H.264 high@4.1, fixed bitrate, a keyframe every 2 s, AAC 44.1 kHz stereo, moov first."""
    out = video.with_name("reel_ig.mp4")       # a plain name: Meta fails to fetch URLs with dotted names (error 2207077)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(video), "-c:v", "libx264", "-preset", "medium",
                    "-profile:v", "high", "-level", "4.1", "-pix_fmt", "yuv420p", "-r", "30", "-g", "60", "-keyint_min", "60",
                    "-sc_threshold", "0", "-b:v", "5M", "-maxrate", "6M", "-bufsize", "10M",
                    "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease:out_color_matrix=bt709:out_range=tv,"
                    "pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1",
                    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
                    "-map_metadata", "-1", "-map_chapters", "-1",
                    "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2", "-movflags", "+faststart", str(out)], check=True)
    return out


def publish_reel(video: Path, caption: str, cover_offset_ms: int = 2500) -> str | None:
    token = os.environ.get("IG_ACCESS_TOKEN", "").strip()
    if not token:
        log("Instagram: IG_ACCESS_TOKEN not set, skipping the Reel")
        return None
    user = os.environ.get("IG_USER_ID", "").strip() or DEFAULT_IG_USER
    video = Path(video)
    tag = None
    try:
        ig = reel_copy(video)
        repo = os.environ.get("GITHUB_REPOSITORY")
        if repo:                                  # Meta's direct upload is unreliable: host the file briefly, let Instagram fetch it
            tag = f"ig-reel-{os.environ.get('GITHUB_RUN_ID', int(time.time()))}-{int(time.time())}"
            subprocess.run(["gh", "release", "create", tag, str(ig), "--repo", repo, "--prerelease",
                            "--title", "temporary Instagram upload", "--notes", "Deleted automatically after posting."], check=True)
            url = f"https://github.com/{repo}/releases/download/{tag}/{ig.name}"
            r = requests.post(f"{GRAPH}/{user}/media", timeout=60, data={
                "media_type": "REELS", "video_url": url, "caption": caption,
                "share_to_feed": "true", "thumb_offset": str(cover_offset_ms), "access_token": token})
            r.raise_for_status()
            cid = r.json()["id"]
        else:
            r = requests.post(f"{GRAPH}/{user}/media", timeout=60, data={
                "media_type": "REELS", "upload_type": "resumable", "caption": caption,
                "share_to_feed": "true", "thumb_offset": str(cover_offset_ms), "access_token": token})
            r.raise_for_status()
            cid = r.json()["id"]
            blob = ig.read_bytes()
            up = requests.post(f"{RUPLOAD}/{cid}", data=blob, timeout=900, headers={
                "Authorization": f"OAuth {token}", "offset": "0", "file_size": str(len(blob)),
                "Content-Type": "application/octet-stream"})
            up.raise_for_status()
        for _ in range(60):          # Instagram processes the video: wait up to ~10 minutes
            st = requests.get(f"{GRAPH}/{cid}", timeout=30,
                              params={"fields": "status_code,status", "access_token": token}).json()
            code = st.get("status_code")
            if code == "FINISHED":
                break
            if code in ("ERROR", "EXPIRED"):
                raise RuntimeError(f"Instagram could not process the video: {st}")
            time.sleep(10)
        else:
            raise RuntimeError("Instagram took too long to process the video")
        pub = requests.post(f"{GRAPH}/{user}/media_publish", timeout=60,
                            data={"creation_id": cid, "access_token": token})
        pub.raise_for_status()
        media_id = pub.json()["id"]
        log(f"Instagram Reel published (media id {media_id})")
        return media_id
    except Exception as exc:
        body = getattr(getattr(exc, "response", None), "text", "")
        log(f"Instagram Reel failed (YouTube upload is unaffected): {exc} {body[:300]}")
        return None
    finally:
        if tag:
            subprocess.run(["gh", "release", "delete", tag, "--repo", os.environ["GITHUB_REPOSITORY"], "--yes", "--cleanup-tag"])
