"""Make the channel's profile picture and banner from the real 3D characters.

    python channel_art.py            # writes channel/avatar.png and channel/banner.png

The banner keeps the name and tagline inside YouTube's safe area (the middle
1546x423 of 2048x1152), which is the part shown on every device, including TVs.
"""
import json
import shutil

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from autotube import scene3d
from autotube.rhymes_video import fonts
from autotube.util import ROOT, load_config, log

TITLE = "Giggle Rhymes Kids"
TAGLINE = "A brand new Milo the Mouse story every day"
BANNER = (2048, 1152)
SAFE = (1546, 423)  # what every device shows, centred
AVATAR = 800


def font_at(size: int):
    try:
        return ImageFont.truetype(fonts("en")[0], size)
    except Exception:
        return ImageFont.load_default()


def fit(draw, text: str, start: int, width: int):
    """Largest font size at which the text still fits the width."""
    size = start
    while size > 24:
        f = font_at(size)
        if draw.textlength(text, font=f) <= width:
            return f
        size -= 4
    return font_at(24)


def avatar(work, cfg):
    folder = work / "portrait"
    scene3d.render_portraits(["mouse"], folder, cfg, 1024)
    src = folder / "mouse.png"
    if not src.exists():
        raise SystemExit("Could not render Milo for the profile picture")
    img = Image.new("RGBA", (AVATAR, AVATAR), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # a soft sunny disc behind him, so the round crop looks deliberate
    d.ellipse([0, 0, AVATAR, AVATAR], fill=(255, 214, 102, 255))
    d.ellipse([int(AVATAR * 0.07)] * 2 + [int(AVATAR * 0.93)] * 2, fill=(255, 236, 179, 255))
    milo = Image.open(src).convert("RGBA")
    milo.thumbnail((int(AVATAR * 0.82), int(AVATAR * 0.82)), Image.LANCZOS)
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    mask = milo.split()[-1].point(lambda v: 70 if v > 12 else 0)
    shadow.paste((90, 60, 20, 255), ((AVATAR - milo.width) // 2, (AVATAR - milo.height) // 2 + 14), mask)
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    img.alpha_composite(milo, ((AVATAR - milo.width) // 2, (AVATAR - milo.height) // 2))
    out = ROOT / "channel" / "avatar.png"
    img.save(out)
    log(f"Profile picture: {out.name} ({AVATAR}x{AVATAR})")
    return out


def banner(work, cfg):
    folder = work / "banner"
    folder.mkdir(parents=True, exist_ok=True)
    engine = scene3d._pick_engine(cfg, work)
    tc = cfg.get("threed", {})
    spec = {"mode": "art", "out_dir": str(folder), "width": BANNER[0], "height": BANNER[1],
            "fps": 24, "frames": 1, "engine": engine,
            "samples": int(tc.get(f"samples_{engine.lower()}", 12)), "seed": 11,
            "setting": "town", "ids": ["mouse", "parrot", "bear", "duck"], "shot": "high",
            "exposure": tc.get("exposure", 0.0), "studio_light": tc.get("studio_light", "Default")}
    ok, tail = scene3d._run_blender(spec, folder / "spec.json", 1800)
    src = folder / "art.png"
    if not ok or not src.exists():
        raise SystemExit(f"Banner render failed: {tail[-800:]}")

    img = Image.open(src).convert("RGB")
    if img.size != BANNER:
        img = img.resize(BANNER, Image.LANCZOS)
    d = ImageDraw.Draw(img)
    sx = (BANNER[0] - SAFE[0]) // 2
    sy = (BANNER[1] - SAFE[1]) // 2

    # a soft band behind the words so they read against the sky
    band = Image.new("RGBA", BANNER, (0, 0, 0, 0))
    ImageDraw.Draw(band).rounded_rectangle(
        [sx + 40, sy + 8, sx + SAFE[0] - 40, sy + 212], 60, fill=(26, 13, 46, 92))
    img = Image.alpha_composite(img.convert("RGBA"), band.filter(ImageFilter.GaussianBlur(6))).convert("RGB")
    d = ImageDraw.Draw(img)

    title_font = fit(d, TITLE, 150, SAFE[0] - 180)
    d.text((BANNER[0] / 2, sy + 78), TITLE, font=title_font, anchor="mm",
           fill=(255, 235, 59), stroke_width=11, stroke_fill=(94, 42, 134))
    tag_font = fit(d, TAGLINE, 62, SAFE[0] - 200)
    d.text((BANNER[0] / 2, sy + 170), TAGLINE, font=tag_font, anchor="mm",
           fill=(255, 255, 255), stroke_width=6, stroke_fill=(94, 42, 134))

    out = ROOT / "channel" / "banner.png"
    img.save(out, quality=95)
    log(f"Banner: {out.name} ({BANNER[0]}x{BANNER[1]})")
    return out


def main():
    cfg = load_config()
    work = ROOT / "output_channel"
    shutil.rmtree(work, ignore_errors=True)
    work.mkdir(parents=True)
    (ROOT / "channel").mkdir(exist_ok=True)
    if not scene3d.blender_bin():
        raise SystemExit("Blender not found (set BLENDER)")
    made = {"avatar": str(avatar(work, cfg)), "banner": str(banner(work, cfg))}
    (ROOT / "channel" / "report.json").write_text(json.dumps(made, indent=2))
    log("Channel artwork ready")


if __name__ == "__main__":
    main()
