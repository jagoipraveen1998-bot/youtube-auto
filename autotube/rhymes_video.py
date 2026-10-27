"""Render a rhyme as a video: music + beat-aligned child voice + bouncing character + karaoke lyrics."""
import json
import math
import random
import shutil
import subprocess
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from . import scene3d
from .music import make_music, pick_style
from .util import FPS, env, log, run
from .voice import say, voice_for

ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
       "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]

PALETTES = [  # sky top, sky bottom, hills, hills dark, accent
    ((135, 206, 250), (224, 247, 255), (124, 205, 124), (88, 170, 92), (255, 99, 132)),
    ((255, 183, 197), (255, 236, 210), (152, 221, 202), (102, 187, 164), (124, 77, 255)),
    ((179, 157, 219), (237, 231, 246), (174, 213, 129), (124, 179, 66), (255, 152, 0)),
    ((129, 212, 250), (255, 249, 196), (165, 214, 167), (102, 187, 106), (233, 30, 99)),
    ((255, 204, 128), (255, 243, 224), (128, 203, 196), (77, 182, 172), (63, 81, 181)),
]


# ---------------------------------------------------------------- fonts
def _find_font(names: list[str]) -> str:
    for n in names:
        if Path(n).is_absolute() and Path(n).exists():
            return n
        if shutil.which("fc-match"):
            out = subprocess.run(["fc-match", "-f", "%{file}|%{family}", n],
                                 capture_output=True, text=True).stdout
            f, _, fam = out.partition("|")
            if f and n.split(":")[0].lower() in fam.lower():
                return f
    return "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def fonts(lang: str) -> tuple[str, str]:
    """(font file for PIL, family name for subtitles)"""
    if lang == "ta":
        return _find_font(["Noto Sans Tamil:bold", "Noto Sans Tamil"]), "Noto Sans Tamil"
    f = _find_font(["Comic Neue:bold", "Fredoka:bold", "Baloo 2:bold", "DejaVu Sans:bold"])
    fam = "Comic Neue" if "omic" in f else ("DejaVu Sans" if "DejaVu" in f else "Noto Sans")
    return f, fam


EMOJI_FONT = _find_font(["/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", "Noto Color Emoji"])


# ---------------------------------------------------------------- pictures
def background(size: tuple[int, int], seed: int, out: Path) -> Path:
    w, h = size
    r = random.Random(seed)
    sky1, sky2, hill, hill2, _ = PALETTES[seed % len(PALETTES)]
    img = Image.new("RGB", size)
    d = ImageDraw.Draw(img)
    for y in range(h):
        k = y / h
        d.line([(0, y), (w, y)], fill=tuple(int(a + (b - a) * k) for a, b in zip(sky1, sky2)))
    # sun
    sx, sy, sr = int(w * 0.85), int(h * 0.13), int(min(w, h) * 0.08)
    for i in range(12):
        a = i * math.pi / 6
        d.line([(sx + math.cos(a) * sr * 1.3, sy + math.sin(a) * sr * 1.3),
                (sx + math.cos(a) * sr * 1.8, sy + math.sin(a) * sr * 1.8)], fill=(255, 213, 79), width=10)
    d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 213, 79))
    # clouds
    for _ in range(4):
        cx, cy, s = r.randint(0, w), r.randint(int(h * 0.05), int(h * 0.35)), r.randint(50, 90)
        for dx, dy, k in ((0, 0, 1.0), (-s, s * 0.3, 0.8), (s, s * 0.3, 0.8), (s * 0.5, -s * 0.3, 0.75)):
            rr = s * k
            d.ellipse([cx + dx - rr, cy + dy - rr * 0.7, cx + dx + rr, cy + dy + rr * 0.7], fill=(255, 255, 255))
    # hills
    d.ellipse([-w * 0.3, h * 0.72, w * 0.7, h * 1.4], fill=hill2)
    d.ellipse([w * 0.3, h * 0.75, w * 1.3, h * 1.45], fill=hill)
    for _ in range(26):  # flowers
        fx, fy = r.randint(0, w), r.randint(int(h * 0.82), h - 10)
        col = r.choice([(255, 255, 255), (255, 235, 59), (255, 138, 128), (186, 104, 200)])
        for a in range(5):
            ang = a * 2 * math.pi / 5
            d.ellipse([fx + math.cos(ang) * 9 - 7, fy + math.sin(ang) * 9 - 7,
                       fx + math.cos(ang) * 9 + 7, fy + math.sin(ang) * 9 + 7], fill=col)
        d.ellipse([fx - 5, fy - 5, fx + 5, fy + 5], fill=(255, 193, 7))
    img.save(out)
    return out


def _emoji_image(emoji: str, px: int) -> Image.Image | None:
    try:
        f = ImageFont.truetype(EMOJI_FONT, 109)
        im = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((80, 80), emoji, font=f, embedded_color=True, anchor="mm")
        bbox = im.getbbox()
        if not bbox:
            return None
        return im.crop(bbox).resize((px, px), Image.LANCZOS)
    except Exception as exc:
        log(f"Emoji render failed: {exc}")
        return None


def _pixabay_picture(term: str) -> Image.Image | None:
    key = env("PIXABAY_API_KEY", required=False)
    if not key:
        return None
    for itype in ("vector", "illustration"):
        try:
            r = requests.get("https://pixabay.com/api/", timeout=30, params={
                "key": key, "q": term[:100], "image_type": itype, "safesearch": "true",
                "per_page": 12, "order": "popular"})
            r.raise_for_status()
            hits = [h for h in r.json().get("hits", []) if h.get("imageWidth", 0) >= 600]
            if hits:
                h = random.choice(hits[:6])
                img = requests.get(h.get("largeImageURL") or h["webformatURL"], timeout=60).content
                return Image.open(BytesIO(img)).convert("RGBA")
        except Exception as exc:
            log(f"Pixabay picture failed for '{term}': {exc}")
    return None


def character(rhyme: dict, px: int, out: Path) -> Path:
    """Character card: Pixabay cartoon in a white rounded frame, or a big emoji."""
    pic = _pixabay_picture(rhyme.get("character", "") + " cartoon")
    if pic is not None:
        pic.thumbnail((px, px), Image.LANCZOS)
        pad = 16
        card = Image.new("RGBA", (pic.width + pad * 2, pic.height + pad * 2), (0, 0, 0, 0))
        mask = Image.new("L", card.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, *card.size], 48, fill=255)
        white = Image.new("RGBA", card.size, (255, 255, 255, 255))
        card.paste(white, (0, 0), mask)
        inner = Image.new("L", pic.size, 0)
        ImageDraw.Draw(inner).rounded_rectangle([0, 0, *pic.size], 36, fill=255)
        flat = Image.new("RGBA", pic.size, (255, 255, 255, 255))
        flat.alpha_composite(pic)
        card.paste(flat, (pad, pad), inner)
        img = card
    else:
        img = _emoji_image(rhyme.get("emoji", "⭐"), px) or _emoji_image("⭐", px)
    # soft shadow
    shadow = Image.new("RGBA", (img.width + 60, img.height + 60), (0, 0, 0, 0))
    a = img.split()[-1].point(lambda v: 90 if v > 10 else 0)
    shadow.paste((0, 0, 0, 255), (30, 42), a)
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    shadow.alpha_composite(img, (30, 30))
    shadow.save(out)
    return out


# ---------------------------------------------------------------- subtitles
def _ass_t(t: float) -> str:
    cs = max(0, int(round(t * 100)))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def _esc(s: str) -> str:
    return s.replace("{", "(").replace("}", ")").replace("\n", " ")


def band_filter(vertical: bool, show_next: bool) -> str:
    """The soft strip behind the words, just tall enough for them."""
    if vertical:
        h = 430 if show_next else 300
        return f"drawbox=x=0:y=ih-{h + 200}:w=iw:h={h}:color=0x1a0d2e@0.34:t=fill"
    h = 250 if show_next else 185
    return f"drawbox=x=0:y=ih-{h}:w=iw:h={h}:color=0x1a0d2e@0.34:t=fill"


def write_ass(path: Path, size: tuple[int, int], family: str, title: str, title_span: tuple[float, float],
              lines: list[dict], vertical: bool, show_next: bool = True) -> Path:
    w, h = size
    if show_next:  # rhymes: the line being sung, with the next one underneath
        lyr, sing_v, next_v = (96, 140, 58) if not vertical else (88, 430, 330)
    else:          # stories: one clean line of speech
        lyr, sing_v, next_v = (84, 95, 40) if not vertical else (80, 330, 250)
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sing,{family},{lyr},&H0000E5FF,&H00FFFFFF,&H00862A5E,&H64000000,-1,0,0,0,100,100,1,0,1,7,3,2,70,70,{sing_v},1
Style: Next,{family},{int(lyr * 0.55)},&H00F0F0F0,&H00F0F0F0,&H00862A5E,&H00000000,-1,0,0,0,100,100,0,0,1,5,0,2,70,70,{next_v},1
Style: Title,{family},{150 if not vertical else 120},&H00FFFFFF,&H00FFFFFF,&H004A1FE9,&H64000000,-1,0,0,0,100,100,2,0,1,10,4,8,80,80,{60 if not vertical else 230},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    t0, t1 = title_span
    ev.append(f"Dialogue: 1,{_ass_t(t0)},{_ass_t(t1)},Title,,0,0,0,,"
              r"{\fad(250,250)\t(0,400,\fscx115\fscy115)\t(400,800,\fscx100\fscy100)}" + _esc(title))
    for i, ln in enumerate(lines):
        start, end = ln["show"], ln["hide"]
        parts, cursor = [], start
        words = ln["words"] or [{"start": 0, "end": ln["dur"], "text": ln["text"]}]
        for j, wd in enumerate(words):
            ws = ln["at"] + wd["start"]
            we = ln["at"] + (words[j + 1]["start"] if j + 1 < len(words) else wd["end"])
            if ws > cursor:
                parts.append(r"{\k%d}" % int((ws - cursor) * 100))
            parts.append(r"{\kf%d}%s " % (max(1, int((we - ws) * 100)), _esc(wd["text"])))
            cursor = we
        ev.append(f"Dialogue: 0,{_ass_t(start)},{_ass_t(end)},Sing,,0,0,0,,"
                  r"{\fad(120,120)}" + "".join(parts).strip())
        if show_next and i + 1 < len(lines):
            ev.append(f"Dialogue: 0,{_ass_t(start)},{_ass_t(end)},Next,,0,0,0,,{_esc(lines[i + 1]['text'])}")
    path.write_text(head + "\n".join(ev) + "\n", encoding="utf-8")
    return path


def _escf(p: Path | str) -> str:
    return str(p).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")


# ---------------------------------------------------------------- render one rhyme
def render_rhyme(rhyme: dict, lang: str, cfg: dict, work: Path, out: Path, vertical: bool,
                 seed: int, channel: str, show_next: bool = True) -> float:
    """Render one rhyme to "out". Returns its duration (seconds)."""
    work.mkdir(parents=True, exist_ok=True)
    vc = cfg["rhymes"]["voices"][lang]
    size = (1080, 1920) if vertical else (1920, 1080)
    bpm, key = pick_style(seed)
    beat, bar = 60 / bpm, 240 / bpm

    # 1. voice lines (title is spoken too); a line may name the character speaking it
    texts = [{"who": "narrator", "text": rhyme["title"]}]
    for line in rhyme["lines"]:
        texts.append(line if isinstance(line, dict) else {"text": str(line)})
    spoken = []
    for i, item in enumerate(texts):
        text = str(item.get("text", "")).strip()
        mp3 = work / f"l{i:02d}.mp3"
        cache = work / f"l{i:02d}.json"
        if mp3.exists() and cache.exists():
            dur, words = json.loads(cache.read_text())
        else:
            dur, words = say(text, voice_for(vc, item.get("who")), mp3)
            cache.write_text(json.dumps([dur, words], ensure_ascii=False))
        spoken.append({"text": text, "mp3": mp3, "dur": dur, "words": words})

    # 2. place each line on the beat grid
    t = bar  # one bar of music first
    for ln in spoken:
        slots = 1 if ln["dur"] <= bar - 0.2 else math.ceil((ln["dur"] + 0.25) / bar)
        ln["at"] = t + 0.08
        ln["show"], ln["hide"] = t, t + slots * bar
        t += slots * bar
    total = t + bar  # one bar outro
    title_ln, lines = spoken[0], spoken[1:]

    # 3. pictures + subtitles + music
    W, H = size
    cpx = 640 if not vertical else 760
    ch = work / f"char_{cpx}.png"
    loop = None
    if scene3d.enabled(cfg):
        try:
            loop, portrait, _ = scene3d.render_loop(rhyme, vertical, bpm, seed, work, cfg, size)
            if portrait and not ch.exists():
                shutil.copy(portrait, ch)
        except Exception as exc:
            log(f"3D render failed, using the 2D look for this part: {exc}")
            loop = None
    if not ch.exists():
        character(rhyme, cpx, ch)
    _, family = fonts(lang)
    ass = write_ass(work / f"lyrics_{'v' if vertical else 'h'}.ass", size, family, rhyme["title"],
                    (title_ln["show"], title_ln["hide"]), lines, vertical, show_next)
    music = make_music(work / "music.wav", total, bpm, key, seed)

    # 4. ffmpeg: animated 3D loop (or 2D background + bouncing character) + karaoke + mixed audio
    subs = (f"ass=filename='{_escf(ass)}':fontsdir='{_escf(Path(fonts(lang)[0]).parent)}',"
            f"fade=t=in:st=0:d=0.3,fade=t=out:st={total - 0.4:.2f}:d=0.4[v]")
    if loop is not None:
        band = band_filter(vertical, show_next)
        inputs = ["-stream_loop", "-1", "-i", str(loop), "-i", str(music)]
        fl = [f"[0:v]scale={W}:{H},setsar=1,format=yuv420p,{band}[v1]", f"[v1]{subs}"]
        mi, vi = 1, 2
    else:
        bg = background(size, seed, work / f"bg_{'v' if vertical else 'h'}.png")
        inputs = ["-loop", "1", "-t", f"{total:.2f}", "-i", str(bg),
                  "-loop", "1", "-t", f"{total:.2f}", "-i", str(ch), "-i", str(music)]
        cy = int(H * 0.36) if not vertical else int(H * 0.40)
        bounce = 34 if not vertical else 42
        fl = [f"[0:v]scale={W}:{H},setsar=1,format=yuv420p[bg]",
              f"[1:v]format=rgba[ch]",
              f"[bg][ch]overlay=x='(W-w)/2+18*sin(2*PI*t/{bar:.4f})':"
              f"y='{cy}-h/2-{bounce}*abs(sin(PI*t/{beat:.4f}))':format=auto,format=yuv420p[v1]",
              f"[v1]{subs}"]
        mi, vi = 2, 3
    for ln in spoken:
        inputs += ["-i", str(ln["mp3"])]
    mix = []
    for i, ln in enumerate(spoken):
        ms = int(ln["at"] * 1000)
        fl.append(f"[{vi + i}:a]aresample=48000,adelay={ms}|{ms},volume=1.7[s{i}]")
        mix.append(f"[s{i}]")
    fl.append(f"[{mi}:a]aresample=48000,volume={cfg['rhymes'].get('music_volume', 0.30)}[m]")
    fl.append("".join(mix) + f"[m]amix=inputs={len(mix) + 1}:normalize=0:duration=longest,"
              f"alimiter=limit=0.95,atrim=duration={total:.2f}[a]")
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs, "-filter_complex", ";".join(fl),
         "-map", "[v]", "-map", "[a]", "-t", f"{total:.2f}", *ENC, str(out)])
    return total


def join(parts: list[Path], out: Path) -> Path:
    lst = out.with_suffix(".txt")
    lst.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in parts))
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
         "-c", "copy", "-movflags", "+faststart", str(out)])
    return out


# ---------------------------------------------------------------- thumbnail
def thumbnail(text: str, lang: str, char_png: Path, seed: int, out: Path, channel: str,
              vertical: bool = False) -> Path:
    size = (1280, 720) if not vertical else (720, 1280)
    tmp = out.with_name("thumb_bg.png")
    img = Image.open(background(size, seed + 7, tmp)).convert("RGBA")
    ch = Image.open(char_png).convert("RGBA")
    ch.thumbnail((int(size[1] * 0.78), int(size[1] * 0.78)) if not vertical else (620, 620))
    if not vertical:
        img.alpha_composite(ch, (size[0] - ch.width - 30, size[1] - ch.height - 10))
    else:
        img.alpha_composite(ch, ((size[0] - ch.width) // 2, size[1] - ch.height - 60))
    d = ImageDraw.Draw(img)
    fpath, _ = fonts(lang)
    maxw = int(size[0] * (0.58 if not vertical else 0.9))
    fs = 150
    while fs > 50:
        f = ImageFont.truetype(fpath, fs)
        words, lines, cur = text.split(), [], ""
        for wd in words:
            test = (cur + " " + wd).strip()
            if d.textlength(test, font=f) <= maxw or not cur:
                cur = test
            else:
                lines.append(cur)
                cur = wd
        lines.append(cur)
        if len(lines) <= 3:
            break
        fs -= 10
    colors = [(255, 235, 59), (255, 255, 255), (129, 212, 250)]
    y = 60
    for i, ln in enumerate(lines):
        d.text((50 if not vertical else (size[0] - d.textlength(ln, font=f)) / 2, y), ln, font=f,
               fill=colors[i % 3], stroke_width=10, stroke_fill=(94, 42, 134))
        y += int(fs * 1.2)
    badge = ImageFont.truetype(fonts("en")[0], 36)
    bw = d.textlength(channel, font=badge) + 40
    d.rounded_rectangle([40, size[1] - 80, 40 + bw, size[1] - 24], 26, fill=(233, 30, 99))
    d.text((60, size[1] - 74), channel, font=badge, fill=(255, 255, 255))
    img.convert("RGB").save(out, quality=92)
    return out
