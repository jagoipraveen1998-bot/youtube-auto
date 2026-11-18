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
        self.amb, self.sfx, self.mus, self.bgm = np.zeros(self.N), np.zeros(self.N), np.zeros(self.N), np.zeros(self.N)

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
    # (no clock tick: Praveen found the every-second tick irritating)
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
    def birds(self, t0, t1, g=0.4):                    # morning birdsong: short chirps at random
        for s in np.arange(t0, t1, 0.45):
            if self.rng.random() < 0.55:
                n = int(0.09 * self.SR); tt = np.arange(n) / self.SR; f0 = 2600 + self.rng.random() * 1800
                ch = np.sin(2 * np.pi * (f0 + 900 * np.sin(2 * np.pi * 22 * tt)) * tt) * np.sin(np.pi * tt / tt[-1])
                self.put(self.amb, s + self.rng.random() * 0.3, ch, g * (0.4 + 0.6 * self.rng.random()))
    def traffic(self, g=0.4, mask=None):               # a town far away: low rumble, a car now and then
        x = self.lp(self.nz(self.N / self.SR + 1)[:self.N], 220) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.05 * self.t)) * g
        self.amb += x if mask is None else x * mask
    def engine(self, t0, t1, g=0.6):                   # a car arriving and idling
        m = self.span(t0, t1); tt = self.t
        rev = np.clip((tt - t0) / max(0.1, t1 - t0), 0, 1)
        x = self.lp(np.sign(np.sin(2 * np.pi * (38 - 10 * rev) * tt)) * 0.6 + self.nz(self.N / self.SR + 1)[:self.N] * 0.4, 400)
        self.sfx += x * g * m * np.minimum(1, (tt - t0) * 1.5)
    def siren_whoop(self, at, g=0.5):                  # one short police whoop, not a full siren
        tt = np.arange(int(0.9 * self.SR)) / self.SR; f = 500 + 700 * np.sin(np.pi * tt / 0.9)
        self.put(self.sfx, at, np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.sin(np.pi * tt / 0.9) * g)
    def phone_line(self, t0, t1, g=0.3):               # the faint crackle of a phone call
        m = self.span(t0, t1)
        self.amb += self.bp(self.nz(self.N / self.SR + 1)[:self.N], 900, 3000) * g * m
    def bark(self, at, g=0.7, n_=1, gap=0.38):         # a dog barking, muffled (outside a door)
        for k in range(n_):
            n = int(0.16 * self.SR); tt = np.arange(n) / self.SR
            x = np.sign(np.sin(2 * np.pi * (330 - 600 * tt) * tt)) * self.rng.random(n) + np.sin(2 * np.pi * 190 * tt)
            self.put(self.sfx, at + k * gap, self.bp(x, 250, 1400) * np.sin(np.pi * tt / tt[-1]) ** 0.6, g)
    def paws(self, t0, t1, g=0.35, step=0.22):         # claws tapping on a wooden floor
        for s in np.arange(t0, t1, step):
            n = int(0.03 * self.SR); tt = np.arange(n) / self.SR
            self.put(self.sfx, s, self.hp(self.rng.standard_normal(n), 1800) * np.exp(-tt * 160), g * (0.7 + 0.3 * self.rng.random()))
    def heartbeat(self, t0, t1, bpm0=58, bpm1=96, g=0.5):   # a low heartbeat that speeds up as the dread builds
        t = t0
        while t < t1:
            k = (t - t0) / max(0.1, t1 - t0); n = int(0.16 * self.SR); tt = np.arange(n) / self.SR
            th = np.sin(2 * np.pi * (58 - 60 * tt) * tt) * np.exp(-tt * 22)
            self.put(self.mus, t, th, g * (0.6 + 0.4 * k)); self.put(self.mus, t + 0.19, th, g * 0.6 * (0.6 + 0.4 * k))
            t += 60 / (bpm0 + (bpm1 - bpm0) * k)
    def score(self, t0=0.0, t1=None, seed=13, key=62, bar=4.0, quiet=(), style='strings'):
        if style != 'strings':
            return self.score_style(style, t0, t1, seed, key, quiet)
        return self._strings(t0, t1, seed, key, bar, quiet)

    def _level(self, tt, t0, quiet):
        lvl = np.ones(len(tt))
        for q0, q1, g in quiet:
            w = np.clip(np.minimum((tt + t0 - q0) / 1.5, (q1 - tt - t0) / 1.5), 0, 1)
            lvl = np.minimum(lvl, 1 - (1 - g) * w)
        return lvl

    def score_style(self, style, t0=0.0, t1=None, seed=13, key=62, quiet=()):
        """More of our own background music, all written here (no outside music):
        creepy  - low cello drone + slow heartbeat pulse + an out-of-tune music-box waltz, a sour note creeping in (default for horror)
        tension - the drone and pulse only, the sour note rising
        lullaby - the out-of-tune music box alone, slowly winding down
        piano   - slow, lonely minor piano chords with a few melody notes
        choir   - soft ghostly "ooh" voices, minor chords"""
        t1 = self.N / self.SR if t1 is None else t1
        rng = np.random.default_rng(seed); SR = self.SR
        hz = lambda n: 440 * 2 ** ((n - 69) / 12)
        n0, n1 = int(t0 * SR), int(t1 * SR); tt = np.arange(n1 - n0) / SR; D = tt[-1] if len(tt) else 0
        x = np.zeros(len(tt))
        def put(at, y, g=1.0):
            i = int(at * SR); x[i:i + len(y)] += y[:max(0, len(x) - i)] * g
        def box(f):
            s_ = np.arange(int(1.8 * SR)) / SR
            return (np.sin(2 * np.pi * f * s_) + .3 * np.sin(2 * np.pi * f * 2.01 * s_) + .12 * np.sin(2 * np.pi * f * 3.98 * s_)) * np.exp(-s_ * 3) * np.minimum(1, s_ / 0.004)
        def piano(f, d=5.0):
            s_ = np.arange(int(d * SR)) / SR
            return sum(a * np.sin(2 * np.pi * f * k * s_ * (1 + 0.0004 * k * k)) * np.exp(-s_ * (0.9 + 0.6 * k)) for k, a in ((1, 1), (2, .45), (3, .25), (4, .12))) * np.minimum(1, s_ / 0.003)
        if style in ('creepy', 'tension'):
            for f, g in ((hz(key - 24), 1), (hz(key - 17), .55), (hz(key - 12), .3)):
                x += g * self.lp(0.5 * np.sign(np.sin(2 * np.pi * f * tt)) + np.sin(2 * np.pi * f * tt), 500) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.11 * tt))
            x += 0.3 * np.sin(2 * np.pi * hz(key - 11) * tt) * np.clip((tt - D * 0.35) / (D * 0.5 + 1e-3), 0, 1)     # the sour minor second creeps in
            x /= max(1e-6, np.abs(x).max())
            for at in np.arange(0.5, D, 1.6 if style == 'creepy' else 1.3):
                s_ = np.arange(int(0.6 * SR)) / SR; put(at, np.sin(2 * np.pi * 52 * s_) * np.exp(-s_ * 9), 0.55)
        if style in ('creepy', 'lullaby'):
            tune = [key + 12, key + 15, key + 19, key + 17, key + 15, key + 14, key + 15, key + 12, key + 10, key + 12, key + 14, key + 15, key + 14, key + 12, key + 11, key + 12]
            at, i, g = (6.0 if style == 'creepy' else 1.0), 0, (0.35 if style == 'creepy' else 1.0)
            while at < D - 2:
                slow = 1 + 0.25 * max(0, (at - D * 0.6) / (D * 0.4 + 1e-3))
                put(at, box(hz(tune[i % 16]) * (1 - 0.007 * np.sin(i * 1.3))), g)
                if i % 3 == 0: put(at, box(hz(tune[i % 16] - 17)), g * 0.5)
                at += 0.66 * slow * (2 if style == 'creepy' and i % 4 == 3 else 1); i += 1
        if style == 'piano':
            seq = [(0, 12, 15), (-4, 8, 12), (-7, 5, 8), (-5, 7, 11)]
            for bar_ in range(int(D // 4)):
                ch = seq[bar_ % 4]; at = bar_ * 4.0
                for k, iv in enumerate(ch): put(at + 0.05 * k, piano(hz(key - 12 + iv)), (0.8, 0.4, 0.35)[k])
                if bar_ % 2: put(at + 2.0, piano(hz(key + 7 - int(rng.integers(0, 5))), 4), 0.5)
        if style == 'choir':
            chords = [(0, 3, 7), (-4, 0, 3), (-7, -4, 0), (-5, -1, 2)]
            for c in range(int(D // 8) + 1):
                a, b = int(c * 8 * SR), min(len(tt), int((c + 1) * 8 * SR + SR))
                if a >= len(tt): break
                s_ = tt[a:b] - tt[a]; env = np.minimum(1, s_ / 2) * np.minimum(1, (s_[-1] - s_ + 1e-3) / 2)
                for nn in chords[c % 4]:
                    f = hz(key + nn); v = sum(np.sin(2 * np.pi * f * k * s_ * (1 + 0.003 * np.sin(2 * np.pi * 5.2 * s_ + k))) / k ** 1.4 for k in range(1, 7))
                    x[a:b] += self.lp(v, 1200) * env
        x /= max(1e-6, np.abs(x).max())
        x *= np.minimum(1, tt / 3) * np.minimum(1, (D - tt + 1e-3) / 3)
        self.bgm[n0:n1] += x * self._level(tt, t0, quiet)

    def _strings(self, t0=0.0, t1=None, seed=13, key=62, bar=4.0, quiet=()):
        """Our own background music, written here note by note (no outside music): a slow minor-key string pad
        (i - VI - iv - V), a low drone and a sparse music-box melody picked from the chord tones. It sits in its own
        track (self.bgm) so it stays mild; quiet = [(t0, t1, level)] spans where it drops (daylight scenes)."""
        t1 = self.N / self.SR if t1 is None else t1
        rng = np.random.default_rng(seed)
        hz = lambda n: 440 * 2 ** ((n - 69) / 12)
        prog = [(0, 3, 7), (-4, 0, 3), (5, 8, 12), (7, 11, 14)]        # i, VI, iv, V in the key's minor
        n0, n1 = int(t0 * self.SR), int(t1 * self.SR)
        tt = np.arange(n1 - n0) / self.SR
        pad = np.zeros(len(tt)); chord_len = 2 * bar
        for c in range(int(np.ceil(len(tt) / self.SR / chord_len))):
            a, b = int(c * chord_len * self.SR), min(len(tt), int((c + 1) * chord_len * self.SR + self.SR))
            if a >= len(tt): break
            seg = tt[a:b] - tt[a]
            env = np.minimum(1, seg / 1.6) * np.minimum(1, (seg[-1] - seg + 1e-3) / 1.4)
            for k, iv in enumerate(prog[c % 4]):
                f = hz(key - 12 + iv)
                for det in (-0.004, 0.0, 0.005):                       # three slightly detuned voices = a soft string section
                    pad[a:b] += np.sin(2 * np.pi * f * (1 + det) * seg + k) * env * (0.5 if det else 0.7)
            pad[a:b] += 0.5 * np.sin(2 * np.pi * hz(key - 24 + prog[c % 4][0]) * seg) * env    # bass under each chord
        pad = self.lp(pad, 900) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.07 * tt))
        drone = self.lp(np.sin(2 * np.pi * hz(key - 24) * tt) + 0.4 * np.sin(2 * np.pi * hz(key - 17) * tt), 300) * 0.5
        box = np.zeros(len(tt)); at = 1.5
        while at < tt[-1] - 2:                                          # sparse melody: 1 note every 1.5-3 s, chord tones up high
            c = int(at // chord_len) % 4
            n = key + 12 + int(rng.choice(prog[c])) + int(rng.choice([0, 0, 12]))
            seg = np.arange(int(2.2 * self.SR)) / self.SR; f = hz(n)
            note = (np.sin(2 * np.pi * f * seg) + 0.3 * np.sin(2 * np.pi * f * 2.01 * seg) + 0.1 * np.sin(2 * np.pi * f * 3.98 * seg)) * np.exp(-seg * 2.4) * np.minimum(1, seg / 0.004)
            i = int(at * self.SR); box[i:i + len(note)] += note[:len(box) - i]
            at += rng.choice([1.5, 2.0, 2.0, 3.0])
        x = pad / max(1e-6, np.abs(pad).max()) + drone + 0.45 * box / max(1e-6, np.abs(box).max())
        x *= np.minimum(1, tt / 3) * np.minimum(1, (tt[-1] - tt + 1e-3) / 3)   # fade in and out
        lvl = np.ones(len(tt))
        for q0, q1, g in quiet:
            w = np.clip(np.minimum((tt + t0 - q0) / 1.5, (q1 - tt - t0) / 1.5), 0, 1)
            lvl = np.minimum(lvl, 1 - (1 - g) * w)
        self.bgm[n0:n1] += x * lvl

    def hush(self, t0, t1):                             # dead silence before a scare (applied when the mix is finished)
        self._hush = getattr(self, '_hush', []) + [(t0, t1)]
    def tail(self, t0, g=0.4):
        tt = np.arange(max(0, self.N - int(t0 * self.SR))) / self.SR
        self.put(self.mus, t0, self.lp(np.sin(2 * np.pi * 49 * tt), 200) * np.minimum(1, tt / 3), g)

    def done(self, amb=0.05, sfx=0.30, mus=0.26, bgm=0.07):  # background kept very low under the voice; bgm = the mild score
        for t0, t1 in getattr(self, '_hush', []):
            w = np.clip(np.minimum((t0 - self.t) / 0.25 + 1, (self.t - t1) / 0.02 + 1), 0, 1) if True else 1
            for b in (self.amb, self.mus, self.bgm): b *= np.where((self.t > t0 - 0.25) & (self.t < t1), w, 1.0)
        norm = lambda x, p: x / max(1e-6, np.percentile(np.abs(x), 99.7)) * p if np.abs(x).max() > 0 else x
        return norm(self.amb, amb) + norm(self.sfx, sfx) + norm(self.mus, mus) + norm(self.bgm, bgm)
