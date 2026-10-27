"""Make (and upload) today's Milo story episode, plus short clips from it.

The episode is the channel's main daily video. Each scene is a 3D cartoon and every
character speaks in their own voice. Two vertical Shorts are cut from the best scenes
and point viewers back to the full episode.
"""
import argparse
import copy
import hashlib
import json
import shutil
import time
from datetime import datetime, timedelta, timezone

from google import genai
from google.genai import types

from autotube import rhymes_video as rv
from autotube.scene3d import CHARACTERS, SETTINGS
from autotube.script_writer import pick_models
from autotube.uploader import upload
from autotube.util import ROOT, env, load_config, log

IST = timezone(timedelta(hours=5, minutes=30))
SPEAKERS = ["narrator", "milo", "pippa", "friend", "mum"]

PROMPT = """Write one original, funny animated story episode for the English kids channel "{channel}", for children aged 2-5.
The channel's series is "Milo the Mouse": Milo is a curious little mouse and Pippa is his cheerful parrot friend.

Episode title must be different from these recent titles: {used}
Tell a complete story: a warm opening, a silly problem, two funny attempts that fail, a kind resolution, and a gentle lesson.
Use simple spoken English, gentle humour, safe situations, playful sounds (squeak, boing, splash), and a repeated catchphrase children can join in with.
Make exactly {scenes} scenes. Each scene has 3 to 5 spoken lines, each line 3 to 12 words. Keep the events and characters consistent across scenes.

Every line must say who speaks it. Use ONLY these speakers: {speakers}
("milo" is Milo the mouse, "pippa" is Pippa the parrot, "friend" is any other animal character, "mum" is a grown-up, "narrator" tells the story.)
Give most lines to milo and pippa so it sounds like a cartoon, not a reading.

The episode is a 3D cartoon. In each scene list who is on screen using ONLY these ids: {ids}
(Milo is "mouse", Pippa is "parrot"; put the scene's main speaker first, at most 3 ids). Pick each scene's setting from: {settings}.
No scary scenes, unsafe imitation, violence, insults, brands, copyrighted characters, famous song lyrics, or requests to like/subscribe.

Return only JSON in this schema:
{{"episode_title":"short story name",
 "youtube_title":"searchable title under 90 characters, e.g. Milo and the Noisy Hiccups | Funny Story for Kids",
 "description":"3-4 friendly sentences for parents about today's story",
 "lesson":"the gentle lesson in a few words",
 "tags":["10 to 15 search tags"],
 "thumbnail_text":"2 to 4 fun words for the thumbnail",
 "best_scenes":[0,1],
 "scenes":[{{"title":"short scene heading","character":"English description of who is on screen","characters":["mouse","parrot"],"setting":"meadow","emoji":"one emoji","lines":[{{"who":"milo","text":"..."}}]}}]}}
"""


def fmt(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 60:02d}:{s % 60:02d}"


def seed_for(*parts) -> int:
    return int(hashlib.sha256("|".join(map(str, parts)).encode()).hexdigest()[:8], 16)


def clean(data: dict, wanted_scenes: int) -> dict:
    scenes = data.get("scenes", [])
    if not data.get("episode_title") or not (3 <= len(scenes) <= 8):
        raise ValueError("Story needs a title and 3-8 scenes")
    for scene in scenes:
        lines = []
        for line in scene.get("lines", []):
            if isinstance(line, dict):
                who, text = str(line.get("who", "narrator")).strip().lower(), str(line.get("text", "")).strip()
            else:
                who, text = "narrator", str(line).strip()
            if text:
                lines.append({"who": who if who in SPEAKERS else "narrator", "text": text})
        if not scene.get("title") or len(lines) < 2:
            raise ValueError("Each scene needs a title and at least 2 spoken lines")
        scene["lines"] = lines[:6]
        scene.setdefault("character", "Milo and Pippa")
        scene.setdefault("emoji", "🐭")
        chars = [c for c in scene.get("characters", []) if c in CHARACTERS] if isinstance(scene.get("characters"), list) else []
        scene["characters"] = chars or ["mouse", "parrot"]
        if scene.get("setting") not in SETTINGS:
            scene.pop("setting", None)
    data["scenes"] = scenes
    best = [i for i in data.get("best_scenes", []) if isinstance(i, int) and 0 <= i < len(scenes)]
    data["best_scenes"] = list(dict.fromkeys(best)) or [min(1, len(scenes) - 1)]
    data.setdefault("youtube_title", data["episode_title"])
    data.setdefault("thumbnail_text", data["episode_title"][:28])
    data.setdefault("lesson", "being kind")
    data.setdefault("tags", [])
    return data


def story(client, models, channel, used, scenes):
    prompt = PROMPT.format(channel=channel, used=", ".join(used[-30:]) or "none", scenes=scenes,
                           speakers=", ".join(SPEAKERS), ids=", ".join(CHARACTERS),
                           settings=", ".join(SETTINGS))
    last = None
    for attempt in range(5):
        try:
            model = models[min(attempt, len(models) - 1)]
            response = client.models.generate_content(
                model=model, contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.95),
            )
            data = clean(json.loads(response.text), scenes)
            log(f"Story written by {model}: {data['episode_title']} ({len(data['scenes'])} scenes)")
            return data
        except Exception as exc:
            last = exc
            log(f"Story attempt {attempt + 1} failed: {exc}")
            if attempt < 4:  # Gemini is often just busy; wait before trying the next model
                time.sleep(20 * (attempt + 1))
    raise RuntimeError(f"Could not generate a valid story: {last}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-upload", action="store_true")
    args = parser.parse_args()
    cfg = load_config()
    cfg["channel"]["language"] = "en"
    ec = cfg.get("episodes", {})
    channel = cfg["channel"]["name"]
    today = datetime.now(IST).strftime("%Y-%m-%d")
    out = ROOT / "output_episodes"
    shutil.rmtree(out, ignore_errors=True)
    (out / "work").mkdir(parents=True)
    history_path = ROOT / "data" / "episode_history.json"
    history = json.loads(history_path.read_text(encoding="utf-8")) if history_path.exists() else {"titles": [], "episodes": []}

    client = genai.Client(api_key=env("GEMINI_API_KEY"))
    models = pick_models(client, cfg["ai"].get("gemini_model", "auto"))
    data = story(client, models, channel, history["titles"], int(ec.get("scenes", 6)))
    (out / "script.json").write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    # 1. the episode: one 3D scene after another
    clips, chapters, elapsed = [], [], 0.0
    for number, scene in enumerate(data["scenes"], start=1):
        log(f"Scene {number}/{len(data['scenes'])}: {scene['title']}")
        clip = out / "work" / f"scene_{number}.mp4"
        seconds = rv.render_rhyme(scene, "en", cfg, out / "work" / f"scene_{number}", clip, False,
                                  seed_for(today, number, scene["title"]), channel, show_next=False)
        chapters.append((elapsed, scene["title"]))
        clips.append(clip)
        elapsed += seconds
    video = rv.join(clips, out / "episode.mp4")
    log(f"Episode ready ({fmt(elapsed)})")

    first_char = out / "work" / "scene_1" / "char_640.png"
    thumb = rv.thumbnail(data["thumbnail_text"], "en", first_char, seed_for(today, "thumb"),
                         out / "thumbnail.jpg", channel)
    tags = list(dict.fromkeys(data.get("tags", []) + ["milo the mouse", "kids stories", "bedtime stories",
                                                      "story for kids", "cartoon for toddlers"]))
    description = "\n".join([
        data["description"], "",
        f"A gentle story about {data['lesson']}.", "",
        "Scenes in this episode"] +
        [f"{fmt(at)} {name}" for at, name in chapters] +
        ["", "A brand new Milo the Mouse story every day. Original animated stories written for little ones.",
         "", "#kidsstories #cartoon #bedtimestories"])
    (out / "description.txt").write_text(description, encoding="utf-8")

    # 2. Shorts from the best scenes (these are what bring new subscribers)
    short_files = []
    for n, index in enumerate(data["best_scenes"][:int(ec.get("shorts", 2))], start=1):
        scene = data["scenes"][index]
        path = out / f"short_{n}.mp4"
        log(f"Short {n}: {scene['title']}")
        rv.render_rhyme(scene, "en", cfg, out / "work" / f"scene_{index + 1}", path, True,
                        seed_for(today, "short", index), channel, show_next=False)
        short_files.append((index, path))

    if args.no_upload:
        log(f"Upload skipped. Episode and {len(short_files)} Shorts are in {out.name}/")
        return

    cfg["youtube"]["made_for_kids"] = True
    cfg["youtube"]["privacy"] = cfg["youtube"].get("privacy", "private")
    video_id = upload(video, thumb, data["youtube_title"][:95], description, tags, cfg)
    log(f"Episode uploaded: https://youtu.be/{video_id}")

    short_ids = []
    for index, path in short_files:
        scene = data["scenes"][index]
        title = f"{scene['title']} | Milo the Mouse #Shorts"[:95]
        short_desc = "\n".join([data["episode_title"], "",
                                f"Watch the full story: https://youtu.be/{video_id}", "",
                                "#shorts #kidsstories #cartoon"])
        short_ids.append(upload(path, None, title, short_desc, tags, cfg))
    history["titles"] = (history["titles"] + [data["episode_title"]])[-200:]
    history["episodes"] = (history["episodes"] + [{"date": today, "title": data["episode_title"],
                                                   "video_id": video_id, "shorts": short_ids,
                                                   "length": fmt(elapsed), "lesson": data["lesson"]}])[-200:]
    history_path.write_text(json.dumps(history, indent=2, ensure_ascii=False), encoding="utf-8")
    log(f"Done: 1 episode + {len(short_ids)} Shorts.")


if __name__ == "__main__":
    main()
