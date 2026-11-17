// "My School Has One Rule: Never Look Into Room 9 After The Bell": a school corridor and Room 9 (built here).
// The door's window is painted black; through a scratch you see a silent class where every kid has your face,
// writing your name. They all look up at once, and behind you, the teacher: "You're late."
import * as SETS from './sets.js';
import { OUTFITS } from './toon.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const SO = [0, 0, -130], SC = (x, y, z) => [SO[0] + x, SO[1] + y, SO[2] + z];
const YOU = { ...OUTFITS.kid, tunic: '#4a7ac0' };
const WIN = SC(0, 1.53, 0.03), KIDDOOR = SC(0.1, 0, 0.5), TEACH = SC(-0.35, 0, 0.88);
const DESKS = []; for (const z of [-1.6, -2.8, -4.0]) for (const x of [-1.2, 0, 1.2]) DESKS.push([x, z]);

const IDS = ['rule', 'never', 'locked', 'bag', 'scratch', 'looked', 'class', 'face', 'writing', 'turned', 'late'];
const CAMS = {
  rule: [{ pos: SC(2.8, 1.45, 1.9), look: SC(0, 1.2, 0.1), fov: 50 }, { pos: SC(2.3, 1.42, 1.7), look: SC(0, 1.25, 0.1), fov: 44 }],
  never: [{ pos: SC(0.9, 1.55, 1.3), look: SC(0.05, 1.55, 0.03), fov: 40 }, { pos: SC(0.7, 1.55, 1.05), look: SC(0.05, 1.55, 0.03), fov: 36 }],
  locked: [{ pos: SC(0.45, 1.45, 0.75), look: SC(0.1, 1.4, 0.03), fov: 38 }, { pos: SC(0.35, 1.48, 0.6), look: WIN, fov: 32 }],
  bag: [{ pos: SC(-2.8, 1.35, 1.7), look: SC(0, 1.1, 0.7), fov: 48 }, { pos: SC(-2.4, 1.3, 1.6), look: SC(0, 1.1, 0.7), fov: 44 }],
  scratch: [{ pos: SC(0.15, 1.55, 0.7), look: WIN, fov: 32 }, { pos: SC(0.08, 1.54, 0.5), look: WIN, fov: 28 }],
  looked: [{ pos: SC(1.2, 1.25, 1.35), look: SC(0.05, 1.2, 0.3), fov: 42 }, { pos: SC(1.0, 1.22, 1.15), look: SC(0.05, 1.25, 0.3), fov: 38 }],
  class: [{ pos: SC(0.12, 1.55, -0.1), look: SC(0, 0.85, -3.0), fov: 54 }, { pos: SC(0.12, 1.5, -0.4), look: SC(0, 0.85, -3.0), fov: 50 }],
  face: [{ pos: SC(0.1, 1.2, -0.7), look: SC(-0.4, 0.82, -2.0), fov: 44 }, { pos: SC(-0.05, 1.15, -0.95), look: SC(-0.6, 0.82, -2.0), fov: 40 }],
  writing: [{ pos: SC(0.25, 1.35, -1.2), look: SC(0.0, 0.66, -1.6), fov: 40 }, { pos: SC(0.18, 1.2, -1.32), look: SC(0.0, 0.66, -1.6), fov: 36 }],
  turned: [{ pos: SC(0.12, 1.4, -0.35), look: SC(0, 0.9, -2.8), fov: 52 }, { pos: SC(0.12, 1.35, -0.55), look: SC(0, 0.9, -2.8), fov: 48 }],
  late: [{ pos: SC(0.95, 1.4, 2.15), look: SC(-0.1, 1.35, 0.6), fov: 52 }, { pos: SC(0.85, 1.42, 1.95), look: SC(-0.12, 1.45, 0.7), fov: 50 }],
};
const LIGHTS = {
  day: { ...MOODS.evening, hemi: 0.85, sat: 0.85, vig: 0.36 },
  dim: { ...MOODS.dread, hemi: 0.45, sky: '#6a6a7a', ground: '#2a2a30', fog: '#14141a', fogNear: 6, fogFar: 26, vig: 0.6 },
  room: { ...MOODS.dread, hemi: 0.55, sky: '#8aa0a0', ground: '#1a2420', fog: '#0a1210', fogNear: 3, fogFar: 14, vig: 0.72, sat: 0.7 },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.i < 3 ? 'day' : S.i >= 6 && S.i <= 9 ? 'room' : 'dim'),
  tweak: (L, S) => { if (S.id === 'late') L.vig = 0.75; },
  kicks: ['turned', 'late'],
  focus: (S) => ({ rule: SC(0.4, 1.2, 0.4), never: WIN, locked: WIN, bag: SC(-0.6, 1.0, 0.8), scratch: WIN, looked: SC(0.1, 1.2, 0.4), class: SC(0, 0.85, -2.2),
    face: SC(-0.6, 0.82, -2.0), writing: SC(0, 0.66, -1.6), turned: SC(0, 0.9, -2.2), late: SC(-0.4, 1.4, 0.8) }[S.id]),
  shadowAt: (S) => (S.i >= 6 && S.i <= 9 ? SC(0, 1, -2.5) : SC(0, 1, 0.8)),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, camAt, dofAt } = K;
export { LIGHTS };

const paint = (g, w, h) => { g.fillStyle = '#060608'; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.moveTo(w * 0.42, h * 0.46); g.lineTo(w * 0.6, h * 0.42); g.lineTo(w * 0.63, h * 0.5); g.lineTo(w * 0.46, h * 0.55); g.closePath(); g.fill();
  g.lineWidth = 3; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(w * (0.3 + k * 0.07), h * 0.38); g.lineTo(w * (0.36 + k * 0.06), h * 0.62); g.stroke(); } g.globalCompositeOperation = 'source-over'; };
const sign = (g, w, h) => { g.fillStyle = '#2a3a5a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2f2ea'; g.font = '900 ' + Math.floor(h * 0.7) + 'px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ROOM 9', w / 2, h / 2 + 4); };
const scrawl = (t) => (g, w, h) => { g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a2a3a'; g.lineWidth = 5; g.lineCap = 'round';
  const rows = 7, n = Math.floor(t * rows * 6); for (let k = 0; k < n; k++) { const r = Math.floor(k / 6), c = k % 6, x = 30 + c * 76, y = 50 + r * 58; g.beginPath(); g.moveTo(x, y);
    for (let u = 0; u <= 10; u++) g.lineTo(x + u * 6, y + Math.sin(u * 1.7 + k) * 10 - (u === 3 ? 18 : 0)); g.stroke(); } };
const board = (g, w, h) => { g.fillStyle = '#1e3a2a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(240,240,230,0.85)'; g.lineWidth = 4; g.lineCap = 'round';
  for (let r = 0; r < 9; r++) for (let c = 0; c < 6; c++) { const x = 20 + c * 82, y = 30 + r * 26; g.beginPath(); g.moveTo(x, y); for (let u = 0; u <= 10; u++) g.lineTo(x + u * 6, y + Math.sin(u * 1.9 + r + c) * 6 - (u === 3 ? 12 : 0)); g.stroke(); } };

// ---------- the set ----------
export const build = (ctx) => {
  const { THREE, add, box, toon } = ctx;
  SETS.houseLightsOff(ctx);
  const G = new THREE.Group(); G.position.set(...SO); ctx.world.add(G);
  const wall = toon({ color: '#c8ccb8' }), floor = toon({ color: '#8a8a7a' });
  add(box(12, 0.1, 9), floor, 0, -0.05, -2.5, G, { cast: false }); add(box(12, 0.1, 9), toon({ color: '#d8d8d0' }), 0, 3.0, -2.5, G, { cast: false });
  // the classroom wall at z = 0 with Room 9's door (x -0.45..0.45)
  add(box(5.55, 3, 0.12), wall, -3.23, 1.5, 0, G); add(box(5.55, 3, 0.12), wall, 3.23, 1.5, 0, G); add(box(0.9, 0.9, 0.12), wall, 0, 2.55, 0, G);
  const doorM = toon({ color: '#6a4a32' });
  add(box(0.9, 1.35, 0.05), doorM, 0, 0.675, 0.02, G); add(box(0.9, 0.39, 0.05), doorM, 0, 1.905, 0.02, G);
  add(box(0.3, 0.36, 0.05), doorM, -0.3, 1.53, 0.02, G); add(box(0.3, 0.36, 0.05), doorM, 0.3, 1.53, 0.02, G);
  const pane = SETS.canvasPlane(ctx, 0.3, 0.36, 256, G, { alpha: true, lit: true }); pane.draw('p', paint); pane.mesh.position.set(0, 1.53, 0.05);
  const pane2 = SETS.canvasPlane(ctx, 0.3, 0.36, 256, G, { alpha: true, lit: true }); pane2.draw('p', paint); pane2.mesh.position.set(0, 1.53, -0.005); pane2.mesh.rotation.y = Math.PI;
  add(box(0.05, 0.05, 0.08), toon({ color: '#c8c8c0' }), 0.34, 1.0, 0.07, G); add(box(0.08, 0.1, 0.04), toon({ color: '#8a8a80' }), 0.34, 0.9, 0.07, G);
  const sg = SETS.canvasPlane(ctx, 0.42, 0.14, 256, G, { lit: true }); sg.draw('s', sign); sg.mesh.position.set(0, 2.25, 0.07);
  // the corridor: lockers opposite, a bell on the wall
  add(box(12, 3, 0.12), wall, 0, 1.5, 2.3, G);
  for (let k = -9; k <= 9; k++) { add(box(0.38, 1.8, 0.3), toon({ color: k % 2 ? '#4a6a9a' : '#4a649a' }), k * 0.4, 0.9, 2.1, G); add(box(0.04, 0.12, 0.02), toon({ color: '#c8c8c0' }), k * 0.4 + 0.12, 1.0, 1.94, G); }
  add(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 14), toon({ color: '#c83a2a' }), -1.2, 2.4, 0.1, G).rotation.x = Math.PI / 2;
  const hall = [-3, 0, 3].map((x) => { const l = new THREE.PointLight('#f0f4ff', 0, 7, 1.4); l.position.set(x, 2.8, 1.15); G.add(l); return l; });
  const bag = add(box(0.3, 0.35, 0.15), toon({ color: '#d84a3a' }), -0.9, 0.17, 0.25, G);
  // inside Room 9: desks in rows, a board covered in scribbles, one cold light
  for (const [x, z] of DESKS) { add(box(0.7, 0.05, 0.45), toon({ color: '#b08a5a' }), x, 0.66, z, G); add(box(0.68, 0.6, 0.04), toon({ color: '#8a6a4a' }), x, 0.34, z + 0.21, G); }
  const paper = SETS.canvasPlane(ctx, 0.3, 0.4, 512, G, { lit: true }); paper.mesh.position.set(0, 0.69, -1.62); paper.mesh.rotation.x = -Math.PI / 2;
  add(box(6, 3, 0.12), wall, 0, 1.5, -5.2, G); add(box(0.12, 3, 5.2), wall, -3, 1.5, -2.6, G); add(box(0.12, 3, 5.2), wall, 3, 1.5, -2.6, G);
  const bd = SETS.canvasPlane(ctx, 3.0, 1.3, 512, G, { lit: true }); bd.draw('b', board); bd.mesh.position.set(0, 1.6, -5.13);
  const cold = new THREE.PointLight('#c8f0e0', 0, 9, 1.3); cold.position.set(0, 2.6, -2.6); G.add(cold);
  return { hall, cold, paper, bag };
};
export const update = (W, f, P) => {
  if (!P.hall) return;
  P.hall.forEach((l) => (l.intensity = W.hall)); P.cold.intensity = W.cold;
  P.paper.draw('w' + W.write, scrawl(W.write)); P.bag.visible = W.bag;
};
export const worldAt = (f) => {
  const S = shotAt(f), i = S.i, id = S.id;
  const W = { hall: 1.4, cold: 1.2, write: 0.4, bag: false };
  if (i >= 3) W.hall = 0.45;
  if (id === 'late') W.hall = f > S.beat && f % 11 < 3 ? 0.1 : 0.45;
  if (id === 'bag') W.bag = true;
  if (id === 'writing') W.write = q(lerp(0.3, 1, ramp(f, S.a, S.b)), 2);
  if (i > 8) W.write = 1;
  return W;
};

// ---------- the cast ----------
const KS = 0.62;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const you = (expr, o = {}, pos = KIDDOOR, extra = {}) => out.push(actor(T, YOU, { seed: 31, expr, blink: blinkAt(f, 31), ...o, who: 'you' }, pos, { s: KS, ...extra }));
  if (id === 'rule') you('nervous', { look: -0.6 }, SC(1.0, 0, 0.9));
  if (id === 'bag') you('wary', { look: 0.7, R: 'reach' }, SC(-0.55, 0, 0.75));
  if (id === 'looked') you('wary', { look: -0.8, blink: 0 }, SC(0.12, 0, 0.42));
  if (S.i >= 6 && S.i <= 9) {
    const up = id === 'turned' && f >= S.beat;
    DESKS.forEach(([x, z], k) => out.push(actor(T, YOU, { seed: 100 + k, expr: up ? 'creepy' : 'sleep', blink: up ? 0 : 1, look: up ? -x * 0.25 : 0, headTilt: up ? 0 : 9 + (k % 3) * 2, who: 'class' + k },
      SC(x, -0.12, z - 0.3), { s: KS, order: 2 })));
  }
  if (id === 'late') {
    you(f < S.beat ? 'wary' : 'shock', { look: f < S.beat ? -0.8 : 0.6, blink: 0 }, SC(0.22, 0, 0.5));
    out.push(actor(T, 'marlow', { seed: 66, expr: 'neutral', blink: 1, look: 0.6, headTilt: -10, who: 'teacher' }, TEACH, { s: 1.05, tint: '#121218', blob: false, order: 3 }));
  }
  return out;
};
const paleEyes = (g) => { g.save(); g.shadowColor = '#e8f4ff'; g.shadowBlur = 26; for (const x of [262, 338]) { g.fillStyle = '#eef4fa'; g.beginPath(); g.ellipse(x, 470, 20, 12, 0, 0, 7); g.fill(); } g.restore(); };
const peep = (p) => { const g = p.g; g.save(); g.fillStyle = '#000'; g.fillRect(0, 0, 600, 1000); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.ellipse(300, 500, 250, 380, 0.15, 0, 7); g.fill(); g.restore(); };
export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [];
  if (id === 'bag') { const d = (f - S.a) % 24; if (d < 16) { const t = q(d / 16); out.push(fx('bell' + t, word('RIIING', t, '#ffd23f'), SC(-1.2, 2.0, 0.25), 0.3)); } }
  if (id === 'late') {
    const h = [TEACH[0], 0, TEACH[2] + 0.03]; out.push(fx('te', (p) => paleEyes(p.g), [h[0] + 0.04, 1.07, h[2] + 0.04], 0.5, { order: 4 }));
    const d = f - S.beat + 4; if (d >= 0) { const t = q(Math.min(0.55, d / 40), 2); out.push(fx('yl' + t, word("YOU'RE LATE", t, '#e8eef8'), SC(-0.1, 1.95, 1.0), 0.2)); }
  }
  return out;
};
