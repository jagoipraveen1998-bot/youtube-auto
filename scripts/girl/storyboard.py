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

# Acting directions (Gemini TTS performs each line with this emotion)
TIRED_V = "exhausted, heavy breath, low energy, a long tired sigh before speaking"
# ============ 1 · The first night (rented house, night)
add(silent=4.6, scene="black", titleCard={"text": "THE GIRL ON HIS SHOULDER"}, cue="lullaby", cam="wide", focus="wide")
add("Ahhh... today I feel very tired. What a stressful day.", "arjun", style=TIRED_V + ", talking to himself while carrying a heavy box up the stairs",
    gap=1.4, scene="gStairs", cam="pan", focus="arjun", focus2="wide", steps="wood", cue="calm", nosubs=False,
    crew=dict(arjun=AR(step=[0, 4.4], box=True, look=0.6, expr="tired")), fadeIn=12)
add(silent=2.6, scene="gStairs", cam="close", focus="gap", react="grab", beat_at=0.5, cue="uneasy",
    crew=dict(arjun=AR(step=4.6, box=True, reach="gap", look=-0.6, lookY=0.4, expr="tired", expr2="shock")))
add("What was that? Something strange happened to me.", "arjun", style="startled and shaken, catching his breath, puzzled and a little scared, half whispering",
    gap=2.0, scene="gStairs", cam="medium", focus="arjun", steps="wood",
    crew=dict(arjun=AR(step=[4.7, 9.5], stepDelay=40, box=True, look=0.6, expr="worried", lean=[0.06, 0.0])))
add("I feel tired. I should sleep fast.", "arjun", style=TIRED_V + ", mumbling as he collapses onto the bed, eyes closing",
    gap=1.6, scene="gBedTop", cam="push_in", focus="hero", fan=True, react="keys", beat_at=0.05, cue="calm",
    crew=dict(arjun=AR(lid=[0.5, 1.0, 30, 100], expr="tired")))
add(silent=3.0, scene="gBedTop", cam="close", focus="face", fan=False, crew=dict(arjun=AR(sleep=True)))
add(silent=3.2, scene="gBedTop", cam="push_in", focus="dip", fan=True, react="dip", beat_at=0.35, cue="lullaby",
    crew=dict(arjun=AR(sleep=True)))
add("Hehehe...", "mira", nosubs=True, gain=0.45, gap=1.0, style="a little girl's soft, breathy, creepy giggle, very quiet, close to the ear",
    scene="gBedTop", cam="close", focus="dip", fan=True, dip=True, ghostSmile=True,
    crew=dict(arjun=AR(sleep=True, headRoll=[0, 0.18, 10, 50])))
add(silent=1.4, scene="black", cam="wide", focus="wide", cue="silence")

# ============ 2 · The weight (morning, the office)
add("Haaaaah... I am getting late. I have to go to the office.", "arjun", style="waking up groggy, a big long yawn first, then hurried and stressed",
    gap=2.0, scene="gBedSide", cam="medium", focus="hero", cue="calm", react="face", beat_at=0.4,
    crew=dict(arjun=AR(rise={"again": 92}, rub=[40, 88], expr="tired", expr2="worried", look=-0.4)))
add(silent=4.0, scene="gStairs", day=True, cam="medium", focus="arjun", fixed=True,
    crew=dict(arjun=AR(step=[9, 4], stepHold=True, tiltR=0.55, look=-0.4, lookY=0.5)))
OFF = lambda **k: dict(dict(scene="gOffice", mode="day"), **k)
add(silent=2.4, **OFF(cam="medium", focus="two", react="catch", beat_at=0.45, cupFx=True,
    crew=dict(arjun=AR(x=820, tiltR=0.5, look=1, expr="tired", armR=0.9), rohan=RO(x=1160, look=-1, expr="curious", catchArm=True, expr2="shock"))))
add("Carefully, buddy! What happened to you? You look so tired.", "rohan", style="a quick reflex 'carefully!', then genuinely concerned and caring, a friend checking on his buddy",
    **OFF(cam="close", focus="rohan", crew=dict(arjun=AR(x=820, tiltR=0.5, look=1), rohan=RO(x=1160, look=-1, expr="worried", cupHold=True))))
add("First night in the new place that bad?", "rohan", style="light teasing with a small laugh, warm",
    **OFF(cam="close", focus="rohan", crew=dict(arjun=AR(x=820, tiltR=0.5, look=1), rohan=RO(x=1160, look=-1, expr="relieved", cupHold=True))))
add("That's the thing. I slept straight through.", "arjun", style="puzzled and tired, a weak half laugh, he doesn't understand it himself",
    **OFF(cam="close", focus="arjun", crew=dict(arjun=AR(x=820, tiltR=0.5, look=1, expr="tired"), rohan=RO(x=1160, look=-1, expr="curious", cupHold=True))))
add(silent=2.0, **OFF(cam="medium", focus="two", crew=dict(arjun=AR(x=820, tiltR=0.5, look=1, cup="both"), rohan=RO(x=1160, look=-1, expr="worried"))))
# montage: the meeting, the office stairs, the bag
MEET = dict(cw1=C(x=420, noLegs=True, y=860, s=0.5, expr="curious", look=1), arjun=AR(x=900, noLegs=True, y=860, s=0.5, nod=True, tiltR=0.6),
            cw2=C(x=1360, noLegs=True, y=860, s=0.5, expr="curious", look=-1), cw3=C(x=1740, expr="doubt", look=-1, armL=1.6))
add(silent=1.8, scene="gOffice", mode="meeting", cam="push_in", focus="arjun", cue="uneasy", crew=MEET)
add("Why does he look tired?", "cw1", style="a gossiping whisper to the colleague next to her, judging, hushed", gap=0.6,
    scene="gOffice", mode="meeting", cam="medium", focus="wide", crew=MEET)
add(silent=3.0, scene="gStairs", office=True, cam="wide", focus="wide", steps="concrete",
    crew=dict(arjun=AR(step=[0, 5.5], stepEnd=55, tiltR=0.7, look=0.4, lookY=-0.4)))
add("I have to check with a doctor for my pain.", "arjun", mind=True, subItalic=True, style="his own thoughts, quiet, worried, tired, rubbing his shoulder",
    gap=1.2, react="boxdown", beat_word="doctor", **OFF(cam="medium", focus="arjun", crew=dict(arjun=AR(x=900, bag="off", tiltR=0.8, look=-0.6, lookY=0.6))))

# ============ 3 · The hospital
EX = lambda **k: dict(dict(scene="gExam"), **k)
SEAT = dict(x=930, noLegs=True, y=951, s=0.52)
add(silent=4.0, react="arm", beat_at=0.72, cue="uneasy", **EX(cam="medium", focus="wide",
    crew=dict(arjun=AR(raise_=True, **SEAT), rao=C(x=1330, expr="calm", look=-1))))
add("Does it hurt when you lift it?", "rao", style="calm, kind, professional doctor", **EX(cam="close", focus="rao", crew=dict(arjun=AR(**SEAT, tiltR=0.6), rao=C(x=1330, expr="calm", look=-1))))
add("It doesn't hurt. It feels like somebody's leaning on me.", "arjun", style="confused and uneasy, slowly, the last words almost a whisper",
    **EX(cam="close", focus="arjun", crew=dict(arjun=AR(**SEAT, tiltR=0.8, look=0.8), rao=C(x=1330, expr="curious", look=-1))))
add(silent=1.6, **EX(cam="medium", focus="rao", crew=dict(arjun=AR(**SEAT, tiltR=0.8, look=0.8), rao=C(x=1330, expr="calm", look=-1, lookY=0.6))))
add("Your blood tests and the checks we did today look normal. Come back if the heaviness gets worse. I want to follow up either way.", "rao",
    style="reassuring and gentle, but a little puzzled underneath",
    **EX(cam="close", focus="rao", crew=dict(arjun=AR(**SEAT, tiltR=0.8, look=0.8), rao=C(x=1330, expr="calm", look=-1))))
add(silent=1.4, **EX(cam="close", focus="arjun", crew=dict(arjun=AR(**SEAT, tiltR=0.7, look=0.8, expr="relieved"), rao=C(x=1330, expr="calm", look=-1))))
add(silent=2.4, react="chair", beat_at=0.3, scrape=True, **EX(cam="medium", focus="wide",
    crew=dict(arjun=AR(x=930, s=0.52, tiltR=0.9, armL=[0.22, 1.2, 0, 14], lean=[-0.1, -0.03], expr="worried"), rao=C(x=1330, expr="calm", look=-1))))
add(silent=1.8, react="boom", beat_at=0.2, cue="dread", **EX(cam="close", focus="rao",
    crew=dict(arjun=AR(x=930, s=0.52, tiltR=0.9), rao=C(x=1330, expr="calm", expr2="worried", look=-1, lookY=-0.2))))

# ============ 4 · The festival photo
DW = lambda **k: dict(dict(scene="gOffice", mode="diwali"), **k)
add(silent=3.0, cue="festive", **DW(cam="pan", focus="cw2", focus2="wide", timer=True, crew=dict(cw2=C(x=360, expr="relieved", look=-1, armL=1.6), cw1=C(x=700, expr="relieved", look=-1))))
add("Hey, buddy, you're late! Let's take a picture.", "rohan", style="happy, energetic, calling out across a festive office party",
    **DW(cam="medium", focus="two", steps="concrete",
    crew=dict(rohan=RO(x=980, expr="relieved", look=1, wave=True), arjun=AR(walk=[1720, 1200], tiltR=0.8, look=-1), cw1=C(x=520, expr="relieved"), cw3=C(x=1460, expr="relieved"))))
add("One photo, then you can go home.", "rohan", style="friendly, coaxing, a little pleading",
    **DW(cam="close", focus="rohan", crew=dict(rohan=RO(x=980, expr="relieved", look=1), arjun=AR(x=1200, tiltR=0.8, look=-1))))
GRP = dict(cw1=C(x=470, expr="relieved"), cw2=C(x=720, expr="relieved", armR=0.5), rohan=RO(x=960, expr="relieved", armR=0.4),
           arjun=AR(x=1200, tiltR=0.8, smileAt=40), cw3=C(x=1440, expr="relieved"))
add("Smileeee!", "cw2", style="cheerful photographer, a long stretched playful 'smileee', loud", **DW(cam="wide", focus="wide", crew=GRP))
add(silent=1.8, react="timer", beat_at=0.75, **DW(cam="wide", focus="wide", crew=GRP))
add(silent=1.4, scene="black", cam="wide", focus="wide", titleCard={"text": "LATER"}, cue="silence")
PH = lambda **k: dict(dict(scene="gPhoto", cam="wide", focus="wide", photoFrame=90), **k)
add(silent=3.2, cue="uneasy", **PH(zoom=[1.0, 1.25], zc=[[960, 1050], [560, 600]]))
add(silent=3.0, react="zoom", beat_at=0.1, **PH(zoom=[1.25, 3.0], zc=[[1050, 1150], [600, 700]]))
add(silent=4.4, react="reveal", beat_at=0.2, twist=True, cue="dread", whispers=True, **PH(zoom=[3.0, 4.4, 0, 120], zc=[[1150, 1060], [700, 640, 0, 120]]))
NIGHT = lambda **k: dict(dict(scene="gOffice", mode="night"), **k)
add("Something is sitting on Arjun's shoulder... Ohhh God. I have to inform him. He is in danger.", "rohan",
    style="terrified, breathless whisper, voice shaking, panicking more with every word", cue="tension", heart=True,
    **NIGHT(cam="close", focus="rohan", crew=dict(rohan=RO(x=960, expr="realize", expr2="dread", pushGlasses=True, look=0, lookY=0.4))), react="face", beat_word="God")
add(silent=3.2, **PH(zoom=[4.4, 1.7], zc=[[1060, 1230], [640, 470]]))

# ============ 5 · The warning
add("Something happened in his new house. Let's browse and find some clues about the house.", "rohan", mind=True, subItalic=True,
    style="his own racing thoughts, nervous, determined, quick", gap=0.8, scene="gScreen", page="listing", cam="push_in", focus="wide", typing=True)
add(silent=3.0, scene="gScreen", page="search", cam="medium", focus="wide", typing=True)
add(silent=3.4, scene="gScreen", page="news", cam="push_in", focus="headline", react="boom", beat_at=0.15)
add(silent=4.0, scene="gScreen", page="news", cam="push_in", focus="portrait", react="sting", beat_at=0.35, whispers=True, cue="lullaby")
add("Pick up the call, Arjun... It's urgent.", "rohan", style="desperate, pacing, phone to his ear, begging under his breath", gap=1.0, cue="tension",
    scene="gCall", call="ringing", cam="push_in", focus="screen", react="ringback", beat_at=0.02)
add(silent=3.0, scene="gBedTop", phoneGlow="blink", dip=True, fan=False, cam="medium", focus="phone",
    crew=dict(arjun=AR(sleep=True, headRoll=0.18)))
add(silent=1.6, scene="gCall", call="voicemail", cam="close", focus="screen", react="vm", beat_at=0.3)
add("Arjun, call me back. I found something in the photo. It's from the house.", "rohan", style="urgent voicemail, scared, trying to stay calm but his voice cracks",
    **NIGHT(cam="close", focus="rohan", crew=dict(rohan=RO(x=960, expr="dread", phone="ear", look=0.3))))
add("I have to go fast.", "rohan", style="panicked, grabbing his keys, to himself, rushed", react="keys", beat_at=0.1,
    **NIGHT(cam="medium", focus="rohan", crew=dict(rohan=RO(walk=[960, 1500], expr="worried", look=1))))

# ============ 6 · The drive
DR = lambda **k: dict(dict(scene="gDrive", cam="medium", focus="hero"), **k)
add(silent=3.6, **DR(crew=dict(rohan=RO(expr="worried", look=0, lookY=0.1, armL=0.55, armR=0.55))))
add("Turn left at the next junction.", "nav", phone=True, scene="gNav", cam="push_in", focus="banner", subItalic=True, style="calm, flat satnav announcement")
add(silent=2.0, indicator=True, **DR(crew=dict(rohan=RO(expr="worried", look=-0.3, armL=0.55, armR=0.55))))
add(silent=2.0, scene="gSign", cam="wide", focus="wide", indicator=True)
add(silent=1.8, indicator=True, grip=[0, 1], **DR(crew=dict(rohan=RO(expr="calm", look=0, armL=0.55, armR=0.55))))
add(silent=1.2, headlights=True, react="face", beat_at=0.15, **DR(cam="close",
    crew=dict(rohan=RO(expr="calm", expr2="shock", look=0, lookTo=1, lookAt=4, armL=0.55, armR=0.55, headGlare=True))))
add("Ohhhhh God!", "rohan", style="a real terrified scream, headlights rushing at him, pure panic", gap=0.5,
    headlights="full", whiteout=True, react="horn", beat_word="God", **DR(cam="close",
    crew=dict(rohan=RO(expr="scream", look=1, armL=0.55, armR=0.55, glare=0.9))))
add(silent=4.2, scene="black", cam="wide", focus="wide", mute=True, tinnitus=True, monitor="fadein", bpm=88, cue="silence")

# ============ 7 · The visitor
HB = lambda **k: dict(dict(scene="gHospBed", monitor=True, bpm=92), **k)
POV = lambda **k: dict(dict(scene="gHospPov", monitor=True, bpm=92), **k)
add(silent=3.4, steps="concrete", cue="dread", **HB(cam="push_in", focus="face",
    crew=dict(rohan=RO(neckBrace=True, noGlasses=True, freeze=True, expr="stare", dart=[[0, -0.2], [0.9, 0.3], [0.9, 0.3], [0.7, 0.1]]))), fadeIn=20)
add(silent=4.0, steps="concrete", **POV(cam="wide", focus="wide", crew=dict(arjun=AR(walk=[1580, 980], glassesBag=True, tiltR=0.8, look=-0.2, lookY=0.4))))
SAT = dict(x=960, y=1290, s=1.05)
add("Ohhh, mate... are you better now?", "arjun", style="relieved to see his friend alive, emotional, soft, almost tearful",
    **POV(cam="medium", focus="face", crew=dict(arjun=AR(**SAT, glassesBag=True, tiltR=0.6, expr="worried", lookY=0.5))))
add("They called me this morning.", "arjun", style="quiet, worried", **POV(cam="medium", focus="face", crew=dict(arjun=AR(**SAT, glassesBag=True, tiltR=0.6, expr="worried", lookY=0.5))))
add(silent=1.4, react="chair", beat_at=0.25, **POV(cam="medium", focus="face", crew=dict(arjun=AR(**SAT, tiltR=[0.5, 0.95], expr="worried", lookY=0.5))))
add("Why was it so urgent? I saw your missed call on the way here.", "arjun", style="worried and confused, gentle, leaning in",
    **POV(cam="close", focus="face", crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5))))
add("What did you need to tell me?", "arjun", style="softly, patiently, a little afraid of the answer", **POV(cam="close", focus="face", crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5))))
add(silent=3.0, react="reveal", beat_at=0.6, cue="lullaby", **POV(cam="pan", focus="mira", focus2="face",
    crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5, mira={"look": 0, "lookY": 0.3}))))
add(silent=3.2, whispers=True, **POV(cam="push_in", focus="both",
    crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5, mira={"look": 0, "lookY": 0.3}))))
add(silent=2.6, heart="accel", **HB(cam="close", focus="face",
    crew=dict(rohan=RO(neckBrace=True, noGlasses=True, freeze=True, expr="dread", mouthO=0.45, dart=[[-0.8, -0.5], [-0.8, -0.5], [0.2, -0.3], [0.2, -0.3]]))))
add("Save... yourself.", "rohan", style="barely able to speak, weak, hoarse, injured, a desperate faint whisper", gain=0.8, gap=0.8,
    **HB(cam="close", focus="face", crew=dict(rohan=RO(neckBrace=True, noGlasses=True, freeze=True, expr="dread", look=-0.6, lookY=-0.4))))
add("I'm here. Take your time.", "arjun", style="kind, didn't understand, soothing, gentle",
    **POV(cam="medium", focus="both", crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="calm", lookY=0.5, mira={"look": 0, "lookY": 0.3}))))
add(silent=3.6, **POV(cam="close", focus="mira", crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5, mira={"look": 0, "lookY": 0.3, "creaseAt": 14, "tilt": 0.06}))))
add("Hehehe...", "mira", nosubs=True, gain=0.6, style="a little girl's soft breathy giggle, delighted and creepy, quiet", **POV(cam="push_in", focus="mira",
    crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5, mira={"look": 0, "lookY": 0.3, "laugh": True}))))
add(silent=1.0, react="face", beat_at=0.1, **HB(cam="close", focus="face",
    crew=dict(rohan=RO(neckBrace=True, noGlasses=True, freeze=True, expr="dread", flinch=True, look=-0.6, lookY=-0.4))))
add("Hehehehehe...", "mira", nosubs=True, style="the little girl's giggle grows, breathy and delighted, slowly louder", **POV(cam="medium", focus="both",
    crew=dict(arjun=AR(**SAT, tiltR=0.95, expr="worried", lookY=0.5, mira={"look": 0, "lookY": 0.3, "laugh": "hard"}))))
add("Hehe...", "mira", nosubs=True, gain=0.45, style="one last soft giggle fading away", scene="black", cam="wide", focus="wide", mute=True, cue="silence")
add(silent=2.2, scene="black", cam="wide", focus="wide", mute=True)

# raise_ -> raise (Python keyword clash)
for b in B:
    for sp in (b.get("crew") or {}).values():
        if "raise_" in sp:
            sp["raise"] = sp.pop("raise_")

# ============ Timing pass: every requested line starts at the second Praveen asked for.
# Durations measured from the v2 render's timeline; "at" makes the renderer hold the previous shot if a line
# arrives early, and log a warning if one is late. Indices are the beat numbers before the edits below.
TIMING = {0: ('silent', 1.92), 1: ('gap', 0.66), 2: ('silent', 1.86), 3: ('gap', 1.97), 4: ('gap', 1.3), 5: ('silent', 2.5), 6: ('silent', 2.13), 7: ('gap', 0.5), 8: ('silent', 1.07), 9: ('gap', 0.4), 11: ('silent', 1.2), 15: ('silent', 1.0), 16: ('silent', 1.0), 18: ('silent', 4.04), 19: ('gap', 1.15), 20: ('silent', 3.83), 23: ('silent', 1.56), 25: ('silent', 1.38), 26: ('silent', 2.33), 27: ('silent', 1.78), 28: ('silent', 2.88), 32: ('silent', 1.2), 33: ('silent', 1.0), 34: ('silent', 1.0), 35: ('silent', 1.2), 36: ('silent', 2.6), 38: ('silent', 4.2), 40: ('silent', 2.98), 41: ('silent', 3.37), 42: ('silent', 3.97), 43: ('gap', 0.99), 44: ('silent', 2.95), 45: ('silent', 1.59), 48: ('silent', 2.82), 50: ('silent', 1.7), 51: ('silent', 1.7), 52: ('silent', 1.56), 54: ('gap', 0.45), 55: ('silent', 3.3), 56: ('silent', 2.13), 57: ('silent', 2.42), 60: ('silent', 1.39), 63: ('silent', 2.97), 64: ('silent', 3.09), 65: ('silent', 2.52)}
for i, (k, v) in TIMING.items():
    B[i][k] = v
AT = {1: 6.3, 3: 14.0, 4: 20.0, 6: 29.0, 9: 35.0, 17: 58.0, 19: 66.0, 29: 102.0, 31: 109.0, 37: 117.0, 39: 136.0, 43: 151.0, 47: 166.0, 54: 180.0, 58: 190.0, 66: 211.0}
for i, t in AT.items():
    B[i]["at"] = t
# Rohan alone in the dark office, staring at the photo on his phone, before he starts searching
B.insert(39, dict(line="", speaker="narrator", react="none", silent=6.5, cue="tension", heart=True,
                  **NIGHT(cam="medium", focus="rohan", crew=dict(rohan=RO(x=1180, expr="dread", phone="up", look=0.7, lookY=0.3)))))
del B[10]                     # the stairs walk to work: cut so the office lines land on time

# ============ Timing pass 2: measured on the all-acted render (run 42781906385); indices are FINAL beat numbers.
# Every acted line is cached, so durations stay the same and each line lands on Praveen's second.
TIMING2 = {0: ('silent', 1.77), 1: ('gap', 0.4), 2: ('silent', 1.6), 4: ('gap', 1.12), 5: ('silent', 2.17), 11: ('gap', 0.26), 14: ('silent', 0.96), 15: ('silent', 0.96), 18: ('gap', 0.86), 19: ('silent', 2.8), 22: ('silent', 1.3), 24: ('silent', 1.19), 25: ('silent', 1.89), 26: ('silent', 1.67), 27: ('silent', 2.1), 32: ('silent', 0.9), 33: ('silent', 0.9), 35: ('silent', 1.2), 37: ('silent', 4.11), 38: ('silent', 6.35), 39: ('gap', 0.7), 40: ('silent', 2.46), 41: ('silent', 2.83), 42: ('silent', 3.28), 48: ('silent', 2.47), 50: ('silent', 1.55), 51: ('silent', 1.55), 52: ('silent', 1.44), 54: ('gap', 0.44), 55: ('silent', 3.06), 56: ('silent', 2.0), 57: ('silent', 2.27), 58: ('gap', 0.28), 60: ('silent', 1.34), 61: ('gap', 0.28), 63: ('silent', 2.54), 64: ('silent', 2.56), 65: ('silent', 2.13)}
for i, (k, v) in TIMING2.items():
    B[i][k] = v

# Timing pass 3: lines from 1:42 on landed 1.1-1.3 s late; take 1.3 s out of the doctor/office stretch.
TIMING3 = {18: ('gap', 0.74), 19: ('silent', 2.39), 22: ('silent', 1.2), 24: ('silent', 1.12), 25: ('silent', 1.71), 26: ('silent', 1.55), 27: ('silent', 1.79)}
for i, (k, v) in TIMING3.items():
    B[i][k] = v

story = {
    "storyboard": True, "film": True, "music": "drone", "scary": True, "piano": True, "score": True, "outro_laugh": False,
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
        {"role": "arjun", "gender": "m", "voice": "am_michael", "gemini_voice": "Charon", "persona": "Arjun, a 29-year-old Indian man, soft-spoken, natural Indian English accent", "omni": "male, young adult, low pitch, indian accent",
         "style": {"skin": "#b98059", "hair": "#120e14", "hairStyle": "mop", "outfit": "shirt", "top": "#a9bdd2", "pants": "#3a3f4e",
                   "shoes": "#2a2220", "acc": {"heavyBrows": True, "longFace": True}}},
        {"role": "rohan", "gender": "m", "voice": "am_liam", "gemini_voice": "Fenrir", "persona": "Rohan, a 28-year-old Indian man, warm, expressive and emotional, natural Indian English accent", "omni": "male, young adult, indian accent",
         "style": {"skin": "#c8915f", "hair": "#18121a", "hairStyle": "spiky", "outfit": "tee", "top": "#4f6f8f", "pants": "#2e3442",
                   "acc": {"rectGlasses": True, "mole": True}}},
        {"role": "rao", "gender": "f", "voice": "bf_emma", "gemini_voice": "Kore", "persona": "Dr. Leena Rao, a calm Indian woman doctor in her forties, Indian English accent", "omni": "female, middle-aged, indian accent",
         "style": {"skin": "#a8714f", "hair": "#1b1418", "hairStyle": "bun", "outfit": "shirt", "top": "#f2f4f6", "pants": "#4a5060",
                   "acc": {"rectGlasses": True, "glassesCol": "#8a96a4"}}},
        {"role": "mira", "gender": "f", "voice": "af_sky", "omni": "female, child, whisper", "gemini_voice": "Leda", "persona": "Mira, the ghost of a 12-year-old Indian girl, tiny breathy voice"},
        {"role": "nav", "gender": "f", "voice": "af_nova", "omni": "female, young adult, british accent", "gemini_voice": "Zephyr", "persona": "a car navigation voice, clear and neutral"},
        {"role": "cw1", "gender": "f", "voice": "af_nicole", "gemini_voice": "Aoede", "persona": "an Indian woman office colleague in her twenties, Indian English accent", "style": {"skin": "#c8915f", "hair": "#20161a", "hairStyle": "ponytail", "outfit": "tee", "top": "#c8507a", "pants": "#2a2a3a", "acc": {}}},
        {"role": "cw2", "gender": "m", "voice": "am_eric", "gemini_voice": "Puck", "persona": "a cheerful Indian man office colleague, Indian English accent", "style": {"skin": "#a8714f", "hair": "#1a1418", "hairStyle": "spiky", "outfit": "shirt", "top": "#e8d49c", "pants": "#3a3a4a", "acc": {"beard": True}}},
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
