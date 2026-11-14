"""Shared sound pieces for 3D stories (all synthesised, our own). A story's sound.py does:

    import sys, pathlib; sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
    from soundkit import Mix
    def build(shots, total, FPS, SR):
        m = Mix(shots, total, FPS, SR, ids=[...])
        m.room(); m.creak(m.beat('creak'), 1.4); m.sting(m.beat('twist'))
        return m.done()
"""
import numpy as np
from scipy.signal import lfilter


class Mix:
    def __init__(self, shots, total, FPS, SR, ids, seed=5):
        self.SR, self.FPS = SR, FPS
        self.rng = np.random.default_rng(seed)
        self.N = int(total / FPS * SR)
        self.t = np.arange(self.N) / SR
        self.S = dict(zip(ids, shots))
        self.amb, self.sfx, self.mus = np.zeros(self.N), np.zeros(self.N), np.zeros(self.N)

    # ---- timing ----
    def a(self, id, off=0): return (self.S[id]['a'] + off) / self.FPS
    def b(self, id, off=0): return (self.S[id]['b'] + off) / self.FPS
    def beat(self, id, off=0): return (self.S[id]['beat'] + off) / self.FPS
    def span(self, t0, t1): return (self.t >= t0) & (self.t < t1)

    # ---- filters / noise ----
    def lp(self, x, fc):
        a = np.exp(-2 * np.pi * fc / self.SR)
        return lfilter([1 - a], [1, -a], lfilter([1 - a], [1, -a], x))
    def hp(self, x, fc): return x - self.lp(x, fc)
    def bp(self, x, lo, hi): return self.lp(self.hp(x, lo), hi)
    def nz(self, d): return self.rng.standard_normal(int(d * self.SR))
    def env(self, n, a, d): return np.minimum(1, np.arange(n) / max(1, a * self.SR)) * np.exp(-np.arange(n) / self.SR / d)

    def put(self, buf, at, x, g=1.0):
        i = int(at * self.SR); m = min(len(x), len(buf) - i)
        if i >= 0 and m > 0:
            buf[i:i + m] += x[:m] * g

    # ---- beds ----
    def room(self, g=0.6, mask=None):
        x = self.lp(self.nz(self.N / self.SR + 1)[:self.N], 180) * g
        self.amb += x if mask is None else x * mask
    def wind(self, g=0.7, mask=None):
        x = self.bp(self.nz(self.N / self.SR + 1)[:self.N], 150, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.17 * self.t + 1)) * g
        self.amb += x if mask is None else x * mask
    def hum(self, g=0.3, hz=50, mask=None):              # an old bulb / tube light buzz
        x = (np.sin(2 * np.pi * hz * 2 * self.t) + 0.4 * np.sin(2 * np.pi * hz * 4 * self.t)) * g
        self.amb += x if mask is None else x * mask
    def tape_hiss(self, t0, t1, g=0.5):                  # cassette hiss and a slow wobble
        m = self.span(t0, t1)
        self.amb += self.hp(self.nz(self.N / self.SR + 1)[:self.N], 3000) * g * m
        self.amb += np.sin(2 * np.pi * 0.9 * self.t) * self.lp(self.nz(self.N / self.SR + 1)[:self.N], 90) * g * 0.6 * m
    def drone(self, t0, t1, g=0.35, rise=8):
        t = self.t
        dr = np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.4 * t + np.sin(2 * np.pi * 0.2 * t)) + 0.3 * np.sin(2 * np.pi * 58.3 * t)
        self.mus += self.lp(dr, 300) * g * np.clip((t - t0) / rise, 0, 1) * (t < t1)

    # ---- hits ----
    def tick_clock(self, t0, t1, g=0.5):
        tick = self.hp(self.nz(0.012), 3000) * 2.5
        for s in np.arange(t0, t1, 1.0): self.put(self.sfx, s, tick, g)
    def click(self, at, g=1.0):                          # a button / latch / key
        n = int(0.05 * self.SR); tt = np.arange(n) / self.SR
        self.put(self.sfx, at, (self.hp(self.rng.standard_normal(n), 1500) * np.exp(-tt * 120) + np.sin(2 * np.pi * 900 * tt) * np.exp(-tt * 90) * 0.5) * g)
    def clunk(self, at, g=1.0):                          # a tape going into a deck, a drawer
        n = int(0.2 * self.SR); tt = np.arange(n) / self.SR
        self.put(self.sfx, at, (np.sin(2 * np.pi * 140 * tt) * np.exp(-tt * 30) + self.lp(self.rng.standard_normal(n), 1200) * np.exp(-tt * 45)) * g)
    def knock(self, at, g=1.0, n_=2, gap=0.4):
        for k in range(n_):
            n = int(0.16 * self.SR); tt = np.arange(n) / self.SR
            self.put(self.sfx, at + k * gap, (np.sin(2 * np.pi * 110 * tt) * np.exp(-tt * 40) + self.lp(self.rng.standard_normal(n), 900) * np.exp(-tt * 60) * 0.8) * g)
    def creak(self, at, d=1.3, g=0.8, pitch=180):
        n = int(d * self.SR); tt = np.arange(n) / self.SR; f0 = pitch + pitch / 2 * np.sin(2 * np.pi * 0.7 * tt)
        x = np.sign(np.sin(2 * np.pi * np.cumsum(f0) / self.SR)) * (0.5 + 0.5 * self.rng.random(n) ** 3)
        self.put(self.sfx, at, self.bp(x, 300, 2400) * np.sin(np.pi * tt / d) * 0.5 * g)
    def beeps(self, at, n_=4, gap=0.45, hz=1800, g=0.6):
        for k in range(n_):
            tt = np.arange(int(0.11 * self.SR)) / self.SR
            self.put(self.sfx, at + k * gap, np.sin(2 * np.pi * hz * tt) * np.minimum(1, (0.11 - tt) * 60) * g)
    def flicker(self, t0, t1, g=0.5):                    # bulb flicker buzz bursts
        for s in np.arange(t0, t1, 0.37):
            if self.rng.random() < 0.5:
                d = 0.05 + self.rng.random() * 0.12; tt = np.arange(int(d * self.SR)) / self.SR
                self.put(self.sfx, s, np.sign(np.sin(2 * np.pi * 100 * tt)) * self.lp(self.rng.standard_normal(len(tt)), 2500) * g * 0.6)
    def whoosh(self, at, d=0.8, g=0.6):
        n = int(d * self.SR); tt = np.arange(n) / self.SR
        self.put(self.sfx, at, self.bp(self.rng.standard_normal(n), 300, 2500) * np.sin(np.pi * tt / d) ** 2 * g)
    def sting(self, at, g=1.0):
        st = np.arange(int(4 * self.SR)) / self.SR
        x = (np.sin(2 * np.pi * (40 + 25 * np.exp(-st * 5)) * st) * np.exp(-st * 1.2) * 1.4 + self.hp(self.rng.standard_normal(len(st)), 2500) * np.exp(-st * 3) * 0.5
             + sum(np.sin(2 * np.pi * fq * st) for fq in (311, 330, 466)) * np.exp(-st * 0.9) * 0.15)
        self.put(self.mus, at, x * g)
    def music_box(self, t0, t1, notes=(76, 79, 81, 79, 76, 74, 76, 72, 74, 76, 79, 76, 74, 72, 74, 76), step=0.85, g=0.18, detune=1.0):
        for i, nn in enumerate(notes * 4):
            at = t0 + i * step
            if at + 0.4 > t1: break
            fq = 440 * 2 ** ((nn - 69) / 12) * detune; tt = np.arange(int(1.2 * self.SR)) / self.SR
            self.put(self.mus, at, (np.sin(2 * np.pi * fq * tt) + 0.35 * np.sin(2 * np.pi * fq * 2.01 * tt) + 0.15 * np.sin(2 * np.pi * fq * 3.98 * tt)) * np.exp(-tt * 3.2), g)
    def tail(self, t0, g=0.4):
        tt = np.arange(max(0, self.N - int(t0 * self.SR))) / self.SR
        self.put(self.mus, t0, self.lp(np.sin(2 * np.pi * 49 * tt), 200) * np.minimum(1, tt / 3), g)

    def done(self, amb=0.10, sfx=0.34, mus=0.26):
        norm = lambda x, p: x / max(1e-6, np.percentile(np.abs(x), 99.7)) * p if np.abs(x).max() > 0 else x
        return norm(self.amb, amb) + norm(self.sfx, sfx) + norm(self.mus, mus)
