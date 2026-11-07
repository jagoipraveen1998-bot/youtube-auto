"""Try OmniVoice (k2-fsa) on a GitHub machine: a few designed voices for CreepyCartoonTales, saved as MP3s."""
import subprocess
import time
from pathlib import Path

import soundfile as sf
import torch
from omnivoice import OmniVoice

OUT = Path("omnivoice_samples")
OUT.mkdir(exist_ok=True)

SAMPLES = [
    ("1_calm_narrator", "male, middle-aged, very low pitch, american accent",
     "Imagine you've counted the stairs in your house every night for years. Thirteen. Always thirteen."),
    ("2_whisper_thing", "male, elderly, low pitch, whisper",
     "Fourteen."),
    ("3_funny_hero", "male, young adult, high pitch, american accent",
     "My reflection blinked half a second after I did. [laughter] I thought it was lag."),
    ("4_signature_laugh", "male, middle-aged, very low pitch",
     "Heh heh heh... [laughter]"),
    ("5_scared_girl", "female, young adult, american accent",
     "Joe. What are you doing? [sigh] Please, just get back in the car."),
]

t0 = time.time()
model = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="cpu", dtype=torch.float32)
print(f"model loaded in {time.time() - t0:.0f}s", flush=True)
for name, instruct, text in SAMPLES:
    t = time.time()
    audio = model.generate(text=text, instruct=instruct, num_step=16)
    wav = OUT / f"{name}.wav"
    sf.write(wav, audio[0], 24000)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(wav), "-b:a", "160k", str(wav.with_suffix(".mp3"))], check=True)
    wav.unlink()
    print(f"{name}: {len(audio[0]) / 24000:.1f}s of audio in {time.time() - t:.0f}s", flush=True)
