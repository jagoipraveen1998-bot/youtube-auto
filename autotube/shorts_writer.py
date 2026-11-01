"""Gemini writes today's Short: one question, answered in under a minute.

A Short is not a trailer for the long video. It has to work on its own in the
feed: a surprising first line, a real mechanism in the middle, and a payoff
the viewer could repeat to someone else.
"""
import json
import random
import time

from .script_writer import pick_models
from .util import env, log

VISUALS = """Each beat carries one picture. Prefer a DRAWING of the real thing:
  {"type":"building","floors":5,"stops":[1,5,3]}   a lift moving in a shaft
  {"type":"orbit","bodies":4}                      satellites circling, beaming down
  {"type":"wave","mode":"travel"|"cancel"|"modulate","rows":["Noise","Anti-noise","You hear"]}
  {"type":"layers","items":["Glass","Electrode","Backlight"]}    a cross-section, 3 to 5 layers
  {"type":"particles","left":"Anode","right":"Cathode"}          charge crossing a cell
  {"type":"rotor","teeth":11}                      anything that spins
  {"type":"network"}                               a request fanning out to many machines
  {"type":"beam"}                                  light bouncing inside a fibre
  {"type":"grid_scan"}                             dots projected onto a surface, read as depth
  {"type":"thermal"}                               racks making heat, air carrying it away
  {"type":"pipeline","items":["Your card","Merchant","Your bank"]}   2 to 4 stages
Or, only when the beat really is one striking figure:
  {"type":"number","value":"1 in 13","caption":"what it means"}
Never use a bullet list in a Short: the big captions already carry the words."""

PROMPT = """You write 50-second vertical YouTube Shorts for the channel "{channel}".
The audience is curious adults in the UK and the US scrolling a feed. You have one second to stop them.

Today's subject: {topic}

Write {beats} beats. Rules that matter:
- Beat 1 is the hook: a concrete, surprising, specific fact. No "have you ever wondered", no "did you know".
  It must be a statement a person would stop scrolling for.
- Beats 2 to {last} explain the MECHANISM, step by step. The viewer should finish knowing how it really works.
- The final beat is the payoff: the one idea they could repeat to a friend. No call to subscribe.
- Each beat's narration is ONE or TWO short sentences, 12 to 26 words. Spoken English, no jargon left unexplained.
- The whole thing must read aloud in under 55 seconds. Be ruthless.
- DO NOT INVENT STATISTICS OR FACTS. If you are not certain of a figure, a date or a name, explain the
  mechanism in words and use no number. Never attribute a made-up percentage to a study or a company.
- No clickbait, no hype, no medical, legal or financial advice.

{visuals}

These subjects were already covered, choose something different: {used}

Return ONLY JSON:
{{"title":"under 60 characters, phrased the way people search, ending in #Shorts",
  "topic_id":"short-slug",
  "beats":[{{"caption":"2 to 4 words on screen","narration":"...","visual":{{...}}}}],
  "description":"2 sentences for the description",
  "tags":["8 to 12 search tags"]}}
"""

TOPICS = [
    "why aeroplane windows have a tiny hole in them",
    "how a lift decides which floor to go to next",
    "why phone batteries stop holding charge after two years",
    "how noise cancelling erases sound with more sound",
    "how your phone knows which way up it is",
    "why wet roads look like mirrors at night",
    "how a microwave heats food but not the plate",
    "how face unlock tells you from a photograph",
    "why fibre optic cable is faster than copper",
    "how a touchscreen knows which finger is which",
    "why rockets are thinner at the top",
    "how GPS works out where you are from space",
    "why data centres are built next to cold water",
    "how a credit card payment clears in two seconds",
    "why chips are made in rooms cleaner than hospitals",
    "how a camera sensor turns light into numbers",
    "why aeroplanes fly higher than the weather",
    "how a hard drive stores a file physically",
    "why electric motors do not need gears",
    "how encryption keeps a message secret in the open",
    "why solar panels work better when they are cold",
    "how a search engine answers in a fraction of a second",
    "why bridges have gaps in them",
    "how a QR code survives being torn",
    "why jet engines have so many blades",
    "how image generators turn noise into a picture",
    "why your wifi is slower in the next room",
    "how a fingerprint sensor reads through glass",
    "why nuclear fuel rods are kept under water",
    "how a lithium battery actually stores energy",
]


def choose_topic(used: list[str]) -> str:
    fresh = [t for t in TOPICS if t not in used]
    return random.choice(fresh or TOPICS)


def _clean(data: dict, wanted: int) -> dict:
    from .explainer_scene import SCENES
    from .explainer_writer import _scene
    allowed = {"number"} | set(SCENES)
    beats = data.get("beats", [])
    if not data.get("title") or not (2 <= len(beats) <= 7):
        raise ValueError("needs a title and 2-7 beats")
    for b in beats:
        b["caption"] = str(b.get("caption", "")).strip()[:30]
        b["narration"] = str(b.get("narration", "")).strip()
        if len(b["narration"].split()) < 6:
            raise ValueError("a beat's narration is too short")
        v = b.get("visual") or {}
        if not isinstance(v, dict) or str(v.get("type", "")).lower() not in allowed:
            v = {"type": "number", "value": b["caption"] or "...", "caption": ""}
        v["type"] = str(v["type"]).lower()
        if v["type"] in SCENES:
            v = _scene(v, b["caption"])
        else:
            v = {"type": "number", "value": str(v.get("value", b["caption"]))[:38],
                 "caption": str(v.get("caption", ""))[:60]}
        b["visual"] = v
    words = sum(len(b["narration"].split()) for b in beats)
    if words > 170:                      # about 60 seconds at a natural pace
        raise ValueError(f"script is {words} words, too long for a Short")
    data["beats"] = beats
    title = str(data["title"]).strip()
    if "#shorts" not in title.lower():
        title = f"{title[:85]} #Shorts"
    data["title"] = title[:95]
    data.setdefault("topic_id", title.lower().replace(" ", "-")[:40])
    data.setdefault("description", title)
    data.setdefault("tags", [])
    return data


def write_short(cfg: dict, used: list[str], topic: str | None = None) -> dict:
    from google import genai
    from google.genai import types

    sc = cfg.get("shorts", {})
    beats = int(sc.get("beats", 5))
    topic = topic or choose_topic(used)
    prompt = PROMPT.format(channel=cfg["channel"]["name"], topic=topic, beats=beats,
                           last=beats - 1, visuals=VISUALS, used=", ".join(used[-40:]) or "none")
    client = genai.Client(api_key=env("GEMINI_API_KEY"))
    models = pick_models(client, cfg["ai"].get("gemini_model", "auto"))
    last = None
    for attempt in range(5):
        model = models[min(attempt, len(models) - 1)]
        try:
            resp = client.models.generate_content(
                model=model, contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json",
                                                   temperature=0.9))
            data = _clean(json.loads(resp.text), beats)
            data["topic"] = topic
            log(f"Short written by {model}: {data['title']} ({len(data['beats'])} beats)")
            return data
        except Exception as exc:
            last = exc
            log(f"Short attempt {attempt + 1} failed: {exc}")
            if attempt < 4:
                time.sleep(20 * (attempt + 1))
    raise RuntimeError(f"Could not write a Short: {last}")
