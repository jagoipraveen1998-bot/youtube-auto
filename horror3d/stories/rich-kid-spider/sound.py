"""Sound for What If The Spider Bit A Rich Kid?: a lab hum and a glowing bite, a crowd clapping at the gala,
gift boxes popping, a car lifted with a groan, the whisper ringing, a trophy snapped up by a web, the club queue
gasping, the wind of a swing between towers, a far cry for help, the busy crossing (horns, engines), web shots
(thwip), two thieves slammed onto a cab, brakes everywhere, phone cameras clicking, and a hard sting on the twist."""
import sys, pathlib
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['bite', 'gala', 'gifts', 'powers', 'trophy', 'club', 'swing', 'walter', 'hear', 'grabbed', 'webs', 'filmed', 'hired', 'fired']


def thwip(m, at, g=0.55):                          # a web shot: a fast falling zip and a soft snap
    d = 0.22; tt = np.arange(int(d * m.SR)) / m.SR
    f = 5200 * np.exp(-tt * 14) + 600
    x = np.sin(2 * np.pi * np.cumsum(f) / m.SR) * np.exp(-tt * 9)
    x += m.hp(m.nz(d)[:len(tt)], 2500) * np.exp(-tt * 30) * 0.5
    m.put(m.sfx, at, x * g)


def shutter(m, at, g=0.3):                         # a phone camera click
    n = int(0.05 * m.SR); x = m.hp(m.nz(0.05)[:n], 2000) * np.exp(-np.arange(n) / m.SR * 120)
    m.put(m.sfx, at, x * g); m.put(m.sfx, at + 0.06, x * g * 0.7)


def crowd(m, t0, t1, g=0.3, cheer=False):          # many voices: a murmur, or cheering
    n = int((t1 - t0) * m.SR)
    if n <= 0: return
    tt = np.arange(n) / m.SR
    x = m.bp(m.nz(t1 - t0)[:n], 300, 2600) * (0.6 + 0.4 * np.sin(tt * 3.1) * np.sin(tt * 1.7))
    if cheer: x *= 1.8
    m.put(m.amb, t0, x * np.minimum(1, tt / 0.3) * np.minimum(1, (tt[-1] - tt) / 0.3 + 1e-3) * g)


def claps(m, t0, t1, g=0.3):                       # applause: many short clicks
    t = t0
    while t < t1:
        shutter(m, t, g * 0.5); t += 0.03 + m.rng.random() * 0.05


def city(m, t0, t1, g=0.3):                        # a busy avenue: engine rumble and a horn now and then
    n = int((t1 - t0) * m.SR)
    if n <= 0: return
    tt = np.arange(n) / m.SR
    m.put(m.amb, t0, m.lp(m.nz(t1 - t0)[:n], 350) * np.minimum(1, tt / 0.3) * np.minimum(1, (tt[-1] - tt) / 0.3 + 1e-3) * g)
    for at in np.arange(t0 + 0.6, t1 - 0.5, 1.7): horn(m, at + m.rng.random() * 0.6, 0.25, 0.12)


def horn(m, at, d=0.3, g=0.2):                     # a car horn
    tt = np.arange(int(d * m.SR)) / m.SR
    x = np.sign(np.sin(2 * np.pi * 415 * tt)) * 0.5 + np.sign(np.sin(2 * np.pi * 523 * tt)) * 0.3
    m.put(m.sfx, at, m.lp(x, 2200) * np.minimum(1, tt / 0.02) * np.minimum(1, (d - tt) / 0.04) * g)


def brakes(m, at, d=0.6, g=0.3):
    tt = np.arange(int(d * m.SR)) / m.SR
    x = np.sin(2 * np.pi * (2100 + 250 * np.sin(tt * 28)) * tt) * np.minimum(1, tt / 0.05) * np.exp(-tt * 3)
    m.put(m.sfx, at, x * g)


def shimmer(m, at, d=0.7, g=0.18):                 # gold sparkle
    tt = np.arange(int(d * m.SR)) / m.SR
    x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * (4 + i)) for i, f in enumerate((2093, 2637, 3136, 4186)))
    m.put(m.sfx, at, x * g)


def rings(m, at, d=1.2, g=0.18):                   # super-hearing: a high ringing tone, pulsing
    tt = np.arange(int(d * m.SR)) / m.SR
    m.put(m.sfx, at, np.sin(2 * np.pi * 3400 * tt) * (0.5 + 0.5 * np.sin(tt * 30)) * np.minimum(1, tt / 0.1) * np.exp(-tt * 1.5) * g)


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=37)
    m.room(0.35)
    m.score(style='strings', quiet=[(m.a('hear'), m.b('hear'), 0.4), (m.a('hired'), m.b('fired'), 0.5)])
    m.hum(0.25, 60, mask=m.span(m.a('bite'), m.b('bite')))                     # the lab
    shimmer(m, m.word('bite', 'glowing'), 0.8, 0.14)
    m.pop(m.word('bite', 'bitten'), 0.6, 500); m.thud(m.word('bite', 'bitten', off=2), 0.4)
    crowd(m, m.a('gala'), m.b('gala'), 0.25); claps(m, m.word('gala', 'millions'), m.b('gala'), 0.35)
    for k in range(4): shutter(m, m.a('gala', 8) + k * 0.9, 0.22)
    for k in range(5): m.pop(m.word('gifts', 'everything') + k * 0.14, 0.32, 700 + k * 90)
    city(m, m.a('powers'), m.b('powers'), 0.18)
    m.thud(m.word('powers', 'walls'), 0.3); m.creak(m.word('powers', 'cars'), 0.7, 0.35, pitch=90)
    rings(m, m.word('powers', 'whisper'))
    thwip(m, m.word('trophy', 'trophy', off=-2)); m.clunk(m.word('trophy', 'shelf'), 0.5)
    crowd(m, m.a('club'), m.b('club'), 0.2); m.whoosh(m.word('club', 'climbed'), 0.5, 0.35)
    m.wind(0.5, mask=m.span(m.a('swing'), m.b('swing')))
    for k in range(3): thwip(m, m.a('swing') + 0.15 + k * (m.b('swing') - m.a('swing')) / 3, 0.45); m.whoosh(m.a('swing') + 0.5 + k * (m.b('swing') - m.a('swing')) / 3, 0.6, 0.4)
    shimmer(m, m.word('swing', 'sneakers'), 0.6, 0.15)
    m.steps(m.a('walter', 6), m.a('walter', 40), 0.5, 0.25)
    m.heartbeat(m.a('hear'), m.b('hear'), 70, 110, 0.4)
    rings(m, m.word('hear', 'heard'), 1.4, 0.2)
    m.hush(m.word('hear', 'help', off=-15), m.word('hear', 'help'))
    m.sting(m.word('hear', 'help'), 0.6)
    city(m, m.a('grabbed'), m.b('webs'), 0.3); crowd(m, m.a('grabbed'), m.b('webs'), 0.25)
    m.thud(m.word('grabbed', 'grabbed'), 0.5)
    m.whoosh(m.a('webs', 2), 0.6, 0.6)
    thwip(m, m.word('webs', 'webs'), 0.7); thwip(m, m.word('webs', 'webs', off=5), 0.7)
    m.thud(m.word('webs', 'webs', off=12), 0.8); m.thud(m.word('webs', 'webs', off=17), 0.8)
    for k in range(4): brakes(m, m.word('webs', 'traffic', off=-9) + k * 0.12, 0.6, 0.18)
    crowd(m, m.word('webs', 'traffic'), m.b('webs'), 0.4, cheer=True)
    for k in range(8): shutter(m, m.a('grabbed', 10) + k * 0.6 + m.rng.random() * 0.3, 0.2)
    for k in range(10): shutter(m, m.a('filmed') + k * 0.35 + m.rng.random() * 0.2, 0.22)
    crowd(m, m.a('filmed'), m.word('filmed', 'smiling'), 0.3, cheer=True)
    m.creak(m.word('filmed', 'door'), 0.7, 0.3, pitch=150)
    m.hush(m.b('filmed', -18), m.a('hired', 2))
    m.sting(m.word('hired', 'hired'), 0.9); shimmer(m, m.word('hired', 'trending'), 0.9, 0.2)
    m.sting(m.word('fired', 'fired'), 0.8)
    m.tail(m.b('fired', -30), 0.35)
    return m.done()
