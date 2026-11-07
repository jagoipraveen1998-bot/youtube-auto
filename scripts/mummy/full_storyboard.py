"""THE MUMMY DOWNSTAIRS: full film storyboard (writes the_mummy_downstairs.json next to this file)."""
import json
from pathlib import Path

HERE = Path(__file__).parent
C = lambda **k: k
J = lambda **k: dict(dict(pose="stand", expr="worried"), **k)
PJ = dict(outfit="pj", top="#3d5a8a", pants="#34437a")
GOWN = dict(outfit="nightie", top="#a9c9a4", pants="#a9c9a4")
B = []
def add(line="", speaker="narrator", **k):
    B.append(dict(dict(line=line, speaker=speaker, react="none"), **k))

# ================= Scene 1: The Wrong Delivery (front hallway, afternoon sun)
FAM = dict(mom=C(x=170, expr="curious", look=1), kim=C(x=760, expr="curious", look=1), dad=C(x=1060, expr="calm", look=1, armR=1.1))
def hall(**k):
    crew = dict(FAM); crew.update(k.pop("crew", {}))
    return dict(dict(scene="hallDay", caseLying=True, caseX=1480, hero=J(x=460, expr="curious", look=1), crew=crew), **k)
WK = dict(worker=C(x=1830, expr="calm", look=-1), worker2=C(x=2040, expr="calm", look=-1))
add(silent=3.2, chapter="The Wrong Delivery", scene="insert", insert="chainface", react="chain", beat_at=0.5, cam="push_in", focus="wide")
add(silent=3.8, beat_at=0.25, react="scrape", **hall(caseCarried=True, carry=[2150, 1480], cam="pull_out", focus="door",
    crew=dict(worker=C(expr="tired"), worker2=C(expr="tired"))))
add("Dad… why is there a coffin in our house?", "hero", **hall(cam="close", focus="hero", hero=J(x=460, expr="shock", look=1), crew=WK))
add("A sarcophagus. And it's supposed to be at the museum.", "dad", **hall(cam="close", focus="dad", crew=WK))
add(silent=2.0, **hall(cam="medium", focus="family", crew=dict(WK, dad=C(x=1060, expr="curious", look=0, lookY=0.8, armR=1.3), mom=C(x=170, expr="tired", look=1))))
add("Please tell me this is going straight back on the truck.", "mom", **hall(cam="close", focus="mom", crew=dict(WK, mom=C(x=170, expr="tired", look=1))))
add("They've used my home address instead of the museum's receiving entrance.", "dad", **hall(cam="close", focus="dad", crew=dict(WK, dad=C(x=1060, expr="tired", look=-1, armR=1.3))))
add("Dispatch says the collection team can return tomorrow afternoon.", "worker", **hall(cam="close", focus="worker", crew=WK))
add(silent=1.8, **hall(cam="medium", focus="hero", crew=dict(WK, kim=C(walk=[760, 700], expr="sly", look=1)), hero=J(x=460, expr="worried", look=1)))
add("Maybe he wanted to meet the family.", "kim", **hall(cam="close", focus="kim", crew=dict(WK, kim=C(x=700, expr="relieved", look=1))))
add("That's really funny.", "hero", **hall(cam="close", focus="hero", hero=J(x=460, expr="tired", look=1), crew=dict(WK, kim=C(x=700, expr="relieved", look=-1))))
add("You haven't even introduced yourself.", "kim", **hall(cam="close", focus="kim", crew=dict(WK, kim=C(x=700, expr="doubt", look=-1))))
add(silent=1.4, react="jolt", beat_at=0.25, **hall(cam="medium", focus="hero", hero=J(x=460, expr="shock", look=1), crew=dict(WK, kim=C(x=680, expr="relieved", look=-1, armL=1.4))))
add("Kim. Enough.", "mom", **hall(cam="close", focus="mom", crew=dict(WK, mom=C(x=170, expr="tired", look=1))))
add("We'll keep it downstairs until they collect it. Everyone leaves the case alone.", "dad", **hall(cam="close", focus="dad", crew=dict(WK, dad=C(x=1060, expr="calm", look=-1))))
add(silent=3.6, react="chain", beat_at=0.3, scene="basement", lightOn=True, cam="push_in", focus="face", vig=0.55, eyesFollow=False,
    crew=dict(worker=C(x=1450, expr="tired", look=1), worker2=C(x=2050, expr="tired", look=-1)))

# ================= Scene 2: The Dare (from the approved sample)
s2 = json.loads((HERE / "scene2_the_dare.json").read_text(encoding="utf-8"))["beats"]
B.extend(s2)

# ================= Scene 3: Nothing Moved
add(silent=2.0, chapter="Nothing Moved", scene="basement", lightOn=True, cam="medium", focus="stairs", vig=0.55, creaks=True, countRun=[1, 9],
    hero=J(step=[9.6, 0.3], expr="scream", look=-0.6, lookY=-0.6))
add("Open it! Open it right now!", "hero", react="pound", beat_at=0.05, scene="basement", lightOn=True, cam="close", focus="door", vig=0.55,
    hero=J(step=0.3, expr="scream", look=-1))
K3 = dict(dad=C(expr="calm", look=-0.4, lookY=0.5))
def kit(**k):
    crew = dict(K3); crew.update(k.pop("crew", {}))
    return dict(dict(scene="kitchenB", crew=crew, vig=0.3), **k)
add(silent=1.8, react="unlock", beat_at=0.1, door="opening", lightOn=True, **kit(cam="medium", focus="door",
    hero=J(walk=[380, 920], expr="scream", look=1), crew=dict(kim=C(x=470, expr="relieved", look=-1))))
add("You should've heard yourself!", "kim", **kit(cam="close", focus="kim", door="open", lightOn=True, hero=J(x=920, look=-1), crew=dict(kim=C(x=470, expr="relieved", laugh=True, look=1))))
add("The lid moved!", "hero", **kit(cam="close", focus="hero", door="open", lightOn=True, hero=J(x=920, expr="shock", look=-1), crew=dict(kim=C(x=470, expr="relieved", look=1))))
add(silent=1.2, react="face", beat_at=0.5, **kit(cam="close", focus="kim", door="open", lightOn=True, hero=J(x=920, look=-1),
    crew=dict(kim=C(x=470, expr="curious", expr2="relieved", look=1))))
add("Sure it did.", "kim", **kit(cam="close", focus="kim", door="open", lightOn=True, hero=J(x=920, look=-1), crew=dict(kim=C(x=470, expr="doubt", look=1))))
add("The chains were shaking. I saw it.", "hero", **kit(cam="close", focus="hero", door="open", lightOn=True, hero=J(x=920, expr="worried", look=-1), crew=dict(kim=C(x=470, expr="calm", look=1))))
add(silent=1.3, **kit(cam="medium", focus="two", door="open", lightOn=True, hero=J(x=920, look=-1), crew=dict(kim=C(x=470, expr="curious", look=-1))))
add("Come on. I'll show you.", "kim", **kit(cam="close", focus="kim", door="open", lightOn=True, hero=J(x=920, look=-1), crew=dict(kim=C(x=470, expr="relieved", look=1))))
add(silent=3.6, scene="basement", lightOn=True, door="open", cam="medium", focus="stairs", vig=0.5, creaks=True, countRun=[1, 9],
    hero=J(step=[0, 5], expr="worried", look=0.6), crew=dict(kim=C(step=[0.5, 9.8], expr="relieved", look=0.6)))
add(silent=1.8, scene="basement", lightOn=True, cam="push_in", focus="case", vig=0.55, eyesFollow=True, whispers=True,
    hero=J(x=1150, expr="worried", look=1), crew=dict(kim=C(x=1480, expr="relieved", look=1)))
add("Exactly where we left it.", "kim", scene="basement", lightOn=True, cam="close", focus="kim", vig=0.5,
    hero=J(x=1150, expr="worried", look=1), crew=dict(kim=C(x=1480, expr="relieved", look=-1)))
add(silent=1.3, react="knock2", beat_at=0.2, scene="basement", lightOn=True, cam="medium", focus="case", vig=0.5,
    hero=J(x=1150, expr="worried", look=1), crew=dict(kim=C(x=1520, expr="relieved", look=1, armR=1.5)))
add("Anybody home?", "kim", scene="basement", lightOn=True, cam="close", focus="kim", vig=0.5,
    hero=J(x=1150, expr="worried", look=1), crew=dict(kim=C(x=1520, expr="doubt", look=1)))
add("Stop doing that.", "hero", scene="basement", lightOn=True, cam="close", focus="hero", vig=0.5,
    hero=J(x=1150, expr="worried", look=1), crew=dict(kim=C(x=1520, expr="relieved", look=-1)))
add(silent=3.2, scene="basement", lightOn=True, cam="push_in", focus="lid", vig=0.6, eyesFollow=True,
    hero=J(aisle=[1150, 1540], expr="dread", look=1), crew=dict(kim=C(walk=[1520, 900], expr="relieved", look=-1)))
add(silent=3.0, react="shift", beat_at=0.6, scene="basement", lightOn=True, cam="push_in", focus="face", vig=0.7, eyesFollow=False, whispers=True)

# ================= Scene 4: Footsteps (Jeff's bedroom at night)
def bed(**k):
    return dict(dict(scene="bedroomNight", vig=0.45), **k)
JB = lambda **k: J(pose="lie", **dict(PJ, **k))
add(silent=4.2, chapter="Footsteps", **bed(cam="push_in", focus="hero", hero=JB(expr="worried", look=0.6)))
add(silent=2.6, react="face", beat_at=0.35, heavySteps=[0.5, 1.7], **bed(cam="close", focus="hero", hero=JB(expr="sleepy", expr2="stare", turn="wall")))
add(silent=2.8, react="face", beat_at=0.2, gapShadow=True, heart=True, **bed(cam="push_in", focus="gap", hero=JB(expr="stare")))
add("Mom?", "hero", vspeed=0.88, gain=0.6, **bed(cam="close", focus="hero", hero=JB(expr="dread", look=0.8)))
add(silent=2.8, react="face", beat_at=0.1, doorIn=1, heart="accel", **bed(cam="medium", focus="door", hero=JB(expr="dread", look=0.8),
    crew=dict(mom=C(silhouette=True, at="door", expr="calm", **GOWN))))
add("Don't come any closer.", "hero", **bed(doorOpen=1, cam="close", focus="hero", hero=JB(expr="dread", look=0.8), crew=dict(mom=C(silhouette=True, at="door", **GOWN))))
add("Jeff?", "mom", **bed(doorOpen=1, cam="close", focus="door", hero=JB(expr="dread", look=0.8), crew=dict(mom=C(silhouette=True, at="door", **GOWN))))
add(silent=1.2, react="lamp", beat_at=0.3, **bed(doorOpen=1, cam="medium", focus="wide", hero=JB(expr="relieved", look=0.8), crew=dict(mom=C(at="door", expr="worried", look=-1, **GOWN))))
add("What's wrong?", "mom", lamp=True, **bed(doorOpen=1, cam="close", focus="door", hero=JB(expr="relieved", look=0.8), crew=dict(mom=C(at="door", expr="worried", look=-1, **GOWN))))
add("I thought it came upstairs.", "hero", lamp=True, **bed(doorOpen=1, cam="close", focus="hero", hero=JB(expr="worried", look=0.8), crew=dict(mom=C(at="door", expr="worried", look=-1, **GOWN))))
add("The mummy?", "mom", lamp=True, **bed(doorOpen=1, cam="close", focus="door", hero=JB(look=0.8), crew=dict(mom=C(at="door", expr="curious", look=-1, **GOWN))))
add("Something moved in that case. Kim keeps saying it didn't, but I saw it.", "hero", lamp=True,
    **bed(doorOpen=1, cam="close", focus="hero", hero=JB(expr="worried", look=0.8), crew=dict(mom=C(at="door", expr="worried", look=-1, **GOWN))))
add(silent=1.6, lamp=True, **bed(doorOpen=1, cam="medium", focus="beside", hero=JB(look=0.8), crew=dict(mom=C(at="beside", expr="calm", look=-1, **GOWN))))
add("You had a frightening evening. Sometimes every little noise sounds different after that.", "mom", lamp=True,
    **bed(doorOpen=1, cam="close", focus="beside", hero=JB(look=0.8), crew=dict(mom=C(at="beside", expr="calm", look=-1, **GOWN))))
add("I wasn't asleep.", "hero", lamp=True, **bed(doorOpen=1, cam="close", focus="hero", hero=JB(expr="stare", look=0.8), crew=dict(mom=C(at="beside", expr="calm", look=-1, **GOWN))))
add(silent=1.3, lamp=True, react="face", beat_at=0.3, **bed(doorOpen=1, cam="close", focus="beside", hero=JB(look=0.8), crew=dict(mom=C(at="beside", expr="calm", expr2="worried", look=-1, **GOWN))))
add("I'll leave your door open. And the hallway light can stay on.", "mom", lamp=True,
    **bed(doorOpen=1, cam="close", focus="beside", hero=JB(look=0.8), crew=dict(mom=C(at="beside", expr="worried", look=-1, **GOWN))))
add(silent=1.0, lamp=True, **bed(doorOpen=1, cam="medium", focus="beside", hero=JB(look=0.8), crew=dict(mom=C(at="beside", expr="calm", look=-1, armR=1.2, **GOWN))))
add("Try to rest.", "mom", lamp=True, **bed(doorOpen=1, cam="close", focus="beside", hero=JB(look=0.8), crew=dict(mom=C(at="beside", expr="relieved", look=-1, **GOWN))))
add(silent=3.6, **bed(doorOpen=1, cam="push_in", focus="hero", hero=JB(expr="stare", look=1, lookY=-0.2)))

# ================= Scene 5: Mummy Dust
add(silent=3.2, chapter="Mummy Dust", scene="insert", insert="research", cam="push_in", focus="wide")
add(silent=2.8, scene="insert", insert="note", beat_at=0.85, cam="push_in", focus="wide")
add(silent=2.6, scene="shop", outside=True, cam="pull_out", focus="hero", hero=J(x=700, expr="curious", look=-1))
add(silent=2.4, react="bell", beat_at=0.15, scene="shop", cam="medium", focus="wide", hero=J(walk=[-150, 560], expr="curious", look=1),
    crew=dict(owner=C(expr="calm", look=0.6, lookY=0.6)))
S5 = lambda **k: dict(dict(scene="shop", hero=J(x=560, expr="curious", look=1), crew=dict(owner=C(expr="calm", look=-1))), **k)
add("Looking for a card trick?", "owner", **S5(cam="close", focus="owner", crew=dict(owner=C(expr="calm", look=0.4, lookY=0.6))))
add("Something a little stronger.", "hero", **S5(cam="close", focus="hero", hero=J(x=560, expr="calm", look=1)))
add(silent=1.0, **S5(cam="close", focus="owner", crew=dict(owner=C(expr="curious", look=-1))))
add("Do you have anything that could stop a mummy?", "hero", **S5(cam="close", focus="hero", hero=J(x=560, expr="worried", look=1)))
add("A costume mummy?", "owner", **S5(cam="close", focus="owner", crew=dict(owner=C(expr="doubt", look=-1))))
add("An actual one.", "hero", **S5(cam="close", focus="hero", hero=J(x=560, expr="stare", look=1)))
add(silent=2.2, bag=True, **S5(cam="medium", focus="counter", crew=dict(owner=C(expr="calm", look=-1, armR=1.3))))
add(silent=2.2, scene="insert", insert="bag", cam="push_in", focus="wide")
add("There's a legend about this powder. Says a mummy loses its strength when it touches it.", "owner", bag=True, **S5(cam="close", focus="owner"))
add("Does it work?", "hero", bag=True, **S5(cam="close", focus="hero"))
add("That's what the legend says.", "owner", bag=True, **S5(cam="close", focus="owner", crew=dict(owner=C(expr="calm", look=-1))))
add("Have you tried it?", "hero", bag=True, **S5(cam="close", focus="hero", hero=J(x=560, expr="doubt", look=1)))
add("I've had very few mummies come through the door.", "owner", bag=True, **S5(cam="close", focus="owner", crew=dict(owner=C(expr="relieved", look=-1))))
add(silent=1.1, bag=True, **S5(cam="close", focus="hero", hero=J(x=560, expr="relieved", look=1)))
add("How much?", "hero", bag=True, **S5(cam="close", focus="hero", hero=J(x=560, expr="calm", look=1)))
add("Twenty dollars.", "owner", bag=True, **S5(cam="close", focus="owner"))
add(silent=2.6, bag=True, react="face", beat_at=0.6, money=True, **S5(cam="medium", focus="counter", hero=J(x=640, expr="worried", look=1, lookY=0.6, armR=1.2)))
add("Do I throw all of it?", "hero", bag=True, money=True, **S5(cam="close", focus="hero"))
add("A pinch should be enough, according to the booklet.", "owner", bag=True, money=True, **S5(cam="close", focus="owner"))
add(silent=2.2, money=True, **S5(cam="medium", focus="hero", hero=J(x=640, expr="calm", look=0.4, lookY=0.6, armR=0.6)))

# ================= Scene 6: Waiting in the Kitchen
add("The collection has been delayed until tomorrow morning.", "dad", chapter="Waiting in the Kitchen",
    **kit(cam="close", focus="dad", hero=J(x=700, expr="calm", look=1), crew=dict(dad=C(x=1250, stand=True, phone="ear", expr="tired", look=-1), kim=C(x=1000, expr="calm", look=-1))))
add("So it's staying another night?", "hero", **kit(cam="close", focus="hero", hero=J(x=700, expr="shock", look=1), crew=dict(dad=C(x=1250, stand=True, expr="calm", look=-1), kim=C(x=1000, expr="calm", look=-1))))
add("One more. Then it's going straight into secure storage.", "dad", **kit(cam="close", focus="dad", hero=J(x=700, look=1), crew=dict(dad=C(x=1250, stand=True, expr="calm", look=-1), kim=C(x=1000, expr="calm", look=-1))))
add(silent=1.8, **kit(cam="close", focus="kim", hero=J(x=700, expr="worried", look=1, armR=0.6), crew=dict(dad=C(x=1250, stand=True, expr="calm", look=-1), kim=C(x=1000, expr="doubt", look=-1, lookY=0.5))))
def kn(**k):
    return dict(dict(scene="kitchenN", vig=0.55), **k)
add(silent=3.2, jump=True, **kn(cam="medium", focus="wide", hero=J(walk=[2350, 1950], expr="worried", look=-1, flashlight=True, **PJ)))
add(silent=3.2, **kn(cam="pull_out", focus="table", hero=J(x=1950, sit=True, expr="worried", look=-1, **PJ)))
add("One pinch.", "hero", vspeed=0.9, gain=0.75, **kn(cam="close", focus="hero", hero=J(x=1950, sit=True, expr="worried", look=-1, **PJ)))
add(silent=3.6, react="scrape", beat_at=0.7, heart=True, **kn(cam="push_in", focus="hero", hero=J(x=1950, sit=True, expr="worried", expr2="stare", look=-1, **PJ)))
add(silent=2.8, react="face", beat_at=0.25, door="crack", heart="accel", whispers=True, **kn(cam="push_in", focus="door", hero=J(x=1950, sit=True, expr="dread", look=-1, **PJ)))
add(silent=2.6, react="face", beat_at=0.2, door="crack", hand=True, twist=False, **kn(cam="close", focus="door", hero=None))

# ================= Scene 7: The Mummy
MUM = lambda **k: C(**dict(dict(costume="full", expr="calm", look=1), **k))
add(silent=3.6, chapter="The Mummy", react="drag", beat_at=0.15, door="open", **kn(cam="medium", focus="wide",
    hero=J(x=1950, sit=True, expr="dread", look=-1, **PJ), crew=dict(kim=MUM(walk=[380, 1000], shuffle=True))))
add(silent=1.2, react="jolt", beat_at=0.2, door="open", **kn(cam="close", focus="hero", hero=J(x=1700, expr="shock", look=-1, **PJ), crew=dict(kim=MUM(x=1000))))
add("Stay there.", "hero", door="open", **kn(cam="close", focus="hero", hero=J(x=1700, expr="dread", look=-1, **PJ), crew=dict(kim=MUM(x=1000))))
add(silent=1.6, door="open", **kn(cam="medium", focus="two", hero=J(x=1700, expr="dread", look=-1, armR=1.1, **PJ), crew=dict(kim=MUM(x=1050, reachR=True))))
add("I know how to stop you.", "hero", door="open", **kn(cam="close", focus="hero", hero=J(x=1700, expr="dread", look=-1, armR=1.1, **PJ), crew=dict(kim=MUM(x=1050, armR=1.4))))
add(silent=1.8, door="open", **kn(cam="medium", focus="kim", hero=J(x=1700, expr="dread", look=-1, **PJ), crew=dict(kim=MUM(walk=[1050, 1250], shuffle=True, armR=1.4))))
add("I said stay back!", "hero", door="open", **kn(cam="close", focus="hero", hero=J(x=1700, expr="scream", look=-1, **PJ), crew=dict(kim=MUM(x=1250, armR=1.4))))
add(silent=2.4, react="throw", beat_at=0.12, coughs=True, powder=[1640, 1260], door="open", **kn(cam="medium", focus="two",
    hero=J(x=1700, expr="scream", look=-1, armR=2.2, **PJ), crew=dict(kim=MUM(x=1250, cough=True))))
add(silent=1.6, react="crash", beat_at=0.35, tray="fall", door="open", **kn(cam="medium", focus="hero", hero=J(walk=[1700, 1780], expr="shock", look=-1, **PJ), crew=dict(kim=MUM(x=1250, cough=True))))
add("Jeff?", "mom", muffle=True, door="open", **kn(cam="close", focus="kim", hero=J(x=1780, expr="shock", look=-1, **PJ), crew=dict(kim=MUM(x=1250, look=1))))
add("What happened?", "dad", muffle=True, door="open", heavySteps=[0.6], **kn(cam="close", focus="hero", hero=J(x=1780, expr="shock", look=-1, **PJ), crew=dict(kim=MUM(x=1250, look=-1))))
add(silent=2.2, door="open", **kn(cam="medium", focus="wide", hero=J(x=1780, expr="shock", look=-1, **PJ), crew=dict(kim=MUM(walk=[1250, 300], look=-1))))
add(silent=1.4, lampOn=True, door="open", **kn(cam="medium", focus="wide", hero=J(x=1780, expr="scream", look=-1, armR=1.5, **PJ),
    crew=dict(mom=C(walk=[2500, 2050], expr="worried", look=-1, **GOWN), dad=C(walk=[2600, 1950], stand=True, expr="worried", look=-1, outfit="pj", top="#5a6a8a"))))
add("It was here! You saw it!", "hero", lampOn=True, door="open", **kn(cam="close", focus="hero", hero=J(x=1780, expr="scream", look=-1, armR=1.5, **PJ),
    crew=dict(mom=C(x=2050, expr="worried", look=-1, **GOWN), dad=C(x=1950, expr="worried", look=-1, outfit="pj", top="#5a6a8a"))))
add(silent=1.8, react="face", beat_at=0.3, lampOn=True, door="open", **kn(cam="push_in", focus="dad", hero=J(x=1780, expr="scream", look=-1, **PJ),
    crew=dict(mom=C(x=2050, expr="worried", look=-1, **GOWN), dad=C(x=1950, expr="calm", expr2="stare", look=-1, outfit="pj", top="#5a6a8a"))))

# ================= Scene 8: The Chains
DADN = lambda **k: C(**dict(dict(expr="worried", outfit="pj", top="#5a6a8a"), **k))
MOMN = lambda **k: C(**dict(dict(GOWN, expr="worried"), **k))
add(silent=2.4, chapter="The Chains", lampOn=True, door="open", **kn(cam="medium", focus="wide", hero=J(x=1780, expr="worried", look=-1, **PJ),
    crew=dict(dad=DADN(walk=[1950, 560], look=-1), mom=MOMN(x=1700, look=-1, armL=1.2))))
add(silent=2.0, lampOn=True, door="open", torch=[330, 980], torchDown=True, **kn(cam="close", focus="dad", hero=J(x=1780, look=-1, **PJ),
    crew=dict(dad=DADN(x=560, look=-1, lookY=0.6, flashlight=True), mom=MOMN(x=1700, look=-1))))
add(silent=2.4, scene="insert", insert="chainfloor", flashlight=True, cam="push_in", focus="wide")
NIGHT8 = lambda dad, mom=None, hero=None, **k: kn(lampOn=True, door="open", hero=hero or J(x=1780, expr="worried", look=-1, **PJ),
    crew=dict(dad=dad, mom=mom or MOMN(x=1700, look=-1)), **k)
add("Who took those off?", "dad", vspeed=0.9, gain=0.8, **NIGHT8(DADN(x=560, look=-1, lookY=0.6, flashlight=True), cam="close", focus="dad"))
add("What?", "hero", **NIGHT8(DADN(x=560, look=1), cam="close", focus="hero"))
add("The chains.", "dad", **NIGHT8(DADN(x=560, expr="stare", look=1), cam="close", focus="dad"))
add(silent=1.0, **NIGHT8(DADN(walk=[560, 760], expr="stare", look=-1), cam="medium", focus="dad"))
add("What happens if they come off?", "hero", **NIGHT8(DADN(x=760, look=1), cam="close", focus="hero", hero=J(x=1780, expr="dread", look=-1, **PJ)))
add(silent=1.3, **NIGHT8(DADN(x=760, expr="tired", look=0.2, lookY=0.6), cam="close", focus="dad"))
add("There was a story in the records that came with the case. A warning that the mummy would wake if the chains were removed.", "dad",
    **NIGHT8(DADN(x=760, expr="worried", look=1), cam="close", focus="dad"))
add("You brought that here?", "mom", **NIGHT8(DADN(x=760, look=1), MOMN(x=1700, expr="shock", look=-1), cam="close", focus="mom"))
add("I thought it was an old superstition.", "dad", **NIGHT8(DADN(x=760, expr="tired", look=1), cam="close", focus="dad"))
add(silent=1.6, react="shift", beat_at=0.2, **dict(NIGHT8(DADN(x=560, expr="shock", look=-1, armL=1.4), cam="medium", focus="door"), door="closing"))
add(silent=1.8, scene="insert", insert="key", react="unlock", beat_at=0.3, cam="push_in", focus="wide")
add("Stay away from this door. I'm calling the museum.", "dad", **dict(NIGHT8(DADN(x=700, expr="worried", look=1), cam="close", focus="dad"), door=None))
add(silent=1.2, **dict(NIGHT8(DADN(walk=[700, 1640], expr="worried", look=1), cam="medium", focus="hero"), door=None))
add("I'm sorry. I should have arranged somewhere else to keep it.", "dad", **dict(NIGHT8(DADN(x=1640, crouch=True, expr="worried", look=1), cam="close", focus="dad"), door=None))
add("And I'm sorry I didn't listen to you last night.", "mom", **dict(NIGHT8(DADN(x=1640, crouch=True, look=1), MOMN(x=1900, expr="worried", look=-1), cam="close", focus="mom"), door=None))
add("What about Kim?", "hero", **dict(NIGHT8(DADN(x=1640, crouch=True, look=1), MOMN(x=1900, look=-1), cam="close", focus="hero"), door=None))
add("I'll check her room.", "mom", **dict(NIGHT8(DADN(x=1640, crouch=True, look=1), MOMN(x=1900, expr="calm", look=-1), cam="close", focus="mom"), door=None))
add(silent=3.6, **kn(lampOn=True, cam="push_in", focus="door", hero=J(walk=[1780, 2500], walkDelay=20, expr="worried", look=1, **PJ),
    crew=dict(dad=DADN(walk=[1640, 2600], phone="ear", look=1), mom=MOMN(walk=[1900, 2600], walkDelay=20, look=1))))

# ================= Scene 9: The Prank (basement side of the door)
def bk(**k):
    return dict(dict(scene="basement", lightOn=True, vig=0.6, chainsOff=True, chainsFloor=True), **k)
add(silent=3.2, chapter="The Prank", **bk(cam="push_in", focus="top", whispers=True, crew=dict(kim=C(step=0.5, costume="full", expr="calm", look=-1, lookY=-0.5))))
add(silent=1.8, react="face", beat_at=0.4, **bk(cam="close", focus="kim", crew=dict(kim=C(step=0.5, costume="full", unmask=True, expr="relieved", look=1, armR=2.4))))
add("Oh, Jeff.", "kim", vspeed=0.9, gain=0.7, **bk(cam="close", focus="kim", crew=dict(kim=C(step=0.5, costume="faceoff", expr="relieved", look=0.5))))
add(silent=1.4, coughs=True, beat_at=0.3, react="face", **bk(cam="close", focus="kim", crew=dict(kim=C(step=0.5, costume="faceoff", expr="relieved", cough=True))))
add("What did you throw at me?", "kim", **bk(cam="close", focus="kim", crew=dict(kim=C(step=0.5, costume="faceoff", expr="doubt", look=0.5))))
add(silent=1.0, **bk(cam="close", focus="kim", crew=dict(kim=C(step=0.5, costume="faceoff", expr="relieved", armL=2.2))))
FB = dict(flashback=True, gap=0.05)
add(silent=1.4, scene="insert", insert="thread", cam="push_in", focus="wide", **FB)
add(silent=1.3, scene="basement", lightOn=True, thread=True, cam="medium", focus="wide", **FB)
add(silent=1.3, scene="insert", insert="pull", react="chain", beat_at=0.3, cam="close", focus="wide", **FB)
add(silent=1.5, scene="basement", lightOn=True, chainsOff=True, chainsFloor=True, cam="close", focus="case", crew=dict(kim=C(x=1500, expr="relieved", look=1, armR=1.4)), **FB)
add(silent=1.3, scene="basement", lightOn=True, chainsOff=True, chainsFloor=True, cam="close", focus="kim", crew=dict(kim=C(x=1150, costume="faceoff", expr="relieved", look=1, armL=1.2)), **FB)
add("Okay. That was worth it.", "kim", **bk(cam="close", focus="kim", crew=dict(kim=C(step=0.5, costume="faceoff", expr="relieved", look=-1))))
add(silent=1.6, react="face", beat_at=0.5, **bk(cam="medium", focus="top", crew=dict(kim=C(step=0.3, costume="faceoff", expr="relieved", expr2="worried", look=-1, armL=1.4))))
add("Dad?", "kim", **bk(cam="close", focus="kim", crew=dict(kim=C(step=0.3, costume="faceoff", expr="worried", look=-1))))
add(silent=0.9, react="pound", beat_at=0.1, **bk(cam="medium", focus="top", crew=dict(kim=C(step=0.3, costume="faceoff", expr="worried", look=-1, armL=1.6))))
add("Dad, it's me. Open the door.", "kim", **bk(cam="close", focus="kim", crew=dict(kim=C(step=0.3, costume="faceoff", expr="worried", look=-1))))
add(silent=1.3, react="knock", beat_at=0.5, **bk(cam="medium", focus="top", crew=dict(kim=C(step=0.3, costume="faceoff", expr="worried", look=-1, armL=1.6))))
add("The mummy was me!", "kim", **bk(cam="close", focus="kim", crew=dict(kim=C(step=0.3, costume="faceoff", expr="scream", look=-1))))

# ================= Scene 10: Something Else Downstairs
K10 = lambda **k: C(**dict(dict(step=0.3, costume="faceoff"), **k))
add(silent=2.8, chapter="Something Else Downstairs", react="scrape", beat_at=0.35, **bk(cam="close", focus="kim", roll=-3,
    crew=dict(kim=K10(expr="worried", expr2="stare", look=1, lookY=0.6))))
add(silent=3.6, react="lidfall", beat_at=0.05, lidOff=True, lidFloor=True, **bk(cam="push_in", focus="case", vig=0.75, flickerBulb=True, eyesFollow=False, whispers=True))
add("I didn't do that.", "kim", vspeed=0.88, gain=0.55, lidOff=True, lidFloor=True, **bk(cam="close", focus="kim", crew=dict(kim=K10(expr="dread", look=1, lookY=0.6))))
add(silent=0.9, react="pound", beat_at=0.1, lidOff=True, lidFloor=True, **bk(cam="medium", focus="top", crew=dict(kim=K10(expr="dread", look=-1, armL=1.6))))
add("Dad. Open the door.", "kim", lidOff=True, lidFloor=True, **bk(cam="close", focus="kim", crew=dict(kim=K10(expr="dread", look=-1))))
add(silent=1.6, react="thump", beat_at=0.3, heart="accel", lidOff=True, lidFloor=True, **bk(cam="close", focus="kim", crew=dict(kim=K10(expr="dread", expr2="stare", look=1, lookY=0.6))))
add("Jeff?", "kim", vspeed=0.9, gain=0.7, lidOff=True, lidFloor=True, **bk(cam="close", focus="kim", crew=dict(kim=K10(expr="dread", look=1, lookY=0.6))))
add(silent=1.8, react="thump", beat_at=0.5, lidOff=True, lidFloor=True, heart="accel", **bk(cam="close", focus="kim", roll=3, crew=dict(kim=K10(expr="dread", look=1, lookY=0.6))))
add(silent=1.6, lidOff=True, lidFloor=True, **bk(cam="medium", focus="top", crew=dict(kim=K10(expr="dread", look=-1, armL=1.6, armR=1.4))))
add("Jeff, if that's you, stop.", "kim", lidOff=True, lidFloor=True, **bk(cam="close", focus="kim", crew=dict(kim=K10(expr="dread", look=1, lookY=0.6))))
add(silent=3.2, react="thump", beat_at=0.55, floorShadow=True, heavySteps=[2.2], lidOff=True, lidFloor=True, flickerBulb=True,
    **bk(cam="push_in", focus="floor", vig=0.75, crew={}))
add(silent=2.4, react="thump", beat_at=0.15, foot=True, lidOff=True, lidFloor=True, twist=True, **bk(cam="push_in", focus="bottom", vig=0.8, flickerBulb=True, crew={}))
add("Dad!", "kim", lidOff=True, lidFloor=True, **bk(cam="close", focus="kim", crew=dict(kim=K10(expr="scream", look=-1))))
add(silent=1.2, react="pound", beat_at=0.05, lidOff=True, lidFloor=True, **bk(cam="medium", focus="top", crew=dict(kim=K10(expr="scream", look=-1, armL=1.7, armR=1.5))))
add("Please! Open it!", "kim", lidOff=True, lidFloor=True, **bk(cam="close", focus="kim", crew=dict(kim=K10(expr="scream", look=-1))))
add(silent=1.6, react="face", beat_at=0.5, heavySteps=[0.4], lidOff=True, lidFloor=True, **bk(cam="push_in", focus="kim", roll=-4,
    crew=dict(kim=K10(expr="dread", expr2="scream", look=1, lookY=0.8))))
add(silent=3.2, scene="black", heavySteps=[0.6], gasp=1.2, cam="wide", focus="wide")

story = {
    "storyboard": True, "captions": True, "music": "drone", "scary": True, "piano": True,
    "story_id": "the-mummy-downstairs",
    "title": "The Mummy Downstairs | Animated Horror Story",
    "description": "A museum sarcophagus is delivered to the wrong address: Jeff's house. It stays in the basement, chained shut, for one night. Then two. An original animated horror story.",
    "tags": ["animated horror story", "mummy horror", "creepy cartoon tales", "horror cartoon", "scary story", "sarcophagus", "basement horror"],
    "cover_beat": None, "cover_text": "THE MUMMY DOWNSTAIRS",
    "hero": {"look": "boy", "outfit": "hoodie", "voice": "am_puck", "omni": "male, child, american accent",
             "style": {"skin": "#e6b48f", "hair": "#6b4423", "hairStyle": "mop", "outfit": "hoodie", "top": "#d9a520",
                       "pants": "#25304f", "shoes": "#f2f2ee", "acc": {}}},
    "villain": "shadow",
    "cast": [
        {"role": "kim", "gender": "f", "voice": "af_bella", "omni": "female, teenager, american accent",
         "style": {"skin": "#e6b48f", "hair": "#3a2418", "hairStyle": "ponytail", "outfit": "tee", "top": "#7a2335",
                   "pants": "#1d1c22", "shoes": "#c8282e", "hood": False, "acc": {}}},
        {"role": "dad", "gender": "m", "voice": "am_michael", "omni": "male, middle-aged, low pitch, american accent",
         "style": {"skin": "#e6b48f", "hair": "#5a4634", "hairStyle": "spiky", "outfit": "shirt", "top": "#dfe6ee", "pants": "#3a3f50",
                   "acc": {"glasses": True}}},
        {"role": "mom", "gender": "f", "voice": "af_sarah", "omni": "female, middle-aged, american accent",
         "style": {"skin": "#e6b48f", "hair": "#6b4a30", "hairStyle": "bob", "outfit": "cardigan", "top": "#c87a5a", "pants": "#4a4060", "acc": {}}},
        {"role": "owner", "gender": "m", "voice": "bm_george", "omni": "male, elderly, low pitch, british accent",
         "style": {"skin": "#e0a882", "hair": "#c8c8cc", "hairStyle": "mop", "outfit": "suit", "top": "#3a2e2a", "acc": {"mustache": True}}},
        {"role": "worker", "gender": "m", "voice": "am_eric", "omni": "male, middle-aged, american accent",
         "style": {"skin": "#a8714f", "hair": "#1d1420", "hairStyle": "spiky", "outfit": "uniform", "top": "#5a6a7a", "acc": {"cap": "#3a4a5a"}}},
        {"role": "worker2", "gender": "m", "voice": "am_adam",
         "style": {"skin": "#d9a07a", "hair": "#3b2618", "hairStyle": "bald", "outfit": "uniform", "top": "#5a6a7a", "acc": {"beard": True}}},
    ],
    "beats": B,
}
# the thumbnail: the fallen lid and the open case
story["cover_beat"] = next(i for i, b in enumerate(B) if b.get("lidOff") and b.get("silent"))
out = HERE / "the_mummy_downstairs.json"
out.write_text(json.dumps(story, indent=1, ensure_ascii=False), encoding="utf-8")
words = sum(len(b["line"].split()) for b in B)
sil = sum(b.get("silent", 0) for b in B)
print(out.name, len(B), "beats,", words, "words,", round(sil), "s silent, est", round((words / 2.4 + sil + 0.35 * len(B)) / 60, 1), "min")
