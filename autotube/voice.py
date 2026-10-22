"""Step 3: turn text into speech (free Microsoft Edge voices) plus subtitle timings."""
import asyncio
import re
from pathlib import Path

from .util import log, media_duration

TICKS = 10_000_000  # edge-tts reports time in 100-nanosecond units


async def _speak(text: str, voice: str, rate: str, out: Path) -> list[dict]:
    import edge_tts

    try:
        com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    except TypeError:  # older edge-tts versions always send word boundaries
        com = edge_tts.Communicate(text, voice, rate=rate)
    words = []
    with open(out, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({
                    "start": chunk["offset"] / TICKS,
                    "end": (chunk["offset"] + chunk["duration"]) / TICKS,
                    "text": chunk["text"],
                })
    return words


def speak(text: str, cfg: dict, out: Path) -> tuple[float, list[dict]]:
    """Create `out` (mp3). Returns (duration_seconds, subtitle_cues)."""
    voice, rate = cfg["voice"]["name"], cfg["voice"].get("rate", "+0%")
    for attempt in range(3):
        try:
            words = asyncio.run(_speak(text, voice, rate, out))
            if out.exists() and out.stat().st_size > 1000:
                break
        except Exception as exc:
            log(f"TTS attempt {attempt + 1} failed: {exc}")
    else:
        raise RuntimeError("Text-to-speech failed 3 times")
    duration = media_duration(out)
    cues = words_to_cues(words, text, duration)
    return duration, cues


def words_to_cues(words: list[dict], text: str, duration: float, max_words: int = 7) -> list[dict]:
    """Group words into short subtitle lines."""
    if not words:  # no timings -> spread the sentences evenly over the audio
        return even_cues(text, duration, max_words)
    cues, group = [], []
    for w in words:
        group.append(w)
        if len(group) >= max_words or re.search(r"[.,!?;:]$", w["text"]):
            cues.append(_cue(group))
            group = []
    if group:
        cues.append(_cue(group))
    # keep each line on screen until the next one starts
    for a, b in zip(cues, cues[1:]):
        a["end"] = max(a["end"], min(b["start"], a["end"] + 0.6))
    return cues


def _cue(group: list[dict]) -> dict:
    return {"start": group[0]["start"], "end": group[-1]["end"],
            "text": " ".join(w["text"] for w in group)}


def even_cues(text: str, duration: float, max_words: int = 7) -> list[dict]:
    tokens = text.split()
    chunks = [" ".join(tokens[i:i + max_words]) for i in range(0, len(tokens), max_words)]
    total = sum(len(c) for c in chunks) or 1
    t, cues = 0.0, []
    for c in chunks:
        d = duration * len(c) / total
        cues.append({"start": t, "end": t + d, "text": c})
        t += d
    return cues
