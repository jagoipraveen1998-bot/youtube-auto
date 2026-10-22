"""Step 1: collect fresh headlines from RSS feeds."""
import calendar
import html
import re
import time

import feedparser

from .util import log

_TAGS = re.compile(r"<[^>]+>")


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(_TAGS.sub(" ", text or ""))).strip()


def _norm_title(title: str) -> str:
    # Google News adds " - Source" at the end; compare titles without it.
    return re.sub(r"[^a-z0-9஀-௿ ]", "", title.lower().rsplit(" - ", 1)[0])[:80]


def fetch_news(cfg: dict, used_links: set[str]) -> list[dict]:
    news_cfg = cfg["news"]
    max_age = news_cfg.get("max_age_hours", 30) * 3600
    now = time.time()
    items, seen_titles = [], set()

    for url in news_cfg["feeds"]:
        try:
            feed = feedparser.parse(url, agent="Mozilla/5.0 (autotube news bot)")
        except Exception as exc:  # one broken feed should not stop the video
            log(f"Feed failed: {url} ({exc})")
            continue
        source_name = _clean(feed.feed.get("title", url))
        for e in feed.entries:
            link = e.get("link", "")
            title = _clean(e.get("title", ""))
            if not title or link in used_links:
                continue
            published = e.get("published_parsed") or e.get("updated_parsed")
            ts = calendar.timegm(published) if published else now
            if now - ts > max_age:
                continue
            key = _norm_title(title)
            if key in seen_titles:
                continue
            seen_titles.add(key)
            source = _clean(e.get("source", {}).get("title", "")) if e.get("source") else ""
            items.append({
                "title": title,
                "summary": _clean(e.get("summary", ""))[:500],
                "source": source or source_name,
                "link": link,
                "published": ts,
            })
        log(f"{len(feed.entries):>3} items from {source_name[:50]}")

    items.sort(key=lambda x: x["published"], reverse=True)
    items = items[: news_cfg.get("candidates", 30)]
    log(f"{len(items)} fresh headlines collected")
    return items
