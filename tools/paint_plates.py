"""Paint photo-real background plates for a 3D story with Cloudflare Workers AI (free daily allowance).

Reads horror3d/stories/<name>/plates.json: {"style": "...", "plates": [{"id": "...", "prompt": "...", "w": 1080, "h": 1920}]}
and writes horror3d/stories/<name>/plates/<id>.jpg for every plate that is not there yet. Tries FLUX.2 [dev] first
(sharp, up to 1920 px), then Leonardo Lucid Origin, then FLUX.1 [schnell]. Stops cleanly when the day's allowance runs out,
so the next run carries on where this one stopped."""
import base64, io, json, os, sys, time
from pathlib import Path
import requests
from PIL import Image

ACC, TOK = os.environ["CF_ACCOUNT_ID"], os.environ["CF_API_TOKEN"]
URL = f"https://api.cloudflare.com/client/v4/accounts/{ACC}/ai/run/"
H = {"Authorization": f"Bearer {TOK}"}


def flux2(prompt, w, h, seed):
    files = {"prompt": (None, prompt), "width": (None, str(min(w, 1920))), "height": (None, str(min(h, 1920))), "steps": (None, "28"), "seed": (None, str(seed))}
    r = requests.post(URL + "@cf/black-forest-labs/flux-2-dev", headers=H, files=files, timeout=300)
    return r


def lucid(prompt, w, h, seed):
    return requests.post(URL + "@cf/leonardo/lucid-origin", headers=H, json={"prompt": prompt, "width": w, "height": h, "num_steps": 30, "seed": seed}, timeout=300)


def schnell(prompt, w, h, seed):
    return requests.post(URL + "@cf/black-forest-labs/flux-1-schnell", headers=H, json={"prompt": prompt, "steps": 8, "seed": seed}, timeout=300)


def decode(r):
    if r.headers.get("content-type", "").startswith("image/"):
        return r.content
    j = r.json(); img = (j.get("result") or {}).get("image")
    if not img:
        raise RuntimeError(f"no image in reply: {str(j)[:300]}")
    return requests.get(img, timeout=60).content if img.startswith("http") else base64.b64decode(img)


def main(story):
    d = Path("horror3d/stories") / story; spec = json.loads((d / "plates.json").read_text())
    out = d / "plates"; out.mkdir(exist_ok=True); made = 0
    for p in spec["plates"]:
        dst = out / f"{p['id']}.jpg"
        if dst.exists() and not p.get("redo"):
            continue
        prompt = f"{p['prompt']} {spec.get('style', '')}".strip()[:2000]
        w, h = p.get("w", 1080), p.get("h", 1920); seed = p.get("seed", 7)
        for name, fn in (("flux-2-dev", flux2), ("lucid-origin", lucid), ("flux-1-schnell", schnell)):
            try:
                r = fn(prompt, w, h, seed)
            except Exception as e:
                print(f"{p['id']}: {name} failed: {e}"); continue
            if r.status_code == 429 or "daily" in r.text[:400].lower() and r.status_code >= 400:
                print(f"{p['id']}: {name} allowance used up ({r.status_code}); stopping for today"); return made
            if r.status_code != 200:
                print(f"{p['id']}: {name} {r.status_code}: {r.text[:300]}"); continue
            try:
                im = Image.open(io.BytesIO(decode(r))).convert("RGB")
            except Exception as e:
                print(f"{p['id']}: {name} bad image: {e}"); continue
            if im.size != (w, h):                     # cover-crop to the size asked for
                k = max(w / im.width, h / im.height); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
                l, t = (im.width - w) // 2, (im.height - h) // 2; im = im.crop((l, t, l + w, t + h))
            im.save(dst, quality=92); made += 1; print(f"{p['id']}: painted with {name} {im.size}"); break
        time.sleep(2)
    return made


if __name__ == "__main__":
    print("plates made:", main(sys.argv[1]))
