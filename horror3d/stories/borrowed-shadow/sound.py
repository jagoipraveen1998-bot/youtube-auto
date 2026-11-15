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
    m.sting(m.beat('wave', -2), 1.0)
    m.beeps(m.a('call', 3), 3, 0.7, 1300, 0.4)
    m.click(m.beat('call'), 0.8)
    m.whoosh(m.beat('voice', -6), 0.6, 0.5); m.sting(m.beat('voice'), 0.6)
    m.tail(m.a('voice'), 0.4)
    return m.done()
