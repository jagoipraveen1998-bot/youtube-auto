"""Sound for The Borrowed Shadow: an evening street, then a quiet bedroom at night; a sting when the
shadow waves, a phone ringing, a low tail under Grandpa's last line."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['town', 'kids', 'twelve', 'wall', 'moved', 'mum', 'borrowed', 'who', 'point', 'photo', 'wave', 'call', 'voice']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=41)
    m.room(0.6)                                       # one soft room tone; no birds, traffic, engines or hiss
    m.whoosh(m.beat('wall', -8), 0.7, 0.45)
    m.drone(m.a('wall'), m.b('voice'), 0.3, rise=8)
    m.creak(m.a('mum', 2), 0.9, 0.5, pitch=150)
    m.sting(m.beat('photo'), 0.55)
    m.heartbeat(m.a('wall'), m.beat('wave', -60), 56, 100, 0.5)
    m.hush(m.beat('wave', -60), m.beat('wave', -3))               # two seconds of nothing, then the hit
    m.sting(m.beat('wave', -2), 1.2)
    m.beeps(m.a('call', 3), 3, 0.7, 1300, 0.4)
    m.click(m.beat('call'), 0.8)
    m.heartbeat(m.a('call'), m.beat('voice', -45), 80, 120, 0.5)
    m.hush(m.beat('voice', -45), m.beat('voice', -2))
    m.sting(m.beat('voice'), 1.3)
    m.tail(m.a('voice'), 0.4)
    return m.done()
