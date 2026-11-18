// The Thirteenth Bell, Episode 1 (horizontal 16:9). Greywick, 1888: a foggy harbour, Fish Lane's cottages, the
// church tower on the hill (one outdoor set, reused all season), the belfry, the Bramwells' kitchen and the
// children's room. Style: the camera glides between shots, hard cuts only on the scares; warm light while the
// story is set up, deep night blue once the thirteenth bell rings; the last image (wet footprints coming down
// the stairs) is held.
import { OUTFITS } from './toon.js';
import * as SETS from './sets.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

// vertical 9:16 Shorts (the default size)
const at = (o) => (x, y, z) => [o[0] + x, o[1] + y, o[2] + z];
const GO = [300, 0, 0], O = at(GO);            // outdoors: harbour, Fish Lane, tower
const BO = [360, 0, 0], Bf = at(BO);           // belfry
const CO = [380, 0, 0], C = at(CO);            // the Bramwells' kitchen
const RO = [400, 0, 0], R = at(RO);            // Tom and Annie's room

const TOM = { ...OUTFITS.kid, tunic: '#5a6a7a', hair: '#4a2e1c' }, ANNIE = { ...OUTFITS.kid, tunic: '#b8606e', hair: '#8a5a2a' };
const MARY = { ...OUTFITS.mum, tunic: '#4f5a7a', hair: '#5a3424' }, DROWNED = { ...OUTFITS.kid, tunic: '#2a4048' };
const HALE_DOOR = O(3.6, 0, 9.9), BRAM_DOOR = O(0, 0, 9.9), WATCH = O(0.15, 0.03, 9.35), STEPS = O(6.2, 0, 0.2);

const IDS = ['hook1', 'hook2', 'town', 'tom', 'ringer', 'silas', 'marks', 'answered', 'salt', 'rule', 'count', 'twelve', 'thirteen', 'voices', 'peter',
  'bolt', 'boy', 'morning', 'prints', 'watch', 'stopped', 'vigil', 'count2', 'knock', 'annie', 'whistle', 'dad', 'silence', 'inside', 'stairs'];
const CAMS = {
  hook1: [{ pos: O(-3, 1.6, -2.5), look: O(-1, 1.6, 4), fov: 40 }, { pos: O(-2, 3.0, -1.5), look: O(5, 10, 24), fov: 36 }],
  hook2: [{ pos: O(-1, 4.5, 2), look: O(5, 12, 24), fov: 34 }, { pos: O(2, 8, 10), look: O(5, 14, 24), fov: 30 }],
  town: [{ pos: O(-10, 3.2, -1.5), look: O(0, 1.2, 4), fov: 40 }, { pos: O(-7, 2.6, -0.8), look: O(1, 1.0, 3), fov: 38 }],
  tom: [{ pos: O(4.2, 1.4, 3.2), look: O(1, 0.6, 0.3), fov: 36 }, { pos: O(3.0, 1.2, 2.2), look: O(1, 0.6, 0.3), fov: 32 }],
  ringer: [{ pos: Bf(1.3, 1.5, 1.4), look: Bf(-0.4, 1.4, -0.2), fov: 50 }, { pos: Bf(1.1, 1.45, 1.2), look: Bf(-0.3, 1.5, -0.2), fov: 46 }],
  silas: [{ pos: Bf(1.2, 1.45, 1.4), look: Bf(-0.15, 1.35, -0.1), fov: 38 }, { pos: Bf(1.05, 1.45, 1.25), look: Bf(-0.15, 1.4, -0.1), fov: 36 }],
  marks: [{ pos: Bf(0.3, 1.5, -0.2), look: Bf(0, 1.5, -1.68), fov: 44 }, { pos: Bf(0.25, 1.45, -0.8), look: Bf(0.35, 1.4, -1.68), fov: 36 }],
  answered: [{ pos: Bf(1.3, 1.35, 1.3), look: Bf(-0.15, 1.35, -0.1), fov: 36 }, { pos: Bf(1.15, 1.35, 1.15), look: Bf(-0.15, 1.4, -0.1), fov: 34 }],
  salt: [{ pos: C(1.9, 1.6, 1.8), look: C(0.2, 0.8, -1.2), fov: 50 }, { pos: C(1.6, 1.4, 1.2), look: C(0.4, 0.6, -1.6), fov: 46 }],
  rule: [{ pos: C(2.0, 1.25, 0.9), look: C(0.6, 1.0, -0.8), fov: 40 }, { pos: C(1.7, 1.2, 0.6), look: C(0.6, 1.05, -0.8), fov: 36 }],
  count: [{ pos: R(1.4, 1.4, 1.2), look: R(-0.6, 0.8, -1.0), fov: 46 }, { pos: R(1.0, 1.3, 0.8), look: R(-0.7, 0.8, -1.0), fov: 42 }],
  twelve: [{ pos: R(0.2, 1.0, -0.1), look: R(-0.75, 0.85, -1.1), fov: 34 }, { pos: R(0.0, 0.98, -0.3), look: R(-0.75, 0.85, -1.1), fov: 30 }],
  thirteen: [{ pos: O(2, 10.5, 14), look: O(5, 13.0, 24), fov: 30 }, { pos: O(2.8, 11.5, 16), look: O(5, 13.0, 24), fov: 26 }],
  voices: [{ pos: O(-5.5, 1.9, 6.4), look: O(-2.5, 1.1, 9.4), fov: 40 }, { pos: O(0.5, 1.8, 6.6), look: O(3.4, 1.1, 9.4), fov: 38 }],
  peter: [{ pos: O(5.8, 1.5, 6.6), look: O(3.6, 1.1, 9.4), fov: 36 }, { pos: O(5.0, 1.4, 7.4), look: O(3.6, 1.1, 9.5), fov: 32 }],
  bolt: [{ pos: O(1.4, 3.3, 8.6), look: O(3.6, 1.0, 9.6), fov: 38 }, { pos: O(1.6, 3.2, 8.8), look: O(3.6, 1.0, 9.7), fov: 34 }],
  boy: [{ pos: O(1.6, 3.2, 8.8), look: O(3.6, 1.0, 9.7), fov: 34 }, { pos: O(1.8, 3.1, 9.0), look: O(3.6, 1.0, 9.7), fov: 30 }],
  morning: [{ pos: O(6.4, 1.7, 5.4), look: O(3.6, 1.0, 9.7), fov: 40 }, { pos: O(5.6, 1.6, 6.4), look: O(3.6, 1.0, 9.8), fov: 36 }],
  prints: [{ pos: O(2.6, 4.5, 8.2), look: O(4.2, 0, 6), fov: 46 }, { pos: O(4.2, 3.6, 4.6), look: O(6.2, 0, 0.4), fov: 42 }],
  watch: [{ pos: O(-1.2, 1.5, 7.6), look: O(0.3, 0.4, 9.2), fov: 42 }, { pos: O(-0.8, 1.2, 8.1), look: O(0.25, 0.3, 9.2), fov: 38 }],
  stopped: [{ pos: O(0.25, 0.55, 8.95), look: WATCH, fov: 30 }, { pos: O(0.2, 0.42, 9.1), look: WATCH, fov: 26 }],
  vigil: [{ pos: C(0.3, 1.55, 2.0), look: C(0, 0.9, -0.4), fov: 48 }, { pos: C(0.25, 1.45, 1.6), look: C(0, 0.95, -0.4), fov: 44 }],
  count2: [{ pos: C(0.2, 1.1, 1.1), look: C(-0.1, 0.95, -0.5), fov: 40 }, { pos: C(0.15, 1.05, 0.85), look: C(-0.1, 0.95, -0.5), fov: 36 }],
  knock: [{ pos: C(1.3, 1.1, 0.4), look: C(0.6, 0.8, -2), fov: 42 }, { pos: C(1.0, 0.9, -0.4), look: C(0.6, 0.5, -2), fov: 38 }],
  annie: [{ pos: C(0.1, 1.35, 1.8), look: C(-0.2, 0.95, -0.3), fov: 46 }, { pos: C(0.05, 1.3, 1.5), look: C(-0.25, 0.95, -0.3), fov: 42 }],
  whistle: [{ pos: C(0.9, 1.0, -0.6), look: C(0.6, 0.6, -2), fov: 38 }, { pos: C(0.75, 0.85, -1.1), look: C(0.6, 0.4, -2), fov: 34 }],
  dad: [{ pos: C(1.3, 1.0, 1.3), look: C(0.8, 0.9, 0.35), fov: 32 }, { pos: C(1.2, 0.98, 1.15), look: C(0.8, 0.9, 0.35), fov: 28 }],
  silence: [{ pos: C(0.3, 1.6, 2.05), look: C(-0.1, 0.9, -0.6), fov: 50 }, { pos: C(0.25, 1.55, 1.95), look: C(-0.3, 1.0, -0.6), fov: 48 }],
  inside: [{ pos: C(0.9, 1.4, 1.9), look: C(-2.0, 1.6, -0.6), fov: 46 }, { pos: C(0.7, 1.35, 1.7), look: C(-2.0, 1.7, -0.7), fov: 42 }],
  stairs: [{ pos: C(-0.85, 2.45, 2.05), look: C(-2.1, 1.0, 0.0), fov: 50 }, { pos: C(-0.95, 2.3, 1.95), look: C(-2.1, 0.8, 0.5), fov: 44 }],
};
const LIGHTS = {
  night: { ...MOODS.night, hemi: 0.6, sky: '#3a5aa8', ground: '#101830', fog: '#22325a', fogNear: 3, fogFar: 26, gain: '#c8d8ff', lift: '#0a1028', vig: 0.55, sat: 1.15 },
  day: { ...MOODS.morning, hemi: 1.0, sky: '#c8ccd0', ground: '#4a4438', fog: '#c0c4c8', fogNear: 10, fogFar: 70, gain: '#fff4e8', vig: 0.3, sat: 1.05 },
  dusk: { ...MOODS.evening, hemi: 0.8, fog: '#a8786a', fogNear: 6, fogFar: 40, vig: 0.4, sat: 1.15 },
  lamp: { ...MOODS.night, hemi: 0.42, sky: '#5a4838', ground: '#1a120c', fog: '#140c08', fogNear: 4, fogFar: 18, gain: '#ffe4c4', lift: '#0e0810', vig: 0.5, sat: 1.15 },
  blue: { ...MOODS.night, hemi: 0.5, sky: '#3a58c0', ground: '#101a40', fog: '#0a1238', fogNear: 4, fogFar: 22, gain: '#c4d4ff', lift: '#081030', vig: 0.66, sat: 1.15 },
};
const FOCUS = (S) => ({ hook1: O(-1, 1.6, 4), hook2: O(5, 13, 24), town: O(0, 1, 2), tom: O(1, 0.6, 0.3), ringer: Bf(-0.3, 1.4, -0.1), silas: Bf(-0.15, 1.45, -0.1), marks: Bf(0.2, 1.45, -1.68),
    answered: Bf(-0.15, 1.45, -0.1), salt: C(0.5, 0.6, -1.5), rule: C(0.6, 1.0, -0.8), count: R(-0.7, 0.8, -1.0), twelve: R(-0.75, 0.85, -1.1), thirteen: O(5, 13.6, 24),
    voices: O(1, 1.2, 9.5), peter: O(3.6, 1.1, 9.4), bolt: O(3.6, 1.0, 9.7), boy: O(3.6, 1.0, 9.7), morning: O(3.6, 1.0, 9.8), prints: O(5, 0, 3), watch: WATCH, stopped: WATCH,
    vigil: C(0, 0.95, -0.2), count2: C(0, 0.95, -0.1), knock: C(0.6, 0.6, -2), annie: C(0.1, 0.95, -0.3), whistle: C(0.6, 0.5, -2), dad: C(0.55, 0.92, 0.05),
    silence: C(-0.3, 0.9, -0.6), inside: C(-2.0, 2.2, -1.2), stairs: C(-2.0, 1.4, -0.4) }[S.id]);
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S, f) => {
    const id = S.id;
    if (['hook1', 'hook2', 'voices', 'peter', 'bolt', 'boy', 'thirteen'].includes(id)) return 'night';
    if (['town', 'tom', 'morning', 'prints', 'watch', 'stopped'].includes(id)) return 'day';
    if (['ringer', 'silas', 'marks', 'answered'].includes(id)) return 'dusk';
    if (['salt', 'rule', 'vigil'].includes(id) || (id === 'count2' && f < S.beat + 10)) return 'lamp';
    return 'blue';
  },
  tweak: (L, S) => { if (S.id === 'stairs' || S.id === 'inside') L.vig = 0.74; },
  kicks: ['thirteen', 'knock', 'inside'],
  focus: (S) => FOCUS(S),
  shadowAt: (S) => (S.i < 4 || (S.i >= 12 && S.i <= 20) ? O(2, 1, 6) : S.i < 8 ? Bf(0, 1, 0) : S.i < 10 || S.i > 20 ? C(0, 1, 0) : R(0, 1, 0)),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, dofAt } = K;
export { LIGHTS };
const CUTS = new Set(['town', 'ringer', 'salt', 'count', 'thirteen', 'voices', 'morning', 'vigil', 'knock', 'inside']), GLIDE = 24;
const mix = (a, b, t) => ({ ...b, pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t) });
// Vertical framing: the cameras were set for 16:9, so in 9:16 each shot turns to centre its subject (the focus
// point) and widens a little, so faces and props are not cut off at the sides.
const SUBJ = (S) => FOCUS(S);
const VERT = { pull: 0.8, wide: 1.28 };
const NEAR = { watch: 0.5 };                     // shots whose subject is small: move the camera closer as well
const vert = (c, S) => { const p = SUBJ(S); if (!p) return c; const look = lerp3(c.look, p, VERT.pull), pos = NEAR[S.id] ? lerp3(c.pos, p, NEAR[S.id]) : c.pos; return { ...c, pos, look, fov: Math.min(75, c.fov * VERT.wide) }; };
const cam = (f) => vert(K.camAt(f), shotAt(f));
export const camAt = (f) => { const S = shotAt(f), c = cam(f); if (S.i === 0 || CUTS.has(S.id) || f - S.a >= GLIDE) return c; return mix(cam(S.a - 1), c, smooth((f - S.a) / GLIDE)); };

// ---------- canvases ----------
const tally = (g, w, h) => { const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#8a8278'); s.addColorStop(1, '#6e665e'); g.fillStyle = s; g.fillRect(0, 0, w, h);
  g.lineCap = 'round'; let n = 0;
  for (let r = 0; r < 7; r++) for (let c = 0; c < 9; c++) { const x0 = 30 + c * 108, y0 = 30 + r * 66;
    for (let k = 0; k < 4; k++) { g.strokeStyle = '#3a342e'; g.lineWidth = 6; g.beginPath(); g.moveTo(x0 + k * 16, y0); g.lineTo(x0 + k * 16 + 2, y0 + 44); g.stroke(); }
    g.beginPath(); g.moveTo(x0 - 6, y0 + 36); g.lineTo(x0 + 62, y0 + 8); g.stroke(); n++; }
  g.strokeStyle = '#d8d0c4'; g.lineWidth = 7; g.beginPath(); g.moveTo(30 + 9 * 108 - 40, 30 + 6 * 66 + 8); g.lineTo(30 + 9 * 108 - 38, 30 + 6 * 66 + 52); g.stroke();   // the fresh one
  g.fillStyle = 'rgba(230,224,214,0.6)'; for (let k = 0; k < 18; k++) g.fillRect(30 + 9 * 108 - 50 + (k * 7) % 26, 30 + 6 * 66 + 56 + (k * 3) % 10, 3, 3); };
const watchFace = (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#c8a040'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.48, 0, 7); g.fill();
  g.fillStyle = '#f2ead8'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.4, 0, 7); g.fill(); g.strokeStyle = '#2a2018'; g.lineWidth = 6;
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.beginPath(); g.moveTo(w / 2 + Math.sin(a) * w * 0.34, h / 2 - Math.cos(a) * w * 0.34); g.lineTo(w / 2 + Math.sin(a) * w * 0.38, h / 2 - Math.cos(a) * w * 0.38); g.stroke(); }
  const hand = (a, l, lw) => { g.lineWidth = lw; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.sin(a) * l, h / 2 - Math.cos(a) * l); g.stroke(); };
  hand((12 + 13 / 60) / 12 * Math.PI * 2, w * 0.2, 10); hand(13 / 60 * Math.PI * 2, w * 0.32, 6);
  g.fillStyle = 'rgba(160,200,230,0.35)'; for (let k = 0; k < 9; k++) { g.beginPath(); g.ellipse(w * (0.3 + (k * 37) % 40 / 100), h * (0.3 + (k * 53) % 45 / 100), 8, 12, 0, 0, 7); g.fill(); } };

// ---------- sets ----------
export const build = (ctx) => {
  const { THREE, add, box, tbox, toon, texM, P } = ctx;
  if (SETS.houseLightsOff) SETS.houseLightsOff(ctx);
  const stone = texM(P.stone(41, 30, 10, 58), 3, 1.5, '#b8b0a4'), cobble = texM(P.stone(42, 34, 8, 52, 64, 64), 8, 6, '#9a948a');
  const wood = texM(P.planks(43), 1, 1, '#8a6040'), roofM = texM(P.roof(44), 3, 2, '#6a4a40'), plaster = texM(P.plaster(45, 38), 2, 1, '#e4dccc');
  const dark = new THREE.MeshBasicMaterial({ color: '#0c1018' }), lit = new THREE.MeshBasicMaterial({ color: '#ffd28a' });
  // ---- outdoors ----
  const G = new THREE.Group(); G.position.set(...GO); ctx.world.add(G);
  add(new THREE.PlaneGeometry(160, 70), toon({ color: '#2a4a54' }), 0, -0.9, -36, G, { cast: false }).rotation.x = -Math.PI / 2;
  add(tbox(34, 1.2, 2, 1), stone, 0, -0.4, -1, G);                                                   // harbour wall
  add(tbox(44, 0.2, 40, 1), cobble, 0, -0.1, 20, G, { cast: false });                                 // quay, lane, hill
  for (let k = 0; k < 5; k++) add(box(1.4, 0.2, 0.5), stone, 6.2, -0.15 - k * 0.18, -0.3 - k * 0.45, G);   // harbour steps
  const boats = [[-6, -5, 0.3], [-1.5, -7.5, -0.4], [3.5, -5.5, 0.2], [9, -8, 0.6]].map(([x, z, r], i) => {
    const b = new THREE.Group(); b.position.set(x, -0.85, z); b.rotation.y = r; G.add(b);
    add(box(1.4, 0.55, 4.2), toon({ color: ['#6a3a2a', '#3a4a5a', '#5a4a2a', '#4a2a2a'][i] }), 0, 0.2, 0, b); add(box(1.2, 0.08, 3.9), wood, 0, 0.5, 0, b);
    add(new THREE.CylinderGeometry(0.05, 0.06, 4, 8), wood, 0, 2.4, 0.4, b); return b; });
  const lamps = [-10, -3, 4, 11].map((x) => { add(new THREE.CylinderGeometry(0.06, 0.08, 3, 8), toon({ color: '#2a2a30' }), x, 1.5, 1.0, G);
    const l = add(box(0.3, 0.38, 0.3), lit.clone(), x, 3.1, 1.0, G, { cast: false }); return l; });
  const lampLights = [-10, -3, 4, 11].map((x) => { const l = new THREE.PointLight('#ffc070', 0, 12, 1.3); l.position.set(x, 3.0, 1.2); G.add(l); return l; });
  for (const [x, z] of [[-1.5, 1.4], [0.4, 1.8], [-8, 1.6]]) { const n = add(new THREE.SphereGeometry(0.55, 12, 8), toon({ color: '#7a6a48' }), x, 0.12, z, G); n.scale.y = 0.35; }
  for (const [x, z] of [[2.2, 1.6], [2.9, 1.7], [-12, 2]]) add(box(0.6, 0.5, 0.6), wood, x, 0.25, z, G);
  // Fish Lane: a row of cottages facing the harbour (front at z = 10)
  const doors = {};
  for (let k = -4; k <= 4; k++) {
    const x = k * 3.6, cg = new THREE.Group(); cg.position.set(x, 0, 12); G.add(cg);
    add(tbox(3.5, 4.4, 4, 1), k % 2 ? plaster : stone, 0, 2.2, 0, cg);
    const rf = add(new THREE.CylinderGeometry(0.01, 2.6, 1.8, 4, 1), roofM, 0, 5.3, 0, cg); rf.rotation.y = Math.PI / 4; rf.scale.set(1.0, 1, 1.1);
    add(box(0.5, 1.2, 0.5), stone, 1.0, 6.2, 0.4, cg);
    const dg = new THREE.Group(); dg.position.set(-0.45, 0, -2.02); cg.add(dg);
    add(box(0.9, 2.0, 0.08), toon({ color: ['#3a4a5a', '#5a2e2a', '#2e4a3a'][(k + 9) % 3] }), 0.45, 1.0, 0, dg);
    add(box(0.9, 2.0, 0.02), dark, 0, 1.0, 0.04, cg).position.set(0, 1.0, -1.99);
    for (const wx of [-1.0, 1.0]) add(box(0.7, 0.6, 0.05), dark, wx, 3.1, -2.02, cg, { cast: false });
    add(box(0.7, 0.6, 0.05), dark, 1.05, 1.3, -2.02, cg, { cast: false });
    doors[k] = dg;
  }
  const haleGlow = new THREE.PointLight('#ffc888', 0, 5, 1.4); haleGlow.position.set(3.6, 1.2, 9.6); G.add(haleGlow);
  // the church and its tower on the hill
  add(tbox(8, 5, 6, 1), stone, 0.5, 2.5, 27, G); const nr = add(new THREE.CylinderGeometry(0.01, 5.3, 2.6, 4, 1), roofM, 0.5, 6.3, 27, G); nr.rotation.y = Math.PI / 4; nr.scale.set(1, 1, 0.8);
  add(tbox(3, 11.6, 3, 1), stone, 5, 5.8, 24, G); add(tbox(3.2, 0.4, 3.2, 1), stone, 5, 14.0, 24, G);
  for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) add(tbox(0.4, 2.4, 0.4, 1), stone, 5 + dx, 12.8, 24 + dz, G);
  const spire = add(new THREE.CylinderGeometry(0.01, 2.3, 4, 4, 1), roofM, 5, 16.2, 24, G); spire.rotation.y = Math.PI / 4;
  const pts = [[0, 0], [0.5, 0], [0.55, 0.1], [0.45, 0.3], [0.32, 0.8], [0.25, 1.0], [0, 1.05]].map(([r, y]) => new THREE.Vector2(r, y));
  const bellM = toon({ color: '#b08a3a' });
  const tBell = new THREE.Group(); tBell.position.set(5, 13.75, 24); G.add(tBell); add(new THREE.LatheGeometry(pts, 18), bellM, 0, -1.05, 0, tBell);
  // wet footprints from Mrs Hale's door down to the harbour steps: two pairs down, one back
  const printM = new THREE.MeshBasicMaterial({ color: '#2a3238', transparent: true, opacity: 0.55, depthWrite: false });
  const prints = [];
  const trail = (x0, z0, x1, z1, off, n) => { for (let k = 0; k < n; k++) { const t = k / (n - 1), s = k % 2 ? 1 : -1; const m = add(new THREE.CircleGeometry(0.09, 10), printM, lerp(x0, x1, t) + off + s * 0.1, 0.012, lerp(z0, z1, t), G, { cast: false }); m.rotation.x = -Math.PI / 2; m.scale.set(0.7, 1.5, 1); prints.push(m); } };
  trail(3.6, 9.4, 6.2, 0.6, -0.25, 18); trail(3.6, 9.4, 6.2, 0.6, 0.25, 18); trail(6.2, 0.6, 3.6, 9.4, 0.7, 18);
  const watch = new THREE.Group(); watch.position.set(...WATCH.map((v, i) => v - GO[i])); G.add(watch);
  const face = SETS.canvasPlane(ctx, 0.11, 0.11, 256, watch, { alpha: true, lit: true }); face.draw('w', watchFace); face.mesh.rotation.x = -Math.PI / 2; face.mesh.position.y = 0.012;
  add(new THREE.TorusGeometry(0.06, 0.006, 6, 18), toon({ color: '#c8a040' }), 0, 0.006, -0.065, watch).rotation.x = -Math.PI / 2;
  // ---- belfry ----
  const B = new THREE.Group(); B.position.set(...BO); ctx.world.add(B);
  add(tbox(3.6, 0.2, 3.6, 1), wood, 0, -0.1, 0, B, { cast: false }); add(tbox(3.6, 0.2, 3.6, 1), wood, 0, 3.7, 0, B, { cast: false });
  for (const [x, z, w, d] of [[0, -1.8, 3.6, 0.2], [0, 1.8, 3.6, 0.2], [-1.8, 0, 0.2, 3.6], [1.8, 0, 0.2, 3.6]]) add(tbox(w, 3.6, d, 1), stone, x, 1.8, z, B);
  for (const [x, z, ry] of [[-1.69, -0.5, Math.PI / 2], [1.69, -0.5, Math.PI / 2]]) { const a = add(box(0.9, 1.4, 0.04), new THREE.MeshBasicMaterial({ color: '#3a4458' }), x, 2.4, z, B, { cast: false }); a.rotation.y = ry; }
  const marks = SETS.canvasPlane(ctx, 1.7, 0.9, 1024, B, { lit: true }); marks.draw('t', tally); marks.mesh.position.set(0.3, 1.45, -1.69);
  const bBell = new THREE.Group(); bBell.position.set(0, 3.55, -0.2); B.add(bBell); add(new THREE.LatheGeometry(pts, 20), bellM, 0, -1.05, 0, bBell);
  const rope = add(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 6), toon({ color: '#c8b088' }), 0.35, 1.3, -0.2, B);
  const lantern = add(box(0.18, 0.26, 0.18), lit, -0.9, 0.13, 0.6, B, { cast: false });
  const lanL = new THREE.PointLight('#ffb060', 3.2, 7, 1.3); lanL.position.set(-0.9, 0.5, 0.6); B.add(lanL);
  // ---- kitchen ----
  const Kc = new THREE.Group(); Kc.position.set(...CO); ctx.world.add(Kc);
  add(tbox(5.2, 0.2, 4.4, 1), wood, 0, -0.1, 0, Kc, { cast: false }); add(tbox(5.2, 0.2, 4.4, 1), wood, 0, 2.7, 0, Kc, { cast: false });
  add(tbox(0.2, 2.8, 4.4, 1), plaster, -2.6, 1.3, 0, Kc); add(tbox(0.2, 2.8, 4.4, 1), plaster, 2.6, 1.3, 0, Kc); add(tbox(5.2, 2.8, 0.2, 1), plaster, 0, 1.3, 2.2, Kc);
  add(tbox(2.6, 2.8, 0.2, 1), plaster, -1.5, 1.3, -2.1, Kc); add(tbox(1.6, 2.8, 0.2, 1), plaster, 1.9, 1.3, -2.1, Kc); add(tbox(0.9, 0.8, 0.2, 1), plaster, 0.6, 2.4, -2.1, Kc);
  add(box(0.92, 2.0, 0.1), toon({ color: '#4a3424' }), 0.6, 1.0, -2.08, Kc); add(box(0.5, 0.06, 0.08), toon({ color: '#2a2a2a' }), 0.6, 1.25, -2.0, Kc);
  add(box(0.92, 0.025, 0.05), toon({ color: '#f4f2ec' }), 0.6, 0.012, -1.95, Kc, { cast: false });                 // the salt line
  const water = add(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#3a5a6a', transparent: true, opacity: 0.6, depthWrite: false }), 0.6, 0.006, -1.9, Kc, { cast: false }); water.rotation.x = -Math.PI / 2;
  add(box(1.3, 0.06, 0.85), wood, 0, 0.75, 0, Kc); for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(box(0.06, 0.75, 0.06), wood, dx * 0.58, 0.37, dz * 0.36, Kc);
  for (const [x, z] of [[0, -0.75], [0.85, 0], [-0.85, 0]]) add(box(0.4, 0.45, 0.4), wood, x, 0.22, z, Kc);
  const candle = new THREE.Group(); candle.position.set(0, 0.78, 0); Kc.add(candle);
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 10), toon({ color: '#f2ead8' }), 0, 0.07, 0, candle);
  const flame = add(new THREE.SphereGeometry(0.018, 8, 6), lit, 0, 0.17, 0, candle, { cast: false }); flame.scale.y = 1.8;
  const candleL = new THREE.PointLight('#ffb060', 0, 7, 1.3); candleL.position.set(0, 1.0, 0); candleL.castShadow = true; Kc.add(candleL);
  const steps = []; for (let k = 0; k < 10; k++) steps.push(add(box(0.8, (k + 1) * 0.26, 0.32), wood, -2.1, (k + 1) * 0.13, 1.6 - 0.16 - 0.32 * k, Kc));
  const stairL = new THREE.SpotLight('#8ab0ff', 0, 8, 0.5, 0.7, 1.1); stairL.position.set(...C(-0.4, 2.5, 1.6)); stairL.target.position.set(...C(-2.1, 1.2, 0.0)); ctx.world.add(stairL); ctx.world.add(stairL.target);
  const wet = []; for (let k = 9; k >= 0; k--) for (const s of [-1, 1]) { const m = add(new THREE.CircleGeometry(0.085, 10), new THREE.MeshBasicMaterial({ color: '#9ec8e0', transparent: true, opacity: 0.85, depthWrite: false }), -2.1 + s * 0.11, (k + 1) * 0.26 + 0.004, 1.6 - 0.16 - 0.32 * k, Kc, { cast: false }); m.rotation.x = -Math.PI / 2; m.scale.set(0.8, 1.5, 1); wet.push(m); }
  for (let k = -1; k <= 1; k++) add(box(0.04, 0.9, 0.04), wood, -1.72, 0.45 + (k + 1) * 0.78 + 0.4, 1.0 - (k + 1) * 0.9, Kc);
  add(box(0.06, 0.06, 3.3), wood, -1.72, 0, 0, Kc).position.set(-1.72, 1.55, 0); 
  add(box(0.05, 0.7, 0.9), toon({ color: '#3a2e24' }), 2.48, 1.5, -0.4, Kc);                          // shuttered window
  // ---- children's room ----
  const Rm = new THREE.Group(); Rm.position.set(...RO); ctx.world.add(Rm);
  add(tbox(4.4, 0.2, 3.6, 1), wood, 0, -0.1, 0, Rm, { cast: false }); add(tbox(4.4, 0.2, 3.6, 1), wood, 0, 2.5, 0, Rm, { cast: false });
  add(tbox(4.4, 2.6, 0.2, 1), plaster, 0, 1.2, -1.8, Rm); add(tbox(0.2, 2.6, 3.6, 1), plaster, -2.2, 1.2, 0, Rm); add(tbox(0.2, 2.6, 3.6, 1), plaster, 2.2, 1.2, 0, Rm);
  for (const x of [-0.8, 1.0]) { add(box(0.9, 0.35, 1.7), wood, x, 0.18, -0.9, Rm); add(box(0.86, 0.12, 1.4), toon({ color: '#d8d0c0' }), x, 0.41, -0.75, Rm); add(box(0.6, 0.12, 0.3), toon({ color: '#f0ece4' }), x, 0.42, -1.6, Rm); }
  for (let k = 0; k < 5; k++) add(box(0.04, 0.06, 0.9), toon({ color: '#3a2e24' }), 2.08, 1.15 + k * 0.16, 0.3, Rm);
  const moon = new THREE.SpotLight('#9ab4ff', 6, 10, 0.5, 0.6, 1.2); moon.position.set(...R(3.5, 2.2, 0.3)); moon.target.position.set(...R(-0.8, 0.5, -0.8)); ctx.world.add(moon); ctx.world.add(moon.target);
  // a black card that hides everything (the hard cut to black)
  const black = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: '#000', depthTest: false, transparent: true })); black.renderOrder = 999; black.visible = false; ctx.world.add(black);
  return { boats, lamps, lampLights, doors, haleGlow, tBell, bBell, rope, prints, watch, water, candle, flame, candleL, wet, black, lanL, stairL };
};
export const update = (W, f, P) => {
  if (!P.boats) return;
  P.boats.forEach((b, i) => { b.position.y = -0.85 + Math.sin(f * 0.05 + i) * 0.05; b.rotation.z = Math.sin(f * 0.04 + i * 2) * 0.04; });
  P.lamps.forEach((m) => m.material.color.set(W.lamps ? '#ffd28a' : '#4a4a40')); P.lampLights.forEach((l) => (l.intensity = W.lamps ? 4.0 : 0));
  P.doors[1].rotation.y = -W.hale * 1.3; P.haleGlow.intensity = W.haleGlow;
  P.tBell.rotation.z = W.swing * Math.sin(f * 0.22); P.bBell.rotation.z = W.swing * 0.8 * Math.sin(f * 0.22); P.rope.position.y = 1.3 + W.swing * 0.15 * Math.sin(f * 0.22);
  P.prints.forEach((m, i) => (m.visible = W.prints));
  P.watch.visible = W.watch; P.watch.position.y = W.watchY;
  P.water.scale.set(0.9, Math.max(0.001, W.water * 1.2), 1); P.water.position.z = -1.95 + W.water * 0.6;
  const fl = 1 + 0.12 * Math.sin(f * 0.9) + 0.08 * Math.sin(f * 2.3); P.candle.visible = W.candle; P.candleL.intensity = W.candle ? W.burn * fl : 0;
  P.wet.forEach((m, i) => (m.visible = i < W.wet)); P.stairL.intensity = W.stairLight * 5;
  P.black.visible = W.black > 0; P.black.material.opacity = W.black;
  if (W.black > 0) { const c = camAt(f), d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], n = Math.hypot(...d); P.black.position.set(c.pos[0] + d[0] / n * 0.3, c.pos[1] + d[1] / n * 0.3, c.pos[2] + d[2] / n * 0.3); P.black.lookAt(...c.pos); }
};
export const worldAt = (f) => {
  const S = shotAt(f), id = S.id, i = S.i;
  const W = { stairLight: 0, lamps: true, hale: 0, haleGlow: 0, swing: 0, prints: false, watch: false, watchY: 0.03, water: 0, candle: true, burn: 2.4, wet: 0, black: 0 };
  if (['town', 'tom', 'morning', 'prints', 'watch', 'stopped'].includes(id)) W.lamps = false;
  if (['count', 'twelve', 'thirteen', 'count2'].includes(id)) W.swing = 0.25;
  if (id === 'bolt') { W.hale = 0.25 * smooth(ramp(f, S.beat, S.b)); W.haleGlow = 1.6 * W.hale / 0.25; }
  if (id === 'boy') { W.hale = 0.25; W.haleGlow = 1.6; W.black = f > S.beat + (S.b - S.beat) * 0.55 ? 1 : 0; }
  if (id === 'morning' || id === 'prints') { W.hale = 1.0; W.prints = true; }
  if (id === 'watch' || id === 'stopped') { W.watch = true; W.watchY = 0.03; }
  if (['knock', 'annie', 'whistle', 'dad'].includes(id)) W.water = smooth(ramp(f, S.a, S.b)) * 0.5 + (['annie', 'whistle', 'dad'].indexOf(id) + 1) * 0.15;
  if (id === 'silence' || id === 'inside' || id === 'stairs') W.water = 0.65;
  if (id === 'stairs') { W.wet = Math.floor(ramp(f, S.a + 6, S.b - 60) * 20); W.burn = f > S.b - 40 ? 0.6 : 1.6; W.stairLight = 1; }
  return W;
};

// ---------- cast ----------
const KS = 0.62, AS = 0.84;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const tom = (expr, o, pos, x = {}) => out.push(actor(T, TOM, { seed: 31, expr, blink: blinkAt(f, 31), ...o, who: 'tom' }, pos, { s: KS, ...x }));
  const mary = (expr, o, pos, x = {}) => out.push(actor(T, MARY, { seed: 9, expr, blink: blinkAt(f, 9), ...o, who: 'mary' }, pos, { s: 0.82, ...x }));
  const annie = (expr, o, pos, x = {}) => out.push(actor(T, ANNIE, { seed: 44, expr, blink: blinkAt(f, 44), ...o, who: 'annie' }, pos, { s: 0.52, ...x }));
  const silas = (expr, o) => out.push(actor(T, 'grandpa', { seed: 21, expr, blink: blinkAt(f, 21), R: 'lift', ...o, who: 'silas' }, Bf(-0.15, 0, -0.1), { s: AS }));
  const drowned = (pos, seed, o = {}) => out.push(actor(T, DROWNED, { seed, expr: 'neutral', blink: 0, look: 0.3, ...o, who: 'drowned' + seed }, pos, { s: 0.66, tint: '#4a7a84', alpha: 0.9, blob: false, shadow: false }));
  if (id === 'tom') tom('neutral', { look: -0.3, R: 'lift' }, O(1, 0.0, 0.5));
  if (id === 'ringer') { silas('neutral', { look: 0.5 }); tom('neutral', { look: -0.5, R: 'lift' }, Bf(0.9, 0, 0.7)); }
  if (id === 'silas' || id === 'answered') silas(id === 'answered' ? 'stern' : 'squint', { look: 0.6 });
  if (id === 'salt') { mary('stern', { look: 0.2, R: 'reach' }, C(0.6, 0, -1.4)); annie('wary', { look: 0.5 }, C(-2.05, 1.05, 0.35)); }
  if (id === 'rule') { mary('stern', { look: 0.6, R: 'point' }, C(0.35, 0, -0.95)); tom('nervous', { look: -0.6 }, C(1.15, 0, -0.35)); }
  if (id === 'count' || id === 'twelve') tom(id === 'twelve' ? 'scared' : 'wary', { look: 0.4, blink: id === 'twelve' ? 0 : blinkAt(f, 31) }, R(-0.75, -0.18, -1.1));
  if (id === 'voices') { drowned(O(-3.6, 0, 9.2), 61); drowned(O(-7.2, 0, 9.2), 62); drowned(O(7.2, 0, 9.2), 63); drowned(O(3.6, 0, 9.25), 64); }
  if (id === 'peter') drowned(O(3.6, 0, 9.25), 64, { look: -0.2 });
  if (id === 'bolt') drowned(O(3.6, 0, 9.25), 64);
  if (id === 'boy') { drowned(O(3.6, 0, 9.25), 64); if (f > S.a + 10) out.push(actor(T, 'gran', { seed: 77, expr: 'relief', blink: blinkAt(f, 77), R: 'reach', who: 'hale' }, O(3.75, 0, 9.75), { s: 0.8 })); }
  if (id === 'watch') tom('wary', { look: -0.5, R: 'reach' }, O(0.65, 0, 8.7));
  if (['vigil', 'count2', 'annie', 'dad', 'silence'].includes(id)) {
    const blue = !(id === 'vigil' || (id === 'count2' && f < S.beat + 10));
    mary(id === 'annie' || id === 'dad' ? 'scared' : 'stern', { look: 0.3, R: id === 'annie' || id === 'dad' ? 'reach' : 'hang', blink: blue ? 0 : blinkAt(f, 9) }, C(-0.05, -0.25, -0.8));
    tom(id === 'dad' ? 'nervous' : blue ? 'scared' : 'wary', { look: -0.3, blink: blue ? 0 : blinkAt(f, 31) }, C(0.8, -0.2, 0.35));
    annie(id === 'annie' ? 'smile' : blue ? 'wary' : 'neutral', { look: 0.5, R: id === 'annie' ? 'reach' : 'hang' }, C(-0.85, id === 'annie' ? -0.05 : -0.18, 0.15));
  }
  if (id === 'inside') { tom('shock', { look: -0.8, blink: 0 }, C(0.6, -0.2, 0.9)); }
  return out;
};
const notes = (t) => (p) => { const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - t); g.font = '900 150px Arial'; g.textAlign = 'center'; g.fillStyle = '#c8d8ff'; g.fillText('♪ ♪ ♪', 300, 560 - t * 120); g.restore(); };
const drip = (t) => (p) => { const g = p.g; g.fillStyle = 'rgba(170,210,240,0.9)'; for (let k = 0; k < 4; k++) { const y = 420 + ((t * 600 + k * 150) % 520); g.beginPath(); g.ellipse(270 + k * 22, y, 9, 14, 0, 0, 7); g.fill(); } };
const paleEyes = (p) => { const g = p.g; g.save(); g.shadowColor = '#e8f4ff'; g.shadowBlur = 22; for (const x of [262, 338]) { g.fillStyle = '#eef4fa'; g.beginPath(); g.ellipse(x, 470, 18, 10, 0, 0, 7); g.fill(); } g.restore(); };
export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [];
  const eyes = (pos) => out.push(fx('pe', paleEyes, [pos[0], pos[1] + 0.68, pos[2] + 0.03], 0.3, { order: 4 }));
  if (id === 'voices') for (const p of [O(-3.6, 0, 9.2), O(-7.2, 0, 9.2), O(7.2, 0, 9.2), O(3.6, 0, 9.25)]) eyes(p);
  if (id === 'peter' || id === 'bolt' || id === 'boy') eyes(O(3.6, 0, 9.25));
  if (id === 'knock') { const d = (f - S.a) % 22; if (d < 12) { const t = q(d / 12); out.push(fx('kn' + t, word('KNOCK', t, '#e8eef8'), C(0.6, 1.5, -1.8), 0.3)); } }
  if (id === 'whistle') { const t = q(((f - S.a) % 40) / 40, 1); out.push(fx('nt' + t, notes(t), C(0.6, 0.15, -1.85), 0.35)); }
  if (id === 'stopped' || id === 'watch') { const t = q(((f - S.a) % 30) / 30, 1); out.push(fx('dr' + t, drip(t), [WATCH[0] + 0.05, -0.08, WATCH[2] - 0.02], 0.12)); }
  return out;
};
