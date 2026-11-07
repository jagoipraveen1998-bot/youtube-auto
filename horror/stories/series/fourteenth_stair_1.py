"""Storyboard for THE 14TH STAIR, Part 1 (writes the .json next to this file)."""
import json
from pathlib import Path

H = lambda **k: dict(dict(pose="stand", expr="calm"), **k)
B = []
def add(line="", speaker="narrator", **k):
    B.append(dict(dict(line=line, speaker=speaker, react="none", scene="stairs", place="YOUR STAIRS", cam="medium", focus="body"), **k))

add("Imagine you've counted the *stairs* in your house every night for years.", cam="push_in", focus="body",
    hero=H(step=0, expr="calm", look=0.6, lookY=-0.5), numbers=False)
add("*Thirteen.* Always thirteen.", cam="wide", focus="wide", countRun=[1, 13], creaks=True, beat_at=0.95,
    hero=H(step=0, expr="calm", look=0.6, lookY=-0.6))
add("Tonight, you climb them half asleep.", cam="pan", focus2="wide", focus="body", hero=H(step=[0, 10], expr="sleepy"), numbers=False)
add("Eleven. Twelve. *Thirteen.*", cam="close", focus="feet", creaks=True, hero=H(step=[10, 13], expr="sleepy"))
add("*Fourteen.*", cam="snap", focus="face", extra="top", react="face", beat_at=0.1, heart=True, creaks=True,
    hero=H(step=14, expr="sleepy", expr2="realize"))
add("You laugh it off. You probably *miscounted.*", cam="close", focus="face", extra="top", numbers=False,
    hero=H(step=14, expr="doubt", look=-0.5))
add("So you walk back down. Slowly.", cam="medium", focus="body", numbers=False, hero=H(step=[13, 1], dir="down", expr="worried"))
add("*Thirteen.* But your foot still hasn't touched the *floor.*", cam="close", focus="feet", extra="bottom", heart=True,
    react="face", beat_word="floor", hero=H(step=1, dir="down", expr="worried", expr2="realize"), numbers=False)
add("There's one more step. And it's *soft.*", cam="pull_out", focus="feet", extra="bottom", soft=True, heart=True,
    hero=H(step=-1, dir="down", expr="dread"), numbers=False)
add("Under the stairs, something *breathes* in.", cam="push_in", focus="under", extra="bottom", soft=True, breathe=True,
    eyesIn=True, react="face", beat_word="breathes", hero=H(step=-1, dir="down", expr="dread", look=0.8), numbers=False)
add("*Fourteen.*", "villain", cam="push_in", focus="under", extra="bottom", soft=True, eyes=1, twist=True, light="flicker",
    react="face", beat_at=0.1, hero=H(step=-1, expr="scream", look=0.8), numbers=False)

story = {
    "storyboard": True, "captions": True, "music": "drone",
    "series": {"name": "THE 14TH STAIR", "part": 1},
    "story_id": "fourteenth-stair-1",
    "title": "I counted my stairs every night. Tonight there were 14 😨 (The 14th Stair Part 1) #shorts #horror",
    "description": "You've counted thirteen stairs every night for years. Tonight there's one more. Part 2 tomorrow.",
    "tags": ["horror shorts", "scary story", "animated horror", "the 14th stair", "creepy stairs", "horror series", "pov horror"],
    "hero": {"look": "man", "outfit": "hoodie", "voice": "am_fenrir",
             "style": {"skin": "#d9a07a", "hair": "#2b1d14", "hairStyle": "mop", "outfit": "hoodie", "top": "#3c4a63", "acc": {}}},
    "villain": "shadow",
    "cast": [],
    "voice_over": {"narrator": {"speed": 0.9, "semitones": -1.5},
                   "villain": {"like": "narrator", "speed": 0.72, "semitones": -6.0, "echo": True}},
    "beats": B,
}
out = Path(__file__).with_suffix(".json")
out.write_text(json.dumps(story, indent=1, ensure_ascii=False), encoding="utf-8")
print(out.name, len(B), "beats", sum(len(b["line"].split()) for b in B), "words")
