"""Casting for horror cartoons: a fresh look and a distinct natural voice for every character.

Looks are drawn by horror/web/engine.js (hair styles, accessories, outfits, villain kinds).
Voices are Kokoro voices (natural, free); each speaker in a story gets a different one, the hero's
voice also narrates (the stories are told in the first person), and villains get a subtle creepy
treatment (a little slower and lower, with a faint echo) rather than a robotic pitch shift.
"""
import random

SKINS = ["#c98d62", "#e0b48c", "#a86e48", "#8a5a3a", "#d9a07a", "#f0c8a0", "#6e4630"]
HAIRS = ["#1d1420", "#3b2618", "#5a3a22", "#1a1a2a", "#8a4a22", "#c99a4a", "#2a2030"]
TOPS = {
    "pj": ["#3d4f8f", "#2f6a5a", "#7a3d5a", "#4a4a8a"],
    "hoodie": ["#8a2f3a", "#2f5a8a", "#3a7a4a", "#6a4a8a", "#d07a2a"],
    "tee": ["#d8a23a", "#3a8ab8", "#c84a4a", "#4aa86a", "#e8e0d0"],
    "nightie": ["#b98bc9", "#8ab0d8", "#e0a0b0"],
    "shirt": ["#9cc4e8", "#e8d49c", "#c8e8b0"],
    "cardigan": ["#8a6a44", "#6a7a8a", "#9a5a5a"],
    "apron": ["#5f8a6a", "#8a5f6a", "#5f6a8a"],
}
BOY_HAIR = ["spiky", "mop", "curly", "spiky"]
GIRL_HAIR = ["bob", "ponytail", "braids", "curly", "bob"]

# Kokoro voices (language from the prefix: a* American, b* British). Strong, natural-sounding ones first.
MALE = [("am_michael", "en-US-GuyNeural"), ("am_fenrir", "en-US-DavisNeural"), ("am_puck", "en-US-JasonNeural"),
        ("bm_george", "en-GB-RyanNeural"), ("bm_fable", "en-GB-ThomasNeural"), ("am_liam", "en-US-TonyNeural"),
        ("am_echo", "en-US-BrandonNeural"), ("bm_lewis", "en-GB-AlfieNeural"), ("am_onyx", "en-US-ChristopherNeural"),
        ("bm_daniel", "en-GB-OliverNeural"), ("am_eric", "en-US-EricNeural"), ("am_adam", "en-US-AndrewNeural")]
FEMALE = [("af_heart", "en-US-AriaNeural"), ("af_bella", "en-US-JennyNeural"), ("bf_emma", "en-GB-SoniaNeural"),
          ("af_nicole", "en-US-MichelleNeural"), ("bf_isabella", "en-GB-LibbyNeural"), ("af_sarah", "en-US-SaraNeural"),
          ("af_sky", "en-US-AnaNeural"), ("bf_alice", "en-GB-MaisieNeural"), ("af_aoede", "en-US-EmmaNeural"),
          ("af_kore", "en-US-AvaNeural"), ("bf_lily", "en-GB-HollieNeural"), ("af_nova", "en-US-AmberNeural")]

ROLES = {   # side characters: (gender, look defaults)
    "mum": ("f", {"adult": True, "outfit": "apron"}), "dad": ("m", {"adult": True, "outfit": "cardigan", "beard": 0.6}),
    "grandma": ("f", {"adult": True, "outfit": "cardigan", "hair": "#d8d4d0", "hairStyle": "bob", "glasses": 1.0}),
    "grandpa": ("m", {"adult": True, "outfit": "cardigan", "hair": "#d8d4d0", "hairStyle": "bald", "glasses": 0.8, "mustache": 0.7}),
    "roommate": ("x", {}), "friend": ("x", {}), "sister": ("f", {"adult": True}), "brother": ("m", {"adult": True}),
    "neighbour": ("m", {"adult": True, "outfit": "cardigan"}), "officer": ("x", {"adult": True, "outfit": "uniform"}),
    "daughter": ("f", {"outfit": "pj"}), "son": ("m", {"outfit": "pj"}),
    "landlord": ("m", {"adult": True, "outfit": "cardigan", "mustache": 0.5, "glasses": 0.5}),
}
VILLAINS = {"double", "shadow", "ghost", "doll", "neighbour", "tall", "delivery"}
VILLAIN_VOICE = {   # gender, speed, semitones, echo
    "double": ("same", 0.95, -0.5, False), "shadow": ("m", 0.84, -2.0, True), "ghost": ("f", 0.86, -1.0, True),
    "doll": ("f", 0.92, 1.5, True), "neighbour": ("m", 0.92, -0.5, False), "tall": ("m", 0.8, -2.5, True),
    "delivery": ("m", 1.02, 0.0, False),
}


def look(rnd: random.Random, gender: str, outfit: str | None = None, **over) -> dict:
    g = gender if gender in ("m", "f") else rnd.choice("mf")
    outfit = over.pop("outfit", None) or outfit or rnd.choice(["pj", "hoodie", "tee"] + (["nightie"] if g == "f" else []))
    acc = {}
    if rnd.random() < over.pop("glasses", 0.25): acc["glasses"] = True
    if rnd.random() < 0.3: acc["freckles"] = True
    if over.get("adult") and g == "m" and rnd.random() < over.pop("beard", 0.3): acc["beard"] = True
    if g == "m" and rnd.random() < over.pop("mustache", 0.0): acc["mustache"] = True
    over.pop("beard", None); over.pop("adult", None)
    return {
        "skin": over.pop("skin", None) or rnd.choice(SKINS),
        "hair": over.pop("hair", None) or rnd.choice(HAIRS),
        "hairStyle": over.pop("hairStyle", None) or rnd.choice(GIRL_HAIR if g == "f" else BOY_HAIR),
        "outfit": outfit, "top": rnd.choice(TOPS.get(outfit, ["#3d4f8f"])), "acc": acc, "gender": g,
    }


def cast_story(story: dict, seed: int) -> dict:
    """Looks for hero, villain and side characters, plus a voice for every speaker."""
    rnd = random.Random(seed)
    hl = story["hero"].get("look")
    hero_g = "f" if hl in ("girl", "woman") else "m"
    adult = {"adult": True, "outfit": story["hero"].get("outfit") or rnd.choice(["cardigan", "tee", "hoodie"])} if hl in ("man", "woman") else {}
    hero = look(rnd, hero_g, **adult) if adult else look(rnd, hero_g, story["hero"].get("outfit"))
    kind = story.get("villain", "shadow")
    other = {"kind": kind, "outfit": {"pj": "shirt", "hoodie": "tee", "tee": "hoodie", "nightie": "shirt"}.get(hero["outfit"], "hoodie"),
             "glow": rnd.choice(["#ff3b3b", "#7dff6a", "#ffd23b", "#c46aff", "#6ad8ff"])}
    vl = story.get("villain_look")
    if vl and kind in ("ghost", "double"):
        other["look"] = look(rnd, "f" if vl in ("girl", "woman") else "m", "nightie" if vl == "girl" else None)
        if kind == "double":
            other.pop("look")
    side = {}
    for c in story.get("cast", [])[:4]:
        role = c.get("role")
        g, d = ROLES.get(role, ("x", {}))
        side[role] = look(rnd, g if g != "x" else rnd.choice("mf"), **dict(d))

    males, females = MALE[:], FEMALE[:]
    rnd.shuffle(males); rnd.shuffle(females)
    take = lambda g: (males if g == "m" else females).pop(0)
    voices = {}
    hv = take(hero["gender"])
    voices["hero"] = {"kokoro_voice": hv[0], "name": hv[1], "speed": 0.92 + rnd.random() * 0.06, "semitones": 0.0}
    voices["narrator"] = voices["hero"]
    for role, lk in side.items():
        v = take(lk["gender"])
        voices[role] = {"kokoro_voice": v[0], "name": v[1], "speed": 0.95 + rnd.random() * 0.08,
                        "semitones": -0.5 if role in ("grandpa", "dad", "landlord") else 2.0 if role in ("daughter", "son") else 0.0}
    vg, sp, semi, echo = VILLAIN_VOICE.get(kind, ("m", 0.88, -1.5, True))
    if vl in ("girl", "boy") and vg != "same":
        vg, semi = ("f" if vl == "girl" else "m"), 2.0
    if vg == "same":
        voices["villain"] = dict(voices["hero"], speed=sp, semitones=semi, echo=echo)
    else:
        v = take(vg)
        voices["villain"] = {"kokoro_voice": v[0], "name": v[1], "speed": sp, "semitones": semi, "echo": echo}
    for k, v in voices.items():
        v.setdefault("engine", "kokoro")
        v["kokoro_lang"] = "b" if v["kokoro_voice"].startswith("b") else "a"
        v.setdefault("rate", "-6%")
        v.setdefault("pitch", "+0Hz")
    return {"hero": hero, "other": other, "cast": side, "voices": voices}
