// "Why My Grandma Never Opens the Door on the Second Knock": one shot per script line, timed to the storyteller's take.
import { TIMING, TOTAL as T_TOTAL } from './timing.js';
export const FPS = 30, TOTAL = T_TOTAL, DECK = 0;
const IDS = ['rule', 'never', 'first', 'still', 'habit', 'night', 'knock1', 'nobody', 'knock2', 'voice', 'voice2', 'turn', 'behind', 'end', 'end2'];
const NIGHT_FROM = 5;
export const SHOTS = IDS.map((id, i) => ({ id, i, a: TIMING[i].a, b: TIMING[i].b, beat: TIMING[i].beat, light: i < NIGHT_FROM ? 'eve' : 'night' }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ramp = (f, a, b) => clamp((f - a) / (b - a));
const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;
const sh = (id) => SHOTS[IDS.indexOf(id)];
// every knock in the film: [frame, loud]
export const KNOCKS = [[sh('still').beat, 0.6], [sh('knock1').beat, 1], [sh('knock2').beat, 1]].flatMap(([f, g]) => [[f, g], [f + 12, g]]);

export const LIGHTS = {
  eve: { az: 180, el: 16, sky: '#ffe2c4', ground: '#6a4a3a', hemi: 0.95, sun: '#ffc48a', sunI: 1.9, fog: '#d6a080', fogNear: 14, fogFar: 70,
    skyTop: '#5a62b0', skyHor: '#f4a874', sat: 1.12, vig: 0.24, shadowExt: 7, lamp: 2.4, tv: 1.6, porch: 0, fill: 0, gain: '#fff4e6' },
  night: { az: 180, el: 26, sky: '#7f93d8', ground: '#2a2a4a', hemi: 1.0, sun: '#b8ccff', sunI: 2.3, fog: '#141c3c', fogNear: 7, fogFar: 34,
    skyTop: '#060a22', skyHor: '#1e2a58', sat: 1.08, vig: 0.36, shadowExt: 7, lamp: 0, tv: 0, porch: 1.6, fill: 1.5, gain: '#e6ecff', lift: '#03040c' },
};
export const lightFor = (S, f) => {
  const L = { ...LIGHTS[S.light] };
  if (S.id === 'still' && f > S.beat - 14) { L.tv = 0; L.lamp = 1.4; L.hemi = 0.75; }
  if (S.id === 'habit') { L.tv = 0; }
  if (['behind', 'end'].includes(S.id)) { L.vig = 0.5; }
  return L;
};

// cameras: [start, end] per shot, glide across the whole line
const CAMS = {
  rule: [{ pos: [0.2, 1.35, 1.9], look: [2.1, 1.0, -1.2], fov: 44 }, { pos: [0.6, 1.3, 1.3], look: [2.15, 1.02, -1.2], fov: 41 }],
  never: [{ pos: [1.2, 1.3, 0.6], look: [2.18, 1.18, -1.2], fov: 36 }, { pos: [1.4, 1.27, 0.3], look: [2.18, 1.2, -1.2], fov: 34 }],
  first: [{ pos: [1.1, 1.4, 0.9], look: [0, 1.1, -3.2], fov: 42 }, { pos: [0.9, 1.38, 0.5], look: [0, 1.1, -3.4], fov: 40 }],
  still: [{ pos: [-1.6, 1.55, 2.5], look: [1.6, 0.85, -1.4], fov: 46 }, { pos: [-1.2, 1.5, 2.1], look: [1.7, 0.9, -1.3], fov: 44 }],
  habit: [{ pos: [0.9, 1.3, 1.5], look: [-0.5, 1.15, -0.6], fov: 40 }, { pos: [0.7, 1.3, 1.2], look: [-0.5, 1.18, -0.6], fov: 37 }],
  night: [{ pos: [-2.9, 1.7, 2.7], look: [0.2, 1.0, -2.6], fov: 50 }, { pos: [-2.6, 1.65, 2.4], look: [0.2, 1.0, -2.6], fov: 48 }],
  knock1: [{ pos: [1.7, 1.3, -0.3], look: [0.25, 1.15, -3.0], fov: 42 }, { pos: [1.55, 1.3, -0.5], look: [0.25, 1.15, -3.0], fov: 40 }],
  nobody: [{ pos: [-0.9, 1.45, 0.2], look: [0.1, 1.0, -4.5], fov: 44 }, { pos: [-0.7, 1.42, -0.4], look: [0.1, 1.0, -5.0], fov: 40 }],
  knock2: [{ pos: [1.5, 1.3, -0.6], look: [0.2, 1.2, -3.1], fov: 40 }, { pos: [1.3, 1.3, -0.9], look: [0.2, 1.2, -3.1], fov: 37 }],
  voice: [{ pos: [0, 1.0, 0.4], look: [0, 0.8, -3.2], fov: 42 }, { pos: [0, 0.85, -0.6], look: [0, 0.65, -3.2], fov: 39 }],
  voice2: [{ pos: [0, 0.85, -0.6], look: [0, 0.65, -3.2], fov: 39 }, { pos: [0, 0.7, -1.6], look: [0, 0.5, -3.2], fov: 35, roll: 2 }],
  turn: [{ pos: [0.2, 1.3, -2.85], look: [0.5, 1.2, -1.9], fov: 40 }, { pos: [0.22, 1.3, -2.8], look: [0.5, 1.22, -1.9], fov: 38 }],
  behind: [{ pos: [0.15, 1.35, -2.75], look: [0.6, 1.2, 0.4], fov: 44 }, { pos: [0.25, 1.33, -2.55], look: [0.7, 1.25, 0.4], fov: 40 }],
  end: [{ pos: [0.15, 1.35, -1.9], look: [1.0, 1.25, -0.35], fov: 42 }, { pos: [0.3, 1.36, -1.6], look: [1.0, 1.27, -0.35], fov: 38 }],
  end2: [{ pos: [0, 0.6, -1.2], look: [0, 0.35, -3.2], fov: 38 }, { pos: [0, 0.35, -2.1], look: [0, 0.12, -3.2], fov: 32 }],
};
export const camAt = (f) => {
  const S = shotAt(f), K = CAMS[S.id], t = smooth(ramp(f, S.a, S.b)), a = K[0], b = K[1];
  const c = { pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll || 0, b.roll || 0, t) };
  for (const [kf, g] of KNOCKS) { const d = f - kf; if (d >= 0 && d < 7) { const s = (d % 2 ? -1 : 1) * 0.028 * g * (1 - d / 7); c.look = [c.look[0], c.look[1] + s * 3, c.look[2] + s * 2]; c.roll = (c.roll || 0) + s * 20; } }
  const tb = sh('behind').beat; { const d = f - tb; if (d >= 0 && d < 7) { const s = (d % 2 ? -1 : 1) * 0.04 * (1 - d / 7); c.roll = (c.roll || 0) + s * 20; } }
  const n0 = sh('night').a; c.flash = f >= n0 && f < n0 + 6 ? (1 - (f - n0) / 6) * 0.6 : 0;
  c.shadowAt = [0, 0.8, -0.5];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const GRAN = [2.2, -0.42, -1.15], GRAN_N = [1.05, 0, -0.35];
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'rule': case 'never': case 'still': return { focus: dist(C.pos, [2.2, 1.2, -1.15]), cinf: 9 };
    case 'habit': return { focus: dist(C.pos, [-0.5, 1.2, -0.6]), cinf: 9 };
    case 'first': return { focus: dist(C.pos, [0, 1.2, -3.2]), cinf: 8 };
    case 'knock1': case 'knock2': return { focus: dist(C.pos, [0.8, 1.2, -2.2]), cinf: 4 };
    case 'nobody': return { focus: dist(C.pos, [0, 1.2, -4.0]), cinf: 6 };
    case 'night': return { focus: dist(C.pos, [0.6, 1.2, -2.0]), cinf: 5 };
    case 'voice': case 'voice2': case 'end2': return { focus: dist(C.pos, [0, 0.3, -3.2]), cinf: 10 };
    case 'turn': return { focus: dist(C.pos, [0.5, 1.25, -1.9]), cinf: 10 };
    case 'behind': { const t = smooth(ramp(f, S.beat - 8, S.beat + 8)); return { focus: lerp(dist(C.pos, [0.5, 1.25, -1.9]), dist(C.pos, [1.0, 1.4, -0.4]), t), cinf: 10, near: 1 }; }
    case 'end': return { focus: dist(C.pos, [1.0, 1.4, -0.35]), cinf: 12 };
  }
  return { focus: 4, cinf: 0 };
};

export const worldAt = (f) => {
  const S = shotAt(f), nightS = S.light === 'night';
  const W = { door: 0, doorShake: 0, wind: nightS ? 0.9 : 0.35, motes: nightS, gap: nightS, feet: false };
  if (S.id === 'first') W.door = 1.15 * smooth(ramp(f, S.a + 8, S.a + 44));
  if (S.id === 'nobody') W.door = 1.2 * smooth(ramp(f, S.a + 6, S.a + 46));
  for (const [kf, g] of KNOCKS) { const d = f - kf; if (d >= 0 && d < 8) W.doorShake = (d % 2 ? -1 : 1) * (8 - d) * g; }
  if (['voice', 'voice2', 'turn', 'behind', 'end', 'end2'].includes(S.id)) W.feet = true;
  if (S.id === 'knock2') W.feet = f > S.beat + 16;
  return W;
};

const blinkAt = (f, seed) => { const per = 38 + (seed * 17) % 31, ph = (f + seed * 13) % per; return ph < 2 ? 0.5 : ph < 4 ? 1 : 0; };
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const NT = '#b4c2f0';
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], bt = S.beat;
  const gran = (o, pos = GRAN, extra = {}) => out.push(R(T, 'gran', { seed: 5, blink: blinkAt(f, 5), look: -0.4, ...o }, pos, { s: 0.92, ...extra }));
  const kid = (o, pos, extra = {}) => out.push(R(T, 'kid', { seed: 9, blink: blinkAt(f, 9), ...o }, pos, { s: 0.72, ...extra }));
  switch (S.id) {
    case 'rule': gran({ expr: 'neutral', look: -0.5 }); break;
    case 'never': gran({ expr: 'stern', R: 'up', look: -0.3, headTilt: q(2 * Math.sin(f * 0.2), 1) }); break;
    case 'first': {
      if (f > S.a + 26) out.push(R(T, 'milk', { seed: 14, expr: 'grin', L: 'wave', wv: q(f * 0.4 % 6.28, 1), blink: blinkAt(f, 14) }, [0.05, 0, -4.1], { s: 0.9 }));
      gran({ expr: 'grin', facing: -1, look: -0.6 }, [-0.9, 0, -2.4]);
      break;
    }
    case 'still': { const hush = f > bt - 14; gran({ expr: hush ? 'wary' : 'neutral', look: hush ? -0.8 : -0.3, blink: hush ? 0 : blinkAt(f, 5) }); kid({ expr: f > bt ? 'nervous' : 'neutral', look: -0.7 }, [-0.6, 0, -0.6]); break; }
    case 'habit': kid({ expr: 'smile', look: 0.3, L: 'up', R: 'up', headTilt: q(4 * Math.sin(f * 0.15), 1) }, [-0.5, 0, -0.6]); gran({ expr: 'wary', look: -0.7, blink: 0 }); break;
    case 'night': kid({ expr: 'wary', look: -0.4 }, [0.62, 0, -2.0], { tint: NT }); break;
    case 'knock1': kid({ expr: f > bt ? 'shock' : 'wary', look: -0.8, blink: f > bt ? 0 : blinkAt(f, 9) }, [1.05, 0, -1.95], { tint: NT }); break;
    case 'nobody': kid({ expr: f > S.a + 50 ? 'nervous' : 'wary', look: -0.6, L: f < S.a + 46 ? 'reach' : 'hang' }, [1.0, 0, -1.6], { tint: NT }); break;
    case 'knock2': kid({ expr: 'scared', look: -0.8, blink: 0, headTilt: q(2 * Math.sin(f * 1.4), 1) }, [0.95, 0, -2.0], { tint: NT }); break;
    case 'turn': kid({ expr: 'scared', look: q(lerp(-0.6, 0.5, smooth(ramp(f, S.a + 4, S.b - 4))), 1), blink: 0 }, [0.5, 0, -1.9], { tint: NT }); break;
    case 'behind': {
      kid({ expr: 'scared', look: 0.3, blink: 0, headTilt: q(3 * Math.sin(f * 1.3), 1) }, [0.45, 0, -1.9], { tint: NT });
      const a = smooth(ramp(f, bt - 10, bt + 6));
      if (a > 0) out.push(R(T, 'granNight', { seed: 5, expr: 'hush', R: 'hush', look: -0.3, blink: 0 }, GRAN_N, { s: 0.92, alpha: q(a), tint: '#d4dcff' }));
      break;
    }
    case 'end': out.push(R(T, 'granNight', { seed: 5, expr: 'hush', R: 'hush', look: -0.5, blink: blinkAt(f, 5) > 0.9 ? 1 : 0 }, GRAN_N, { s: 0.92, tint: '#d4dcff' })); break;
  }
  return out;
};

const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const knockTxt = (txt, t) => (p) => { const g = p.g; g.save(); g.font = '900 150px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round';
  g.globalAlpha = Math.max(0, 1 - t * 1.1); g.translate(300, 500); g.scale(1 + t * 0.35, 1 + t * 0.35); g.rotate(-0.08);
  g.lineWidth = 22; g.strokeStyle = '#241726'; g.strokeText(txt, 0, 0); g.fillStyle = '#ffd23f'; g.fillText(txt, 0, 0); g.restore(); };
export const fxAt = (f, T) => {
  const out = [];
  for (const [kf] of KNOCKS) { const d = f - kf; if (d >= 0 && d < 18) { const t = q(d / 18); out.push(FX('kn' + t, knockTxt('KNOCK', t), [0.05, 1.45, -2.95], 0.75)); } }
  return out;
};
