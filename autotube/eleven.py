"""The storyteller voice from ElevenLabs (Praveen, 19 Nov 2026: "use Jeremy voice from 11 labs").

One request per line, each told what came before and after it so the read flows as one story. Every request
returns the audio with character timings, so we know exactly when every line and every word is spoken: the lines
are joined with a short breath (the video cuts there) and the word times are saved for on-the-word visuals and
one-word captions.

Needs ELEVENLABS_API_KEY. Returns the take's WAV path, or None if ElevenLabs can't do it right now."""
from __future__ import annotations

import base64
import json
import os
import re
import time
from pathlib import Path

import numpy as np
import requests

API = "https://api.elevenlabs.io/v1"
JEREMY = "bVMeCyTHy58xNoL34h3p"          # ElevenLabs' premade "Jeremy": young American male, excited, narration
SR = 44100


def log(msg: str):
    print(f"[autotube] {msg}", flush=True)


def _h() -> dict:
    return {"xi-api-key": os.environ["ELEVENLABS_API_KEY"]}


def _voice_id(cfg: dict) -> str:
    if cfg.get("voice_id"):
        return cfg["voice_id"]
    name = cfg.get("voice", "Jeremy").lower()
    try:                                    # the account's own voices first (a voice Praveen added keeps its id)
        r = requests.get(f"{API}/voices", headers=_h(), timeout=30)
        for v in r.json().get("voices", []):
            if v.get("name", "").split(" ")[0].lower() == name:
                return v["voice_id"]
    except Exception as exc:
        log(f"ElevenLabs voice list failed ({exc})")
    return JEREMY


def _model(cfg: dict) -> str:
    if cfg.get("model"):
        return cfg["model"]
    try:                                    # the newest model this account can use for speech
        ids = [m["model_id"] for m in requests.get(f"{API}/models", headers=_h(), timeout=30).json() if m.get("can_do_text_to_speech")]
        for pref in ("eleven_v4", "eleven_v3", "eleven_multilingual_v2", "eleven_turbo_v2_5"):
            if pref in ids:
                return pref
        return ids[0]
    except Exception as exc:
        log(f"ElevenLabs model list failed ({exc})")
        return "eleven_multilingual_v2"


def _say(text: str, vid: str, model: str, prev: str, nxt: str, settings: dict) -> tuple[np.ndarray, list]:
    body = {"text": text, "model_id": model, "voice_settings": settings, "output_format": "pcm_44100"}
    if prev:
        body["previous_text"] = prev
    if nxt:
        body["next_text"] = nxt
    for attempt in range(4):
        r = requests.post(f"{API}/text-to-speech/{vid}/with-timestamps?output_format=pcm_44100", headers=_h(), json=body, timeout=180)
        if r.status_code == 400 and ("previous_text" in body or "next_text" in body):
            body.pop("previous_text", None); body.pop("next_text", None)      # some models don't take context
            continue
        if r.status_code in (429, 500, 502, 503):
            time.sleep(10 * (attempt + 1)); continue
        r.raise_for_status()
        j = r.json()
        pcm = np.frombuffer(base64.b64decode(j["audio_base64"]), dtype=np.int16).astype(np.float32) / 32768
        al = j.get("alignment") or {}
        chars = list(zip(al.get("characters", []), al.get("character_start_times_seconds", []), al.get("character_end_times_seconds", [])))
        return pcm, chars
    raise RuntimeError(f"ElevenLabs kept failing ({r.status_code}: {r.text[:160]})")


def _words(chars: list) -> list[tuple[str, float, float]]:
    out, cur, t0, t1 = [], "", None, None
    for c, a, b in chars:
        if re.match(r"[A-Za-z0-9']", c):
            if not cur:
                t0 = a
            cur += c; t1 = b
        elif cur:
            out.append((cur, t0, t1)); cur = ""
    if cur:
        out.append((cur, t0, t1))
    return out


def trim(a: np.ndarray, thr: float = 0.012) -> tuple[np.ndarray, int]:
    loud = np.where(np.abs(a) > thr)[0]
    if not len(loud):
        return a, 0
    s = max(0, loud[0] - int(0.03 * SR)); e = min(len(a), loud[-1] + int(0.06 * SR))
    return a[s:e], s


def eleven_take(lines: list[str], cfg: dict, out: Path) -> Path | None:
    """Every line read by the ElevenLabs voice, joined with a short breath; writes take.wav and take.words.json
    (per line: its start, end and every word's start/end in seconds on the take)."""
    if not os.environ.get("ELEVENLABS_API_KEY"):
        return None
    import soundfile as sf
    clean = [re.sub(r"\[[^\]]*\]", "", l.replace("*", "")).strip() for l in lines]
    gap = float(cfg.get("gap", 0.32))
    settings = {"stability": float(cfg.get("stability", 0.4)), "similarity_boost": float(cfg.get("similarity", 0.8)),
                "style": float(cfg.get("style", 0.45)), "use_speaker_boost": True, "speed": float(cfg.get("speed", 1.08))}
    try:
        vid, model = _voice_id(cfg), _model(cfg)
        log(f"ElevenLabs voice {cfg.get('voice', 'Jeremy')} ({vid}), model {model}")
        parts, info, t = [], [], 0.0
        for i, line in enumerate(clean):
            pcm, chars = _say(line, vid, model, " ".join(clean[max(0, i - 2):i]), " ".join(clean[i + 1:i + 2]), settings)
            pcm, cut = trim(pcm)
            off = cut / SR
            words = [(w, t + a - off, t + b - off) for w, a, b in _words(chars)]
            info.append({"line": line, "start": round(t, 3), "end": round(t + len(pcm) / SR, 3),
                         "words": [[w, round(a, 3), round(b, 3)] for w, a, b in words]})
            parts.append(pcm); t += len(pcm) / SR
            if i < len(clean) - 1:
                parts.append(np.zeros(int(gap * SR), np.float32)); t += gap
        audio = np.concatenate(parts)
        audio = audio / max(1e-6, np.abs(audio).max()) * 0.9
        out.parent.mkdir(parents=True, exist_ok=True)
        wav = out.with_suffix(".wav")
        sf.write(wav, audio, SR)
        out.with_suffix(".words.json").write_text(json.dumps(info, indent=1), encoding="utf-8")
        n = sum(len(l.split()) for l in clean)
        log(f"ElevenLabs take: {t:.1f} s, {n} words ({n / max(1, t):.2f} words/s)")
        return wav
    except Exception as exc:
        log(f"ElevenLabs take failed ({exc})")
        return None
