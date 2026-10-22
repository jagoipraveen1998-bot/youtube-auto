"""Step 4a: download free stock footage from Pexels for each story."""
from pathlib import Path

import requests

from .util import env, log

API = "https://api.pexels.com/videos/search"


def _best_file(video: dict) -> str | None:
    files = [f for f in video.get("video_files", [])
             if f.get("file_type") == "video/mp4" and f.get("width")
             and f["width"] >= f.get("height", 0)]  # landscape only
    if not files:
        return None
    # prefer the smallest file that is still at least 1280 wide (fast download)
    good = sorted([f for f in files if f["width"] >= 1280], key=lambda f: f["width"])
    return (good or sorted(files, key=lambda f: -f["width"]))[0]["link"]


def get_clips(terms: list[str], count: int, folder: Path, used_ids: set[int]) -> list[Path]:
    """Download up to `count` clips matching the search terms. Empty list if no key."""
    key = env("PEXELS_API_KEY", required=False)
    if not key:
        return []
    folder.mkdir(parents=True, exist_ok=True)
    clips: list[Path] = []
    for term in terms + ["india city", "news"]:
        if len(clips) >= count:
            break
        try:
            r = requests.get(API, headers={"Authorization": key}, timeout=30,
                             params={"query": term, "orientation": "landscape",
                                     "per_page": 10, "size": "medium"})
            r.raise_for_status()
            videos = r.json().get("videos", [])
        except Exception as exc:
            log(f"Pexels search failed for '{term}': {exc}")
            continue
        for v in videos:
            if len(clips) >= count:
                break
            if v["id"] in used_ids or v.get("duration", 0) < 4:
                continue
            link = _best_file(v)
            if not link:
                continue
            path = folder / f"pexels_{v['id']}.mp4"
            try:
                with requests.get(link, stream=True, timeout=60) as d:
                    d.raise_for_status()
                    with open(path, "wb") as f:
                        for part in d.iter_content(1 << 20):
                            f.write(part)
                used_ids.add(v["id"])
                clips.append(path)
                break  # one clip per search term keeps the visuals varied
            except Exception as exc:
                log(f"Clip download failed: {exc}")
    return clips
