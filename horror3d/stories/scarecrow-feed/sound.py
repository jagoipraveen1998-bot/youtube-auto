"""Sound for Feed The Scarecrow Before Dark: a quiet evening field, a creak as the head turns, a night room with
a heartbeat, two seconds of silence before the chair, one hit, and a cold hit as Mum looks through you."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['rule', 'rice', 'joke', 'forgot', 'window', 'count', 'breakfast', 'chair', 'name', 'lunch', 'through']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=57)
    m.room(0.45)
    m.click(m.beat('rice'), 0.4)                                 # the bowl set down
    m.creak(m.a('forgot', 6), 2.0, 0.6, pitch=110)               # the head turning
    m.knock(m.beat('window'), 0.5, n_=3, gap=0.5)                # straw fingers on glass
    m.heartbeat(m.a('window'), m.b('count'), 64, 104, 0.5)
    m.hush(m.beat('chair', -60), m.beat('chair', -1))
    m.sting(m.beat('chair'), 1.0)
    m.drone(m.a('name'), m.b('through'), 0.22, rise=6)
    m.hush(m.beat('through', -40), m.beat('through', -1))
    m.sting(m.beat('through'), 0.8)
    m.tail(m.a('through'), 0.4)
    return m.done()
