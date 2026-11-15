"""Sound for the Babysitter Rules Short: a quiet room, a heartbeat that builds through the rules, taps from the
wardrobe, a thin lullaby from the monitor, silence and a hit when he appears at the window, a last hit at the door."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['hired', 'pay', 'mrs', 'photos', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'his', 'luck']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=51)
    m.room(0.6)
    m.creak(m.a('hired', 4), 1.0, 0.5, pitch=150)
    m.sting(m.beat('mrs'), 0.5)
    m.drone(m.a('photos'), m.b('luck'), 0.28, rise=10)
    m.heartbeat(m.a('r1'), m.beat('his', -50), 54, 104, 0.45)
    n = max(2, int((m.b('r2') - m.beat('r2', -20)) / 0.87))
    m.knock(m.beat('r2', -20), 0.55, n, 0.87)
    m.whoosh(m.beat('r3', -6), 0.6, 0.45); m.sting(m.beat('r3'), 0.6)
    m.creak(m.beat('r4'), 1.4, 0.6, pitch=120)
    m.music_box(m.a('r5', 6), m.b('r5'), g=0.14, detune=0.97, step=0.6)
    m.hush(m.beat('his', -50), m.beat('his', -3))
    m.sting(m.beat('his', -2), 1.3)
    m.hush(m.beat('luck', -30), m.beat('luck', -2))
    m.sting(m.beat('luck'), 1.0)
    m.tail(m.a('luck'), 0.4)
    return m.done()
