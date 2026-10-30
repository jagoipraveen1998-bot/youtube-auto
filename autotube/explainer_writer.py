"""Gemini writes today's explainer: a real question, answered with a mechanism."""
import json
import random
import time

from .script_writer import pick_models
from .util import env, log

VISUALS = """Each section carries one picture, and the picture is the point of the video.

PREFER a DRAWING of the real thing. These are animated: the lift moves, the ions drift, the
rotor turns. Use one whenever the section is about a physical mechanism. "labels" is 1 to 3
captions of at most 5 words each; leave it out if the drawing speaks for itself.
  {"type":"building","floors":5,"stops":[1,5,3],"labels":[...]}   a lift in a shaft, moving between floors
  {"type":"orbit","bodies":4,"labels":[...]}                       satellites circling, beaming down to a receiver
  {"type":"wave","mode":"travel"|"cancel"|"modulate","rows":["Noise","Anti-noise","You hear"],"labels":[...]}
                                                                   sound, radio, light as waves. cancel = two waves
                                                                   adding to silence; modulate = a signal riding a carrier
  {"type":"layers","items":["Glass","Electrode","Backlight"]}      a cross-section, 3 to 6 layers, scanned top to bottom
  {"type":"particles","left":"Anode","right":"Cathode","labels":[...]}  charge crossing a cell, with the outside circuit
  {"type":"rotor","teeth":11,"labels":[...]}                       anything that spins: motor, turbine, engine, gearbox
  {"type":"network","labels":[...]}                                one request fanning out to many machines
  {"type":"beam","labels":[...]}                                   light bouncing along inside a fibre or a pipe
  {"type":"grid_scan","labels":[...]}                              dots projected onto a surface and read back as depth
  {"type":"thermal","labels":[...]}                                racks making heat, and the air carrying it away
  {"type":"pipeline","items":["Your card","Merchant","Your bank"]} 2 to 5 stages with something travelling through them

Use a TEXT picture only when the section really is a list, a contrast or a figure:
  {"type":"flow","items":["step one","step two","step three"]}            a process, 3 to 5 steps
  {"type":"points","items":["first point","second point"]}                 2 to 5 short points
  {"type":"compare","left_title":"...","left":["..."],"right_title":"...","right":["..."]}
  {"type":"bars","unit":"%","items":[{"label":"...","value":42}]}          2 to 5 bars
  {"type":"number","value":"1 in 13","caption":"what the figure means"}    one striking figure

Across the whole video, at least half the sections must use a drawing rather than a text picture,
and do not use the same type twice in a row. Pick the drawing that matches what the narration
is describing at that moment - never one that merely looks impressive."""

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


def _texts(value, n: int, limit: int) -> list[str]:
    out = [str(x).strip()[:limit] for x in (value or []) if str(x).strip()]
    return out[:n]


def _scene(v: dict, heading: str) -> dict:
    """Keep a drawing's fields inside what the renderer can actually draw."""
    kind = v["type"]
    v["labels"] = _texts(v.get("labels"), 3, 44)
    if kind == "building":
        try:
            v["floors"] = max(3, min(6, int(v.get("floors", 5))))
        except (TypeError, ValueError):
            v["floors"] = 5
        stops = []
        for s in (v.get("stops") or [])[:4]:
            try:
                stops.append(max(1, min(v["floors"], int(s))))
            except (TypeError, ValueError):
                continue
        v["stops"] = stops or [1, v["floors"], 2]
    elif kind == "orbit":
        try:
            v["bodies"] = max(2, min(5, int(v.get("bodies", 4))))
        except (TypeError, ValueError):
            v["bodies"] = 4
    elif kind == "wave":
        mode = str(v.get("mode", "travel")).lower()
        v["mode"] = mode if mode in ("travel", "cancel", "modulate") else "travel"
        rows = {"cancel": 3, "modulate": 2}.get(v["mode"], 1)
        v["rows"] = _texts(v.get("rows"), rows, 18)
    elif kind == "rotor":
        try:
            v["teeth"] = max(7, min(14, int(v.get("teeth", 11))))
        except (TypeError, ValueError):
            v["teeth"] = 11
    elif kind == "particles":
        v["left"] = str(v.get("left", "Anode"))[:24]
        v["right"] = str(v.get("right", "Cathode"))[:24]
    elif kind in ("layers", "pipeline"):
        items = _texts(v.get("items"), 6 if kind == "layers" else 5, 40)
        if len(items) < 2:
            return {"type": "points", "items": [heading or "..."]}
        v["items"] = items
    return v


def _clean(data: dict, wanted: int) -> dict:
    from .explainer_scene import SCENES
    allowed = {"flow", "points", "compare", "bars", "number"} | set(SCENES)
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
        if v["type"] in SCENES:
            s["visual"] = _scene(v, s["heading"])
            continue
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
