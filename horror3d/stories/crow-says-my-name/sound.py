"""Sound for A Crow Keeps Saying My Name: birds and a morning street, a truck roaring past, a quiet night with
tapping on glass, a warm week, a whoosh into black, and a grey morning with one far-off caw-like sting."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['toast', 'name', 'warn', 'truck', 'tap', 'voice', 'gone', 'open', 'laugh', 'chest', 'fence']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=43)
    m.room(0.5)
    m.birds(0, m.b('name'), 0.35)
    m.traffic(0.4, mask=m.span(m.a('warn'), m.b('truck')))
    m.engine(m.beat('truck', -14), m.beat('truck', 10), 0.9)
    m.whoosh(m.beat('truck', -2), 1.0, 1.0)
    m.sting(m.beat('truck', 2), 0.6)
    for k in range(5):
        m.knock(m.a('tap', 6 + k * 16), 0.35, n_=1)
    m.drone(m.a('tap'), m.b('gone'), 0.28, rise=8)
    m.hush(m.beat('voice', -10), m.beat('voice', -2))
    m.sting(m.beat('voice', -1), 0.8)
    m.whoosh(m.beat('open', -2), 0.5, 0.4)
    m.music_box(m.a('laugh'), m.beat('chest', -6), g=0.14, detune=1.0)    # a happy week
    m.whoosh(m.beat('chest', -6), 0.9, 0.9)
    m.hush(m.beat('chest', 4), m.a('fence', 6))
    m.birds(m.a('fence'), m.b('fence'), 0.2)
    m.sting(m.beat('fence', 4), 0.8)
    m.tail(m.a('fence'), 0.45)
    return m.done()
