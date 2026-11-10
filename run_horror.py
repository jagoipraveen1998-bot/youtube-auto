"""Make (and upload) one horror Short for CreepyCartoonTales.

    python run_horror.py                     # write, animate, upload
    python run_horror.py --no-upload         # build it only (output_horror/short.mp4)
    python run_horror.py --story horror/stories/six_am.json --voice-file voice.mp3 --no-upload   # local test
"""
import argparse
import json
import os
import random
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path

from autotube import horror_video as hv
from autotube.horror_writer import repair, write_story
from autotube.util import ROOT, check_playable, load_config, log

IST = timezone(timedelta(hours=5, minutes=30))


def latest_long_video() -> dict | None:
    """The newest public long video, so every Short sends viewers to it (long videos earn watch hours)."""
    best = None
    for f in ("horror_long_history.json", "horror_history.json"):
        p = ROOT / "data" / f
        if p.exists():
            d = json.loads(p.read_text(encoding="utf-8"))
            for v in d.get("videos" if f.startswith("horror_long") else "long_videos", []):
                if v.get("video_id") and (best is None or str(v.get("date", "")) >= str(best.get("date", ""))):
                    best = v
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-upload", action="store_true")
    ap.add_argument("--story", help="use a story JSON file instead of asking Gemini")
    ap.add_argument("--voice-file", help="use a recorded narration (testing)")
    args = ap.parse_args()

    import os
    pause = ROOT / "data" / "horror_pause_until.txt"
    if os.environ.get("GITHUB_EVENT_NAME") == "schedule" and pause.exists():
        until = datetime.fromisoformat(pause.read_text(encoding="utf-8").strip())
        if datetime.now(timezone.utc) < until:
            log(f"A scheduled batch is still going out (until {until.astimezone(IST):%d %b %H:%M} IST); skipping this slot")
            return
    cfg = load_config()
    hcfg = cfg["horror"]
    out = ROOT / "output_horror"
    shutil.rmtree(out, ignore_errors=True)
    work = out / "work"
    work.mkdir(parents=True)

    hist_path = ROOT / "data" / "horror_history.json"
    hist = json.loads(hist_path.read_text(encoding="utf-8")) if hist_path.exists() else {"stories": [], "videos": []}

    if args.story:
        story = json.loads(Path(args.story).read_text(encoding="utf-8"))
        if not story.get("storyboard"):        # hand-made storyboards are used exactly as written
            story = repair(story)
    else:
        try:
            queue = ROOT / "horror" / "script_queue"
            done_ids = {x.split(":")[0] for x in hist["stories"]}
            approved = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(queue.glob("*.json"))]
            approved = [s for s in approved if s.get("approved") and s["id"] not in done_ids]
            if approved:                                # Praveen's approved scripts, word for word, in order
                script = approved[0]
                log(f"Approved script: {script['id']} ({len(approved)} left in the queue)")
                story = write_story(cfg, hist["stories"], script=script)
                story["part"] = script.get("part")
                story["script_pair"] = script.get("pair")
                story["min_len"] = 93                   # Praveen's rule: every Short at least 1:30
            elif hcfg.get("approved_scripts_only"):
                log("No approved script left in horror/script_queue: skipping this Short (add scripts to continue)")
                return
            else:
                part_of = hist.get("open_part")             # yesterday's cliffhanger gets its Part 2 next
                story = write_story(cfg, hist["stories"], part_of=part_of)
                story["part"] = 2 if part_of else 1
            tag = f"(Part {story['part']})"
            if tag.lower() not in story["title"].lower():          # the writer sometimes forgets: viewers need it
                t = story["title"]
                cut = t.lower().find(" #")
                story["title"] = (t[:cut] + f" {tag}" + t[cut:]) if cut > 0 else f"{t} {tag}"
        except Exception as exc:
            # Gemini down: use an original backup story that has not been posted yet
            used = {x.split(":")[0] for x in hist["stories"]}
            bank = [p for p in sorted((ROOT / "horror" / "stories" / "bank").glob("*.json"))
                    if json.loads(p.read_text(encoding="utf-8")).get("story_id") not in used]
            if not bank:
                raise
            pick = random.choice(bank)
            log(f"Gemini failed ({exc}); using backup story {pick.name}")
            story = repair(json.loads(pick.read_text(encoding="utf-8")))
    (out / "story.json").write_text(json.dumps(story, indent=2, ensure_ascii=False), encoding="utf-8")

    seed = random.randint(0, 10_000)
    take = None
    if not args.voice_file and hcfg.get("acted_take", {}).get("enabled") and os.environ.get("GEMINI_API_KEY"):
        from autotube.voice import acted_take
        work.mkdir(parents=True, exist_ok=True)
        take = acted_take([b["line"] for b in story["beats"]], hcfg["acted_take"], work / "take")
    video, thumb, plan = hv.make_short(story, hcfg["voice"], work, seed,
                                       Path(args.voice_file) if args.voice_file else None, take=take)
    length = check_playable(video, 15, 175)   # Shorts may run up to 3 minutes

    full = latest_long_video()
    if story.get("part") == 2 and story.get("script_pair"):
        prev = next((v for v in reversed(hist["videos"]) if v.get("pair") == story["script_pair"]), None)
        if prev:
            story["description"] = f"Part 1: https://youtube.com/shorts/{prev['video_id']}\n" + story["description"]
    elif story.get("part") == 2 and hist.get("open_part", {}).get("video_id"):
        story["description"] = f"Part 1: https://youtube.com/shorts/{hist['open_part']['video_id']}\n" + story["description"]
    description = "\n".join([story["description"], "",
                             *([f"🎬 Full animated horror story: {full['title']} → https://youtu.be/{full['video_id']}", ""] if full else []),
                             "A Creepy Cartoon Tale: an original animated horror short. New horror Shorts every day.",
                             "", " ".join(hcfg.get("hashtags", ["#shorts", "#horror"]))])
    (out / "description.txt").write_text(description, encoding="utf-8")
    tags = list(dict.fromkeys(story.get("tags", []) + hcfg.get("extra_tags", [])))
    title = story["title"] if "#shorts" in story["title"].lower() else (story["title"] + " #shorts")[:100]

    if args.no_upload:
        log(f"Upload skipped. Files are in {out.name}/ ({length:.0f}s)")
        return

    from autotube.uploader import _client, upload
    # safety: never post a horror Short to the wrong channel
    me = _client("YT_HORROR_REFRESH_TOKEN").channels().list(part="snippet", mine=True).execute()
    names = [c["snippet"]["title"] for c in me.get("items", [])]
    want = hcfg.get("channel", "CreepyCartoonTales").lower().replace(" ", "")
    if not any(want in n.lower().replace(" ", "").replace(".", "") for n in names):
        raise SystemExit(f"YT_HORROR_REFRESH_TOKEN belongs to {names}, not {hcfg.get('channel')}. "
                         "Re-run get_youtube_token.py and pick CreepyCartoonTales.")
    ycfg = {"youtube": hcfg["youtube"], "channel": {"language": "en"}}
    video_id = upload(video, thumb, title, description, tags, ycfg, token_env="YT_HORROR_REFRESH_TOKEN")
    today = datetime.now(IST).strftime("%Y-%m-%d %H:%M")
    hist["stories"] = (hist["stories"] + [f"{story['story_id']}: {story['beats'][0]['line']}"])[-300:]
    hist["videos"] = (hist["videos"] + [{"date": today, "title": title, "video_id": video_id,
                                         "length": f"{length:.0f}s"}])[-300:]
    if story.get("script_pair"):
        hist["videos"][-1]["pair"] = story["script_pair"]
    if story.get("part") == 1 and not story.get("script_pair"):   # remember the cliffhanger: the next Short is its Part 2
        hist["open_part"] = {"title": title, "video_id": video_id, "lines": [b["line"] for b in story["beats"]]}
    elif story.get("part") == 2 and not story.get("script_pair"):
        hist.pop("open_part", None)
    hist_path.parent.mkdir(parents=True, exist_ok=True)
    hist_path.write_text(json.dumps(hist, indent=2, ensure_ascii=False), encoding="utf-8")
    log(f"Horror Short uploaded: https://youtube.com/shorts/{video_id}")
    from autotube.localize import add_languages, subtitle_lines
    add_languages(cfg, video_id, title, description, subtitle_lines(story, plan))

    # the same Short goes to Instagram as a Reel (skipped quietly if IG_ACCESS_TOKEN is not set)
    from autotube.instagram import ig_caption, publish_reel
    ig_id = publish_reel(video, ig_caption(title, story.get("description", ""),
                                           hcfg.get("instagram_hashtags", ["#horror", "#reels"])))
    if ig_id:
        hist["videos"][-1]["instagram_id"] = ig_id
        hist_path.write_text(json.dumps(hist, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
