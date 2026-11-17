"""Sound for The Ice Cream Van At 3AM: a quiet night, the van's tinny tune, a warm moment with the memory,
a hollow morning, silence before the empty chair, then the tune again, slower and wrong."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['song', 'van', 'smile', 'menu', 'free', 'taste', 'photo', 'blank', 'chair', 'again', 'seconds']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=37)
    m.room(0.5)
    m.music_box(m.a('song', 8), m.b('taste'), g=0.22, detune=1.0)       # the van's jingle
    m.hum(0.18, hz=60, mask=m.span(m.a('van'), m.b('free')))
    m.drone(m.a('photo'), m.b('seconds'), 0.24, rise=10)
    m.heartbeat(m.a('blank'), m.beat('chair', -12), 60, 92, 0.45)
    m.hush(m.beat('chair', -12), m.beat('chair', -2))
    m.sting(m.beat('chair', -1), 1.0)
    m.music_box(m.a('again', 4), m.b('seconds'), step=1.15, g=0.2, detune=0.93)   # same tune, slower, out of tune
    m.knock(m.beat('seconds'), 0.9, n_=3, gap=0.35)
    m.sting(m.beat('seconds', 6), 0.9)
    m.tail(m.a('seconds'), 0.45)
    return m.done()
