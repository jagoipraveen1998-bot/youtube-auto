"""Gemini writes one original horror Short for CreepyCartoonTales: narration + a shot plan.

The shot plan uses a fixed vocabulary that the cartoon player (horror/web/player.js) knows how to
draw, so every story can be animated with no human in the loop. Anything Gemini returns outside that
vocabulary is repaired to a safe default rather than failing the run.
"""
import json
from pathlib import Path
import random
import re
import time

from .script_writer import pick_models
from .util import env, log

PLATES_DIR = Path(__file__).resolve().parent.parent / "horror" / "plates"


def town_places() -> list[str]:
    """Painted places of our own town (Creepyville) that exist today; the library grows every day."""
    return sorted(p.stem for p in PLATES_DIR.glob("*.jpg"))


def town_things() -> list[str]:
    """Painted objects and animals of Creepyville that exist today."""
    return sorted(p.stem for p in (PLATES_DIR.parent / "props").glob("*.png"))


SCENES = {
    "place": "a painted location in our own town of Creepyville (set \"place\" to one of the town's places listed below). "
             "The hero stands or walks there and reacts; nothing in the place moves. Use it to open a new location, for travel, "
             "and for calm or funny beats outdoors. focus: hero or wide",
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

PROMPT = """You write ORIGINAL short animated HORROR-COMEDY stories for the YouTube Shorts channel "CreepyCartoonTales".
Style: creepy AND a little funny, never gory. It is told in the SECOND PERSON, present tense, so the viewer is IN the
situation: "Imagine...", "You...", "But what if...". The hero on screen is "you". The storyteller talks straight to the
viewer like a friend daring them. Shape:
  1. "Imagine..." a normal, relatable moment with a real feeling (you lost your dog, it is your birthday, you are home alone).
  2. Something good or ordinary happens, and the viewer feels it ("you feel like the happiest person in the world").
  3. "But what if..." one small wrong detail, then it escalates step by step, each detail creepier and more specific.
  4. The reveal that turns it upside down.
  5. The last lines ask the viewer directly what they would do, then tease the next part.
Example of the voice (do not copy the story): "Imagine your dog went missing two days ago, and suddenly you hear
barking outside. You rush out and there it is. You feel like the happiest person in the world. But what if, after you
bring your dog inside, it goes to the bathroom the same way you do? Then, while you're sitting there, you hear a voice
whispering your name. Your dog is standing on two legs. And then, just like that, it drops back onto four. What would
you do? Part two is coming next, so follow so you don't miss it."
Keep one or two light funny touches (a deadpan line, an absurdly specific detail). Characters TALK: use 4 to 7 short dialogue lines (the hero, the
villain, or a side character) between the narration. Spooky fun, safe for teenagers: no blood, no gore, no weapons,
no self-harm, no real people, no real brands, nothing sexual, no animal harm.

The story must be told with these animated sets only (the narration must fit what can be shown):
{scenes}

The villain ("other") is one of: double (the hero's exact double, wearing a different shirt), shadow (a pitch-black
silhouette with glowing eyes), ghost (a pale see-through person), doll (a cracked porcelain doll with button eyes and a
bow), neighbour (an overly friendly bald neighbour with a moustache and glasses), tall (an unnaturally tall thin figure
in a suit), delivery (a smiling delivery man holding a parcel). other.state: hidden | back (seen from behind) | front |
stare | grin | tired | lurk.
Side characters (optional, at most 2): mum | dad | grandma | grandpa | roommate | friend | sister | brother | officer.
To show a side character in a shot set "side": "<role>" (only in kitchen, closeup or bedroom) and "sideExpr" (calm |
worried | shock | relieved | curious).
speaker = who says the line: narrator (the hero telling the story) | hero (the hero speaking out loud in the scene) |
villain | one of the side roles. Dialogue lines are written as speech only, without "she said". When the hero or a side
character speaks, show them in that shot; when the villain speaks, show the villain.
hero.pose: sit | sleep | stand | walk | run (only in a place: he runs across it, sweating) | peek | cheeks (hands on cheeks) | reach. In a place, hero.dir is left or right. hero.expr and hero.expr2 (the face after
the beat): calm | sleepy | curious | worried | shock | scream | relieved | tired | stare.
cam: wide | medium | close | push_in | pull_out | pan | snap (cut in hard on the beat word) | low (from the floor looking up: he looks big, for brave or shocked moments) | high (looking down: he looks small and alone) | dutch (tilted frame: something is wrong) | crash (sudden zoom in on the reveal) | track (follows him as he walks or runs). focus picks what the camera
moves to. react = what happens ON the beat word: none | gag (a big cartoon comedy take: eyes pop, hair flies, slide
whistle and boing; use it 2 or 3 times on the funniest lines) | jolt (hero jumps) | ring (a phone or alarm rings) | knock |
lights_on | lights_off | flicker | appear (the other appears) | vanish | turn (the other turns round to face us) |
grin (the other grins) | droop (the other or hero looks exhausted) | text_change (the on-screen text changes).

Rules:
- 22 to 28 beats. Each beat is ONE spoken sentence of 3 to 15 words, plain spoken English, contractions, numbers in words.
  Total 290 to 330 words, so the Short runs about 95 to 115 seconds at a quick storytelling pace (never under 90). Build it in three acts: the hook
  and setup, a middle with at least two escalating scares and two laughs (a false calm, a second encounter), then the
  pivot and twist. Every beat must move the story; no padding or repeated ideas. Use a different villain type and setting mix from the stories already told.
- Sentence 1 is the hook and must make the viewer need the answer: either a creepy paradox stated as fact, or a
  "why / what happens if" question the story then answers (like "Why my grandma never answers the door after 3AM.").
  {ending}
- Shoot it like a film: a wide or high establishing shot each time the scene changes; track him when he walks or runs
  between places (run when he is scared or late); low angle when he is brave or shocked, dutch when something feels
  wrong, crash on the reveal; close, snap and push_in on reactions.
  Never use the same cam on two beats in a row. Keep most lines short (3 to 10 words) so a new shot comes every 2 to 3
  seconds.
- Every beat names its scene, and the narration must match what that scene can show. Use 7 to 10 different scenes.
- beat_word is ONE word copied exactly from that beat's line where the react happens.
- jump = true when the story jumps in time (a new day, later that night).
- Exactly one beat has twist = true: the reveal, near the end.
- Keep text props short and in capitals for cctv/calendar.
- These stories were already told, write something clearly different: {used}

The hero ("you" on screen) is always a boy or a young man: the channel has one storyteller voice.
Return ONLY JSON:
{{"title":"YouTube title under 70 characters that opens a question the viewer needs answered (a why / what-if or a paradox), end with #shorts #horror",
  "story_id":"short-slug",
  "description":"2 sentences that tease the story without spoiling the twist",
  "tags":["8 to 12 search tags"],
  "hero":{{"look":"boy|man","outfit":"pj|hoodie|tee|shirt"}},
  "villain":"double|shadow|ghost|doll|neighbour|tall|delivery",
  "cast":[{{"role":"mum"}}],
  "beats":[{{"line":"...","speaker":"narrator","side":null,"sideExpr":null,"scene":"...","place":"(only for scene place)","things":[],"cam":"...","focus":"...","hero":{{"pose":"...","expr":"...","expr2":"..."}} or null,
            "other":{{"state":"...","where":"..."}} or null,"react":"...","beat_word":"...","jump":false,"twist":false,
            "light":"dark|dawn|on|flicker","room":"kitchen|bedroom","prop":"shoes|shirt|none","fx":["rain"],
            "text":{{"top":"","big":"","label":"","time":"","time2":"","from":"","msg":"","msg2":""}}}}]}}
"""

POSES = {"sit", "sleep", "stand", "walk", "run", "peek", "cheeks", "reach"}
EXPRS = {"calm", "sleepy", "curious", "worried", "shock", "scream", "relieved", "tired", "stare", "grin"}
STATES = {"hidden", "back", "front", "stare", "grin", "tired", "lurk"}
CAMS = {"wide", "medium", "close", "push_in", "pull_out", "pan", "snap", "low", "high", "dutch", "crash", "track"}
REACTS = {"none", "gag", "jolt", "ring", "knock", "lights_on", "lights_off", "flicker", "appear", "vanish", "turn", "grin",
          "droop", "text_change"}
WHERE = {"bedroom": {"door", "window", "beside"}, "front_door": {"under_door", "peephole"}}
SCENE_POSE = {"bedroom": {"sit", "sleep"}, "hallway": {"peek"}, "kitchen": {"stand", "walk", "reach", "cheeks"},
              "front_door": {"stand", "cheeks"}, "wardrobe": {"stand", "cheeks"}, "desk": {"stand"},
              "bathroom": {"stand"}, "closeup": {"stand"}, "place": {"stand", "walk", "run", "cheeks", "reach"}}
NO_HERO = {"calendar", "phone", "window", "cctv"}


def _caps(s, n):
    return re.sub(r"[^A-Z0-9:.,'!? -]", "", str(s or "").upper())[:n].strip()


def _plain(s, n):
    return re.sub(r"[<>{}\\]", "", str(s or ""))[:n].strip()


ROLES = {"mum", "dad", "grandma", "grandpa", "roommate", "friend", "sister", "brother", "officer", "daughter", "son", "landlord"}
SIDE_SCENES = {"kitchen", "closeup", "bedroom"}
VILLAINS = {"double", "shadow", "ghost", "doll", "neighbour", "tall", "delivery"}


def repair(story: dict) -> dict:
    """Force every field into the player's vocabulary so the render can never break."""
    cast = []
    for c in story.get("cast") or []:
        role = (c.get("role") if isinstance(c, dict) else str(c)).lower().strip()
        if role in ROLES and role not in [x["role"] for x in cast]:
            cast.append({"role": role})
    story["cast"] = cast[:4]
    roles = {c["role"] for c in story["cast"]}
    beats = []
    for b in story.get("beats", []):
        line = _plain(b.get("line"), 160)
        if not line:
            continue
        scene = b.get("scene") if b.get("scene") in SCENES else "closeup"
        if scene == "place":
            pl = str(b.get("place") or "")
            if pl not in town_places():
                scene = "closeup"
        out = {"line": line, "scene": scene,
               "cam": b.get("cam") if b.get("cam") in CAMS else "push_in",
               "focus": str(b.get("focus") or "")[:12] or None,
               "react": b.get("react") if b.get("react") in REACTS else "none",
               "beat_word": str(b.get("beat_word") or "").strip(" .,!?\"'").lower(),
               "jump": bool(b.get("jump")), "twist": bool(b.get("twist")),
               "place": str(b.get("place")) if scene == "place" else None,
               "things": [t for t in (b.get("things") or []) if t in town_things()][:2] if scene == "place" else [],
               "light": b.get("light") if b.get("light") in {"dark", "dawn", "on", "flicker"} else None,
               "room": "bedroom" if b.get("room") == "bedroom" else "kitchen",
               "prop": b.get("prop") if b.get("prop") in {"shoes", "shirt"} else None,
               "fx": [x for x in (b.get("fx") or []) if x in {"rain", "steam"}],
               "chapter": _plain(b.get("chapter"), 60) or None}
        sp = str(b.get("speaker") or "narrator").lower().strip()
        out["speaker"] = sp if sp in {"narrator", "hero", "villain"} | roles else "narrator"
        side = str(b.get("side") or "").lower().strip()
        if out["speaker"] in roles and not side:
            side = out["speaker"]
        if side in roles and scene in SIDE_SCENES:
            out["side"] = side
            out["sideExpr"] = b.get("sideExpr") if b.get("sideExpr") in EXPRS else "calm"
        elif out["speaker"] in roles:   # a side character speaking somewhere they can't be drawn: talk in close-up
            out["scene"] = scene = "closeup"; out["side"] = out["speaker"]; out["sideExpr"] = "calm"; out["cam"] = "close"
        if out["speaker"] == "hero" and scene in NO_HERO:
            out["scene"] = scene = "closeup"
        h = b.get("hero")
        if scene not in NO_HERO and isinstance(h, dict):
            allowed = SCENE_POSE.get(scene, {"stand"})
            pose = h.get("pose") if h.get("pose") in allowed else sorted(allowed)[0] if scene != "bedroom" else "sit"
            out["hero"] = {"pose": pose,
                           "expr": h.get("expr") if h.get("expr") in EXPRS else "worried",
                           "expr2": h.get("expr2") if h.get("expr2") in EXPRS else None,
                           "dir": "left" if h.get("dir") == "left" else "right"}
        elif (scene in {"bedroom", "hallway", "bathroom"} or (scene == "cctv" and out["room"] == "bedroom")
              or (scene == "closeup" and not out.get("side") and out["speaker"] != "villain"
                  and not (isinstance(b.get("other"), dict) and b["other"].get("state") not in (None, "hidden")))):
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
        if out["speaker"] == "villain" and not out["other"] and not out.get("side"):
            out["other"] = {"state": "stare", "where": sorted(WHERE.get(scene, {"door"}))[0]}
        if out.get("side") and scene == "closeup":
            out["hero"] = None
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
    story["hero"] = {"look": hero.get("look") if hero.get("look") in {"boy", "girl", "man", "woman"} else "boy",
                     "outfit": hero.get("outfit") if hero.get("outfit") in {"pj", "hoodie", "tee", "nightie", "shirt"} else None}
    story["villain"] = story.get("villain") if story.get("villain") in VILLAINS else "shadow"
    story["villain_look"] = story.get("villain_look") if story.get("villain_look") in {"boy", "girl", "man", "woman"} else None
    story["beats"] = beats
    story["title"] = _plain(story.get("title"), 95) or "I live alone... so who was that? #shorts #horror"
    story["description"] = _plain(story.get("description"), 400)
    story["tags"] = [_plain(t, 40) for t in (story.get("tags") or []) if t][:12]
    story["story_id"] = re.sub(r"[^a-z0-9-]", "", str(story.get("story_id") or "").lower())[:40] or f"story-{random.randint(1000, 9999)}"
    return story


def lock_script(story: dict, script: dict) -> dict:
    """Keep Praveen's approved words exactly: one beat per script line, staging taken from what Gemini planned."""
    lines = [l.lstrip("*").strip() for l in script["lines"]]
    twist_i = next((i for i, l in enumerate(script["lines"]) if l.startswith("*")), max(0, len(lines) - 3))
    src = story["beats"]
    out = []
    for i, line in enumerate(lines):
        b = dict(src[min(len(src) - 1, round(i * len(src) / len(lines)))]) if len(src) != len(lines) else dict(src[i])
        b["line"] = line
        ws = [w.strip(" .,!?\"'…").lower() for w in line.split()]
        if b.get("beat_word", "") not in ws:
            b["beat_word"] = next((w for w in reversed(ws) if len(w) > 3), ws[-1] if ws else "")
        b["twist"] = i == twist_i
        out.append(b)
    story["beats"] = out
    story["title"] = script["title"]
    story["story_id"] = script["id"]
    if script.get("description"):
        story["description"] = script["description"]
    if script.get("star"):
        story["star"] = script["star"]           # the animal/object the story is about: on screen whenever it's mentioned
    return story


def write_story(cfg: dict, used: list[str], hint: str | None = None, part_of: dict | None = None,
                script: dict | None = None) -> dict:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=env("GEMINI_API_KEY"))
    scenes = "\n".join(f"- {k}: {v}" for k, v in SCENES.items())
    places = town_places()
    if places:
        scenes += "\nCreepyville places for scene \"place\": " + ", ".join(places) + \
                  ". Set the story in this town; mix painted places with the drawn scenes."
    things = town_things()
    if things:
        scenes += ("\nObjects and animals for a place beat (\"things\": up to 2, they stand beside the hero): "
                   + ", ".join(things) + ". Use them when the line mentions them; a recurring animal or object makes a "
                   "running joke viewers remember.")
    if part_of:
        ending = ("This is PART 2 of the story below. Line 1 is a one-line recap starting \"Last time...\" and then it "
                  "continues the SAME situation, the same villain, the same places. Escalate once more, then resolve it with "
                  "a final twist that is creepy and a little funny. The last two lines ask the viewer what they would have "
                  "done and invite them to comment and follow for more. Title ends with (Part 2) before the hashtags.\n"
                  f"PART 1 was: {part_of['title']}\n" + " ".join(part_of["lines"]))
    else:
        ending = ("The story stops on a cliffhanger right after the reveal: do NOT resolve it. The last two lines are a "
                  "direct question to the viewer (\"What would you do?\") and a tease: part two is coming next, so follow. "
                  "Title is a curiosity hook ending with (Part 1) before the hashtags.")
    prompt = PROMPT.format(scenes=scenes, used="; ".join(used[-60:]) or "none yet", ending=ending)
    if hint:
        prompt += f"\nFor this story: {hint}\n"
    if script:
        numbered = "\n".join(f"{i + 1}. {l.lstrip('*').strip()}" for i, l in enumerate(script["lines"]))
        prompt += ("\nIMPORTANT: the story is ALREADY WRITTEN and approved. Do not write or change any words. Make exactly "
                   f"{len(script['lines'])} beats, one per line below, in this order, with each line copied EXACTLY; your job is "
                   "only the staging (speaker, scene/place, things, cam, hero, other, react, beat_word, light, twist). "
                   "Lines in quotes are spoken by the character who says them; the rest is the storyteller (narrator). "
                   f"Title: {script['title']}\n{numbered}\n")
    models = pick_models(client, cfg.get("ai", {}).get("gemini_model", "auto"))
    last = None
    models = models + [m for m in ("gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-2.5-flash") if m not in models]
    dead = set()
    for attempt in range(16):
        # "503 high demand" is common: rotate through the models that can still answer, waiting longer each time
        alive = [m for m in models if m not in dead]
        if not alive:
            break
        model = alive[attempt % len(alive)]
        try:
            resp = client.models.generate_content(
                model=model, contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json", temperature=1.0))
            story = repair(json.loads(resp.text))
            words = sum(len(b["line"].split()) for b in story["beats"])
            if script:
                story = lock_script(story, script)
                words = sum(len(b["line"].split()) for b in story["beats"])
            elif not 260 <= words <= 360:
                raise ValueError(f"story is {words} words")
            log(f"Story written by {model}: '{story['title']}' ({len(story['beats'])} beats, {words} words)")
            return story
        except Exception as exc:
            last = exc
            msg = str(exc)
            if "404" in msg or "limit: 0" in msg or "PerDay" in msg:      # gone, or no quota today: stop asking it
                dead.add(model)
                log(f"Gemini {model} cannot answer today ({msg[:90]}); skipping it")
                continue
            log(f"Gemini attempt {attempt + 1} ({model}) failed: {msg[:200]}")
            time.sleep(min(60, 10 * (attempt + 1)))
    raise RuntimeError(f"Could not get a story from Gemini: {last}")
