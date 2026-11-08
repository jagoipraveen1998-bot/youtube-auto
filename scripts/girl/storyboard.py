"""THE GIRL ON HIS SHOULDER: storyboard for the five-minute film (writes the_girl_on_his_shoulder.json).

Every line of dialogue is used exactly as written in the script. Silent beats carry the action; the sound design
(flags like fan, monitor, strings, react cues) is timed to them.
"""
import json
from pathlib import Path

HERE = Path(__file__).parent
C = lambda **k: k
B = []


def add(line="", speaker="narrator", **k):
    B.append(dict(dict(line=line, speaker=speaker, react="none"), **k))


TIRED = dict(expr="tired")
AR = lambda **k: C(**dict(dict(expr="tired", look=0), **k))
RO = lambda **k: C(**dict(dict(expr="calm", look=0), **k))

# ============ 1 · The first night (rented house, night)
add(silent=4.6, scene="black", titleCard={"text": "THE GIRL ON HIS SHOULDER"}, strings=0.35, cam="wide", focus="wide")
add(silent=5.2, scene="gStairs", cam="pan", focus="arjun", focus2="wide", steps="wood", stepsEnd=None,
    crew=dict(arjun=AR(step=[0, 4.4, 4], box=True, look=0.6, expr="tired")), fadeIn=12)
add(silent=3.0, scene="gStairs", cam="close", focus="gap", react="grab", beat_at=0.5, strings=0.45,
    crew=dict(arjun=AR(step=4.6, box=True, reach="gap", look=-0.6, lookY=0.4, expr="tired", expr2="shock")))
add(silent=4.0, scene="gStairs", cam="medium", focus="arjun", steps="wood",
    crew=dict(arjun=AR(step=[4.7, 9.5, 14], box=True, look=0.6, expr="worried", lean=[0.06, 0.0])))
add(silent=4.4, scene="gBedTop", cam="push_in", focus="hero", fan=True, react="keys", beat_at=0.06,
    crew=dict(arjun=AR(lid=[0.5, 1.0, 20, 90], expr="tired")))
add(silent=3.6, scene="gBedTop", cam="close", focus="face", fan=False, crew=dict(arjun=AR(sleep=True)))
add(silent=5.4, scene="gBedTop", cam="push_in", focus="dip", fan=True, react="dip", beat_at=0.3, strings=0.55,
    crew=dict(arjun=AR(sleep=True, headRoll=[0, 0.18, 60, 110])))
add(silent=1.6, scene="black", cam="wide", focus="wide")

# ============ 2 · The weight (morning, the office)
add(silent=6.0, scene="gBedSide", cam="medium", focus="hero",
    crew=dict(arjun=AR(rise={"again": 92}, rub=[40, 88], expr="tired", expr2="worried", look=-0.4)), react="face", beat_at=0.4)
add(silent=4.4, scene="gStairs", day=True, cam="medium", focus="arjun", fixed=True,
    crew=dict(arjun=AR(step=[9, 4], stepHold=True, tiltR=0.55, look=-0.4, lookY=0.5)))
OFF = lambda **k: dict(dict(scene="gOffice", mode="day"), **k)
add(silent=2.6, **OFF(cam="medium", focus="two", react="catch", beat_at=0.45, cupFx=True,
    crew=dict(arjun=AR(x=820, tiltR=0.5, look=1, expr="tired", armR=0.9), rohan=RO(x=1160, look=-1, expr="curious", catchArm=True, expr2="shock"))))
add("First night in the new place that bad?", "rohan", **OFF(cam="close", focus="rohan",
    crew=dict(arjun=AR(x=820, tiltR=0.5, look=1), rohan=RO(x=1160, look=-1, expr="relieved", cupHold=True))))
add("That's the thing. I slept straight through.", "arjun", **OFF(cam="close", focus="arjun",
    crew=dict(arjun=AR(x=820, tiltR=0.5, look=1, expr="tired"), rohan=RO(x=1160, look=-1, expr="curious", cupHold=True))))
add(silent=2.2, **OFF(cam="medium", focus="two",
    crew=dict(arjun=AR(x=820, tiltR=0.5, look=1, cup="both"), rohan=RO(x=1160, look=-1, expr="worried"))))
# montage: the meeting, the office stairs, the bag
add(silent=4.4, scene="gOffice", mode="meeting", cam="push_in", focus="arjun", piano_hint=True,
    crew=dict(cw1=C(x=420, noLegs=True, y=860, s=0.5, expr="calm", look=1), arjun=AR(x=900, noLegs=True, y=860, s=0.5, nod=True, tiltR=0.6),
              cw2=C(x=1360, noLegs=True, y=860, s=0.5, expr="calm", look=-1), cw3=C(x=1740, expr="calm", look=-1, armL=1.6)))
add(silent=4.0, scene="gStairs", office=True, cam="wide", focus="wide", steps="concrete", stepsEnd=None,
    crew=dict(arjun=AR(step=[0, 5.5], stepEnd=55, tiltR=0.7, look=0.4, lookY=-0.4)))
add(silent=4.0, **OFF(cam="medium", focus="arjun", react="boxdown", beat_at=0.5,
    crew=dict(arjun=AR(x=900, bag="off", tiltR=0.8, look=-0.6, lookY=0.6))))
add(silent=3.0, strings=0.4, **OFF(cam="close", focus="arjun", crew=dict(arjun=AR(x=900, bag="floor", tiltR=0.8, look=0, expr="tired"))))

# ============ 3 · The hospital
EX = lambda **k: dict(dict(scene="gExam"), **k)
SEAT = dict(x=930, noLegs=True, y=951, s=0.52)
add(silent=4.2, react="arm", beat_at=0.72, **EX(cam="medium", focus="wide",
    crew=dict(arjun=AR(raise_=True, **SEAT), rao=C(x=1330, expr="calm", look=-1))))
add("Does it hurt when you lift it?", "rao", **EX(cam="close", focus="rao", crew=dict(arjun=AR(**SEAT, tiltR=0.6), rao=C(x=1330, expr="calm", look=-1))))
add("It doesn't hurt. It feels like somebody's leaning on me.", "arjun", strings=0.3,
    **EX(cam="close", focus="arjun", crew=dict(arjun=AR(**SEAT, tiltR=0.8, look=0.8), rao=C(x=1330, expr="curious", look=-1))))
add(silent=1.8, **EX(cam="medium", focus="rao", crew=dict(arjun=AR(**SEAT, tiltR=0.8, look=0.8), rao=C(x=1330, expr="calm", look=-1, lookY=0.6))))
add("Your blood tests and the checks we did today look normal. Come back if the heaviness gets worse. I want to follow up either way.", "rao",
    **EX(cam="close", focus="rao", crew=dict(arjun=AR(**SEAT, tiltR=0.8, look=0.8), rao=C(x=1330, expr="calm", look=-1))))
add(silent=1.6, **EX(cam="close", focus="arjun", crew=dict(arjun=AR(**SEAT, tiltR=0.7, look=0.8, expr="relieved"), rao=C(x=1330, expr="calm", look=-1))))
add(silent=2.6, react="chair", beat_at=0.3, scrape=True, **EX(cam="medium", focus="wide",
    crew=dict(arjun=AR(x=930, s=0.52, tiltR=0.9, armL=[0.22, 1.2, 0, 14], lean=[-0.1, -0.03], expr="worried"), rao=C(x=1330, expr="calm", look=-1))))
add(silent=1.8, react="face", beat_at=0.2, strings=0.5, **EX(cam="close", focus="rao",
    crew=dict(arjun=AR(x=930, s=0.52, tiltR=0.9), rao=C(x=1330, expr="calm", expr2="worried", look=-1, lookY=-0.2))))

# ============ 4 · The festival photo
DW = lambda **k: dict(dict(scene="gOffice", mode="diwali"), **k)
add(silent=3.6, **DW(cam="pan", focus="cw2", focus2="wide", timer=True, crew=dict(cw2=C(x=360, expr="relieved", look=-1, armL=1.6), cw1=C(x=700, expr="relieved", look=-1))))
add(silent=2.8, **DW(cam="medium", focus="two", steps="concrete",
    crew=dict(rohan=RO(x=980, expr="relieved", look=1, wave=True), arjun=AR(walk=[1720, 1200], tiltR=0.8, look=-1), cw1=C(x=520, expr="relieved"), cw3=C(x=1460, expr="relieved"))))
add("One photo, then you can go home.", "rohan", **DW(cam="close", focus="rohan",
    crew=dict(rohan=RO(x=980, expr="relieved", look=1), arjun=AR(x=1200, tiltR=0.8, look=-1))))
GRP = dict(cw1=C(x=470, expr="relieved"), cw2=C(x=720, expr="relieved", armR=0.5), rohan=RO(x=960, expr="relieved", armR=0.4),
           arjun=AR(x=1200, tiltR=0.8, smileAt=72), cw3=C(x=1440, expr="relieved"))
add(silent=4.0, react="timer", beat_at=0.88, **DW(cam="wide", focus="wide", crew=GRP))
add(silent=1.4, scene="black", cam="wide", focus="wide", titleCard={"text": "LATER"})
PH = lambda **k: dict(dict(scene="gPhoto", cam="wide", focus="wide", photoFrame=90), **k)
add(silent=3.8, strings=0.35, **PH(zoom=[1.0, 1.25], zc=[[960, 1050], [560, 600]]))
add(silent=3.4, react="zoom", beat_at=0.1, strings=0.55, **PH(zoom=[1.25, 3.0], zc=[[1050, 1150], [600, 700]]))
add(silent=5.2, react="reveal", beat_at=0.2, twist=True, strings=0.9, whispers=True, **PH(zoom=[3.0, 4.4, 0, 120], zc=[[1150, 1060], [700, 640, 0, 120]]))
NIGHT = lambda **k: dict(dict(scene="gOffice", mode="night"), **k)
add(silent=2.4, react="face", beat_at=0.3, strings=0.7, heart=True,
    **NIGHT(cam="close", focus="rohan", crew=dict(rohan=RO(x=960, expr="realize", pushGlasses=True, look=0, lookY=0.4, freeze=True))))
add(silent=4.2, strings=0.6, **PH(zoom=[4.4, 1.7], zc=[[1060, 1230], [640, 470]]))
add(silent=1.8, heart="accel", **NIGHT(cam="close", focus="rohan", crew=dict(rohan=RO(x=960, expr="dread", look=0.3, lookY=0.4))))

# ============ 5 · The warning
add(silent=3.0, scene="gScreen", page="listing", cam="push_in", focus="wide", typing=True)
add(silent=3.2, scene="gScreen", page="search", cam="medium", focus="wide", typing=True)
add(silent=3.6, scene="gScreen", page="news", cam="push_in", focus="headline", react="boom", beat_at=0.15, strings=0.7)
add(silent=4.4, scene="gScreen", page="news", cam="push_in", focus="portrait", react="sting", beat_at=0.35, whispers=True, strings=0.7)
add(silent=3.4, scene="gCall", call="ringing", cam="push_in", focus="screen", react="ringback", beat_at=0.05)
add(silent=3.2, scene="gBedTop", phoneGlow="blink", dip=True, fan=False, cam="medium", focus="phone", strings=0.6,
    crew=dict(arjun=AR(sleep=True, headRoll=0.18)))
add(silent=1.8, scene="gCall", call="voicemail", cam="close", focus="screen", react="vm", beat_at=0.3)
add("Arjun, call me back. I found something in the photo. It's from the house.", "rohan", strings=0.5,
    **NIGHT(cam="close", focus="rohan", crew=dict(rohan=RO(x=960, expr="dread", phone="ear", look=0.3))))
add(silent=1.6, react="keys", beat_at=0.4, **NIGHT(cam="medium", focus="rohan", crew=dict(rohan=RO(walk=[960, 1500], expr="worried", look=1))))

# ============ 6 · The drive
DR = lambda **k: dict(dict(scene="gDrive", cam="medium", focus="hero"), **k)
add(silent=4.0, strings=0.45, **DR(crew=dict(rohan=RO(expr="worried", look=0, lookY=0.1, armL=0.55, armR=0.55))))
add("Turn left at the next junction.", "nav", phone=True, scene="gNav", cam="push_in", focus="banner", subItalic=True)
add(silent=2.2, indicator=True, **DR(crew=dict(rohan=RO(expr="worried", look=-0.3, armL=0.55, armR=0.55))))
add(silent=2.0, scene="gSign", cam="wide", focus="wide", indicator=True)
add(silent=2.0, indicator=True, grip=[0, 1], **DR(crew=dict(rohan=RO(expr="calm", look=0, armL=0.55, armR=0.55))))
add(silent=2.8, headlights=True, whiteout=True, react="horn", beat_at=0.7, **DR(cam="close",
    crew=dict(rohan=RO(expr="calm", expr2="shock", look=0, lookTo=1, lookAt=18, armL=0.55, armR=0.55, headGlare=True))))
add(silent=4.4, scene="black", cam="wide", focus="wide", mute=True, tinnitus=True, monitor="fadein", bpm=88)

# ============ 7 · The visitor
HB = lambda **k: dict(dict(scene="gHospBed", monitor=True, bpm=92), **k)
POV = lambda **k: dict(dict(scene="gHospPov", monitor=True, bpm=92), **k)
add(silent=3.8, steps="concrete", **HB(cam="push_in", focus="face",
    crew=dict(rohan=RO(neckBrace=True, noGlasses=True, freeze=True, expr="stare", dart=[[0, -0.2], [0.9, 0.3], [0.9, 0.3], [0.7, 0.1]]))), fadeIn=20)
add(silent=4.4, steps="concrete", **POV(cam="wide", focus="wide", crew=dict(arjun=AR(walk=[1580, 980], glassesBag=True, tiltR=0.8, look=-0.2, lookY=0.4))))
SAT = dict(x=960, y=1290, s=1.05)
add("They called me this morning. I saw your missed calls on the way here.", "arjun",
    **POV(cam="medium", focus="face", crew=dict(arjun=AR(**SAT, glassesBag=True, tiltR=0.6, expr="worried", lookY=0.5))))
add(silent=1.8, react="chair", beat_at=0.25, **POV(cam="medium", focus="face", crew=dict(arjun=AR(**SAT, tiltR=[0.5, 0.95], expr="worried", lookY=0.5))))
add("What did you need to tell me?", "arjun", **POV(cam="close", focus="face", crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5))))
add(silent=3.2, react="reveal", beat_at=0.62, strings=1.0, **POV(cam="pan", focus="mira", focus2="face",
    crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5, mira={"look": 0, "lookY": 0.3}))))
add(silent=3.6, whispers=True, strings=0.9, **POV(cam="push_in", focus="both",
    crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5, mira={"look": 0, "lookY": 0.3}))))
add(silent=3.2, heart="accel", strings=0.8, **HB(cam="close", focus="face",
    crew=dict(rohan=RO(neckBrace=True, noGlasses=True, freeze=True, expr="dread", mouthO=0.45, dart=[[-0.8, -0.5], [-0.8, -0.5], [0.2, -0.3], [0.2, -0.3]]))))
add(silent=1.4, **POV(cam="push_in", focus="face", crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5, lean=[0, 0.04], mira={"look": 0, "lookY": 0.3}))))
add("I'm here. Take your time.", "arjun", strings=0.5,
    **POV(cam="medium", focus="both", crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="calm", lookY=0.5, mira={"look": 0, "lookY": 0.3}))))
add(silent=3.8, **POV(cam="close", focus="mira", crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5, mira={"look": 0, "lookY": 0.3, "creaseAt": 14}))))
add("Heh... heh heh.", "mira", nosubs=True, gain=0.75, **POV(cam="close", focus="mira",
    crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5, mira={"look": 0, "lookY": 0.3, "laugh": True}))))
add(silent=1.0, react="face", beat_at=0.1, **HB(cam="close", focus="face",
    crew=dict(rohan=RO(neckBrace=True, noGlasses=True, freeze=True, expr="dread", flinch=True, look=-0.6, lookY=-0.4))))
add("Heh heh heh heh!", "mira", nosubs=True, layer={"semitones": -1.0, "gain": 0.5}, **POV(cam="medium", focus="both",
    crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5, mira={"look": 0, "lookY": 0.3, "laugh": "hard"}))))
add("Heh heh...", "mira", nosubs=True, gain=0.5, scene="black", cam="wide", focus="wide", mute=True)
add(silent=2.2, scene="black", cam="wide", focus="wide", mute=True)

# raise_ -> raise (Python keyword clash)
for b in B:
    for sp in (b.get("crew") or {}).values():
        if "raise_" in sp:
            sp["raise"] = sp.pop("raise_")

story = {
    "storyboard": True, "film": True, "music": "drone", "scary": True, "piano": True, "outro_laugh": False,
    "story_id": "the-girl-on-his-shoulder",
    "title": "The Girl on His Shoulder | Animated Horror Short Film",
    "description": "Arjun moves into a rented house and sleeps straight through his first night. Since then, his right shoulder "
                   "feels heavy, as if somebody is leaning on him. Then his friend Rohan looks closely at the office Diwali photo. "
                   "An original animated horror short film.",
    "tags": ["animated horror short film", "horror short film", "ghost story", "indian ghost story", "creepy cartoon tales",
             "scary animation", "diwali horror", "haunted house", "horror animation", "short film"],
    "cover_text": "THE GIRL ON HIS SHOULDER",
    "hero": {"look": "man", "outfit": "shirt", "voice": "am_michael", "style": {}},
    "villain": "ghost",
    "cast": [
        {"role": "arjun", "gender": "m", "voice": "am_michael", "omni": "male, young adult, low pitch, indian accent",
         "style": {"skin": "#b98059", "hair": "#120e14", "hairStyle": "mop", "outfit": "shirt", "top": "#a9bdd2", "pants": "#3a3f4e",
                   "shoes": "#2a2220", "acc": {"heavyBrows": True, "longFace": True}}},
        {"role": "rohan", "gender": "m", "voice": "am_liam", "omni": "male, young adult, indian accent",
         "style": {"skin": "#c8915f", "hair": "#18121a", "hairStyle": "spiky", "outfit": "tee", "top": "#4f6f8f", "pants": "#2e3442",
                   "acc": {"rectGlasses": True, "mole": True}}},
        {"role": "rao", "gender": "f", "voice": "bf_emma", "omni": "female, middle-aged, indian accent",
         "style": {"skin": "#a8714f", "hair": "#1b1418", "hairStyle": "bun", "outfit": "shirt", "top": "#f2f4f6", "pants": "#4a5060",
                   "acc": {"rectGlasses": True, "glassesCol": "#8a96a4"}}},
        {"role": "mira", "gender": "f", "voice": "af_sky", "omni": "female, child, whisper"},
        {"role": "nav", "gender": "f", "voice": "af_nova", "omni": "female, young adult, british accent"},
        {"role": "cw1", "gender": "f", "style": {"skin": "#c8915f", "hair": "#20161a", "hairStyle": "ponytail", "outfit": "tee", "top": "#c8507a", "pants": "#2a2a3a", "acc": {}}},
        {"role": "cw2", "gender": "m", "style": {"skin": "#a8714f", "hair": "#1a1418", "hairStyle": "spiky", "outfit": "shirt", "top": "#e8d49c", "pants": "#3a3a4a", "acc": {"beard": True}}},
        {"role": "cw3", "gender": "f", "style": {"skin": "#d9a07a", "hair": "#2a1a14", "hairStyle": "braids", "outfit": "cardigan", "top": "#6a8a5a", "pants": "#3a3040", "acc": {}}},
    ],
    "voice_over": {"mira": {"omni_text": "[laughter]", "echo": True, "speed": 0.9, "semitones": 2.0}},
    "beats": B,
}
story["cover_beat"] = next(i for i, b in enumerate(B) if b.get("twist"))
out = HERE / "the_girl_on_his_shoulder.json"
out.write_text(json.dumps(story, indent=1, ensure_ascii=False), encoding="utf-8")
words = sum(len(b["line"].split()) for b in B)
sil = sum(b.get("silent", 0) for b in B)
print(out.name, len(B), "beats,", words, "words,", round(sil), "s silent, est", round((words / 2.4 + sil + 0.3 * len(B)) / 60, 2), "min")
