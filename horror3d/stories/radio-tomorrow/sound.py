"""Sound for My Grandpa's Radio Plays Tomorrow's News: a quiet sitting room, the old radio's crackle and hum under
every broadcast, our own creepy score; morning: the door, the bicycle freewheeling down the hill, a brake squeal,
the lorry roaring past with its horn; a heartbeat building through the second broadcast; two seconds of silence
before ten fifteen, the horn and the roar rising, then everything stops dead as the picture freezes; one low hit
under the question. The fire: crackling flames, fists on a door, the door bursting open in a rush of smoke."""
import sys, pathlib
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2]))
from soundkit import Mix

IDS = ['radio', 'broadcast', 'coat', 'hill', 'grab', 'lorry', 'shaking', 'warn2', 'knock', 'smoke', 'night2', 'oldman', 'switch', 'plea', 'empty', 'corner']


def crackle(m, t0, t1, g=0.3):                  # an old valve radio: hum, hiss and random pops
    n = int((t1 - t0) * m.SR)
    if n <= 0: return
    tt = np.arange(n) / m.SR
    hiss = m.bp(m.nz(t1 - t0)[:n], 900, 5000) * 0.25
    hum = 0.18 * np.sin(2 * np.pi * 100 * tt) + 0.08 * np.sin(2 * np.pi * 150 * tt)
    pops = np.zeros(n); k = m.rng.random(n) < 18 / m.SR; pops[k] = m.rng.choice([-1, 1], k.sum()) * 0.9
    pops = m.lp(pops, 3000)
    fade = np.minimum(1, tt / 0.15) * np.minimum(1, (tt[-1] - tt) / 0.15 + 1e-3)
    m.put(m.amb, t0, (hiss + hum + pops) * fade * g)


def freewheel(m, t0, t1, g=0.3):                 # a bicycle hub ticking, getting faster down the hill
    t = t0
    tick = np.sin(2 * np.pi * 3200 * np.arange(int(0.008 * m.SR)) / m.SR) * np.exp(-np.arange(int(0.008 * m.SR)) / m.SR * 600)
    while t < t1:
        m.put(m.sfx, t, tick * g); t += max(0.035, 0.12 - 0.08 * (t - t0) / max(0.1, t1 - t0))


def squeal(m, at, d=0.8, g=0.35):                 # brakes
    tt = np.arange(int(d * m.SR)) / m.SR
    x = np.sin(2 * np.pi * (2400 + 300 * np.sin(tt * 30)) * tt) * np.minimum(1, tt / 0.05) * np.exp(-tt * 2.5)
    m.put(m.sfx, at, x * g)


def lorry(m, t0, t1, peak, g=0.8):                # a heavy diesel roaring past: rumble swells to the pass, drops after
    n = int((t1 - t0) * m.SR)
    tt = np.arange(n) / m.SR + t0
    d = tt - peak
    env = 1 / (1 + (d / 0.55) ** 2)
    pitch = 1 + 0.12 * np.tanh(-d * 2)            # doppler: higher coming, lower going
    ph = np.cumsum(2 * np.pi * 48 * pitch / m.SR)
    eng = 0.6 * np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.2 * np.sign(np.sin(3 * ph))
    rush = m.lp(m.nz(t1 - t0)[:n], 1800) * 0.9
    m.put(m.sfx, t0, (m.lp(eng, 400) + rush) * env * g)


def horn(m, at, d=1.0, g=0.5):                    # an air horn, two notes
    tt = np.arange(int(d * m.SR)) / m.SR
    x = sum(np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 for f in (311, 370))
    m.put(m.sfx, at, m.lp(x, 2500) * np.minimum(1, tt / 0.03) * np.minimum(1, (d - tt) / 0.08) * g)


def fire(m, t0, t1, g=0.4):                     # flames: a low roar and sharp crackles
    n = int((t1 - t0) * m.SR)
    if n <= 0: return
    roar = m.lp(m.nz(t1 - t0)[:n], 500) * 0.8
    cr = np.zeros(n); k = m.rng.random(n) < 40 / m.SR; cr[k] = m.rng.standard_normal(k.sum()) * 1.2
    tt = np.arange(n) / m.SR
    m.put(m.amb, t0, (roar + m.hp(cr, 1500)) * np.minimum(1, tt / 0.4) * g)


def build(shots, total, FPS, SR):
    m = Mix(shots, total, FPS, SR, IDS, seed=91)
    m.room(0.4)
    m.score(style='creepy', quiet=[(m.a('hill'), m.b('shaking'), 0.55), (m.a('knock'), m.b('smoke'), 0.6), (m.a('corner'), m.b('corner'), 0.2)])
    crackle(m, m.a('radio', 6), m.b('broadcast'), 0.32)
    m.click(m.a('radio', 2), 0.7)
    m.creak(m.beat('coat', 2), 0.9, 0.5, pitch=160)                        # the front door
    freewheel(m, m.a('hill'), m.beat('grab'), 0.28)
    squeal(m, m.beat('grab', -6), 0.7, 0.35)
    lorry(m, m.a('lorry'), m.b('lorry'), (m.a('lorry') + m.b('lorry')) / 2, 0.9)
    horn(m, m.a('lorry', 4), 0.9, 0.4)
    crackle(m, m.a('warn2'), m.b('warn2'), 0.32)
    fire(m, m.a('knock'), m.b('smoke'), 0.45)
    for k in range(6): m.knock(m.a('knock', 6) + k * 0.28, 0.9, n_=1)          # fists on the door
    m.creak(m.a('smoke', 1), 0.5, 0.6, pitch=140); m.whoosh(m.a('smoke', 2), 1.0, 0.7)
    crackle(m, m.beat('night2'), m.beat('switch'), 0.34)
    m.heartbeat(m.a('oldman'), m.b('plea'), 60, 98, 0.45)
    m.click(m.beat('switch'), 1.0)
    crackle(m, m.a('empty'), m.b('empty'), 0.28)
    m.hush(m.b('empty', -60), m.a('corner', 4))                               # two seconds of nothing before ten fifteen
    horn(m, m.beat('corner', -22), 1.1, 0.6)
    lorry(m, m.beat('corner', -40), m.beat('corner'), m.beat('corner', 6), 1.0)   # rising… and cut dead at the freeze
    m.sting(m.beat('corner'), 0.9)
    m.drone(m.beat('corner', 2), m.b('corner'), 0.22, rise=4)
    return m.done()
