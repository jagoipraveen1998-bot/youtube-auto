"""Sound for Never Answer The Landline After Midnight: a quiet room, an old phone ringing, a heartbeat on the
line, two seconds of silence before the laugh, a slam, then silence and one hit at the reflection."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['rule', 'never', 'rings', 'away', 'voice', 'dont', 'already', 'inside', 'slam', 'window', 'reflect']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=55)
    m.room(0.5)
    t, end = m.a('rings', 4), m.beat('away')
    while t < end:                                               # an old bell phone: two short bursts per ring
        m.beeps(t, n_=2, gap=0.14, hz=1150, g=0.35); t += 1.6
    m.click(m.beat('away'), 0.8)
    m.phone_line(m.beat('away'), m.b('inside'), 0.25)
    m.heartbeat(m.a('voice'), m.beat('inside', -60), 60, 100, 0.5)
    m.hush(m.beat('inside', -60), m.beat('inside', -1))
    m.sting(m.beat('inside'), 0.9)
    m.clunk(m.beat('slam'), 1.2)
    m.hush(m.beat('reflect', -60), m.beat('reflect', -1))
    m.sting(m.beat('reflect'), 1.0)
    m.tail(m.a('reflect'), 0.4)
    return m.done()
