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


GROW = """You design the small foggy town of Creepyville, home of the animated horror-comedy channel CreepyCartoonTales.
It already has these places: {places}
and these objects and animals: {props}
Invent {n_places} NEW places and {n_props} NEW objects or animals that would make great settings or running jokes for
creepy-but-funny stories (safe for teenagers: no weapons, no gore). Every place must be visually different from the
existing ones; vary indoor/outdoor, day/night, ordinary/creepy. Names are short snake_case.
Return ONLY JSON: {{"places":{{"name":"one sentence describing the empty set: what is there, the light, the mood"}},
"props":{{"name":{{"h":height in pixels next to a 620 px tall boy,"kind":"animal|vehicle|object","prompt":"one sentence describing it"}}}}}}"""


def grow(n_places: int = 2, n_props: int = 2) -> None:
    """Every day the town gets a little bigger: Gemini invents new places and things, the painter paints them."""
    import os
    import re
    if not os.environ.get("GEMINI_API_KEY"):
        return
    from google import genai
    from autotube.script_writer import pick_models
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    town_file, props_file = ROOT / "horror/library/town.json", ROOT / "horror/library/props.json"
    town, props = json.loads(town_file.read_text()), json.loads(props_file.read_text())
    prompt = GROW.format(places=", ".join(town["locations"]), props=", ".join(props["props"]), n_places=n_places, n_props=n_props)
    for model in pick_models(client, load_config().get("ai", {}).get("gemini_model", "auto"))[:3]:
        try:
            txt = client.models.generate_content(model=model, contents=prompt).text
            new = json.loads(re.search(r"\{.*\}", txt, re.S).group(0))
            break
        except Exception as exc:
            log(f"Town planner {model} failed: {str(exc)[:120]}")
    else:
        return
    ok = lambda k: re.fullmatch(r"[a-z][a-z0-9_]{2,40}", k)
    for k, v in (new.get("places") or {}).items():
        if ok(k) and k not in town["locations"] and isinstance(v, str):
            town["locations"][k] = v[:400]; log(f"New place: {k}")
    for k, v in (new.get("props") or {}).items():
        if ok(k) and k not in props["props"] and isinstance(v, dict) and v.get("prompt"):
            props["props"][k] = {"h": int(min(800, max(40, v.get("h", 200)))), "kind": v.get("kind") if v.get("kind") in ("animal", "vehicle", "object") else "object",
                                 "prompt": str(v["prompt"])[:300]}
            log(f"New thing: {k}")
    town_file.write_text(json.dumps(town, indent=1, ensure_ascii=False), encoding="utf-8")
    props_file.write_text(json.dumps(props, indent=1, ensure_ascii=False), encoding="utf-8")
    global TOWN, PROPS
    TOWN, PROPS = town, props


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
    if "--grow" in sys.argv:
        grow()
    main(int(next((a for a in sys.argv[1:] if a.isdigit()), 40)))
