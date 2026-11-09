"""Post older CreepyCartoonTales videos to Instagram, a few a day, oldest first.

The video files live as assets of the GitHub release "instagram-backlog" (Praveen uploads the files he
downloaded from YouTube Studio there). Each run posts the next unposted file and records it in
data/instagram_backlog_posted.json, so nothing is posted twice.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from .instagram import ig_caption, publish_reel
from .util import ROOT, load_config, log

RELEASE = "instagram-backlog"
POSTED = ROOT / "data" / "instagram_backlog_posted.json"


def norm(s: str) -> str:
    s = re.sub(r"\.mp4$", "", s, flags=re.I)
    s = re.sub(r"#\w+", "", s)
    return re.sub(r"[^a-z0-9]", "", s.lower())


def known_videos() -> dict:
    """Normalised title -> (upload date, real title) from the channel's history files."""
    out = {}
    for f in ("horror_history.json", "horror_long_history.json"):
        p = ROOT / "data" / f
        if not p.exists():
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        for v in d.get("videos", []) + d.get("long_videos", []):
            out.setdefault(norm(v["title"]), (v.get("date") or "9999", v["title"]))
    return out


def assets(repo: str) -> list[str]:
    r = subprocess.run(["gh", "release", "view", RELEASE, "--repo", repo, "--json", "assets", "--jq", ".assets[].name"],
                       capture_output=True, text=True)
    if r.returncode:
        log(f"No '{RELEASE}' release yet: nothing to post ({r.stderr.strip()[:120]})")
        return []
    return [a for a in r.stdout.split("\n") if a.lower().endswith(".mp4")]


def main(count: int = 1) -> int:
    repo = os.environ["GITHUB_REPOSITORY"]
    posted = json.loads(POSTED.read_text()) if POSTED.exists() else []
    done = {p["asset"] for p in posted}
    known = known_videos()

    def match(a):          # GitHub renames uploads ("#shorts" -> ".shorts"), so match the title as a prefix
        n = norm(a)
        best = max((k for k in known if k and n.startswith(k)), key=len, default=None)
        return known[best] if best else ("9999", None)

    def key(a):
        return match(a)[0], a

    todo = sorted((a for a in assets(repo) if a not in done), key=key)
    pick = os.environ.get("IG_PICK", "").lower()
    if pick:                                   # post one chosen file first (testing / a retry)
        todo = [a for a in todo if pick in a.lower()] + [a for a in todo if pick not in a.lower()]
    log(f"Instagram backlog: {len(todo)} videos waiting, posting {min(count, len(todo))} now")
    tags = load_config()["horror"].get("instagram_hashtags", ["#horror", "#reels"])
    n = 0
    for a in todo[:count]:
        title = match(a)[1] or re.sub(r"[._]+", " ", re.sub(r"\.mp4$", "", a)).strip()
        work = ROOT / "ig_backlog"
        work.mkdir(exist_ok=True)
        subprocess.run(["gh", "release", "download", RELEASE, "--repo", repo, "--pattern", a, "--dir", str(work), "--clobber"],
                       check=True)
        desc = "A Creepy Cartoon Tale: an original animated horror story."
        mid = publish_reel(work / a, ig_caption(title, desc, tags))
        if not mid:
            log(f"Instagram refused {a}; will try again next run")
            break
        posted.append({"asset": a, "title": title, "media_id": mid})
        POSTED.write_text(json.dumps(posted, indent=1, ensure_ascii=False), encoding="utf-8")
        n += 1
    return n


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 1)
