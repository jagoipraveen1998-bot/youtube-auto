"""Turn text into speech.

Kokoro (free, open source, natural sounding) is used first; the Microsoft Edge
voices are kept as an automatic backup so a video is never lost to a TTS problem.
Every character can have its own voice and pitch, which is what makes a story
sound like a cartoon instead of one person reading aloud.
"""
import asyncio
import re
import wave
from pathlib import Path

from .util import log, media_duration, run

TICKS = 10_000_000  # edge-tts reports time in 100-nanosecond units
SR = 24_000         # Kokoro's sample rate
_PIPELINES: dict[str, object] = {}
_KOKORO_OFF = False


# ---------------------------------------------------------------- voices per character
def voice_for(vcfg: dict, who: str | None) -> dict:
    """Voice settings for one speaker ("narrator", "milo", ...), falling back to the default."""
    vcfg = vcfg or {}
    part = (vcfg.get("cast") or {}).get((who or "").strip().lower()) if who else None
    if isinstance(part, str):
        part = {"kokoro_voice": part}
    return {**vcfg, **(part or {})}


# ---------------------------------------------------------------- Kokoro
def _pipeline(lang_code: str):
    if lang_code not in _PIPELINES:
        from kokoro import KPipeline
        _PIPELINES[lang_code] = KPipeline(lang_code=lang_code, repo_id="hexgrad/Kokoro-82M")
        log(f"Kokoro voice ready ({lang_code})")
    return _PIPELINES[lang_code]


def _write_wav(samples, path: Path) -> None:
    import numpy as np

    pcm = (np.clip(np.concatenate(samples), -1.0, 1.0) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def _encode(wav: Path, out: Path, semitones: float) -> None:
    """wav -> mp3, shifting the pitch (not the speed) when a character needs it."""
    af = []
    if semitones:
        r = 2 ** (semitones / 12)
        af = ["-af", f"asetrate={int(SR * r)},aresample={SR},atempo={1 / r:.6f}"]
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav), *af,
         "-c:a", "libmp3lame", "-q:a", "3", str(out)])


def _kokoro(text: str, voice: str, lang_code: str, speed: float, semitones: float,
            out: Path) -> tuple[float, list[dict]]:
    import numpy as np

    pipe = _pipeline(lang_code)
    audio_parts, words, offset = [], [], 0.0
    for part in pipe(text, voice=voice, speed=speed):
        audio = part.audio
        if audio is None:
            continue
        audio = audio.detach().cpu().numpy() if hasattr(audio, "detach") else np.asarray(audio)
        for tok in (part.tokens or []):
            word = (getattr(tok, "text", "") or "").strip()
            start = getattr(tok, "start_ts", None)
            if not word or start is None:
                continue
            end = getattr(tok, "end_ts", None)
            words.append({"start": offset + float(start),
                          "end": offset + float(end if end is not None else start),
                          "text": word})
        audio_parts.append(audio)
        offset += len(audio) / SR
    if not audio_parts:
        raise RuntimeError("Kokoro produced no audio")
    wav = out.with_name(out.stem + "_k.wav")
    _write_wav(audio_parts, wav)
    _encode(wav, out, semitones)
    wav.unlink(missing_ok=True)
    if semitones:  # the pitch shift keeps the timing, but re-check the real length
        words = [w for w in words if w["start"] < media_duration(out) + 0.5]
    return media_duration(out), words


# ---------------------------------------------------------------- Edge (backup)
async def _speak(text: str, voice: str, rate: str, out: Path, pitch: str = "+0Hz") -> list[dict]:
    import edge_tts

    try:
        com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    except TypeError:  # older edge-tts versions always send word boundaries
        com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
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


def speak_words(text: str, voice: str, rate: str, pitch: str, out: Path) -> tuple[float, list[dict]]:
    """Edge voices. Creates "out" (mp3) and returns (duration_seconds, word timings)."""
    for attempt in range(4):
        try:
            words = asyncio.run(_speak(text, voice, rate, out, pitch))
            if out.exists() and out.stat().st_size > 500:
                return media_duration(out), words
        except Exception as exc:
            log(f"Edge TTS attempt {attempt + 1} failed: {exc}")
    raise RuntimeError(f"Text-to-speech failed for: {text[:40]}")


# ---------------------------------------------------------------- what callers use
def say(text: str, vcfg: dict, out: Path) -> tuple[float, list[dict]]:
    """Speak "text" in this character's voice. Returns (duration_seconds, word timings)."""
    global _KOKORO_OFF
    vcfg = vcfg or {}
    if vcfg.get("engine", "kokoro") == "kokoro" and not _KOKORO_OFF:
        for attempt in range(2):
            try:
                return _kokoro(text, vcfg.get("kokoro_voice") or "af_heart",
                               vcfg.get("kokoro_lang", "a"), float(vcfg.get("speed", 1.0)),
                               float(vcfg.get("semitones", 0.0)), out)
            except Exception as exc:
                log(f"Kokoro attempt {attempt + 1} failed: {exc}")
        _KOKORO_OFF = True  # don't keep retrying a broken install; use Edge for the rest
        log("Falling back to the Edge voices for the rest of this run.")
    return speak_words(text, vcfg.get("name", "en-US-AnaNeural"), vcfg.get("rate", "+0%"),
                       vcfg.get("pitch", "+0Hz"), out)


def speak(text: str, cfg: dict, out: Path) -> tuple[float, list[dict]]:
    """Old news-video helper. Creates "out" (mp3). Returns (duration_seconds, subtitle_cues)."""
    duration, words = say(text, cfg.get("voice", {}), out)
    return duration, words_to_cues(words, text, duration)


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
