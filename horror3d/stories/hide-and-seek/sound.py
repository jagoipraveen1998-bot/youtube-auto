"""Sound for Hide and Seek (bedroom set): a cosy room with a music box while it's a game, a giggle-light
moment under the bed, the cupboard creaking open, silence before the counting, a slam, a low tail."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['babysit', 'count', 'under', 'giggle', 'nobody', 'point', 'open', 'gone', 'counting', 'close', 'end']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=23)
    m.room(0.6)
    m.music_box(0.3, m.a('point'), g=0.15, detune=0.985)            # a toy tune while it's still a game
    m.drone(m.a('point'), m.b('end'), 0.28, rise=10)
    m.creak(m.a('open', 6), 1.6, 0.9, pitch=140)
    m.whoosh(m.beat('gone', -4), 0.6, 0.5)
    m.heartbeat(m.a('gone'), m.beat('counting', -40), 70, 110, 0.5)
    m.hush(m.beat('counting', -40), m.beat('counting', -3))             # dead quiet, then the counting
    m.sting(m.beat('counting', -2), 1.1)
    m.creak(m.beat('close', -3), 0.4, 0.8, pitch=200)
    m.clunk(m.beat('close', 4), 1.4)
    m.hush(m.a('end'), m.beat('end', -2))
    m.creak(m.beat('end'), 1.2, 0.6, pitch=110)
    m.sting(m.beat('end', 10), 0.8)
    m.tail(m.a('end'), 0.45)
    return m.done()
