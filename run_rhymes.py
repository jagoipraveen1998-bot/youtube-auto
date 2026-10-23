"""Make today's funny baby-rhyme videos for one language and upload them.

    python run_rhymes.py --lang en              # compilation + Short, uploaded
    python run_rhymes.py --lang ta --no-upload  # make only (see output_ta/)
    python run_rhymes.py --lang en --sample     # built-in sample rhymes, no AI, no upload
"""
import argparse
import copy
import hashlib
import json
import shutil
from datetime import datetime, timedelta, timezone

from autotube import rhymes_video as rv
from autotube.util import ROOT, load_config, log

IST = timezone(timedelta(hours=5, minutes=30))

SAMPLE = {
    "en": {"rhymes": [
        {"title": "The Cow Who Wants to Fly", "title_en": "The Cow Who Wants to Fly", "character": "cartoon cow",
         "emoji": "🐮", "lines": ["Moo moo moo, said Molly the cow", "I want to fly, I want to fly now",
                                  "She flapped her ears, she wiggled her tail", "She jumped so high, then oops, a fail",
                                  "Boing boing boing, she bounced on hay", "Let's try again another day"]},
        {"title": "Banana Dance", "title_en": "Banana Dance", "character": "cartoon banana", "emoji": "🍌",
         "lines": ["Yellow banana, wiggle and shake", "Dancing all day for goodness sake",
                   "Spin to the left, spin to the right", "Banana dancing with all its might"]},
        {"title": "Puppy Hiccups", "title_en": "Puppy Hiccups", "character": "cartoon puppy", "emoji": "🐶",
         "lines": ["Little puppy went hic hic hic", "Drink some water, quick quick quick",
                   "Hold your breath and count to three", "Hiccups gone, as happy as can be"]}],
        "best_index": 0, "compilation_title": "Funny New Nursery Rhymes for Kids | Cow, Banana & Puppy Songs",
        "short_title": "The Cow Who Wants to Fly 🐮 Funny Rhyme for Kids",
        "description": "Three brand new silly rhymes for little ones to sing along with.",
        "tags": ["nursery rhymes", "kids songs"], "thumbnail_text": "Silly Cow Song!"},
    "ta": {"rhymes": [
        {"title": "பறக்க ஆசைப்பட்ட பசு", "title_en": "The Cow Who Wants to Fly", "character": "cartoon cow",
         "emoji": "🐮", "lines": ["அம்மா அம்மா என்றது பசு", "பறக்க வேண்டும் என்றது பசு",
                                  "காதை ஆட்டி வாலை ஆட்டி", "குதித்தது பசு ஜாலியாக"]},
        {"title": "வாழைப்பழ டான்ஸ்", "title_en": "Banana Dance", "character": "cartoon banana", "emoji": "🍌",
         "lines": ["மஞ்சள் வாழை ஆடுது பார்", "சுற்றி சுற்றி ஆடுது பார்", "இடது பக்கம் வலது பக்கம்",
                   "வாழைப்பழம் சிரிக்குது பார்"]},
        {"title": "நாய்க்குட்டி விக்கல்", "title_en": "Puppy Hiccups", "character": "cartoon puppy", "emoji": "🐶",
         "lines": ["குட்டி நாய்க்கு விக்கல் வந்தது", "தண்ணீர் குடி என்றது அம்மா", "ஒன்று இரண்டு மூன்று சொல்லு",
                   "விக்கல் போச்சு சிரிச்சது நாய்"]}],
        "best_index": 0, "compilation_title": "புதிய வேடிக்கை குழந்தை பாடல்கள் | Tamil Rhymes for Kids",
        "short_title": "பறக்க ஆசைப்பட்ட பசு 🐮 Tamil Kids Rhyme",
        "description": "குழந்தைகளுக்கான மூன்று புதிய வேடிக்கை பாடல்கள்.",
        "tags": ["tamil rhymes", "kids songs"], "thumbnail_text": "பசு பறக்குமா?"},
}


def fmt(s: float) -> str:
    s = int(s)
    return f"{s // 60:02d}:{s % 60:02d}"


def seed_for(*parts) -> int:
    return int(hashlib.md5("|".join(map(str, parts)).encode()).hexdigest()[:8], 16)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", choices=["en", "ta"], required=True)
    ap.add_argument("--no-upload", action="store_true")
    ap.add_argument("--sample", action="store_true")
    a = ap.parse_args()

    cfg = load_config()
    lang, rc = a.lang, cfg["rhymes"]
    channel = cfg["channel"]["name"]
    today = datetime.now(IST).strftime("%Y-%m-%d")
    out = ROOT / f"output_{lang}"
    shutil.rmtree(out, ignore_errors=True)
    (out / "work").mkdir(parents=True)

    hist_file = ROOT / "data" / f"rhymes_history_{lang}.json"
    hist = json.loads(hist_file.read_text(encoding="utf-8")) if hist_file.exists() else {"titles": [], "videos": []}

    if a.sample:
        data = copy.deepcopy(SAMPLE[lang])
    else:
        from autotube.rhymes_writer import write_rhymes
        data = write_rhymes(cfg, lang, [t for t in hist["titles"]])
    (out / "rhymes.json").write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    rhymes = data["rhymes"]
    greet = rc["greeting"][lang]

    # --- long compilation (16:9)
    parts, chapters, t = [], [], 0.0
    intro = {"title": channel, "lines": [greet["hello"]], "character": "happy balloon", "emoji": "🎈"}
    outro = {"title": greet["bye_title"], "lines": [greet["bye"]], "character": "waving star", "emoji": "🌟"}
    plan = [("intro", intro)] + [(f"r{i + 1}", r) for i, r in enumerate(rhymes)] + [("outro", outro)]
    for key, rh in plan:
        log(f"[{lang}] Rendering {key}: {rh['title']}")
        seg = out / "work" / f"{key}_h.mp4"
        dur = rv.render_rhyme(rh, lang, cfg, out / "work" / key, seg, False, seed_for(today, lang, key), channel)
        if key.startswith("r"):
            chapters.append((t, rh["title"]))
        elif key == "intro":
            chapters.append((0.0, greet["chapter_intro"]))
        parts.append(seg)
        t += dur
    long_video = rv.join(parts, out / "compilation.mp4")
    log(f"[{lang}] Compilation ready ({fmt(t)})")

    # --- Short (9:16): the best rhyme
    bi = data["best_index"]
    best = rhymes[bi]
    sdur = rv.render_rhyme(best, lang, cfg, out / "work" / f"r{bi + 1}", out / "short.mp4", True,
                           seed_for(today, lang, f"r{bi + 1}"), channel)
    log(f"[{lang}] Short ready ({fmt(sdur)})")

    # --- thumbnails + descriptions
    th_long = rv.thumbnail(data["thumbnail_text"], lang, out / "work" / f"r{bi + 1}" / "char_640.png",
                           seed_for(today, lang, "thumb"), out / "thumb_compilation.jpg", channel)
    tags = list(dict.fromkeys(data.get("tags", []) + rc["extra_tags"][lang]))
    hashtags = " ".join(rc["hashtags"][lang])
    desc_long = "\n".join([data["description"], "", greet["chapters_label"]] +
                          [f"{fmt(c)} {n}" for c, n in chapters] +
                          ["", greet["footer"], "", hashtags])
    desc_short = "\n".join([best["title"], "", data["description"], "", hashtags + " #shorts"])
    (out / "description.txt").write_text(desc_long, encoding="utf-8")

    if a.no_upload or a.sample:
        log(f"[{lang}] Upload skipped. Files are in {out.name}/")
        return

    from autotube.uploader import upload
    ucfg = copy.deepcopy(cfg)
    ucfg["channel"]["language"] = lang
    vid_long = upload(long_video, th_long, data["compilation_title"], desc_long, tags, ucfg)
    vid_short = upload(out / "short.mp4", None, data["short_title"], desc_short, tags, ucfg)

    hist["titles"] = (hist["titles"] + [r.get("title_en", r["title"]) for r in rhymes])[-400:]
    hist["videos"] = (hist["videos"] + [{"date": today, "compilation": vid_long, "short": vid_short,
                                         "length": fmt(t)}])[-365:]
    hist_file.write_text(json.dumps(hist, indent=2, ensure_ascii=False), encoding="utf-8")
    log(f"[{lang}] Done.")


if __name__ == "__main__":
    main()
