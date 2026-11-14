"""Sound for the Cassette story (granRoom set): room tone, bulb hum, a music box while it's still cosy,
the tape going in, hiss while it plays, flicker, the cupboard creak, the sting on Grandma, a low tail."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['clean', 'find', 'play', 'voice', 'warn', 'laugh', 'notgran', 'creak', 'gran', 'whisper', 'hide', 'end']


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=11)
    m.room(0.6); m.hum(0.12)
    m.tick_clock(0.4, m.a('notgran'), 0.35)
    m.music_box(0.3, m.a('play'), g=0.16, detune=0.985)                  # slightly out of tune, like an old toy
    m.click(m.beat('find'), 0.6)
    m.clunk(m.beat('play'), 1.0); m.click(m.beat('play', 6), 1.2)
    m.tape_hiss(m.beat('play', 6), m.a('hide'), 0.35)
    m.drone(m.a('voice'), m.beat('gran', -4), 0.3, rise=10)
    m.flicker(m.a('notgran'), m.b('notgran'), 0.6)
    m.creak(m.beat('creak', -4), 1.6, 1.0, pitch=150)
    m.creak(m.beat('creak', 20), 1.0, 0.6, pitch=120)
    m.flicker(m.a('gran'), m.b('gran'), 0.5)
    m.sting(m.beat('gran', -2), 1.0)
    m.whoosh(m.beat('end', -6), 0.7, 0.7)
    m.sting(m.beat('end'), 0.7)
    m.tail(m.a('end'), 0.4)
    return m.done()
