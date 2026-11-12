"""Voice the story, time every shot to the narration, render the cartoon frames and encode the video.

Works for both formats: vertical 9:16 Shorts and landscape 16:9 long videos.
"""
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

import numpy as np

from . import horror_audio as ha
from .horror_cast import cast_story
from .util import ROOT, log, run

FPS = 30
WEB = ROOT / "horror" / "web"
LEAD = 0.45          # silence before the first line
GAP = 0.32           # pause between lines
LONG_GAP = 0.75      # pause before a time jump or the twist
CHAPTER_GAP = 1.4    # pause between chapters of a long video
TAIL = 1.4           # picture after the last word (final hold + static)


def _norm(w: str) -> str:
    return re.sub(r"[^a-z0-9']", "", w.lower())


def _echo(path: Path) -> np.ndarray:
    """A faint creepy echo for villain lines (the words stay clear)."""
    out = path.with_name(path.stem + "_fx.wav")
    run(["ffmpeg", "-y", "-v", "error", "-i", str(path), "-af",
         "aecho=0.8:0.55:90|170:0.32|0.18,lowpass=f=7000", "-ar", str(ha.SR), "-ac", "1", str(out)])
    return ha.load(out)


def caption_words(line: str, words: list, dur: float) -> list:
    """[[start_s, end_s, WORD, highlighted]] relative to the line, for word-by-word captions."""
    hl = {_norm(w) for chunk in re.findall(r"\*(.+?)\*", line) for w in chunk.split()}
    shown = [w for w in re.sub(r"\[[a-z\-]+\]", " ", line.replace("*", "")).split() if re.search(r"[A-Za-z0-9]", w)]
    spoken = [w for w in (words or []) if w.get("start") is not None and re.search(r"[A-Za-z0-9]", w.get("text", ""))]
    out = []
    if len(spoken) >= len(shown) * 0.8 and spoken:
        j = 0
        for w in shown:                                   # follow the spoken timings in order
            while j < len(spoken) - 1 and _norm(spoken[j]["text"]) not in _norm(w) and _norm(w) not in _norm(spoken[j]["text"]):
                j += 1
            sw = spoken[min(j, len(spoken) - 1)]
            out.append([float(sw["start"]), float(sw.get("end") or sw["start"] + 0.3), w.strip(), _norm(w) in hl])
            j += 1
    else:                                                 # no timings: spread the words over the line
        n = max(1, len(shown))
        out = [[dur * i / n, dur * (i + 1) / n, w, _norm(w) in hl] for i, w in enumerate(shown)]
    return out


def mouth_env(audio: np.ndarray) -> list[float]:
    """How open the speaker's mouth is on each video frame, from the loudness of the line (lip sync)."""
    hop = ha.SR // FPS
    n = max(1, int(np.ceil(len(audio) / hop)))
    pad = np.pad(audio, (0, n * hop - len(audio)))
    rms = np.sqrt((pad.reshape(n, hop) ** 2).mean(1))
    ref = np.percentile(rms[rms > 0], 92) if (rms > 0).any() else 1.0
    v = np.clip(rms / max(ref, 1e-6), 0, 1.15)
    v = np.where(v < 0.12, 0, v)
    out, prev = [], 0.0
    for x in v:                                 # open fast, close a little slower: reads as natural speech
        prev = x if x > prev else prev * 0.55 + x * 0.45
        out.append(round(float(prev), 2))
    return out


def _phone(audio: np.ndarray, stem: Path) -> np.ndarray:
    """A voice heard through a phone: narrow band, a little crunch, slightly quieter."""
    src, out = stem.with_name(stem.name + "_raw.wav"), stem.with_name(stem.name + "_phone.wav")
    ha.save(src, audio)
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af",
         "highpass=f=320,lowpass=f=3300,acompressor=threshold=0.1:ratio=4,volume=0.9", "-ar", str(ha.SR), "-ac", "1", str(out)])
    return ha.load(out)


def _mind(audio: np.ndarray, stem: Path) -> np.ndarray:
    src, out = stem.with_name(stem.name + "_rawt.wav"), stem.with_name(stem.name + "_mind.wav")
    ha.save(src, audio)
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af",
         "highpass=f=140,lowpass=f=6500,aecho=0.7:0.55:45|95:0.35|0.22,volume=0.9", "-ar", str(ha.SR), "-ac", "1", str(out)])
    return ha.load(out)


def _muffle(audio: np.ndarray, stem: Path) -> np.ndarray:
    src, out = stem.with_name(stem.name + "_rawm.wav"), stem.with_name(stem.name + "_muff.wav")
    ha.save(src, audio)
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", "lowpass=f=750,aecho=0.6:0.4:18:0.25,volume=0.8",
         "-ar", str(ha.SR), "-ac", "1", str(out)])
    return ha.load(out)


def voice_for_speaker(beat: dict, voices: dict) -> dict:
    sp = beat.get("speaker") or "narrator"
    return voices.get(sp) or voices.get("narrator")


def voice_lines(story: dict, voices: dict, work: Path, intro: float = 0.0) -> tuple[np.ndarray, list[dict]]:
    """Speak each beat in its speaker's voice and join them with natural pauses."""
    from .voice import say

    parts, timing = [np.zeros(int(LEAD * ha.SR))], []
    t = LEAD
    beats = story["beats"]
    late = []
    for i, b in enumerate(beats):
        if b.get("at") is not None:               # the line must start at this time in the finished video
            want = float(b["at"]) - intro
            if want > t + 0.02:                   # early: hold the previous shot a little longer
                pad = want - t
                parts.append(np.zeros(int(pad * ha.SR)))   # shots run from start to start, so the last one holds
                t = want
            elif want < t - 0.5:
                late.append(f"beat {i} '{(b.get('line') or '')[:30]}' {t - want:.1f}s late")
        if b.get("silent"):                       # an action beat with no words (a photo, a knock, a door)
            dur = float(b["silent"])
            audio = np.zeros(int(dur * ha.SR))
            tword = dur * float(b.get("beat_at", 0.5))
        else:
            mp3 = work / f"line{i:03d}.mp3"
            vcfg = dict(voice_for_speaker(b, voices))
            if b.get("style"):                       # how this line is acted (Gemini TTS)
                vcfg["style"] = b["style"]
            if b.get("vspeed"):
                vcfg["speed"] = vcfg.get("speed", 1.0) * float(b["vspeed"])
            text = b["line"].replace("*", "")            # *key words* are highlighted in captions, not spoken
            dur, words = say(text, vcfg, mp3)
            audio = _echo(mp3) if vcfg.get("echo") else ha.load(mp3)
            if b.get("layer"):                    # a second, lower take under the first (the laugh grows)
                lay = dict(vcfg, **{k: v for k, v in b["layer"].items() if k != "gain"})
                mp2 = work / f"line{i:03d}_layer.mp3"
                say(b["line"], lay, mp2)
                a2 = _echo(mp2) if lay.get("echo") else ha.load(mp2)
                n2 = max(len(audio), len(a2) + int(0.12 * ha.SR))
                mix = np.zeros(n2); mix[:len(audio)] += audio
                mix[int(0.12 * ha.SR):int(0.12 * ha.SR) + len(a2)] += a2 * float(b["layer"].get("gain", 0.6))
                audio = mix / max(1.0, np.abs(mix).max() / 0.98)
            if b.get("phone"):
                audio = _phone(audio, work / f"line{i:03d}")
            if b.get("mind"):                     # a thought: close, intimate, a soft echo inside the head
                audio = _mind(audio, work / f"line{i:03d}")
            if b.get("muffle"):                   # heard through a closed door
                audio = _muffle(audio, work / f"line{i:03d}")
            if b.get("gain"):
                audio = audio * float(b["gain"])
            dur = len(audio) / ha.SR
            bw = b.get("beat_word")
            hit = next((w for w in words if bw and _norm(w["text"]) == _norm(bw)), None)
            if hit is None and bw:
                hit = next((w for w in words if _norm(bw) and _norm(bw) in _norm(w["text"])), None)
            tword = hit["start"] if hit else dur * float(b.get("beat_at", 0.6))
        caps = None if b.get("silent") else caption_words(b["line"], words, dur)
        timing.append({"start": t, "end": t + dur, "beat": t + min(tword, dur), "env": None if b.get("silent") else mouth_env(audio),
                       "caps": caps})
        parts.append(audio)
        t += dur
        nxt = beats[i + 1] if i + 1 < len(beats) else None
        if nxt:
            gap = CHAPTER_GAP if nxt.get("chapter") else LONG_GAP if (nxt.get("jump") or nxt.get("twist")) else GAP
            if b.get("silent") or nxt.get("silent"):
                gap = 0.12                        # action beats already carry their own timing
            if "gap" in b:
                gap = float(b["gap"])
            if (nxt.get("speaker") or "narrator") != (b.get("speaker") or "narrator"):
                gap = max(gap, 0.4)
            if nxt.get("react") == "gag":
                gap += 0.25          # comic timing: a beat before the punchline
            parts.append(np.zeros(int(gap * ha.SR)))
            t += gap
        if i and i % 25 == 0:
            log(f"Voiced {i}/{len(beats)} lines")
    if late:
        log("WARNING lines later than asked: " + "; ".join(late))
    return np.concatenate(parts), timing


def voice_from_file(story: dict, path: Path) -> tuple[np.ndarray, list[dict]]:
    """Local testing: use a recorded narration and find the lines from its pauses."""
    audio = ha.load(path)
    w = int(0.05 * ha.SR); n = len(audio) // w
    rms = np.sqrt((audio[:n * w].reshape(n, w) ** 2).mean(1))
    speech = rms > rms.max() * 10 ** (-32 / 20)
    segs, cur = [], None
    for i, s in enumerate(speech):
        if s and cur is None: cur = i
        if not s and cur is not None:
            segs.append([cur, i]); cur = None
    if cur is not None: segs.append([cur, n])
    merged = []
    for s in segs:
        if merged and (s[0] - merged[-1][1]) * 0.05 < 0.5: merged[-1][1] = s[1]
        else: merged.append(s)
    beats = story["beats"]
    while len(merged) > len(beats):
        gaps = [merged[i + 1][0] - merged[i][1] for i in range(len(merged) - 1)]
        k = int(np.argmin(gaps)); merged[k][1] = merged[k + 1][1]; del merged[k + 1]
    timing = []
    for b, (s0, s1) in zip(beats, merged):
        st, en = s0 * 0.05, s1 * 0.05
        words = b["line"].split()
        idx = next((i for i, x in enumerate(words) if _norm(x) == _norm(b.get("beat_word", ""))), int(len(words) * 0.6))
        timing.append({"start": st, "end": en, "beat": st + (en - st) * (idx + 0.3) / max(1, len(words))})
    return audio, timing


PLATE_DIR = Path(__file__).resolve().parent.parent / "horror" / "plates"
PLATE_SCENES = {"hallway": "hallway_night", "kitchen": "kitchen_night", "front_door": "front_door_night",
                "bedroom": "bedroom_night", "window": "street_night"}
PROP_DIR = Path(__file__).resolve().parent.parent / "horror" / "props"
PROP_INFO_FILE = Path(__file__).resolve().parent.parent / "horror" / "library" / "props.json"


def prop_assets(story: dict) -> tuple[dict, dict]:
    """Data URLs and sizes of the objects and animals this story's painted shots use."""
    have = {p.stem for p in PROP_DIR.glob("*.png")}
    info = json.loads(PROP_INFO_FILE.read_text(encoding="utf-8"))["props"] if PROP_INFO_FILE.exists() else {}
    names = set()
    for b in story["beats"]:
        b["things"] = [t for t in (b.get("things") or []) if t in have][:2] if b.get("scene") == "plate" else []
        if (story.get("star") or {}).get("thing") in DRAWN_PETS:
            b["things"] = [t for t in b["things"] if t not in DRAWN_PETS and t != "dog_standing"]
        names.update(b["things"])
    import base64
    data = {n: "data:image/png;base64," + base64.b64encode((PROP_DIR / f"{n}.png").read_bytes()).decode() for n in names}
    return data, {n: {"h": info.get(n, {}).get("h", 200), "kind": info.get(n, {}).get("kind", "object")} for n in names}


PLATE_REACTS = {"none", "gag", "jolt", "droop", "ring", "knock"}

# Words that name a thing we have a painted cut-out of. If a line says it, the viewer must SEE it in that shot.
THING_WORDS = {
    "dog": ["dog", "dogs", "puppy", "pup", "doggy"], "black_cat": ["cat", "cats", "kitten"], "rabbit": ["rabbit", "bunny"],
    "crow": ["crow", "crows", "raven"], "owl": ["owl"], "deer": ["deer"], "raccoon": ["raccoon"], "frog": ["frog"],
    "goat": ["goat"], "goose": ["goose", "geese"], "possum": ["possum", "opossum"],
    "red_car": ["car", "cars"], "police_car": ["police"], "school_bus": ["bus"], "ice_cream_van": ["van"],
    "bicycle": ["bicycle", "bike", "cycle"], "skateboard": ["skateboard"], "school_bag": ["bag", "backpack"],
    "suitcase": ["suitcase"], "umbrella": ["umbrella"], "lantern": ["lantern"], "flashlight": ["flashlight", "torch"],
    "teddy_bear": ["teddy"], "creepy_doll": ["doll"], "red_balloon": ["balloon"], "pumpkin": ["pumpkin"],
    "mailbox": ["mailbox", "letterbox"], "trash_can": ["bin", "dustbin"], "shopping_cart": ["trolley", "cart"],
    "traffic_cone": ["cone"], "old_tv": ["tv", "television"], "garden_gnome": ["gnome"], "vending_machine": ["vending"],
}
PRONOUNS = {"he", "him", "his", "she", "her", "it", "its", "they", "them"}
DRAWN_PETS = {"dog"}       # animals drawn as full actors (horror/web/pet.js), not pasted cut-outs


ACTIONS = [   # (kind, words): an incident in the line is drawn and animated as it happens
    ("door_slam", ["slams", "slam", "door shuts", "closes the door", "shut the door", "shuts the door"]),
    ("door_open", ["open the door", "opens the door", "door opens", "door creaks open", "door swings open",
                   "you open it", "door is open", "pull the door open"]),
    ("knock", ["knock"]),
    ("fight", ["fight", "wrestle", "struggle", "punch", "kick", "tackle", "attacks", "jumps on you", "pins you"]),
    ("chase", ["chases", "chasing", "runs after", "run for your life", "you run away", "running for your life",
               "run for it", "you run. ", "you run!", "you sprint", "after you"]),
    ("grab", ["grabs", "grab you", "hand on your shoulder", "pulls you", "drags you", "catches your"]),
    ("fall", ["you fall", "you trip", "you slip", "fall down"]),
    ("hide", ["you hide", "hiding", "you duck behind"]),
]


def action_spec(line: str, next_line: str, story: dict) -> dict | None:
    """The incident this line describes (door opening, a fight, a chase...), or None."""
    l = " " + line.lower() + " "
    kind = next((k for k, ws in ACTIONS if any(w in l for w in ws)), None)
    if not kind:
        return None
    star = (story.get("star") or {})
    who = "pet" if star.get("thing") in DRAWN_PETS else \
        ("double" if (story.get("other") or {}).get("kind") == "double" else "shadow")
    spec = {"kind": kind, "who": who}
    if kind == "door_open":
        n = next_line.lower()
        names = [x.lower() for x in star.get("names", [])]
        if who == "pet" and any(k in n for k in ("two legs", "hind legs", "standing")):
            spec["reveal"] = "pet_tall" if "tall" in n else "pet_up"
        elif who == "pet" and (any(x in n for x in names) or " he " in f" {n} "):
            spec["reveal"] = "pet"
        elif any(k in n for k in ("nobody", "no one", "empty", "nothing")):
            spec["reveal"] = "empty"
        else:
            spec["reveal"] = "eyes" if who == "pet" else "shadow"
    return spec


FEELINGS = [   # (face before the beat, face after it or None, words): the hero's face is what the line makes him feel
    ("worried", "scream", ["scream", "run!", "grabs", "chases"]),
    ("worried", "dread", ["you run", "you hide", "you back away"]),
    ("worried", "terror", ["behind you", "breathes", "breathing", "whispers your name", "staring at you", "smiles at you", "waving at you",
                            "turns toward you", "looks at you", "by itself", "from the inside", "from inside"]),
    ("calm", "realize", ["you didn't", "you never", "nobody else", "no one else", "but you", "wasn't there", "should", "died",
                          "has twelve", "isn't yours", "one second ago", "you live alone", "you count"]),
    ("worried", "dread", ["heart is pounding", "you freeze", "can't move", "hands shake", "too late", "it knows", "gone"]),
    ("happy", "laugh", ["you laugh", "giggle", "laughs"]),
    ("happy", None, ["everyone is smiling", "easy", "you smile", "relief", "safe", "favourite", "wagging"]),
    ("sad", "cry", ["you cry", "tears", "you miss", "missing for"]),
    ("suspicious", None, ["wrong number", "strange", "weird", "something is off", "odd", "you check", "you look closer"]),
    ("curious", None, ["you open", "you look", "you walk", "you follow", "you play it", "you pick up", "you answer", "you find"]),
    ("confused", None, ["?", "but how", "that's impossible", "doesn't make sense", "why would"]),
    ("sleepy", "shock", ["3 a.m.", "two a.m.", "midnight", "wakes you", "you wake"]),
    ("nervous", None, ["you tell", "it's nothing", "just the wind", "you almost ignore", "probably"]),
    ("calm", None, ["imagine"]),
]


def emote(story: dict) -> None:
    """Give every hero shot the face its line calls for, so the feeling changes line by line like a real person's."""
    prev = None
    for b in story["beats"]:
        h = b.get("hero")
        if not isinstance(h, dict) or h.get("pose") == "sleep" or b.get("keep_expr"):
            continue
        l = " " + b.get("line", "").lower() + " "
        hit = next(((a, z) for a, z, ws in FEELINGS if any(w in l for w in ws)), None)
        if l.strip().startswith(("would you", "what would you")):
            hit = ("worried", None)
        if b.get("twist"):
            hit = (hit[0] if hit else "worried", "terror" if not hit or hit[1] in (None, "realize", "dread") else hit[1])
        if not hit:
            hit = ("worried", None) if prev in ("terror", "scream", "dread", "realize") else None
        if hit:
            h["expr"], h["expr2"] = hit
            prev = hit[1] or hit[0]


def pet_spec(line: str, twist: bool) -> dict:
    """What the dog DOES in this line, read literally: the shot acts the words out."""
    l = line.lower()
    has = lambda *ks: any(k in l for k in ks)
    you = l.startswith("you ") or has(" you hug", "you give", "you run to", "you open", "you pet", "you call")
    if has("missing", "poster"):
        return {"insert": "poster"}
    if has("collar", " tag"):
        return {"insert": "tag"}
    if has("dinner", "food", "bowl", "doesn't touch", "won't eat", "doesn't eat"):
        return {"insert": "bowl"}
    if has("scratch", "claw marks"):
        return {"insert": "scratch"}
    spec = {"pose": "sit", "expr": "calm", "frame": "duo" if you else "full"}
    if has("two legs", "hind legs", "stands up", "standing there", "stood"):
        spec.update(pose="up", expr="stare", frame="full")
        if has("behind you", "too tall", "taller"):
            spec.update(pose="tall", expr="grin", frame="duo")
    elif has("onto four", "back down", "drops"):
        spec.update(pose="stand", expr="stare", frame="full")
    elif has("wag", "muddy", "tired", "there he is", "there she is"):
        spec.update(pose="sit", expr="happy", wag=1.6, enter=True, frame="full")
    elif has("he runs", "she runs", "it runs", "running around", "races", "jumps", "chases"):
        spec.update(pose="run", expr="happy")
    elif has("walks away", "walks off", "leaves"):
        spec.update(pose="back", expr="calm", frame="full")
    elif has("walks", "walk ", "follows", "trots"):
        spec.update(pose="walk", expr="calm", frame="full")
    elif has("watching", "watches", "stares", "staring", "looks at you", "smiling", "smiles", "grin"):
        spec.update(pose="sit", expr="grin" if has("smil", "grin") else "stare", frame="face")
    elif has("sleeps", "asleep", "sleeping"):
        spec.update(pose="sit", expr="happy", wag=0, frame="full")
    elif has("whine", "hug", "cries"):
        spec.update(pose="sit", expr="sad", frame="duo")
    if has("dark", "shadow", "silhouette", "moon"):
        spec["sil"] = True
    if has("tilt"):
        spec["tilt"] = 0.35
    if twist and spec.get("pose") == "sit":
        spec.update(expr="grin")
    return spec


def must_show(story: dict) -> list[list[str]]:
    """For each beat, the things its line names (or the story's star animal, by name or by he/him after it appears)."""
    have = {p.stem for p in PROP_DIR.glob("*.png")}
    star = story.get("star") or {}
    star_thing, names = star.get("thing"), {n.lower() for n in star.get("names", [])}
    prons = set(star["pronouns"]) if isinstance(star.get("pronouns"), list) else PRONOUNS
    seen_star, out = False, []
    for b in story["beats"]:
        ws = [w.strip(" .,!?\"'…*-").lower().replace("’", "'").split("'")[0]
              for w in re.split(r"[\s—]+", b.get("line", ""))]
        low = b.get("line", "").lower()
        if low.startswith(("part two", "what would you", "tell me", "follow")):
            out.append([]); continue                     # the sign-off lines are about the viewer, not the story
        def named(words):
            for k, w in enumerate(ws):
                if w not in words:
                    continue
                before, after = " ".join(ws[max(0, k - 3):k]), ws[k + 1] if k + 1 < len(ws) else ""
                if before.endswith(("size of a", "like a", "like")) or after in ("keys", "key", "seat", "seatbelt"):
                    continue                     # "the size of a dog", "car keys": the thing is not in the room
                return True
            return False
        found = [t for t, words in THING_WORDS.items() if t in have and named(words)]
        if star_thing in have:
            hit = star_thing in found or any(w in names for w in ws)
            if hit:
                seen_star = True
            elif seen_star and star.get("pronouns") and any(w in prons for w in ws):
                hit = True
            if hit and star_thing not in found:
                found.insert(0, star_thing)
            if hit and star_thing == "dog" and "dog_standing" in have and any(
                    k in b.get("line", "").lower() for k in ("two legs", "hind legs", "stands up", "standing up")):
                found[found.index("dog")] = "dog_standing"
        out.append(found[:2])
    return out


def apply_plates(story: dict) -> dict:
    """Painted 3D-look backgrounds for the calm and reaction beats (our 2D hero stands in front of them).
    Beats where the room itself acts (a ghost appears, a door, the lights, a prop, the twist) keep the drawn sets."""
    have = {p.stem for p in PLATE_DIR.glob("*.jpg")}
    used, last = {}, None
    musts = must_show(story)
    for b, must in zip(story["beats"], musts):
        if must and not b.get("set"):
            b["must"] = must
    beats = story["beats"]
    for i, b in enumerate(beats):
        scene = b.get("scene")
        if b.get("set"):                                 # a drawn story set: the script staged this line itself
            continue
        star = (story.get("star") or {}).get("thing")
        act = action_spec(b.get("line", ""), beats[i + 1].get("line", "") if i + 1 < len(beats) else "", story)
        if act:
            b["scene"], b["act"], b["cam"], b["focus"] = "action", act, "wide", "wide"
            b.pop("other", None); b["prop"] = "none"; b.pop("side", None); b["things"] = []
            if not b.get("hero"):
                b["hero"] = {"pose": "stand", "expr": "scared"}
            if b.get("react", "none") in ("none", "gag"):
                b["react"] = "jolt" if act["kind"] in ("door_slam", "grab", "door_open") else "none"
            continue
        if star in DRAWN_PETS and not b.get("twist") and re.search(r"\bscratch|claw marks", b.get("line", "").lower()):
            b.setdefault("must", [star])
        if b.get("must") and star in DRAWN_PETS and star in b["must"]:
            # the dog is the actor of this line: a drawn dog acting the words out (or an insert of what's named)
            spec = pet_spec(b.get("line", ""), bool(b.get("twist")))
            name = b.get("place") if scene == "place" else PLATE_SCENES.get(scene)
            room = name if name in have else last if last in have else next(
                (k for k in ("hallway_night", "front_door_night", "street_night") if k in have), None)
            if "insert" in spec:
                b["scene"], b["insert"] = "insert", spec["insert"]
            elif room:
                b["scene"], b["plate"], b["pet"] = "petshot", room, spec
                used[room] = used.get(room, 0) + 1
            # the whole dog stays in frame: only a calm sit gets a slow push in
            b["cam"] = "push_in" if spec.get("pose") == "sit" and spec.get("frame") == "full" else "wide"
            b["focus"] = "pet"
            b.pop("other", None); b["prop"] = "none"; b.pop("side", None); b["things"] = []
            if b.get("react", "none") not in PLATE_REACTS:
                b["react"] = "jolt" if b.get("twist") else "none"
            if not b.get("hero"):
                b["hero"] = {"pose": "stand", "expr": "scared" if b.get("twist") else "worried"}
            if name in have:
                last = name
            continue
        if scene == "place" and b.get("place") in have:       # a painted place of our town, chosen by the writer
            b["plate"], b["scene"] = b["place"], "plate"
            if not b.get("hero"):
                b["hero"] = {"pose": "stand", "expr": "curious"}
            elif b["hero"].get("pose") not in ("stand", "walk", "run", "cheeks", "reach"):
                b["hero"] = dict(b["hero"], pose="stand")
            used[b["place"]] = used.get(b["place"], 0) + 1
            last = b["place"]
            continue
        name = PLATE_SCENES.get(scene)
        if scene == "kitchen" and b.get("light") == "dawn":
            name = "kitchen_dawn"
        if scene == "closeup" and last:
            name = last                                      # a reaction close-up in the room we are already in
        ok = (name in have and b.get("hero") and not b.get("twist") and not b.get("side")
              and b.get("react", "none") in PLATE_REACTS
              and (not b.get("other") or b["other"].get("state") in (None, "hidden"))
              and (b.get("hero") or {}).get("pose") in ("stand", "walk", "run", "cheeks", "reach", "sit", "peek", None)
              and b.get("prop") in (None, "none"))
        if ok:
            b["plate"], b["scene"] = name, "plate"
            if b["hero"].get("pose") in ("sit", "peek"):           # the plate actor stands in the room
                b["hero"] = dict(b["hero"], pose="stand")
            used[name] = used.get(name, 0) + 1
        if b.get("must") and b.get("scene") != "plate":
            # the line names an animal or object: it must be on screen, so this shot moves to a painted set with it
            room = name if name in have else last if last in have else next(
                (k for k in ("hallway_night", "front_door_night", "street_night") if k in have), None)
            if room:
                b["plate"], b["scene"] = room, "plate"
                b.pop("other", None); b["prop"] = "none"; b.pop("side", None)
                hero = b.get("hero") or {"pose": "stand", "expr": "scared" if b.get("twist") else "curious"}
                if hero.get("pose") not in ("stand", "walk", "run", "cheeks", "reach"):
                    hero = dict(hero, pose="stand")
                b["hero"] = hero
                if b.get("react", "none") not in PLATE_REACTS:
                    b["react"] = "jolt" if b.get("twist") else "none"
                used[room] = used.get(room, 0) + 1
        if name and scene != "closeup":
            last = name
    for b in story["beats"]:
        if b.get("must") and b.get("scene") == "plate":
            b["things"] = (b["must"] + [t for t in (b.get("things") or []) if t not in b["must"]])[:2]
            b["focus"] = "thing"                          # frame both him and the thing the line is about
            if b.get("cam") in ("close", "snap", "crash", "dutch"):
                b["cam"] = "push_in"
            line = b.get("line", "").lower()
            if b["things"][0] == "dog" and any(k in line for k in ("two legs", "hind legs", "stands up", "standing up")):
                b["thing_tall"] = True                       # no standing-dog cut-out yet: stretch him upright
    order, k, prev = ["left", "far", "right", "close", "center"], 0, None      # a new set-up every shot
    for b in story["beats"]:
        if b.get("scene") != "plate" or b.get("comp") or (b.get("hero") or {}).get("pose") in ("walk", "run"):
            prev = None
            continue
        comp = "close" if b.get("twist") else order[k % len(order)]
        if comp == prev:
            k += 1; comp = order[k % len(order)]
        if b.get("things"):
            comp = "left"                       # leave the right of the frame for what the line names
        b["comp"], prev, k = comp, comp, k + 1
    shown = sum(1 for b in story["beats"] if b.get("must"))
    if shown:
        log(f"Named things on screen: {shown} lines show what they mention")
    if used:
        log("Painted backgrounds: " + ", ".join(f"{k} x{v}" for k, v in used.items()))
    return {k: "data:image/jpeg;base64," + __import__("base64").b64encode((PLATE_DIR / f"{k}.jpg").read_bytes()).decode()
            for k in used}


def voice_from_take(story: dict, path: Path) -> tuple[np.ndarray, list[dict]]:
    """One acted take of the whole story: cut it into the story's lines at its pauses.

    Each line boundary is expected where its share of the words says it should be; the nearest real pause wins
    (within 1.5 s), otherwise the cut falls at the expected time."""
    audio = ha.load(path)
    beats = story["beats"]
    words = [max(1, len(b["line"].split()) if story.get("split_words") else len(re.findall(r"[A-Za-z0-9']+", b["line"])))
             for b in beats]
    w = int(0.02 * ha.SR); n = len(audio) // w
    rms = np.sqrt((audio[:n * w].reshape(n, w) ** 2).mean(1))
    loud = rms > rms.max() * 10 ** (-28 / 20)
    pauses, i = [], 0                                      # quiet runs of at least 0.09 s: (start, end) in seconds
    while i < n:
        if not loud[i]:
            j = i
            while j < n and not loud[j]:
                j += 1
            if (j - i) * 0.02 >= 0.09:
                pauses.append((i * 0.02, j * 0.02))
            i = j
        else:
            i += 1
    total = n * 0.02
    first = next((k * 0.02 for k in range(n) if loud[k]), 0.0)
    last = next((k * 0.02 for k in range(n - 1, -1, -1) if loud[k]), total)
    # Choose the line boundaries all at once (dynamic programming): each line should last about its share of the
    # words, and boundaries should sit in real pauses, the longer the better. A boundary may also fall where no pause
    # was found (a grid point), at a cost.
    K = len(beats)
    rate = sum(words) / max(1.0, (last - first) - sum(min(p[1], last) - max(p[0], first) for p in pauses
                                                        if p[0] > first and p[1] < last) * 0.5)
    cand = [((p0 + p1) / 2, p0, p1, p1 - p0) for p0, p1 in pauses if first + 0.3 < p0 and p1 < last - 0.3]
    have = [c[0] for c in cand]
    for g in np.arange(first + 0.5, last - 0.3, 0.2):
        if not have or min(abs(g - h) for h in have) > 0.25:
            cand.append((g, g, g, 0.0))
    cand.sort()
    C = len(cand)
    mid = np.array([c[0] for c in cand]); st0 = np.array([c[1] for c in cand]); en0 = np.array([c[2] for c in cand])
    plen = np.array([c[3] for c in cand])
    bonus = np.where(plen > 0, 2.5 + 6 * np.minimum(plen, 0.8), 0.0)

    def cost(start, end, k):
        exp = words[k] / rate
        return ((end - start - exp) / (0.3 * exp + 0.4)) ** 2

    INF = 1e18
    best = cost(first, st0, 0) - bonus                       # line 0 runs from the first sound to candidate j
    back = []
    for k in range(1, K - 1):
        dur = st0[None, :] - en0[:, None]                    # from candidate i (end of line k-1) to j
        exp = words[k] / rate
        c = ((dur - exp) / (0.3 * exp + 0.4)) ** 2
        c[dur < 0.3] = INF
        tot = best[:, None] + c
        arg = tot.argmin(0)
        best = tot[arg, np.arange(C)] - bonus
        back.append(arg)
    final = best + cost(en0, last, K - 1)
    j = int(final.argmin())
    path = [j]
    for arg in reversed(back):
        j = int(arg[j]); path.append(j)
    path.reverse()
    cuts = [(cand[j][1], cand[j][2]) for j in path]
    bounds = [first] + [x for p in cuts for x in p] + [last]
    # a short script still has to fill the Short: let the silences between lines breathe (suspense), up to 1.5 s each
    extra = 0.0
    if story.get("min_len") and cuts and last - first < story["min_len"]:
        extra = min(1.5, (story["min_len"] - (last - first)) / len(cuts))
    src = audio
    if extra > 0:
        mids = [int((p[0] + p[1]) / 2 * ha.SR) for p in cuts]
        pieces, a0 = [], 0
        for m in mids:
            pieces += [src[a0:m], np.zeros(int(extra * ha.SR))]
            a0 = m
        audio = np.concatenate(pieces + [src[a0:]])
        log(f"Acted take: {extra:.2f}s of extra silence after each line ({last - first:.0f}s -> {last - first + extra * len(cuts):.0f}s)")
    timing = []
    for k, b in enumerate(beats):
        st, en = bounds[2 * k], bounds[2 * k + 1]
        seg = src[int(st * ha.SR):int(en * ha.SR)]
        dur = max(0.1, en - st)
        st, en = st + k * extra, en + k * extra
        ws = b["line"].split()
        idx = next((i for i, x in enumerate(ws) if _norm(x) == _norm(b.get("beat_word", ""))), int(len(ws) * 0.6))
        timing.append({"start": st, "end": en, "beat": st + dur * (idx + 0.3) / max(1, len(ws)),
                       "env": mouth_env(seg), "caps": caption_words(b["line"], [], dur)})
    snapped = sum(1 for p in cuts if p[1] > p[0])
    log(f"Acted take: {len(beats)} lines cut at {snapped} real pauses, {len(cuts) - snapped} estimated")
    return audio, timing


def build_plan(story: dict, timing: list[dict], total: float, casting: dict, fmt: str = "vertical",
               intro_f: int = 0) -> dict:
    frames = int(round(total * FPS))
    shots = []
    for i, (b, tm) in enumerate(zip(story["beats"], timing)):
        a = intro_f if i == 0 else max(shots[-1]["a"] + 6, int(round(tm["start"] * FPS)) - 4)
        sh = {k: v for k, v in b.items() if k not in ("line", "beat_word")}
        sh["a"] = a
        sh["beat"] = int(round(tm["beat"] * FPS)) - 2 if b.get("react", "none") != "none" or b.get("twist") or (b.get("hero") or {}).get("expr2") or b.get("set") else None
        if sh["beat"] is not None:
            sh["beat"] = max(a + 3, sh["beat"])
        sp = b.get("speaker") or "narrator"
        sh["talk"] = "hero" if sp == "hero" else "other" if sp == "villain" else "side" if sp in casting["cast"] else None
        if sh["talk"] == "side" and not sh.get("side"):
            sh["side"] = sp
        sh["ls"], sh["le"] = int(round(tm["start"] * FPS)), int(round(tm["end"] * FPS))
        if tm.get("env"):
            sh["env"] = tm["env"]
        if tm.get("caps"):
            sh["caps"] = [[sh["ls"] + int(round(a * FPS)), sh["ls"] + int(round(b * FPS)), w, h] for a, b, w, h in tm["caps"]]
        shots.append(sh)
    for i, sh in enumerate(shots):
        sh["b"] = shots[i + 1]["a"] if i + 1 < len(shots) else frames
        if sh["beat"] is not None:
            sh["beat"] = min(sh["beat"], sh["b"] - 3)
    return {"frames": frames, "format": fmt, "hero": casting["hero"], "other": casting["other"],
            "cast": casting["cast"], "shots": shots, "petName": ((story.get("star") or {}).get("names") or [""])[0], "series": story.get("series"), "captions": bool(story.get("captions", fmt == "vertical")),
            "cuts": bool(story.get("cuts", fmt == "vertical" and not story.get("film"))),
            "music": story.get("music"), "scary": bool(story.get("scary")), "piano": bool(story.get("piano")),
            "film": bool(story.get("film")), "strings": bool(story.get("strings")), "score": bool(story.get("score"))}


def render(plan: dict, work: Path, frames_dir: Path, stills: list[int] | None = None) -> None:
    from playwright.sync_api import sync_playwright
    import base64

    web = work / "web"
    shutil.rmtree(web, ignore_errors=True)
    shutil.copytree(WEB, web)
    (web / "plan.js").write_text("window.PLAN = " + json.dumps(plan) + ";", encoding="utf-8")
    frames_dir.mkdir(parents=True, exist_ok=True)
    todo = stills if stills is not None else list(range(plan["frames"]))
    w, h = (1920, 1080) if plan.get("format") == "landscape" else (1080, 1920)
    with sync_playwright() as p:
        kw = {"args": ["--allow-file-access-from-files"]}
        if os.environ.get("CHROME_PATH"):
            kw["executable_path"] = os.environ["CHROME_PATH"]
        browser = p.chromium.launch(**kw)
        page = browser.new_page(viewport={"width": w, "height": h})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto((web / "index.html").resolve().as_uri())
        page.wait_for_function("window.ready === true")
        if errors:
            raise RuntimeError(f"Cartoon player failed to load: {errors[0]}")
        for n, f in enumerate(todo):
            data = page.evaluate("f => { renderFrame(f); return document.getElementById('c').toDataURL('image/jpeg', 0.92); }", f)
            (frames_dir / f"f{f:05d}.jpg").write_bytes(base64.b64decode(data.split(",", 1)[1]))
            if errors:
                raise RuntimeError(f"Cartoon player error at frame {f}: {errors[0]}")
            if n and n % 500 == 0:
                log(f"Rendered {n}/{len(todo)} frames")
        browser.close()


def encode(frames_dir: Path, audio: Path, out: Path) -> Path:
    run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", str(frames_dir / "f%05d.jpg"), "-i", str(audio),
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-shortest", "-movflags", "+faststart", str(out)])
    return out


def cover(frames_dir: Path, plan: dict, out: Path, title: str | None = None) -> Path:
    """Thumbnail: the frame at the twist (or two thirds in); long videos get the title in big letters."""
    from PIL import Image, ImageDraw, ImageFont

    tw = next((s for s in plan["shots"] if s.get("twist")), None)
    f = (tw.get("beat") or tw["a"]) + 6 if tw else int(plan["frames"] * 0.66)
    if plan.get("cover_frame"):
        f = plan["cover_frame"]
    title = plan.get("cover_text") or title
    f = min(f, plan["frames"] - 1)
    img = Image.open(frames_dir / f"f{f:05d}.jpg").convert("RGB")
    if plan.get("format") == "landscape" and title:
        img = img.resize((1280, 720))
        d = ImageDraw.Draw(img)
        words = re.sub(r"#\w+", "", title).strip().upper().split()
        text = " ".join(words[:5])
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 92)
        except OSError:
            font = ImageFont.load_default()
        lines, cur = [], ""
        for w in text.split():
            t = (cur + " " + w).strip()
            if d.textlength(t, font=font) > 1180 and cur:
                lines.append(cur); cur = w
            else:
                cur = t
        lines.append(cur)
        y = 720 - 40 - len(lines) * 104
        for ln in lines[:2]:
            d.text((44, y), ln, font=font, fill="#fff2e0", stroke_width=10, stroke_fill="#140a1c")
            y += 104
    img.save(out, quality=92)
    return out


LAUGH_TEXT = "Heh heh heh... Ha ha ha ha haaa!"
LAUGH_VOICE = {"engine": "kokoro", "kokoro_lang": "b", "kokoro_voice": "bm_george", "speed": 0.8, "semitones": -3.0,
               "omni": "male, middle-aged, very low pitch", "omni_key": "signature-laugh", "omni_text": "Heh heh heh... [laughter]",
               "omni_speed": 0.9,
               "name": "en-GB-RyanNeural", "rate": "-20%", "pitch": "-12Hz"}


def signature_laugh(work: Path) -> np.ndarray:
    """The channel's signature: the same deep, echoing evil laugh at the end of every video."""
    try:
        from .voice import say
        mp3 = work / "laugh.mp3"
        say(LAUGH_TEXT, LAUGH_VOICE, mp3)
        out = work / "laugh_fx.wav"
        run(["ffmpeg", "-y", "-v", "error", "-i", str(mp3), "-af",
             "aecho=0.8:0.72:110|240|400:0.5|0.32|0.2,lowpass=f=6500,volume=1.15", "-ar", str(ha.SR), "-ac", "1", str(out)])
        return ha.load(out)
    except Exception as exc:
        log(f"Signature laugh skipped: {exc}")
        return np.zeros(int(0.5 * ha.SR))


def make_video(story: dict, work: Path, seed: int, fmt: str = "vertical", voice_file: Path | None = None,
               take: Path | None = None,
               title: str | None = None) -> tuple[Path, Path, dict]:
    work.mkdir(parents=True, exist_ok=True)
    if fmt == "vertical" and not story.get("film") and not story.get("storyboard"):
        emote(story)
    plates = apply_plates(story) if fmt == "vertical" and story.get("plates", True) and not story.get("film") else {}
    casting = cast_story(story, seed, funny=(fmt == "vertical"))
    (work / "casting.json").write_text(json.dumps(casting, indent=1), encoding="utf-8")
    log("Cast: " + ", ".join(f"{k}={v['kokoro_voice']}" for k, v in casting["voices"].items() if k != "narrator"))
    # brand: a short logo sting before the story, the signature laugh after it
    intro = 0.0 if fmt == "vertical" else 2.0     # a Short's first frame is the hook, never the logo (brand stays in the outro)
    cold = fmt == "vertical" and story.get("cold_open", True) and any(b.get("twist") for b in story["beats"])
    if cold:
        intro = 0.8                               # cold open: the scariest frame of the story + the hook, then the story starts
    if take:
        voice, timing = voice_from_take(story, take)
    elif voice_file:
        voice, timing = voice_from_file(story, voice_file)
    else:
        voice, timing = voice_lines(story, casting["voices"], work, intro)
        from . import voice as vmod
        if story.get("film") and vmod.GEMINI_MISSED:   # a film never mixes acted and robotic voices
            raise RuntimeError(f"{len(vmod.GEMINI_MISSED)} lines could not be acted by Gemini today (free daily limit); "
                               "the acted lines are cached, so run again after the limit resets (08:00 UTC). Missing: "
                               + " | ".join(t[:40] for t in vmod.GEMINI_MISSED))
    outro = 3.2
    laugh = np.zeros(1) if voice_file or story.get("outro_laugh") is False else signature_laugh(work)
    story_end = intro + max(len(voice) / ha.SR, timing[-1]["end"]) + TAIL
    total = story_end + max(outro, len(laugh) / ha.SR + 0.6)
    timing = [{k: (v + intro if isinstance(v, (int, float)) else v) for k, v in tm.items()} for tm in timing]
    full = np.zeros(int(total * ha.SR) + ha.SR)
    full[int(intro * ha.SR):int(intro * ha.SR) + len(voice)] = voice
    i0 = int((story_end + 0.35) * ha.SR)
    full[i0:i0 + len(laugh)] += laugh[: len(full) - i0]
    voice = full[: int(total * ha.SR)]
    plan = build_plan(story, timing, story_end, casting, fmt, intro_f=int(round(intro * FPS)))
    if plates:
        plan["plates"] = plates
        props, info = prop_assets(story)
        if props:
            plan["props"], plan["propInfo"] = props, info
            log("Objects and animals: " + ", ".join(sorted(props)))
    plan["intro"] = int(round(intro * FPS))
    if story.get("cast_call"):
        plan["castCall"] = True
    if cold:
        tw = next((sh for sh in plan["shots"] if sh.get("twist")), None)
        if tw:
            plan["coldOpen"] = min((tw.get("beat") or tw["a"]) + 8, tw["b"] - 2)
            hook = re.sub(r"\s*\(part \d\)|#\S+", "", story.get("title", ""), flags=re.I).strip()
            plan["hook"] = hook.upper()[:60]
    if story.get("cover_beat") is not None:      # a storyboard can pick its thumbnail shot
        cs = plan["shots"][story["cover_beat"]]
        plan["cover_frame"] = cs["b"] - 6
    if story.get("cover_text"):
        plan["cover_text"] = story["cover_text"]
    plan["outro"] = int(round(total * FPS)) - plan["frames"]
    plan["frames"] = int(round(total * FPS))
    (work / "plan.json").write_text(json.dumps(plan, indent=1), encoding="utf-8")
    rows = []                                    # a timeline to check every line lands where it was asked for
    for b, sh in zip(story["beats"], plan["shots"]):
        mm, ss_ = divmod(sh["a"] / FPS, 60)
        rows.append(f"{int(mm)}:{ss_:05.2f}  {sh['scene']:<10} {b.get('speaker', ''):<8} {b.get('line', '') or '(' + str(b.get('silent')) + 's)'}")
    (work.parent / "timeline.txt").write_text("\n".join(rows), encoding="utf-8")
    log("Timeline:\n" + "\n".join(rows))
    log(f"Plan: {len(plan['shots'])} shots, {plan['frames']} frames ({total:.1f}s, {fmt})")
    master = ha.make_soundtrack(voice, plan, work, seed)
    frames_dir = work / "frames"
    render(plan, work, frames_dir)
    video = encode(frames_dir, master, work.parent / ("short.mp4" if fmt == "vertical" else "video.mp4"))
    thumb = cover(frames_dir, plan, work.parent / "cover.jpg", title)
    shutil.rmtree(frames_dir, ignore_errors=True)
    try:                                          # measured review (HyperFrames craft rules): REVIEW.txt next to the video
        from .review import review
        review(story, plan, video, fmt)
    except Exception as exc:
        log(f"Review skipped: {exc}")
    return video, thumb, plan


def make_short(story: dict, vcfg: dict, work: Path, seed: int, voice_file: Path | None = None, take: Path | None = None):
    """Kept for run_horror.py: one vertical Short (vcfg is no longer used; every story is cast fresh)."""
    return make_video(story, work, seed, "vertical", voice_file, take=take)
