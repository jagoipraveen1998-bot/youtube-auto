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


# ---------------------------------------------------------------- OmniVoice (designed voices)
_OMNI = None
_OMNI_OFF = False
_OMNI_REFS: dict[str, tuple[str, str]] = {}
REF_TEXT = "Some nights the house is quiet. Other nights, it listens back."
TAG = re.compile(r"\[[a-z\-]+\]")


def _omni_model():
    global _OMNI
    if _OMNI is None:
        import torch
        from omnivoice import OmniVoice
        torch.set_num_threads(max(1, __import__("os").cpu_count() or 2))
        _OMNI = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="cpu", dtype=torch.float32)
        log("OmniVoice ready")
    return _OMNI


def _omni_ref(instruct: str, key: str, workdir: Path) -> tuple[str, str]:
    """Design each character's voice once and reuse it, so every line sounds like the same person."""
    import soundfile as sf
    import torch
    import zlib

    ref_key = f"{key}|{instruct}"
    if ref_key not in _OMNI_REFS:
        torch.manual_seed(zlib.crc32(ref_key.encode()))     # same description -> same voice, every video
        audio = _omni_model().generate(text=REF_TEXT, instruct=instruct, num_step=32)
        path = workdir / f"ref_{zlib.crc32(ref_key.encode()):08x}.wav"
        sf.write(path, audio[0], SR)
        _OMNI_REFS[ref_key] = (str(path), REF_TEXT)
        log(f"Designed voice for {key}: {instruct}")
    return _OMNI_REFS[ref_key]


def _estimate_words(text: str, audio) -> list[dict]:
    """OmniVoice gives no word timings: place the words over the voiced parts of the audio, by length."""
    import numpy as np

    words = [w for w in TAG.sub(" ", text).split() if re.search(r"[A-Za-z0-9]", w)]
    if not words:
        return []
    hop = int(SR * 0.01)
    n = len(audio) // hop
    e = np.sqrt((np.asarray(audio[: n * hop]).reshape(n, hop) ** 2).mean(1)) if n else np.zeros(1)
    voiced = e > max(e.max() * 0.06, 1e-4)
    idx = np.flatnonzero(voiced)
    if not len(idx):
        return []
    times = idx * 0.01                                   # voiced moments in order
    weights = np.array([len(re.sub(r"[^A-Za-z0-9]", "", w)) + 1.5 for w in words], float)
    edges = np.concatenate([[0], np.cumsum(weights) / weights.sum()])
    pick = lambda q: float(times[min(len(times) - 1, int(q * (len(times) - 1)))])
    return [{"start": pick(edges[i]), "end": pick(edges[i + 1]), "text": w} for i, w in enumerate(words)]


def _omnivoice(text: str, vcfg: dict, out: Path) -> tuple[float, list[dict]]:
    import soundfile as sf

    ref_audio, ref_text = _omni_ref(vcfg["omni"], vcfg.get("omni_key", "voice"), out.parent)
    audio = _omni_model().generate(text=vcfg.get("omni_text") or text, ref_audio=ref_audio, ref_text=ref_text,
                                   num_step=int(vcfg.get("omni_steps", 16)), speed=float(vcfg.get("omni_speed", vcfg.get("speed", 1.0))))
    wav = out.with_name(out.stem + "_o.wav")
    sf.write(wav, audio[0], SR)
    words = _estimate_words(vcfg.get("omni_text") or text, audio[0])
    _encode(wav, out, float(vcfg.get("omni_semitones", 0.0)))
    wav.unlink(missing_ok=True)
    return media_duration(out), words


# ---------------------------------------------------------------- Gemini TTS (acted, emotional delivery)
_GEMINI_OFF = False
GEMINI_TTS_MODELS = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts"]


def _trim(a, thr=0.012, pad=0.04):
    import numpy as np
    idx = np.flatnonzero(np.abs(a) > thr)
    if not len(idx):
        return a
    p = int(pad * SR)
    return a[max(0, idx[0] - p): min(len(a), idx[-1] + p)]


_GEMINI_NEXT: dict = {}        # model -> earliest time the next request may go out (free tier is a few per minute)
_GEMINI_DEAD: set = set()      # models with no quota left today / not available on this key
GEMINI_CACHE = Path(__import__("os").environ.get("GEMINI_VOICE_CACHE", "voice_cache"))


def _quota_info(r) -> tuple[float, bool]:
    """From a 429 reply: how long Google asks us to wait, and whether the limit is a daily (or zero) one."""
    import re
    wait, daily = 0.0, False
    try:
        for d in r.json().get("error", {}).get("details", []):
            if "retryDelay" in d:
                wait = float(re.sub(r"[^0-9.]", "", d["retryDelay"]) or 0)
            for v in d.get("violations", []):
                q = (v.get("quotaId", "") + v.get("quotaMetric", "")).lower()
                if "perday" in q or "per_day" in q:
                    daily = True
    except Exception:
        pass
    if "limit: 0" in r.text:
        daily = True
    return wait, daily


def _gemini_tts(text: str, vcfg: dict, out: Path) -> tuple[float, list[dict]]:
    """An acted line: Gemini TTS performs the words with the character's voice and this line's emotion.

    Acted takes are cached (voice_cache/, kept between workflow runs), so a re-render only asks for new or
    changed lines. Requests are paced to the free-tier per-minute limit and wait as long as Google asks."""
    global _GEMINI_OFF
    import base64
    import hashlib
    import os
    import time
    import numpy as np
    import requests
    import soundfile as sf

    who = vcfg.get("persona", "a young man")
    style = vcfg.get("style") or "natural, conversational"
    voice = vcfg.get("gemini_voice", "Charon")
    prompt = (f"Voice: {who}. Delivery: {style}. Perform it like a real person reacting in the moment, "
              f"not like a narrator. Speak exactly these words and nothing else:\n{text}")
    key = hashlib.sha1(f"{voice}|{prompt}".encode()).hexdigest()[:20]
    cached = GEMINI_CACHE / f"{key}.wav"
    wav = out.with_name(out.stem + "_g.wav")
    if cached.exists():
        a, _ = sf.read(cached, dtype="float32")
        sf.write(wav, a, SR)
        words = _estimate_words(text, a)
        _encode(wav, out, float(vcfg.get("gemini_semitones", 0.0)))
        wav.unlink(missing_ok=True)
        log(f"Acted line (cached, {voice}): {text[:50]}")
        return media_duration(out), words

    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["AUDIO"], "speechConfig": {"voiceConfig": {
                "prebuiltVoiceConfig": {"voiceName": voice}}}}}
    last = None
    deadline = time.time() + 600            # up to 10 minutes per line before using the backup voice
    attempt = 0
    while time.time() < deadline:
        alive = [m for m in GEMINI_TTS_MODELS if m not in _GEMINI_DEAD]
        if not alive:
            _GEMINI_OFF = True
            raise RuntimeError(f"Gemini TTS: no model has quota left today ({last})")
        model = min(alive, key=lambda m: _GEMINI_NEXT.get(m, 0))   # the model that is free soonest
        pause = _GEMINI_NEXT.get(model, 0) - time.time()
        if pause > 0:
            time.sleep(pause)
        attempt += 1
        try:
            r = requests.post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                              headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"]}, json=body, timeout=120)
            _GEMINI_NEXT[model] = time.time() + 21          # about 3 requests a minute per model
            if r.status_code == 429:
                wait, daily = _quota_info(r)
                if daily:
                    _GEMINI_DEAD.add(model)
                    log(f"Gemini TTS ({model}): daily quota used up; not asking it again this run")
                else:
                    _GEMINI_NEXT[model] = time.time() + max(21, wait + 1)
                    log(f"Gemini TTS ({model}): busy, waiting {max(21, wait + 1):.0f}s")
                last = f"429 {r.text[:160]}"
                continue
            if r.status_code == 404 or "not supported" in r.text.lower():
                _GEMINI_DEAD.add(model)
                last = f"{r.status_code} {r.text[:160]}"
                continue
            if r.status_code in (400, 403):
                raise ValueError(f"{r.status_code} {r.text[:200]}")
            r.raise_for_status()
            part = r.json()["candidates"][0]["content"]["parts"][0]
            a = np.frombuffer(base64.b64decode(part["inlineData"]["data"]), dtype="<i2").astype(np.float32) / 32768.0
            a = _trim(a)
            if len(a) < SR * 0.2:
                raise RuntimeError("Gemini returned almost no audio")
            GEMINI_CACHE.mkdir(parents=True, exist_ok=True)
            sf.write(cached, a, SR)
            sf.write(wav, a, SR)
            words = _estimate_words(text, a)
            _encode(wav, out, float(vcfg.get("gemini_semitones", 0.0)))
            wav.unlink(missing_ok=True)
            log(f"Acted line ({model}, {voice}): {text[:50]}")
            return media_duration(out), words
        except ValueError as exc:                 # the request itself is refused: retrying will not help
            _GEMINI_OFF = True
            raise RuntimeError(f"Gemini TTS refused the request: {exc}")
        except Exception as exc:
            last = exc
            log(f"Gemini TTS ({model}) attempt {attempt} failed: {str(exc)[:160]}")
            time.sleep(min(30, 5 * attempt))
    raise RuntimeError(f"Gemini TTS failed after 10 minutes: {last}")


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
    global _KOKORO_OFF, _OMNI_OFF, _GEMINI_OFF
    vcfg = vcfg or {}
    if vcfg.get("gemini_voice") and not _GEMINI_OFF:
        try:
            return _gemini_tts(TAG.sub("", text).strip() if not vcfg.get("keep_tags") else text, vcfg, out)
        except Exception as exc:
            log(f"Gemini TTS unavailable ({exc}); this line uses the backup voice")
    if vcfg.get("omni") and not _OMNI_OFF:
        for attempt in range(2):
            try:
                return _omnivoice(text, vcfg, out)
            except Exception as exc:
                log(f"OmniVoice attempt {attempt + 1} failed: {exc}")
                if isinstance(exc, ImportError):
                    break
        _OMNI_OFF = True
        log("OmniVoice unavailable; using Kokoro for the rest of this run.")
    text = TAG.sub("", text).replace("  ", " ").strip()      # [laughter] etc. are OmniVoice-only
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
