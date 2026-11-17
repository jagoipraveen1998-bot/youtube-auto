"""Sound for I Had To Fight My Own Shadow: quiet room tone and a soft candle, a heartbeat once the shadow
stays put, two seconds of silence before it grabs you, a scrape as you're dragged, a flare when the candle
hits, a lamp click, then silence and one hit when Mum screams."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['fight', 'rule', 'candle', 'turn', 'didnt', 'smiled', 'grab', 'drag', 'shove', 'shrank', 'alive', 'yousee', 'scream']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=61)
    m.room(0.45)
    m.heartbeat(m.a('didnt'), m.beat('grab', -60), 58, 104, 0.55)
    m.hush(m.beat('grab', -60), m.beat('grab', -1))
    m.sting(m.beat('grab'), 1.0)
    m.creak(m.a('drag', 4), 1.8, 0.7, pitch=90)               # dragged across the floorboards
    m.heartbeat(m.a('drag'), m.b('shove'), 110, 130, 0.5)
    m.whoosh(m.beat('shove', -2), 0.8, 0.9)
    m.sting(m.beat('shove'), 0.7)
    m.click(m.a('alive', 4), 0.9)                              # the lights come back
    m.drone(m.a('yousee'), m.b('scream'), 0.24, rise=8)
    m.hush(m.beat('scream', -60), m.beat('scream', -1))
    m.sting(m.beat('scream'), 1.0)
    m.tail(m.a('scream'), 0.4)
    return m.done()
