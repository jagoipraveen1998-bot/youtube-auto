"""Narration for the GOAT football film: one acted Gemini take of all five scenes, saved as one WAV."""
import json, shutil, sys
from pathlib import Path
sys.path.insert(0, ".")
from autotube import voice

SCENES = [
    "Around the world, football fans are fighting over one question. Who is the GOAT? Kaito or Ren? "
    "It's like East versus West. Fire versus water. They're both great in their own ways.",
    "Kaito is strong. He built himself into a goal-scoring machine. Give him a little space and he's already past you. "
    "Then comes the shot. That's Kaito. Speed and power.",
    "On the other side, there's Ren. He stays calm. He was born with a special skill. Watch how close he keeps the ball. "
    "One little touch and the first defender is gone. Another change of direction and he's straight through to goal. "
    "Nobody can stop him. That's Ren's dribbling.",
    "They're the perfect example of great rivals. Two different ways to be great at the same game. "
    "But the fans are still fighting over who's best. One side says Kaito. The other side says Ren.",
    "In the end... only legends know. Barry Bunce.",
]
out = Path("football_out"); out.mkdir(exist_ok=True)
vcfg = {"gemini_voice": "Fenrir", "persona": "an energetic English football narrator, like a big match-day hype video",
        "style": "big, energetic, excited sports-documentary narration with clear diction. Each paragraph is a new scene: "
                 "leave a full TWO-SECOND silence between paragraphs. The last paragraph is a deadpan joke: say "
                 "'In the end... only legends know.' slowly and mysteriously, pause two seconds, then announce the final "
                 "name like a stadium announcer revealing a legend."}
voice._gemini_tts("\n\n".join(SCENES), vcfg, out / "narration.mp3")
cached = sorted(Path("voice_cache").rglob("*.wav"), key=lambda p: p.stat().st_mtime)[-1]
shutil.copy(cached, out / "narration.wav")
(out / "scenes.json").write_text(json.dumps(SCENES, indent=1))
print("narration saved", (out / "narration.wav").stat().st_size)
