// "My Dog Came Home… Wrong (Part 3)": the bedroom set (sets.js) at night. Bruno is the drawn Shorts' dog (pet3d.js).
import * as SETS from './sets.js';
import { petCard } from './pet3d.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const AT = [-40, 0, 0], W0 = (x, y, z) => [AT[0] + x, AT[1] + y, AT[2] + z];
const KEYPAD = W0(2.33, 1.2, 0.94), DOOR = W0(2.3, 1.1, 0.6), KID = W0(0.75, 0, -0.35), KID_DOOR = W0(1.85, 0, 0.75);
const DOG_BED = W0(0.05, 0, -0.75), UNDER = W0(-0.5, 0.17, -1.07), OUT = (x, z) => W0(-8.4 + x, -0.55, z);
const MUM_OUT = OUT(2.3, 0.4), REAL_BRUNO = OUT(2.9, 0.75);

const IDS = ['lock', 'beep', 'code', 'birthday', 'open', 'enter', 'sit', 'relax', 'car', 'window', 'bruno', 'lookback', 'smile', 'bark', 'shh', 'under'];
const CAMS = {
  lock: [{ pos: W0(-0.6, 1.5, -0.2), look: W0(2.0, 1.1, 0.7), fov: 50 }, { pos: W0(-0.2, 1.45, 0.0), look: W0(2.1, 1.12, 0.7), fov: 44 }],
  beep: [{ pos: W0(1.55, 1.25, 1.0), look: KEYPAD, fov: 28 }, { pos: W0(1.75, 1.22, 0.98), look: KEYPAD, fov: 22 }],
  code: [{ pos: W0(1.45, 1.28, 0.94), look: W0(2.33, 1.28, 0.94), fov: 24 }, { pos: W0(1.5, 1.28, 0.94), look: W0(2.33, 1.28, 0.94), fov: 22 }],
  birthday: [{ pos: W0(-0.6, 1.35, 1.0), look: W0(0.75, 1.15, -0.35), fov: 40 }, { pos: W0(-0.45, 1.33, 0.85), look: W0(0.75, 1.18, -0.35), fov: 34 }],
  open: [{ pos: W0(-0.4, 1.2, -0.3), look: W0(2.3, 1.0, 0.6), fov: 44 }, { pos: W0(0.1, 1.15, -0.1), look: W0(2.3, 1.0, 0.6), fov: 38 }],
  enter: [{ pos: W0(-0.9, 0.7, 1.4), look: W0(1.3, 0.4, 0.2), fov: 50 }, { pos: W0(-0.6, 0.65, 1.3), look: W0(0.6, 0.4, -0.3), fov: 46 }],
  sit: [{ pos: W0(1.3, 0.85, 0.9), look: W0(0.05, 0.5, -0.75), fov: 40 }, { pos: W0(1.0, 0.8, 0.6), look: W0(0.05, 0.5, -0.75), fov: 36 }],
  relax: [{ pos: W0(-0.5, 1.35, 1.1), look: W0(0.75, 1.15, -0.35), fov: 38 }, { pos: W0(-0.4, 1.33, 0.95), look: W0(0.75, 1.18, -0.35), fov: 34 }],
  car: [{ pos: W0(0.4, 1.45, 0.4), look: W0(-2.4, 1.4, -0.2), fov: 46 }, { pos: W0(-0.6, 1.45, 0.1), look: W0(-2.4, 1.35, -0.2), fov: 40 }],
  window: [{ pos: W0(-1.9, 1.5, -0.15), look: W0(-6.2, 0.4, 0.0), fov: 40 }, { pos: W0(-2.05, 1.48, -0.15), look: W0(-6.0, 0.3, 0.3), fov: 34 }],
  bruno: [{ pos: W0(-2.05, 1.45, -0.1), look: W0(-5.5, 0.1, 0.75), fov: 28 }, { pos: W0(-2.1, 1.4, -0.05), look: W0(-5.5, 0.05, 0.75), fov: 20 }],
  lookback: [{ pos: W0(-1.6, 1.45, 0.3), look: W0(-0.5, 1.0, -0.3), fov: 44 }, { pos: W0(-0.2, 1.1, 0.7), look: W0(0.05, 0.55, -0.75), fov: 40 }],
  smile: [{ pos: W0(0.6, 0.6, 0.7), look: W0(0.05, 0.42, -0.75), fov: 40 }, { pos: W0(0.4, 0.55, 0.2), look: W0(0.05, 0.42, -0.75), fov: 38 }],
  bark: [{ pos: W0(-1.5, 1.5, -0.75), look: W0(1.6, 0.75, 0.25), fov: 58 }, { pos: W0(-1.35, 1.45, -0.7), look: W0(1.6, 0.8, 0.25), fov: 54 }],
  shh: [{ pos: W0(0.55, 0.6, 0.6), look: W0(0.05, 0.4, -0.75), fov: 40 }, { pos: W0(0.45, 0.55, 0.3), look: W0(0.05, 0.4, -0.75), fov: 37 }],
  under: [{ pos: W0(0.3, 0.5, 1.0), look: W0(-0.3, 0.3, -0.95), fov: 46 }, { pos: W0(-0.35, 0.22, 0.05), look: W0(-0.5, 0.18, -1.07), fov: 34 }],
};

const LIGHTS = {
  night: { ...MOODS.night, hemi: 0.85, fogNear: 9, fogFar: 40 },
  dread: { ...MOODS.dread, hemi: 0.7, fogNear: 8, fogFar: 36, vig: 0.6 },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.i >= 11 ? 'dread' : 'night'),
  kicks: ['open', 'smile'],
  focus: (S) => ({ lock: KID_DOOR.map((v, i) => i === 1 ? 1.2 : v), beep: KEYPAD, code: KEYPAD, birthday: W0(0.75, 1.18, -0.35), open: DOOR, enter: W0(1.0, 0.4, 0.1),
    sit: W0(0.05, 0.5, -0.75), relax: W0(0.75, 1.18, -0.35), car: W0(-2.4, 1.4, -0.2), window: MUM_OUT.map((v, i) => i === 1 ? 0.6 : v), bruno: REAL_BRUNO,
    lookback: W0(0.05, 0.55, -0.75), smile: W0(0.05, 0.42, -0.75), bark: W0(0.4, 0.8, -0.5), shh: W0(0.05, 0.4, -0.75), under: UNDER }[S.id]),
  shadowAt: () => W0(0.2, 0.6, -0.4),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, dofAt, camAt } = K;
export { LIGHTS };

// ---------- the set ----------
export const build = (ctx) => {
  SETS.houseLightsOff(ctx);
  const br = SETS.bedroom(ctx, { at: AT });
  br.photo.draw('family', (g, w, h) => { g.fillStyle = '#e8d8b8'; g.fillRect(0, 0, w, h); g.fillStyle = '#9ac0e0'; g.fillRect(14, 14, w - 28, h - 28);
    g.fillStyle = '#7b4a2b'; g.beginPath(); g.ellipse(w / 2, h * 0.62, w * 0.22, h * 0.16, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(w / 2, h * 0.42, w * 0.16, h * 0.12, 0, 0, 7); g.fill(); });  // a photo of Bruno
  return { br };
};
export const update = (W, f, P) => P.br && P.br.state(W, f);
export const worldAt = (f) => {
  const S = shotAt(f), i = S.i, id = S.id;
  const W = { door: 0, beep: -1, unlocked: false, lamp: 1.1, moon: 0.8, street: 1.2, headlights: 0, car: false, carIn: 0, motes: false, gap: false, feet: false, wind: 0 };
  if (id === 'beep') W.beep = Math.floor((f - S.a) / 6) % 12;
  if (id === 'code') { const n = Math.max(1, (S.b - 20 - S.a) / 4), d = (f - S.a) % n; W.beep = f < S.b - 20 && d < 7 ? 1 : -1; }
  if (i >= 4) { W.unlocked = true; W.door = id === 'open' ? 0.55 * smooth(ramp(f, S.beat - 6, S.b)) : 0.55; }
  if (i >= 8) { W.car = true; W.carIn = id === 'car' ? smooth(ramp(f, S.a, S.b - 10)) : 1; W.headlights = id === 'car' ? 2.5 : 0.6; }
  if (i >= 11) W.lamp = 0.7;
  return W;
};

// ---------- the cast ----------
const KS = 0.72;
const dog = (o, f, pos, s = 0.55, extra = {}) => ({ key: 'dog' + JSON.stringify(o) + (o.wag ? f % 24 : 0), draw: (p) => petCard(p, o, f), x: pos[0], y: pos[1], z: pos[2], s, ...extra });
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const kid = (expr, o = {}, pos = KID) => out.push(actor(T, 'kid', { seed: 9, expr, blink: blinkAt(f, 9), ...o }, pos, { s: KS }));
  if (id === 'lock') kid(f < S.beat ? 'wary' : 'nervous', { R: 'knock', look: 0.8 }, KID_DOOR);
  if (id === 'birthday') kid('scared', { blink: 0, look: 0.7 });
  if (id === 'open') kid('scared', { blink: 0, look: 0.8 });
  if (id === 'enter') { const t = smooth(ramp(f, S.a, S.b)); out.push(dog({ pose: 'walk', expr: 'calm', flip: true }, f, lerp3(W0(2.0, 0, 0.55), DOG_BED, t), 0.6)); }
  if (id === 'sit' || id === 'relax' || id === 'lookback' || id === 'bark') {
    out.push(dog({ pose: 'sit', expr: id === 'bark' ? 'grin' : 'happy', wag: id === 'bark' ? 0 : 1 }, f, DOG_BED));
    if (id === 'relax') kid('relief', { look: -0.5 });
    if (id === 'bark') kid('scared', { look: 0.7, blink: 0 });
  }
  if (id === 'car') kid('wary', { look: -0.8 }, W0(-1.6, 0, 0.3));
  if (id === 'window' || id === 'bruno') {
    out.push(actor(T, 'mumNight', { seed: 41, expr: 'smile', blink: blinkAt(f, 41), look: 0.5, R: 'point' }, MUM_OUT, { s: 0.82 }));
    out.push(dog({ pose: 'sit', expr: 'happy', wag: 1, name: 'BRUNO' }, f, REAL_BRUNO, 0.55));
  }
  if (id === 'smile') out.push(dog({ pose: 'sit', expr: f < S.beat ? 'calm' : 'grin', wag: f < S.beat - 10 ? 1 : 0 }, f, DOG_BED));
  if (id === 'shh') out.push(dog({ pose: 'sit', expr: 'grin', wag: 0, shh: f >= S.beat - 12 }, f, DOG_BED));
  if (id === 'under' && f < S.beat) { const t = smooth(ramp(f, S.a, S.beat)); out.push(dog({ pose: 'walk', expr: 'grin', flip: true }, f, lerp3(DOG_BED, W0(-0.4, 0, -0.95), t), lerp(0.55, 0.42, t))); }
  return out;
};
export const fxAt = (f) => {
  const S = shotAt(f), out = [];
  if (S.id === 'code') {                                   // 1 . 9 . 9 . 8 lights up beside the keypad
    const k = Math.floor(ramp(f, S.a, S.b - 20) * 4), d = ['1', '9', '9', '8'];
    const txt = d.slice(0, Math.min(3, k) + 1).join(' '); out.push(fx('code' + txt, word(txt, 0, '#9fe0ff'), W0(2.28, 1.2, 0.94), 0.13));
  }
  if (S.id === 'open') { const d = f - S.beat; if (d >= 0 && d < 16) { const t = q(d / 16); out.push(fx('click' + t, word('CLICK', t), W0(2.25, 1.5, 0.75), 0.3)); } }
  if (S.id === 'bark') { const d = (f - S.a) % 22; if (d < 14) { const t = q(d / 14); out.push(fx('woof' + t, word('WOOF!', t, '#ffb86b'), W0(2.1, 1.75, 0.6), 0.4)); } }
  if (S.id === 'under' && f >= S.beat) {                   // under the bed, two eyes that stay open
    const blink = (f % 70) < 3;
    out.push(fx('eyes' + blink, (p) => { const g = p.g; if (blink) return; g.save(); g.globalCompositeOperation = 'lighter';
      for (const x of [255, 345]) { const gr = g.createRadialGradient(x, 900, 0, x, 900, 60); gr.addColorStop(0, '#fff6c8'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 60, 840, 120, 120);
        g.fillStyle = '#fffbe8'; g.beginPath(); g.ellipse(x, 900, 13, 9, 0, 0, 7); g.fill(); } g.restore(); }, W0(-0.45, 0.0, -1.06), 0.32));
  }
  return out;
};
