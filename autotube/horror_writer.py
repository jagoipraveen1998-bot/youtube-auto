"""Gemini writes one original horror Short for CreepyCartoonTales: narration + a shot plan.

The shot plan uses a fixed vocabulary that the cartoon player (horror/web/player.js) knows how to
draw, so every story can be animated with no human in the loop. Anything Gemini returns outside that
vocabulary is repaired to a safe default rather than failing the run.
"""
import json
import random
import re
import time

from .script_writer import pick_models
from .util import env, log

SCENES = {
    "bedroom": "the hero's bedroom at night; the hero sits up in bed (pose sit) or is asleep (pose sleep). "
               "other.where = door | window | beside (standing by the bed). focus can be hero, prop (the nightstand), window, door, other",
    "hallway": "a dark hallway seen from the bedroom door, a glowing kitchen doorway at the end. the hero peeks in from the edge "
               "(pose peek). the other can stand small and dark in the glowing doorway. focus: hero, door, other",
    "kitchen": "the kitchen, a mug of coffee on the counter. hero pose stand or walk (walks in). the other can stand at the counter. "
               "light = dark | dawn | on | flicker. focus: hero, prop (the mug), other",
    "front_door": "the front door from inside. the hero stands to the right looking at it. prop = shoes (neatly placed shoes) or none. "
                  "other.where = under_door (two feet shadows in the light under the door) | peephole (a red glow in the peephole). "
                  "focus: hero, door, prop, peephole, other",
    "wardrobe": "a tall wardrobe. prop = shirt (a perfectly ironed shirt hanging on it) or none. the other can watch through the gap "
                "between the doors (glowing eyes). focus: hero, prop, gap, other",
    "desk": "the hero at a laptop late at night, face lit by the screen. the other can stand in the dark BEHIND the hero. focus: hero, prop, other",
    "cctv": "green night-vision security camera footage with a timestamp. room = kitchen (the other at the counter, lights can switch on) "
            "or bedroom (the hero asleep in bed, the other standing beside the bed). text.label (e.g. CAM 01), text.time (e.g. THU 03:12), "
            "text.time2 for a text_change. focus: wide, other",
    "calendar": "a wall calendar close-up. text.top = day name (MONDAY), text.big = date number (13); top2/big2 for a text_change",
    "phone": "a phone screen with one message. text.from, text.msg (max 12 words), text.time (e.g. 3:07). msg2/from2 for a text_change",
    "bathroom": "a bathroom mirror; we see the back of the hero's head and their reflection. if other.state is set, the REFLECTION "
                "behaves as the other (e.g. it grins while the hero is shocked). focus: hero (the mirror), other",
    "window": "a window at night from inside, the other's face or silhouette outside. fx can include rain. focus: wide, other",
    "closeup": "a close-up of the hero's face against a dark background, for big reactions. tint = a CSS colour for the rim light",
}

PROMPT = """You write ORIGINAL very short animated horror stories for the YouTube Shorts channel "CreepyCartoonTales".
Style: creepy, never gory. A cartoon everyman narrates in the first person. A paradox hook, escalating unease,
a pivot, and an ironic twist in the very last words. Spooky fun, safe for teenagers: no blood, no gore, no weapons,
no self-harm, no real people, no real brands, nothing sexual, no animal harm.

The story must be told with these animated sets only (the narration must fit what can be shown):
{scenes}

The villain ("other") is one of: double (the hero's exact double, wearing a different shirt), shadow (a pitch-black
silhouette with glowing eyes), ghost (a pale see-through version of a person). other.state: hidden | back (seen from
behind) | front | stare | grin | tired | lurk.
hero.pose: sit | sleep | stand | walk | peek | cheeks (hands on cheeks) | reach. hero.expr and hero.expr2 (the face after
the beat): calm | sleepy | curious | worried | shock | scream | relieved | tired | stare.
cam: wide | medium | close | push_in | pull_out | pan | snap (cut in hard on the beat word). focus picks what the camera
moves to. react = what happens ON the beat word: none | jolt (hero jumps) | ring (a phone or alarm rings) | knock |
lights_on | lights_off | flicker | appear (the other appears) | vanish | turn (the other turns round to face us) |
grin (the other grins) | droop (the other or hero looks exhausted) | text_change (the on-screen text changes).

Rules:
- 7 to 11 beats. Each beat is ONE spoken sentence of 3 to 14 words, plain spoken English, contractions, numbers in words.
  Total 85 to 120 words.
- Sentence 1 is the hook: a creepy paradox stated as fact. The last sentence is the twist: short, ironic, surprising.
- Every beat names its scene, and the narration must match what that scene can show. Use 4 to 7 different scenes.
- beat_word is ONE word copied exactly from that beat's line where the react happens.
- jump = true when the story jumps in time (a new day, later that night).
- Exactly one beat has twist = true: the reveal, near the end.
- Keep text props short and in capitals for cctv/calendar.
- These stories were already told, write something clearly different: {used}

Return ONLY JSON:
{{"title":"YouTube title under 70 characters, curiosity-driven, end with #shorts #horror",
  "story_id":"short-slug",
  "description":"2 sentences that tease the story without spoiling the twist",
  "tags":["8 to 12 search tags"],
  "hero":{{"look":"boy|girl","outfit":"pj|hoodie|tee|nightie|shirt"}},
  "villain":"double|shadow|ghost",
  "beats":[{{"line":"...","scene":"...","cam":"...","focus":"...","hero":{{"pose":"...","expr":"...","expr2":"..."}} or null,
            "other":{{"state":"...","where":"..."}} or null,"react":"...","beat_word":"...","jump":false,"twist":false,
            "light":"dark|dawn|on|flicker","room":"kitchen|bedroom","prop":"shoes|shirt|none","fx":["rain"],
            "text":{{"top":"","big":"","label":"","time":"","time2":"","from":"","msg":"","msg2":""}}}}]}}
"""

POSES = {"sit", "sleep", "stand", "walk", "peek", "cheeks", "reach"}
EXPRS = {"calm", "sleepy", "curious", "worried", "shock", "scream", "relieved", "tired", "stare", "grin"}
STATES = {"hidden", "back", "front", "stare", "grin", "tired", "lurk"}
CAMS = {"wide", "medium", "close", "push_in", "pull_out", "pan", "snap"}
REACTS = {"none", "jolt", "ring", "knock", "lights_on", "lights_off", "flicker", "appear", "vanish", "turn", "grin",
          "droop", "text_change"}
WHERE = {"bedroom": {"door", "window", "beside"}, "front_door": {"under_door", "peephole"}}
SCENE_POSE = {"bedroom": {"sit", "sleep"}, "hallway": {"peek"}, "kitchen": {"stand", "walk", "reach", "cheeks"},
              "front_door": {"stand", "cheeks"}, "wardrobe": {"stand", "cheeks"}, "desk": {"stand"},
              "bathroom": {"stand"}, "closeup": {"stand"}}
NO_HERO = {"calendar", "phone", "window", "cctv"}


def _caps(s, n):
    return re.sub(r"[^A-Z0-9:.,'!? -]", "", str(s or "").upper())[:n].strip()


def _plain(s, n):
    return re.sub(r"[<>{}\\]", "", str(s or ""))[:n].strip()


def repair(story: dict) -> dict:
    """Force every field into the player's vocabulary so the render can never break."""
    beats = []
    for b in story.get("beats", []):
        line = _plain(b.get("line"), 160)
        if not line:
            continue
        scene = b.get("scene") if b.get("scene") in SCENES else "closeup"
        out = {"line": line, "scene": scene,
               "cam": b.get("cam") if b.get("cam") in CAMS else "push_in",
               "focus": str(b.get("focus") or "")[:12] or None,
               "react": b.get("react") if b.get("react") in REACTS else "none",
               "beat_word": str(b.get("beat_word") or "").strip(" .,!?\"'").lower(),
               "jump": bool(b.get("jump")), "twist": bool(b.get("twist")),
               "light": b.get("light") if b.get("light") in {"dark", "dawn", "on", "flicker"} else None,
               "room": "bedroom" if b.get("room") == "bedroom" else "kitchen",
               "prop": b.get("prop") if b.get("prop") in {"shoes", "shirt"} else None,
               "fx": [x for x in (b.get("fx") or []) if x in {"rain", "steam"}]}
        h = b.get("hero")
        if scene not in NO_HERO and isinstance(h, dict):
            allowed = SCENE_POSE.get(scene, {"stand"})
            pose = h.get("pose") if h.get("pose") in allowed else sorted(allowed)[0] if scene != "bedroom" else "sit"
            out["hero"] = {"pose": pose,
                           "expr": h.get("expr") if h.get("expr") in EXPRS else "worried",
                           "expr2": h.get("expr2") if h.get("expr2") in EXPRS else None}
        elif (scene in {"bedroom", "hallway", "bathroom"} or (scene == "cctv" and out["room"] == "bedroom")
              or (scene == "closeup" and not (isinstance(b.get("other"), dict) and b["other"].get("state") not in (None, "hidden")))):
            out["hero"] = {"pose": "sleep" if scene == "cctv" else ("peek" if scene == "hallway" else "sit" if scene == "bedroom" else "stand"),
                           "expr": "asleep" if scene == "cctv" else "worried", "expr2": None}
        else:
            out["hero"] = None
        o = b.get("other")
        if isinstance(o, dict) and o.get("state") in STATES and o.get("state") != "hidden":
            w = o.get("where")
            out["other"] = {"state": o["state"], "where": w if w in WHERE.get(scene, {w}) else sorted(WHERE.get(scene, {"door"}))[0]}
        else:
            out["other"] = None
        if out["react"] in {"turn", "grin", "appear", "vanish"} and not out["other"]:
            out["other"] = {"state": "back" if out["react"] == "turn" else "stare", "where": sorted(WHERE.get(scene, {"door"}))[0]}
        if scene in {"window"} and not out["other"]:
            out["other"] = {"state": "lurk", "where": None}
        t = b.get("text") or {}
        out["text"] = {"top": _caps(t.get("top"), 9) or "MONDAY", "big": _caps(t.get("big"), 3) or "13",
                       "top2": _caps(t.get("top2"), 9) or None, "big2": _caps(t.get("big2"), 3) or None,
                       "label": _caps(t.get("label"), 14) or "CAM 01", "time": _caps(t.get("time"), 9) or "THU 03:00",
                       "time2": _caps(t.get("time2"), 9) or None,
                       "from": _plain(t.get("from"), 18) or "Unknown", "msg": _plain(t.get("msg"), 90) or "...",
                       "msg2": _plain(t.get("msg2"), 90) or None, "from2": _plain(t.get("from2"), 18) or None}
        beats.append(out)
    if len(beats) < 4:
        raise ValueError("story has fewer than 4 usable beats")
    if not any(b["twist"] for b in beats):
        beats[-2 if len(beats) > 4 else -1]["twist"] = True
    hero = story.get("hero") or {}
    story["hero"] = {"look": "girl" if hero.get("look") == "girl" else "boy",
                     "outfit": hero.get("outfit") if hero.get("outfit") in {"pj", "hoodie", "tee", "nightie", "shirt"} else "pj"}
    story["villain"] = story.get("villain") if story.get("villain") in {"double", "shadow", "ghost"} else "shadow"
    story["beats"] = beats
    story["title"] = _plain(story.get("title"), 95) or "I live alone... so who was that? #shorts #horror"
    story["description"] = _plain(story.get("description"), 400)
    story["tags"] = [_plain(t, 40) for t in (story.get("tags") or []) if t][:12]
    story["story_id"] = re.sub(r"[^a-z0-9-]", "", str(story.get("story_id") or "").lower())[:40] or f"story-{random.randint(1000, 9999)}"
    return story


def write_story(cfg: dict, used: list[str]) -> dict:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=env("GEMINI_API_KEY"))
    scenes = "\n".join(f"- {k}: {v}" for k, v in SCENES.items())
    prompt = PROMPT.format(scenes=scenes, used="; ".join(used[-60:]) or "none yet")
    models = pick_models(client, cfg.get("ai", {}).get("gemini_model", "auto"))
    last = None
    models = models + [m for m in ("gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-2.5-flash") if m not in models]
    for attempt in range(10):
        # "503 high demand" is common: rotate through every model, waiting longer each time (~7 min in all)
        model = models[attempt % len(models)]
        try:
            resp = client.models.generate_content(
                model=model, contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json", temperature=1.0))
            story = repair(json.loads(resp.text))
            words = sum(len(b["line"].split()) for b in story["beats"])
            if not 60 <= words <= 150:
                raise ValueError(f"story is {words} words")
            log(f"Story written by {model}: '{story['title']}' ({len(story['beats'])} beats, {words} words)")
            return story
        except Exception as exc:
            last = exc
            log(f"Gemini attempt {attempt + 1} failed: {exc}")
            time.sleep(min(70, 8 * (attempt + 1)))
    raise RuntimeError(f"Could not get a story from Gemini: {last}")
