"""Step 2: Gemini picks the stories and writes the narration, title and tags."""
import json
import time
from datetime import datetime, timedelta, timezone

from .util import env, log

IST = timezone(timedelta(hours=5, minutes=30))
LANG_NAMES = {"en": "English", "ta": "Tamil"}

PROMPT = """You are the script writer for the YouTube news channel "{channel}".
The channel covers: {topic}. Today is {today}.

Below are {count} recent headlines (index, source, title, summary).
Choose the {stories} most important and interesting DIFFERENT stories
(skip duplicates, celebrity gossip and pure opinion pieces).

Write in {language}. Rules for the narration:
- Explain each story in your OWN words, about {words} words per story.
  Never copy sentences from the summaries.
- Only state facts that appear in the headline/summary. Do not invent numbers,
  quotes or details. If information is limited, explain the background and why
  it matters instead.
- Neutral, clear, spoken style for a news presenter. No emojis, no markdown.
- Do not say "according to the summary" or mention RSS.

Return ONLY JSON in exactly this shape:
{{
  "video_title": "catchy but honest title, max 90 characters, include today's date like {short_date}",
  "description": "2-3 sentence overview of today's episode",
  "tags": ["10 to 15 short search tags"],
  "thumbnail_text": "3 to 5 punchy words for the thumbnail",
  "intro": "a 25-40 word spoken welcome that teases the top stories",
  "outro": "a 20-30 word spoken sign-off asking viewers to like and subscribe for daily updates",
  "stories": [
    {{
      "headline": "short on-screen headline, max 60 characters",
      "narration": "the spoken text for this story",
      "search_terms": ["2-3 simple ENGLISH keywords for stock video footage, e.g. 'parliament building', 'stock market screen'"],
      "source_index": 0
    }}
  ]
}}

HEADLINES:
{headlines}
"""


def write_script(cfg: dict, news: list[dict]) -> dict:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=env("GEMINI_API_KEY"))
    now = datetime.now(IST)
    v = cfg["video"]
    headlines = "\n".join(
        f"[{i}] ({n['source']}) {n['title']} :: {n['summary'][:300]}" for i, n in enumerate(news)
    )
    prompt = PROMPT.format(
        channel=cfg["channel"]["name"], topic=cfg["channel"]["topic"],
        today=now.strftime("%A, %d %B %Y"), short_date=now.strftime("%d %b %Y"),
        count=len(news), stories=min(v["stories"], len(news)), words=v["words_per_story"],
        language=LANG_NAMES.get(cfg["channel"]["language"], "English"), headlines=headlines,
    )

    model = cfg["ai"]["gemini_model"]
    last_error = None
    for attempt in range(4):
        # After two failures, fall back to the lighter model (higher free limits).
        use_model = model if attempt < 2 else "gemini-2.5-flash-lite"
        try:
            resp = client.models.generate_content(
                model=use_model, contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json", temperature=0.7),
            )
            script = json.loads(resp.text)
            _validate(script, news)
            log(f"Script written by {use_model}: {len(script['stories'])} stories")
            return script
        except Exception as exc:
            last_error = exc
            log(f"Gemini attempt {attempt + 1} failed: {exc}")
            time.sleep(15 * (attempt + 1))
    raise RuntimeError(f"Could not get a script from Gemini: {last_error}")


def _validate(script: dict, news: list[dict]) -> None:
    for key in ("video_title", "description", "tags", "intro", "outro", "stories"):
        if key not in script:
            raise ValueError(f"script is missing '{key}'")
    good = []
    for s in script["stories"]:
        if not s.get("narration") or not s.get("headline"):
            continue
        idx = s.get("source_index")
        s["source"] = news[idx] if isinstance(idx, int) and 0 <= idx < len(news) else None
        s["search_terms"] = [t for t in s.get("search_terms", []) if isinstance(t, str)][:3] or ["news"]
        good.append(s)
    if len(good) < 3:
        raise ValueError("script has fewer than 3 usable stories")
    script["stories"] = good
    script.setdefault("thumbnail_text", script["stories"][0]["headline"])
