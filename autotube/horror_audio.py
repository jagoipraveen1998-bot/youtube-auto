"""Music bed + sound effects for a horror Short, generated from its shot plan, and the final mix.

Mix rule (kept from the hand-made "Six A.M."): the narration is never touched; the music bed sits at
50% of the voice level (-6 dB gated RMS) and the effects at 50% or less with peaks capped at 0.7x the
voice peak. One linear gain to about -14 LUFS plus a -1 dBFS limiter goes on the finished mix.
"""
import re
import subprocess
import wave
from pathlib import Path

import numpy as np

from .util import log, run

SR = 48000
FPS = 30


def load(path: Path) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def save(path: Path, x: np.ndarray) -> None:
    x = np.clip(x, -1, 1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


# ---------------------------------------------------------------- synths
def _butter(kind, fc):
    from scipy.signal import butter
    return butter(2, fc, kind, fs=SR, output="sos")


def lp(x, fc):
    from scipy.signal import sosfilt
    return sosfilt(_butter("low", fc), x)


def hp(x, fc):
    from scipy.signal import sosfilt
    return sosfilt(_butter("high", fc), x)


def bp(x, lo, hi):
    from scipy.signal import sosfilt
    return sosfilt(_butter("band", [lo, hi]), x)


class Synth:
    def __init__(self, seconds: float, seed: int):
        self.n = int(seconds * SR) + SR
        self.rng = np.random.default_rng(seed)

    def noise(self, n):
        return self.rng.standard_normal(n)

    def reverb(self, x, dec=1.6, mix=0.35):
        from scipy.signal import fftconvolve
        n = int(dec * SR)
        ir = lp(self.noise(n) * np.exp(-np.arange(n) / SR * 6.9 / dec), 5000)
        ir /= np.sqrt((ir ** 2).sum())
        return x * (1 - mix) + fftconvolve(x, ir)[: len(x)] * mix

    @staticmethod
    def env(n, a, d):
        t = np.arange(n) / SR
        return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)

    def beep(self, freq, dur=0.07, square=True):
        n = int(dur * SR); t = np.arange(n) / SR
        w = (np.sign(np.sin(2 * np.pi * freq * t)) * 0.6 + np.sin(2 * np.pi * freq * t) * 0.4) if square else np.sin(2 * np.pi * freq * t)
        e = np.minimum(1, t / 0.003) * np.minimum(1, (dur - t) / 0.005)
        return lp(w * e, 6000)

    def whoosh(self, dur=0.7, lo=300, hi=3000):
        n = int(dur * SR)
        return bp(self.noise(n), lo, hi) * np.sin(np.pi * np.arange(n) / n) ** 2

    @staticmethod
    def thud(f0=55, dur=0.5):
        t = np.arange(int(dur * SR)) / SR
        return np.sin(2 * np.pi * (f0 + 60 * np.exp(-t * 30)) * t) * np.exp(-t * 7)

    @staticmethod
    def bell(f0=2600, dur=1.2):
        t = np.arange(int(dur * SR)) / SR
        return sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * d) for a, r, d in [(1, 1, 4), (0.5, 2.76, 7), (0.3, 5.4, 11)])

    def click(self):
        n = int(0.03 * SR)
        return hp(self.noise(n), 2000) * np.exp(-np.arange(n) / SR * 200)

    @staticmethod
    def stab(freqs, dur=1.2, decay=3.0):
        t = np.arange(int(dur * SR)) / SR
        return sum(np.sin(2 * np.pi * f * t) for f in freqs) / len(freqs) * np.exp(-t * decay)

    def swell(self, dur=0.55):
        n = int(dur * SR)
        return hp(self.noise(n), 500) * (np.arange(n) / n) ** 3


def _add(buf, x, t, g=1.0):
    i = int(max(0.0, t) * SR)
    if i >= len(buf):
        return
    x = np.asarray(x)[: len(buf) - i]
    buf[i:i + len(x)] += g * x


def music_bed(syn: Synth, total: float, stop: float, seed: int) -> np.ndarray:
    n = syn.n
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    root = [55.0, 49.0, 58.27, 51.91][seed % 4]                      # A, G, A#, G# drones, varied per story
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t)
    drone = (np.sin(2 * np.pi * root * t) + 0.7 * np.sin(2 * np.pi * root * 1.007 * t)
             + 0.5 * np.sin(2 * np.pi * root * 1.5 * t + 1) + 0.25 * np.sin(2 * np.pi * root * 2.118 * t)) * lfo
    bed = (drone * 0.5 + lp(syn.noise(n), 400) * 0.6) * np.minimum(1, t / 1.5) * (t < stop)
    box = np.zeros(n)
    scale = [0, 3, 7, 10, 12, 8, 7, 3, 5, 2, 0, -1]
    step, k, tt = 0.62, 0, 0.4
    base_midi = 69 + [0, -2, 1, -1][seed % 4]
    rng.shuffle(scale)
    while tt < stop - 0.3:
        m = base_midi + scale[k % len(scale)] + (12 if (k // 12) % 2 else 0)
        f0 = 440 * 2 ** ((m - 69) / 12) * (1 + 0.004 * np.sin(k))
        nn = int(1.6 * SR); tn = np.arange(nn) / SR
        tone = (np.sin(2 * np.pi * f0 * tn) + 0.35 * np.sin(2 * np.pi * f0 * 2.01 * tn) + 0.12 * np.sin(2 * np.pi * f0 * 3.98 * tn)) * Synth.env(nn, 0.003, 0.45)
        _add(box, tone, tt, 0.55)
        k += 1
        tt += step * (1.5 if k % 4 == 0 else 1)
    out = syn.reverb(bed + box, 2.2, 0.4)
    post = (np.sin(2 * np.pi * root * 0.75 * t) + 0.4 * np.sin(2 * np.pi * root * 0.758 * t))
    out += post * np.clip((t - stop - 0.15) / 2.0, 0, 1) * (t > stop) * 0.9
    out[int(total * SR):] = 0
    return out


def sfx_track(syn: Synth, plan: dict) -> np.ndarray:
    sfx = np.zeros(syn.n)
    shots = plan["shots"]
    fr = lambda f: f / FPS
    seen_cctv = False
    for i, sh in enumerate(shots):
        a, beat, react = sh["a"], sh.get("beat"), sh.get("react", "none")
        if sh.get("jump"):
            _add(sfx, syn.whoosh(0.5, 800, 6000), fr(a) - 0.3, 0.5); _add(sfx, syn.thud(60, 0.4), fr(a), 0.6)
        if sh["scene"] == "cctv" and not seen_cctv:
            _add(sfx, hp(syn.noise(int(0.25 * SR)), 1500), fr(a), 0.45); seen_cctv = True
        if i == 0:
            _add(sfx, syn.whoosh(1.0, 150, 1200), 0.0, 0.35)
        if beat is None:
            continue
        tb = fr(beat)
        if react == "jolt":
            _add(sfx, syn.thud(50, 0.6), tb, 0.9)
            _add(sfx, syn.reverb(syn.stab([622, 659, 932], 1.2, 3)), tb, 0.45)
        elif react == "ring":
            if sh["scene"] == "phone":
                buzz = lp(np.sign(np.sin(2 * np.pi * 150 * np.arange(int(0.35 * SR)) / SR)), 600) * 0.6
                for k in range(3): _add(sfx, buzz, tb + k * 0.55, 0.5)
            else:
                for k in range(4): _add(sfx, syn.beep(1180), tb + k * 0.4, 0.5); _add(sfx, syn.beep(1180), tb + k * 0.4 + 0.11, 0.5)
        elif react == "knock":
            for k in (0, 0.3, 0.6): _add(sfx, lp(syn.thud(90, 0.25), 900), tb + k, 1.0)
        elif react in ("lights_on", "lights_off"):
            _add(sfx, syn.click(), tb, 1.0)
            if react == "lights_on":
                n = int(max(0.2, fr(sh["b"]) - tb) * SR); t = np.arange(n) / SR
                hum = (np.sin(2 * np.pi * 120 * t) + 0.5 * np.sin(2 * np.pi * 240 * t) + 0.3 * np.sign(np.sin(2 * np.pi * 120 * t))) * 0.08
                _add(sfx, lp(hum, 900) * np.minimum(1, t / 0.05), tb)
        elif react == "flicker":
            for k in range(6): _add(sfx, syn.click(), tb + k * 0.13, 0.6)
        elif react == "appear":
            _add(sfx, syn.swell(), tb - 0.55, 0.6); _add(sfx, syn.thud(45, 0.8), tb, 0.9)
        elif react == "vanish":
            _add(sfx, syn.whoosh(0.6, 300, 4000), tb, 0.6)
        elif react in ("turn", "grin"):
            _add(sfx, syn.whoosh(0.6, 150, 1200), tb - 0.1, 0.6)
            n = int(0.8 * SR); t = np.arange(n) / SR
            creak = bp(np.sin(2 * np.pi * (180 + 60 * np.sin(2 * np.pi * 3 * t)) * t) * (1 + syn.noise(n) * 0.3), 150, 1500) * np.sin(np.pi * t / t[-1])
            _add(sfx, creak, tb, 0.35)
        elif react == "droop":
            _add(sfx, syn.reverb(syn.thud(32, 2.0), 2.0, 0.3), tb, 1.1)
        elif react == "text_change":
            for k in range(4): _add(sfx, hp(syn.noise(int(0.04 * SR)), 1000), tb - 0.05 + k * 0.05, 0.5)
        if sh.get("twist"):
            _add(sfx, syn.swell(), tb - 0.55, 0.6)
            _add(sfx, syn.thud(36, 1.6), tb, 1.2)
            _add(sfx, syn.reverb(syn.stab([233, 247, 349, 370, 466], 2.5, 1.6), 2.0, 0.5), tb, 0.7)
    # heartbeat building into the twist
    tw = next((s for s in shots if s.get("twist")), None)
    if tw:
        start = max(0.0, fr(tw["a"]) - 3.0)
        for i, t0 in enumerate(np.arange(start, fr(tw.get("beat") or tw["a"]) - 0.3, 0.75)):
            g = 0.5 + 0.08 * i
            _add(sfx, lp(syn.thud(48, 0.35), 200), t0, g); _add(sfx, lp(syn.thud(44, 0.35), 200), t0 + 0.22, g * 0.7)
    last = shots[-1]
    if last.get("beat") is not None and not last.get("twist"):
        _add(sfx, syn.reverb(syn.thud(32, 2.0), 2.0, 0.3), fr(last["beat"]), 1.0)
    end = plan["frames"] / FPS
    n = int(0.6 * SR)
    _add(sfx, hp(syn.noise(n), 1500) * np.linspace(0, 1, n), end - 0.62, 0.4)
    sfx[int((end - 0.02) * SR):] = 0
    return sfx


def _grms(x):
    w = int(0.05 * SR); n = len(x) // w
    if n == 0:
        return 1e-6
    r = np.sqrt((x[:n * w].reshape(n, w) ** 2).mean(1) + 1e-12)
    g = r[r > r.max() * 10 ** (-30 / 20)]
    return float(np.sqrt((g ** 2).mean()))


def make_soundtrack(voice: np.ndarray, plan: dict, work: Path, seed: int) -> Path:
    """Voice untouched + music at -6 dB + SFX <= -6 dB, then -14 LUFS master. Returns master.wav."""
    total = plan["frames"] / FPS
    syn = Synth(total, seed)
    tw = next((s for s in plan["shots"] if s.get("twist")), None)
    stop = (tw["beat"] if tw and tw.get("beat") is not None else plan["frames"]) / FPS - 0.05
    music = music_bed(syn, total, stop, seed)
    sfx = sfx_track(syn, plan)
    n = int(total * SR)
    pad = lambda x: np.pad(x, (0, max(0, n - len(x))))[:n]
    v, m, s = pad(voice), pad(music), pad(sfx)
    vr, vp = _grms(v), np.abs(v).max()
    m *= (vr * 0.5) / max(_grms(m), 1e-9)
    s *= (vr * 0.5) / max(_grms(s), 1e-9)
    if np.abs(s).max() > 0.7 * vp:
        s *= 0.7 * vp / np.abs(s).max()
    db = lambda x: 20 * np.log10(max(x, 1e-9))
    log(f"Mix: music {db(_grms(m)) - db(vr):+.1f} dB vs voice, sfx {db(_grms(s)) - db(vr):+.1f} dB, "
        f"sfx peak {np.abs(s).max() / vp:.2f}x voice peak")
    mix = v + m + s
    mix /= max(1.0, np.abs(mix).max())
    raw = work / "mix.wav"
    save(raw, mix)
    meas = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw), "-af", "ebur128", "-f", "null", "-"],
                          capture_output=True, text=True).stderr
    found = re.findall(r"I:\s+(-?[\d.]+) LUFS", meas)
    gain = -14.0 - float(found[-1]) if found else 0.0
    master = work / "master.wav"
    run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-af",
         f"volume={gain:.2f}dB,alimiter=limit=0.891:attack=5:release=50:level=disabled", "-ar", str(SR), str(master)])
    log(f"Master gain {gain:+.1f} dB to about -14 LUFS")
    return master
