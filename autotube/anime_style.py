"""An anime-film finish for the renders: painted dusk sky, cel shading, ink lines, glow.

Blender renders each 3D shot with a transparent background. This module then
gives every frame the look of a hand-finished anime film:

- shading is cut into three flat tones (light, mid, shadow) the way cel
  animation is painted, with shadows pushed towards violet and lights towards
  warm gold;
- a clean ink line is drawn round the silhouette and along hard edges inside it;
- the object sits on a painted dusk sky with soft clouds and a warm horizon,
  over a soft contact shadow;
- anything bright and saturated (moving charge, sparks, hot cores) blooms.

It is pure Pillow + numpy, so it runs in a fraction of a second per frame and
can be checked on any machine.
"""
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# the dusk palette: zenith -> upper sky -> lower sky -> horizon glow
ZENITH = (16, 28, 82)
UPPER = (44, 50, 128)
LOWER = (128, 76, 150)
HORIZON = (246, 150, 118)
SHADOW_TINT = np.array([96, 78, 176], dtype=np.float32)    # violet shadows
LIGHT_TINT = np.array([255, 226, 178], dtype=np.float32)   # warm sunlit side
INK = (22, 18, 40)


def _lerp(a, b, t):
    return tuple(int(round(x + (y - x) * t)) for x, y in zip(a, b))


@lru_cache(maxsize=8)
def sky(w: int, h: int, glow: float = 1.0, seed: int = 7) -> Image.Image:
    """A painted dusk sky. glow < 1 keeps the horizon darker, for text over it."""
    rng = np.random.default_rng(seed)
    horizon = _lerp(LOWER, HORIZON, glow)
    stops = [(0.0, ZENITH), (0.42, UPPER), (0.78, LOWER), (1.0, horizon)]
    col = np.zeros((h, 3), dtype=np.float32)
    for y in range(h):
        t = y / max(1, h - 1)
        for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
            if t0 <= t <= t1:
                k = (t - t0) / (t1 - t0)
                k = k * k * (3 - 2 * k)
                col[y] = _lerp(c0, c1, k)
                break
    img = Image.fromarray(np.repeat(col[:, None, :], w, axis=1).astype(np.uint8), "RGB")

    # stars, only in the dark upper sky
    stars = Image.new("L", (w, h), 0)
    sd = ImageDraw.Draw(stars)
    for _ in range(int(w * h / 9000)):
        x, y = rng.uniform(0, w), rng.uniform(0, h * 0.42) ** 1.15
        r = rng.choice([0.6, 0.9, 1.4], p=[0.6, 0.3, 0.1]) * w / 1920 * 2
        sd.ellipse([x - r, y - r, x + r, y + r], fill=int(rng.uniform(90, 220)))
    img = Image.composite(Image.new("RGB", (w, h), (255, 246, 230)), img, stars)

    # long, flat painted clouds: lit pink-gold on top, lavender underneath
    clouds = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cd = ImageDraw.Draw(clouds)
    for i in range(7):
        cy = h * rng.uniform(0.48, 0.86)
        cx = w * rng.uniform(-0.1, 1.1)
        cw = w * rng.uniform(0.25, 0.55)
        ch = h * rng.uniform(0.025, 0.06)
        lit = _lerp((255, 196, 170), (255, 222, 190), rng.uniform(0, 1))
        under = (150, 108, 170)
        for k in range(5):                     # a few overlapping lobes per cloud
            ox = cx + rng.uniform(-0.4, 0.4) * cw
            oy = cy + rng.uniform(-0.6, 0.3) * ch
            rw, rh = cw * rng.uniform(0.25, 0.5), ch * rng.uniform(0.7, 1.3)
            cd.ellipse([ox - rw, oy - rh + ch * 0.25, ox + rw, oy + rh + ch * 0.25],
                       fill=under + (int(140 * glow + 60),))
            cd.ellipse([ox - rw, oy - rh, ox + rw, oy + rh * 0.55],
                       fill=lit + (int(120 * glow + 40),))
    clouds = clouds.filter(ImageFilter.GaussianBlur(max(1.5, w / 700)))
    img = Image.alpha_composite(img.convert("RGBA"), clouds).convert("RGB")
    return img


def _band(v: np.ndarray) -> np.ndarray:
    """Cut a smooth 0..1 shading value into three flat cel tones."""
    return np.where(v < 0.40, 0.0, np.where(v < 0.68, 1.0, 2.0))


def stylize(frame: Image.Image, backdrop: Image.Image) -> Image.Image:
    """One transparent Blender frame -> one finished anime frame (RGB)."""
    rgba = np.asarray(frame.convert("RGBA"), dtype=np.float32)
    rgb, alpha = rgba[..., :3], rgba[..., 3] / 255.0
    h, w = alpha.shape

    # 1. cel shading: keep each pixel's hue, flatten its brightness to 3 tones
    mx = rgb.max(axis=2, keepdims=True)
    base = rgb / np.maximum(mx, 1.0)                     # the material colour, unlit
    lum = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]) / 255.0
    band = _band(lum)
    level = np.choose(band.astype(int), [0.52, 0.80, 1.0])[..., None]
    cel = base * level * 255.0
    shadow = (band == 0)[..., None]
    light = (band == 2)[..., None]
    cel = np.where(shadow, cel * 0.72 + SHADOW_TINT * 0.28, cel)
    cel = np.where(light, cel * 0.86 + LIGHT_TINT * 0.14, cel)
    # a little more colour, as painted backgrounds have
    grey = cel.mean(axis=2, keepdims=True)
    cel = np.clip(grey + (cel - grey) * 1.18, 0, 255)

    # 2. ink: hard edges inside the object, and a clean outline round it
    lum_img = Image.fromarray((lum * 255).astype(np.uint8), "L")
    # edges of the flattened tones, cleaned, so curved surfaces don't speckle
    band_img = Image.fromarray((band * 120).astype(np.uint8), "L").filter(ImageFilter.MedianFilter(5))
    hard = np.asarray(lum_img.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MedianFilter(3)),
                      dtype=np.float32)
    inner = (hard > 60) & (alpha > 0.5)
    del band_img
    a_img = Image.fromarray((alpha * 255).astype(np.uint8), "L")
    grow = max(2, round(w / 480))                         # line weight scales with size
    fat = np.asarray(a_img.filter(ImageFilter.MaxFilter(grow * 2 + 1)), dtype=np.float32) / 255
    ring = (fat > 0.5) & (alpha < 0.5)
    ink = np.array(INK, dtype=np.float32)
    cel = np.where(inner[..., None], cel * 0.25 + ink * 0.75, cel)

    # 3. glow: bright, saturated paint (moving charge, sparks, hot cores) blooms
    sat = (rgb.max(axis=2) - rgb.min(axis=2)) / np.maximum(rgb.max(axis=2), 1)
    hot = ((rgb.max(axis=2) > 200) & (sat > 0.45) & (alpha > 0.5)).astype(np.float32)
    glow = None
    if hot.any():
        gm = Image.fromarray((hot * 255).astype(np.uint8), "L").filter(
            ImageFilter.GaussianBlur(max(4, w / 110)))
        glow = np.asarray(gm, dtype=np.float32)[..., None] / 255.0

    # 4. composite: sky, soft contact shadow, the object with its outline, the glow
    sky_arr = np.asarray(backdrop.resize((w, h)), dtype=np.float32)
    ys, xs = np.nonzero(alpha > 0.5)
    out = sky_arr.copy()
    if len(xs):
        sh = Image.new("L", (w, h), 0)
        x0, x1, yb = xs.min(), xs.max(), ys.max()
        rw = (x1 - x0) * 0.42
        ImageDraw.Draw(sh).ellipse([(x0 + x1) / 2 - rw, yb - h * 0.025,
                                    (x0 + x1) / 2 + rw, yb + h * 0.035], fill=120)
        sh = np.asarray(sh.filter(ImageFilter.GaussianBlur(h / 40)), dtype=np.float32)[..., None] / 255
        out = out * (1 - sh * 0.55) + np.array([40, 26, 70], dtype=np.float32) * sh * 0.55
    out = np.where(ring[..., None], ink, out)
    a3 = alpha[..., None]
    out = out * (1 - a3) + cel * a3
    if glow is not None:
        out = 255 - (255 - out) * (1 - glow * np.array([1.0, 0.86, 0.6]) * 0.85)   # screen blend, warm
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB")


def stylize_folder(folder: Path, out_size: tuple[int, int] | None = None) -> int:
    """Finish every f_*.png in a Blender output folder, in place."""
    frames = sorted(Path(folder).glob("f_*.png"))
    if not frames:
        return 0
    w, h = out_size or Image.open(frames[0]).size
    back = sky(w, h, 1.0)
    for f in frames:
        img = Image.open(f)
        if img.size != (w, h):
            img = img.resize((w, h), Image.LANCZOS)
        stylize(img, back).save(f)
    return len(frames)
