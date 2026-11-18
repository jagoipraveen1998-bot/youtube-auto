"""Sound for My Brother Is Trapped Inside Our Bathroom Mirror: quiet bathroom room tone, a slow drip, our own creepy
score under it all; a low heartbeat that speeds up as the thing comes closer; small taps on the glass as he presses
the note; the tape player's click and soft hiss under Dad's line; a curtain swish; two seconds of silence before the
whisper, then one hit as the thing rises; the clock begins to strike twelve and the score drops out under the last
image. No wind, birds or traffic."""
import sys, pathlib
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['trapped', 'closer', 'hands', 'note', 'hammer', 'mum', 'recording', 'crying', 'curtain', 'street', 'whisper', 'twelve']


def chime(m, at, g=0.45):                    # a wall clock's strike: bright partials, medium decay
    tt = np.arange(int(2.6 * m.SR)) / m.SR
    x = sum(a * np.sin(2 * np.pi * fq * tt) * np.exp(-tt * d) for fq, a, d in ((523, 1.0, 1.4), (1046, 0.4, 2.2), (1318, 0.25, 2.8), (262, 0.35, 1.0)))
    m.put(m.sfx, at, x * np.minimum(1, tt / 0.003) * g)


def drip(m, t0, t1, every=2.3, g=0.25):
    tt = np.arange(int(0.12 * m.SR)) / m.SR
    d = np.sin(2 * np.pi * (1400 + 900 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 38)
    t = t0 + 0.7
    while t < t1:
        m.put(m.amb, t, d * g); t += every


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=73)
    m.room(0.45)
    drip(m, 0, m.a('street'))
    m.score(style='creepy', quiet=[(m.a('street'), m.b('street'), 0.6)])
    m.heartbeat(m.a('closer'), m.beat('hands', -2), 58, 92, 0.45)
    m.sting(m.beat('hands'), 0.6)
    for k in range(3): m.knock(m.a('note', 6) + k * 0.32, 0.35, n_=1)           # small taps on the glass
    m.creak(m.beat('hammer', -6), 0.6, 0.4, pitch=220)
    m.click(m.a('recording', 3), 0.9); m.tape_hiss(m.a('recording', 4), m.b('recording'), 0.35)
    m.whoosh(m.beat('curtain', -8), 0.9, 0.6)
    m.heartbeat(m.a('street'), m.beat('whisper', -60), 70, 104, 0.45)
    m.hush(m.beat('whisper', -60), m.beat('whisper', -1))
    m.sting(m.beat('whisper'), 1.0)
    m.drone(m.beat('whisper'), m.b('twelve'), 0.28, rise=8)
    for k in range(4): chime(m, m.a('twelve', 6) + k * 0.93, 0.5)               # it begins to strike twelve
    m.tail(m.beat('twelve'), 0.35)
    return m.done()
