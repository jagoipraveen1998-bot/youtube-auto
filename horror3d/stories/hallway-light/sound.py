"""Sound for Never Turn Off The Hallway Light: a quiet house, a switch click into darkness, a heartbeat as the
hallway stretches, a door creak, two seconds of silence before the other you, then one hard hit."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['rule', 'never', 'red', 'dad', 'off', 'longer', 'doors', 'open', 'bed', 'sat', 'turn']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=51)
    m.room(0.5)
    m.hum(0.12, hz=50, mask=m.span(0, m.beat('off')))
    m.click(m.beat('off'), 1.2)
    m.heartbeat(m.a('longer'), m.beat('bed', -60), 58, 104, 0.5)
    m.creak(m.a('open', 8), 1.4, 0.6)
    m.hush(m.beat('bed', -60), m.beat('bed', -1))
    m.sting(m.beat('bed'), 1.0)
    m.creak(m.beat('sat', -4), 0.9, 0.5, pitch=120)
    m.hush(m.beat('turn', -60), m.beat('turn', -1))
    m.sting(m.beat('turn'), 0.9)
    m.tail(m.a('turn'), 0.4)
    return m.done()
