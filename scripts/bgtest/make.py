"""Thumbnail test: 3D-render style key art for 'Something Was Sitting On His Shoulder'."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from autotube import illustrate
from autotube.util import load_config

illustrate.STYLE = ("Key art for a YouTube thumbnail, rendered like a modern 3D animated feature film (Pixar-like), "
                    "dramatic cinematic lighting, high contrast, rich detail, no text, no letters, no logos, no watermark. ")
SCENES = {
    "thumb_shoulder_a": "a tired young Indian office worker in a light blue shirt, sweating and terrified, looking at his "
        "phone, while a pale creepy little girl ghost with a black bob haircut and a small yellow star hair clip sits on his "
        "right shoulder smiling at the camera; dark office at night with warm Diwali string lights behind; close-up",
    "thumb_shoulder_b": "close-up of a smartphone screen held in a trembling hand showing a happy office group photo with "
        "Diwali lights, and in the photo a pale ghost girl with a black bob and a yellow star hair clip is sitting on one "
        "smiling man's shoulder; dark room, the phone light glowing on a scared young man's face in the background",
    "thumb_shoulder_c": "a young Indian man in a light blue office shirt standing alone in a dim hallway of an old rented "
        "house at night, his right shoulder pulled down as if heavy, a pale little ghost girl with a black bob and a tiny "
        "yellow star clip perched on that shoulder hugging his neck and grinning, moonlight from a window, eerie mood",
}
out = Path("horror/bgtest"); out.mkdir(parents=True, exist_ok=True)
p = illustrate.Painter(load_config(), out)
p.budget = 6
for name, prompt in SCENES.items():
    print(name, p.paint(prompt, name, "16:9"))
