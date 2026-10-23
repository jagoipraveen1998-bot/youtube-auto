"""Generate and upload one original English preschool story episode."""
import argparse
import copy
import hashlib
import json
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path

from google import genai
from google.genai import types

from autotube import rhymes_video as rv
from autotube.script_writer import pick_models
from autotube.uploader import upload
from autotube.util import ROOT, env, load_config, log

IST = timezone(timedelta(hours=5, minutes=30))

PROMPT = """Write one original, funny animated story episode for the English kids channel "{channel}", for children aged 2-5.
Episode title must be different from these recent titles: {used}
Create a complete story with a clear beginning, a silly problem, two funny attempts, a kind resolution, and a gentle lesson.
Use simple spoken English, gentle humor, safe situations, and recurring characters Milo the curious mouse and Pippa the cheerful parrot.
Make 4 to 6 distinct scenes. Each scene has 3 to 5 short spoken lines, each line 3 to 10 words. Keep events and characters consistent.
No scary scenes, unsafe imitation, violence, insults, brands, copyrighted characters, famous song lyrics, or requests to like/subscribe.
Return only JSON in this schema:
{{"episode_title":"...","description":"...","lesson":"...","scenes":[{{"title":"short scene heading","character":"English character description","emoji":"one emoji","lines":["..."]}}]}}
Channel: {channel}
"""


def story(client, models, channel, used):
    prompt = PROMPT.format(channel=channel, used=", ".join(used[-30:]) or "none")
    last = None
    for attempt in range(5):
        try:
            model = models[min(attempt, len(models) - 1)]
            response = client.models.generate_content(
                model=model, contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.95),
            )
            data = json.loads(response.text)
            scenes = data.get("scenes", [])
            if not data.get("episode_title") or not (4 <= len(scenes) <= 6):
                raise ValueError("Story needs a title and 4-6 scenes")
            for scene in scenes:
                if not scene.get("title") or not scene.get("lines") or len(scene["lines"]) < 3:
                    raise ValueError("Each scene needs a title and at least 3 spoken lines")
                scene.setdefault("character", "Milo and Pippa in a garden")
                scene.setdefault("emoji", "🐭")
            return data
        except Exception as exc:
            last = exc
            log(f"Story generation attempt {attempt + 1} failed: {exc}")
        
    raise RuntimeError(f"Could not generate a valid story: {last}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-upload", action="store_true")
    args = parser.parse_args()
    cfg = load_config()
    cfg["channel"]["language"] = "en"
    out = ROOT / "output_episodes"
    shutil.rmtree(out, ignore_errors=True)
    (out / "work").mkdir(parents=True)
    history_path = ROOT / "data" / "episode_history.json"
    history = json.loads(history_path.read_text(encoding="utf-8")) if history_path.exists() else {"titles": [], "episodes": []}
    client = genai.Client(api_key=env("GEMINI_API_KEY"))
    models = pick_models(client, cfg["ai"].get("gemini_model", "auto"))
    data = story(client, models, cfg["channel"]["name"], history["titles"])
    (out / "script.json").write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    clips = []
    for number, scene in enumerate(data["scenes"], start=1):
        log(f"Episode scene {number}: {scene['title']}")
        clip = out / "work" / f"scene_{number}.mp4"
        rv.render_rhyme(scene, "en", cfg, out / "work" / f"scene_{number}", clip, False,
                        int(hashlib.sha256(f"{datetime.now(IST).date()}|{number}|{scene['title']}".encode()).hexdigest()[:8], 16),
                        cfg["channel"]["name"])
        clips.append(clip)
    video = rv.join(clips, out / "episode.mp4")
    first = out / "work" / "scene_1" / "char_640.png"
    thumb = rv.thumbnail(data["episode_title"][:36], "en", first, 19, out / "thumbnail.jpg", cfg["channel"]["name"])
    description = f"{data['description']}\n\nA gentle story about {data['lesson']}.\n\nOriginal animated story for children."
    (out / "description.txt").write_text(description, encoding="utf-8")
    if args.no_upload:
        log("Upload skipped; episode files are ready in output_episodes/")
        return

    cfg["youtube"]["made_for_kids"] = True
    date = datetime.now(IST).strftime("%Y-%m-%d")
    video_id = upload(video, thumb, data["episode_title"][:100], description, ["kids stories", "preschool stories", "funny story for kids"], cfg)
    history["titles"] = (history["titles"] + [data["episode_title"]])[-200:]
    history["episodes"] = (history["episodes"] + [{"date": date, "title": data["episode_title"], "video_id": video_id, "lesson": data["lesson"]}])[-200:]
    history_path.write_text(json.dumps(history, indent=2, ensure_ascii=False), encoding="utf-8")
    log(f"Episode uploaded: https://youtu.be/{video_id}")


if __name__ == "__main__":
    main()
