"""Grow the Creepyville library: paint every location in horror/library/town.json that has no picture yet.
Free (Cloudflare Workers AI daily allowance); one consistent style so it all looks like one town."""
import io
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from PIL import Image
from autotube import illustrate
from autotube.util import load_config, log

ROOT = Path(__file__).resolve().parents[2]
TOWN = json.loads((ROOT / "horror" / "library" / "town.json").read_text(encoding="utf-8"))
OUT = ROOT / "horror" / "plates"
illustrate.STYLE = (
    "Background plate for a 2D cartoon horror-comedy short set in the small foggy town of Creepyville, rendered like a "
    "modern 3D animated feature film: soft global illumination, rich textures, cinematic depth, strong mood lighting. "
    "Empty set with NO people, no characters, nothing standing in the lower middle of the frame where actors will stand. "
    "Eye-level camera, the ground visible in the lower third. Absolutely no text, letters, logos or watermarks."
)


def main(limit: int = 40) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    painter = illustrate.Painter(load_config(), ROOT / "plates_tmp")
    painter.budget = limit
    made = 0
    for name, prompt in TOWN["locations"].items():
        if (OUT / f"{name}.jpg").exists():
            continue
        f = painter.paint(prompt, name, "9:16")
        if not f:
            log(f"Could not paint {name} today; it will be tried again tomorrow")
            continue
        Image.open(f).convert("RGB").save(OUT / f"{name}.jpg", "JPEG", quality=86)
        made += 1
        log(f"Painted {name}")
    log(f"Library: {made} new locations, {len(list(OUT.glob('*.jpg')))} in total")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 40)
