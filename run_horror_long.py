"""Make (and publish) an 8-10 minute landscape horror cartoon from your own script.

    python run_horror_long.py scripts/my_story.txt               # make it and publish it on CreepyCartoonTales
    python run_horror_long.py scripts/my_story.txt --no-upload   # make it only (output_long/video.mp4)
    python run_horror_long.py --auto                              # Gemini writes a new 4-5 minute story (daily schedule)

See scripts/README.md for how to write the script.
"""
import argparse
import json
import random
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path

from autotube import horror_video as hv
from autotube.horror_long import chapters, plan_script
from autotube.util import ROOT, check_playable, load_config, log

IST = timezone(timedelta(hours=5, minutes=30))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script", nargs="?")
    ap.add_argument("--auto", action="store_true", help="let Gemini write a new 4-5 minute story")
    ap.add_argument("--no-upload", action="store_true")
    ap.add_argument("--title", default=None)
    args = ap.parse_args()

    cfg = load_config()
    hcfg = cfg["horror"]
    out = ROOT / "output_long"
    shutil.rmtree(out, ignore_errors=True)
    work = out / "work"
    work.mkdir(parents=True)
    lhist_path = ROOT / "data" / "horror_long_history.json"
    lhist = json.loads(lhist_path.read_text(encoding="utf-8")) if lhist_path.exists() else {"stories": [], "videos": []}

    if args.auto or not args.script:
        from autotube.horror_long_writer import write_long_script
        shist = ROOT / "data" / "horror_history.json"
        short_stories = json.loads(shist.read_text(encoding="utf-8")).get("stories", []) if shist.exists() else []
        written = write_long_script(cfg, lhist["stories"] + short_stories[-30:])
        path = out / f"{written['story_id']}.txt"
        path.write_text(written["script"], encoding="utf-8")
        if not args.title:
            args.title = written["title"]
    else:
        path = Path(args.script)
        if not path.exists():
            path = ROOT / "scripts" / args.script
        if not path.exists():
            raise SystemExit(f"Script not found: {args.script} (put it in the scripts/ folder)")

    if path.suffix == ".json":      # a fully storyboarded script: every shot already planned by hand
        story = json.loads(path.read_text(encoding="utf-8"))
        log(f"Storyboard: {len(story['beats'])} beats")
    else:
        story = plan_script(path.read_text(encoding="utf-8"), cfg)
    if args.title:
        story["title"] = args.title
    (out / "story.json").write_text(json.dumps(story, indent=2, ensure_ascii=False), encoding="utf-8")

    seed = random.randint(0, 10_000)
    video, thumb, plan = hv.make_video(story, work, seed, "landscape", title=story["title"])
    length = check_playable(video, 60, 60 * 60)
    chaps = chapters(plan)

    description = "\n".join(filter(None, [
        story["description"], "",
        ("Chapters:\n" + "\n".join(chaps) + "\n") if chaps else "",
        "A Creepy Cartoon Tale: an original animated horror story. Subscribe for new horror every day.", "",
        " ".join(h for h in hcfg.get("hashtags", []) if h != "#shorts")]))
    (out / "description.txt").write_text(description, encoding="utf-8")
    tags = list(dict.fromkeys(story.get("tags", []) + hcfg.get("extra_tags", []) + ["horror story animated", "scary story"]))
    title = story["title"].replace("#shorts", "").strip()[:100]
    log(f"Video ready: {length / 60:.1f} min, {len(chaps)} chapters")

    if args.no_upload:
        log(f"Upload skipped. Files are in {out.name}/")
        return

    from autotube.uploader import _client, upload
    me = _client("YT_HORROR_REFRESH_TOKEN").channels().list(part="snippet", mine=True).execute()
    names = [c["snippet"]["title"] for c in me.get("items", [])]
    want = hcfg.get("channel", "CreepyCartoonTales").lower().replace(" ", "")
    if not any(want in n.lower().replace(" ", "").replace(".", "") for n in names):
        raise SystemExit(f"YT_HORROR_REFRESH_TOKEN belongs to {names}, not {hcfg.get('channel')}.")
    ycfg = {"youtube": hcfg["youtube"], "channel": {"language": "en"}}
    video_id = upload(video, thumb, title, description, tags, ycfg, token_env="YT_HORROR_REFRESH_TOKEN")

    # long videos keep their own history file, so a Short finishing at the same time never conflicts with it
    lhist["stories"] = (lhist["stories"] + [f"{path.stem}: {title}"])[-200:]
    lhist["videos"] = (lhist["videos"] + [{"date": datetime.now(IST).strftime("%Y-%m-%d %H:%M"), "title": title,
                                           "video_id": video_id, "script": path.name,
                                           "length": f"{length / 60:.1f} min"}])[-200:]
    lhist_path.parent.mkdir(parents=True, exist_ok=True)
    lhist_path.write_text(json.dumps(lhist, indent=2, ensure_ascii=False), encoding="utf-8")
    log(f"Long video published: https://youtu.be/{video_id}")


if __name__ == "__main__":
    main()
