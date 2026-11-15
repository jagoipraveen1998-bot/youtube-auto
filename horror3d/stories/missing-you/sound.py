"""Sound for Missing Poster (street set, morning): birds and a far-off town, a laugh into the phone,
the line going quiet, a police car rolling up, the sting on the twist, a low tail."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['walk', 'stop', 'photo', 'name', 'since', 'call', 'mumcry', 'police', 'officer', 'twist', 'mumlook', 'which']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=21)
    m.room(0.6)                                       # one soft room tone; no birds, traffic, engines or hiss
    m.whoosh(m.beat('photo', -4), 0.5, 0.4); m.sting(m.beat('photo'), 0.45)
    m.beeps(m.a('call', 4), 2, 0.5, 425, 0.3)         # ringing
    m.drone(m.a('mumcry'), m.b('which'), 0.3, rise=6)
    m.sting(m.beat('twist', -2), 1.0)
    m.whoosh(m.beat('which', 12), 0.6, 0.5); m.sting(m.beat('which', 18), 0.6)
    m.tail(m.a('which'), 0.4)
    return m.done()
