"""Turn the user's own script into an 8-10 minute landscape (16:9) horror cartoon.

Script format (plain text, UTF-8):
    # Chapter title            -> starts a chapter (shown as YouTube chapters)
    MUM: Who's at the door?    -> a character speaking (NAME: line)
    Anything else              -> narration, told by the hero in the first person

The words are used exactly as written. Gemini only plans the pictures (which set, camera, faces, what
happens on which word); if Gemini is unavailable a keyword planner does it instead, so the video is
always made.
"""
import json
import re
import time

from .horror_writer import (CAMS, EXPRS, REACTS, ROLES, SCENES, STATES, VILLAINS, repair)
from .script_writer import pick_models
from .util import env, log

VILLAIN_WORDS = re.compile(r"\b(voice|thing|it|creature|shadow|ghost|doll|stranger|figure|man in|woman in|visitor|entity|monster)\b", re.I)

META_PROMPT = """You are casting an animated horror-comedy cartoon from the user's script below.
Return ONLY JSON:
{{"title":"YouTube title under 70 characters, curiosity-driven, no hashtags",
  "description":"3 sentences that tease the story without spoiling the ending",
  "tags":["10 to 14 search tags"],
  "hero":{{"look":"boy|girl|man|woman","outfit":"pj|hoodie|tee|nightie|shirt|cardigan"}},
  "villain":"double|shadow|ghost|doll|neighbour|tall|delivery  (the closest match to the script's threat)",
  "speakers":{{"<NAME exactly as written in the script>":"hero|villain|mum|dad|grandma|grandpa|roommate|friend|sister|brother|officer|daughter|son|landlord"}}}}
The hero is the person telling the story ("I"). Every NAME that speaks must be mapped.

SCRIPT:
{script}
"""

PLAN_PROMPT = """You are the storyboard artist for an animated horror-comedy cartoon. For EACH numbered line below,
choose how to show it with these sets only:
{scenes}

Villain: {villain}. Side characters available: {roles}.
Fields per line (use only these values):
 scene, cam (wide|medium|close|push_in|pull_out|pan|snap), focus (hero|other|prop|door|window|gap|peephole|wide),
 hero {{"pose":"sit|sleep|stand|walk|peek|cheeks|reach","expr":"calm|sleepy|curious|worried|shock|scream|relieved|tired|stare","expr2":"..."}} or null,
 other {{"state":"back|front|stare|grin|tired|lurk","where":"door|window|beside|under_door|peephole"}} or null,
 side (a side role shown in kitchen/closeup/bedroom) or null, sideExpr,
 react (none|jolt|ring|knock|lights_on|lights_off|flicker|appear|vanish|turn|grin|droop|text_change),
 beat_word (ONE word copied from the line where the react happens), jump (true on a time jump), twist (true only for the
 single biggest reveal of the whole story), light (dark|dawn|on|flicker), room (kitchen|bedroom, for cctv), prop
 (shoes|shirt|none), fx (["rain"]), text (cctv: label,time,time2 / calendar: top,big,top2,big2 / phone: from,msg,msg2,time).
Make it visually varied: change set or camera at least every 2 lines, follow the action of the words, show whoever
speaks, keep the same set while a scene continues. Funny lines deserve big reactions (shock, scream, cheeks).
Lines:
{lines}
Return ONLY JSON: {{"plans":[{{"id":0, ...}}, ...]}} with one entry per id.
"""

KEYWORDS = [  # fallback planner: first match wins
    (r"\b(text|message|phone|call|rang|buzz)", "phone"), (r"\b(mirror|reflection|bathroom|sink)", "bathroom"),
    (r"\b(window|glass|outside)", "window"), (r"\b(camera|footage|cctv|recording|video)", "cctv"),
    (r"\b(door|knock|doorbell|porch|parcel|delivery)", "front_door"), (r"\b(wardrobe|closet|cupboard)", "wardrobe"),
    (r"\b(laptop|computer|screen|desk|email)", "desk"), (r"\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|calendar|date)", "calendar"),
    (r"\b(kitchen|coffee|tea|fridge|breakfast|dinner|cook)", "kitchen"), (r"\b(hall|hallway|corridor|stairs|footsteps)", "hallway"),
    (r"\b(bed|sleep|woke|night|dream|pillow|blanket|bedroom)", "bedroom"),
]
DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]


CAST_NOTE = re.compile(r"^\[\s*cast\s*:(.*)\]\s*$", re.I)


def script_cast(text: str) -> dict:
    """Optional '[cast: MUM=hero woman, ELLIE=daughter, THE GIRL=villain ghost girl]' note."""
    out = {}
    for raw in text.split("\n"):
        m = CAST_NOTE.match(raw.strip())
        if m:
            for part in m.group(1).split(","):
                if "=" in part:
                    k, v = part.split("=", 1)
                    out[k.strip().upper()] = v.strip().lower().split()
    return out


def parse_script(text: str) -> list[dict]:
    """Script text -> lines [{line, speaker_name, chapter}]. [Bracketed notes] are never spoken."""
    out, chapter = [], None
    for raw in text.replace("\r", "").split("\n"):
        s = re.sub(r"\[[^\]]*\]", "", raw).strip()
        if not s:
            continue
        if s.startswith("#"):
            chapter = s.lstrip("#").strip()[:60] or None
            continue
        m = re.match(r"^([A-Z][A-Z0-9 .'-]{0,24}):\s*(.+)$", s)
        if m and len(m.group(1).split()) <= 3:
            out.append({"line": m.group(2).strip().strip('"“”'), "name": m.group(1).strip(), "chapter": chapter})
            chapter = None
            continue
        sents = re.split(r"(?<=[.!?…])\s+(?=[A-Z\"'“])", s)
        for sent in sents:
            sent = sent.strip()
            if not sent:
                continue
            if out and out[-1]["name"] is None and len(sent.split()) < 4 and not chapter and len(out[-1]["line"].split()) < 18:
                out[-1]["line"] += " " + sent       # glue very short sentences on, so shots aren't too choppy
                continue
            out.append({"line": sent, "name": None, "chapter": chapter})
            chapter = None
    return out


def _gemini(prompt: str, cfg: dict, tries: int = 6) -> dict:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=env("GEMINI_API_KEY"))
    models = pick_models(client, cfg.get("ai", {}).get("gemini_model", "auto"))
    models += [m for m in ("gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-2.5-flash") if m not in models]
    last = None
    for attempt in range(tries):
        model = models[attempt % len(models)]
        try:
            resp = client.models.generate_content(model=model, contents=prompt, config=types.GenerateContentConfig(
                response_mime_type="application/json", temperature=0.7))
            return json.loads(resp.text)
        except Exception as exc:
            last = exc
            log(f"Gemini attempt {attempt + 1} failed: {str(exc)[:120]}")
            time.sleep(min(60, 8 * (attempt + 1)))
    raise RuntimeError(f"Gemini unavailable: {last}")


def _speaker_role(name: str | None, mapping: dict, seen: list) -> str:
    if not name:
        return "narrator"
    if name in mapping:
        return mapping[name]
    low = name.lower()
    if low in ROLES:
        return low
    if low in ("me", "i", "narrator"):
        return "hero"
    if VILLAIN_WORDS.search(low) or low.startswith("the "):
        return "villain"
    if name not in seen:
        seen.append(name)
    return "hero" if seen.index(name) == 0 else ["friend", "roommate", "sister"][min(seen.index(name) - 1, 2)]


def heuristic_plan(line: str, speaker: str, i: int, prev: str | None) -> dict:
    low = line.lower()
    scene = next((sc for rx, sc in KEYWORDS if re.search(rx, low)), None)
    if speaker == "villain":
        scene = scene if scene in {"window", "cctv", "bedroom", "kitchen", "hallway"} else "closeup"
    elif speaker not in ("narrator",):
        scene = "closeup" if speaker == "hero" or not scene or scene not in {"kitchen", "bedroom"} else scene
    if scene == "calendar" and not re.match(r"^(on |it was |that )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)", low):
        scene = None
    scene = scene or prev or "bedroom"
    if scene == prev and i % 3 == 2 and speaker == "narrator":
        scene = "closeup"          # a reaction shot now and then, so a long scene doesn't sit still
    loud = bool(re.search(r"!|scream|run|ran|jump|froze|gasp|what\?", low))
    p = {"scene": scene, "cam": ["push_in", "medium", "close", "pull_out", "snap"][i % 5] if not loud else "snap",
         "react": "jolt" if loud and scene not in {"phone", "calendar", "window", "cctv"} else
                  "ring" if scene == "phone" else "knock" if "knock" in low else "none",
         "beat_word": line.split()[-1].strip(".,!?\"'").lower(),
         "hero": {"pose": "stand", "expr": "shock" if loud else "worried"},
         "other": {"state": "stare"} if speaker == "villain" or re.search(r"\b(it|figure|shadow|someone|something)\b", low) else None,
         "jump": bool(re.search(r"\b(next (day|night|morning)|later|tomorrow|that night)\b", low))}
    if scene == "calendar":
        d = next((x for x in DAYS if x.lower() in low), "MONDAY")
        p["text"] = {"top": d, "big": str(1 + (i * 7) % 28)}
    if scene == "phone":
        said = re.search(r"(?:said|says|read|reads)[:,]?\s*(.+)$", line, re.I)
        p["text"] = {"from": "Unknown", "msg": (said.group(1) if said else "Are you awake?")[:60], "time": "3:00"}
    if scene == "cctv":
        p["room"] = "bedroom" if "bed" in low else "kitchen"; p["text"] = {"label": "CAM 01", "time": "03:00"}
    return p


def plan_script(text: str, cfg: dict) -> dict:
    lines = parse_script(text)
    if len(lines) < 6:
        raise SystemExit("The script is too short: it needs at least a few paragraphs.")
    words = sum(len(x["line"].split()) for x in lines)
    log(f"Script: {len(lines)} lines, {words} words (about {words / 150:.1f} minutes)")
    try:
        meta = _gemini(META_PROMPT.format(script=text[:12000]), cfg)
    except Exception as exc:
        log(f"Casting by Gemini failed, using defaults: {exc}")
        meta = {}
    mapping = {k: (v if v in ROLES | {"hero", "villain"} else "friend") for k, v in (meta.get("speakers") or {}).items()}
    hero_look, villain_kind, villain_look = None, None, None
    for name, words in script_cast(text).items():      # the script's own cast note wins over Gemini
        role = next((w for w in words if w in ROLES | {"hero", "villain"}), None)
        if role:
            mapping[name] = role
            mapping[name.title()] = role
        if role == "hero":
            hero_look = next((w for w in words if w in ("boy", "girl", "man", "woman")), hero_look)
        if role == "villain":
            villain_kind = next((w for w in words if w in VILLAINS), villain_kind)
            villain_look = next((w for w in words if w in ("boy", "girl", "man", "woman")), villain_look)
    seen: list = []
    for x in lines:
        x["speaker"] = _speaker_role(x["name"], mapping, seen)
    roles = sorted({x["speaker"] for x in lines} & ROLES)[:4]
    villain = villain_kind or (meta.get("villain") if meta.get("villain") in VILLAINS else "shadow")
    hero = dict(meta.get("hero") or {"look": "boy", "outfit": "hoodie"})
    if hero_look:
        hero["look"] = hero_look

    plans: dict[int, dict] = {}
    scenes = "\n".join(f"- {k}: {v}" for k, v in SCENES.items())
    for start in range(0, len(lines), 30):
        chunk = lines[start:start + 30]
        listing = "\n".join(f"{start + j} [{x['speaker']}]: {x['line']}" for j, x in enumerate(chunk))
        try:
            got = _gemini(PLAN_PROMPT.format(scenes=scenes, villain=villain, roles=", ".join(roles) or "none",
                                             lines=listing), cfg, tries=4)
            for p in got.get("plans", []):
                if isinstance(p, dict) and isinstance(p.get("id"), int):
                    plans[p["id"]] = p
            log(f"Planned lines {start}-{start + len(chunk) - 1}")
        except Exception as exc:
            log(f"Planning lines {start}+ by keywords instead: {exc}")

    beats, prev = [], None
    for i, x in enumerate(lines):
        p = plans.get(i) or heuristic_plan(x["line"], x["speaker"], i, prev)
        b = dict(p)
        b.update({"line": x["line"], "speaker": x["speaker"], "chapter": x["chapter"]})
        if b.get("beat_word") and b["beat_word"].lower() not in x["line"].lower():
            b["beat_word"] = x["line"].split()[-1]
        beats.append(b)
        prev = b.get("scene")
    twists = [i for i, b in enumerate(beats) if b.get("twist")]
    for i in twists[:-1]:
        beats[i]["twist"] = False       # one twist only: the last one marked
    story = repair({
        "title": meta.get("title") or "A Creepy Cartoon Tale", "story_id": "long-" + re.sub(r"[^a-z0-9]+", "-", (meta.get("title") or "story").lower())[:30],
        "description": meta.get("description") or "", "tags": meta.get("tags") or [],
        "hero": hero, "villain": villain, "villain_look": villain_look,
        "cast": [{"role": r} for r in roles], "beats": beats})
    if len(story["beats"]) != len(lines):
        log(f"Note: {len(lines) - len(story['beats'])} empty lines were dropped")
    return story


def chapters(plan: dict) -> list[str]:
    """YouTube chapters from the '# headings' (needs 3+ chapters, each at least 10 s long)."""
    marks = [(sh["ls"] / 30.0, sh["chapter"]) for sh in plan["shots"] if sh.get("chapter")]
    if not marks:
        return []
    if marks[0][0] > 1.0:
        marks.insert(0, (0.0, "Intro"))
    marks[0] = (0.0, marks[0][1])
    good = [m for k, m in enumerate(marks) if k == 0 or m[0] - marks[k - 1][0] >= 10]
    if len(good) < 3:
        return []
    fmt = lambda t: f"{int(t // 60)}:{int(t % 60):02d}"
    return [f"{fmt(t)} {name}" for t, name in good]
