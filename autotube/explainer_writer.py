"""Gemini writes today's explainer: a real question, answered with a mechanism."""
import json
import random
import time

from .script_writer import pick_models
from .util import env, log

VISUALS = """Each section carries one picture. Choose the type that genuinely fits; do not force one.
  {"type":"flow","items":["step one","step two","step three"]}            - a process, 3 to 5 steps
  {"type":"points","items":["first point","second point"]}                 - 2 to 5 short points
  {"type":"compare","left_title":"...","left":["..."],"right_title":"...","right":["..."]}
  {"type":"bars","unit":"%","items":[{"label":"...","value":42}]}          - 2 to 5 bars
  {"type":"number","value":"1 in 13","caption":"what the figure means"}    - one striking figure"""

PROMPT = """You write short, genuinely informative explainer videos for the YouTube channel "{channel}".
The audience is curious adults in the UK and the US who want to understand how modern technology actually works.
The channel's territory is the machinery of the modern world: chips, networks, satellites, batteries, sensors,
artificial intelligence, data centres, encryption, robotics, screens, engines and the systems behind them.

Today's subject: {topic}

Write a video of {sections} sections. Rules that matter:
- Open with a concrete, surprising fact about the thing. Never "have you ever wondered".
- Explain the MECHANISM. The viewer should finish knowing how it really works, step by step, not just what it does.
- Give the viewer the one counter-intuitive idea at the heart of it. That is why they stay.
- Be specific. Name the real parts, the real physics, the real trade-offs. Avoid filler and hype.
- Each section's narration is 2 to 4 sentences, 35 to 70 words, written to be read aloud in plain English.
- Explain jargon the moment you use it, in the same sentence.
- DO NOT INVENT STATISTICS OR FACTS. Only state something if it is well established and checkable. If you are
  not certain of a figure, a date or a name, explain the mechanism in words instead and use no number. Never
  attribute a made-up percentage to a study, a company or a country. Being vague is better than being wrong.
- No clickbait, no "scientists were shocked", no padding, no calls to subscribe.
- Avoid medical, legal and financial advice. Explain how things work, never what the viewer should do.

{visuals}

These subjects were already covered, choose something different: {used}

Return ONLY JSON:
{{"title":"YouTube title under 70 characters. Phrase it the way people search: usually How <thing> actually works, or Why <thing> <surprising behaviour>",
  "topic_id":"short-slug-for-this-subject",
  "hook":"one or two sentences that open the video, read aloud before the first section",
  "sections":[{{"heading":"4 to 6 words on screen","narration":"...","visual":{{...}}}}],
  "takeaway":"one or two sentences that close the video",
  "description":"3 to 4 sentences for the YouTube description",
  "tags":["8 to 12 search tags"],
  "thumbnail_text":"3 to 5 words for the thumbnail"}}
"""

TOPICS = [
    "how a computer chip is actually made from sand",
    "how GPS works out where you are from space",
    "how face unlock tells you from a photograph of you",
    "how a large language model actually learns",
    "how a lithium battery stores and releases energy",
    "how the internet crosses oceans on the seabed",
    "how a data centre stops itself melting",
    "how noise cancelling headphones erase sound with sound",
    "how a touchscreen knows exactly where your finger is",
    "how satellites stay in orbit without falling",
    "how encryption keeps a message secret in the open",
    "how a self driving car sees and predicts the road",
    "how wifi carries data straight through a wall",
    "how a camera sensor turns light into a photograph",
    "how a fingerprint sensor reads a finger through glass",
    "how a hard drive physically stores a file",
    "how a solar panel turns sunlight into electricity",
    "how a jet engine pushes a plane forward",
    "how a rocket steers when there is nothing to push against",
    "how 5G differs from 4G in what it actually does",
    "how a microwave oven heats food from the inside out",
    "how fibre optic cable sends data as pulses of light",
    "how a quantum computer differs from the one on your desk",
    "how an LED screen makes every colour from three",
    "how a robot arm learns to pick up an unfamiliar object",
    "how a nuclear reactor turns atoms into electricity",
    "how a drone stays level in gusting wind",
    "how speech recognition turns sound into words",
    "how a car engine turns petrol into motion",
    "how an electric motor actually spins",
    "how a smartphone knows which way up it is",
    "how barcodes and QR codes survive being damaged",
    "how a search engine finds a page in a fraction of a second",
    "how image generators turn noise into a picture",
    "how a credit card payment clears between two banks",
    "how a lift decides which floor to go to next",
]


def choose_topic(used: list[str]) -> str:
    fresh = [t for t in TOPICS if t not in used]
    return random.choice(fresh or TOPICS)


def _clean(data: dict, wanted: int) -> dict:
    allowed = {"flow", "points", "compare", "bars", "number"}
    sections = data.get("sections", [])
    if not data.get("title") or not (3 <= len(sections) <= 9):
        raise ValueError("needs a title and 3-9 sections")
    for s in sections:
        s["heading"] = str(s.get("heading", "")).strip()[:60]
        s["narration"] = str(s.get("narration", "")).strip()
        if len(s["narration"].split()) < 12:
            raise ValueError("a section's narration is too short")
        v = s.get("visual") or {}
        if not isinstance(v, dict) or str(v.get("type", "")).lower() not in allowed:
            v = {"type": "points", "items": [s["heading"] or "..."]}
        v["type"] = str(v["type"]).lower()
        if v["type"] in ("flow", "points"):
            v["items"] = [str(x)[:70] for x in (v.get("items") or [])][:5] or [s["heading"]]
        if v["type"] == "bars":
            rows = []
            for r in (v.get("items") or [])[:5]:
                if isinstance(r, dict):
                    try:
                        rows.append({"label": str(r.get("label", ""))[:40], "value": float(r.get("value", 0))})
                    except (TypeError, ValueError):
                        continue
            if not rows:
                v = {"type": "points", "items": [s["heading"]]}
            else:
                v["items"] = rows
        if v["type"] == "compare":
            v["left"] = [str(x)[:60] for x in (v.get("left") or [])][:4]
            v["right"] = [str(x)[:60] for x in (v.get("right") or [])][:4]
            if not v["left"] or not v["right"]:
                v = {"type": "points", "items": [s["heading"]]}
        s["visual"] = v
    data["sections"] = sections
    data["title"] = str(data["title"]).strip()[:95]
    data.setdefault("topic_id", data["title"].lower().replace(" ", "-")[:40])
    data.setdefault("hook", "")
    data.setdefault("takeaway", "")
    data.setdefault("description", data["title"])
    data.setdefault("thumbnail_text", data["title"][:34])
    data.setdefault("tags", [])
    return data


def write_explainer(cfg: dict, used: list[str], topic: str | None = None) -> dict:
    from google import genai
    from google.genai import types

    xc = cfg.get("explainers", {})
    sections = int(xc.get("sections", 6))
    topic = topic or choose_topic(used)
    prompt = PROMPT.format(channel=cfg["channel"]["name"], topic=topic, sections=sections,
                           visuals=VISUALS, used=", ".join(used[-40:]) or "none")
    client = genai.Client(api_key=env("GEMINI_API_KEY"))
    models = pick_models(client, cfg["ai"].get("gemini_model", "auto"))
    last = None
    for attempt in range(5):
        model = models[min(attempt, len(models) - 1)]
        try:
            resp = client.models.generate_content(
                model=model, contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json",
                                                   temperature=0.8))
            data = _clean(json.loads(resp.text), sections)
            data["topic"] = topic
            log(f"Explainer written by {model}: {data['title']} ({len(data['sections'])} sections)")
            return data
        except Exception as exc:
            last = exc
            log(f"Explainer attempt {attempt + 1} failed: {exc}")
            if attempt < 4:
                time.sleep(20 * (attempt + 1))
    raise RuntimeError(f"Could not write an explainer: {last}")
