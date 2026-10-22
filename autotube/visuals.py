"""Step 4a: download free stock footage (Pixabay or Pexels) for each story."""
from pathlib import Path

import requests

from .util import env, log


def _pixabay(term: str, key: str) -> list[tuple[str, str]]:
    r = requests.get("https://pixabay.com/api/videos/", timeout=30, params={
        "key": key, "q": term[:100], "video_type": "film", "safesearch": "true",
        "per_page": 10, "min_width": 1280})
    r.raise_for_status()
    out = []
    for h in r.json().get("hits", []):
        v = h.get("videos", {})
        # medium is usually 1920x1080; fall back to small (1280x720)
        f = next((v[k] for k in ("medium", "small", "large") if v.get(k, {}).get("url")
                  and v[k].get("width", 0) >= v[k].get("height", 1)), None)
        if f and h.get("duration", 0) >= 4:
            out.append((f"pixabay_{h['id']}", f["url"]))
    return out


def _pexels(term: str, key: str) -> list[tuple[str, str]]:
    r = requests.get("https://api.pexels.com/videos/search", headers={"Authorization": key},
                     timeout=30, params={"query": term, "orientation": "landscape",
                                         "per_page": 10, "size": "medium"})
    r.raise_for_status()
    out = []
    for v in r.json().get("videos", []):
        files = [f for f in v.get("video_files", [])
                 if f.get("file_type") == "video/mp4" and f.get("width")
                 and f["width"] >= f.get("height", 0)]
        good = sorted([f for f in files if f["width"] >= 1280], key=lambda f: f["width"])
        pick = (good or sorted(files, key=lambda f: -f["width"]))
        if pick and v.get("duration", 0) >= 4:
            out.append((f"pexels_{v['id']}", pick[0]["link"]))
    return out


def provider() -> tuple[str, str] | None:
    """Which stock-video service to use: Pixabay first, then Pexels. None = no key."""
    for name, var in (("Pixabay", "PIXABAY_API_KEY"), ("Pexels", "PEXELS_API_KEY")):
        key = env(var, required=False)
        if key:
            return name, key
    return None


def get_clips(terms: list[str], count: int, folder: Path, used_ids: set) -> list[Path]:
    """Download up to "count" clips matching the search terms. Empty list if no key."""
    prov = provider()
    if not prov:
        return []
    name, key = prov
    search = _pixabay if name == "Pixabay" else _pexels
    folder.mkdir(parents=True, exist_ok=True)
    clips: list[Path] = []
    for term in terms + ["india city", "news"]:
        if len(clips) >= count:
            break
        try:
            results = search(term, key)
        except Exception as exc:
            log(f"{name} search failed for '{term}': {exc}")
            continue
        for clip_id, link in results:
            if clip_id in used_ids:
                continue
            path = folder / f"{clip_id}.mp4"
            try:
                with requests.get(link, stream=True, timeout=90) as d:
                    d.raise_for_status()
                    with open(path, "wb") as f:
                        for part in d.iter_content(1 << 20):
                            f.write(part)
                used_ids.add(clip_id)
                clips.append(path)
                break  # one clip per search term keeps the visuals varied
            except Exception as exc:
                log(f"Clip download failed: {exc}")
    return clips
