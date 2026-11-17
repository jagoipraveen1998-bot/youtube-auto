// "My New House Has One Rule: Never Turn Off The Hallway Light": the bedroom set (sets.js) with a hallway
// built off its door. You switch the light off; in torchlight the hallway stretches and grows strange doors.
// Your bedroom door is open, and you are already in bed. The other you sits up: "My turn now."
import * as SETS from './sets.js';
import { OUTFITS } from './toon.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const B = [-40, 0, 0], W0 = (x, y, z) => [B[0] + x, B[1] + y, B[2] + z];
const YOU = { ...OUTFITS.kid, tunic: '#4a7ac0' };
const SEG = 1.5, X0 = 2.5, CZ = 0.6, HW = 0.75, HH = 2.5, N0 = 3, NMAX = 13, E0 = X0 + SEG * N0;   // the hallway runs +x from the bedroom door
const SW = W0(E0 - 0.02, 1.25, 0.95), BEDHEAD = W0(-0.95, 0, -1.55);

const IDS = ['rule', 'never', 'red', 'dad', 'off', 'longer', 'doors', 'open', 'bed', 'sat', 'turn'];
const CAMS = {
  rule: [{ pos: W0(4.0, 1.5, 0.95), look: W0(6.9, 1.25, 0.6), fov: 52 }, { pos: W0(4.6, 1.45, 0.9), look: W0(6.95, 1.3, 0.7), fov: 44 }],
  never: [{ pos: W0(6.15, 1.32, 0.75), look: SW, fov: 34 }, { pos: W0(6.4, 1.33, 0.82), look: SW, fov: 26 }],
  red: [{ pos: W0(6.1, 1.5, 0.8), look: W0(E0, 1.62, 0.9), fov: 36 }, { pos: W0(6.3, 1.52, 0.84), look: W0(E0, 1.62, 0.9), fov: 32 }],
  dad: [{ pos: W0(4.2, 1.35, 0.25), look: W0(5.95, 1.1, 0.65), fov: 48 }, { pos: W0(4.5, 1.3, 0.3), look: W0(6.0, 1.1, 0.65), fov: 42 }],
  off: [{ pos: W0(5.5, 1.3, 0.2), look: W0(6.9, 1.2, 0.8), fov: 44 }, { pos: W0(5.7, 1.28, 0.25), look: W0(6.9, 1.22, 0.85), fov: 40 }],
  longer: [{ pos: W0(E0 - 1.0, 1.45, 0.75), look: W0(2.4, 1.05, 0.6), fov: 46 }, { pos: W0(E0 - 1.0, 1.45, 0.72), look: W0(2.4, 1.05, 0.6), fov: 30 }],
  doors: [{ pos: W0(14.5, 1.4, 0.95), look: W0(9.0, 1.15, 0.45), fov: 46 }, { pos: W0(11.0, 1.4, 0.9), look: W0(5.5, 1.15, 0.45), fov: 46 }],
  open: [{ pos: W0(5.4, 1.4, 0.7), look: W0(0.5, 0.9, -0.6), fov: 44 }, { pos: W0(3.9, 1.38, 0.62), look: W0(0.2, 0.85, -0.9), fov: 40 }],
  bed: [{ pos: W0(1.7, 1.3, 0.5), look: W0(-0.8, 0.65, -1.5), fov: 42 }, { pos: W0(1.2, 1.2, 0.2), look: W0(-0.9, 0.7, -1.5), fov: 36 }],
  sat: [{ pos: W0(0.8, 1.15, -0.2), look: W0(-0.95, 0.85, -1.55), fov: 40 }, { pos: W0(0.5, 1.1, -0.45), look: W0(-0.95, 0.9, -1.55), fov: 36 }],
  turn: [{ pos: W0(0.15, 1.02, -0.75), look: W0(-0.95, 0.92, -1.55), fov: 36 }, { pos: W0(-0.1, 1.0, -0.95), look: W0(-0.95, 0.93, -1.55), fov: 32 }],
};
const LIGHTS = {
  eve: { ...MOODS.evening, hemi: 0.95, vig: 0.32 },
  dark: { ...MOODS.dread, hemi: 0.22, fog: '#030308', fogNear: 4, fogFar: 22, vig: 0.7 },
  room: { ...MOODS.night, hemi: 0.22, fog: '#06060c', fogNear: 5, fogFar: 20, vig: 0.65 },
};
const E = (f, S) => (S.id === 'longer' ? X0 + SEG * lerp(N0, NMAX, smooth(ramp(f, S.a + 4, S.b - 4))) : S.i > 5 && S.i < 8 ? X0 + SEG * NMAX : E0);
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S, f) => (S.i < 4 || (S.id === 'off' && f < S.beat) ? 'eve' : S.i < 8 ? 'dark' : 'room'),
  tweak: (L, S) => { if (S.id === 'turn') L.vig = 0.78; },
  kicks: ['bed', 'turn'],
  focus: (S, C, f) => ({ rule: W0(6.6, 1.2, 0.6), never: SW, red: W0(E0, 1.62, 0.9), dad: W0(5.9, 1.1, 0.7), off: SW, longer: W0(2.4, 1.05, 0.6), doors: W0(8, 1.1, 0.5),
    open: W0(2.4, 1.0, 0.6), bed: BEDHEAD.map((v, i) => v + [0, 0.6, 0][i]), sat: W0(-0.95, 0.9, -1.55), turn: W0(-0.95, 0.93, -1.55) }[S.id]),
  shadowAt: (S) => (S.i < 8 ? W0(5, 1, 0.6) : W0(-0.5, 0.8, -1)),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, dofAt } = K;
export const camAt = (f) => { const c = K.camAt(f), S = shotAt(f); if (S.id === 'longer') { const dx = E(f, S) - E0; c.pos = [c.pos[0] + dx, c.pos[1], c.pos[2]]; } return c; };
export { LIGHTS };

const rule = (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#b01020'; g.strokeStyle = '#b01020'; g.textAlign = 'center';
  g.font = '700 66px "Comic Sans MS", Arial'; g.fillText('NEVER', w / 2, 90); g.fillText('TURN IT OFF', w / 2, 170);
  g.lineWidth = 5; for (const x of [140, 260, 330, 420]) { g.beginPath(); g.moveTo(x, 175); g.lineTo(x + 3, 175 + 40 + (x % 50)); g.stroke(); } };
const plate = (g, w, h) => { g.fillStyle = '#f2efe6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8b2a4'; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8);
  g.fillStyle = '#e0dccf'; g.fillRect(w * 0.32, h * 0.22, w * 0.36, h * 0.56); g.fillStyle = '#c8c2b2'; g.fillRect(w * 0.32, h * 0.22, w * 0.36, h * 0.2); };

// ---------- the set ----------
export const build = (ctx) => {
  const { THREE, add, box, tbox, toon, texM, P } = ctx;
  SETS.houseLightsOff(ctx);
  const br = SETS.bedroom(ctx, { at: B });
  br.G.children.forEach((m) => { if (m.isMesh && Math.abs(m.position.x - 3.3) < 0.01) m.visible = false; });   // drop the set's dark landing: the hallway is there now
  const H = new THREE.Group(); H.position.set(...B); ctx.world.add(H);
  const wall = texM(P.plaster(51, 215), 1, 1, '#d8ccb8'), floor = texM(P.planks(52), 1, 2, '#9a7a5a'), ceil = toon({ color: '#e8e4da' }), doorM = toon({ color: '#5a3a2a' }), gap = new THREE.MeshBasicMaterial({ color: '#020204' });
  const segs = [];
  for (let i = 0; i < NMAX; i++) {
    const g = new THREE.Group(); g.position.set(X0 + SEG * i + SEG / 2, 0, CZ); H.add(g);
    add(tbox(SEG, 0.1, HW * 2, 1), floor, 0, -0.05, 0, g, { cast: false }); add(box(SEG, 0.1, HW * 2), ceil, 0, HH + 0.05, 0, g, { cast: false });
    for (const s of [-1, 1]) add(tbox(SEG, HH, 0.12, 1), wall, 0, HH / 2, s * (HW + 0.06), g);
    if (i >= N0) for (const s of [-1, 1]) {                                                      // doors that weren't there before
      const dz = s * (HW - 0.01), off = ((i * 7 + (s > 0 ? 3 : 0)) % 5) * 0.1 - 0.2;
      add(box(0.9, 2.0, 0.04), doorM, off, 1.0, dz, g); add(box(0.06, 0.06, 0.06), toon({ color: '#c8b070' }), off + 0.33, 1.0, dz - s * 0.04, g);
      if ((i + (s > 0 ? 1 : 0)) % 3 === 0) add(box(0.86, 0.06, 0.05), gap, off, 0.02, dz - s * 0.01, g, { cast: false });   // light-less gap under some
    }
    if (i < N0) { const pic = add(box(0.4, 0.3, 0.03), toon({ color: ['#7a9ac0', '#c08a5a', '#8ab07a'][i] }), 0, 1.6, HW - 0.01, g); }
    segs.push(g);
  }
  const end = new THREE.Group(); H.add(end);
  add(tbox(0.12, HH, HW * 2 + 0.24, 1), wall, 0.06, HH / 2, CZ, end);
  const sw = SETS.canvasPlane(ctx, 0.1, 0.15, 128, end, { lit: true }); sw.draw('p', plate); sw.mesh.position.set(-0.005, 1.25, 0.95); sw.mesh.rotation.y = -Math.PI / 2;
  const txt = SETS.canvasPlane(ctx, 0.5, 0.25, 512, end, { alpha: true, lit: true }); txt.draw('r', rule); txt.mesh.position.set(-0.006, 1.6, 0.9); txt.mesh.rotation.y = -Math.PI / 2;
  const bulbs = [0, 1, 2].map((i) => { const l = new THREE.PointLight('#ffe2b0', 0, 6, 1.4); l.position.set(X0 + SEG * i + 0.75, HH - 0.25, CZ); H.add(l); return l; });
  const shades = [0, 1, 2].map((i) => add(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff4d8' }), X0 + SEG * i + 0.75, HH - 0.1, CZ, H, { cast: false }));
  const torch = new THREE.SpotLight('#fff2d0', 0, 18, 0.42, 0.55, 1.2); ctx.world.add(torch); ctx.world.add(torch.target);
  const roomGlow = new THREE.PointLight('#ffb070', 0, 6, 1.5); roomGlow.position.set(...W0(0.6, 1.6, -0.5)); ctx.world.add(roomGlow);
  return { br, segs, end, bulbs, shades, torch, roomGlow };
};
export const update = (W, f, P) => {
  if (!P.br) return;
  P.br.state(W, f);
  const S = shotAt(f), e = E(f, S), n = Math.ceil((e - X0) / SEG - 1e-6);
  P.segs.forEach((g, i) => { g.visible = i < Math.max(n, N0); });
  P.end.position.set(e, 0, 0);
  P.bulbs.forEach((l) => (l.intensity = W.hall ? 1.4 : 0)); P.shades.forEach((m) => m.material.color.set(W.hall ? '#fff4d8' : '#3a3a3a'));
  const c = camAt(f); P.torch.intensity = W.torch; P.torch.position.set(c.pos[0] + 0.15, c.pos[1] - 0.25, c.pos[2] + 0.05); P.torch.target.position.set(...c.look);
  P.roomGlow.intensity = W.glow;
};
export const worldAt = (f) => {
  const S = shotAt(f), i = S.i, id = S.id;
  const W = { door: 0, beep: -1, lamp: 0, moon: 0.25, street: 0.3, headlights: 0, car: false, hall: true, torch: 0, glow: 0 };
  if (id === 'off' && f >= S.beat) { W.hall = false; W.torch = f >= S.beat + 8 ? 7 : 0; }
  if (i >= 5) { W.hall = false; W.torch = i >= 8 ? 3 : 7; }
  if (i >= 7) { W.door = -1.25; W.glow = 0.7; W.lamp = 0.2; }
  if (id === 'turn') W.torch = f > S.beat + 4 && (f % 9 < 2 || f % 23 < 3) ? 1.5 : 6;
  return W;
};

// ---------- the cast ----------
const KS = 0.62;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const you = (expr, o = {}, pos, extra = {}) => out.push(actor(T, YOU, { seed: 31, expr, blink: blinkAt(f, 31), ...o, who: 'you' }, pos, { s: KS, ...extra }));
  const other = (expr, o, y) => out.push(actor(T, YOU, { seed: 77, expr, ...o, who: 'other' }, [BEDHEAD[0], BEDHEAD[1] + y, BEDHEAD[2]], { s: KS, order: 2, tint: '#b4bed6' }));
  if (id === 'rule') you('nervous', { look: 0.8 }, W0(6.25, 0, 0.35));
  if (id === 'dad') { out.push(actor(T, 'dad', { seed: 12, expr: 'laugh', blink: blinkAt(f, 12), look: 0.3, R: 'point' }, W0(5.55, 0, 0.95), { s: 0.86 })); you('nervous', { look: -0.4 }, W0(6.3, 0, 0.35)); }
  if (id === 'off') you(f < S.beat ? 'stubborn' : 'wary', { look: 0.8, R: f < S.beat + 4 ? 'reach' : 'hang' }, W0(6.5, 0, 0.55));
  if (id === 'bed') other('sleep', { blink: 1 }, -0.33);
  if (id === 'sat') other(f < S.beat - 6 ? 'sleep' : 'creepy', { blink: 0, look: 0.6 }, lerp(-0.33, 0.06, smooth(ramp(f, S.a + 4, S.beat + 4))));
  if (id === 'turn') other('creepy', { blink: 0, look: 0.5, headTilt: 7 }, 0.06);
  return out;
};
export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [];
  if (id === 'off') { const d = f - S.beat; if (d >= 0 && d < 12) { const t = q(d / 12); out.push(fx('clk' + t, word('click', t, '#e8e8f0'), W0(6.85, 1.45, 0.85), 0.22)); } }
  if (id === 'turn') { const d = f - S.beat + 2; if (d >= 0 && d < 30) { const t = q(Math.max(0, d - 10) / 20); out.push(fx('mt' + t, word('MY TURN', t, '#e8e8f0'), W0(-0.75, 1.38, -1.4), 0.26)); } }
  return out;
};
