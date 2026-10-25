"""Time a few 3D render settings on this machine and save one frame of each for comparison.

    python bench_3d.py      # writes previews/bench.jpg and previews/bench.json
"""
import json
import re
import shutil
import subprocess
import time

from PIL import Image, ImageDraw

from autotube import scene3d
from autotube.util import ROOT, log
from preview_3d import label_font

CONFIGS = [  # name, engine, width, height, samples, extra spec
    ("workbench exp 0.8", "WORKBENCH", 960, 540, 1, {"exposure": 0.8}),
    ("workbench exp 1.2", "WORKBENCH", 960, 540, 1, {"exposure": 1.2}),
    ("workbench outdoor exp 0.8", "WORKBENCH", 960, 540, 1, {"exposure": 0.8, "studio_light": "outdoor.sl"}),
    ("cycles 640x360 s8", "CYCLES", 640, 360, 8, {}),
]
FRAMES = 6


def main():
    work = ROOT / "output_bench"
    shutil.rmtree(work, ignore_errors=True)
    out = ROOT / "previews"
    out.mkdir(exist_ok=True)
    results, tiles = [], []
    for i, (name, engine, w, h, samples, extra) in enumerate(CONFIGS):
        folder = work / f"c{i}"
        folder.mkdir(parents=True)
        spec = {"mode": "loop", "out_dir": str(folder), "width": w, "height": h, "fps": 12, "frames": FRAMES,
                "engine": engine, "samples": samples, "seed": 42, "setting": "farm", "main": "cow",
                "friends": ["pig", "chick"], "vertical": False, **extra}
        (folder / "spec.json").write_text(json.dumps(spec))
        cmd = [scene3d.blender_bin(), "-b", "--factory-startup", "-noaudio", "-P", str(scene3d.SCRIPT), "--",
               str(folder / "spec.json")]
        if engine != "CYCLES":
            cmd = ["xvfb-run", "-a", "-s", "-screen 0 1280x720x24"] + cmd
        t0 = time.time()
        try:
            p = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
            text = p.stdout + p.stderr
        except subprocess.TimeoutExpired as exc:
            text = "TIMEOUT " + str(exc.stdout or "")[-2000:]
        total = time.time() - t0
        times = []
        for mm, ss in re.findall(r"Saved: [^\n]*\s+Time: (\d+):(\d+\.\d+)", text):
            times.append(int(mm) * 60 + float(ss))
        steady = sorted(times[1:])[len(times[1:]) // 2] if len(times) > 1 else None
        r = {"name": name, "total_s": round(total, 1), "frame_times": [round(t, 2) for t in times],
             "per_frame_s": round(steady, 2) if steady else None, "engine_used": re.findall(r"ENGINE (\w+)", text)[:1],
             "tail": text[-600:] if not times else ""}
        results.append(r)
        log(f"BENCH {r}")
        frame = folder / "f_0003.png"
        tiles.append((frame if frame.exists() else None, f"{name}: {r['per_frame_s']} s/frame"))
    cell = (640, 360)
    img = Image.new("RGB", (cell[0] * 2, (cell[1] + 40) * 2), (236, 244, 255))
    d = ImageDraw.Draw(img)
    f = label_font(22)
    for i, (p, lab) in enumerate(tiles):
        x, y = (i % 2) * cell[0], (i // 2) * (cell[1] + 40)
        if p:
            im = Image.open(p).convert("RGB").resize(cell)
            img.paste(im, (x, y))
        d.text((x + 10, y + cell[1] + 8), lab, fill=(40, 40, 70), font=f)
    img.save(out / "bench.jpg", quality=90)
    (out / "bench.json").write_text(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
