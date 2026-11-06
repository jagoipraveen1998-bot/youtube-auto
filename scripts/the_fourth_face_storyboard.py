import json
C = lambda **k: k
CAR = dict(maya=C(expr="calm", look=0.2), ben=C(expr="calm", look=-0.2))
def car(**k): return dict(scene="car", crew=k.pop("crew", CAR), **k)
def st(**k): return dict(scene="station", **k)
HERO = lambda **k: dict(dict(pose="stand", expr="worried"), **k)
B = []
def add(line="", speaker="narrator", **k):
    b = dict(dict(line=line, speaker=speaker, react="none"), **k)
    if b.get("silent"): b["silent"] = round(b["silent"] * 1.15, 2)     # let the action breathe
    B.append(b)

# ---- The photo
add(silent=3.2, chapter="The photo", **car(cam="pull_out", focus="radio", radio=True, hero=HERO(expr="calm"),
    crew=dict(maya=C(expr="calm", look=0.2), ben=C(expr="calm", reach=True, look=-0.6))))
add("You know we've heard this song three times.", "ben", **car(cam="close", focus="ben", radio=True, hero=HERO(expr="calm"),
    crew=dict(maya=C(expr="calm", look=0.2), ben=C(expr="tired", reach=True, look=-0.6))))
add("And you've skipped it before the good part three times.", "maya", **car(cam="close", focus="maya", radio=True, hero=HERO(expr="relieved"),
    crew=dict(maya=C(expr="relieved", look=0.5), ben=C(expr="tired", look=-0.5))))
add(silent=3.6, beat_at=0.78, react="shutter", scene="selfie", mode="three", cam="push_in", focus="hero")
add(silent=2.4, scene="phone2", mode="photo", bg="car", cam="push_in", focus="photo")
add(silent=2.4, beat_at=0.45, react="send", scene="phone2", mode="chat", bg="car", cam="medium", focus="screen",
    text=dict(name="Dad", msg="On our way home."))
add(silent=2.2, beat_at=0.6, react="buzz", jump=True, **car(cam="wide", hero=HERO(expr="calm", phone="down"),
    crew=dict(maya=C(expr="calm", look=0.2), ben=C(expr="sleepy", look=-0.3))))
add(silent=2.0, beat_at=0.08, react="ring", scene="phone2", mode="call", bg="car", cam="close", focus="screen",
    text=dict(name="DAD", sub="calling..."))
# ---- Dad's warning
add("Hey, Dad. We're about—", "hero", chapter="Dad's warning", **car(cam="close", focus="hero", hero=HERO(expr="relieved", phone="ear")))
add("Joe. Listen to me. I need you to get out of that car right now.", "dad", phone=True, vspeed=0.92, react="face", beat_word="car",
    **car(cam="push_in", focus="hero", hero=HERO(expr="relieved", expr2="worried", phone="ear")))
add("What happened? Why do you sound scared?", "hero", **car(cam="close", focus="hero", hero=HERO(expr="worried", phone="ear")))
add("I'll explain when you're out. Tell Maya to pull over somewhere safe.", "dad", phone=True, vspeed=0.92,
    **car(cam="pan", focus2="hero", focus="maya", hero=HERO(expr="worried", phone="ear")))
add("Dad, you're freaking me out.", "hero", **car(cam="close", focus="hero", hero=HERO(expr="worried", phone="ear", shake=2)))
add(silent=2.4, beat_at=0.05, react="breath", **car(cam="close", focus="hero", hero=HERO(expr="stare", phone="ear")))
add("Keep looking straight ahead, okay?", "dad", phone=True, vspeed=0.84, react="face", beat_word="straight",
    **car(cam="push_in", focus="hero", hero=HERO(expr="stare", expr2="shock", phone="ear")))
add(silent=1.9, **car(cam="close", focus="mirror", mirror=True, hero=HERO(expr="stare", phone="ear")))
add("Maya. The gas station up there. Pull in.", "hero", **car(cam="medium", focus="hero", hero=HERO(expr="worried", phone="ear"),
    crew=dict(maya=C(expr="curious", look=0.6), ben=C(expr="curious", look=-0.6))))
add(silent=3.4, **st(cam="wide", carIn=True, crew={}))
add(silent=2.3, beat_at=0.15, react="slam", **st(cam="pan", focus2="wide", focus="door", hero=HERO(phone="down"),
    crew=dict(maya=C(expr="worried", look=1), ben=C(expr="worried", look=1))))
add("What did he say?", "maya", **st(cam="close", focus="maya", hero=HERO(phone="down"),
    crew=dict(maya=C(expr="worried", look=1), ben=C(expr="worried", look=1))))
add(silent=1.5, beat_at=0.3, react="buzz", **st(cam="close", focus="hero", hero=HERO(phone="up", lookY=0.5),
    crew=dict(maya=C(expr="worried", look=1), ben=C(expr="worried", look=1))))
# ---- The fourth face
add(silent=2.2, beat_at=0.2, react="circle", chapter="The fourth face", scene="phone2", mode="circle", bg="station", cam="close", focus="photo",
    zoom=[1, 1], text=dict(sub="on speaker  1:12"))
add("Right behind you. Do you see it?", "dad", phone=True, vspeed=0.92, scene="phone2", mode="circle", bg="station", cam="close",
    focus="photo", zoom=[1, 1.8], text=dict(sub="on speaker  1:14"))
add(silent=2.2, scene="phone2", mode="circle", bg="station", cam="close", focus="photo", zoom=[1.8, 2.9], react="zoom", beat_at=0.1,
    text=dict(sub="on speaker  1:17"))
add("Son, there's a ghost in that car.", "dad", phone=True, vspeed=0.9, react="jolt", beat_word="ghost",
    **st(cam="snap", focus="hero", hero=HERO(expr="worried", expr2="shock", phone="up"),
         crew=dict(maya=C(expr="worried", look=1), ben=C(expr="worried", look=1))))
add(silent=2.2, **st(cam="pan", focus2="hero", focus="door", beam=True, hero=HERO(phone="up", x=1520, look=-1),
    crew=dict(maya=C(expr="worried", look=1), ben=C(expr="worried", look=1))))
add("Joe. What are you doing?", "ben", **st(cam="close", focus="ben", beam=True, hero=HERO(phone="up", x=1520, look=-1),
    crew=dict(maya=C(expr="worried", look=1), ben=C(expr="worried", look=1))))
add(silent=2.8, beat_at=0.62, react="shift", **st(cam="close", focus="window", beam=True, hero=HERO(phone="up", x=1520, look=-1)))
add(silent=2.8, beat_at=0.2, react="knock", **st(cam="close", focus="window", hero=HERO(phone="up", x=1520, look=-1)))
add(silent=1.1, beat_at=0.1, react="jolt", **st(cam="close", focus="hero", hero=HERO(expr="shock", phone="up", x=1520, look=-1)))
add(silent=3.0, beat_at=0.22, react="door_open", shoe=40, **st(cam="close", focus="low", hero=HERO(phone="up", x=1520, look=-1)))
add(silent=2.4, **st(cam="pan", focus2="low", focus="malik", door="open", hero=HERO(expr="shock", phone="up", x=1560, look=-1),
    crew=dict(malik=C(expr="sleepy", x=1180, look=1))))
add("Why'd you guys get out? Are we getting snacks?", "malik", **st(cam="close", focus="malik", door="open",
    hero=HERO(expr="shock", phone="up", x=1560, look=-1), crew=dict(malik=C(expr="sleepy", x=1180, look=0.6))))
# ---- The second photo
add(silent=1.9, beat_at=0.45, react="gag", chapter="The second photo", **st(cam="close", focus="hero", door="open",
    hero=HERO(expr="stare", expr2="shock", phone="up", x=1560, look=-1), crew=dict(malik=C(expr="sleepy", x=1180, look=0.6))))
add("Dad. That's Malik. We picked him up after we left.", "hero", **st(cam="medium", focus="pair", door="open",
    hero=HERO(expr="tired", phone="up", x=1640, look=-0.6), crew=dict(malik=C(expr="sleepy", x=1360, look=0.8))))
add("Then why did he look like that?", "dad", phone=True, **st(cam="medium", focus="pair", door="open",
    hero=HERO(expr="tired", phone="up", x=1640), crew=dict(malik=C(expr="curious", x=1470, look=1, lean=0.12))))
add("Because your son takes pictures like he's being chased.", "malik", **st(cam="close", focus="malik", door="open",
    hero=HERO(expr="tired", phone="up", x=1640), crew=dict(malik=C(expr="tired", x=1470, look=1, lean=0.12))))
add("Ha! Ha ha ha!", "ben", **st(cam="close", focus="ben", door="open", hero=HERO(expr="relieved", x=1640),
    crew=dict(maya=C(expr="relieved", look=1), ben=C(expr="relieved", laugh=True, look=1), malik=C(expr="tired", x=1470, look=1))))
add(silent=1.6, beat_at=0.4, react="dome", dome=True, **st(cam="medium", focus="group", door="open", hero=HERO(expr="relieved", x=1640),
    crew=dict(maya=C(expr="relieved", look=1), ben=C(expr="relieved", laugh=True, look=1), malik=C(expr="calm", x=1470, look=1))))
add("Take another one before he calls a priest.", "maya", dome=True, **st(cam="close", focus="maya", door="open",
    hero=HERO(expr="relieved", x=1640), crew=dict(maya=C(expr="relieved", look=1), ben=C(expr="relieved", look=1),
    malik=C(expr="calm", x=1470, look=1))))
add(silent=3.2, beat_at=0.75, react="shutter", scene="selfie", mode="four", cam="push_in", focus="hero")
add(silent=2.6, beat_at=0.5, react="pop", scene="phone2", mode="reply", bg="station", cam="medium", focus="screen",
    text=dict(name="Dad", msg="Hi Malik. Sorry."))
add("I forgive you.", "malik", dome=True, **st(cam="close", focus="malik", door="open", hero=HERO(expr="relieved", phone="up", x=1640),
    crew=dict(malik=C(expr="relieved", x=1490, look=1, lean=0.22))))
add("Don't do that.", "dad", phone=True, dome=True, **st(cam="medium", focus="pair", door="open",
    hero=HERO(expr="relieved", phone="up", x=1640), crew=dict(malik=C(expr="relieved", x=1490, look=1, lean=0.22))))
add("Ha ha ha.", "hero", beat_at=0.95, react="hangup", dome=True, **st(cam="close", focus="hero", door="open",
    hero=HERO(expr="relieved", laugh=True, phone="up", x=1640), crew=dict(malik=C(expr="relieved", x=1490, look=1))))
# ---- The call
add(silent=2.6, beat_at=0.05, react="ring", chapter="The call", scene="phone2", mode="call", bg="station", cam="close", focus="screen",
    text=dict(name="MALIK", sub="incoming call"))
add(silent=2.4, beat_at=0.15, react="face", dome=True, **st(cam="medium", focus="pair", door="open",
    hero=HERO(expr="relieved", expr2="worried", phone="up", x=1700, glance=-1), crew=dict(malik=C(expr="relieved", x=1380, look=1))))
add("Hello?", "hero", vspeed=0.88, gain=0.62, dome=True, **st(cam="close", focus="hero", door="open",
    hero=HERO(expr="worried", phone="ear", x=1700, shake=3), crew=dict(malik=C(expr="relieved", x=1380, look=1))))
add("Sorry, Joe. I got sick, so I won't come.", "malik", phone=True, react="face", beat_word="sick", dome=True,
    **st(cam="push_in", focus="hero", door="open", hero=HERO(expr="worried", expr2="stare", phone="ear", x=1700, shake=2),
         crew=dict(malik=C(expr="relieved", x=1380, look=1))))
add(silent=1.8, dome=True, **st(cam="close", focus="hero", door="open", hero=HERO(expr="stare", phone="ear", x=1700, shake=3, lookTo=-1),
    crew=dict(malik=C(expr="relieved", x=1380, look=1))))
add(silent=2.8, beat_at=0.3, react="fake", twist=True, fakeGlow=True, dome=True, **st(cam="push_in", focus="malik", door="open",
    hero=HERO(expr="stare", phone="ear", x=1700, turn=0), crew=dict(malik=C(expr="calm", fake=True, x=1380, look=1))))
add(silent=1.0, beat_at=0.1, react="sting", redOn=True, fakeGlow=True, dome=True, **st(cam="snap", focus="hero", door="open",
    hero=HERO(expr="shock", terror=True, phone="ear", x=1700, look=-1), crew=dict(malik=C(expr="calm", fake="full", x=1380, look=1))))
add("Haa... haa...", "villain", react="fake", beat_at=0.02, shake=30, gap=0.15, fakeGlow=True, dome=True,
    layer=dict(semitones=-7.0, speed=0.72, gain=0.5, echo=True),
    **st(cam="close", focus="malik", door="open", hero=HERO(expr="stare", phone="ear", x=1700, turn=0),
         crew=dict(malik=C(expr="calm", fake="full", x=1380, look=1))))
add("HAA... HAAAA!", "villain", react="fake", beat_at=0.02, shake=70, light="flicker", fakeGlow=True, dome=True, blackout=24,
    layer=dict(semitones=-9.0, speed=0.7, gain=0.65, echo=True),
    **st(cam="close", focus="malikClose", door="open", hero=HERO(expr="stare", phone="ear", x=1700, turn=0),
         crew=dict(malik=C(expr="calm", fake="full", x=1380, look=1))))

story = {
  "title": "My Dad Found a Fourth Face in Our Car Selfie",
  "story_id": "the-fourth-face",
  "description": "Four friends, one late drive home, one blurry selfie. Then Joe's dad calls in a panic, begging him to get out of the car right now. Something in the photo is sitting right behind him.",
  "tags": ["horror comedy", "animated horror story", "scary cartoon", "car selfie ghost", "skinwalker story", "creepy cartoon tales",
           "funny horror", "ghost in photo", "horror short film", "animated scary story", "gas station horror", "night drive horror"],
  "hero": {"look": "man", "outfit": "tee", "voice": "am_puck",
           "style": {"skin": "#d9a07a", "hair": "#3b2618", "hairStyle": "spiky", "outfit": "tee", "top": "#3a8ab8", "acc": {}}},
  "villain": "double",
  "cast": [
    {"role": "maya", "gender": "f", "voice": "af_heart",
     "style": {"skin": "#e0b48c", "hair": "#1d1420", "hairStyle": "ponytail", "outfit": "cardigan", "top": "#c84a4a", "acc": {}}},
    {"role": "ben", "gender": "m", "voice": "bm_fable",
     "style": {"skin": "#f0c8a0", "hair": "#c99a4a", "hairStyle": "mop", "outfit": "shirt", "top": "#e8d49c", "acc": {"glasses": True, "freckles": True}}},
    {"role": "malik", "gender": "m", "voice": "am_michael",
     "style": {"skin": "#6e4630", "hair": "#141018", "hairStyle": "curly", "outfit": "hoodie", "top": "#24222c", "acc": {"earbud": True, "crease": True}}},
    {"role": "dad", "gender": "m", "voice": "am_fenrir", "style": {}}],
  "voice_over": {"villain": {"like": "malik", "semitones": -4.0, "speed": 0.8, "echo": True}},
  "beats": B,
}
import sys
json.dump(story, open(sys.argv[1], "w"), indent=1, ensure_ascii=False)
words = sum(len(b["line"].split()) for b in B)
print(len(B), "beats", words, "words; silent", round(sum(b.get("silent", 0) for b in B), 1), "s")
