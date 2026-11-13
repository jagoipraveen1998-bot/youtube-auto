"""Render the football film frames with headless Chromium. python render.py stills 1 5 18 ... | python render.py video out.mp4 [timing.json]"""
import base64, json, subprocess, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
HERE = Path(__file__).parent
mode = sys.argv[1]
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu-vsync"])
    pg = b.new_page(viewport={"width": 1080, "height": 1920})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto((HERE / "web/index.html").resolve().as_uri()); pg.wait_for_timeout(500)
    if errs: print("PAGE ERRORS", errs); sys.exit(1)
    timing = sys.argv[3] if mode == "video" and len(sys.argv) > 3 else (sys.argv[-1] if sys.argv[-1].endswith(".json") else None)
    if timing: pg.evaluate("t => setTiming(t)", json.loads(Path(timing).read_text()))
    grab = "t => { frame(t); return document.getElementById('c').toDataURL('image/jpeg', 0.9); }"
    if mode == "stills":
        out = Path("/tmp/fb_stills"); out.mkdir(exist_ok=True)
        for s in [x for x in sys.argv[2:] if not x.endswith(".json")]:
            d = pg.evaluate(grab, float(s)); (out / f"{float(s):07.2f}.jpg").write_bytes(base64.b64decode(d.split(",")[1]))
        if errs: print("ERRORS", errs[:5])
    else:
        ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", "30", "-c:v", "mjpeg", "-i", "-",
                               "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", sys.argv[2]], stdin=subprocess.PIPE)
        n = 120 * 30
        for i in range(n):
            d = pg.evaluate(grab, i / 30)
            ff.stdin.write(base64.b64decode(d.split(",")[1]))
            if i % 300 == 0: print("frame", i, flush=True)
        ff.stdin.close(); ff.wait()
        if errs: print("ERRORS", errs[:5])
    b.close()
