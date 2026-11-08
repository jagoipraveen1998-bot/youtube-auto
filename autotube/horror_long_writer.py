"""Gemini writes one original 3-6 minute horror-comedy script for the daily CreepyCartoonTales long video.

The script is plain text in the same format a person would write by hand (see scripts/README.md), so the
normal long-video pipeline (horror_long.plan_script) storyboards and animates it with no human in the loop.
"""
import json
import re
import time

from .horror_writer import SCENES
from .script_writer import pick_models
from .util import env, log

PROMPT = """You write ORIGINAL animated HORROR-COMEDY stories for the YouTube channel "CreepyCartoonTales".
Write ONE complete story that runs 4 to 5 minutes when read aloud: 560 to 720 spoken words.

Style: creepy AND funny, never gory. A cartoon boy or young man narrates in the first person with dry, self-mocking
humour (he is scared but complains about the wrong things). Strong hook in the first two sentences (a creepy paradox
stated as fact), escalating unease across 3 or 4 chapters, at least four real laughs (absurd details, deadpan lines,
a villain who is petty, polite or ridiculous), a pivot, and an ironic twist in the last line that is both creepy and
a little funny. Characters TALK: about a third of the lines are dialogue. Safe for teenagers: no blood, no gore, no
weapons, no self-harm, no real people, no real brands, nothing sexual, no animal harm.

The story is animated with these sets only, so everything that happens must fit them:
{scenes}
Villain types the animation can draw: double (the hero's exact double), shadow (a black silhouette with glowing eyes),
ghost (a pale see-through person), doll (a cracked porcelain doll), neighbour (an overly friendly bald neighbour),
tall (an unnaturally tall thin figure in a suit), delivery (a smiling delivery man with a parcel).
Side characters available (use 1 to 3): mum, dad, grandma, grandpa, roommate, friend, sister, brother, officer.

FORMAT (follow exactly, plain text):
- Line 1 is a cast note: [cast: NAME=hero boy, NAME=mum, NAME=villain ghost]  (the hero is "boy" or "man"; the villain
  entry names its type from the list above; every NAME who speaks appears in the cast note)
- Chapters start with a line "# Chapter title" (3 or 4 chapters)
- Dialogue lines are "NAME: what they say" with the NAME in capitals, speech only, no "he said"
- Every other line is the hero's narration, short paragraphs of 1 to 3 sentences, plain spoken English, contractions,
  numbers written as words
- No stage directions, no brackets except the cast note, no markdown other than the chapter lines

Use a different villain and situation from these stories the channel already told: {used}

Return ONLY JSON: {{"title":"YouTube title under 70 characters, curiosity-driven, no hashtags",
 "story_id":"short-slug", "script":"the full script text with \\n line breaks"}}
"""


def _spoken_words(script: str) -> int:
    n = 0
    for line in script.splitlines():
        s = line.strip()
        if not s or s.startswith("#") or s.startswith("["):
            continue
        s = re.sub(r"^[A-Z][A-Z .'-]{0,24}:\s*", "", s)
        n += len(s.split())
    return n


def write_long_script(cfg: dict, used: list[str]) -> dict:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=env("GEMINI_API_KEY"))
    scenes = "\n".join(f"- {k}: {v}" for k, v in SCENES.items())
    prompt = PROMPT.format(scenes=scenes, used="; ".join(used[-80:]) or "none yet")
    models = pick_models(client, cfg.get("ai", {}).get("gemini_model", "auto"))
    models = models + [m for m in ("gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite") if m not in models]
    last = None
    for attempt in range(10):
        model = models[attempt % len(models)]
        try:
            resp = client.models.generate_content(
                model=model, contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json", temperature=1.0))
            data = json.loads(resp.text)
            script = str(data.get("script") or "").replace("\r", "").strip()
            words = _spoken_words(script)
            if not 430 <= words <= 900:
                raise ValueError(f"script is {words} words")
            if not script.startswith("[cast:") or script.count("\n#") + script.startswith("#") < 2:
                raise ValueError("script is missing the cast note or chapters")
            title = re.sub(r"#\S+", "", str(data.get("title") or "")).strip()[:90] or "Something Was Living In Our House"
            slug = re.sub(r"[^a-z0-9-]", "", str(data.get("story_id") or "").lower())[:40] or f"long-{int(time.time())}"
            log(f"Long script written by {model}: '{title}' ({words} words, about {words / 138:.1f} min)")
            return {"title": title, "story_id": slug, "script": script + "\n"}
        except Exception as exc:
            last = exc
            log(f"Gemini attempt {attempt + 1} failed: {exc}")
            time.sleep(min(70, 8 * (attempt + 1)))
    raise RuntimeError(f"Could not get a long script from Gemini: {last}")
