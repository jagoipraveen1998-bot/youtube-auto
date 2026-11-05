"""Make a batch of horror Shorts in parallel and schedule them one per interval.

    python run_horror_batch.py write 20 batch/stories.json                         # 20 different stories
    python run_horror_batch.py make batch/stories.json 7 2026-11-06T09:00 60       # make #7, publish at 09:00 + 7*60 min IST
    python run_horror_batch.py history results/                                    # record uploads, pause the regular slots

The regular three-a-day Shorts skip themselves until the batch's last slot has gone out
(data/horror_pause_until.txt), so the channel never gets double posts.
"""
import json
import random
import shutil
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from autotube import horror_video as hv
from autotube.horror_writer import repair, write_story
from autotube.util import ROOT, check_playable, load_config, log

IST = timezone(timedelta(hours=5, minutes=30))
VILLAINS = ["doll", "shadow", "neighbour", "ghost", "tall", "delivery", "double"]
SETTINGS = ["a phone message", "the bathroom mirror", "the security camera", "the front door at night", "the wardrobe",
            "a window on a stormy night", "the kitchen at midnight", "a calendar that skips days", "a laptop late at night",
            "the hallway"]
HIST = ROOT / "data" / "horror_history.json"
PAUSE = ROOT / "data" / "horror_pause_until.txt"


def _hist():
    return json.loads(HIST.read_text(encoding="utf-8")) if HIST.exists() else {"stories": [], "videos": []}


def write(n: int, out: Path) -> None:
    cfg = load_config()
    hist = _hist()
    used = list(hist["stories"])
    stories, bank_used = [], {x.split(":")[0] for x in used}
    rnd = random.Random()
    for i in range(n):
        hint = (f"use the villain '{VILLAINS[i % len(VILLAINS)]}', centre the story on {SETTINGS[(i * 3) % len(SETTINGS)]}, "
                f"and give it a {rnd.choice(['boy', 'girl'])} hero")
        try:
            s = write_story(cfg, used, hint)
        except Exception as exc:
            bank = [p for p in sorted((ROOT / "horror" / "stories" / "bank").glob("*.json"))
                    if json.loads(p.read_text(encoding="utf-8")).get("story_id") not in bank_used]
            if not bank:
                log(f"Story {i + 1}: Gemini failed and no backup left ({exc}); stopping at {len(stories)}")
                break
            p = bank[0]
            s = repair(json.loads(p.read_text(encoding="utf-8")))
            bank_used.add(s["story_id"])
            log(f"Story {i + 1}: using backup {p.name}")
        used.append(f"{s['story_id']}: {s['beats'][0]['line']}")
        stories.append(s)
        log(f"Story {i + 1}/{n}: {s['title']}")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(stories, indent=1, ensure_ascii=False), encoding="utf-8")
    log(f"Wrote {len(stories)} stories to {out}")


def slot_time(start_ist: str, index: int, every_min: int) -> str:
    t = datetime.fromisoformat(start_ist).replace(tzinfo=IST) + timedelta(minutes=index * every_min)
    if t < datetime.now(IST) + timedelta(minutes=20):        # YouTube needs a future time
        t = datetime.now(IST) + timedelta(minutes=20 + index)
    return t.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def make(stories_file: Path, index: int, start_ist: str, every_min: int) -> None:
    cfg = load_config()
    hcfg = cfg["horror"]
    stories = json.loads(stories_file.read_text(encoding="utf-8"))
    if index >= len(stories):
        log(f"No story #{index} in this batch; nothing to do")
        return
    story = stories[index]
    out = ROOT / "output_horror"
    shutil.rmtree(out, ignore_errors=True)
    work = out / "work"
    work.mkdir(parents=True)
    video, thumb, plan = hv.make_video(story, work, random.randint(0, 10_000), "vertical")
    length = check_playable(video, 15, 90)
    description = "\n".join([story["description"], "",
                             "A Creepy Cartoon Tale: an original animated horror short. New horror Shorts every day.",
                             "", " ".join(hcfg.get("hashtags", ["#shorts", "#horror"]))])
    tags = list(dict.fromkeys(story.get("tags", []) + hcfg.get("extra_tags", [])))
    title = story["title"] if "#shorts" in story["title"].lower() else (story["title"] + " #shorts")[:100]
    when = slot_time(start_ist, index, every_min)

    from autotube.uploader import _client, upload
    me = _client("YT_HORROR_REFRESH_TOKEN").channels().list(part="snippet", mine=True).execute()
    names = [c["snippet"]["title"] for c in me.get("items", [])]
    want = hcfg.get("channel", "CreepyCartoonTales").lower().replace(" ", "")
    if not any(want in n.lower().replace(" ", "").replace(".", "") for n in names):
        raise SystemExit(f"YT_HORROR_REFRESH_TOKEN belongs to {names}, not {hcfg.get('channel')}.")
    ycfg = {"youtube": hcfg["youtube"], "channel": {"language": "en"}}
    video_id = upload(video, None, title, description, tags, ycfg, token_env="YT_HORROR_REFRESH_TOKEN", publish_at=when)
    res = ROOT / "results"
    res.mkdir(exist_ok=True)
    (res / f"r{index:02d}.json").write_text(json.dumps({
        "index": index, "video_id": video_id, "title": title, "publish_at": when, "length": f"{length:.0f}s",
        "story": f"{story['story_id']}: {story['beats'][0]['line']}"}), encoding="utf-8")
    log(f"#{index + 1} uploaded https://youtube.com/shorts/{video_id}, goes public {when}")


def history(results_dir: Path) -> None:
    hist = _hist()
    rows = sorted((json.loads(p.read_text(encoding="utf-8")) for p in results_dir.rglob("r*.json")), key=lambda r: r["index"])
    for r in rows:
        hist["stories"].append(r["story"])
        hist["videos"].append({"date": r["publish_at"], "title": r["title"], "video_id": r["video_id"],
                               "length": r["length"], "scheduled": True})
    hist["stories"] = hist["stories"][-300:]
    hist["videos"] = hist["videos"][-300:]
    HIST.write_text(json.dumps(hist, indent=2, ensure_ascii=False), encoding="utf-8")
    if rows:
        last = max(datetime.strptime(r["publish_at"], "%Y-%m-%dT%H:%M:%S.000Z").replace(tzinfo=timezone.utc) for r in rows)
        PAUSE.write_text(last.isoformat(), encoding="utf-8")
        log(f"Recorded {len(rows)} scheduled Shorts; regular slots pause until {last.astimezone(IST):%d %b %H:%M} IST")
    for r in rows:
        log(f"  {datetime.strptime(r['publish_at'], '%Y-%m-%dT%H:%M:%S.000Z').replace(tzinfo=timezone.utc).astimezone(IST):%d %b %H:%M}  "
            f"https://youtube.com/shorts/{r['video_id']}  {r['title']}")


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "write":
        write(int(sys.argv[2]), Path(sys.argv[3]))
    elif cmd == "make":
        make(Path(sys.argv[2]), int(sys.argv[3]), sys.argv[4], int(sys.argv[5]))
    elif cmd == "history":
        history(Path(sys.argv[2]))
