// "Red Balloons Keep Appearing On My Window": the kid's bedroom set (sets.js). Red balloons tied outside the
// window multiply day by day, grow smiley faces that turn like heads, one pops and there's an eye behind it.
// Mum opens the curtain: clean glass. Then you see the red string tied around her wrist.
import * as SETS from './sets.js';
import { OUTFITS } from './toon.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const B = [-40, 0, 0], W0 = (x, y, z) => [B[0] + x, B[1] + y, B[2] + z];
const YOU = { ...OUTFITS.kid, tunic: '#4a7ac0' };
const WIN = W0(-2.4, 1.5, -0.2), KID = W0(-1.45, 0, 1.05), MUMW = W0(-1.35, 0, 0.45), MUMK = W0(-0.25, 0, 0.3), KIDK = W0(0.3, 0, 0.5);
// balloon spots outside the glass: first the centre one, then the rest fill the window
const SPOTS = [[1.5, -0.45]];
for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const y = 1.0 + r * 0.34 + (c % 2) * 0.06, z = -0.78 + c * 0.29 + (r % 2) * 0.05; if (Math.abs(y - 1.5) + Math.abs(z + 0.45) > 0.14) SPOTS.push([y, z]); }
const POPI = 0;                                                                                  // which balloon pops

const IDS = ['one', 'card', 'more', 'red', 'squeak', 'faces', 'turn', 'pop', 'mum', 'kiss', 'string'];
const CAMS = {
  one: [{ pos: W0(1.3, 1.45, 1.4), look: W0(-2.0, 1.25, -0.2), fov: 50 }, { pos: W0(0.6, 1.45, 1.0), look: W0(-2.2, 1.4, -0.2), fov: 44 }],
  card: [{ pos: W0(-1.5, 1.4, 0.25), look: W0(-2.55, 1.2, -0.45), fov: 38 }, { pos: W0(-1.8, 1.32, -0.2), look: W0(-2.55, 1.2, -0.45), fov: 34 }],
  more: [{ pos: W0(0.9, 1.45, 1.1), look: WIN, fov: 46 }, { pos: W0(0.4, 1.45, 0.8), look: WIN, fov: 42 }],
  red: [{ pos: W0(1.6, 1.6, 1.7), look: W0(-1.6, 1.2, -0.3), fov: 56 }, { pos: W0(1.2, 1.5, 1.5), look: W0(-1.8, 1.25, -0.2), fov: 50 }],
  squeak: [{ pos: W0(-0.4, 1.35, 0.9), look: W0(-2.2, 1.4, -0.2), fov: 44 }, { pos: W0(-0.9, 1.4, 0.6), look: W0(-2.2, 1.45, -0.2), fov: 38 }],
  faces: [{ pos: W0(-0.5, 1.45, 0.75), look: WIN, fov: 50 }, { pos: W0(-0.9, 1.45, 0.45), look: WIN, fov: 44 }],
  turn: [{ pos: W0(-1.1, 1.5, 0.3), look: W0(-2.6, 1.5, -0.2), fov: 48 }, { pos: W0(-1.4, 1.5, 0.12), look: W0(-2.6, 1.5, -0.2), fov: 40 }],
  pop: [{ pos: W0(-1.5, 1.52, 0.0), look: W0(-2.7, 1.5, -0.45), fov: 42 }, { pos: W0(-1.75, 1.5, -0.3), look: W0(-2.7, 1.5, -0.45), fov: 36 }],
  mum: [{ pos: W0(1.4, 1.35, 1.7), look: W0(-1.2, 1.1, -0.05), fov: 54 }, { pos: W0(1.1, 1.35, 1.5), look: W0(-1.3, 1.15, -0.05), fov: 48 }],
  kiss: [{ pos: W0(0.1, 1.2, 2.0), look: W0(0.0, 1.0, 0.35), fov: 44 }, { pos: W0(0.1, 1.15, 1.75), look: W0(0.0, 1.0, 0.35), fov: 40 }],
  string: [{ pos: W0(0.25, 1.0, 1.9), look: W0(-0.15, 0.85, 0.3), fov: 46 }, { pos: W0(0.2, 0.95, 1.7), look: W0(-0.1, 0.85, 0.3), fov: 46 }],
};
const LIGHTS = {
  morning: { ...MOODS.morning, hemi: 1.0, vig: 0.28 },
  red: { ...MOODS.night, hemi: 0.55, sky: '#c06070', ground: '#2a1018', fog: '#2a0a10', fogNear: 8, fogFar: 30, gain: '#ffe0e0', lift: '#0a0204', vig: 0.55, sat: 1.15 },
  lamp: { ...MOODS.night, hemi: 0.8, sky: '#a8a0c0', ground: '#2c2630', fog: '#1a1820', fogNear: 9, fogFar: 32, gain: '#fff2e6', vig: 0.4 },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.i < 3 ? 'morning' : S.i < 8 ? 'red' : 'lamp'),
  tweak: (L, S) => { if (S.id === 'string') L.vig = 0.7; if (S.id === 'pop') L.vig = 0.68; },
  kicks: ['pop', 'string'],
  focus: (S) => ({ one: WIN, card: W0(-2.55, 1.2, -0.45), more: WIN, red: W0(-1.8, 1.25, -0.2), squeak: W0(-2.2, 1.45, -0.2), faces: WIN, turn: W0(-2.6, 1.5, -0.2),
    pop: W0(-2.7, 1.5, -0.2), mum: MUMW, kiss: W0(0, 1.0, 0.35), string: W0(-0.2, 0.8, 0.3) }[S.id]),
  shadowAt: () => W0(-0.5, 0.8, 0),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, camAt, dofAt } = K;
export { LIGHTS };

const smiley = (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#1a0a0e'; g.lineWidth = w * 0.06; g.strokeStyle = '#1a0a0e'; g.lineCap = 'round';
  for (const x of [0.36, 0.64]) { g.beginPath(); g.ellipse(w * x, h * 0.38, w * 0.06, h * 0.09, 0, 0, 7); g.fill(); }
  g.beginPath(); g.arc(w / 2, h * 0.45, w * 0.26, 0.25, Math.PI - 0.25); g.stroke(); };
const card = (g, w, h) => { g.fillStyle = '#fbf6ee'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d23a3a'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = '#c02a3a'; g.textAlign = 'center'; g.font = 'italic 700 64px Georgia'; g.fillText('Happy', w / 2, h * 0.44); g.fillText('birthday', w / 2, h * 0.8); };

// ---------- the set ----------
export const build = (ctx) => {
  const { THREE, add, box, toon } = ctx;
  SETS.houseLightsOff(ctx);
  const br = SETS.bedroom(ctx, { at: B });
  const G = new THREE.Group(); G.position.set(...B); ctx.world.add(G);
  const red = toon({ color: '#d42a34' }), str = toon({ color: '#e8e0e0' });
  const face = SETS.canvasPlane(ctx, 0.26, 0.26, 256, G, { alpha: true }); face.draw('s', smiley); face.mesh.visible = false;
  const balloons = SPOTS.map(([y, z], k) => {
    const g = new THREE.Group(); g.position.set(-2.68, y, z); G.add(g);
    const b = add(new THREE.SphereGeometry(0.16, 16, 12), red, 0, 0, 0, g); b.scale.y = 1.18;
    add(new THREE.CylinderGeometry(0.004, 0.004, y - 0.9, 4), str, 0, -(y - 0.9) / 2 - 0.17, 0, g, { cast: false });
    const f = new THREE.Mesh(face.mesh.geometry, face.mesh.material); f.position.set(0.165, 0.03, 0); f.rotation.y = Math.PI / 2; f.userData.ndSkip = true; g.add(f);
    return { g, f, spin: (k % 2 ? 1 : -1) * (0.7 + ((k * 37) % 5) * 0.12) };
  });
  const cardP = SETS.canvasPlane(ctx, 0.22, 0.15, 256, G, { lit: true }); cardP.draw('c', card); cardP.mesh.position.set(-2.62, 1.17, -0.45); cardP.mesh.rotation.y = Math.PI / 2;
  const curt = toon({ color: '#3a5a9a' });
  const cL = add(box(0.06, 1.55, 0.75), curt, -2.2, 1.6, -0.55, G), cR = add(box(0.06, 1.55, 0.75), curt, -2.2, 1.6, 0.15, G);
  const glow = new THREE.PointLight('#ff2a3a', 0, 6, 1.2); glow.position.set(-1.9, 1.5, -0.2); G.add(glow);
  return { br, balloons, cardP, cL, cR, glow };
};
export const update = (W, f, P) => {
  if (!P.br) return;
  P.br.state(W, f);
  P.balloons.forEach((b, k) => {
    b.g.visible = k < W.n && !(k === POPI && W.popped);
    b.g.position.x = -2.68 + Math.sin(f * 0.03 + k) * 0.01; b.g.rotation.z = Math.sin(f * 0.025 + k * 1.7) * 0.05;
    b.f.visible = W.faces > 0; b.g.rotation.y = b.spin * W.faces * (1 - W.turn) + (W.faces > 0 ? 0 : 0);
  });
  P.cardP.mesh.visible = W.n > 0 && W.card;
  const o = W.curt; P.cL.position.z = -0.55 - 0.62 * o; P.cR.position.z = 0.15 + 0.62 * o; P.cL.visible = P.cR.visible = W.curtains;
  P.glow.intensity = W.glow;
};
export const worldAt = (f) => {
  const S = shotAt(f), i = S.i, id = S.id;
  const W = { door: 0, beep: -1, lamp: 0, moon: 0.4, street: 0.6, headlights: 0, car: false, n: SPOTS.length, faces: 0, turn: 0, popped: false, curt: 1, curtains: false, glow: 0, card: true };
  if (id === 'one' || id === 'card') W.n = 1;
  if (id === 'more') W.n = f < S.a + 15 ? 2 : f < S.beat ? 4 : 10;
  if (i <= 2) { W.moon = 0; W.street = 0; }
  if (i >= 3 && i <= 7) { W.glow = 1.6; W.moon = 0; W.card = false; }
  if (id === 'squeak') { W.curtains = true; W.curt = 0; W.glow = 2.2; }
  if (id === 'faces') { W.curtains = true; W.curt = smooth(ramp(f, S.a + 4, S.a + 16)); W.faces = f >= S.a + 10 ? 1 : 0; }
  if (id === 'turn') { W.faces = 1; W.turn = smooth(ramp(f, S.a + 5, S.b - 8)); }
  if (id === 'pop') { W.faces = 1; W.turn = 1; W.popped = f >= S.beat; }
  if (i >= 8) { W.n = 0; W.lamp = 1.3; W.moon = 0.5; W.street = 0.8; W.door = 1; W.curtains = true; W.curt = 1; }
  return W;
};

// ---------- the cast ----------
const KS = 0.62, MS = 0.82;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const you = (expr, o = {}, pos = KID, extra = {}) => out.push(actor(T, YOU, { seed: 31, expr, blink: blinkAt(f, 31), ...o, who: 'you' }, pos, { s: KS, ...extra }));
  const mum = (expr, o = {}, pos = MUMK) => out.push(actor(T, 'mumNight', { seed: 9, expr, blink: blinkAt(f, 9), ...o }, pos, { s: MS }));
  if (id === 'one') you(f < S.beat ? 'smile' : 'nervous', { look: -0.7 });
  if (id === 'more') you('nervous', { look: -0.7 });
  if (id === 'red') you('wary', { look: -0.8 }, W0(0.2, 0, 0.6));
  if (id === 'squeak') you('scared', { look: -0.8, blink: 0 }, W0(-1.2, 0, 0.55));
  if (id === 'faces') you('scared', { look: -0.8, R: 'reach', blink: 0 }, W0(-1.6, 0, 0.6));
  if (id === 'mum') { mum('stern', { look: -0.6, R: 'reach' }, MUMW); you(f < S.beat ? 'scared' : 'relief', { look: -0.6 }, W0(0.15, 0, 0.6)); }
  if (id === 'kiss') { mum('smile', { look: 0.6, headTilt: 8 }); you('relief', { look: -0.5 }, KIDK); }
  if (id === 'string') { mum(f < S.beat ? 'smile' : 'creepy', { look: 0.4, blink: f >= S.beat ? 0 : blinkAt(f, 9) }); }
  return out;
};
const eye = (open) => (p) => { const g = p.g; g.save();
  g.fillStyle = '#f4ece4'; g.beginPath(); g.ellipse(300, 500, 150, 105 * open, 0, 0, 7); g.fill();
  g.strokeStyle = '#c03040'; g.lineWidth = 3; for (let k = 0; k < 9; k++) { const a = k * 0.7; g.beginPath(); g.moveTo(300 + 150 * Math.cos(a), 500 + 100 * open * Math.sin(a)); g.lineTo(300 + 90 * Math.cos(a + 0.2), 500 + 60 * open * Math.sin(a + 0.2)); g.stroke(); }
  g.fillStyle = '#3a6a3a'; g.beginPath(); g.arc(300, 500, 54 * Math.min(1, open * 1.4), 0, 7); g.fill(); g.fillStyle = '#060406'; g.beginPath(); g.arc(300, 500, 24 * Math.min(1, open * 1.4), 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(318, 482, 9, 0, 7); g.fill(); g.lineWidth = 14; g.strokeStyle = '#241726'; g.beginPath(); g.ellipse(300, 500, 150, 105 * open, 0, 0, 7); g.stroke(); g.restore(); };
const string = (p) => { const g = p.g; g.save(); g.strokeStyle = '#d42a34'; g.lineWidth = 9; g.lineCap = 'round';
  g.beginPath(); g.ellipse(300, 860, 46, 16, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(330, 850); g.bezierCurveTo(380, 700, 260, 520, 330, 0); g.stroke(); g.restore(); };
export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [];
  if (id === 'squeak') { const d = (f - S.beat + 200) % 26; if (f >= S.beat - 14 && d < 14) { const t = q(d / 14); out.push(fx('sq' + t, word('squeak', t, '#ff8a9a'), W0(-2.0, 2.0, -0.2), 0.32)); } }
  if (id === 'pop' && f >= S.beat) {
    const [y, z] = SPOTS[POPI], o = q(Math.min(1, (f - S.beat - 3) / 8), 1);
    if (o > 0) out.push(fx('eye' + o, eye(o), [B[0] - 2.78, y - 0.34, z], 0.36, { order: 4 }));
    const d = f - S.beat; if (d < 16) { const t = q(d / 16); out.push(fx('pop' + t, word('POP!', t, '#ff3a4a'), W0(-2.1, y + 0.25, z + 0.1), 0.42)); }
  }
  if (id === 'string' && f >= S.beat - 6) out.push(fx('str', string, W0(0.02, 0.43, 0.34), 0.5, { order: 6 }));
  return out;
};
