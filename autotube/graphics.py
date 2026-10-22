"""Step 4b: on-screen graphics - title cards, headline banner, thumbnail."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

from .util import W, H, font_path

ACCENT = (220, 38, 38)        # news red
DARK = (12, 18, 32)
NAVY = (22, 38, 74)
WHITE = (255, 255, 255)
GOLD = (250, 204, 21)


def _font(size: int, lang: str, bold: bool = True) -> ImageFont.FreeTypeFont:
    path = font_path(lang, bold)
    return ImageFont.truetype(path, size) if path else ImageFont.load_default(size)


def _wrap(draw, text: str, font, max_width: int) -> list[str]:
    lines, line = [], ""
    for word in text.split():
        test = f"{line} {word}".strip()
        if draw.textlength(test, font=font) <= max_width or not line:
            line = test
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def _fit(draw, text, lang, max_width, max_lines, start, minimum=40):
    """Largest font size where `text` fits in max_lines lines."""
    size = start
    while size > minimum:
        font = _font(size, lang)
        lines = _wrap(draw, text, font, max_width)
        if len(lines) <= max_lines:
            return font, lines
        size -= 6
    font = _font(minimum, lang)
    return font, _wrap(draw, text, font, max_width)[:max_lines]


def _gradient(w: int, h: int) -> Image.Image:
    top, bottom = NAVY, DARK
    img = Image.new("RGB", (w, h))
    px = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        px.line([(0, y), (w, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(top, bottom)))
    return img


def title_card(out: Path, big: str, small: str, channel: str, lang: str,
               show_tag: bool = True) -> Path:
    """Full-screen card used for intro, outro and stories without footage."""
    img = _gradient(W, H)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 14], fill=ACCENT)
    if show_tag:
        tag = _font(44, "en")
        d.rectangle([120, 150, 120 + d.textlength(channel.upper(), font=tag) + 60, 236], fill=ACCENT)
        d.text((150, 162), channel.upper(), font=tag, fill=WHITE)
    font, lines = _fit(d, big, lang, W - 240, 3, 120)
    y = 300 if show_tag else 220
    for line in lines:
        d.text((120, y), line, font=font, fill=WHITE)
        y += int(font.size * 1.25)
    d.rectangle([120, y + 30, 360, y + 40], fill=GOLD)
    d.text((120, y + 70), small, font=_font(52, lang, bold=False), fill=(203, 213, 225))
    img.save(out)
    return out


def headline_overlay(out: Path, headline: str, channel: str, counter: str, date_text: str,
                     lang: str) -> Path:
    """Transparent layer: channel tag top-left, headline banner at the bottom."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # top-left channel tag + date
    tag = _font(36, "en")
    tw = d.textlength(channel.upper(), font=tag)
    d.rectangle([60, 50, 60 + tw + 48, 112], fill=ACCENT + (255,))
    d.text((84, 60), channel.upper(), font=tag, fill=WHITE)
    small = _font(32, "en", bold=False)
    d.rectangle([60 + tw + 48, 50, 60 + tw + 48 + d.textlength(date_text, font=small) + 44, 112],
                fill=DARK + (220,))
    d.text((60 + tw + 70, 64), date_text, font=small, fill=WHITE)
    # bottom headline banner
    top = H - 190
    d.rectangle([0, top, W, H - 60], fill=DARK + (235,))
    d.rectangle([0, top, 170, H - 60], fill=ACCENT + (255,))
    cf = _font(54, "en")
    d.text((85 - d.textlength(counter, font=cf) / 2, top + 30), counter, font=cf, fill=WHITE)
    font, lines = _fit(d, headline, lang, W - 280, 1, 68, minimum=36)
    d.text((210, top + 32), lines[0], font=font, fill=WHITE)
    d.rectangle([0, H - 60, W, H - 52], fill=GOLD + (255,))
    img.save(out)
    return out


def thumbnail(out: Path, text: str, channel: str, lang: str, background: Path | None,
              date: str) -> Path:
    tw, th = 1280, 720
    if background and background.exists():
        bg = Image.open(background).convert("RGB")
        scale = max(tw / bg.width, th / bg.height)
        bg = bg.resize((int(bg.width * scale) + 1, int(bg.height * scale) + 1))
        bg = bg.crop(((bg.width - tw) // 2, (bg.height - th) // 2,
                      (bg.width - tw) // 2 + tw, (bg.height - th) // 2 + th))
        bg = ImageEnhance.Brightness(bg.filter(ImageFilter.GaussianBlur(2))).enhance(0.45)
    else:
        bg = _gradient(tw, th)
    d = ImageDraw.Draw(bg)
    tag = _font(34, "en")
    d.rectangle([40, 36, 40 + d.textlength(channel.upper(), font=tag) + 40, 92], fill=ACCENT)
    d.text((60, 44), channel.upper(), font=tag, fill=WHITE)
    df = _font(34, "en")
    d.text((tw - 40 - d.textlength(date, font=df), 46), date, font=df, fill=GOLD)
    font, lines = _fit(d, text.upper() if lang == "en" else text, lang, tw - 100, 3, 128, 60)
    total = len(lines) * int(font.size * 1.15)
    y = th - 60 - total
    for i, line in enumerate(lines):
        color = GOLD if i == 0 else WHITE
        d.text((50, y), line, font=font, fill=color, stroke_width=6, stroke_fill=(0, 0, 0))
        y += int(font.size * 1.15)
    bg.save(out, quality=92)
    return out
