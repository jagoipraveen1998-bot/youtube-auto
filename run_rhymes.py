"""Generate one compilation and three different Shorts for a language."""
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
         "character_id": "cow", "friends": ["pig", "chick"], "setting": "farm", "emoji": "🐮",
         "lines": ["Moo moo moo, said Molly the cow", "I want to fly, I want to fly now",
                   "She flapped her ears, she wiggled her tail", "She jumped so high, then oops, a fail",
                   "Boing boing boing, she bounced on hay", "Let's try again another day"]},
        {"title": "Banana Dance", "title_en": "Banana Dance", "character": "cartoon banana", "character_id": "banana",
         "friends": ["monkey", "bunny"], "setting": "garden", "emoji": "🍌",
         "lines": ["Yellow banana, wiggle and shake", "Dancing all day for goodness sake",
                   "Spin to the left, spin to the right", "Banana dancing with all its might"]},
        {"title": "Puppy Hiccups", "title_en": "Puppy Hiccups", "character": "cartoon puppy", "character_id": "dog",
         "friends": ["cat", "duck"], "setting": "town", "emoji": "🐶",
         "lines": ["Little puppy went hic hic hic", "Drink some water, quick quick quick",
                   "Hold your breath and count to three", "Hiccups gone, as happy as can be"]}],
        "best_index": 0, "compilation_title": "Funny New Nursery Rhymes for Kids | Cow, Banana & Puppy Songs",
        "short_title": "The Cow Who Wants to Fly 🐮 Funny Rhyme for Kids",
        "description": "Three brand new silly rhymes for little ones to sing along with.",
        "tags": ["nursery rhymes", "kids songs"], "thumbnail_text": "Silly Cow Song!"},
    "ta": {"rhymes": [
        {"title": "பறக்க ஆசைப்பட்ட பசு", "title_en": "The Cow Who Wants to Fly", "character": "cartoon cow",
         "character_id": "cow", "setting": "farm", "emoji": "🐮",
         "lines": ["அம்மா அம்மா என்றது பசு", "பறக்க வேண்டும் என்றது பசு", "காதை ஆட்டி வாலை ஆட்டி",
                   "குதித்தது பசு ஜாலியாக"]},
        {"title": "வாழைப்பழ டான்ஸ்", "title_en": "Banana Dance", "character": "cartoon banana", "character_id": "banana",
         "setting": "garden", "emoji": "🍌",
         "lines": ["மஞ்சள் வாழை ஆடுது பார்", "சுற்றி சுற்றி ஆடுது பார்", "இடது பக்கம் வலது பக்கம்",
                   "வாழைப்பழம் சிரிக்குது பார்"]},
        {"title": "நாய்க்குட்டி விக்கல்", "title_en": "Puppy Hiccups", "character": "cartoon puppy", "character_id": "dog",
         "setting": "town", "emoji": "🐶",
         "lines": ["குட்டி நாய்க்கு விக்கல் வந்தது", "தண்ணீர் குடி என்றது அம்மா", "ஒன்று இரண்டு மூன்று சொல்லு",
                   "விக்கல் போச்சு சிரிச்சது நாய்"]}],
        "best_index": 0, "compilation_title": "புதிய வேடிக்கை குழந்தை பாடல்கள் | Tamil Rhymes for Kids",
        "short_title": "பறக்க ஆசைப்பட்ட பசு 🐮 Tamil Kids Rhyme",
        "description": "குழந்தைகளுக்கான மூன்று புதிய வேடிக்கை பாடல்கள்.",
        "tags": ["tamil rhymes", "kids songs"], "thumbnail_text": "பசு பறக்குமா?"},
}


def fmt(s):
    s = int(s)
    return f"{s // 60:02d}:{s % 60:02d}"


def seed_for(*parts):
    return int(hashlib.md5("|".join(map(str, parts)).encode()).hexdigest()[:8], 16)


def main():
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
        data = write_rhymes(cfg, lang, hist["titles"])
    (out / "rhymes.json").write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    rhymes = data["rhymes"]
    if len(rhymes) < 3:
        raise ValueError(f"Need 3 distinct rhymes for 3 Shorts; got {len(rhymes)}")
    greet = rc["greeting"][lang]
    parts, chapters, t = [], [], 0.0
    star = rhymes[0].get("character_id") or "bunny"
    intro = {"title": channel, "lines": [greet["hello"]], "character": "happy friends", "emoji": "🎈",
             "character_id": star, "friends": [r.get("character_id") for r in rhymes[1:3] if r.get("character_id")],
             "setting": "meadow"}
    outro = {"title": greet["bye_title"], "lines": [greet["bye"]], "character": "waving star", "emoji": "🌟",
             "character_id": "star", "friends": ["moon", "owl"], "setting": "night"}
    plan = [("intro", intro)] + [(f"r{i+1}", r) for i, r in enumerate(rhymes)] + [("outro", outro)]
    for key, rhyme in plan:
        log(f"[{lang}] Rendering {key}: {rhyme['title']}")
        seg = out / "work" / f"{key}_h.mp4"
        dur = rv.render_rhyme(rhyme, lang, cfg, out / "work" / key, seg, False, seed_for(today, lang, key), channel)
        if key.startswith("r"):
            chapters.append((t, rhyme["title"]))
        elif key == "intro":
            chapters.append((0.0, greet["chapter_intro"]))
        parts.append(seg)
        t += dur
    long_video = rv.join(parts, out / "compilation.mp4")
    log(f"[{lang}] Compilation ready ({fmt(t)})")
    bi = data["best_index"]
    short_indices = [bi] + [i for i in range(len(rhymes)) if i != bi][:2]
    short_files = []
    for n, rhyme_index in enumerate(short_indices, start=1):
        rhyme = rhymes[rhyme_index]
        path = out / f"short_{n}.mp4"
        duration = rv.render_rhyme(rhyme, lang, cfg, out / "work" / f"r{rhyme_index+1}", path, True,
                                   seed_for(today, lang, f"short-r{rhyme_index+1}"), channel)
        short_files.append((rhyme_index, path))
        log(f"[{lang}] Short {n}/3 ready ({fmt(duration)}): {rhyme['title']}")
    th_long = rv.thumbnail(data["thumbnail_text"], lang, out / "work" / f"r{bi+1}" / "char_640.png",
                           seed_for(today, lang, "thumb"), out / "thumb_compilation.jpg", channel)
    tags = list(dict.fromkeys(data.get("tags", []) + rc["extra_tags"][lang]))
    hashtags = " ".join(rc["hashtags"][lang])
    desc_long = "\n".join([data["description"], "", greet["chapters_label"]] +
                          [f"{fmt(c)} {name}" for c, name in chapters] + ["", greet["footer"], "", hashtags])
    short_desc = {i: "\n".join([rhymes[i]["title"], "", data["description"], "", hashtags + " #shorts"])
                  for i, _ in short_files}
    (out / "description.txt").write_text(desc_long, encoding="utf-8")
    if a.no_upload or a.sample:
        log(f"[{lang}] Upload skipped. Files are in {out.name}/")
        return
    from autotube.uploader import upload
    ucfg = copy.deepcopy(cfg)
    ucfg["channel"]["language"] = lang
    vid_long = upload(long_video, th_long, data["compilation_title"], desc_long, tags, ucfg)
    vid_shorts = []
    for i, path in short_files:
        title = data["short_title"] if i == bi else f"{rhymes[i]['title']} | Kids Rhyme #Shorts"
        vid_shorts.append(upload(path, None, title[:95], short_desc[i], tags, ucfg))
    hist["titles"] = (hist["titles"] + [r.get("title_en", r["title"]) for r in rhymes])[-400:]
    hist["videos"] = (hist["videos"] + [{"date": today, "compilation": vid_long, "shorts": vid_shorts, "length": fmt(t)}])[-365:]
    hist_file.write_text(json.dumps(hist, indent=2, ensure_ascii=False), encoding="utf-8")
    log(f"[{lang}] Done: 1 compilation + {len(vid_shorts)} Shorts.")


if __name__ == "__main__":
    main()
