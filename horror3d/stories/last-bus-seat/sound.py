"""Sound for the Last Bus: engine rumble, a door hiss at the empty stop, the seat creaking as it sinks,
a squeak on the glass, heartbeat at the front, silence before the mirror, a sting, flicker, a low tail."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['ride', 'ears', 'doors', 'sink', 'fog', 'smiley', 'front', 'mirror', 'wave', 'driver', 'end']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=7)
    m.room(0.5)
    m.engine(0, m.a('doors'), 0.45)
    m.whoosh(m.a('doors', 6), 1.0, 0.6)                          # the doors hiss open
    m.engine(m.b('doors'), m.b('end'), 0.35)
    m.creak(m.beat('sink', -4), 1.0, 0.8, pitch=120)
    m.drone(m.a('sink'), m.b('end'), 0.28, rise=10)
    m.creak(m.a('smiley', 4), 1.4, 0.35, pitch=420)               # a finger squeaking on glass
    m.heartbeat(m.a('front'), m.beat('wave', -50), 70, 115, 0.5)
    m.hush(m.beat('wave', -50), m.beat('wave', -3))
    m.sting(m.beat('wave', -2), 1.2)
    m.flicker(m.a('driver'), m.b('end'), 0.4)
    m.hush(m.beat('end', -30), m.beat('end', -2))
    m.sting(m.beat('end'), 1.1)
    m.tail(m.a('end'), 0.45)
    return m.done()
