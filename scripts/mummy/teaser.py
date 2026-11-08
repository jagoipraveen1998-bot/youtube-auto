"""30-second vertical teaser of The Mummy Downstairs (writes mummy_teaser.json next to this file)."""
import copy, json
from pathlib import Path
HERE = Path(__file__).parent
SRC = json.loads((HERE / "the_mummy_downstairs.json").read_text(encoding="utf-8"))
B = SRC["beats"]
pick = [1, 2, 3, 164, 165, 166, 169, 170, 174, 175]
beats = []
first = copy.deepcopy(B[0]); first.pop("chapter", None)
first.update(line="A museum coffin was delivered to the wrong house. *Ours.*", speaker="narrator", silent=None,
             onscreen="IT CAME IN CHAINS.")
first = {k: v for k, v in first.items() if v is not None}
beats.append(first)
for i in pick:
    x = copy.deepcopy(B[i]); x.pop("chapter", None)
    if i == 165: x.update(cam="close", focus="face")   # keep the open case centred in the tall frame
    beats.append(x)
beats.append(dict(line="", speaker="narrator", react="none", silent=2.6, scene="black", cam="wide", focus="wide",
                  onscreen="FULL MOVIE ON YOUTUBE", heavySteps=[0.4]))
story = {k: copy.deepcopy(v) for k, v in SRC.items() if k not in ("beats", "cover_beat", "cover_text", "title", "description")}
story.update(storyboard=True, captions=True, story_id="mummy-teaser",
             title="A coffin was delivered to our house by mistake 😨 #shorts #horror",
             description="Teaser: The Mummy Downstairs. Full animated horror movie on the channel.",
             beats=beats)
(HERE / "mummy_teaser.json").write_text(json.dumps(story, indent=1, ensure_ascii=False), encoding="utf-8")
w = sum(len(x["line"].split()) for x in beats); s = sum(x.get("silent", 0) for x in beats)
print(len(beats), "beats ~", round(w / 2.6 + s + 0.35 * len(beats)), "s")
