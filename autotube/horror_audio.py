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


def music_bed(syn: Synth, total: float, stop: float, seed: int, box_on: bool = True) -> np.ndarray:
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
    while box_on and tt < stop - 0.3:
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
            _add(sfx, syn.whoosh(1.0, 150, 1200), fr(a), 0.35)
        if beat is None:
            continue
        tb = fr(beat)
        if react == "jolt":
            _add(sfx, syn.thud(50, 0.6), tb, 0.9)
            _add(sfx, syn.reverb(syn.stab([622, 659, 932], 1.2, 3)), tb, 0.45)
        elif react == "ring":
            if sh["scene"] in ("phone", "phone2"):
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
        elif react == "gag":
            n = int(0.42 * SR); t = np.arange(n) / SR
            whistle = np.sin(2 * np.pi * np.cumsum(np.linspace(380, 1500, n)) / SR) * np.sin(np.pi * t / t[-1]) ** 0.5
            _add(sfx, whistle, tb - 0.38, 0.45)
            n = int(0.7 * SR); t = np.arange(n) / SR
            boing = np.sin(2 * np.pi * (170 + 90 * np.sin(2 * np.pi * 11 * t) * np.exp(-t * 4)) * t) * np.exp(-t * 4.5)
            _add(sfx, boing, tb, 0.8)
        elif react == "droop":
            _add(sfx, syn.reverb(syn.thud(32, 2.0), 2.0, 0.3), tb, 1.1)
        elif react == "shutter":
            _add(sfx, syn.click(), tb, 1.0); _add(sfx, hp(syn.noise(int(0.09 * SR)), 2500) * np.exp(-np.arange(int(0.09 * SR)) / SR * 40), tb + 0.03, 0.8)
        elif react == "send":
            n = int(0.3 * SR); t = np.arange(n) / SR
            _add(sfx, np.sin(2 * np.pi * np.cumsum(np.linspace(500, 1400, n)) / SR) * np.sin(np.pi * t / t[-1]) * 0.6, tb)
        elif react == "buzz":
            buzz = lp(np.sign(np.sin(2 * np.pi * 150 * np.arange(int(0.4 * SR)) / SR)), 600) * 0.6
            for k in range(2): _add(sfx, buzz, tb + k * 0.6, 0.55)
        elif react == "slam":
            for k in (0, 0.3, 0.6): _add(sfx, lp(syn.thud(70, 0.45), 700), tb + k, 1.0); _add(sfx, syn.click(), tb + k, 0.5)
        elif react == "door_open":
            _add(sfx, syn.click(), tb - 0.1, 0.9)
            n = int(1.4 * SR); t = np.arange(n) / SR
            creak = bp(np.sin(2 * np.pi * (220 + 90 * np.sin(2 * np.pi * 2.2 * t)) * t) * (1 + syn.noise(n) * 0.4), 150, 2000) * np.sin(np.pi * t / t[-1])
            _add(sfx, creak, tb, 0.5)
            if sh.get("shoe") is not None:
                _add(sfx, lp(syn.thud(80, 0.3), 900), fr(beat + sh["shoe"]) + 0.25, 0.9)
        elif react == "shift":
            n = int(0.7 * SR); _add(sfx, bp(syn.noise(n), 200, 1200) * np.sin(np.pi * np.arange(n) / n), tb, 0.5)
        elif react == "slam1":              # one door slam, then the key turning
            _add(sfx, lp(syn.thud(60, 0.5), 600), tb, 1.0); _add(sfx, syn.click(), tb, 0.6)
            for dt in (0.55, 0.68):
                n = int(0.05 * SR); _add(sfx, bp(syn.noise(n), 1500, 6000) * np.exp(-np.arange(n) / SR * 80), tb + dt, 0.7)
        elif react == "chain":              # a sharp clink, then the chain rattling
            n = int(0.25 * SR); t = np.arange(n) / SR
            clink = sum(np.sin(2 * np.pi * fq * t) for fq in (1870, 2650, 3420)) * np.exp(-t * 18) / 3
            _add(sfx, clink, tb, 1.0)
            for k in range(7):
                m = int(0.08 * SR); tt = np.arange(m) / SR
                _add(sfx, bp(syn.noise(m), 1800, 6000) * np.exp(-tt * 40), tb + 0.25 + k * 0.09 + 0.02 * np.sin(k), 0.55 * (1 - k / 8))
            _add(sfx, lp(syn.thud(55, 0.4), 500), tb + 0.9, 0.6)
        elif react == "dome":
            _add(sfx, syn.click(), tb, 0.9)
        elif react == "circle":
            n = int(0.5 * SR); _add(sfx, bp(syn.noise(n), 1500, 4000) * np.sin(np.pi * np.arange(n) / n) ** 2, tb, 0.4)
        elif react == "pop":
            n = int(0.12 * SR); t = np.arange(n) / SR
            _add(sfx, np.sin(2 * np.pi * np.cumsum(np.linspace(700, 1300, n)) / SR) * np.exp(-t * 25), tb, 0.6)
        elif react == "hangup":
            for k in range(3): _add(sfx, syn.beep(480, 0.12, square=False), tb + k * 0.2, 0.4)
        elif react == "fake":              # bones clicking as the head tilts, then a low swell
            for k, dt in enumerate((0.0, 0.17, 0.29, 0.52, 0.66)):
                n = int(0.05 * SR); crack = hp(syn.noise(n), 1800) * np.exp(-np.arange(n) / SR * 120)
                _add(sfx, crack, tb + dt, 0.9); _add(sfx, lp(syn.thud(120, 0.12), 1500), tb + dt, 0.5)
        elif react == "sting":
            _add(sfx, syn.reverb(syn.stab([233, 247, 349, 370], 1.6, 2.2), 1.6, 0.5), tb, 0.6); _add(sfx, syn.thud(40, 1.0), tb, 1.0)
        elif react == "breath":
            for k in range(3):
                n = int(0.9 * SR); _add(sfx, lp(bp(syn.noise(n), 300, 2500), 1800) * np.sin(np.pi * np.arange(n) / n) ** 1.5, fr(a) + 0.2 + k * 1.15, 0.35)
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
    story_end = (plan["frames"] - plan.get("outro", 0)) / FPS
    n = int(0.6 * SR)
    _add(sfx, hp(syn.noise(n), 1500) * np.linspace(0, 1, n), story_end - 0.62, 0.4)
    if plan.get("intro"):        # logo sting: glitch burst + hit
        for k in range(3): _add(sfx, hp(syn.noise(int(0.05 * SR)), 1200), 0.02 + k * 0.06, 0.6)
        _add(sfx, syn.thud(48, 0.9), 0.1, 1.0)
        _add(sfx, syn.reverb(syn.stab([311, 330, 466], 0.9, 3.5), 1.4, 0.4), 0.1, 0.4)
    if plan.get("outro"):        # signature: low boom under the laugh, static cut at the very end
        _add(sfx, syn.reverb(syn.thud(30, 2.2), 2.0, 0.35), story_end, 1.0)
        _add(sfx, hp(syn.noise(int(0.3 * SR)), 1500), end - 0.32, 0.5)
    sfx[int((end - 0.02) * SR):] = 0
    return sfx


NUMBERS = {w: i for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen".split())}


def creak(syn: Synth, rng, dur: float = 0.45) -> np.ndarray:
    n = int(dur * SR); t = np.arange(n) / SR
    f0 = rng.uniform(140, 260)
    tone = np.sin(2 * np.pi * (f0 + 60 * np.sin(2 * np.pi * rng.uniform(3, 7) * t)) * t)
    grit = bp(syn.noise(n), 300, 2400) * 0.6
    return bp(tone * (1 + grit), 120, 2600) * np.sin(np.pi * t / t[-1]) ** 0.7


def story_sfx(syn: Synth, plan: dict) -> np.ndarray:
    """Real sounds for storyboarded Shorts: a creak on every counted stair, heartbeats, breathing under the stairs."""
    out = np.zeros(syn.n)
    rng = np.random.default_rng(11)
    for sh in plan["shots"]:
        if sh.get("creaks"):
            for a, _, w, _ in sh.get("caps") or []:
                if re.sub(r"[^a-z]", "", w.lower()) in NUMBERS:
                    _add(out, creak(syn, rng), a / FPS, 0.9)
            run = sh.get("countRun")
            if run:
                k = abs(run[1] - run[0]) + 1
                end = sh.get("beat") or sh["b"]
                for j in range(k):
                    _add(out, creak(syn, rng, 0.3), (sh["a"] + (end - sh["a"]) * j / k) / FPS, 0.7)
        if sh.get("heart"):
            t0, t1 = sh["a"] / FPS, sh["b"] / FPS
            tt = t0 + 0.1
            while tt < t1:
                _add(out, lp(syn.thud(48, 0.18), 300), tt, 1.0); _add(out, lp(syn.thud(44, 0.16), 300), tt + 0.22, 0.7)
                tt += 0.78
        if sh.get("breathe"):
            t0, t1 = sh["a"] / FPS, sh["b"] / FPS
            tt = t0 + 0.3
            while tt < t1 - 0.5:
                n = int(1.2 * SR); br = lp(bp(syn.noise(n), 150, 1200), 900) * np.sin(np.pi * np.arange(n) / n) ** 2
                _add(out, br, tt, 0.8); tt += 1.9
    return out


def ambience_track(syn: Synth, plan: dict) -> np.ndarray:
    """Room tone for scripted sets: the car engine and road, the radio, the gas station's buzzing light."""
    amb = np.zeros(syn.n)
    rng = np.random.default_rng(7)
    for sh in plan["shots"]:
        a, b = sh["a"] / FPS, sh["b"] / FPS
        n = int((b - a) * SR)
        if n <= 0:
            continue
        t = np.arange(n) / SR
        fade = np.minimum(1, np.minimum(t, (n / SR) - t) / 0.08)
        if sh["scene"] in ("car", "selfie") and not sh.get("parked"):
            road = lp(rng.standard_normal(n), 260) * 2.0 + np.sin(2 * np.pi * 42 * t) * 0.35
            _add(amb, road * fade, a, 1.0)
        if sh["scene"] == "station" or (sh["scene"] == "phone2" and sh.get("bg") == "station"):
            hum = lp(np.sin(2 * np.pi * 120 * t) + 0.5 * np.sin(2 * np.pi * 240 * t) + 0.25 * np.sign(np.sin(2 * np.pi * 120 * t)), 900)
            _add(amb, (hum * 0.35 + lp(rng.standard_normal(n), 500) * 0.4) * fade, a, 1.0)
        if sh["scene"] == "stairs":                    # an old house at night: low room tone and a slow clock
            tone = lp(rng.standard_normal(n), 180) * 0.8 + np.sin(2 * np.pi * 50 * t) * 0.05
            tick = np.zeros(n)
            for k in range(int((b - a) / 1.0) + 1):
                i = int(k * SR); m = int(0.012 * SR)
                if i + m < n: tick[i:i + m] += hp(rng.standard_normal(m), 3000) * 2.2
            _add(amb, (tone + tick) * fade, a, 1.0)
        if sh["scene"] == "kitchenB":              # fridge hum and a quiet house
            hum = lp(np.sin(2 * np.pi * 100 * t) + 0.4 * np.sin(2 * np.pi * 200 * t), 400) * 0.25 + lp(rng.standard_normal(n), 300) * 0.3
            _add(amb, hum * fade, a, 1.0)
        if sh["scene"] == "basement":              # damp concrete room tone, bulb buzz, the odd drip
            tone = lp(rng.standard_normal(n), 150) * 0.9 + np.sin(2 * np.pi * 120 * t) * 0.04
            for k in range(int((b - a) / 2.3)):
                i = int((0.8 + k * 2.3) * SR); m = int(0.06 * SR)
                if i + m < n: tone[i:i + m] += np.sin(2 * np.pi * 1400 * np.arange(m) / SR) * np.exp(-np.arange(m) / SR * 60) * 0.8
            _add(amb, tone * fade, a, 1.0)
        if sh.get("radio"):
            mel = [0, 4, 7, 9, 7, 4, 2, 4]
            out = np.zeros(n)
            for k in range(int((b - a) / 0.32)):
                fr0 = 330 * 2 ** (mel[k % len(mel)] / 12); nn = int(0.3 * SR); tn = np.arange(nn) / SR
                tone = np.sin(2 * np.pi * fr0 * tn) * np.exp(-tn * 6)
                i = int(k * 0.32 * SR); out[i:i + nn] += tone[: max(0, n - i)]
            _add(amb, bp(out, 400, 2500) * 0.8 * fade, a, 1.0)
    return amb


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
    drone = plan.get("music") == "drone"          # "real" style: no music-box tune, just a low drone
    music = music_bed(syn, total, stop, seed, box_on=not drone)
    sfx = sfx_track(syn, plan) + story_sfx(syn, plan)
    n = int(total * SR)
    pad = lambda x: np.pad(x, (0, max(0, n - len(x))))[:n]
    v, m, s = pad(voice), pad(music), pad(sfx)
    vr, vp = _grms(v), np.abs(v).max()
    m *= (vr * (0.32 if drone else 0.5)) / max(_grms(m), 1e-9)
    s *= (vr * 0.5) / max(_grms(s), 1e-9)
    if np.abs(s).max() > 0.7 * vp:
        s *= 0.7 * vp / np.abs(s).max()
    db = lambda x: 20 * np.log10(max(x, 1e-9))
    log(f"Mix: music {db(_grms(m)) - db(vr):+.1f} dB vs voice, sfx {db(_grms(s)) - db(vr):+.1f} dB, "
        f"sfx peak {np.abs(s).max() / vp:.2f}x voice peak")
    amb = pad(ambience_track(syn, plan))
    if np.abs(amb).max() > 0:
        amb *= (vr * 0.22) / max(_grms(amb), 1e-9)     # room tone sits well under the voices (about -13 dB)
    mix = v + m + s + amb
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
