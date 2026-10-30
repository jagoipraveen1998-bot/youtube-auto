"""Make the channel's profile picture and banner for the explainer channel.

    python channel_art_explainer.py        # writes channel/avatar.png and channel/banner.png

Drawn with Pillow in the same visual language as the videos, so the channel page
and the videos look like one thing. The banner keeps the name and tagline inside
YouTube's safe area (the middle 1546x423 of 2048x1152), which is the part shown
on every device including TVs.
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

from autotube import explainer_art as art
from autotube.util import ROOT, load_config, log

TAGLINE = "The machinery of the modern world, explained"
FOOTER = "New video every day"
BANNER = (2048, 1152)
SAFE = (1546, 423)
AVATAR = 800


def gear(d: ImageDraw.ImageDraw, cx: float, cy: float, r: float, teeth: int,
         colour, hole: float = 0.42) -> None:
    """A cog: the clearest 'how things work' mark there is at small sizes."""
    pts = []
    inner, outer = r * 0.80, r
    for i in range(teeth * 2):
        a0 = (i / (teeth * 2)) * math.tau
        a1 = ((i + 1) / (teeth * 2)) * math.tau
        rad = outer if i % 2 == 0 else inner
        # square-ish teeth rather than a star
        for a in (a0 + 0.012, a1 - 0.012):
            pts.append((cx + rad * math.cos(a), cy + rad * math.sin(a)))
    d.polygon(pts, fill=colour)
    hr = r * hole
    d.ellipse([cx - hr, cy - hr, cx + hr, cy + hr], fill=art.BG)


def backdrop(size: tuple[int, int]) -> Image.Image:
    """The videos' background, at whatever size is asked for."""
    w, h = size
    img = Image.new("RGB", (w, h), art.BG)
    d = ImageDraw.Draw(img)
    for y in range(h):
        k = y / h
        d.line([(0, y), (w, y)], fill=tuple(int(a + (b - a) * (1 - k) * 0.55)
                                            for a, b in zip(art.BG, art.BG2)))
    glow = Image.new("RGB", (w, h), art.BG)
    ImageDraw.Draw(glow).ellipse([w * 0.18, -h * 0.35, w * 0.82, h * 1.35], fill=(32, 55, 92))
    return Image.blend(img, glow.filter(ImageFilter.GaussianBlur(int(h * 0.12))), 0.8)


def avatar(out: Path) -> Path:
    s = AVATAR
    img = backdrop((s, s))
    d = ImageDraw.Draw(img)
    gear(d, s * 0.5, s * 0.46, s * 0.30, 9, art.ACCENTS[0])
    gear(d, s * 0.745, s * 0.715, s * 0.165, 7, art.ACCENTS[1], hole=0.40)
    img.save(out)
    log(f"Avatar -> {out.name}")
    return out


def banner(title: str, out: Path) -> Path:
    w, h = BANNER
    img = backdrop(BANNER)
    d = ImageDraw.Draw(img)
    sx, sy = (w - SAFE[0]) / 2, (h - SAFE[1]) / 2

    # faint machinery in the wings, clear of the safe area so phones and TVs
    # see only the words
    for cx, cy, r, t in ((w * 0.050, h * 0.50, w * 0.070, 10),
                         (w * 0.950, h * 0.50, w * 0.070, 10),
                         (w * 0.165, h * 0.82, w * 0.040, 8),
                         (w * 0.835, h * 0.18, w * 0.040, 8)):
        gear(d, cx, cy, r, t, (38, 60, 96))

    words = title.upper()
    f = art.fit_font(d, words, 150, SAFE[0] - 40, True, 60)
    d.text((w / 2, sy + 150), words, font=f, fill=art.FG, anchor="mm")
    d.rounded_rectangle([w / 2 - 110, sy + 212, w / 2 + 110, sy + 222], 5, fill=art.ACCENTS[0])

    tf = art.fit_font(d, TAGLINE, 52, SAFE[0] - 80, False, 30)
    d.text((w / 2, sy + 278), TAGLINE, font=tf, fill=art.MUTED, anchor="mm")
    d.text((w / 2, sy + 352), FOOTER, font=art.font(42, True), fill=art.ACCENTS[0], anchor="mm")
    img.save(out)
    log(f"Banner -> {out.name}")
    return out


def main():
    cfg = load_config()
    out = ROOT / "channel"
    out.mkdir(parents=True, exist_ok=True)
    avatar(out / "avatar.png")
    banner(cfg["channel"]["name"], out / "banner.png")


if __name__ == "__main__":
    main()
