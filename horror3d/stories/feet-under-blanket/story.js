// "My Friend's Mum Said: Keep Your Feet Under The Blanket": the bedroom set (sets.js). At a sleepover your feet
// slip out; pale eyes under the bed, a long grey finger counts your toes... nine, ten, eleven. In the morning
// you pull off your sock and there are eleven.
import * as SETS from './sets.js';
import { OUTFITS } from './toon.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const B = [-40, 0, 0], W0 = (x, y, z) => [B[0] + x, B[1] + y, B[2] + z];
const YOU = { ...OUTFITS.kid, tunic: '#4a7ac0' }, FRIEND = { ...OUTFITS.kid, tunic: '#4a9a5a', hair: '#5a3a22' };
const HEAD = W0(-0.95, 0, -1.55), FA = W0(0.05, 0.5, -0.84), FB = W0(0.19, 0.5, -0.84), UNDER = W0(0.1, 0.12, -1.25);
// toe spots: foot A toes 1-5 (little to big), foot B toes 6-10, then the 11th grows on foot B
const TOEX = [-0.036, -0.018, 0, 0.018, 0.038];
const FS = 1.6, toeAt = (k) => { const base = k < 5 ? FA : FB, x = k < 5 ? TOEX[k] : k < 10 ? TOEX[k - 5] : 0.058; return [base[0] + x * FS, base[1] + 0.005 * FS, base[2] + (0.075 - Math.abs(x) * 0.5) * FS]; };

const IDS = ['rule', 'blanket', 'nod', 'hot', 'count', 'one', 'toes', 'nine', 'eleven', 'ten', 'sock'];
const FEET = W0(0.12, 0.5, -0.84);
const CAMS = {
  rule: [{ pos: W0(1.7, 1.35, 1.4), look: W0(0.1, 1.0, -0.4), fov: 50 }, { pos: W0(1.4, 1.3, 1.1), look: W0(0.1, 1.0, -0.4), fov: 44 }],
  blanket: [{ pos: W0(1.0, 1.1, 0.2), look: W0(-0.3, 0.55, -1.45), fov: 46 }, { pos: W0(0.8, 1.0, 0.0), look: W0(-0.3, 0.55, -1.45), fov: 40 }],
  nod: [{ pos: W0(1.2, 1.0, 1.55), look: W0(1.0, 0.92, 0.3), fov: 34 }, { pos: W0(1.15, 0.98, 1.3), look: W0(1.0, 0.92, 0.3), fov: 30 }],
  hot: [{ pos: W0(0.75, 0.85, 0.55), look: W0(-0.2, 0.5, -1.2), fov: 46 }, { pos: W0(0.6, 0.75, 0.25), look: W0(0.05, 0.48, -1.0), fov: 40 }],
  count: [{ pos: W0(0.4, 0.3, 0.45), look: UNDER, fov: 44 }, { pos: W0(0.32, 0.25, 0.15), look: UNDER, fov: 38 }],
  one: [{ pos: W0(0.35, 0.85, -0.05), look: FEET, fov: 40 }, { pos: W0(0.3, 0.8, -0.2), look: FEET, fov: 36 }],
  toes: [{ pos: W0(-0.45, 0.95, -0.55), look: W0(-0.95, 0.68, -1.55), fov: 38 }, { pos: W0(-0.55, 0.9, -0.7), look: W0(-0.95, 0.68, -1.55), fov: 34 }],
  nine: [{ pos: W0(0.42, 0.75, -0.25), look: FB, fov: 36 }, { pos: W0(0.38, 0.72, -0.35), look: FB, fov: 32 }],
  eleven: [{ pos: W0(0.32, 0.64, -0.42), look: FB, fov: 32 }, { pos: W0(0.3, 0.62, -0.48), look: FB, fov: 28 }],
  ten: [{ pos: W0(-0.5, 0.9, -0.75), look: W0(-0.95, 0.7, -1.55), fov: 34 }, { pos: W0(-0.6, 0.86, -0.9), look: W0(-0.95, 0.7, -1.55), fov: 30 }],
  sock: [{ pos: W0(0.32, 0.66, -0.38), look: FB, fov: 36 }, { pos: W0(0.3, 0.63, -0.46), look: FB, fov: 30 }],
};
const LIGHTS = {
  eve: { ...MOODS.night, hemi: 0.9, sky: '#c8b8b0', ground: '#3a2c28', gain: '#fff0dc', vig: 0.34 },
  night: { ...MOODS.night, hemi: 0.42, fog: '#05060c', fogNear: 4, fogFar: 18, vig: 0.62 },
  morning: { ...MOODS.morning, hemi: 0.8, sat: 0.8, vig: 0.45 },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.i < 3 ? 'eve' : S.i < 10 ? 'night' : 'morning'),
  tweak: (L, S, f) => { if (S.id === 'eleven' && f >= S.beat) L.vig = 0.75; },
  kicks: ['eleven'],
  focus: (S) => ({ rule: W0(0.4, 1.0, -0.2), blanket: W0(-0.3, 0.55, -1.45), nod: W0(1.0, 0.92, 0.3), hot: W0(0.05, 0.48, -1.0), count: UNDER, one: FEET,
    toes: W0(-0.95, 0.68, -1.55), nine: FB, eleven: FB, ten: W0(-0.95, 0.7, -1.55), sock: FB }[S.id]),
  shadowAt: () => W0(-0.3, 0.6, -1.0),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, camAt, dofAt } = K;
export { LIGHTS };

function foot(ctx, parent, at) {
  const { THREE, add, toon } = ctx; const skin = toon({ color: '#f2c49c' });
  const g = new THREE.Group(); g.position.set(...at); g.scale.setScalar(FS); parent.add(g);
  const sole = add(new THREE.SphereGeometry(0.045, 14, 10), skin, 0, 0, 0.02, g); sole.scale.set(1.0, 0.62, 1.55);
  const ank = add(new THREE.CylinderGeometry(0.034, 0.036, 0.26, 10), skin, 0, 0.05, -0.1, g); ank.rotation.x = 1.1;
  const toes = TOEX.map((x, k) => add(new THREE.SphereGeometry(k === 4 ? 0.014 : 0.0105, 10, 8), skin, x, 0.005, 0.075 - Math.abs(x) * 0.5, g));
  return { g, toes, skin };
}

// ---------- the set ----------
export const build = (ctx) => {
  const { THREE, add, box, toon } = ctx;
  SETS.houseLightsOff(ctx);
  const br = SETS.bedroom(ctx, { at: B });
  const G = new THREE.Group(); ctx.world.add(G);
  const fl = add(box(0.44, 0.24, 0.5), toon({ color: '#5a6a9a' }), 0, 0.12, 0, G); fl.position.set(...W0(-1.6, 0, 0.9));        // friend's floor mattress
  return { br, fl };
};
export const update = (W, f, P) => {
  if (!P.br) return;
  P.br.state(W, f);
  P.fl.visible = W.night;
};
// which toe the finger is on (0-10) and how far it has reached (0..1)
const touch = (f, S, k0, k1, a, b) => { const t = ramp(f, a, b), u = t * (k1 - k0 + 1); return { k: Math.min(k1, k0 + Math.floor(u)), lift: q(Math.max(0, Math.sin(Math.PI * (u % 1))), 1) }; };
export const worldAt = (f) => {
  const S = shotAt(f), i = S.i, id = S.id;
  const W = { door: 0, beep: -1, lamp: 1.0, moon: 0.2, street: 0.2, headlights: 0, car: false, footA: false, footB: false, out: 1, outB: 1, extra: 0, sock: 1, finger: null, night: i >= 3 && i < 10 };
  if (i >= 3) { W.lamp = 0; W.moon = 0.55; W.street = 0.4; }
  if (id === 'hot') { W.footA = true; W.out = smooth(ramp(f, S.a + 6, S.beat + 6)); }
  if (i >= 4 && i <= 9) { W.footA = W.footB = true; }
  if (id === 'count') W.outB = smooth(ramp(f, S.a + 4, S.beat));
  if (id === 'one') W.finger = touch(f, S, 0, 2, S.a + 6, S.b - 6);
  if (id === 'nine') W.finger = touch(f, S, 8, 9, S.a + 4, S.b - 4);
  if (id === 'eleven') { W.extra = smooth(ramp(f, S.beat - 2, S.beat + 6)); W.finger = { k: f >= S.beat - 20 ? 10 : 9, lift: 0 }; }
  if (id === 'ten') W.extra = 1;
  if (id === 'sock') { W.footB = true; W.night = false; W.lamp = 0; W.moon = 0; W.extra = 1; W.sock = smooth(ramp(f, S.a + 8, S.beat + 4)); }
  return W;
};

// ---------- the cast ----------
const KS = 0.62;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const you = (expr, o = {}, y = -0.33) => out.push(actor(T, YOU, { seed: 31, expr, blink: blinkAt(f, 31), ...o, who: 'you' }, [HEAD[0], HEAD[1] + y, HEAD[2]], { s: KS, order: 2 }));
  if (id === 'rule') { out.push(actor(T, 'mumNight', { seed: 9, expr: 'stern', blink: blinkAt(f, 9), look: 0.4, R: 'point' }, W0(-0.2, 0, -0.35), { s: 0.82 }));
    out.push(actor(T, FRIEND, { seed: 44, expr: 'neutral', blink: blinkAt(f, 44), look: -0.5 }, W0(0.9, 0, 0.2), { s: KS })); you('nervous', { look: -0.5 }, 0.0); }
  if (id === 'blanket') you('nervous', { look: 0.6 });
  if (id === 'nod') out.push(actor(T, FRIEND, { seed: 44, expr: 'smile_closed', look: 0.2, headTilt: Math.sin(f * 0.35) * 8 }, W0(1.0, 0, 0.3), { s: KS }));
  if (id === 'hot') you('pained', { look: 0.3 });
  if (id === 'toes') you('scared', { look: 0.8, blink: 0 });
  if (id === 'ten') you('shock', { look: 0.6, blink: 0 }, -0.25);
  return out;
};

// the feet, drawn as a cartoon card: foot A and foot B side by side, toes up; a long grey finger from under the bed
const toePos = (cx, n) => { const xs = [-44, -22, 0, 24, 50, 70].slice(0, n), r = [11, 12, 13, 15, 20, 11]; return xs.map((x, k) => ({ x: cx + x, y: 478 + Math.abs(x) * 0.25 - (k === 4 ? 4 : 0), r: r[k] })).map((t, k, a) => (n === 6 && k === 5 ? { x: cx - 64, y: 500, r: 10 } : t)); };
const feet = (W, nA, nB, sock, alphaA) => (p) => { const g = p.g; g.save(); g.lineWidth = 9; g.strokeStyle = '#1a1018'; g.lineJoin = 'round';
  const drawFoot = (cx, n, a) => { g.globalAlpha = a; g.fillStyle = '#f0c49a'; g.beginPath(); g.ellipse(cx, 590, 70, 112, 0, 0, 7); g.fill(); g.stroke();
    for (const t of toePos(cx, n)) { g.beginPath(); g.arc(t.x, t.y, t.r, 0, 7); g.fill(); g.stroke(); } g.globalAlpha = 1; };
  if (nA) drawFoot(190, nA, alphaA);
  if (nB) { drawFoot(410, nB, 1);
    if (sock < 1) { g.save(); g.translate(0, -sock * 260); g.globalAlpha = 1 - sock * 0.6; g.fillStyle = '#3a5ad0'; g.beginPath(); g.ellipse(410, 560, 84, 130, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#e8eef8'; g.fillRect(330, 660, 160, 26); g.restore(); } }
  if (W.finger) { const all = [...toePos(190, 5), ...toePos(410, 6)], t = W.finger.k < 5 ? all[W.finger.k] : W.finger.k < 10 ? all[W.finger.k] : all[10];
    const tx = t.x, ty = t.y - 14 - W.finger.lift * 22;
    g.strokeStyle = '#1a1018'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(300, 1010); g.bezierCurveTo(300, 860, tx + 90, ty + 60, tx + 8, ty + 6); g.stroke();
    g.strokeStyle = '#9aa2ac'; g.lineWidth = 20; g.stroke();
    g.fillStyle = '#d8dce2'; g.beginPath(); g.ellipse(tx + 4, ty + 2, 10, 7, -0.6, 0, 7); g.fill();
    g.strokeStyle = '#5a6068'; g.lineWidth = 3; for (const u of [0.35, 0.6]) { const x = 300 + (tx - 292) * u, y = 1010 + (ty - 1004) * u; g.beginPath(); g.moveTo(x - 8, y - 4); g.lineTo(x + 8, y + 4); g.stroke(); } }
  g.restore(); };
const eyes = (o) => (p) => { const g = p.g; g.save(); g.globalAlpha = o; g.shadowColor = '#e8f0ff'; g.shadowBlur = 30;
  for (const x of [235, 365]) { g.fillStyle = '#eef2f8'; g.beginPath(); g.ellipse(x, 500, 46, 30, 0, 0, 7); g.fill(); g.shadowBlur = 0; g.fillStyle = '#05050a'; g.beginPath(); g.arc(x + 6, 502, 13, 0, 7); g.fill(); g.shadowBlur = 30; }
  g.restore(); };
const small = (txt, t) => (p) => { const g = p.g; g.save(); g.font = '900 120px Arial Black, Arial'; g.textAlign = 'center'; g.globalAlpha = Math.max(0, 1 - t); g.lineWidth = 16; g.strokeStyle = '#1a0a10';
  g.strokeText(txt, 300, 500); g.fillStyle = '#e8eef8'; g.fillText(txt, 300, 500); g.restore(); };
export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [];
  if (S.i >= 4 && S.i <= 9) { const o = id === 'count' ? q(smooth(ramp(f, S.beat - 4, S.beat + 10)), 1) : 1; if (o > 0) out.push(fx('eyes' + o, eyes(o), [UNDER[0] - 0.02, UNDER[1] - 0.17, -1.0], 0.32, { order: 3 })); }
  const W = worldAt(f), nB = W.extra > 0.5 ? 6 : 5;
  if (W.footA || W.footB) out.push(fx('feet' + JSON.stringify([W.finger, nB, q(W.sock, 1), q(W.out, 1), W.footA]), feet(W, W.footA ? 5 : 0, W.footB && W.outB > 0.5 ? nB : 0, W.footA ? 1 : W.sock, W.out), W0(0.12, 0.24, -0.84), 0.22, { order: 6 }));
  const say = (txts, a, b) => { const n = txts.length, t = ramp(f, a, b), k = Math.min(n - 1, Math.floor(t * n)), u = q((t * n) % 1, 1); out.push(fx('w' + txts[k] + u, small(txts[k], u), W0(0.42, 0.32, -0.8), 0.16)); };
  if (id === 'one') say(['ONE', 'TWO', 'THREE'], S.a + 6, S.b - 6);
  if (id === 'nine') say(['NINE', 'TEN'], S.a + 4, S.b - 4);
  if (id === 'eleven' && f >= S.beat) { const t = q(Math.min(1, (f - S.beat) / 40), 1); out.push(fx('el' + t, word('ELEVEN', t * 0.8, '#e8eef8'), W0(0.2, 0.58, -0.8), 0.07)); }
  return out;
};
