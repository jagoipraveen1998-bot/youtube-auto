"""Test: 3D-render style backgrounds for horror Shorts (no characters; ours are drawn on top)."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from autotube import illustrate
from autotube.util import load_config

illustrate.STYLE = (
    "Background plate for a 2D cartoon horror short, rendered like a modern 3D animated feature film: "
    "soft global illumination, rich textures, cinematic depth of field, strong mood lighting. "
    "Empty set with NO people, no characters, no animals, nothing in the lower middle of the frame where actors will stand. "
    "Eye-level camera, vertical 9:16 frame, the floor visible in the lower third. "
    "Absolutely no text, letters, logos or watermarks."
)
SCENES = {
    "bedroom_night": "a small cosy teenage bedroom at night, bed on the left, a window with cold blue moonlight, a half-open wardrobe door with darkness inside, warm desk lamp glow, dust in the light",
    "hallway_night": "a narrow apartment hallway at 3 AM, a long red runner rug, a door at the far end with warm light leaking under it, deep blue shadows, framed pictures on the walls",
    "kitchen_night": "a small home kitchen at midnight, the light over the stove on, a coffee machine glowing on the counter, a window showing a dark garden, cold blue ambience with one warm pool of light",
    "street_night": "a quiet suburban street at night after rain, wet road reflecting a single orange street lamp, houses with dark windows, fog at the end of the street, full moon",
    "front_door_night": "the inside of a front door of a small house at night, a coat rack and a shoe rack beside it, a thin line of cold light under the door, a dim hallway lamp, wooden floor",
    "kitchen_dawn": "a small home kitchen at early dawn, pale blue morning light through the window, a coffee machine on the counter, soft shadows, calm but slightly eerie",
    "livingroom_night": "a small living room at night lit only by a flickering old TV glow and a floor lamp, a sofa, curtains half open to a dark window, cosy but creepy",
}
out = Path("horror/bgtest"); out.mkdir(parents=True, exist_ok=True)
p = illustrate.Painter(load_config(), out)
p.budget = 10
for name, prompt in SCENES.items():
    f = p.paint(prompt, name, "9:16")
    print(name, f)
