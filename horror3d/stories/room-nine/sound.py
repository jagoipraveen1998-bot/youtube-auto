"""Sound for Never Look Into Room 9: a hum of corridor lights, the school bell, a heartbeat at the scratch,
silence in the class but pencils scratching, two seconds of nothing before they look up, then a hit, and one more
for the teacher behind you."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['rule', 'never', 'locked', 'bag', 'scratch', 'looked', 'class', 'face', 'writing', 'turned', 'late']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=59)
    m.room(0.45)
    m.hum(0.14, hz=60, mask=m.span(0, m.b('looked')))
    t = m.a('bag', 2)
    for k in range(10):                                         # the school bell: a fast metallic ring
        m.beeps(t + k * 0.12, n_=1, gap=0.05, hz=1900 + (k % 2) * 140, g=0.3)
    m.heartbeat(m.a('scratch'), m.beat('turned', -60), 62, 108, 0.5)
    for k in range(18):                                         # pencils scratching in the silent class
        m.click(m.a('class', 6) + k * 0.31, 0.12)
    m.hush(m.beat('turned', -60), m.beat('turned', -1))
    m.sting(m.beat('turned'), 1.0)
    m.hush(m.beat('late', -30), m.beat('late', -1))
    m.sting(m.beat('late'), 0.9)
    m.tail(m.a('late'), 0.4)
    return m.done()
