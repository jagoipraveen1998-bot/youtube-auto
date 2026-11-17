// "My Grandpa's Rule: Feed The Scarecrow Before Dark": a field at sunset (built here), the bedroom set
// (sets.js) at night, and a farm kitchen (built here). You forget the rice once; the scarecrow comes to your
// window, then sits in your chair at breakfast while Mum calls it by your name and looks right through you.
import * as SETS from './sets.js';
import { OUTFITS } from './toon.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const B = [-40, 0, 0], W0 = (x, y, z) => [B[0] + x, B[1] + y, B[2] + z];
const FO = [0, 0, -70], F = (x, y, z) => [FO[0] + x, FO[1] + y, FO[2] + z];
const KO = [0, 0, -100], KK = (x, y, z) => [KO[0] + x, KO[1] + y, KO[2] + z];
const YOU = { ...OUTFITS.kid, tunic: '#4a7ac0' };
const HEADB = W0(-0.95, 0, -1.55);

const IDS = ['rule', 'rice', 'joke', 'forgot', 'window', 'count', 'breakfast', 'chair', 'name', 'lunch', 'through'];
const CAMS = {
  rule: [{ pos: F(3.0, 1.4, 3.4), look: F(0.4, 1.2, 0.3), fov: 46 }, { pos: F(2.6, 1.35, 3.0), look: F(0.4, 1.2, 0.3), fov: 42 }],
  rice: [{ pos: F(0.9, 1.05, 2.3), look: F(0.3, 0.6, 0.4), fov: 46 }, { pos: F(0.8, 0.95, 2.0), look: F(0.25, 0.55, 0.35), fov: 42 }],
  joke: [{ pos: F(1.7, 1.05, 2.4), look: F(0.55, 0.95, 0.9), fov: 40 }, { pos: F(1.55, 1.0, 2.2), look: F(0.55, 0.95, 0.9), fov: 36 }],
  forgot: [{ pos: F(1.3, 1.6, 2.8), look: F(0, 1.75, 0), fov: 34 }, { pos: F(0.9, 1.75, 1.8), look: F(0, 1.85, 0), fov: 28 }],
  window: [{ pos: W0(0.9, 1.3, 1.3), look: W0(-2.4, 1.3, -0.2), fov: 50 }, { pos: W0(-0.5, 1.3, 0.55), look: W0(-2.6, 1.3, -0.2), fov: 40 }],
  count: [{ pos: W0(-0.45, 0.95, -0.6), look: W0(-0.95, 0.68, -1.55), fov: 38 }, { pos: W0(-0.55, 0.9, -0.75), look: W0(-0.95, 0.68, -1.55), fov: 34 }],
  breakfast: [{ pos: KK(0.5, 1.5, 3.3), look: KK(0.1, 1.0, -0.2), fov: 50 }, { pos: KK(0.45, 1.45, 3.0), look: KK(0.1, 1.0, -0.2), fov: 46 }],
  chair: [{ pos: KK(0.35, 1.25, 1.6), look: KK(0, 1.15, -0.6), fov: 40 }, { pos: KK(0.25, 1.2, 1.1), look: KK(0, 1.2, -0.6), fov: 34 }],
  name: [{ pos: KK(1.7, 1.3, 1.2), look: KK(0.4, 1.2, -0.4), fov: 44 }, { pos: KK(1.5, 1.28, 1.0), look: KK(0.4, 1.2, -0.4), fov: 40 }],
  lunch: [{ pos: KK(1.0, 1.15, 0.9), look: KK(0.2, 0.95, -0.45), fov: 40 }, { pos: KK(0.9, 1.1, 0.75), look: KK(0.15, 0.95, -0.5), fov: 36 }],
  through: [{ pos: KK(-0.25, 1.3, 2.0), look: KK(0.45, 1.1, -0.5), fov: 46 }, { pos: KK(-0.15, 1.28, 1.7), look: KK(0.45, 1.15, -0.5), fov: 40 }],
};
const LIGHTS = {
  sunset: { ...MOODS.evening, hemi: 0.9, vig: 0.38 },
  dusk: { ...MOODS.dread, hemi: 0.5, sky: '#5a4a6a', ground: '#2a2018', fog: '#2a2030', fogNear: 6, fogFar: 30, vig: 0.62 },
  night: { ...MOODS.night, hemi: 0.4, fog: '#05060c', fogNear: 5, fogFar: 20, vig: 0.6 },
  grey: { ...MOODS.morning, hemi: 0.85, sat: 0.65, vig: 0.48, sky: '#c0c8d8', gain: '#eef2ff' },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.i < 3 ? 'sunset' : S.i === 3 ? 'dusk' : S.i < 6 ? 'night' : 'grey'),
  tweak: (L, S) => { if (S.id === 'through') L.vig = 0.7; },
  kicks: ['chair', 'window'],
  focus: (S) => ({ rule: F(0.4, 1.2, 0.5), rice: F(0.15, 0.6, 0.3), joke: F(0.55, 0.95, 0.9), forgot: F(0, 1.85, 0), window: W0(-2.6, 1.35, -0.2), count: W0(-0.95, 0.68, -1.55),
    breakfast: KK(-0.4, 1.0, 0.5), chair: KK(0, 1.2, -0.6), name: KK(0.5, 1.2, -0.4), lunch: KK(0.15, 0.95, -0.5), through: KK(0.5, 1.15, -0.3) }[S.id]),
  shadowAt: (S) => (S.i < 4 ? F(0.3, 1, 0.3) : S.i < 6 ? W0(-1, 0.8, -0.5) : KK(0, 1, 0)),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, camAt, dofAt } = K;
export { LIGHTS };

const sackFace = (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#2a1a10'; g.lineWidth = w * 0.045; g.lineCap = 'round';
  for (const x of [0.33, 0.67]) { g.beginPath(); g.moveTo(w * (x - 0.08), h * 0.3); g.lineTo(w * (x + 0.08), h * 0.46); g.moveTo(w * (x + 0.08), h * 0.3); g.lineTo(w * (x - 0.08), h * 0.46); g.stroke(); }
  g.beginPath(); g.moveTo(w * 0.18, h * 0.62); g.quadraticCurveTo(w * 0.5, h * 0.86, w * 0.82, h * 0.62); g.stroke();
  g.lineWidth = w * 0.02; for (let k = 0; k < 9; k++) { const x = 0.22 + k * 0.07, y = 0.62 + Math.sin(Math.PI * (k / 8)) * 0.17; g.beginPath(); g.moveTo(w * x, h * (y - 0.06)); g.lineTo(w * x, h * (y + 0.06)); g.stroke(); } };

function scarecrow(ctx, parent) {
  const { THREE, add, box, toon } = ctx; const g = new THREE.Group(); parent.add(g);
  const post = add(new THREE.CylinderGeometry(0.04, 0.05, 2.1, 8), toon({ color: '#6a4a2a' }), 0, 1.05, -0.06, g);
  const body = new THREE.Group(); body.position.set(0, 1.25, 0); g.add(body);
  const plaid = toon({ color: '#a83a2a' }), straw = toon({ color: '#e0c060' }), sack = toon({ color: '#c8a46a' });
  add(box(0.42, 0.52, 0.22), plaid, 0, 0, 0, body); add(box(0.44, 0.06, 0.24), toon({ color: '#3a2a1a' }), 0, -0.2, 0, body);
  const arms = add(box(1.1, 0.12, 0.13), plaid, 0, 0.17, 0, body);
  for (const s of [-1, 1]) { const t = add(new THREE.ConeGeometry(0.07, 0.16, 7), straw, s * 0.62, 0.17, 0, body); t.rotation.z = s * Math.PI / 2; }
  const legs = add(box(0.36, 0.5, 0.18), toon({ color: '#3a4a6a' }), 0, -0.5, 0, body);
  const head = new THREE.Group(); head.position.set(0, 0.48, 0); body.add(head);
  add(new THREE.SphereGeometry(0.17, 14, 12), sack, 0, 0, 0, head);
  const face = SETS.canvasPlane(ctx, 0.26, 0.26, 256, head, { alpha: true, lit: true }); face.draw('f', sackFace); face.mesh.position.set(0, -0.01, 0.168);
  add(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 18), straw, 0, 0.13, 0, head); add(new THREE.ConeGeometry(0.15, 0.24, 14), straw, 0, 0.26, 0, head);
  add(new THREE.ConeGeometry(0.05, 0.12, 6), straw, 0, -0.2, 0.02, head).rotation.x = Math.PI;
  return { g, post, body, head, arms, legs };
}

// ---------- the sets ----------
export const build = (ctx) => {
  const { THREE, add, box, toon } = ctx;
  SETS.houseLightsOff(ctx);
  const br = SETS.bedroom(ctx, { at: B });
  // the field
  const FG = new THREE.Group(); FG.position.set(...FO); ctx.world.add(FG);
  add(box(40, 0.1, 40), toon({ color: '#6a7a3a' }), 0, -0.05, 0, FG, { cast: false });
  for (let r = -6; r <= 6; r++) for (let c = -8; c <= 8; c++) if (Math.abs(r) > 0 || Math.abs(c) > 1) add(new THREE.ConeGeometry(0.12, 0.45 + ((r * 7 + c * 3) % 3) * 0.08, 6), toon({ color: '#5a8a3a' }), c * 0.7, 0.22, r * 0.9 - 2, FG);
  add(box(3, 2.4, 2.4), toon({ color: '#b8a080' }), -4, 1.2, -9, FG); const roof = add(new THREE.ConeGeometry(2.3, 1.2, 4), toon({ color: '#7a3a2a' }), -4, 3.0, -9, FG); roof.rotation.y = Math.PI / 4;
  const farmWin = add(box(0.5, 0.5, 0.05), new THREE.MeshBasicMaterial({ color: '#ffd08a' }), -3.5, 1.4, -7.78, FG, { cast: false });
  const bowl = add(new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon({ color: '#e8e0d0' }), 0.18, 0.1, 0.28, FG);
  const rice = add(new THREE.SphereGeometry(0.085, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon({ color: '#fbfbf4' }), 0.18, 0.08, 0.28, FG);
  // the kitchen
  const KG = new THREE.Group(); KG.position.set(...KO); ctx.world.add(KG);
  add(box(6, 0.1, 6), toon({ color: '#b89a72' }), 0, -0.05, 0, KG, { cast: false });
  add(box(6, 2.8, 0.1), toon({ color: '#e0d6b8' }), 0, 1.4, -1.6, KG); add(box(0.1, 2.8, 6), toon({ color: '#d8ccb0' }), 1.8, 1.4, 0, KG); add(box(0.1, 2.8, 6), toon({ color: '#d8ccb0' }), -2.3, 1.4, 0, KG);
  add(box(0.9, 0.7, 0.05), new THREE.MeshBasicMaterial({ color: '#c8d4e4' }), -0.8, 1.6, -1.54, KG, { cast: false });
  add(box(1.3, 0.06, 0.8), toon({ color: '#8a5a3a' }), 0, 0.75, -0.2, KG);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(box(0.05, 0.75, 0.05), toon({ color: '#6a4228' }), dx * 0.58, 0.37, -0.2 + dz * 0.33, KG);
  for (const [x, z, ry] of [[0, -0.75, 0], [-0.85, -0.2, Math.PI / 2]]) { const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; KG.add(c);
    add(box(0.42, 0.05, 0.42), toon({ color: '#7a4a2a' }), 0, 0.45, 0, c); add(box(0.42, 0.55, 0.05), toon({ color: '#7a4a2a' }), 0, 0.75, -0.2, c); }
  for (const x of [-0.35, 0.35]) { add(new THREE.CylinderGeometry(0.11, 0.09, 0.03, 14), toon({ color: '#f2f2ea' }), x, 0.795, -0.45, KG); }
  const lunch = add(box(0.22, 0.12, 0.15), toon({ color: '#3a7ac8' }), 0, 0, 0, KG);
  const sc = scarecrow(ctx, ctx.world);
  return { br, sc, bowl, rice, lunch, farmWin };
};
export const update = (W, f, P) => {
  if (!P.br) return;
  P.br.state(W, f);
  const sc = P.sc;
  sc.g.position.set(...W.sp); sc.g.rotation.y = W.sy; sc.post.visible = W.post; sc.legs.visible = !W.sit;
  sc.body.position.y = W.sit ? 0.98 : 1.25; sc.head.rotation.y = W.hy; sc.head.rotation.z = W.hz; sc.arms.rotation.z = W.sit ? 0 : 0;
  P.bowl.visible = W.bowl > 0; P.rice.visible = W.bowl > 1;
  P.lunch.position.set(...lerp3([0.8, 1.0, -0.35], [0.12, 0.84, -0.42], W.lunch)); P.lunch.visible = W.kitchen;
};
export const worldAt = (f) => {
  const S = shotAt(f), i = S.i, id = S.id;
  const W = { door: 0, beep: -1, lamp: 0, moon: 0.45, street: 0.4, headlights: 0, car: false, sp: F(0, 0, 0), sy: 0, hy: 0, hz: 0, post: true, sit: false, bowl: 2, lunch: 0, kitchen: false };
  if (id === 'rice') W.bowl = f > S.beat ? 2 : 1;
  if (id === 'joke') W.hz = 0.12;
  if (id === 'forgot') { W.bowl = 1; W.hy = lerp(2.4, 0, smooth(ramp(f, S.a + 6, S.beat + 8))); W.hz = 0.25 * smooth(ramp(f, S.beat, S.b)); }
  if (id === 'window') { W.sp = W0(-3.05, -0.75, -0.15); W.sy = Math.PI / 2; W.post = false; W.hz = 0.2; }
  if (id === 'count') { W.sp = W0(-3.05, -0.75, -0.15); W.sy = Math.PI / 2; W.post = false; }
  if (i >= 6) { W.kitchen = true; W.sp = KK(0, 0, -0.72); W.sy = 0; W.post = false; W.sit = true; }
  if (id === 'breakfast') W.sp = KK(0, -50, 0);                                        // not at the table yet
  if (id === 'name') W.hz = 0.15;
  if (id === 'lunch') W.lunch = smooth(ramp(f, S.a + 6, S.beat + 6));
  if (id === 'through') { W.lunch = 1; W.hz = -0.2; }
  return W;
};

// ---------- the cast ----------
const KS = 0.62;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const you = (expr, o = {}, pos, extra = {}) => out.push(actor(T, YOU, { seed: 31, expr, blink: blinkAt(f, 31), ...o, who: 'you' }, pos, { s: KS, ...extra }));
  const mum = (expr, o = {}, pos = KK(0.95, 0, -0.5)) => out.push(actor(T, 'mum', { seed: 9, expr, blink: blinkAt(f, 9), ...o }, pos, { s: 0.82 }));
  if (id === 'rule') { out.push(actor(T, 'grandpa', { seed: 21, expr: 'stern', blink: blinkAt(f, 21), look: -0.5, R: 'point' }, F(1.4, 0, 1.0), { s: 0.84 })); you('neutral', { look: -0.4 }, F(0.7, 0, 1.6)); }
  if (id === 'rice') you('smile', { look: -0.6, R: 'reach' }, F(0.55, 0, 0.7));
  if (id === 'joke') you('laugh', { look: -0.3 }, F(0.55, 0, 0.9));
  if (id === 'window') you('scared', { look: -0.8, blink: 0 }, [HEADB[0], HEADB[1] - 0.25, HEADB[2]], { order: 2 });
  if (id === 'count') you('sleep', { blink: 1 }, [HEADB[0], HEADB[1] - 0.3, HEADB[2]], { order: 2 });
  if (id === 'breakfast') { you('smile', { look: 0.3 }, KK(-0.25, 0, 1.25)); mum('smile', { look: -0.4 }); }
  if (id === 'chair') you('shock', { look: 0.2, blink: 0 }, KK(-1.15, 0, 0.75));
  if (id === 'name') mum('smile', { look: -0.6, headTilt: 6 });
  if (id === 'lunch') mum('smile', { look: -0.6, R: 'reach' });
  if (id === 'through') { mum(f < S.beat ? 'smile' : 'neutral', { look: f < S.beat ? -0.7 : 0, blink: 0 }); }
  return out;
};
const num = (txt, t) => (p) => { const g = p.g; g.save(); g.font = '900 110px Arial Black, Arial'; g.textAlign = 'center'; g.globalAlpha = Math.max(0, 1 - t); g.fillStyle = '#c8d4ff'; g.fillText(txt, 300, 500); g.restore(); };
export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [];
  if (id === 'count') { const n = Math.min(100, 96 + Math.floor(ramp(f, S.a, S.b) * 5)), u = q((ramp(f, S.a, S.b) * 5) % 1, 1); out.push(fx('n' + n + u, num(String(n), u), W0(-0.75, 0.55, -1.35), 0.14)); }
  return out;
};
