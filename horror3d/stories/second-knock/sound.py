"""Sound for the Second Knock set: room tone, clock, TV murmur, night wind, knocks, door creaks, a music box, the sting."""
import numpy as np
from scipy.signal import lfilter


def build(shots, total, FPS, SR):
    rng = np.random.default_rng(3)
    N = int(total / FPS * SR); t = np.arange(N) / SR
    lp1 = lambda x, fc: (lambda a: lfilter([1 - a], [1, -a], lfilter([1 - a], [1, -a], x)))(np.exp(-2 * np.pi * fc / SR))
    hp = lambda x, fc: x - lp1(x, fc)
    bp = lambda x, lo, hi: lp1(hp(x, lo), hi)
    nz = lambda d: rng.standard_normal(int(d * SR))
    env = lambda n, a, d: np.minimum(1, np.arange(n) / max(1, a * SR)) * np.exp(-np.arange(n) / SR / d)
    F = lambda f: f / FPS
    amb, sfx, mus = np.zeros(N), np.zeros(N), np.zeros(N)

    def put(buf, at, x, g=1.0):
        i = int(at * SR); m = min(len(x), len(buf) - i)
        if i >= 0 and m > 0:
            buf[i:i + m] += x[:m] * g

    ids = ['rule', 'never', 'first', 'still', 'habit', 'night', 'knock1', 'nobody', 'knock2', 'voice', 'voice2', 'turn', 'behind', 'end', 'end2']
    S = dict(zip(ids, shots))
    night0, tv_off = F(S['night']['a']), F(S['still']['beat'] - 14)
    amb += lp1(nz(N / SR + 1)[:N], 180) * 0.6
    tv = bp(nz(N / SR + 1)[:N], 300, 2500) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 3.1 * t)) * np.abs(np.sin(2 * np.pi * 0.7 * t)))
    amb += tv * 0.22 * (t < tv_off)
    amb += bp(nz(N / SR + 1)[:N], 150, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.17 * t + 1)) * 0.7 * (t >= night0)
    tick = hp(nz(0.012), 3000) * 2.5
    for s in np.arange(0.4, N / SR, 1.0):
        put(sfx, s, tick, 0.4 if s < night0 else 0.7)

    def knock(g):
        n = int(0.16 * SR); tt = np.arange(n) / SR
        return (np.sin(2 * np.pi * 110 * tt) * np.exp(-tt * 40) + lp1(rng.standard_normal(n), 900) * np.exp(-tt * 60) * 0.8) * g

    def creak(d):
        n = int(d * SR); tt = np.arange(n) / SR; f0 = 180 + 90 * np.sin(2 * np.pi * 0.7 * tt)
        x = np.sign(np.sin(2 * np.pi * np.cumsum(f0) / SR)) * (0.5 + 0.5 * rng.random(n) ** 3)
        return bp(x, 300, 2400) * np.sin(np.pi * tt / d) * 0.5

    for name, g in (('still', 0.55), ('knock1', 1.2), ('knock2', 1.2)):
        for off in (0, 12):
            put(sfx, F(S[name]['beat'] + off), knock(g)); put(sfx, F(S[name]['beat'] + off) + 0.13, knock(g * 0.8))
    put(sfx, F(S['first']['a'] + 8), creak(1.3), 0.6)
    put(sfx, F(S['nobody']['a'] + 6), creak(1.5), 0.9)
    put(sfx, F(S['nobody']['a'] + 20), bp(nz(2.5), 200, 1200) * env(int(2.5 * SR), 0.6, 1.2), 0.9)       # cold air through the open door
    # music box (our own tune) while the evening is still warm
    for i, nn in enumerate([76, 79, 81, 79, 76, 74, 76, 72, 74, 76, 79, 76, 74, 72, 74, 76]):
        at = 0.3 + i * 0.85
        if at + 0.4 > night0:
            break
        fq = 440 * 2 ** ((nn - 69) / 12); tt = np.arange(int(1.2 * SR)) / SR
        put(mus, at, (np.sin(2 * np.pi * fq * tt) + 0.35 * np.sin(2 * np.pi * fq * 2.01 * tt) + 0.15 * np.sin(2 * np.pi * fq * 3.98 * tt)) * np.exp(-tt * 3.2), 0.18)
    mus[int(night0 * SR):] = 0
    sting_at = F(S['behind']['beat'] - 4)
    dr = np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.4 * t + np.sin(2 * np.pi * 0.2 * t)) + 0.3 * np.sin(2 * np.pi * 58.3 * t)
    mus += lp1(dr, 300) * 0.35 * np.clip((t - night0) / 8, 0, 1) * (t < sting_at)
    st = np.arange(int(4 * SR)) / SR
    sting = (np.sin(2 * np.pi * (40 + 25 * np.exp(-st * 5)) * st) * np.exp(-st * 1.2) * 1.4 + hp(rng.standard_normal(len(st)), 2500) * np.exp(-st * 3) * 0.5
             + sum(np.sin(2 * np.pi * fq * st) for fq in (311, 330, 466)) * np.exp(-st * 0.9) * 0.15)
    put(mus, sting_at, sting)
    tail = np.arange(int((N / SR - F(S['end']['a'])) * SR)) / SR
    put(mus, F(S['end']['a']), lp1(np.sin(2 * np.pi * 49 * tail), 200) * np.minimum(1, tail / 3), 0.4)
    norm = lambda x, p: x / max(1e-6, np.percentile(np.abs(x), 99.7)) * p
    return norm(amb, 0.10) + norm(sfx, 0.34) + norm(mus, 0.26)
