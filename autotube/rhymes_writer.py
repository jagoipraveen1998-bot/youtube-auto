"""Gemini writes today's original funny rhymes for toddlers (English or Tamil)."""
import json
import random
import time

from .scene3d import CHARACTERS, SETTINGS
from .script_writer import pick_models
from .util import env, log

LANG = {"en": "simple English (words a 2-5 year old knows)",
        "ta": "simple spoken Tamil (Tamil script, words a 2-5 year old Tamil child knows)"}

PROMPT = """You write ORIGINAL funny nursery rhymes for toddlers aged 2-5 for the YouTube kids channel "{channel}".

Write {count} brand-new rhymes in {language}.
Today's themes to use (one rhyme per theme, in this order): {themes}

Rules for every rhyme:
- 8 to 12 short lines, 3 to 7 words each, clear rhyme pairs (AABB), bouncy rhythm.
- Silly and funny in a gentle way: animals doing human things, food mix-ups, funny sounds
  (moo, boing, splash), repetition kids can shout along with.
- Positive and safe: no fear, danger, violence, insults, body or toilet jokes, brands,
  real people, or copyrighted characters/songs. Include a tiny good habit when natural
  (sharing, brushing teeth, saying sorry) without preaching.
- Do NOT reuse lines from famous nursery rhymes.
- The videos are 3D cartoons, so each rhyme's star MUST be one of these characters: {ids}.
  Pick a matching setting for the scene from: {settings}.
These titles were used before, do not repeat them: {used}

Return ONLY JSON:
{{
  "rhymes": [
    {{
      "title": "short funny title in {language_short}",
      "title_en": "the same title in English",
      "character": "1-3 ENGLISH words naming the main cute character, e.g. 'cartoon cow'",
      "character_id": "the main character, EXACTLY one id from: {ids}",
      "friends": ["0-2 more ids from the same list who appear in the rhyme"],
      "setting": "EXACTLY one of: {settings}",
      "emoji": "one emoji for the main character",
      "lines": ["line 1", "line 2", "..."]
    }}
  ],
  "best_index": 0,
  "compilation_title": "catchy YouTube title in {language_short}, max 80 characters, mention new nursery rhymes for kids",
  "short_title": "catchy title for the best rhyme as a YouTube Short, max 70 characters",
  "description": "2-3 friendly sentences for parents about today's rhymes, in {language_short}",
  "tags": ["10 to 15 search tags, mix of {language_short} and English"],
  "thumbnail_text": "2 to 4 fun words in {language_short} for the thumbnail"
}}
"""

THEMES = [
    "a cow who wants to fly", "a dancing banana", "a sleepy moon", "a duck in rain boots",
    "brushing teeth with a smiling dinosaur", "an elephant learning to whistle", "a cat who sings opera",
    "a tiny bus full of animals", "a bouncing ball that won't stop", "monkeys making a mango milkshake",
    "a shy cloud who makes rain", "a turtle in a hurry", "a puppy with hiccups", "a chick who oversleeps",
    "a lion who says sorry", "counting little frogs", "a bear's birthday cupcake",
    "a parrot who copies everything", "the wheels of an auto-rickshaw", "a pig who loves bath time",
    "a chick learning to say good morning", "a snowman on a beach holiday", "a giraffe with a very long scarf",
    "an owl who can't stay awake", "a train of animals saying hello", "a kitten playing hide and seek",
    "a sun who wears sunglasses", "a dinosaur who is scared of a mouse", "a bunny's carrot race",
    "a little star learning to twinkle", "a robot learning to hug", "a sheep who can't stop dancing",
    "a mouse who builds a tiny house", "a frog's splashy jump contest", "a cupcake who wants to dance",
    "a bear who shares his honey", "an elephant's bubble bath", "a duck family's picnic",
]


def write_rhymes(cfg: dict, lang: str, used_titles: list[str]) -> dict:
    from google import genai
    from google.genai import types

    rc = cfg["rhymes"]
    count = rc["per_compilation"]
    rng = random.Random()
    themes = rng.sample(THEMES, k=min(count, len(THEMES)))
    prompt = PROMPT.format(
        channel=cfg["channel"]["name"], count=count, language=LANG[lang],
        language_short="Tamil" if lang == "ta" else "English",
        themes="; ".join(themes), used=", ".join(used_titles[-80:]) or "none",
        ids=", ".join(CHARACTERS), settings=", ".join(SETTINGS),
    )
    client = genai.Client(api_key=env("GEMINI_API_KEY"))
    models = pick_models(client, cfg["ai"].get("gemini_model", "auto"))
    last = None
    for attempt in range(5):
        model = models[min(attempt, len(models) - 1)]
        try:
            resp = client.models.generate_content(
                model=model, contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json",
                                                   temperature=0.95))
            data = json.loads(resp.text)
            _check(data)
            log(f"[{lang}] {len(data['rhymes'])} rhymes written by {model}")
            return data
        except Exception as exc:
            last = exc
            log(f"[{lang}] Gemini attempt {attempt + 1} failed: {exc}")
            time.sleep(10 * (attempt + 1))
    raise RuntimeError(f"Could not get rhymes from Gemini: {last}")


def _check(data: dict) -> None:
    good = []
    for r in data.get("rhymes", []):
        lines = [str(x).strip() for x in r.get("lines", []) if str(x).strip()]
        if len(lines) >= 4 and r.get("title"):
            r["lines"] = lines[:14]
            r.setdefault("title_en", r["title"])
            r.setdefault("character", "cute animal")
            r.setdefault("emoji", "⭐")
            if r.get("character_id") not in CHARACTERS:
                r.pop("character_id", None)
            if r.get("setting") not in SETTINGS:
                r.pop("setting", None)
            r["friends"] = [f for f in r.get("friends", []) if f in CHARACTERS][:2] if isinstance(r.get("friends"), list) else []
            good.append(r)
    if len(good) < 3:
        raise ValueError("fewer than 3 usable rhymes")
    data["rhymes"] = good
    bi = data.get("best_index", 0)
    data["best_index"] = bi if isinstance(bi, int) and 0 <= bi < len(good) else 0
    for k in ("compilation_title", "short_title", "description", "thumbnail_text"):
        data.setdefault(k, good[0]["title"])
    data.setdefault("tags", [])
