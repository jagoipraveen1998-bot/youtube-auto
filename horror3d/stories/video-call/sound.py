"""Sound for the video-call set: laptop fan, the call's laughter, a join chime, breathing on the fifth mic, typing, pings, the slam."""
import numpy as np
from scipy.signal import lfilter


def build(shots, total, FPS, SR):
    rng = np.random.default_rng(4)
    N = int(total / FPS * SR); t = np.arange(N) / SR
    lp1 = lambda x, fc: (lambda a: lfilter([1 - a], [1, -a], lfilter([1 - a], [1, -a], x)))(np.exp(-2 * np.pi * fc / SR))
    hp = lambda x, fc: x - lp1(x, fc); bp = lambda x, lo, hi: lp1(hp(x, lo), hi)
    nz = lambda d: rng.standard_normal(int(d * SR))
    env = lambda n, a, d: np.minimum(1, np.arange(n) / max(1, a * SR)) * np.exp(-np.arange(n) / SR / d)
    F = lambda f: f / FPS
    amb, sfx, mus = np.zeros(N), np.zeros(N), np.zeros(N)

    def put(buf, at, x, g=1.0):
        i = int(at * SR); m = min(len(x), len(buf) - i)
        if i >= 0 and m > 0: buf[i:i + m] += x[:m] * g
    ids = ['wide', 'four', 'laugh', 'fifth', 'notice', 'mic', 'chat', 'reply', 'count', 'hand', 'slam', 'reflect']
    S = dict(zip(ids, shots))
    slam_t = F(S['slam']['beat'])
    amb += lp1(nz(N / SR + 1)[:N], 160) * 0.6
    amb += bp(nz(N / SR + 1)[:N], 400, 2400) * 0.25 * (t < slam_t)                         # laptop fan, stops with the lid
    for k in range(10):                                                                  # the call laughing (lines 1-2)
        at = F(S['four']['a']) + k * 0.55 + rng.random() * 0.2
        if at > F(S['fifth']['beat']): break
        n = int(0.45 * SR); put(amb, at, bp(rng.standard_normal(n), 500, 2200) * env(n, 0.03, 0.12) * (0.6 + 0.4 * np.abs(np.sin(np.arange(n) / SR * 2 * np.pi * 7))), 0.8)
    for fq, off in ((880, 0), (1320, 0.12)):                                             # a fifth person joined
        n = int(0.4 * SR); put(sfx, F(S['fifth']['beat']) + off, np.sin(2 * np.pi * fq * np.arange(n) / SR) * env(n, 0.005, 0.15), 0.35)
    br0 = F(S['mic']['a'])                                                               # breathing on the open mic
    breath = bp(nz(N / SR + 1)[:N], 300, 1400) * np.clip(np.sin(2 * np.pi * 0.32 * t), 0, 1) ** 2
    amb += breath * 1.4 * (t >= br0) * (t < slam_t)
    for k in range(15):                                                                  # typing "Who added this?"
        n = int(0.03 * SR); put(sfx, F(S['chat']['a'] + 6) + k * 0.11, hp(rng.standard_normal(n), 2500) * env(n, 0.001, 0.01), 0.5)
    for key in ('chat', 'reply'):
        n = int(0.25 * SR); put(sfx, F(S[key]['beat'] if key == 'chat' else S[key]['a'] + 4), np.sin(2 * np.pi * 1568 * np.arange(n) / SR) * env(n, 0.003, 0.07), 0.3)
    n = int(0.3 * SR); tt = np.arange(n) / SR
    put(sfx, slam_t, (np.sin(2 * np.pi * 120 * tt) * np.exp(-tt * 30) + lp1(rng.standard_normal(n), 1500) * np.exp(-tt * 40)) * 1.3)
    dr = np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.4 * t + np.sin(2 * np.pi * 0.2 * t))
    mus += lp1(dr, 300) * 0.4 * np.clip((t - F(S['fifth']['beat'])) / 6, 0, 1) * (t < F(S['hand']['beat']))
    st = np.arange(int(4 * SR)) / SR
    sting = np.sin(2 * np.pi * (40 + 25 * np.exp(-st * 5)) * st) * np.exp(-st * 1.2) * 1.4 + hp(rng.standard_normal(len(st)), 2500) * np.exp(-st * 3) * 0.5 + sum(np.sin(2 * np.pi * fq * st) for fq in (311, 330, 466)) * np.exp(-st * 0.9) * 0.15
    put(mus, F(S['hand']['beat'] - 4), sting)
    put(mus, F(S['reflect']['beat'] - 4), sting, 0.8)
    norm = lambda x, p: x / max(1e-6, np.percentile(np.abs(x), 99.7)) * p
    return norm(amb, 0.12) + norm(sfx, 0.32) + norm(mus, 0.26)
