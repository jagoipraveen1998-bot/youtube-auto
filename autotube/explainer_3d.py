"""Blender-backed scene rendering for mechanism-focused explainers."""
import json
import re
import shutil
import subprocess
import time
from pathlib import Path

from .scene3d import blender_bin
from .util import log

SCRIPT = Path(__file__).with_name("blender_explainer_scene.py")

# Choose a concrete model from the full spoken section, not only its short label.
MODEL_RULES = [
    ("reactor", r"\b(nuclear|reactor|uranium|fission|fuel rods?|control rods?|coolant|steam generator)\b"),
    ("chip", r"\b(chip|silicon|transistor|processor|microprocessor|semiconductor)\b"),
    ("battery", r"\b(battery|lithium|anode|cathode|electrolyte|ion)\b"),
    ("orbit", r"\b(gps|satellite|orbit|spacecraft|receiver in space)\b"),
    ("data_center", r"\b(data cent(re|er)|server rack|cooling|servers)\b"),
    ("engine", r"\b(engine|turbine|motor|gearbox|propeller|jet|rocket|piston|crankshaft)\b"),
    ("elevator", r"\b(lift|elevator|hoist|lift shaft|storey|floors?)\b"),
    ("fiber", r"\b(fibre|fiber|optic|optical cable|light pulse)\b"),
    ("wave", r"\b(sound|noise|wave|frequency|headphones|radio)\b"),
    ("screen", r"\b(screen|display|touchscreen|pixel|led|oled|backlight)\b"),
    ("sensor", r"\b(sensor|camera|fingerprint|face unlock|lidar|barcode|qr code|image)\b"),
    ("payment", r"\b(payment|credit card|bank|merchant|encryption|encrypted)\b"),
    ("network", r"\b(internet|network|wifi|wi-fi|router|data packet|web page)\b"),
    ("solar", r"\b(solar|sunlight|photovoltaic|panel)\b"),
]
TYPE_MODELS = {
    "building": "elevator", "orbit": "orbit", "wave": "wave", "layers": "chip",
    "particles": "battery", "rotor": "engine", "network": "network", "beam": "fiber",
    "grid_scan": "sensor", "thermal": "data_center", "pipeline": "pipeline",
    "bars": "mechanism", "compare": "mechanism", "flow": "network",
    "points": "mechanism", "number": "mechanism",
}


def choose_model(context: str, visual: dict, avoid: tuple = (),
                 strict: bool = False) -> str | None:
    """Pick the model this SECTION is about, not the one the whole video is about.

    The topic words appear in every section, so matching on them first made all
    six sections render the same loop. The section's own words come first, the
    visual it asked for next, and the topic only when nothing else decides.
    """
    own = [str(visual.get("heading", ""))]
    own.extend(str(visual.get(k, "")) for k in ("left", "right", "mode"))
    own.extend(str(x) for x in visual.get("labels", []) if x)
    own.extend(str(x) for x in visual.get("items", []) if x)
    fallback = TYPE_MODELS.get(str(visual.get("type", "")).lower())
    texts = [" ".join(own).lower()] if strict else [" ".join(own).lower(), str(context).lower()]
    for text in texts:
        hits = [m for m, pattern in MODEL_RULES if re.search(pattern, text)]
        for model in hits:
            if model not in avoid:
                return model
        if hits and not strict:
            return fallback if (fallback and fallback not in avoid) else hits[0]
    if strict:
        # This section does not name a thing we have a model of, or the only model
        # that fits was just used. The drawn diagram says more than a generic prop
        # would, so the caller stays 2D - which keeps the video varied too.
        return None
    return fallback or "mechanism"


def render(visual: dict, context: str, work: Path, name: str, cfg: dict,
           avoid: tuple = ()) -> tuple[str, int, int]:
    """Render a short seamless 3D loop; return image pattern, count, and FPS."""
    blender = blender_bin()
    if not blender:
        raise RuntimeError("Blender is required for 3D explainer rendering but was not found")

    fps = max(8, min(15, int(cfg.get("fps", 12))))
    loop_seconds = max(3, min(8, int(cfg.get("loop_seconds", 4))))
    frames = fps * loop_seconds
    width = max(320, min(1280, int(cfg.get("width", 640))))
    height = max(180, min(720, int(cfg.get("height", 360))))
    engine = str(cfg.get("engine", "WORKBENCH")).upper()
    if engine not in {"WORKBENCH", "EEVEE", "CYCLES"}:
        engine = "WORKBENCH"

    folder = work / "frames_3d" / name
    shutil.rmtree(folder, ignore_errors=True)
    folder.mkdir(parents=True, exist_ok=True)
    spec = {
        "out_dir": str(folder), "width": width, "height": height, "fps": fps,
        "frames": frames, "engine": engine, "samples": int(cfg.get("samples", 1)),
        "timeout": int(cfg.get("timeout", 900)), "model": choose_model(context, visual, avoid) or "mechanism",
        "visual": visual, "context": context, "style": str(cfg.get("style", "")),
    }
    spec_path = folder / "spec.json"
    spec_path.write_text(json.dumps(spec, ensure_ascii=False), encoding="utf-8")
    command = [blender, "-b", "--factory-startup", "-noaudio", "-P", str(SCRIPT), "--", str(spec_path)]
    if shutil.which("xvfb-run") and engine in {"WORKBENCH", "EEVEE"}:
        command = ["xvfb-run", "-a", "-s", "-screen 0 1280x720x24"] + command

    started = time.time()
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=spec["timeout"])
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(f"3D explainer render timed out after {spec['timeout']} seconds") from exc
    if result.returncode:
        tail = (result.stdout + "\n" + result.stderr)[-1800:]
        raise RuntimeError(f"Blender could not render the 3D explainer scene: {tail}")

    rendered = list(folder.glob("f_*.png"))
    if len(rendered) != frames or any(p.stat().st_size < 1024 for p in rendered[:1]):
        raise RuntimeError(f"3D scene produced {len(rendered)} of {frames} expected frames")
    if spec["style"].lower() == "anime":
        from . import anime_style
        anime_style.stylize_folder(folder)
    log(f"3D scene {spec['model']} rendered {frames} frames in {time.time() - started:.0f}s")
    return str(folder / "f_%04d.png"), frames, fps
