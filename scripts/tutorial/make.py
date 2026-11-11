"""HOW I MAKE A HORROR CARTOON EVERY DAY: the 5-minute tutorial video (landscape, Praveen's approved script).

Every line is Praveen's approved script, word for word. Each section is performed in one acted Gemini take
(storyteller voice), the takes are joined, and the video cuts on the real pauses.

    python scripts/tutorial/make.py            # writes output_long/video.mp4 + cover.jpg
"""
import json
import random
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from autotube.util import load_config, log  # noqa: E402
from autotube import horror_video as hv  # noqa: E402

TITLE = "How I Make a Horror Cartoon Every Day (Without Animating Anything Myself)"
HERO = dict(pose="stand", expr="calm")

# (scene, extra shot keys, [lines]) per section
SECTIONS = [
    ("tDesk", dict(spin=True, hero=dict(HERO, expr="worried")), [
        "Imagine you want to post a scary cartoon every single day.",
        "Writing. Voices. Drawing. Editing. Uploading. Every day.",
        "Sounds impossible, right?",
        "That's exactly what I thought.",
        "Then I built a little factory that does most of it for me.",
        "Today I'll show you how it works, step by step, so you can build your own."]),
    ("tBelt", dict(station="all"), [
        "Think of it like a conveyor belt.",
        "An idea goes in one end.",
        "A finished video comes out the other and posts itself.",
        "Six stations. Let's walk through each one."]),
    ("tStation", dict(station=0), [
        "Every video starts with a script, and the script is the most important part.",
        "I write my stories in a simple style that puts you, the viewer, inside the story.",
        "\"Imagine your dog comes home... wrong.\"",
        "Then a question at the end: \"What would you do?\"",
        "An AI writing assistant helps me draft and polish them.",
        "But here's the rule: nothing goes out until I've read it and approved it.",
        "If I don't love it, it doesn't get made.",
        "I keep a queue of approved scripts, so the factory always knows what's next."]),
    ("tStation", dict(station=1), [
        "Next, the voice.",
        "I use an AI voice that can act, not just read.",
        "It whispers when it's scary and pauses before the twist.",
        "The whole story is recorded in one take, so it sounds like one real person telling it.",
        "Then the computer finds the natural pauses and cuts the take into lines, so every picture lands exactly on its words."]),
    ("tStation", dict(station=2), [
        "This is the fun part.",
        "My characters are drawn with code, so they can walk, run, sweat, tilt their heads and stand on two legs.",
        "The backgrounds are painted pictures of our own little town.",
        "A library of streets, kitchens, parks and parking lots that grows every night.",
        "And my number-one rule: if the line says it, the viewer has to see it.",
        "If the story says \"the door slowly opens,\" the door opens on screen.",
        "If it says \"dog,\" a dog is there, acting it out."]),
    ("tStation", dict(station=3), [
        "Then sound.",
        "Quiet room noise, creepy music that builds, and a hit right on the scare.",
        "Big captions, two or three words at a time, with one key word in yellow, because lots of people watch with the sound off."]),
    ("tStation", dict(station=4), [
        "Here's the magic.",
        "All of this runs on a schedule in the cloud, three times a day, even while I'm asleep.",
        "When the video is ready, it uploads itself to YouTube with a title, description and tags, and adds translated titles so people in other languages can find it.",
        "Then it posts the same video to Instagram."]),
    ("tStation", dict(station=5), [
        "Automatic doesn't mean careless.",
        "After every video, the system checks itself: is the sound too loud, are the words on screen long enough, does it start with a hook?",
        "And I still watch.",
        "When something's wrong, like a dog that never showed up, we fix the factory, not just the video.",
        "So every video after that is better."]),
    ("tDesk", dict(tidy=True, hero=dict(HERO, expr="tired")), [
        "So that's it.",
        "Write great scripts. Give them a voice that acts. Show exactly what the words say. And let a schedule do the boring part.",
        "You don't need to be an animator.",
        "You just need a good story, and a little patience to build your factory.",
        "If this helped you, follow the channel.",
        "And tell me in the comments: what would your first story be?"]),
]
CAMS = ["wide", "push_in", "medium", "wide", "push_in"]


def story():
    beats, k = [], 0
    for si, (scene, keys, lines) in enumerate(SECTIONS):
        for li, line in enumerate(lines):
            b = dict(line=line, speaker="narrator", scene=scene, react="none", cam=CAMS[k % len(CAMS)], focus="wide",
                     hero=dict(keys.get("hero", HERO)), section=si)
            b.update({kk: v for kk, v in keys.items() if kk != "hero"})
            if scene == "tBelt" and li == len(lines) - 1:
                b["label"] = "6 STATIONS"
            beats.append(b); k += 1
        beats[-1]["gap"] = 0.8
    return {"title": TITLE, "storyboard": True, "plates": False, "captions": False, "outro_laugh": False,
            "cover_beat": 14, "cover_text": "MY VIDEO FACTORY", "hero": {"name": "creator"}, "beats": beats}


def main():
    import soundfile as sf
    from autotube.voice import acted_take
    cfg = load_config()
    out = ROOT / "output_long"; work = out / "work"; work.mkdir(parents=True, exist_ok=True)
    st = story()
    tcfg = dict(cfg["horror"]["acted_take"])
    tcfg["persona"] = ("a friendly, warm YouTube creator explaining how he makes his videos to other creators: "
                       "clear, upbeat, a little playful, with a hint of spooky drama on the horror examples")
    parts = []
    for si, (_, _, lines) in enumerate(SECTIONS):          # one acted take per section (10 requests fit the free day)
        wav = acted_take(lines, tcfg, work / f"take_{si}")
        if wav is None:
            raise SystemExit(f"Section {si + 1} could not be voiced today (Gemini free limit); run again after 13:30 IST")
        a, sr = sf.read(str(wav)); parts += [a if a.ndim == 1 else a.mean(1), np.zeros(int(1.1 * sr))]
    take = work / "take_all.wav"
    sf.write(str(take), np.concatenate(parts), sr)
    (out / "story.json").write_text(json.dumps(st, indent=1, ensure_ascii=False), encoding="utf-8")
    video, cover, plan = hv.make_video(st, work, random.randint(0, 9999), fmt="landscape", take=take, title="MY VIDEO FACTORY")
    log(f"Tutorial ready: {video} ({plan['frames'] / hv.FPS:.0f}s)")


if __name__ == "__main__":
    main()
