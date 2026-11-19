"""Storyboard of a 3D story before the long render: every shot as stills (its start, the beat, and the end), laid
out as a contact sheet with the shot names, plus one full-size still per shot for close checking.

    python tools/storyboard.py horror/script_queue/<script>.json  [out_dir]

Timing comes from the script's words (about 2.6 words a second), so the stills land roughly where the voice will
put them. The sheet is what the checking pass scores out of 10 (camera, framing, faces visible, the named thing
on screen on its word, phone readability); nothing under 8.5 goes to the full render."""
import json, os, re, shutil, subprocess, sys, tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[1]
FPS, WPS = 30, 2.6

script = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
src = REPO / "horror3d" / "stories" / script["three_d"]
out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(tempfile.mkdtemp()) / "storyboard"
out.mkdir(parents=True, exist_ok=True)
tmp = Path(tempfile.mkdtemp()); web = tmp / "web"; fr = tmp / "frames"
shutil.copytree(REPO / "horror3d" / "web", web); shutil.copy(src / "story.js", web / "story.js")

shots, words_all, f = [], [], 0
for line in script["lines"]:
    ws = re.findall(r"[A-Za-z0-9'][A-Za-z0-9'.,!?;:\-]*", line.replace("*", ""))
    n = max(18, int(len(ws) / WPS * FPS) + 10)
    wl, acc, tot = [], f + 4, sum(len(w) + 2 for w in ws) or 1
    for w in ws:
        d = (n - 10) * (len(w) + 2) / tot; wl.append([w, int(acc), int(acc + d)]); acc += d
    shots.append({"a": f, "b": f + n - 1, "beat": f + n // 2}); words_all.append(wl); f += n
total = f + 60
(web / "timing.js").write_text(f"export const TIMING = {json.dumps(shots)};\nexport const TOTAL = {total};\n"
                               f"export const WORDS = {json.dumps(words_all)};\n")
want = []
for s in shots:
    want += [s["a"] + 2, s["beat"], s["b"] - 2]
subprocess.run([sys.executable, str(REPO / "horror3d" / "render_worker.py"), str(web), str(fr), str(total), "1", "0",
                ",".join(map(str, want))], check=True, env={**os.environ, "CHROME_PATH": os.environ.get("CHROME_PATH", "/usr/bin/google-chrome")})

ids = re.search(r"const IDS = \[([^\]]*)\]", (src / "story.js").read_text())
names = [x.strip(" '\"") for x in ids.group(1).split(",")] if ids else [str(i) for i in range(len(shots))]
W, H = 240, 427
sheet = Image.new("RGB", (W * 3, (H + 34) * len(shots)), (16, 12, 20))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
except OSError:
    font = ImageFont.load_default()
for i, s in enumerate(shots):
    y = i * (H + 34)
    d.text((8, y + 6), f"{i + 1}. {names[i] if i < len(names) else ''}: {script['lines'][i][:70]}", fill=(255, 225, 74), font=font)
    for j, fn in enumerate([s["a"] + 2, s["beat"], s["b"] - 2]):
        im = Image.open(fr / f"f{fn:05d}.jpg")
        if j == 1:
            im.save(out / f"shot{i + 1:02d}_{names[i] if i < len(names) else i}.jpg", quality=88)
        sheet.paste(im.resize((W, H)), (j * W, y + 34))
sheet.save(out / "storyboard.jpg", quality=85)
print(out / "storyboard.jpg")
