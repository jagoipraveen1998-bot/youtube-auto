"""Sound for What If The Chemistry Teacher Said Yes?: a snowy town hush, coughs and a car-wash spray, a hospital beep,
polite claps, a tattoo buzz, rocks clinking into a sack, a cash-register ding, pigeons, sizzling burritos, tiny feet,
a phone buzzing at 3 a.m., and a comedy sting on the last line."""
import sys, pathlib
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['wash', 'doctor', 'call', 'ego', 'applause', 'hair', 'tattoo', 'rocks', 'steal', 'ted', 'junior', 'chicken', 'pigeons', 'burrito', 'roaches', 'cat', 'vending', 'ring', 'sal', 'bald', 'rv']


def tone(m, at, f, d, g, decay=6.0):
    tt = np.arange(int(d * m.SR)) / m.SR
    m.put(m.sfx, at, np.sin(2 * np.pi * f * tt) * np.exp(-tt * decay) * g)


def buzz(m, at, d, g, f=110):                        # a tattoo machine / a phone on vibrate
    tt = np.arange(int(d * m.SR)) / m.SR
    m.put(m.sfx, at, np.sign(np.sin(2 * np.pi * f * tt)) * (0.6 + 0.4 * np.sin(tt * 60)) * np.minimum(1, tt / 0.02) * np.minimum(1, (d - tt) / 0.05 + 1e-3) * g * 0.3)


def clap(m, at, g):
    n = int(0.06 * m.SR); m.put(m.sfx, at, m.bp(m.nz(0.06)[:n], 800, 3000) * np.exp(-np.arange(n) / m.SR * 70) * g)


def spray(m, a, b, g):
    n = int((b - a) * m.SR)
    if n > 0: m.put(m.amb, a, m.hp(m.nz(b - a)[:n], 1800) * g)


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=41)
    m.room(0.3)
    m.score(style='strings', quiet=[(m.a('ring'), m.b('ring'), 0.5)])
    for s in ('wash', 'chicken', 'pigeons', 'burrito', 'roaches'): m.wind(0.25, mask=m.span(m.a(s), m.b(s)))
    spray(m, m.a('wash'), m.b('wash'), 0.08)
    for k in range(3): m.thud(m.word('wash', 'coughed', off=k * 6), 0.35)
    tone(m, m.word('wash', 'tipped'), 1320, 0.4, 0.15); tone(m, m.word('wash', 'tipped', off=4), 1760, 0.5, 0.15)
    for k in range(6): tone(m, m.a('doctor') + 0.2 + k * 0.8, 1000, 0.12, 0.1, 20)
    m.sting(m.word('doctor', 'cancer'), 0.5); m.sting(m.word('doctor', 'insurance', off=20), 0.4)
    buzz(m, m.a('call'), 0.6, 0.3, 160)
    m.sting(m.word('ego', 'no'), 0.5); m.whoosh(m.word('ego', 'louder'), 0.5, 0.4); m.thud(m.word('ego', 'said'), 0.6)
    for k in range(5): clap(m, m.word('applause', 'polite') + k * 0.33, 0.25)
    m.hush(m.word('hair', 'devastated', off=-12), m.word('hair', 'devastated')); m.sting(m.word('hair', 'devastated'), 0.5)
    buzz(m, m.word('tattoo', 'artist'), 1.6, 0.35, 95); buzz(m, m.word('tattoo', 'butt'), 1.0, 0.35, 95)
    for k in range(5): tone(m, m.word('steal', 'all') + k * 0.08, 2400 + k * 200, 0.15, 0.12, 25)
    m.whoosh(m.word('steal', 'stole'), 0.4, 0.3)
    tone(m, m.word('ted', 'flirting'), 880, 0.5, 0.12); tone(m, m.word('ted', 'flirting', off=6), 1100, 0.6, 0.12)
    m.pop(m.word('junior', 'gained'), 0.6, 300); m.thud(m.word('junior', 'gained', off=3), 0.7)
    tone(m, m.word('chicken', 'clean'), 2093, 0.6, 0.12); tone(m, m.word('chicken', 'clean', off=5), 2637, 0.6, 0.12)
    for k in range(6): tone(m, m.a('pigeons') + 0.3 + k * 0.7, 420 + 40 * (k % 3), 0.18, 0.08, 15)
    spray(m, m.word('burrito', 'hot'), m.b('burrito'), 0.05)
    for n in range(3): m.thud(m.word('burrito', 'hot', n), 0.4)
    m.steps(m.word('burrito', 'health'), m.b('burrito'), 0.18, 0.25)
    m.steps(m.a('roaches', 6), m.b('roaches'), 0.08, 0.12)
    tone(m, m.word('cat', 'cat'), 700, 0.4, 0.1, 4)
    m.thud(m.word('vending', 'assaulted'), 0.8); m.clunk(m.word('vending', 'vending'), 0.5)
    m.hush(m.a('ring'), m.word('ring', 'rang', off=-2))
    for k in range(4): buzz(m, m.word('ring', 'rang') + k * 0.7, 0.4, 0.45, 150)
    m.sting(m.word('sal', 'mostly'), 0.5)
    m.whoosh(m.word('bald', 'bald', off=-4), 0.5, 0.35); tone(m, m.word('bald', 'secretly'), 3136, 0.5, 0.1)
    m.sting(m.word('rv', 'in'), 0.7); m.pop(m.word('rv', 'snacks'), 0.6, 600)
    m.tail(m.b('rv', -30), 0.35)
    return m.done()
