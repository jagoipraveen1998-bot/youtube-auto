"""Sound for Bruno Part 3 (bedroom set, night): room tone, keypad beeps, the lock, paws on the floor,
Mum's car, the real Bruno barking outside the door, stings on the smile and the eyes under the bed."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['lock', 'beep', 'code', 'birthday', 'open', 'enter', 'sit', 'relax', 'car', 'window', 'bruno', 'lookback', 'smile', 'bark', 'shh', 'under']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=31)
    m.room(0.6)                                       # one soft room tone; no birds, traffic, engines or hiss
    m.beeps(m.a('beep', 4), 6, 0.28, 1700, 0.35)
    n = max(0.3, (m.b('code', -20) - m.a('code')) / 4)
    m.beeps(m.a('code', 2), 4, n, 1900, 0.45)
    m.drone(m.a('birthday'), m.beat('open'), 0.25, rise=4)
    m.clunk(m.beat('open'), 1.0); m.creak(m.beat('open', 6), 1.2, 0.7, pitch=140)
    m.clunk(m.b('car', -8), 0.6)
    m.drone(m.a('bruno'), m.b('under'), 0.32, rise=6)
    m.sting(m.beat('bruno', -2), 0.7)
    m.whoosh(m.beat('smile', -8), 0.6, 0.5); m.sting(m.beat('smile'), 1.0)
    m.knock(m.a('bark', 10), 0.5, 2, 0.5)
    m.sting(m.beat('under', 2), 0.8)
    m.tail(m.a('under'), 0.4)
    return m.done()
