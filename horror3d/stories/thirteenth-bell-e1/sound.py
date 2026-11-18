"""Sound for The Thirteenth Bell, Episode 1: quiet room tone throughout; a church bell for each stroke the
story counts; a door bolt, a creak; a heartbeat under the second night; two seconds of silence before the
thirteenth stroke, before the knock and before the voice upstairs, each followed by one hit; soft knocks on the
door; the three-note whistle; wet steps on the stairs. Our own mild score (D minor strings and a music box), quieter in
the daylight scenes and silent in each hush. No wind or sea hiss."""
import sys, pathlib
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['hook1', 'hook2', 'town', 'tom', 'ringer', 'silas', 'marks', 'answered', 'salt', 'rule', 'count', 'twelve', 'thirteen', 'voices', 'peter',
       'bolt', 'boy', 'morning', 'prints', 'watch', 'stopped', 'vigil', 'count2', 'knock', 'annie', 'whistle', 'dad', 'silence', 'inside', 'stairs']


def bell(m, at, g=0.5):                     # a church bell stroke: inharmonic partials, long decay
    tt = np.arange(int(5 * m.SR)) / m.SR
    x = sum(a * np.sin(2 * np.pi * fq * tt) * np.exp(-tt * d) for fq, a, d in ((196, 1.0, 0.7), (392, 0.5, 1.1), (466, 0.35, 1.6), (587, 0.3, 1.9), (784, 0.2, 2.6), (98, 0.4, 0.5)))
    m.put(m.sfx, at, x * np.minimum(1, tt / 0.004) * g)


def whistle(m, at, g=0.35):
    for k, fq in enumerate((1175, 1319, 988)):
        tt = np.arange(int(0.32 * m.SR)) / m.SR
        m.put(m.sfx, at + k * 0.42, np.sin(2 * np.pi * fq * tt * (1 + 0.01 * np.sin(2 * np.pi * 6 * tt))) * np.sin(np.pi * tt / 0.32) ** 2, g)


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=88)
    m.room(0.45)
    m.score(style='creepy', quiet=[(m.a('morning'), m.b('stopped'), 0.45)])   # creepy: drone, pulse, out-of-tune music box; softer by day
    bell(m, m.a('hook1', 4), 0.35)
    for k in range(3): bell(m, m.a('count', 20) + k * 1.2, 0.4)            # one, two, three
    for k in range(3): bell(m, m.a('twelve', 2) + k * 1.0, 0.45)            # ten, eleven, twelve
    m.hush(m.beat('thirteen', -60), m.beat('thirteen', -1))
    bell(m, m.beat('thirteen'), 0.9); m.sting(m.beat('thirteen', 2), 0.6)
    m.heartbeat(m.a('voices'), m.b('boy'), 58, 92, 0.4)
    m.click(m.beat('bolt'), 0.9); m.creak(m.beat('bolt', 6), 1.6, 0.5, pitch=150)
    m.creak(m.a('morning', 10), 1.4, 0.4, pitch=130)                        # an open door moving in the breeze
    m.heartbeat(m.a('vigil'), m.beat('knock', -60), 60, 96, 0.45)
    bell(m, m.a('count2', 6), 0.35); bell(m, m.a('count2', 6) + 1.1, 0.35); bell(m, m.beat('count2', -10), 0.4); bell(m, m.beat('count2', 20), 0.45)
    m.hush(m.beat('knock', -60), m.beat('knock', -1))
    for k in range(4): m.knock(m.a('knock', 6) + k * 0.75, 0.7, n_=1)
    whistle(m, m.a('whistle', 20))
    m.hush(m.beat('dad', 10), m.a('silence', 30))
    m.hush(m.beat('inside', -60), m.beat('inside', -1)); m.sting(m.beat('inside'), 1.0)
    for k in range(8): m.creak(m.a('stairs', 30) + k * 0.9, 0.5, 0.3, pitch=110 + (k % 2) * 20)     # wet steps on old wood
    m.tail(m.a('stairs'), 0.4)
    return m.done()
