"""Five vertical Shorts re-drawn from The Fourth Face storyboard (writes 1_*.json ... 5_*.json here)."""
import copy
import json
from pathlib import Path

HERE = Path(__file__).parent
SRC = json.loads((HERE.parents[2] / "scripts" / "the_fourth_face.json").read_text(encoding="utf-8"))

CLIPS = [
    ("1_the_call", 45, 53, "My friend has been standing next to me all *night.* Then he called me… from *home.*",
     "HE'S SICK AT HOME.", "My friend called from home. So who's been standing next to me? #shorts #horror"),
    ("2_red_circle", 20, 29, "My dad circled something in our car *selfie.* It was sitting right *behind* me.",
     "ZOOM IN. LEFT SIDE.", "Dad circled something in our car selfie 😨 #shorts #horror"),
    ("3_dads_warning", 7, 19, "I sent Dad a selfie from the car. Ten seconds later he called, *whispering.*",
     "\"GET OUT OF THE CAR.\"", "I sent Dad a selfie. He called me whispering #shorts #horror"),
    ("4_i_forgive_you", 33, 43, "My dad thought my best friend was a *ghost.* Then he had to *apologise.*",
     "BLURRY PHOTO. BIG MISTAKE.", "My dad thought my best friend was a ghost 💀 #shorts #horror #funny"),
    ("5_snacks", 26, 32, "There was a ghost in our back seat. So I *knocked* on the window.",
     "KNOCK. KNOCK. KNOCK.", "There was a ghost in our back seat. So I knocked #shorts #horror"),
]

for name, a, b, opener, onscreen, title in CLIPS:
    beats = [copy.deepcopy(x) for x in SRC["beats"][a:b + 1]]
    for x in beats:
        x.pop("chapter", None)
    for x in beats:                   # vertical frame is narrow: keep Joe and Malik far enough apart to see both faces
        m = (x.get("crew") or {}).get("malik")
        if x.get("scene") == "station" and m and x.get("hero") and m.get("x") is not None:
            hx = x["hero"].get("x", 1660)
            if abs(hx - m["x"]) < 300:
                x["hero"]["x"] = m["x"] + 320
    first = copy.deepcopy(beats[0])
    for k in ("silent", "beat_at", "beat_word", "phone", "vspeed", "gain", "layer", "twist", "blackout"):
        first.pop(k, None)
    first.update(line=opener, speaker="narrator", react="none", onscreen=onscreen)
    if first.get("hero"):
        first["hero"] = dict(first["hero"], phone=first["hero"].get("phone"))
    story = {k: copy.deepcopy(v) for k, v in SRC.items() if k not in ("beats", "cover_beat", "cover_text", "title", "description")}
    story.update(storyboard=True, captions=True, story_id=f"fourth-face-{name}", title=title,
                 description="From our animated horror story The Fourth Face. Full video on the channel.",
                 beats=[first] + beats)
    (HERE / f"{name}.json").write_text(json.dumps(story, indent=1, ensure_ascii=False), encoding="utf-8")
    words = sum(len(x["line"].split()) for x in story["beats"])
    secs = sum(x.get("silent", 0) for x in story["beats"]) + words / 2.6 + 0.35 * len(story["beats"]) + 4
    print(f"{name}: {len(story['beats'])} beats, ~{secs:.0f}s")
