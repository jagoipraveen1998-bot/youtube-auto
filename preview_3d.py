"""Render a preview sheet of every 3D character and setting, and time one full scene.

    python preview_3d.py     # writes previews/characters.jpg, previews/settings.jpg, previews/sample_loop.mp4
"""
import json
import shutil
import time

from PIL import Image, ImageDraw, ImageFont

from autotube import scene3d
from autotube.util import ROOT, load_config, log


def label_font(size):
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
    except Exception:
        return ImageFont.load_default()


def sheet(images, labels, cols, cell, out, bg=(236, 244, 255)):
    rows = (len(images) + cols - 1) // cols
    W, H = cols * cell[0], rows * (cell[1] + 36)
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)
    f = label_font(22)
    for i, (p, lab) in enumerate(zip(images, labels)):
        x, y = (i % cols) * cell[0], (i // cols) * (cell[1] + 36)
        if p and p.exists():
            im = Image.open(p).convert("RGBA")
            im.thumbnail(cell)
            img.paste(im, (x + (cell[0] - im.width) // 2, y + (cell[1] - im.height) // 2), im)
        else:
            d.rectangle([x + 10, y + 10, x + cell[0] - 10, y + cell[1] - 10], outline=(200, 60, 60), width=4)
            d.text((x + 20, y + 20), "failed", fill=(200, 60, 60), font=f)
        d.text((x + cell[0] / 2, y + cell[1] + 18), lab, fill=(40, 40, 70), font=f, anchor="mm")
    img.save(out, quality=88)
    return out


def main():
    cfg = load_config()
    work = ROOT / "output_preview"
    shutil.rmtree(work, ignore_errors=True)
    work.mkdir(parents=True)
    out = ROOT / "previews"
    out.mkdir(exist_ok=True)
    if not scene3d.blender_bin():
        raise SystemExit("Blender not found (set BLENDER)")
    engine = scene3d._pick_engine(cfg, work)
    report = {"engine": engine}

    # 1. every character
    t0 = time.time()
    scene3d.render_portraits(scene3d.CHARACTERS, work / "portraits", cfg, 300)
    report["portraits_s"] = round(time.time() - t0)
    sheet([work / "portraits" / f"{k}.png" for k in scene3d.CHARACTERS], scene3d.CHARACTERS, 8, (300, 300),
          out / "characters.jpg")

    # 2. every setting (one frame each)
    stills, labels = [], []
    mains = {"meadow": "bunny", "garden": "banana", "farm": "cow", "night": "owl", "beach": "mouse",
             "snow": "snowman", "town": "bus"}
    for i, st in enumerate(scene3d.SETTINGS):
        folder = work / f"set_{st}"
        folder.mkdir()
        spec = {"mode": "loop", "out_dir": str(folder), "width": 640, "height": 360, "fps": 15, "frames": 1,
                "engine": engine, "samples": 12, "seed": 10 + i, "setting": st, "main": mains[st],
                "friends": ["parrot", "dog"] if st == "beach" else ["pig", "duck"], "vertical": False}
        ok, tail = scene3d._run_blender(spec, folder / "spec.json", 900)
        if not ok:
            log(f"setting {st} failed: {tail[-600:]}")
        stills.append(folder / "f_0001.png")
        labels.append(f"{st} ({mains[st]})")
    sheet(stills, labels, 4, (640, 360), out / "settings.jpg")

    # 3. one full loop at production size, timed
    rhyme = {"title": "Banana Dance", "character_id": "banana", "friends": ["monkey", "bunny"], "setting": "garden"}
    t0 = time.time()
    try:
        loop, portrait, secs = scene3d.render_loop(rhyme, False, 100, 42, work / "sample", cfg, (1920, 1080))
        shutil.copy(loop, out / "sample_loop.mp4")
        report["loop_seconds"] = round(secs, 2)
        report["loop_render_s"] = round(time.time() - t0)
    except Exception as exc:
        report["loop_error"] = str(exc)[-800:]
    t0 = time.time()
    try:
        loop, _, _ = scene3d.render_loop(rhyme, True, 100, 43, work / "sample_v", cfg, (1080, 1920))
        shutil.copy(loop, out / "sample_loop_vertical.mp4")
        report["vertical_render_s"] = round(time.time() - t0)
    except Exception as exc:
        report["vertical_error"] = str(exc)[-800:]
    (out / "report.json").write_text(json.dumps(report, indent=2))
    log(f"Preview done: {report}")


if __name__ == "__main__":
    main()
