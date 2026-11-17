"""Sound for Red Balloons: a bright morning that goes quiet, a red night with rubber squeaks, a pop and a sting,
Mum's warm voice-room, then a cold drop at the string."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['one', 'card', 'more', 'red', 'squeak', 'faces', 'turn', 'pop', 'mum', 'kiss', 'string']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=41)
    m.room(0.55)
    m.birds(0, m.b('more'), 0.3)
    m.music_box(m.a('one', 6), m.b('card'), g=0.16, detune=1.0)        # a little birthday tune
    m.drone(m.a('red'), m.b('pop'), 0.3, rise=10)
    for k in range(4):
        m.creak(m.beat('squeak', -14 + k * 26 / 30 * 30 // 1), 0.25, 0.5, pitch=900)   # rubber squeaks
    m.whoosh(m.a('faces', 6), 0.6, 0.5)                                # the curtain
    m.heartbeat(m.a('faces'), m.beat('pop', -10), 70, 110, 0.5)
    m.hush(m.beat('pop', -10), m.beat('pop', -1))
    m.click(m.beat('pop'), 1.4); m.sting(m.beat('pop', 1), 1.1)
    m.whoosh(m.a('mum', 4), 0.5, 0.5)
    m.hush(m.beat('string', -8), m.beat('string', -1))
    m.sting(m.beat('string'), 0.9)
    m.tail(m.a('string'), 0.45)
    return m.done()
