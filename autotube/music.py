"""Original, copyright-free cheerful music: ukulele-style plucks, bass, bells and soft drums."""
import random
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np

SR = 44100
KEYS = {"C": 0, "D": 2, "F": 5, "G": 7, "A": -3}
# happy progressions (scale degrees as semitones from the key's root, major chords)
PROGRESSIONS = [
    [(0, "M"), (7, "M"), (9, "m"), (5, "M")],   # I V vi IV
    [(0, "M"), (5, "M"), (7, "M"), (0, "M")],   # I IV V I
    [(0, "M"), (9, "m"), (5, "M"), (7, "M")],   # I vi IV V
]


def _freq(semitone_from_a4: float) -> float:
    return 440.0 * 2 ** (semitone_from_a4 / 12)


@lru_cache(maxsize=256)
def _pluck(freq: float, dur: float = 0.7, bright: float = 0.996) -> np.ndarray:
    """Karplus-Strong plucked string."""
    n = int(SR * dur)
    period = max(2, int(SR / freq))
    rng = np.random.default_rng(int(freq * 100))
    buf = rng.uniform(-1, 1, period)
    out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = bright * 0.5 * (buf[i % period] + buf[(i + 1) % period])
    out *= np.linspace(1, 0.0, n) ** 0.5
    return out


def _bell(freq: float, dur: float = 0.9) -> np.ndarray:
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-t * 5)
    return env * (np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 7))


def _bass(freq: float, dur: float) -> np.ndarray:
    t = np.arange(int(SR * dur)) / SR
    env = np.minimum(1, t * 60) * np.exp(-t * 3)
    return env * (np.sin(2 * np.pi * freq * t) + 0.2 * np.sin(4 * np.pi * freq * t))


def _kick() -> np.ndarray:
    t = np.arange(int(SR * 0.25)) / SR
    f = 120 * np.exp(-t * 18) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)


def _shaker(rng, dur=0.06) -> np.ndarray:
    n = int(SR * dur)
    noise = rng.uniform(-1, 1, n)
    noise = np.diff(noise, prepend=0)          # brighter
    return noise * np.exp(-np.arange(n) / SR * 60)


def _clap(rng) -> np.ndarray:
    n = int(SR * 0.18)
    return rng.uniform(-1, 1, n) * np.exp(-np.arange(n) / SR * 22)


def _add(track: np.ndarray, sound: np.ndarray, at: float, gain: float) -> None:
    i = int(at * SR)
    if i >= len(track):
        return
    j = min(len(track), i + len(sound))
    track[i:j] += gain * sound[: j - i]


def make_music(path: Path, seconds: float, bpm: int, key: str, seed: int) -> Path:
    rng = np.random.default_rng(seed)
    prog = PROGRESSIONS[seed % len(PROGRESSIONS)]
    root = KEYS.get(key, 0) - 9                          # semitones from A4 to the key's C4-ish root
    beat = 60 / bpm
    bar = beat * 4
    n = int(SR * (seconds + 1))
    music = np.zeros(n)
    t, i = 0.0, 0
    while t < seconds:
        deg, quality = prog[i % len(prog)]
        third = 4 if quality == "M" else 3
        chord = [root + deg, root + deg + third, root + deg + 7]
        # ukulele strum pattern: down on 1, up-down on the "and"s
        for k, off in enumerate([0, 1, 1.5, 2.5, 3, 3.5]):
            notes = chord if k in (0, 3) else chord[1:]
            for s, semi in enumerate(notes):
                _add(music, _pluck(round(_freq(semi + 12), 2)), t + off * beat + s * 0.012, 0.16)
        _add(music, _bass(_freq(root + deg - 12), bar / 2), t, 0.35)
        _add(music, _bass(_freq(root + deg - 12 + 7), bar / 2), t + bar / 2, 0.25)
        for b in range(4):
            _add(music, _kick(), t + b * beat, 0.45 if b in (0, 2) else 0.0)
            if b in (1, 3):
                _add(music, _clap(rng), t + b * beat, 0.12)
            for h in (0, 0.5):
                _add(music, _shaker(rng), t + (b + h) * beat, 0.05)
        # little bell melody every other bar
        if i % 2 == 1:
            scale = [0, 2, 4, 7, 9, 12]
            for b in range(4):
                if rng.random() < 0.7:
                    _add(music, _bell(_freq(root + deg + int(rng.choice(scale)) + 24)), t + b * beat, 0.10)
        t += bar
        i += 1
    music = music[: int(SR * seconds)]
    fade = int(SR * 1.5)
    music[-fade:] *= np.linspace(1, 0, fade)
    music /= max(1e-6, np.max(np.abs(music))) / 0.8
    stereo = np.stack([music, np.roll(music, 90)], axis=1)   # slight width
    pcm = (stereo * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return path


def pick_style(seed: int) -> tuple[int, str]:
    r = random.Random(seed)
    return r.choice([96, 100, 104, 108]), r.choice(list(KEYS))
