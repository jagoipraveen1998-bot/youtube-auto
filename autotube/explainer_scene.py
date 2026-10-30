"""Animated schematic scenes: pictures of the thing being explained.

A section about a lift shows a lift moving in a shaft; a section about a battery
shows ions crossing between electrodes. Each scene draws a still background once
and then paints only the moving parts on a copy of it, so a thirty second shot
costs seconds rather than minutes.

Every builder returns (base_image, paint) where paint(img, draw, t) adds the
moving parts for t between 0 and 1.
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw

from . import explainer_art as art

W, H = art.W, art.H
TOP, BOT = art.AREA_TOP, art.SUBS_TOP
FPS_ART = 12                     # frames actually drawn; ffmpeg smooths these to 30
GOLD, BLUE, GREEN, RED, VIOLET = art.ACCENTS
FRAME = (58, 84, 124)
DIM = (38, 62, 98)


def ease(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def chips(d, items) -> float:
    """A row of captions under the heading. Returns the y the drawing may start at."""
    items = [str(x)[:44] for x in (items or []) if str(x).strip()][:3]
    if not items:
        return TOP
    f = art.font(30, True)
    widths = [d.textlength(s, font=f) + 76 for s in items]
    while sum(widths) + 28 * (len(items) - 1) > W - 300 and len(items) > 1:
        items, widths = items[:-1], widths[:-1]
    x = (W - (sum(widths) + 28 * (len(items) - 1))) / 2
    for i, (s, bw) in enumerate(zip(items, widths)):
        c = art.ACCENTS[i % len(art.ACCENTS)]
        d.rounded_rectangle([x, TOP - 10, x + bw, TOP + 44], 27, fill=(20, 34, 58),
                            outline=c, width=3)
        d.ellipse([x + 24, TOP + 10, x + 38, TOP + 24], fill=c)
        d.text((x + 52, TOP + 17), s, font=f, fill=art.FG, anchor="lm")
        x += bw + 28
    return TOP + 110


def dashes(d, p0, p1, phase, colour, width=5, dash=26, gap=20):
    (x0, y0), (x1, y1) = p0, p1
    length = math.hypot(x1 - x0, y1 - y0) or 1
    ux, uy = (x1 - x0) / length, (y1 - y0) / length
    s = -((phase * (dash + gap)) % (dash + gap))
    while s < length:
        a, b = max(0.0, s), min(length, s + dash)
        if b > a:
            d.line([(x0 + ux * a, y0 + uy * a), (x0 + ux * b, y0 + uy * b)],
                   fill=colour, width=width)
        s += dash + gap


def cog(d, cx, cy, r, teeth, colour, hole=0.30):
    """A real cog with square teeth, not a star."""
    pts = []
    inner, outer = r * 0.80, r
    for i in range(teeth * 2):
        a0, a1 = (i / (teeth * 2)) * math.tau, ((i + 1) / (teeth * 2)) * math.tau
        rad = outer if i % 2 == 0 else inner
        pts += [(cx + rad * math.cos(a0 + 0.012), cy + rad * math.sin(a0 + 0.012)),
                (cx + rad * math.cos(a1 - 0.012), cy + rad * math.sin(a1 - 0.012))]
    d.polygon(pts, fill=colour)
    hr = r * hole
    d.ellipse([cx - hr, cy - hr, cx + hr, cy + hr], fill=art.BG)


# ------------------------------------------------------------------ scenes
def _building(spec):
    """A lift in its shaft: floors, waiting calls, and a car that travels."""
    floors = max(3, min(6, int(spec.get("floors", 5))))
    base = art.canvas()
    d = ImageDraw.Draw(base)
    atop = chips(d, spec.get("labels"))
    y0, y1 = atop + 10, BOT - 30
    fh = (y1 - y0) / floors
    x0, x1 = 480, 1480
    d.rounded_rectangle([x0 - 18, y0 - 18, x1 + 18, y1 + 18], 18, fill=(20, 34, 58),
                        outline=FRAME, width=4)
    sx0, sx1 = x0 + 30, x0 + 300                      # the shaft
    d.rectangle([sx0, y0, sx1, y1], fill=(10, 18, 31), outline=FRAME, width=3)
    nf = art.font(32, True)
    for i in range(floors):
        fy = y1 - (i + 1) * fh
        d.line([(x0, fy), (x1, fy)], fill=FRAME, width=3)
        d.text((x0 - 46, fy + fh / 2), str(i + 1), font=nf, fill=art.MUTED, anchor="mm")
        wx0, wx1, cols, wgap = sx1 + 70, x1 - 50, 6, 28   # windows, so it reads as a building
        ww = (wx1 - wx0 - wgap * (cols - 1)) / cols
        for c in range(cols):
            wxx = wx0 + c * (ww + wgap)
            d.rounded_rectangle([wxx, fy + fh * 0.26, wxx + ww, fy + fh * 0.74], 7,
                                fill=(46, 72, 110))
    stops = [int(s) for s in (spec.get("stops") or [1, floors, 3]) if 1 <= int(s) <= floors]
    stops = stops or [1, floors]
    for s in stops:                                   # the call buttons
        by = y1 - (s - 0.5) * fh
        d.ellipse([sx1 + 18, by - 13, sx1 + 44, by + 13], fill=(46, 70, 106))

    def paint(img, dd, t):
        u = t * max(1, len(stops) - 1)
        i = min(max(0, len(stops) - 2), int(u))
        f = ease(u - i) if len(stops) > 1 else 0.0
        a, b = stops[i], stops[min(i + 1, len(stops) - 1)]
        pos = a + (b - a) * f
        cy = y1 - (pos - 0.5) * fh
        ch = fh * 0.40
        dd.line([((sx0 + sx1) / 2, y0), ((sx0 + sx1) / 2, cy - ch)], fill=(96, 128, 174), width=5)
        dd.rounded_rectangle([sx0 + 18, cy - ch, sx1 - 18, cy + ch], 10, fill=GOLD,
                             outline=(255, 236, 184), width=4)
        dd.line([((sx0 + sx1) / 2, cy - ch + 10), ((sx0 + sx1) / 2, cy + ch - 10)],
                fill=(188, 139, 20), width=4)          # the two doors
        for s in stops:
            by = y1 - (s - 0.5) * fh
            if abs(pos - s) < 0.3:
                dd.ellipse([sx1 + 18, by - 13, sx1 + 44, by + 13], fill=GREEN)
    return base, paint


def _orbit(spec):
    """Satellites going round, each beaming a signal down to one receiver."""
    n = max(2, min(5, int(spec.get("bodies", 4))))
    base = art.canvas()
    d = ImageDraw.Draw(base)
    atop = chips(d, spec.get("labels"))
    cx, cy, r = W / 2, (atop + BOT) / 2 + 10, 150
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(26, 62, 98), outline=BLUE, width=5)
    for k in range(3):
        rr = r * (0.38 + 0.26 * k)
        d.arc([cx - rr, cy - rr * 0.7, cx + rr, cy + rr * 0.7], 195, 345, fill=(44, 92, 140), width=4)
    rings = [(360 + k * 72, 168 + k * 34) for k in range(n)]
    for rx, ry in rings:
        d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], outline=(50, 74, 112), width=3)
    ga = -0.62                                         # the receiver, on the horizon
    gx, gy = cx + r * math.cos(ga), cy + r * math.sin(ga)
    d.polygon([(gx, gy - 46), (gx - 26, gy - 2), (gx + 26, gy - 2)], fill=art.FG)
    d.rounded_rectangle([gx - 9, gy - 6, gx + 9, gy + 20], 4, fill=art.FG)
    d.text((gx + 54, gy), "you", font=art.font(32, True), fill=art.FG, anchor="lm")

    def paint(img, dd, t):
        for k in range(n):
            rx, ry = rings[k]
            a = t * math.tau * (1.0 - 0.1 * k) + k * 2.1
            sx, sy = cx + rx * math.cos(a), cy + ry * math.sin(a)
            col = art.ACCENTS[k % len(art.ACCENTS)]
            dashes(dd, (sx, sy), (gx, gy), t * 7 + k, (78, 112, 158), 4, 20, 16)
            dd.line([(sx - 62, sy - 26), (sx + 62, sy - 26)], fill=(120, 158, 206), width=7)
            dd.rounded_rectangle([sx - 34, sy - 18, sx + 34, sy + 18], 7, fill=col)
    return base, paint


def _wave(spec):
    """Waves: one travelling, two cancelling, or one carrying a signal."""
    mode = str(spec.get("mode", "travel")).lower()
    rows = {"cancel": 3, "modulate": 2}.get(mode, 1)
    base = art.canvas()
    d = ImageDraw.Draw(base)
    atop = chips(d, spec.get("labels"))
    names = list(spec.get("rows") or [])
    x0, x1 = 470, W - 200
    amp = min(120, (BOT - atop) / (rows * 2.6)) if rows > 1 else 120
    lo, hi = atop + amp + 20, BOT - amp - 20          # every wave stays clear of the subtitles
    ys = [lo + (hi - lo) * i / (rows - 1) for i in range(rows)] if rows > 1 \
        else [(atop + BOT) / 2]
    rf = art.font(32, True)
    for i, y in enumerate(ys):
        d.line([(x0, y), (x1, y)], fill=(48, 72, 108), width=3)
        if i < len(names):
            d.text((x0 - 36, y), str(names[i])[:18], font=rf,
                   fill=art.ACCENTS[i % len(art.ACCENTS)], anchor="rm")

    def wave(dd, y, amp, phase, colour, width=6, freq=3.0):
        pts = []
        for px in range(x0, x1, 8):
            u = (px - x0) / (x1 - x0)
            pts.append((px, y - amp * math.sin((u * freq - phase) * math.tau)))
        dd.line(pts, fill=colour, width=width, joint="curve")

    def paint(img, dd, t):
        p = t * 2.0
        if mode == "cancel":
            wave(dd, ys[0], amp, p, BLUE)
            wave(dd, ys[1], amp, p + 0.5, RED)
            wave(dd, ys[2], amp * (1 - ease((t - 0.4) / 0.35)), p, GREEN)
        elif mode == "modulate":
            wave(dd, ys[0], amp, p, BLUE, 6, 1.2)
            pts = []
            for px in range(x0, x1, 6):
                u = (px - x0) / (x1 - x0)
                env = amp * (0.25 + 0.65 * (0.5 + 0.5 * math.sin((u * 1.2 - p) * math.tau)))
                pts.append((px, ys[1] - env * math.sin((u * 14 - p * 3) * math.tau)))
            dd.line(pts, fill=GOLD, width=5, joint="curve")
        else:
            wave(dd, ys[0], amp, p, GOLD, 7, 2.2)
    return base, paint


def _layers(spec):
    """A cross-section: the stack the thing is actually built from."""
    items = [str(x)[:40] for x in (spec.get("items") or [])][:6] or ["Layer"]
    base = art.canvas()
    d = ImageDraw.Draw(base)
    atop = chips(d, spec.get("labels"))
    n = len(items)
    x0, x1 = 300, 1230
    gap = 14
    bh = min(100, (BOT - atop - 50 - gap * (n - 1)) / n)
    y = (atop + BOT) / 2 - (n * bh + (n - 1) * gap) / 2
    f = art.font(38, True)
    bands = []
    for i, label in enumerate(items):
        c = art.ACCENTS[i % len(art.ACCENTS)]
        top = y + i * (bh + gap)
        tint = tuple(int(a + (b - a) * 0.22) for a, b in zip(art.BG2, c))
        d.rounded_rectangle([x0, top, x1, top + bh], 10, fill=tint, outline=c, width=4)
        d.text((x1 + 44, top + bh / 2), label, font=f, fill=art.FG, anchor="lm")
        bands.append(top)
    lo, hi = bands[0], bands[-1] + bh

    def paint(img, dd, t):
        sy = lo + (hi - lo) * ((t * 1.3) % 1.0)
        dd.line([(x0 - 34, sy), (x1 + 24, sy)], fill=(210, 230, 255), width=3)
        dd.polygon([(x0 - 54, sy), (x0 - 28, sy - 14), (x0 - 28, sy + 14)], fill=art.FG)
    return base, paint


def _particles(spec):
    """Charge crossing between two electrodes: the heart of a cell or a battery."""
    left = str(spec.get("left", "Anode"))[:24]
    right = str(spec.get("right", "Cathode"))[:24]
    base = art.canvas()
    d = ImageDraw.Draw(base)
    atop = chips(d, spec.get("labels"))
    mid = (atop + BOT) / 2 + 30
    y0, y1 = mid - 150, mid + 150
    lx, rx = 500, 1420
    d.rounded_rectangle([lx, y0, rx, y1], 10, fill=(16, 28, 48), outline=FRAME, width=4)
    d.rounded_rectangle([lx - 74, y0, lx, y1], 10, fill=BLUE)
    d.rounded_rectangle([rx, y0, rx + 74, y1], 10, fill=RED)
    f = art.font(38, True)
    d.text((lx - 37, y1 + 48), left, font=f, fill=BLUE, anchor="mm")
    d.text((rx + 37, y1 + 48), right, font=f, fill=RED, anchor="mm")
    d.text(((lx + rx) / 2, y0 - 104), "the circuit outside", font=art.font(30, True),
           fill=art.MUTED, anchor="mm")
    seeds = [(i * 0.137 % 1.0, y0 + 32 + (i * 83 % int(y1 - y0 - 64))) for i in range(26)]

    def paint(img, dd, t):
        for u0, py in seeds:
            u = (u0 + t * 0.9) % 1.0
            px = lx + 24 + u * (rx - lx - 48)
            dd.ellipse([px - 9, py - 9, px + 9, py + 9], fill=GREEN)
        ty = y0 - 74
        dashes(dd, (lx - 37, y0 - 6), (lx - 37, ty), t * 5, GOLD, 5)
        dashes(dd, (lx - 37, ty), (rx + 37, ty), t * 5, GOLD, 5)
        dashes(dd, (rx + 37, ty), (rx + 37, y0 - 6), t * 5, GOLD, 5)
    return base, paint


def _rotor(spec):
    """Something that spins: a motor, a turbine, a gearbox."""
    teeth = max(7, min(14, int(spec.get("teeth", 11))))
    base = art.canvas()
    d = ImageDraw.Draw(base)
    atop = chips(d, spec.get("labels"))
    cx, cy = W / 2, (atop + BOT) / 2
    r = min(230, (BOT - atop) / 2 - 90)
    for k in range(4):                                 # the coils around it
        a = k * math.tau / 4 + math.pi / 4
        px, py = cx + (r + 112) * math.cos(a), cy + (r + 112) * math.sin(a)
        d.ellipse([px - 58, py - 58, px + 58, py + 58], outline=BLUE, width=9)
    d.ellipse([cx - r - 34, cy - r - 34, cx + r + 34, cy + r + 34], outline=FRAME, width=4)

    def paint(img, dd, t):
        a0 = t * math.tau / teeth * 2
        cog(dd, cx, cy, r, teeth, GOLD, 0.26)
        for k in range(3):                             # spokes, so the spin shows
            a = a0 + k * math.tau / 3
            dd.line([(cx + r * 0.28 * math.cos(a), cy + r * 0.28 * math.sin(a)),
                     (cx + r * 0.74 * math.cos(a), cy + r * 0.74 * math.sin(a))],
                    fill=art.BG, width=22)
        dd.ellipse([cx - r * 0.26, cy - r * 0.26, cx + r * 0.26, cy + r * 0.26], fill=art.BG)
        dd.ellipse([cx - 26, cy - 26, cx + 26, cy + 26], fill=GOLD)
    return base, paint


def _network(spec):
    """One request spreading out to many machines and back."""
    base = art.canvas()
    d = ImageDraw.Draw(base)
    atop = chips(d, spec.get("labels"))
    cx = W / 2
    root_y = atop + 50
    gapy = (BOT - 60 - root_y) / 2
    mid_y, leaf_y = root_y + gapy, root_y + gapy * 2
    mid = [(cx - 540 + i * 270, mid_y) for i in range(5)]
    leaf = [(mx + k * 84, leaf_y) for mx, _ in mid for k in (-1, 1)]
    for mx, my in mid:
        d.line([(cx, root_y), (mx, my)], fill=(46, 70, 106), width=4)
    for i, (lx, ly) in enumerate(leaf):
        mx, my = mid[i // 2]
        d.line([(mx, my), (lx, ly)], fill=(46, 70, 106), width=3)
        d.ellipse([lx - 15, ly - 15, lx + 15, ly + 15], fill=(54, 84, 124))
    for mx, my in mid:
        d.ellipse([mx - 24, my - 24, mx + 24, my + 24], fill=(70, 106, 152))
    d.ellipse([cx - 36, root_y - 36, cx + 36, root_y + 36], fill=GOLD)

    def paint(img, dd, t):
        for i, (mx, my) in enumerate(mid):
            u = ((t * 1.5) + i * 0.07) % 1.0
            px, py = cx + (mx - cx) * u, root_y + (my - root_y) * u
            dd.ellipse([px - 10, py - 10, px + 10, py + 10], fill=GREEN)
            if u > 0.8:
                dd.ellipse([mx - 30, my - 30, mx + 30, my + 30], outline=GREEN, width=4)
        for i, (lx, ly) in enumerate(leaf):
            mx, my = mid[i // 2]
            u = ((t * 1.5) + i * 0.05 + 0.4) % 1.0
            px, py = mx + (lx - mx) * u, my + (ly - my) * u
            dd.ellipse([px - 7, py - 7, px + 7, py + 7], fill=GREEN)
    return base, paint


def _beam(spec):
    """Light bouncing along inside something: a fibre, a pipe, a cavity."""
    base = art.canvas()
    d = ImageDraw.Draw(base)
    atop = chips(d, spec.get("labels"))
    x0, x1 = 280, W - 220
    cy = (atop + BOT) / 2
    half = min(140, (BOT - atop) / 2 - 110)
    d.rounded_rectangle([x0, cy - half - 52, x1, cy + half + 52], 44, fill=(20, 34, 58),
                        outline=FRAME, width=4)
    d.rounded_rectangle([x0, cy - half, x1, cy + half], 26, fill=(14, 26, 46),
                        outline=BLUE, width=5)
    d.text((x1, cy + half + 100), "cladding", font=art.font(30, True),
           fill=art.MUTED, anchor="rm")
    d.text((x0, cy + half + 100), "core", font=art.font(30, True), fill=BLUE, anchor="lm")
    bounces = 6
    span = (x1 - x0) / bounces
    path = [(x0, cy)]
    for i in range(bounces):
        path.append((x0 + (i + 1) * span, cy + (half - 18) * (1 if i % 2 == 0 else -1)))
    for i in range(bounces):
        d.line([path[i], path[i + 1]], fill=(92, 78, 34), width=4)

    def paint(img, dd, t):
        for k in range(3):
            u = ((t * 1.1) + k * 0.33) % 1.0
            s = u * bounces
            i = min(bounces - 1, int(s))
            f = s - i
            (ax, ay), (bx, by) = path[i], path[i + 1]
            px, py = ax + (bx - ax) * f, ay + (by - ay) * f
            tail = max(0.0, f - 0.3)
            dd.line([(ax + (bx - ax) * tail, ay + (by - ay) * tail), (px, py)],
                    fill=GOLD, width=7)
            dd.ellipse([px - 13, py - 13, px + 13, py + 13], fill=art.FG)
    return base, paint


def _grid_scan(spec):
    """A pattern of dots thrown onto a surface and read back as depth."""
    base = art.canvas()
    d = ImageDraw.Draw(base)
    atop = chips(d, spec.get("labels"))
    cy = (atop + BOT) / 2
    cx = W / 2 + 130
    rx, ry = 300, min(290, (BOT - atop) / 2 - 20)
    d.rounded_rectangle([cx - rx, cy - ry, cx + rx, cy + ry], 150, fill=(22, 38, 64),
                        outline=FRAME, width=4)
    px0, py0 = 420, cy - 40
    d.rounded_rectangle([px0 - 70, py0 - 70, px0 + 70, py0 + 70], 18, fill=(30, 50, 82),
                        outline=VIOLET, width=4)
    d.ellipse([px0 - 28, py0 - 28, px0 + 28, py0 + 28], outline=VIOLET, width=5)
    d.text((px0, py0 + 112), "dot projector", font=art.font(30, True),
           fill=art.MUTED, anchor="mm")
    pts = []
    for ix in range(-7, 8):
        for iy in range(-7, 8):
            x, y = cx + ix * 38, cy + iy * 38
            if (x - cx) ** 2 / (rx - 20) ** 2 + (y - cy) ** 2 / (ry - 20) ** 2 <= 1:
                bulge = math.exp(-((ix * ix + iy * iy) / 30.0))
                pts.append((x + ix * 7 * bulge, y + iy * 7 * bulge, bulge))
    for k in (-1, 1):
        d.line([(px0 + 60, py0), (cx, cy + k * ry * 0.88)], fill=(60, 48, 96), width=3)

    def paint(img, dd, t):
        sweep = cy - ry + ((t * 1.3) % 1.0) * ry * 2
        for x, y, b in pts:
            lit = abs(y - sweep) < 120
            r = 4 + 6 * b
            dd.ellipse([x - r, y - r, x + r, y + r], fill=GOLD if lit else (72, 104, 148))
        dd.line([(cx - rx + 10, sweep), (cx + rx - 10, sweep)], fill=(130, 180, 240), width=3)
    return base, paint


def _thermal(spec):
    """Racks of machines making heat, and the air that carries it away."""
    base = art.canvas()
    d = ImageDraw.Draw(base)
    atop = chips(d, spec.get("labels"))
    n = 5
    bw, gap = 150, 70
    total = n * bw + (n - 1) * gap
    x = (W - total) / 2
    y1 = BOT - 70
    y0 = max(atop + 170, y1 - 330)
    for i in range(n):
        bx = x + i * (bw + gap)
        d.rounded_rectangle([bx, y0, bx + bw, y1], 12, fill=(26, 44, 72), outline=(66, 96, 138), width=4)
        k, sy = 0, y0 + 20
        while sy + 30 < y1 - 10:
            d.rounded_rectangle([bx + 16, sy, bx + bw - 16, sy + 30], 5, fill=DIM)
            sy += 44
    d.text((W / 2, y1 + 44), "cold air in at the bottom, hot air out at the top",
           font=art.font(30, True), fill=art.MUTED, anchor="mm")

    def paint(img, dd, t):
        for i in range(n):
            bx = x + i * (bw + gap) + bw / 2
            for k in range(3):
                u = ((t * 1.2) + k * 0.33 + i * 0.11) % 1.0
                ay = y0 - 24 - u * (y0 - atop - 40)
                wob = 16 * math.sin((u * 3 + i) * math.tau)
                col = (255, int(150 + 80 * (1 - u)), 90)
                dd.line([(bx + wob, ay), (bx + wob, ay + 44)], fill=col, width=7)
                dd.polygon([(bx + wob, ay - 18), (bx + wob - 14, ay + 2),
                            (bx + wob + 14, ay + 2)], fill=col)
            dd.rounded_rectangle([bx - 36, y1 - 26, bx + 36, y1 - 6], 6, fill=BLUE)
    return base, paint


def _pipeline(spec):
    """Stages with something actually travelling through them."""
    items = [str(x)[:30] for x in (spec.get("items") or [])][:5] or ["In", "Out"]
    base = art.canvas()
    d = ImageDraw.Draw(base)
    atop = chips(d, spec.get("labels"))
    n = len(items)
    gap = 90 if n <= 3 else 60
    bw = min({1: 640, 2: 500, 3: 420, 4: 350}.get(n, 300),
             int((W - 320 - gap * (n - 1)) / n))
    bh = min(240, BOT - atop - 80)
    total = bw * n + gap * (n - 1)
    x = (W - total) / 2
    y = (atop + BOT) / 2 - bh / 2
    boxes = []
    for i, label in enumerate(items):
        bx = x + i * (bw + gap)
        art._chip(d, [bx, y, bx + bw, y + bh], label, art.ACCENTS[i % len(art.ACCENTS)],
                  44 if n <= 3 else 34)
        boxes.append((bx, bx + bw))
        if i + 1 < n:
            d.line([(bx + bw + 10, y + bh / 2), (bx + bw + gap - 14, y + bh / 2)],
                   fill=FRAME, width=6)

    def paint(img, dd, t):
        u = t * (n - 1) if n > 1 else t
        i = min(max(0, n - 2), int(u))
        f = ease(u - i) if n > 1 else t
        ax = boxes[i][1]
        bx = boxes[min(i + 1, n - 1)][0]
        px = ax + (bx - ax) * f if n > 1 else boxes[0][0] + (boxes[0][1] - boxes[0][0]) * t
        dd.ellipse([px - 16, y + bh / 2 - 16, px + 16, y + bh / 2 + 16], fill=GREEN)
        lit = int(round(u))
        if 0 <= lit < n:
            dd.rounded_rectangle([boxes[lit][0] - 8, y - 8, boxes[lit][1] + 8, y + bh + 8],
                                 28, outline=GREEN, width=5)
    return base, paint


SCENES = {
    "building": _building, "orbit": _orbit, "wave": _wave, "layers": _layers,
    "particles": _particles, "rotor": _rotor, "network": _network, "beam": _beam,
    "grid_scan": _grid_scan, "thermal": _thermal, "pipeline": _pipeline,
}


def is_scene(kind) -> bool:
    return str(kind).lower() in SCENES


# ------------------------------------------------------------------ rendering
def _scene_frames(visual: dict, seconds: float, out_dir: Path, name: str) -> int:
    base, paint = SCENES[str(visual["type"]).lower()](visual)
    head = str(visual.get("heading", "")).strip()
    if head:
        art.heading(base, head)
    total = max(2, int(round(seconds * FPS_ART)))
    for k in range(total):
        img = base.copy()
        paint(img, ImageDraw.Draw(img), k / (total - 1))
        img.save(out_dir / f"{name}_{k:05d}.jpg", quality=93)
    return total


def _step_frames(visual: dict, seconds: float, out_dir: Path, name: str) -> int:
    """The text visuals, with each new element easing in instead of popping."""
    steps = [Image.open(p).convert("RGB")
             for p in art.frames_for(visual, out_dir / "steps", name)]
    n = len(steps)
    first = seconds * 0.34 if n > 1 else seconds
    rest = (seconds - first) / max(1, n - 1) if n > 1 else 0.0
    starts = [0.0] + [first + (i - 1) * rest for i in range(1, n)]
    total = max(2, int(round(seconds * FPS_ART)))
    for k in range(total):
        tt = seconds * k / (total - 1)
        idx = max(i for i, s in enumerate(starts) if tt >= s)
        if idx == 0:
            img = steps[0]
        else:
            img = Image.blend(steps[idx - 1], steps[idx],
                              ease(min(1.0, (tt - starts[idx]) / 0.40)))
        img.save(out_dir / f"{name}_{k:05d}.jpg", quality=93)
    return total


def animate(visual: dict, seconds: float, out_dir: Path, name: str) -> tuple[str, int]:
    """Write one section's frame sequence. Returns (ffmpeg pattern, frame count)."""
    out_dir.mkdir(parents=True, exist_ok=True)
    kind = str(visual.get("type", "points")).lower()
    count = (_scene_frames if is_scene(kind) else _step_frames)(visual, seconds, out_dir, name)
    return str(out_dir / f"{name}_%05d.jpg"), count
