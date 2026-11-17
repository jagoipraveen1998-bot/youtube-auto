// "I Had To Fight For My Life Against My Own Shadow": the bedroom set (sets.js) lit by one candle. Your shadow
// stays on the wall when you turn, smiles, peels off and drags you toward the dark hallway; you drive it back
// with the candle. The lights come on, Mum walks in and screams: you don't have a shadow anymore.
// Style (reference breakdown, Nov 2026): the camera glides into the next shot instead of cutting, except on the
// two scares; warm candlelight while the story is set up, deep night blue from "You see" on.
import * as SETS from './sets.js';
import { OUTFITS } from './toon.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const B = [-40, 0, 0], W0 = (x, y, z) => [B[0] + x, B[1] + y, B[2] + z];
const YOU = { ...OUTFITS.kid, tunic: '#4a7ac0' }, SHADE = { ...YOU };
const CANDLE = W0(0.25, 0.8, 0.15), KID = W0(0.95, 0, -0.05), WALL = W0(2.22, 0, -0.75), GRAB = W0(1.45, 0, -0.2), DOOR = W0(2.05, 0, 0.6);

const IDS = ['fight', 'rule', 'candle', 'turn', 'didnt', 'smiled', 'grab', 'drag', 'shove', 'shrank', 'alive', 'yousee', 'scream'];
const CAMS = {
  fight: [{ pos: W0(-0.6, 1.45, 1.6), look: W0(1.5, 1.0, -0.4), fov: 52 }, { pos: W0(-0.3, 1.4, 1.35), look: W0(1.6, 1.0, -0.4), fov: 46 }],
  rule: [{ pos: W0(-0.2, 1.3, 1.3), look: W0(0.9, 0.95, -0.05), fov: 44 }, { pos: W0(0.0, 1.25, 1.15), look: W0(0.9, 0.95, -0.05), fov: 40 }],
  candle: [{ pos: W0(-0.45, 1.05, 0.75), look: CANDLE, fov: 40 }, { pos: W0(-0.3, 1.0, 0.6), look: CANDLE, fov: 34 }],
  turn: [{ pos: W0(-0.2, 1.25, 1.2), look: W0(1.1, 0.95, -0.2), fov: 46 }, { pos: W0(0.0, 1.22, 1.05), look: W0(1.2, 0.95, -0.25), fov: 42 }],
  didnt: [{ pos: W0(0.6, 1.3, 1.1), look: W0(2.2, 1.0, -0.7), fov: 44 }, { pos: W0(0.9, 1.28, 0.8), look: W0(2.2, 1.0, -0.72), fov: 38 }],
  smiled: [{ pos: W0(1.2, 1.15, 0.5), look: W0(2.2, 0.98, -0.72), fov: 36 }, { pos: W0(1.4, 1.1, 0.3), look: W0(2.2, 0.98, -0.72), fov: 30 }],
  grab: [{ pos: W0(0.1, 0.9, 1.3), look: W0(1.25, 0.7, -0.15), fov: 50 }, { pos: W0(0.25, 0.85, 1.15), look: W0(1.3, 0.7, -0.1), fov: 46 }],
  drag: [{ pos: W0(0.4, 1.0, 1.7), look: W0(1.7, 0.55, 0.3), fov: 50 }, { pos: W0(0.6, 0.95, 1.55), look: W0(1.85, 0.55, 0.4), fov: 46 }],
  shove: [{ pos: W0(1.0, 0.95, 1.55), look: W0(1.85, 0.75, 0.45), fov: 42 }, { pos: W0(1.15, 0.92, 1.35), look: W0(1.9, 0.8, 0.5), fov: 36 }],
  shrank: [{ pos: W0(1.2, 1.3, 0.3), look: W0(2.2, 0.5, -0.95), fov: 48 }, { pos: W0(1.3, 1.2, 0.1), look: W0(2.25, 0.4, -1.0), fov: 42 }],
  alive: [{ pos: W0(0.6, 1.6, 1.8), look: W0(1.6, 0.4, 0.4), fov: 48 }, { pos: W0(0.8, 1.45, 1.55), look: W0(1.65, 0.45, 0.45), fov: 44 }],
  yousee: [{ pos: W0(0.9, 1.15, 1.55), look: W0(1.6, 0.55, 0.35), fov: 46 }, { pos: W0(1.0, 1.0, 1.35), look: W0(1.6, 0.5, 0.35), fov: 42 }],
  scream: [{ pos: W0(0.85, 1.15, 2.0), look: W0(1.75, 0.95, 0.5), fov: 52 }, { pos: W0(0.95, 1.12, 1.8), look: W0(1.75, 0.95, 0.5), fov: 48 }],
};
const LIGHTS = {
  candle: { ...MOODS.night, hemi: 0.3, sky: '#3a3048', ground: '#1a1210', fog: '#0a0608', fogNear: 4, fogFar: 16, gain: '#ffe2c0', lift: '#0c0812', vig: 0.55, sat: 1.15 },
  lamp: { ...MOODS.night, hemi: 0.8, sky: '#a8b8e0', ground: '#2a3040', fog: '#101830', fogNear: 6, fogFar: 22, gain: '#e8f0ff', lift: '#0a1020', vig: 0.42, sat: 1.1 },
  blue: { ...MOODS.night, hemi: 0.55, sky: '#4a68c8', ground: '#141c40', fog: '#0a1238', fogNear: 4, fogFar: 18, gain: '#c8d8ff', lift: '#0a1030', vig: 0.66, sat: 1.15 },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.i < 10 ? 'candle' : S.i === 10 ? 'lamp' : 'blue'),
  tweak: (L, S, f) => { if (S.id === 'shove' && f >= S.beat && f < S.beat + 6) { L.gain = '#ffffff'; L.vig = 0.2; } if (S.id === 'scream') L.vig = 0.74; },
  kicks: ['grab', 'scream'],
  focus: (S) => ({ fight: W0(1.4, 1.0, -0.4), rule: KID, candle: CANDLE, turn: KID, didnt: W0(2.2, 1.0, -0.7), smiled: W0(2.2, 0.98, -0.72), grab: W0(1.3, 0.7, -0.1),
    drag: W0(1.8, 0.55, 0.35), shove: W0(1.9, 0.8, 0.5), shrank: W0(2.2, 0.6, -0.9), alive: W0(1.65, 0.45, 0.45), yousee: W0(1.65, 0.3, 0.5), scream: W0(1.6, 0.95, 0.45) }[S.id]),
  shadowAt: () => W0(1.0, 0.8, 0),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, dofAt } = K;
export { LIGHTS };
// the camera glides from where the last shot ended into the new one over ~0.8 s, eased in and out;
// only the two scares are hard cuts
const CUTS = new Set(['grab', 'scream']), GLIDE = 24;
const mix = (a, b, t) => ({ ...b, pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t) });
export const camAt = (f) => { const S = shotAt(f), c = K.camAt(f); if (S.i === 0 || CUTS.has(S.id) || f - S.a >= GLIDE) return c; return mix(K.camAt(S.a - 1), c, smooth((f - S.a) / GLIDE)); };

// ---------- the set ----------
export const build = (ctx) => {
  const { THREE, add, box, toon } = ctx;
  SETS.houseLightsOff(ctx);
  const br = SETS.bedroom(ctx, { at: B });
  const G = new THREE.Group(); ctx.world.add(G);
  const t = add(box(0.55, 0.05, 0.45), toon({ color: '#7a4a2a' }), 0, 0, 0, G); t.position.set(...W0(0.25, 0.72, 0.15));
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = add(box(0.04, 0.72, 0.04), toon({ color: '#5a3420' }), 0, 0, 0, G); l.position.set(...W0(0.25 + dx * 0.23, 0.36, 0.15 + dz * 0.18)); }
  const candle = new THREE.Group(); G.add(candle);
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 12), toon({ color: '#f2ead8' }), 0, 0.07, 0, candle);
  add(new THREE.CylinderGeometry(0.06, 0.07, 0.015, 14), toon({ color: '#b8a070' }), 0, 0.005, 0, candle);
  const flame = add(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd27a' }), 0, 0.17, 0, candle, { cast: false }); flame.scale.y = 1.8;
  const glow = new THREE.PointLight('#ffb060', 0, 7, 1.3); glow.position.set(0, 0.22, 0); glow.castShadow = true; candle.add(glow);
  return { br, candle, flame, glow };
};
export const update = (W, f, P) => {
  if (!P.br) return;
  P.br.state(W, f);
  P.candle.position.set(...W.cp); P.candle.visible = W.candleOn;
  const flick = 1 + 0.12 * Math.sin(f * 0.9) + 0.08 * Math.sin(f * 2.3 + 1);
  P.glow.intensity = W.candleOn ? W.burn * flick : 0; P.flame.scale.set(1 + W.flare, 1.8 + W.flare * 2, 1 + W.flare);
};
export const worldAt = (f) => {
  const S = shotAt(f), i = S.i, id = S.id;
  const W = { door: 0, beep: -1, lamp: 0, moon: 0.12, street: 0, headlights: 0, car: false, cp: [CANDLE[0], CANDLE[1] - 0.05, CANDLE[2]], candleOn: true, burn: 2.6, flare: 0 };
  if (i >= 7 && i <= 9) W.door = 1;
  if (id === 'shove') { const t = smooth(ramp(f, S.a + 4, S.beat)); W.cp = lerp3([CANDLE[0], CANDLE[1] - 0.05, CANDLE[2]], W0(1.85, 0.62, 0.48), t); W.flare = f >= S.beat && f < S.beat + 10 ? 2.5 : 0; W.burn = f >= S.beat && f < S.beat + 10 ? 9 : 2.6; }
  if (id === 'shrank') { W.cp = W0(1.75, 0.0, 0.55); W.burn = 2.2; }
  if (i >= 10) { W.candleOn = false; W.lamp = 1.4; W.moon = 0.4; W.door = i === 12 ? 1 : 0; }
  return W;
};

// ---------- the cast ----------
const KS = 0.62;
const shade = (T, f, pos, o = {}, x = {}) => actor(T, SHADE, { seed: 13, expr: 'neutral', blink: 0, look: -0.4, ...o, who: 'shadow' }, pos, { s: KS, tint: '#07070c', blob: false, shadow: false, order: 2, ...x });
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, i = S.i, out = [];
  const you = (expr, o = {}, pos = KID, x = {}) => out.push(actor(T, YOU, { seed: 31, expr, blink: blinkAt(f, 31), ...o, who: 'you' }, pos, { s: KS, ...x }));
  if (i <= 3) you(id === 'fight' ? 'wary' : id === 'turn' ? 'nervous' : 'neutral', { look: id === 'turn' ? -0.8 : -0.3 });
  if (i >= 1 && i <= 5) out.push(shade(T, f, WALL, { look: id === 'turn' ? 0.0 : -0.4 }));
  if (id === 'didnt' || id === 'smiled') you('scared', { look: 0.7, blink: 0 }, W0(0.8, 0, 0.05));
  if (id === 'grab') { const t = smooth(ramp(f, S.a, S.beat)); out.push(shade(T, f, lerp3(WALL, GRAB, t), { R: 'reach' })); you('shock', { look: 0.6, blink: 0, R: 'reach' }, KID); }
  if (id === 'drag') { const t = smooth(ramp(f, S.a, S.b)); const k = lerp3(KID, W0(1.6, -0.18, 0.35), t); you('scared', { look: -0.6, blink: 0, R: 'reach', headTilt: -10 }, k); out.push(shade(T, f, lerp3(GRAB, W0(2.05, 0, 0.55), t), { R: 'reach' })); }
  if (id === 'shove') { you('stubborn', { look: 0.7, R: 'reach' }, W0(1.6, -0.18, 0.35)); if (f < S.beat + 8) out.push(shade(T, f, W0(2.05, 0, 0.55), { R: 'reach' })); }
  if (id === 'shrank') { const t = smooth(ramp(f, S.a, S.b - 10)); out.push(shade(T, f, lerp3(W0(2.05, 0, 0.55), W0(2.25, 0, -1.0), t), {}, { s: lerp(KS, 0.18, t) })); you('scared', { look: 0.5 }, W0(1.6, -0.18, 0.35)); }
  if (id === 'alive' || id === 'yousee') you(id === 'alive' ? 'relief' : 'dazed', { look: 0.2 }, W0(1.6, -0.18, 0.35), { shadow: false, blob: false });
  if (id === 'scream') {
    if (f < S.beat) you('dazed', { look: 0.6 }, W0(1.45, 0, 0.45), { shadow: false, blob: false, order: 3 }); else out.push(shade(T, f, W0(1.45, 0, 0.45), { look: 0 }, { order: 3 }));   // it was never you
    out.push(actor(T, 'mumNight', { seed: 9, expr: f < S.beat - 6 ? 'neutral' : 'shock', blink: 0, look: -0.6 }, W0(2.15, 0, 0.6), { s: 0.82 }));
  }
  return out;
};
// the shadow's face: two pale slits and a wide white grin, drawn over its black head
const grin = (o) => (p) => { const g = p.g; g.save(); g.globalAlpha = o; g.fillStyle = '#f2f2f2'; g.shadowColor = '#ffffff'; g.shadowBlur = 14;
  for (const x of [262, 338]) { g.beginPath(); g.ellipse(x, 455, 17, 7, x < 300 ? 0.25 : -0.25, 0, 7); g.fill(); }
  g.beginPath(); g.moveTo(232, 520); g.quadraticCurveTo(300, 600, 368, 520); g.quadraticCurveTo(300, 560, 232, 520); g.fill(); g.restore(); };
export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [];
  const face = (pos, o, s = 0.3) => out.push(fx('g' + q(o, 1) + s, grin(o), [pos[0] - 0.01, pos[1] + 0.68 * (s / 0.3), pos[2] + 0.03], s, { order: 4 }));
  if (id === 'smiled') face(WALL, q(smooth(ramp(f, S.beat - 6, S.beat + 8)), 1));
  if (id === 'grab') face(lerp3(WALL, GRAB, smooth(ramp(f, S.a, S.beat))), 1);
  if (id === 'drag') face(lerp3(GRAB, W0(2.05, 0, 0.55), smooth(ramp(f, S.a, S.b))), 1);
  if (id === 'shove' && f < S.beat + 8) face(W0(2.05, 0, 0.55), 1);
  if (id === 'scream' && f >= S.beat) face(W0(1.45, 0, 0.45), q(smooth(ramp(f, S.beat, S.beat + 12)), 1));
  return out;
};
