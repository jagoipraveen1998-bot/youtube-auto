"""Sound for Keep Your Feet Under The Blanket: a quiet room, a heartbeat as the counting starts, soft taps on
each toe, two seconds of silence before "eleven", one hard hit, then a still morning."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['rule', 'blanket', 'nod', 'hot', 'count', 'one', 'toes', 'nine', 'eleven', 'ten', 'sock']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=53)
    m.room(0.5)
    m.creak(m.a('hot', 8), 1.0, 0.35, pitch=150)                 # the bed as you shift
    m.heartbeat(m.a('count'), m.beat('eleven', -60), 56, 108, 0.55)
    for id_, n in (('one', 3), ('nine', 2)):
        a, b = m.a(id_, 6), m.b(id_, -6)
        for k in range(n):
            m.click(a + (b - a) * (k + 0.5) / n, 0.35)           # a fingertip tapping a toe
    m.hush(m.beat('eleven', -60), m.beat('eleven', -1))
    m.sting(m.beat('eleven'), 1.0)
    m.drone(m.a('ten'), m.b('sock'), 0.22, rise=6)
    m.hush(m.beat('sock', -40), m.beat('sock', 3))
    m.sting(m.beat('sock', 4), 0.7)
    m.tail(m.a('sock'), 0.4)
    return m.done()
