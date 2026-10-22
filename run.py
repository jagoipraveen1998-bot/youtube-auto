"""Make today's news video and upload it to YouTube.

    python run.py              # full run: news -> script -> voice -> video -> upload
    python run.py --no-upload  # make the video only (check output/ folder)
    python run.py --sample     # skip news + AI, use a built-in sample script (tests voice/video)
"""
import argparse
import json
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path

from autotube import graphics, history, video, voice
from autotube.util import ROOT, load_config, log

IST = timezone(timedelta(hours=5, minutes=30))
OUT = ROOT / "output"

SAMPLE_SCRIPT = {
    "video_title": "Sample Episode | Testing the automatic news channel",
    "description": "This is a test video made by the automation to check voice, subtitles and visuals.",
    "tags": ["test", "automation"],
    "thumbnail_text": "Automation Test Run",
    "intro": "Welcome to the test episode. In the next minute we check the voice, the subtitles "
             "and the on-screen graphics of this fully automatic news channel.",
    "outro": "That is the end of the test. If this looks right, switch off sample mode "
             "and the real daily news will start.",
    "stories": [
        {"headline": "Monsoon rains bring relief to farmers",
         "narration": "This is a sample story. Heavy rain across several states has filled reservoirs, "
                      "and farmers are hopeful for a good harvest this season. Officials say water "
                      "levels are the best in five years.",
         "search_terms": ["rain field", "farmer india"], "source_index": None},
        {"headline": "Markets close higher on tech gains",
         "narration": "In this second sample story, stock markets ended the day higher, led by technology "
                      "and banking shares. Analysts say investors are watching global cues closely.",
         "search_terms": ["stock market screen", "city business"], "source_index": None},
        {"headline": "New metro line opens for passengers",
         "narration": "And finally, a new metro line has opened for passengers today, cutting travel time "
                      "across the city. Commuters welcomed the faster and cooler ride.",
         "search_terms": ["metro train", "city traffic"], "source_index": None},
    ],
}


def fmt_ts(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 3600}:{s // 60 % 60:02d}:{s % 60:02d}" if s >= 3600 else f"{s // 60:02d}:{s % 60:02d}"


def build_description(script: dict, chapters: list[tuple[float, str]], used_pexels: bool,
                      channel: str) -> str:
    parts = [script["description"].strip(), "", "Chapters"]
    parts += [f"{fmt_ts(t)} {name}" for t, name in chapters]
    sources = [s["source"] for s in script["stories"] if s.get("source")]
    if sources:
        parts += ["", "Sources"]
        parts += [f"- {s['title']} ({s['source']}) {s['link']}" for s in sources]
    parts += ["", f"Subscribe to {channel} for a daily news update.",
              "Narration is an AI-generated voice; script prepared with AI from public news reports."]
    if used_pexels:
        parts.append("Stock footage: Pexels (pexels.com)")
    tags = [t for t in script.get("tags", []) if " " not in t.strip()][:2]
    parts += ["", " ".join(["#news"] + [f"#{t.strip('#')}" for t in tags])]
    return "\n".join(parts)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-upload", action="store_true")
    ap.add_argument("--sample", action="store_true")
    args = ap.parse_args()

    cfg = load_config()
    lang = cfg["channel"]["language"]
    channel = cfg["channel"]["name"]
    now = datetime.now(IST)
    date_text = now.strftime("%d %b %Y")

    shutil.rmtree(OUT, ignore_errors=True)
    (OUT / "parts").mkdir(parents=True)
    hist = history.load()

    # 1-2. News and script
    if args.sample:
        script, news = json.loads(json.dumps(SAMPLE_SCRIPT)), []
        for s in script["stories"]:
            s["source"] = None
    else:
        from autotube.news import fetch_news
        from autotube.script_writer import write_script
        news = fetch_news(cfg, set(hist["used_links"]))
        if len(news) < 3:
            raise SystemExit("Not enough fresh news found - check the feeds in config.yaml")
        script = write_script(cfg, news)
    (OUT / "script.json").write_text(json.dumps(script, indent=2, ensure_ascii=False), encoding="utf-8")

    # 3-5. Voice + visuals + render, one segment at a time
    from autotube.visuals import get_clips
    parts, chapters, elapsed = [], [], 0.0
    used_ids: set[int] = set()
    first_clip = None
    stories = script["stories"]
    plan = [("intro", "Intro", script["intro"], None)]
    plan += [(f"story{i + 1}", s["headline"], s["narration"], s) for i, s in enumerate(stories)]
    plan += [("outro", "Outro", script["outro"], None)]

    for key, label, text, story in plan:
        log(f"Segment {key}: {label}")
        audio = OUT / "parts" / f"{key}.mp3"
        duration, cues = voice.speak(text, cfg, audio)
        clips, card, overlay = [], None, None
        if story:
            n = stories.index(story) + 1
            clips = get_clips(story["search_terms"], cfg["video"]["clips_per_story"],
                              OUT / "clips", used_ids)
            first_clip = first_clip or (clips[0] if clips else None)
            if not clips:
                card = graphics.title_card(OUT / "parts" / f"{key}_card.png", story["headline"],
                                           f"Story {n} of {len(stories)}", channel, lang,
                                           show_tag=False)
            overlay = graphics.headline_overlay(OUT / "parts" / f"{key}_ov.png", story["headline"],
                                                channel, f"{n}", date_text, lang)
        elif key == "intro":
            card = graphics.title_card(OUT / "parts" / "intro_card.png", script["video_title"],
                                       now.strftime("%A, %d %B %Y"), channel, lang)
        else:
            card = graphics.title_card(OUT / "parts" / "outro_card.png", "Thanks for watching",
                                       "Like, share and subscribe for daily updates", channel, lang)
        seg = OUT / "parts" / f"{key}.mp4"
        length = video.build_segment(seg, audio, duration, cues, lang, clips, card, overlay)
        chapters.append((elapsed, label))
        elapsed += length
        parts.append(seg)

    music = ROOT / cfg["video"].get("background_music", "") if cfg["video"].get("background_music") else None
    final = video.join_segments(parts, OUT / "video.mp4", music, cfg["video"].get("music_volume", 0.08))
    log(f"Video ready: {final} ({fmt_ts(elapsed)})")

    bg = video.grab_frame(first_clip, OUT / "parts" / "thumb_bg.jpg") if first_clip else None
    thumb = graphics.thumbnail(OUT / "thumbnail.jpg", script["thumbnail_text"], channel, lang, bg,
                               date_text.upper())
    description = build_description(script, chapters, bool(used_ids), channel)
    (OUT / "description.txt").write_text(description, encoding="utf-8")

    # 6. Upload
    if args.no_upload or args.sample:
        log("Upload skipped. Files are in the output/ folder.")
        return
    from autotube.uploader import upload
    tags = script.get("tags", []) + cfg["youtube"].get("extra_tags", [])
    video_id = upload(final, thumb, script["video_title"], description, tags, cfg)
    history.save(hist, [s["source"]["link"] for s in stories if s.get("source")],
                 {"date": now.strftime("%Y-%m-%d"), "video_id": video_id,
                  "title": script["video_title"], "length": fmt_ts(elapsed)})
    log("Done.")


if __name__ == "__main__":
    main()
