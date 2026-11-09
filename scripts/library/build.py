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


PROP_STYLE = (
    "Single isolated object for a cartoon horror-comedy, rendered like a modern 3D animated feature film: soft lighting, "
    "rich textures, appealing shapes. The WHOLE object fully visible and centred, nothing cut off, on a perfectly plain "
    "flat pure white background, no ground, no shadow, no other objects. No text, letters, logos or watermarks."
)
PROPS = json.loads((ROOT / "horror" / "library" / "props.json").read_text(encoding="utf-8"))
PROP_OUT = ROOT / "horror" / "props"


def cut_out(src: Path, dst: Path) -> bool:
    """Remove the plain background and keep a tight transparent PNG."""
    from rembg import new_session, remove
    global _SESSION
    try:
        _SESSION
    except NameError:
        _SESSION = new_session("isnet-general-use")
    im = remove(Image.open(src).convert("RGB"), session=_SESSION)
    box = im.getbbox()
    if not box:
        return False
    im = im.crop(box)
    im.thumbnail((640, 640))
    im.save(dst, "PNG", optimize=True)
    return True


def paint_props(painter, limit: int) -> int:
    PROP_OUT.mkdir(parents=True, exist_ok=True)
    made = 0
    for name, p in PROPS["props"].items():
        if (PROP_OUT / f"{name}.png").exists() or made >= limit:
            continue
        illustrate.STYLE = PROP_STYLE
        f = painter.paint(p["prompt"], "prop_" + name, "1:1")
        if f and cut_out(f, PROP_OUT / f"{name}.png"):
            made += 1
            log(f"Painted prop {name}")
        else:
            log(f"Could not make prop {name} today")
    return made


def main(limit: int = 40) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    painter = illustrate.Painter(load_config(), ROOT / "plates_tmp")
    painter.budget = limit + 40
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
    n = paint_props(painter, max(0, limit - made))
    log(f"Props: {n} new, {len(list(PROP_OUT.glob('*.png')))} in total")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 40)
