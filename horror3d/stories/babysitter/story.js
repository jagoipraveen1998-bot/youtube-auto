// "You Got The Babysitting Job. Follow The 6 Rules": Nora's bedroom at night (bedroom set), one rule per shot.
import * as TT from './toon.js';
import * as SETS from './sets.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const AT = [-40, 0, 0], W0 = (x, y, z) => [AT[0] + x, AT[1] + y, AT[2] + z];
const DOORWAY = W0(2.2, 0, 0.6), HALL = W0(2.62, 0, 0.6), NORA_BED = W0(-0.25, 0.5, -1.45), SIT = W0(0.75, 0, -0.55), SIT_WIN = W0(-1.2, 0, 0.35);
const WARD = W0(1.7, 1.0, -1.4), MON = W0(-1.85, 0.6, -1.52), PHOTO = W0(-0.6, 1.75, -2.06), WIN = W0(-2.3, 1.5, -0.2), OUTSIDE = W0(-2.72, -0.05, 0.15), TOYS = W0(1.25, 0.2, 1.35);

const IDS = ['hired', 'pay', 'mrs', 'photos', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'his', 'luck'];
const CAMS = {
  hired: [{ pos: W0(-0.9, 1.4, -0.5), look: W0(2.2, 1.1, 0.6), fov: 46 }, { pos: W0(-0.5, 1.35, -0.3), look: W0(2.2, 1.15, 0.6), fov: 40 }],
  pay: [{ pos: W0(0.9, 1.1, 0.4), look: W0(-0.25, 0.95, -1.45), fov: 40 }, { pos: W0(0.7, 1.05, 0.1), look: W0(-0.25, 0.98, -1.45), fov: 34 }],
  mrs: [{ pos: W0(0.2, 1.4, 0.05), look: W0(2.2, 1.4, 0.6), fov: 38 }, { pos: W0(0.8, 1.42, 0.25), look: W0(2.2, 1.44, 0.6), fov: 30 }],
  photos: [{ pos: W0(-0.45, 1.72, -0.85), look: PHOTO, fov: 40 }, { pos: W0(-0.55, 1.74, -1.15), look: PHOTO, fov: 40 }],
  r1: [{ pos: W0(1.0, 1.2, 0.7), look: W0(0.1, 0.9, -1.2), fov: 44 }, { pos: W0(0.8, 1.15, 0.4), look: W0(0.0, 0.92, -1.3), fov: 38 }],
  r2: [{ pos: W0(-0.2, 1.25, -0.9), look: WARD, fov: 42 }, { pos: W0(0.5, 1.15, -1.1), look: WARD, fov: 34 }],
  r3: [{ pos: W0(1.1, 1.0, 0.3), look: W0(-0.25, 0.95, -1.45), fov: 38 }, { pos: W0(0.9, 0.98, 0.1), look: W0(-0.25, 0.97, -1.45), fov: 34 }],
  r4: [{ pos: W0(-0.5, 0.7, 0.1), look: TOYS, fov: 42 }, { pos: W0(-0.2, 0.6, 0.35), look: TOYS, fov: 36 }],
  r5: [{ pos: W0(-2.05, 0.95, -0.45), look: MON, fov: 36 }, { pos: W0(-2.0, 0.85, -0.8), look: MON, fov: 30 }],
  r6: [{ pos: W0(-0.4, 1.5, 0.6), look: W0(-2.3, 1.5, -0.2), fov: 44 }, { pos: W0(-0.8, 1.5, 0.3), look: W0(-2.3, 1.5, -0.2), fov: 40 }],
  his: [{ pos: W0(-0.6, 1.45, 0.5), look: W0(-2.3, 1.3, 0.15), fov: 40 }, { pos: W0(-1.0, 1.4, 0.35), look: W0(-2.3, 1.3, 0.15), fov: 32 }],
  luck: [{ pos: W0(-1.0, 1.3, -0.3), look: W0(2.3, 1.05, 0.6), fov: 42 }, { pos: W0(0.6, 1.15, 0.3), look: W0(2.5, 0.95, 0.6), fov: 26 }],
};
const UNDER = [{ pos: W0(-0.2, 0.35, 0.6), look: W0(-0.5, 0.25, -1.07), fov: 42 }, { pos: W0(-0.35, 0.22, 0.05), look: W0(-0.5, 0.18, -1.07), fov: 34 }];
const HALLCAM = [{ pos: W0(-0.4, 0.8, 0.3), look: W0(2.4, 1.0, 0.6), fov: 46 }, { pos: W0(0.2, 0.9, 0.4), look: W0(2.5, 1.0, 0.6), fov: 38 }];

const LIGHTS = {
  night: { ...MOODS.night, hemi: 0.78, fogNear: 9, fogFar: 40, vig: 0.52 },
  dread: { ...MOODS.dread, hemi: 0.6, fogNear: 8, fogFar: 36, vig: 0.72 },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.i >= 5 ? 'dread' : 'night'),
  kicks: ['mrs', 'his'],
  focus: (S) => ({ hired: W0(2.2, 1.15, 0.6), pay: W0(-0.25, 0.98, -1.45), mrs: W0(2.2, 1.46, 0.6), photos: PHOTO, r1: W0(0.0, 0.92, -1.3), r2: WARD, r3: W0(-0.25, 0.97, -1.45), r4: TOYS, r5: MON,
    r6: W0(-2.3, 1.45, -0.2), his: W0(-2.5, 1.3, 0.15), luck: W0(2.5, 1.0, 0.6) }[S.id]),
  shadowAt: () => W0(0.2, 0.6, -0.4),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor } = K;
export { LIGHTS };
const alt = (f) => { const S = shotAt(f); return f >= S.beat && (S.id === 'r3' ? UNDER : S.id === 'r4' ? HALLCAM : null); };
export const camAt = (f) => {
  const A = alt(f); if (!A) return K.camAt(f);
  const S = shotAt(f), t = smooth(ramp(f, S.beat, S.b));
  return { pos: lerp3(A[0].pos, A[1].pos, t), look: lerp3(A[0].look, A[1].look, t), fov: lerp(A[0].fov, A[1].fov, t), roll: 0, flash: 0, shadowAt: W0(0.2, 0.6, -0.4) };
};
export const dofAt = (f) => { const A = alt(f); if (!A) return K.dofAt(f); const C = camAt(f); return { focus: Math.hypot(C.pos[0] - C.look[0], C.pos[1] - C.look[1], C.pos[2] - C.look[2]), cinf: 6 }; };

// ---------- the set: the bedroom plus this story's props ----------
const person = (g, who, x, y, s, o = {}) => { g.save(); g.translate(x, y); g.scale(s, s); TT.romanFront(new TT.Pen(g), who, { seed: 9, expr: 'smile', blink: 0, look: 0, ...o }); g.restore(); };
export const build = (ctx) => {
  const { THREE, add, box, toon } = ctx;
  SETS.houseLightsOff(ctx);
  const br = SETS.bedroom(ctx, { at: AT }), G = br.G;
  br.photo.mesh.material = new THREE.MeshBasicMaterial({ map: br.photo.tex, color: '#b8b4c4' }); br.photo.mesh.receiveShadow = false;
  br.photo.draw('family', (g, w, h) => { g.fillStyle = '#cfe0ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8a888'; g.fillRect(0, h * 0.72, w, h * 0.28);          // Mum, Dad, Nora. Nobody else.
    const s = w * 0.42 / 600; person(g, 'dad', w * 0.02, h * 0.9 - 975 * s, s); person(g, 'marlow', w * 0.56, h * 0.9 - 975 * s, s);
    const k = s * 0.62; person(g, 'nora', w * 0.36, h * 0.9 - 975 * k, k); });
  const wood = toon({ color: '#a87a52' }), woodD = toon({ color: '#8a6040' });
  const wdoors = [-1, 1].map((s) => { const h = new THREE.Group(); h.position.set(1.685, 0, -1.4 + s * 0.55); G.add(h);                                      // wardrobe doors that tremble
    add(box(0.03, 1.8, 0.53), wood, 0, 0.95, -s * 0.27, h); add(box(0.02, 1.4, 0.36), woodD, -0.016, 0.95, -s * 0.27, h); add(new THREE.SphereGeometry(0.025, 8, 6), toon({ color: '#c8a23a' }), -0.03, 0.95, -s * 0.5, h); return { h, s }; });
  const toys = [];                                                                                                                                         // four toys on the floor, each with a face
  const toy = (x, z, make) => { const t = new THREE.Group(); t.position.set(x, 0, z); G.add(t); make(t); const e = new THREE.MeshBasicMaterial({ color: '#0a0a0e' });
    for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.018, 6, 5), e, s * 0.04, t.userData.eye, t.userData.ez, t, { cast: false }); toys.push(t); };
  toy(0.95, 1.45, (t) => { const m = toon({ color: '#9a6a3e' }); add(new THREE.SphereGeometry(0.13, 12, 10), m, 0, 0.13, 0, t); add(new THREE.SphereGeometry(0.1, 12, 10), m, 0, 0.32, 0, t);
    for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.04, 8, 6), m, s * 0.08, 0.41, 0, t); t.userData.eye = 0.34; t.userData.ez = 0.09; });                    // teddy
  toy(1.3, 1.25, (t) => { const m = toon({ color: '#5a8ac8' }); add(box(0.18, 0.2, 0.12), m, 0, 0.14, 0, t); add(box(0.14, 0.12, 0.12), toon({ color: '#c8ccd6' }), 0, 0.31, 0, t);
    add(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 5), m, 0, 0.41, 0, t); t.userData.eye = 0.32; t.userData.ez = 0.062; });                                    // robot
  toy(1.6, 1.5, (t) => { add(new THREE.ConeGeometry(0.11, 0.26, 12), toon({ color: '#e0a03a' }), 0, 0.13, 0, t); add(new THREE.SphereGeometry(0.075, 12, 10), toon({ color: '#f2d2b6' }), 0, 0.31, 0, t);
    add(new THREE.SphereGeometry(0.08, 10, 8), toon({ color: '#5a3a1e' }), 0, 0.335, -0.02, t); t.userData.eye = 0.31; t.userData.ez = 0.07; });                  // doll
  toy(1.15, 1.75, (t) => { const m = toon({ color: '#f2d23a' }); add(new THREE.SphereGeometry(0.1, 12, 10), m, 0, 0.1, 0, t); add(new THREE.SphereGeometry(0.065, 10, 8), m, 0, 0.22, 0.04, t);
    add(new THREE.ConeGeometry(0.025, 0.06, 6), toon({ color: '#e07a2a' }), 0, 0.21, 0.11, t).rotation.x = Math.PI / 2; t.userData.eye = 0.24; t.userData.ez = 0.095; });   // duck
  const mon = new THREE.Group(); mon.position.set(-1.85, 0.5, -1.52); mon.rotation.y = 0.15; G.add(mon);                                                     // the baby monitor on the bedside table
  add(box(0.11, 0.16, 0.05), toon({ color: '#e8e6e0' }), 0, 0.08, 0, mon); add(new THREE.CylinderGeometry(0.005, 0.005, 0.12, 5), toon({ color: '#2a2a2e' }), 0.04, 0.22, 0, mon);
  const led = new THREE.MeshBasicMaterial({ color: '#143a1a' }); add(box(0.03, 0.03, 0.01), led, 0, 0.12, 0.027, mon, { cast: false });
  for (let i = 0; i < 4; i++) add(box(0.07, 0.006, 0.01), toon({ color: '#b0aea8' }), 0, 0.04 + i * 0.016, 0.027, mon, { cast: false });
  const hands = SETS.canvasPlane(ctx, 1.3, 1.1, 512, G, { alpha: true }); hands.mesh.rotation.y = Math.PI / 2; hands.mesh.position.set(-2.27, 1.5, -0.2); hands.mesh.material.depthWrite = false;
  return { br, wdoors, toys, led, hands };
};
const print = (g, x, y, r, a) => { g.save(); g.translate(x, y); g.rotate(r); g.scale(0.62, 0.62); g.fillStyle = `rgba(214,226,246,${a})`;      // a small child's hand
  g.beginPath(); g.roundRect(-17, -14, 34, 34, 11); g.fill();
  for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(-17 + i * 9, -44 - (i === 1 || i === 2 ? 6 : 0), 7, 34, 3.5); g.fill(); }
  g.save(); g.translate(-20, 2); g.rotate(-0.9); g.beginPath(); g.roundRect(-4, -22, 8, 24, 4); g.fill(); g.restore(); g.restore(); };
export const update = (W, f, P) => {
  if (!P.br) return;
  P.br.state(W, f);
  P.wdoors.forEach((d) => { d.h.rotation.y = W.tap ? d.s * Math.max(0, Math.sin(f * 1.1)) * Math.max(0, Math.sin(f * 0.19)) * 0.06 : 0; });
  P.toys.forEach((t, i) => { const base = Math.atan2(-1.6, -1.2), k = smooth(Math.min(1, Math.max(0, (W.toysTurn ?? 0) * 1.6 - i * 0.2))); t.rotation.y = base + Math.PI * k; });
  P.led.color.set(W.monitor ? (f % 20 < 12 ? '#40ff60' : '#1a6a2a') : '#143a1a');
  const n = W.hands ?? 0;                                   // how many handprints are on the glass
  P.hands.mesh.visible = n > 0;
  P.hands.draw('h' + n, (g, w, h) => { [[0.3, 0.62, -0.3], [0.52, 0.5, 0.2], [0.7, 0.66, 0.4], [0.42, 0.3, -0.1], [0.62, 0.26, 0.25]].slice(0, n).forEach(([x, y, r]) => print(g, w * x, h * y, r, 0.5)); });
};
export const worldAt = (f) => {
  const S = shotAt(f), id = S.id, i = S.i;
  const W = { door: 0, beep: -1, unlocked: false, lamp: i >= 5 ? 0.55 : 1.0, moon: 0.9, street: 1.0, headlights: 0, car: false, tap: false, toysTurn: 0, monitor: false, hands: 0, motes: false, gap: false, feet: false, wind: 0 };
  if (id === 'hired' || id === 'mrs') W.door = 1;
  if (id === 'r2') { W.tap = f >= S.beat - 20; W.lamp = 1.5; }
  if (id === 'r4') { W.lamp = 1.1; W.toysTurn = smooth(ramp(f, S.a + 20, S.beat - 4)); if (f >= S.beat) W.door = smooth(ramp(f, S.beat, S.beat + 30)); }
  if (i > 7) W.toysTurn = 1;
  if (id === 'r5') W.monitor = true;
  if (id === 'r6') W.hands = Math.min(5, 1 + Math.floor(ramp(f, S.a, S.beat) * 4));
  if (id === 'his') W.hands = 5;
  if (id === 'luck') { W.door = smooth(ramp(f, S.a, S.beat)) * 0.9; W.lamp = 0.4; }
  return W;
};

// ---------- the cast ----------
const SS = 0.84, NS = 0.5;
const eyes = (open = 1) => (p) => { const g = p.g; g.save(); g.globalCompositeOperation = 'lighter';
  for (const x of [272, 328]) { const gr = g.createRadialGradient(x, 262, 0, x, 262, 34); gr.addColorStop(0, 'rgba(255,246,214,0.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 34, 228, 68, 68);
    g.fillStyle = '#fffbe8'; g.beginPath(); g.ellipse(x, 262, 9, 9 * open, 0, 0, 7); g.fill(); } g.restore(); };
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const sitter = (expr, o = {}, pos = SIT) => out.push(actor(T, 'sitter', { seed: 17, expr, blink: blinkAt(f, 17), ...o }, pos, { s: SS }));
  const nora = (expr, o = {}, pos = NORA_BED) => out.push(actor(T, 'nora', { seed: 5, expr, blink: blinkAt(f, 5), ...o }, pos, { s: NS, blob: false }));
  const him = (pos, s = 0.5, alpha = 0.92) => out.push(actor(T, 'kid', { seed: 9, expr: 'neutral', blink: 0 }, pos, { s, tint: '#04040a', alpha, shadow: false, blob: false, order: 1 }));
  if (id === 'hired') sitter('smile', { look: -0.5 }, lerp3(HALL, W0(1.7, 0, 0.5), smooth(ramp(f, S.a, S.b))));
  if (id === 'pay') nora('smile', { R: 'wave' });
  if (id === 'mrs') out.push(actor(T, 'marlow', { seed: 33, expr: f < S.beat ? 'smile' : 'creepy', blink: 0, look: -0.4, headTilt: f < S.beat ? 0 : 5 }, DOORWAY, { s: 0.88, tint: '#d8d0e0' }));
  if (id === 'r1') { nora('grin', { look: 0.5 }); sitter('nervous', { L: 'posters', R: 'posters', look: -0.5 }, W0(0.55, 0, -0.9)); }
  if (id === 'r3' && f < S.beat) nora('smile', { look: -0.9, headTilt: 4 });
  if (id === 'his' && f >= S.beat - 6) him(lerp3(W0(-2.72, -0.7, 0.15), OUTSIDE, smooth(ramp(f, S.beat - 6, S.beat + 14))), 0.7);
  if (id === 'luck') { sitter(f < S.beat ? 'nervous' : 'scared', { blink: 0, look: f < S.beat ? 0 : 0.7 }, W0(0.9, 0, 0.1)); if (f >= S.beat - 10) him(HALL, 0.52, 0.95 * smooth(ramp(f, S.beat - 10, S.beat + 6))); }
  if (id === 'r4' && f >= S.beat + 20) him(W0(2.9, 0, 0.6), 0.52, 0.6 * smooth(ramp(f, S.beat + 20, S.b)));
  return out;
};
export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [];
  const pop = (key, txt, pos, s, col, d0, len = 18) => { const d = f - d0; if (d >= 0 && d < len) { const t = q(d / len); out.push(fx(key + t, word(txt, t, col), pos, s)); } };
  if (id === 'r1') pop('nine', '9:00', W0(-0.6, 1.5, -1.6), 0.5, '#9fe0ff', S.a + 8, 40);
  if (id === 'r2' && f >= S.beat - 20) { const d = (f - S.beat + 20) % 26; if (d < 14) { const t = q(d / 14); out.push(fx('tap' + t, word('TAP', t, '#c8d0ff'), W0(1.55, 1.25, -1.2), 0.3)); } }
  if (id === 'r3' && f >= S.beat) { const blink = (f % 70) < 3; if (!blink) out.push(fx('under', (p) => { const g = p.g; g.save(); g.globalCompositeOperation = 'lighter';
      for (const x of [255, 345]) { const gr = g.createRadialGradient(x, 900, 0, x, 900, 60); gr.addColorStop(0, '#fff6c8'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 60, 840, 120, 120);
        g.fillStyle = '#fffbe8'; g.beginPath(); g.ellipse(x, 900, 13, 9, 0, 0, 7); g.fill(); } g.restore(); }, W0(-0.45, 0.0, -1.06), 0.32)); }
  if (id === 'r4') pop('1111', '11:11', W0(1.25, 0.9, 1.4), 0.42, '#9fe0ff', S.a + 6, 40);
  if (id === 'r5') { const d = (f - S.a) % 40; if (d < 30) { const t = q(d / 30, 1); out.push(fx('note' + t, word('♪', t * 0.8, '#bfe8c8'), W0(-1.72, 0.55 + t * 0.2, -1.45), 0.2)); } }
  if (id === 'his' && f >= S.beat + 8) out.push(fx('eyeW' + ((f % 90) > 86), (f % 90) > 86 ? () => {} : eyes(1), [OUTSIDE[0] + 0.04, OUTSIDE[1], OUTSIDE[2]], 0.7));
  if (id === 'luck' && f >= S.beat) out.push(fx('eyeH' + ((f % 90) > 86), (f % 90) > 86 ? () => {} : eyes(1), [HALL[0] - 0.04, HALL[1], HALL[2]], 0.52));
  return out;
};
