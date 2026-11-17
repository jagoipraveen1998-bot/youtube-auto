// "A Crow Keeps Saying My Name": a garden fence outside the kid's bedroom (sets.js bedroom) and the road to
// school (sets.js street). The crow learns your name, saves you from a truck, then talks in your dead dad's
// voice at the window. You let it in. All the way. Next morning you're the crow, and "you" are eating toast.
import * as SETS from './sets.js';
import { OUTFITS } from './toon.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const B = [-40, 0, 0], W0 = (x, y, z) => [B[0] + x, B[1] + y, B[2] + z];
const ST = [0, 0, 60], S0 = (x, y, z) => [ST[0] + x, ST[1] + y, ST[2] + z];
const YOU = { ...OUTFITS.kid, tunic: '#4a7ac0' }, NOTYOU = { ...YOU, moustache: '#2a2018' };   // at the end, "you" has Dad's moustache
const FENCE = W0(-3.6, 0.85, 0.2), KIDG = W0(-4.35, -0.55, 0.7), SILL = W0(-2.62, 0.92, -0.5), SILLIN = W0(-2.2, 0.93, -0.5), BED = W0(-0.2, 0.62, -1.35),
  KIDR = W0(0.4, 0, -0.6), KIDW = W0(-1.4, 0, 0.35), KIDST = S0(-0.6, 0, -3.35), POST = S0(-0.15, 0, -3.62);

const IDS = ['toast', 'name', 'warn', 'truck', 'tap', 'voice', 'gone', 'open', 'laugh', 'chest', 'fence'];
const CAMS = {
  toast: [{ pos: W0(-5.9, 0.9, 2.3), look: W0(-3.95, 0.45, 0.35), fov: 46 }, { pos: W0(-5.6, 0.85, 2.0), look: W0(-3.9, 0.5, 0.35), fov: 40 }],
  name: [{ pos: W0(-4.6, 1.1, 1.05), look: W0(-3.6, 1.0, 0.2), fov: 36 }, { pos: W0(-4.45, 1.08, 0.9), look: W0(-3.6, 1.02, 0.2), fov: 30 }],
  warn: [{ pos: S0(1.4, 1.1, -1.4), look: S0(-0.4, 0.8, -3.5), fov: 46 }, { pos: S0(1.0, 1.05, -1.8), look: S0(-0.35, 0.85, -3.5), fov: 40 }],
  truck: [{ pos: S0(2.6, 1.2, 1.4), look: S0(-0.5, 0.9, -3.3), fov: 44 }, { pos: S0(2.4, 1.15, 1.2), look: S0(-0.5, 0.9, -3.3), fov: 40 }],
  tap: [{ pos: W0(0.6, 1.4, 1.5), look: W0(-2.3, 1.15, -0.4), fov: 48 }, { pos: W0(0.1, 1.35, 1.1), look: W0(-2.4, 1.15, -0.45), fov: 40 }],
  voice: [{ pos: W0(-1.4, 1.2, 0.15), look: W0(-2.62, 1.05, -0.5), fov: 40 }, { pos: W0(-1.7, 1.15, -0.1), look: W0(-2.62, 1.05, -0.5), fov: 34 }],
  gone: [{ pos: W0(-0.35, 1.6, -0.9), look: W0(-0.6, 1.72, -2.1), fov: 36 }, { pos: W0(-0.2, 1.3, 0.2), look: W0(-1.4, 1.0, 0.35), fov: 40 }],
  open: [{ pos: W0(-0.6, 1.35, 1.0), look: W0(-2.35, 1.05, -0.45), fov: 46 }, { pos: W0(-0.9, 1.3, 0.7), look: W0(-2.25, 1.05, -0.45), fov: 40 }],
  laugh: [{ pos: W0(0.1, 1.15, 1.3), look: W0(0.1, 0.8, -0.9), fov: 50 }, { pos: W0(0.1, 1.1, 1.05), look: W0(0.1, 0.8, -0.9), fov: 46 }],
  chest: [{ pos: W0(0.1, 1.15, 1.3), look: W0(0.1, 0.8, -0.9), fov: 50 }, { pos: W0(0.35, 1.05, 0.8), look: W0(0.4, 0.85, -0.6), fov: 40 }],
  fence: [{ pos: W0(-4.55, 1.2, 1.0), look: W0(-2.3, 1.2, 0.0), fov: 44 }, { pos: W0(-4.25, 1.15, 0.85), look: W0(-2.3, 1.15, 0.25), fov: 38 }],
};
const LIGHTS = {
  morning: { ...MOODS.morning, hemi: 1.05, vig: 0.26 },
  night: { ...MOODS.night, hemi: 0.75, fogNear: 9, fogFar: 34, vig: 0.45 },
  warm: { ...MOODS.night, hemi: 0.9, sky: '#b8a8c0', ground: '#3a2c30', fog: '#1e1820', fogNear: 9, fogFar: 32, gain: '#fff0dc', vig: 0.36 },
  black: { ...MOODS.dread, hemi: 0.35, vig: 0.85, sat: 0.6 },
  grey: { ...MOODS.morning, hemi: 0.95, sat: 0.7, vig: 0.5, sky: '#c0c8d8', gain: '#eef2ff' },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S, f) => (S.i < 4 ? 'morning' : S.id === 'laugh' || (S.id === 'open' && f > S.beat) ? 'warm' : S.id === 'chest' ? (f >= S.beat + 4 ? 'black' : 'warm') : S.id === 'fence' ? 'grey' : 'night'),
  tweak: (L, S) => { if (S.id === 'voice') L.vig = 0.66; },
  kicks: ['truck', 'chest'],
  focus: (S) => ({ toast: FENCE, name: W0(-3.6, 1.02, 0.2), warn: KIDST, truck: KIDST, tap: SILL, voice: W0(-2.62, 1.1, -0.5), gone: W0(-0.6, 1.72, -2.1),
    open: SILLIN, laugh: BED, chest: KIDR, fence: W0(-2.2, 1.2, 0.05) }[S.id]),
  shadowAt: (S) => (S.i === 2 || S.i === 3 ? S0(0, 1, -2) : W0(-1, 0.8, 0)),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, camAt, dofAt } = K;
export { LIGHTS };

const dadPhoto = (g, w, h) => { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, w, h); g.fillStyle = '#8aa0b8'; g.fillRect(14, 14, w - 28, h - 28);
  g.fillStyle = '#3a4a6a'; g.beginPath(); g.ellipse(w / 2, h * 0.95, w * 0.36, h * 0.3, 0, 0, 7); g.fill();
  g.fillStyle = '#e0b090'; g.beginPath(); g.arc(w / 2, h * 0.45, w * 0.24, 0, 7); g.fill(); g.fillStyle = '#2a2018'; g.beginPath(); g.arc(w / 2, h * 0.38, w * 0.25, Math.PI, 0); g.fill();
  g.fillStyle = '#241726'; for (const x of [0.41, 0.59]) { g.beginPath(); g.arc(w * x, h * 0.46, 6, 0, 7); g.fill(); }
  g.fillStyle = '#2a2018'; g.beginPath(); g.ellipse(w / 2, h * 0.54, w * 0.09, h * 0.022, 0, 0, 7); g.fill();
  g.strokeStyle = '#241726'; g.lineWidth = 4; g.beginPath(); g.arc(w / 2, h * 0.56, w * 0.07, 0.3, Math.PI - 0.3); g.stroke(); };

function crow(ctx, parent) {
  const { THREE, add, toon } = ctx; const g = new THREE.Group(); parent.add(g);
  const blk = toon({ color: '#1a1a24' }), beakM = toon({ color: '#4a4a52' });
  const body = add(new THREE.SphereGeometry(0.1, 14, 10), blk, 0, 0.12, 0, g); body.scale.set(1.0, 0.9, 1.5);
  const tail = add(new THREE.BoxGeometry(0.08, 0.02, 0.16), blk, 0, 0.1, -0.17, g); tail.rotation.x = -0.4;
  const head = new THREE.Group(); head.position.set(0, 0.23, 0.1); g.add(head);
  add(new THREE.SphereGeometry(0.065, 12, 10), blk, 0, 0, 0, head);
  const beak = add(new THREE.ConeGeometry(0.022, 0.09, 8), beakM, 0, -0.005, 0.09, head); beak.rotation.x = Math.PI / 2;
  const jaw = add(new THREE.ConeGeometry(0.016, 0.07, 8), beakM, 0, -0.022, 0.08, head); jaw.rotation.x = Math.PI / 2;
  const eyeM = new THREE.MeshBasicMaterial({ color: '#f2f2f2' });
  for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.014, 8, 6), eyeM, s * 0.045, 0.015, 0.04, head, { cast: false }); add(new THREE.SphereGeometry(0.008, 6, 6), new THREE.MeshBasicMaterial({ color: '#000' }), s * 0.052, 0.015, 0.048, head, { cast: false }); }
  const wings = [-1, 1].map((s) => { const w = add(new THREE.BoxGeometry(0.02, 0.1, 0.2), blk, s * 0.1, 0.13, -0.02, g); return w; });
  for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 4), beakM, s * 0.03, 0.02, 0.01, g, { cast: false });
  return { g, head, jaw, wings, eyeM };
}

// ---------- the sets ----------
export const build = (ctx) => {
  const { THREE, add, box, toon } = ctx;
  SETS.houseLightsOff(ctx);
  const br = SETS.bedroom(ctx, { at: B });
  const st = SETS.street(ctx, { at: ST });
  const G = new THREE.Group(); G.position.set(...B); ctx.world.add(G);
  const wood = toon({ color: '#9a7048' });
  add(box(0.06, 0.08, 3.2), wood, -3.6, 0.82, -0.3, G); add(box(0.06, 0.08, 3.2), wood, -3.6, 0.2, -0.3, G);           // garden fence
  for (let z = -1.8; z <= 1.3; z += 0.22) add(box(0.04, 1.4, 0.12), wood, -3.6, 0.15, z, G);
  add(box(0.5, 0.04, 0.3), toon({ color: '#e8e0d0' }), -2.15, 0.92, -0.5, G, { cast: false });                        // inside sill board
  br.photo.draw('dad', dadPhoto);
  // the street: a short post by the kerb, a traffic light, a truck
  const SG = new THREE.Group(); SG.position.set(...ST); ctx.world.add(SG);
  add(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 10), toon({ color: '#d8d8d0' }), POST[0] - ST[0], 0.5, POST[2] - ST[2], SG);
  const tl = new THREE.Group(); tl.position.set(1.1, 0, -3.8); SG.add(tl);
  add(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8), toon({ color: '#3a3e4a' }), 0, 1.3, 0, tl); add(box(0.26, 0.6, 0.2), toon({ color: '#20222a' }), 0, 2.7, 0, tl);
  const redM = new THREE.MeshBasicMaterial({ color: '#ff2a2a' }); add(new THREE.SphereGeometry(0.07, 10, 8), redM, 0, 2.88, 0.11, tl, { cast: false });
  add(new THREE.SphereGeometry(0.07, 10, 8), toon({ color: '#2a3a2a' }), 0, 2.55, 0.11, tl, { cast: false });
  const truck = new THREE.Group(); SG.add(truck);
  add(box(5.0, 2.4, 2.2), toon({ color: '#d8862a' }), -0.8, 1.6, 0, truck); add(box(1.6, 1.9, 2.2), toon({ color: '#c83a2a' }), 2.2, 1.35, 0, truck);
  add(box(0.05, 0.8, 1.9), toon({ color: '#3a4a6a' }), 3.0, 1.75, 0, truck);
  for (const x of [-2.4, 0.4, 2.2]) for (const s of [-1, 1]) { const w = add(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 16), toon({ color: '#14141a' }), x, 0.45, s * 1.05, truck); w.rotation.x = Math.PI / 2; }
  const c = crow(ctx, ctx.world);
  return { br, st, c, truck };
};
export const update = (W, f, P) => {
  if (!P.br) return;
  P.br.state(W, f); P.st.state({ policeIn: -1 }, f);
  P.truck.visible = W.truckX > -50; P.truck.position.set(W.truckX, 0, -1.6);
  const c = P.c; c.g.visible = W.crow; if (!W.crow) return;
  c.g.position.set(...W.cp); c.g.rotation.y = W.cy; c.g.scale.setScalar(W.cs);
  c.head.rotation.z = W.tilt; c.head.rotation.x = W.nod; c.jaw.rotation.x = Math.PI / 2 + W.beak;
  c.wings.forEach((w, k) => { w.rotation.z = (k ? -1 : 1) * W.flap; });
  c.eyeM.color.set(W.glowEye ? '#ffe28a' : '#f2f2f2');
};
const talk = (f, on) => (on ? (Math.sin(f * 0.9) > 0 ? 0.35 : 0) : 0);
export const worldAt = (f) => {
  const S = shotAt(f), i = S.i, id = S.id;
  const W = { door: 0, beep: -1, lamp: 0, moon: 0.7, street: 0.9, headlights: 0, car: false, truckX: -99, crow: true, cp: FENCE, cy: -0.9, cs: 1.0, tilt: 0, nod: 0, beak: 0, flap: 0, glowEye: false };
  if (i < 2 || id === 'fence') { W.moon = 0; W.street = 0; }
  if (id === 'toast') { W.nod = f % 40 < 6 ? 0.4 : 0; W.cy = -0.95; }
  if (id === 'name') { W.cy = -0.9; W.tilt = 0.35 * smooth(ramp(f, S.a + 4, S.a + 14)); W.beak = talk(f, f > S.beat - 6 && f < S.beat + 16); }
  if (id === 'warn' || id === 'truck') { W.cp = [POST[0], 1.0, POST[2]]; W.cy = -0.4; W.beak = talk(f, id === 'warn' && f > S.beat - 4 && f < S.beat + 20); W.flap = id === 'truck' && f > S.beat ? 0.8 * Math.abs(Math.sin(f * 0.8)) : 0; }
  if (id === 'truck') W.truckX = lerp(-22, 22, ramp(f, S.beat - 2, S.beat + 40));
  if (id === 'tap' || id === 'voice') { W.cp = SILL; W.cy = Math.PI / 2; W.nod = id === 'tap' && (f % 16 < 4) ? 0.6 : 0; W.beak = talk(f, id === 'voice' && f > S.beat - 6); W.glowEye = id === 'voice'; }
  if (id === 'gone') W.crow = false;
  if (id === 'open') { const t = smooth(ramp(f, S.beat - 4, S.beat + 10)); W.cp = lerp3(SILL, SILLIN, t); W.cp[1] += Math.sin(Math.PI * t) * 0.2; W.cy = Math.PI / 2; W.flap = t > 0 && t < 1 ? 0.9 : 0; W.lamp = f > S.beat ? 1.1 : 0; }
  if (id === 'laugh') { W.cp = BED; W.cy = 0.4; W.beak = talk(f, true); W.nod = Math.sin(f * 0.4) * 0.15; W.lamp = 1.2; }
  if (id === 'chest') { const t = smooth(ramp(f, S.beat - 12, S.beat + 4)); W.cp = lerp3(BED, W0(0.4, 0.62, -0.55), t); W.cy = 0.6 + 1.6 * t; W.flap = t > 0 ? 1.0 * Math.abs(Math.sin(f * 1.1)) : 0; W.crow = t < 1; W.lamp = f >= S.beat + 4 ? 0 : 1.2; W.moon = f >= S.beat + 4 ? 0.1 : 0.7; }
  if (id === 'fence') { W.cp = W0(-3.6, 0.85, 0.5); W.cy = Math.PI / 2 - 0.2; W.cs = 1.0; W.tilt = 0.2; W.lamp = 0.6; }
  return W;
};

// ---------- the cast ----------
const KS = 0.62;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const you = (expr, o = {}, pos = KIDG, extra = {}, who = YOU) => out.push(actor(T, who, { seed: 31, expr, blink: blinkAt(f, 31), ...o, who: 'you' }, pos, { s: KS, ...extra }));
  if (id === 'toast') you('smile', { look: 0.6, R: 'lift' });
  if (id === 'warn') you(f < S.beat ? 'smile' : 'wary', { look: 0.5 }, KIDST);
  if (id === 'truck') you(f < S.beat + 6 ? 'wary' : 'shock', { look: 0.4, blink: 0 }, KIDST);
  if (id === 'tap') you('wary', { look: -0.7 }, KIDW);
  if (id === 'gone') you(f < S.beat ? 'neutral' : 'nervous', { look: -0.6, headTilt: -6 }, KIDW);
  if (id === 'open') you(f < S.beat ? 'nervous' : 'relief_open', { look: -0.8, R: 'reach' }, W0(-1.55, 0, 0.1));
  if (id === 'laugh') you('laugh', { look: -0.5 }, KIDR);
  if (id === 'chest') you(f < S.beat ? 'smile' : 'shock', { look: -0.5, blink: f >= S.beat ? 0 : blinkAt(f, 31) }, KIDR);
  if (id === 'fence') you('creepy', { look: -0.9, R: 'lift', blink: 0 }, W0(-1.95, 0.15, 0.1), {}, NOTYOU);
  return out;
};
const toast = (p) => { const g = p.g; g.save(); g.fillStyle = '#c88a3a'; g.beginPath(); g.roundRect(200, 380, 200, 210, 50); g.fill(); g.fillStyle = '#f0d090'; g.beginPath(); g.roundRect(222, 402, 156, 166, 36); g.fill();
  g.lineWidth = 10; g.strokeStyle = '#241726'; g.beginPath(); g.roundRect(200, 380, 200, 210, 50); g.stroke(); g.restore(); };
const crumbs = (t) => (p) => { const g = p.g; g.fillStyle = '#e0b060'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(220 + k * 40, 300 + 400 * t + (k % 2) * 40, 12, 0, 7); g.fill(); } };
export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [];
  if (id === 'toast') { out.push(fx('toast', toast, W0(-4.1, -0.15, 0.75), 0.18, { order: 6 })); const t = q((f % 30) / 30, 1); out.push(fx('cr' + t, crumbs(t), W0(-3.75, 0.55, 0.3), 0.3)); }
  if (id === 'name') { const d = f - S.beat + 6; if (d >= 0 && d < 24) { const t = q(d / 24); out.push(fx('nm' + t, word('...!', t, '#f2f2f2'), W0(-3.55, 1.15, 0.25), 0.18)); } }
  if (id === 'warn') { const d = f - S.beat + 4; if (d >= 0 && d < 26) { const t = q(d / 26); out.push(fx('st' + t, word('STOP!', t, '#ffd23f'), [POST[0] + 0.1, 1.15, POST[2]], 0.32)); } }
  if (id === 'tap') { const d = f % 16; if (d < 8) { const t = q(d / 8); out.push(fx('tp' + t, word('tap', t, '#cfd6ff'), W0(-2.3, 1.35, -0.5), 0.2)); } }
  if (id === 'voice') { const d = f - S.beat + 6; if (d >= 0 && d < 40) { const t = q(Math.max(0, d - 14) / 26); out.push(fx('lm' + t, word('LET ME IN', t, '#ffe28a'), W0(-2.4, 1.35, -0.45), 0.24)); } }
  if (id === 'fence') out.push(fx('toast2', toast, W0(-1.82, 0.62, 0.15), 0.13, { order: 6 }));
  return out;
};
