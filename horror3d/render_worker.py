"""Render every N-th frame of the 3D Short with headless Chromium: python render_worker.py <web> <out> <total> <n> <k>"""
import base64, http.server, os, socketserver, sys, threading
from functools import partial
from pathlib import Path
from playwright.sync_api import sync_playwright

web, out, total, n, k = Path(sys.argv[1]), Path(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
frames = [int(x) for x in sys.argv[6].split(",")] if len(sys.argv) > 6 else [f for f in range(total) if f % n == k]
out.mkdir(parents=True, exist_ok=True)


class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript"}

    def log_message(self, *a):
        pass


srv = socketserver.TCPServer(("127.0.0.1", 0), partial(H, directory=str(web)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    kw = {"args": ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]}
    if os.environ.get("CHROME_PATH"):
        kw["executable_path"] = os.environ["CHROME_PATH"]
    br = p.chromium.launch(**kw)
    pg = br.new_page(viewport={"width": 1080, "height": 1920})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"http://127.0.0.1:{srv.server_address[1]}/index.html")
    pg.wait_for_function("window.ready || window.err", timeout=240000)
    if pg.evaluate("window.err") or errs:
        sys.exit(f"3D page error: {pg.evaluate('window.err')} {errs[:2]}")
    for i, f in enumerate(frames):
        fn = out / f"f{f:05d}.jpg"
        if fn.exists():
            continue
        d = pg.evaluate("f => { window.renderFrame(f); return document.getElementById('c').toDataURL('image/jpeg', 0.94); }", f)
        fn.write_bytes(base64.b64decode(d.split(",")[1]))
        if k == 0 and i % 60 == 0:
            print(f"[3d] worker 0: {i}/{len(frames)} frames", flush=True)
    br.close()
srv.shutdown()
