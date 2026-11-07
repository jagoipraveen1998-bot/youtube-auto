"""THE MUMMY DOWNSTAIRS: sample of Scene 2 'The Dare' (writes scene2_the_dare.json next to this file)."""
import json
from pathlib import Path

C = lambda **k: k
J = lambda **k: dict(dict(pose="stand", expr="worried"), **k)
DAD = C(expr="calm", look=-0.4, lookY=0.5)
B = []
def add(line="", speaker="narrator", **k):
    B.append(dict(dict(line=line, speaker=speaker, react="none"), **k))
def kit(**k):
    crew = k.pop("crew", {})
    return dict(scene="kitchenB", crew=dict(dict(dad=DAD), **crew), **k)

# --- kitchen, early evening
add(silent=3.4, chapter="The Dare", **kit(cam="push_in", focus="two", hero=J(x=620, expr="worried", look=-1),
    crew=dict(kim=C(x=900, expr="curious", look=-1))))
add("You keep looking at it.", "kim", **kit(cam="close", focus="kim", hero=J(x=620, look=-1), crew=dict(kim=C(x=900, expr="relieved", look=-1))))
add("I'm looking at the kitchen.", "hero", **kit(cam="close", focus="hero", hero=J(x=620, expr="tired", look=1), crew=dict(kim=C(x=900, expr="relieved", look=-1))))
add("Then go downstairs.", "kim", **kit(cam="close", focus="kim", hero=J(x=620, look=1), crew=dict(kim=C(x=900, expr="doubt", look=-1))))
add("Why?", "hero", **kit(cam="close", focus="hero", hero=J(x=620, expr="worried", look=1), crew=dict(kim=C(x=900, expr="relieved", look=-1))))
add("Touch the case. One finger. Then I'll stop teasing you about it.", "kim",
    **kit(cam="medium", focus="two", hero=J(x=620, look=1), crew=dict(kim=C(x=900, expr="relieved", look=-1))))
add("Dad said to leave it alone.", "hero", **kit(cam="close", focus="hero", hero=J(x=620, expr="worried", look=1), crew=dict(kim=C(x=900, expr="relieved", look=-1))))
add("He meant opening it. You can touch the outside.", "kim", **kit(cam="close", focus="kim", hero=J(x=620, look=1), crew=dict(kim=C(x=900, expr="doubt", look=-1))))
add(silent=3.2, beat_at=0.25, react="dome", door="opening", lightOn=True,
    **kit(cam="medium", focus="door", hero=J(x=820, expr="worried", look=-1), crew=dict(kim=C(x=600, expr="relieved", look=-1, reachDoor=True))))
# --- the stairs
add(silent=2.6, scene="basement", door="open", lightOn=True, cam="push_in", focus="case", hero=None)
add("You're coming with me.", "hero", **kit(cam="close", focus="hero", door="open", lightOn=True, hero=J(x=620, expr="worried", look=1),
    crew=dict(kim=C(x=760, expr="relieved", look=-1))))
add("I'll be right here.", "kim", **kit(cam="close", focus="kim", door="open", lightOn=True, hero=J(x=620, look=1),
    crew=dict(kim=C(x=760, expr="relieved", look=-1))))
add(silent=5.0, scene="basement", door="open", lightOn=True, cam="medium", focus="stairs", creaks=True, countRun=[1, 9],
    hero=J(step=[0, 9.6], expr="worried", look=0.6, lookY=0.4))
add("If you turn the light off—", "hero", scene="basement", door="open", lightOn=True, cam="close", focus="hero",
    hero=J(step=9.6, expr="worried", look=-0.8, lookY=-0.7))
add(silent=1.6, beat_at=0.2, react="slam1", scene="basement", door="slam", lightOn=True, cam="snap", focus="door",
    hero=J(step=9.6, expr="shock", look=-0.8, lookY=-0.7))
add("Kim?", "hero", scene="basement", lightOn=True, cam="close", focus="hero", hero=J(step=9.6, expr="worried", look=-0.8, lookY=-0.7))
add("Just touch it!", "kim", muffle=True, scene="basement", lightOn=True, cam="close", focus="door", hero=J(step=9.6, look=-0.8, lookY=-0.7))
add("Open the door!", "hero", scene="basement", lightOn=True, cam="close", focus="hero", hero=J(step=9.6, expr="scream", look=-0.8, lookY=-0.7))
add("You wanted me to stay here. I'm staying here.", "kim", muffle=True, scene="basement", lightOn=True, cam="close", focus="door",
    hero=J(step=9.6, look=-0.8, lookY=-0.7))
# --- the case
add(silent=5.4, beat_at=0.95, scene="basement", lightOn=True, cam="push_in", focus="finger", heart=True,
    hero=J(aisle=[1100, 1520], expr="dread", look=1, point=True))
add(silent=3.2, beat_at=0.12, react="chain", lid="shift", twist=True, scene="basement", lightOn=True, cam="snap", focus="chain",
    hero=J(x=1520, expr="realize", look=1, point=True))
add("KIM!", "hero", scene="basement", lightOn=True, cam="snap", focus="hero", react="jolt", beat_at=0.05,
    hero=J(x=1520, expr="scream", expr2="scream", look=-1, lookY=-0.6))

story = {
    "storyboard": True, "captions": True, "story_id": "mummy-downstairs-scene2",
    "title": "The Mummy Downstairs (Scene 2: The Dare) - sample",
    "description": "Sample scene from The Mummy Downstairs, an original animated horror story.",
    "tags": ["animated horror", "mummy", "horror story", "creepy cartoon tales"],
    "hero": {"look": "boy", "outfit": "hoodie", "voice": "am_puck", "omni": "male, child, american accent",
             "style": {"skin": "#e6b48f", "hair": "#6b4423", "hairStyle": "mop", "outfit": "hoodie", "top": "#d9a520",
                       "pants": "#25304f", "shoes": "#f2f2ee", "acc": {}}},
    "villain": "shadow",
    "cast": [
        {"role": "kim", "gender": "f", "voice": "af_bella", "omni": "female, teenager, american accent",
         "style": {"skin": "#e6b48f", "hair": "#3a2418", "hairStyle": "ponytail", "outfit": "tee", "top": "#7a2335",
                   "pants": "#1d1c22", "shoes": "#c8282e", "hood": False, "acc": {}}},
        {"role": "dad", "gender": "m", "voice": "am_michael", "omni": "male, middle-aged, low pitch, american accent",
         "style": {"skin": "#e6b48f", "hair": "#5a4634", "hairStyle": "spiky", "outfit": "shirt", "top": "#dfe6ee",
                   "acc": {"glasses": True}}},
    ],
    "music": "drone",
    "beats": B,
}
out = Path(__file__).with_name("scene2_the_dare.json")
out.write_text(json.dumps(story, indent=1, ensure_ascii=False), encoding="utf-8")
print(out.name, len(B), "beats", sum(len(b["line"].split()) for b in B), "words", round(sum(b.get("silent", 0) for b in B), 1), "s silent")
