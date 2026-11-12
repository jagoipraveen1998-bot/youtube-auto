"""Tamil world-trend Shorts: pick today's light, fun world story and write a ~45 s Tamil explainer for it.

Rules (Praveen): world trends, Tamil audio, quick and fun. Light topics only: no wars, deaths, disasters,
crime, politics or elections. Facts come only from the headline and summary we read; nothing is invented.
"""
import json
import re
import time

from .util import env, log

FEEDS = [
    "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-IN&gl=IN&ceid=IN:en",
    "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    "https://feeds.bbci.co.uk/news/technology/rss.xml",
]
HEAVY = re.compile(r"\b(kill|killed|dead|death|dies|died|war|attack|strike|bomb|shoot|shooting|murder|rape|crash|"
                   r"earthquake|flood|disaster|terror|hostage|election|vote|minister|president|senate|congress|"
                   r"parliament|party|court|trial|arrest|police|abuse|suicide|missile|troops|military|sanction|"
                   r"tariff|protest|riot|refugee|ebola|outbreak|epidemic|lawsuit|sued|fraud|scam)\w*", re.I)

PROMPT = """You write the script for a fast, FUN Tamil YouTube Short (about 45 seconds) that explains one trending
world story to Tamil viewers, like a friend telling you something amazing they just read.

Pick the ONE most fun, surprising or curious story from the list below (records, science, space, animals,
tech, gadgets, sport moments, viral, food, travel, entertainment). NEVER pick anything about wars, deaths,
disasters, crime, politics, elections, courts, religion or disease. Avoid these already-covered stories: {used}

Facts: use ONLY facts stated in that story's headline and summary. Do not invent numbers, names or details. If
you explain background (how something works), keep it general and true.

Write {n} short lines in spoken, everyday Tamil (Tamil script; common English words like phone, record, robot are
fine as people really say them). Line 1 is a hook question or shock. Then explain what happened, why it matters or
how it works, with one funny comparison to daily life in Tamil Nadu. The last line asks viewers to follow for
daily world trends. Total 75 to 105 Tamil words. Keep each line under 16 words.

For EACH line also give:
  "img": an English description of ONE colourful cartoon illustration that shows exactly what the line says
         (no text, no logos, no real people's faces; show objects, places, animals, generic cartoon people),
  "sticker": 1 to 3 words (Tamil or English) to pop on screen, e.g. "4 SECONDS!" or "உலக RECORD".

Return JSON only:
{{"pick": <index of the story you chose>, "topic": "short English topic", "title_ta": "Tamil title (max 60 chars)",
 "title_en": "English title (max 60 chars)", "lines": [{{"ta": "...", "img": "...", "sticker": "..."}}],
 "hashtags": ["#...", "#..."]}}

Stories:
{stories}
"""


def fetch(used_links: set) -> list[dict]:
    import feedparser
    items, seen = [], set()
    now = time.time()
    for url in FEEDS:
        try:
            feed = feedparser.parse(url, agent="Mozilla/5.0 (trend bot)")
        except Exception as exc:
            log(f"Feed failed: {url} ({exc})")
            continue
        for e in feed.entries[:25]:
            title = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", e.get("title", ""))).strip()
            link = e.get("link", "")
            key = re.sub(r"[^a-z0-9 ]", "", title.lower().rsplit(" - ", 1)[0])[:70]
            if not title or link in used_links or key in seen or HEAVY.search(title):
                continue
            ts = e.get("published_parsed")
            if ts and now - time.mktime(ts) > 36 * 3600:
                continue
            seen.add(key)
            summary = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", e.get("summary", ""))).strip()[:400]
            if HEAVY.search(summary):
                continue
            items.append({"title": title, "summary": summary, "link": link,
                          "source": (e.get("source") or {}).get("title", "") if e.get("source") else ""})
    log(f"{len(items)} light, fresh world stories found")
    return items[:40]


def write_trend(cfg: dict, used_topics: list[str], used_links: set, n_lines: int = 8) -> dict:
    from google import genai
    from google.genai import types
    from .script_writer import pick_models

    stories = fetch(used_links)
    if not stories:
        raise RuntimeError("No light, fresh world stories in the feeds right now")
    listing = "\n".join(f"{i}. {s['title']} :: {s['summary']}" for i, s in enumerate(stories))
    prompt = PROMPT.format(used="; ".join(used_topics[-40:]) or "none", n=n_lines, stories=listing)
    client = genai.Client(api_key=env("GEMINI_API_KEY"))
    models = pick_models(client, cfg.get("ai", {}).get("gemini_model", "auto"))
    models += [m for m in ("gemini-flash-lite-latest", "gemini-2.5-flash") if m not in models]
    dead, last = set(), None
    for attempt in range(12):
        alive = [m for m in models if m not in dead]
        if not alive:
            break
        model = alive[attempt % len(alive)]
        try:
            resp = client.models.generate_content(model=model, contents=prompt, config=types.GenerateContentConfig(
                response_mime_type="application/json", temperature=0.9))
            d = json.loads(resp.text)
            src = stories[int(d["pick"])]
            if HEAVY.search(src["title"]):
                raise ValueError("picked a heavy story")
            lines = [l for l in d["lines"] if str(l.get("ta", "")).strip()]
            words = sum(len(l["ta"].split()) for l in lines)
            if not (5 <= len(lines) <= 10 and 55 <= words <= 130):
                raise ValueError(f"script shape off: {len(lines)} lines, {words} words")
            d.update(lines=lines, source=src)
            log(f"Trend script by {model}: {d['topic']} ({len(lines)} lines, {words} words) from '{src['title']}'")
            return d
        except Exception as exc:
            last = exc
            msg = str(exc)
            if "404" in msg or "limit: 0" in msg or "PerDay" in msg:
                dead.add(model)
                continue
            log(f"Trend writer attempt {attempt + 1} ({model}) failed: {msg[:160]}")
            time.sleep(min(45, 8 * (attempt + 1)))
    raise RuntimeError(f"Could not write a trend script: {last}")
