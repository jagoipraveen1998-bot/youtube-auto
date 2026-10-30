"""Draw the pictures for an explainer video: flows, bars, comparisons, big numbers.

Everything is drawn with Pillow, so it renders in seconds instead of minutes and
can be checked on any machine without Blender.

Each visual returns a list of frames (a progressive reveal), so a diagram builds
up piece by piece while the narrator talks instead of appearing all at once.
"""
import math
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1080
BG = (14, 25, 43)
BG2 = (22, 38, 64)
FG = (238, 244, 255)
MUTED = (131, 152, 184)
ACCENTS = [(255, 196, 61), (79, 195, 247), (126, 231, 160), (255, 138, 128), (186, 141, 255)]
SUBS_TOP = 870          # the subtitles live below this line, so no diagram may reach it
AREA_TOP = 260          # the heading sits above this line
_FONTS: dict = {}


# ---------------------------------------------------------------- type
def _font_file(bold: bool) -> str:
    key = f"file{bold}"
    if key in _FONTS:
        return _FONTS[key]
    wanted = ["Roboto", "Inter", "Noto Sans", "DejaVu Sans"]
    found = ""
    if shutil.which("fc-match"):
        for family in wanted:
            out = subprocess.run(["fc-match", "-f", "%{file}|%{family}", family + (":bold" if bold else "")],
                                 capture_output=True, text=True).stdout
            path, _, fam = out.partition("|")
            if path and family.split()[-1].lower() in fam.lower():
                found = path
                break
    if not found:
        found = ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
                 else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    _FONTS[key] = found
    return found


def font(size: int, bold: bool = True):
    key = (size, bold)
    if key not in _FONTS:
        try:
            _FONTS[key] = ImageFont.truetype(_font_file(bold), size)
        except Exception:
            _FONTS[key] = ImageFont.load_default()
    return _FONTS[key]


def wrap(draw, text: str, f, width: int) -> list[str]:
    words, lines, cur = text.split(), [], ""
    for word in words:
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=f) <= width or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def fit_font(draw, text: str, start: int, width: int, bold: bool = True, floor: int = 28):
    size = start
    while size > floor:
        f = font(size, bold)
        if draw.textlength(text, font=f) <= width:
            return f
        size -= 4
    return font(floor, bold)


# ---------------------------------------------------------------- canvas
def canvas() -> Image.Image:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    for y in range(H):  # a soft vertical lift, so it is not flat black
        k = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * (1 - k) * 0.55)
                                            for a, b in zip(BG, BG2)))
    return img


def heading(img: Image.Image, text: str) -> None:
    d = ImageDraw.Draw(img)
    f = fit_font(d, text, 72, W - 320, True, 40)
    d.text((160, 110), text, font=f, fill=FG)
    d.rounded_rectangle([160, 210, 160 + 120, 218], 4, fill=ACCENTS[0])


def _chip(d, box, label, colour, text_size=36, fill_alpha=True):
    x0, y0, x1, y1 = box
    d.rounded_rectangle(box, 24, fill=BG2, outline=colour, width=5)
    f = font(text_size, True)
    lines = wrap(d, label, f, (x1 - x0) - 48)
    total = len(lines) * (text_size + 10)
    y = (y0 + y1) / 2 - total / 2 + 4
    for line in lines:
        d.text(((x0 + x1) / 2, y + text_size / 2), line, font=f, fill=FG, anchor="mm")
        y += text_size + 10


# ---------------------------------------------------------------- visuals
def flow(items: list[str], step: int) -> Image.Image:
    """Boxes left to right with arrows between them: a process."""
    img = canvas()
    d = ImageDraw.Draw(img)
    n = max(1, len(items))
    gap = 90 if n <= 3 else 60
    cap = {1: 700, 2: 540, 3: 450, 4: 380}.get(n, 340)   # fewer boxes, bigger boxes
    bw = min(cap, int((W - 320 - gap * (n - 1)) / n))
    bh = max(250, 380 - 24 * n)
    size = 52 if n <= 2 else (44 if n == 3 else 36)
    total = bw * n + gap * (n - 1)
    x = (W - total) / 2
    y = AREA_TOP + (SUBS_TOP - AREA_TOP - bh) / 2
    for i, label in enumerate(items):
        if i >= step:
            break
        bx = x + i * (bw + gap)
        _chip(d, [bx, y, bx + bw, y + bh], label, ACCENTS[i % len(ACCENTS)], size)
        if i + 1 < min(step, n):
            ax = bx + bw + 12
            ay = y + bh / 2
            d.line([(ax, ay), (ax + gap - 24, ay)], fill=MUTED, width=6)
            d.polygon([(ax + gap - 24, ay), (ax + gap - 44, ay - 14), (ax + gap - 44, ay + 14)], fill=MUTED)
    return img


def bars(pairs: list[tuple[str, float]], step: int, unit: str = "") -> Image.Image:
    """A labelled bar chart, grown one bar at a time."""
    img = canvas()
    d = ImageDraw.Draw(img)
    if not pairs:
        return img
    top = max(v for _, v in pairs) or 1.0
    n = len(pairs)
    bw = min(280, int((W - 400) / n) - 50)
    gap = 110
    total = bw * n + gap * (n - 1)
    x = (W - total) / 2
    base = SUBS_TOP - 110      # leave room for the labels under the axis
    high = 400
    for i, (label, value) in enumerate(pairs):
        if i >= step:
            break
        bx = x + i * (bw + gap)
        bh = max(8, int(high * (value / top)))
        colour = ACCENTS[i % len(ACCENTS)]
        d.rounded_rectangle([bx, base - bh, bx + bw, base], 14, fill=colour)
        value_text = f"{value:g}{unit}"
        d.text((bx + bw / 2, base - bh - 34), value_text, font=font(40, True), fill=FG, anchor="mm")
        f = font(30, False)
        for j, line in enumerate(wrap(d, label, f, bw + gap - 10)[:2]):
            d.text((bx + bw / 2, base + 34 + j * 36), line, font=f, fill=MUTED, anchor="mm")
    d.line([(x - 40, base), (x + total + 40, base)], fill=MUTED, width=4)
    return img


def points(items: list[str], step: int) -> Image.Image:
    """A numbered list that appears one line at a time."""
    img = canvas()
    d = ImageDraw.Draw(img)
    shown = min(len(items), 5)
    gap = 140 if shown >= 4 else (170 if shown == 3 else 210)   # fewer points, more air
    y = AREA_TOP + (SUBS_TOP - AREA_TOP - ((shown - 1) * gap + 64)) / 2
    for i, text in enumerate(items[:5]):
        if i >= step:
            break
        colour = ACCENTS[i % len(ACCENTS)]
        d.ellipse([200, y, 200 + 64, y + 64], fill=colour)
        d.text((232, y + 32), str(i + 1), font=font(36, True), fill=BG, anchor="mm")
        f = fit_font(d, text, 54 if shown <= 3 else 48, W - 560, False, 30)
        d.text((300, y + 32), text, font=f, fill=FG, anchor="lm")
        y += gap
    return img


def compare(left_title: str, left: list[str], right_title: str, right: list[str], step: int) -> Image.Image:
    """Two columns side by side."""
    img = canvas()
    d = ImageDraw.Draw(img)
    mid = W / 2
    rf = font(34, False)
    sides = ((left_title, left, ACCENTS[1]), (right_title, right, ACCENTS[3]))
    boxes = [(150, mid - 40), (mid + 40, W - 150)]
    # measure both columns first, so the panels are only as tall as their contents
    wrapped = []
    for (title, rows, _), (x0, x1) in zip(sides, boxes):
        groups = [wrap(d, "• " + row, rf, (x1 - x0) - 80)[:2] for row in rows[:4]]
        wrapped.append(groups)
    body = max((sum(len(g) * 44 + 26 for g in groups) for groups in wrapped), default=0)
    top = max(290, AREA_TOP + (SUBS_TOP - AREA_TOP - (150 + body + 40)) / 2)
    bottom = min(SUBS_TOP - 10, top + 150 + body + 40)
    for side, ((title, rows, colour), (x0, x1)) in enumerate(zip(sides, boxes)):
        d.rounded_rectangle([x0, top, x1, bottom], 28, fill=BG2, outline=colour, width=4)
        f = fit_font(d, title, 52, (x1 - x0) - 60, True, 32)
        d.text(((x0 + x1) / 2, top + 60), title, font=f, fill=colour, anchor="mm")
        if side >= step:   # left column first, then the right one
            continue
        y = top + 150
        for group in wrapped[side]:
            for line in group:
                d.text((x0 + 40, y), line, font=rf, fill=FG)
                y += 44
            y += 26
    return img


def number(value: str, caption: str, step: int) -> Image.Image:
    """One big figure, for a statistic worth pausing on."""
    img = canvas()
    d = ImageDraw.Draw(img)
    max_lines = 1 if len(value.split()) <= 3 else 2   # a figure fits on one line, a phrase on two
    avail = SUBS_TOP - AREA_TOP - (90 if caption else 20)
    size, lines = 300, [value]
    while size > 70:
        f = font(size, True)
        lines = wrap(d, value, f, W - 360)
        if len(lines) <= max_lines and len(lines) * size * 1.15 <= avail:
            break
        size -= 12
    f = font(size, True)
    y = (AREA_TOP + SUBS_TOP) / 2 - (len(lines) - 1) * size * 0.6 - (60 if caption else 0)
    for line in lines:
        d.text((W / 2, y), line, font=f, fill=ACCENTS[0], anchor="mm")
        y += size * 1.15
    if step > 1 and caption:
        cf = fit_font(d, caption, 54, W - 500, False, 30)
        for i, line in enumerate(wrap(d, caption, cf, W - 500)[:2]):
            d.text((W / 2, H / 2 + 130 + i * 62), line, font=cf, fill=MUTED, anchor="mm")
    return img


def title_card(title: str, channel: str) -> Image.Image:
    img = canvas()
    d = ImageDraw.Draw(img)
    glow = Image.new("RGB", (W, H), BG)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W / 2 - 560, H / 2 - 360, W / 2 + 560, H / 2 + 360], fill=BG2)
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(90)), 0.75)
    d = ImageDraw.Draw(img)
    f = fit_font(d, title, 110, W - 360, True, 54)
    lines = wrap(d, title, f, W - 360)[:3]
    y = H / 2 - len(lines) * 70 / 2 - 30
    for line in lines:
        d.text((W / 2, y), line, font=f, fill=FG, anchor="mm")
        y += f.size + 24
    d.text((W / 2, H - 150), channel.upper(), font=font(38, True), fill=ACCENTS[0], anchor="mm")
    d.rounded_rectangle([W / 2 - 70, H - 108, W / 2 + 70, H - 102], 3, fill=ACCENTS[0])
    return img


def thumb_card(text: str, channel: str) -> Image.Image:
    """A thumbnail built to be read at the size of a thumb: a few huge words."""
    img = canvas()
    glow = Image.new("RGB", (W, H), BG)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-200, H / 2 - 420, W * 0.62, H / 2 + 420], fill=(34, 58, 96))
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(120)), 0.8)
    d = ImageDraw.Draw(img)
    words = (text or channel).strip().upper()
    size, lines = 190, []
    while size > 80:                        # as big as it can be in at most three lines
        f = font(size, True)
        lines = wrap(d, words, f, W - 260)
        if len(lines) <= 3:
            break
        size -= 10
    f = font(size, True)
    gap = int(size * 1.08)
    y = H / 2 - (len(lines) * gap) / 2 - 20
    for i, line in enumerate(lines):
        # the last line in yellow, so the eye lands somewhere at thumbnail size
        colour = ACCENTS[0] if (len(lines) > 1 and i == len(lines) - 1) else FG
        d.text((132, y + 6), line, font=f, fill=(0, 0, 0))      # a hard shadow, for contrast
        d.text((126, y), line, font=f, fill=colour)
        y += gap
    d.rounded_rectangle([126, y + 18, 126 + 220, y + 32], 7, fill=ACCENTS[0])
    d.text((126, H - 72), channel.upper(), font=font(42, True), fill=ACCENTS[0], anchor="ls")
    return img


# ---------------------------------------------------------------- one visual -> frames
def frames_for(visual: dict, out_dir: Path, name: str) -> list[Path]:
    """Render the reveal steps for one visual. Returns the frame files in order."""
    out_dir.mkdir(parents=True, exist_ok=True)
    kind = str(visual.get("type", "points")).lower()
    head = str(visual.get("heading", "")).strip()
    made = []
    if kind == "flow":
        items = [str(x) for x in visual.get("items", [])][:5]
        steps = range(1, max(1, len(items)) + 1)
        maker = lambda s: flow(items, s)
    elif kind == "bars":
        pairs = []
        for row in visual.get("items", [])[:5]:
            if isinstance(row, dict):
                pairs.append((str(row.get("label", "")), float(row.get("value", 0) or 0)))
        steps = range(1, max(1, len(pairs)) + 1)
        maker = lambda s: bars(pairs, s, str(visual.get("unit", "")))
    elif kind == "compare":
        lt, rt = str(visual.get("left_title", "")), str(visual.get("right_title", ""))
        lr = [str(x) for x in visual.get("left", [])][:4]
        rr = [str(x) for x in visual.get("right", [])][:4]
        steps = range(1, 3)
        maker = lambda s: compare(lt, lr, rt, rr, s)
    elif kind == "number":
        steps = range(1, 3)
        maker = lambda s: number(str(visual.get("value", "")), str(visual.get("caption", "")), s)
    else:
        items = [str(x) for x in visual.get("items", [])][:5]
        steps = range(1, max(1, len(items)) + 1)
        maker = lambda s: points(items, s)
    for s in steps:
        img = maker(s)
        if head:
            heading(img, head)
        path = out_dir / f"{name}_{s:02d}.png"
        img.save(path)
        made.append(path)
    return made
