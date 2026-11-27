// "What If The Chemistry Teacher Said Yes?" — a private adult comedy (not for the channel). A broke chemistry teacher,
// Wendell Gray, gets cancer, says yes to his rich friends' offer, and everyone's life gets better... except his lawyer
// Sal's, who calls at 3 a.m. with an RV idea. Our own characters and names. Radio-story look, early-winter snow.
import * as SETS from './sets.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, talkAt, actor, fx, word } from './kit.js';

// ---------- places, far apart in one world ----------
const B = { town: [0, 0, 0], hosp: [120, 0, 0], kitchen: [180, 0, 0], bath: [180, 0, 40], bed: [180, 0, 80], corp: [240, 0, 0], tattoo: [300, 0, 0],
  garage: [300, 0, 40], office: [360, 0, 0], sal: [360, 0, 40], desert: [440, 0, 0] };
const at = (k) => (x, y, z) => [B[k][0] + x, B[k][1] + y, B[k][2] + z];
const TOWN = at('town'), HOSP = at('hosp'), KIT = at('kitchen'), BATH = at('bath'), BED = at('bed'), CORP = at('corp'), TAT = at('tattoo'), GAR = at('garage'), OFF = at('office'), SAL = at('sal'), DES = at('desert');

// ---------- cast (our own designs) ----------
const BOLD = 1.55;
const WEN_HAIR = '#c8501e';
const WENDELL = { tunic: '#d8a030', shirt: '#ffffff', bowtie: '#7a1a2a', skin: '#f2c9a6', hair: WEN_HAIR, glasses: '#3a2a1a', brows: '#a84a1a', shoes: '#4a2a1a' };
const BALD = { ...WENDELL, hair: WENDELL.skin };
const JORDY = { tunic: '#3a8a3a', skin: '#e8b48e', hair: '#2a1a12', long: '#2a1a12', cap: '#c8a020', shoes: '#f4f4f4' };
const RICK = { tunic: '#4a6ab0', shirt: '#dfe6f2', tie: '#1a1a3a', skin: '#f0c8a8', hair: '#6a4a2a', moustache: '#5a3a1a', stout: true, shoes: '#1a1a1a' };
const MONA = { tunic: '#8a3ab8', skin: '#f2d2b6', hair: '#e8c87a', bun: '#e8c87a', shoes: '#6a1a8a' };
const SHELLY = { tunic: '#2a8a8a', skin: '#f2d2b6', hair: '#1a1a1a', shoes: '#1a1a1a' };
const TED = { tunic: '#3a3a44', shirt: '#ffffff', tie: '#c41e3a', skin: '#f0c8a8', hair: '#c8a060', shoes: '#1a1a1a' };
const JUNIOR = { tunic: '#e85a2a', skin: '#f2c9a6', hair: '#5a3a1a', shoes: '#2a4a8a' };
const DOC = { tunic: '#f4f4f6', shirt: '#8ac0e8', tie: '#1a3a6a', skin: '#8a5a3a', hair: '#1a1210', glasses: '#1a1a1a', shoes: '#1a1a1a' };
const BRAIN_M = { tunic: '#f4f4f0', shirt: '#e8e8e8', tie: '#c8a227', skin: '#f2d2b6', hair: '#1a1a1a', shoes: '#c8a227' };
const BRAIN_F = { tunic: '#f4f0e8', skin: '#e8c0a0', hair: '#6a3a1a', long: '#6a3a1a', shoes: '#c8a227' };
const FREDO = { tunic: '#f2c21a', shirt: '#ffffff', tie: '#1a1a1a', apron: '#ffffff', skin: '#6a4a32', hair: '#141010', glasses: '#1a1a1a', shoes: '#1a1a1a' };
const MOE = { tunic: '#5a4a3a', shirt: '#c8c0b0', skin: '#f0d0b8', hair: '#f0d0b8', brows: '#d8d8d8', shoes: '#2a2a2a' };
const TORO = { tunic: '#c41e1e', apron: '#ffffff', skin: '#c99067', cap: '#1a1a1a', hair: '#141010', moustache: '#141010', stout: true, shoes: '#1a1a1a' };
const TIMMY = { tunic: '#3a6ab0', cap: '#c8202a', skin: '#f2d2b6', hair: '#c8a060', shoes: '#2a2a2a' };
const SALC = { tunic: '#2a9ac8', shirt: '#ffd0e8', tie: '#ff3a8a', skin: '#f0c8a8', hair: '#5a3a1a', shoes: '#f4f4f4' };
const COATS = [{ tunic: '#3a5a8a', skin: '#e8b48e', hair: '#2a1a12', cap: '#c83a3a' }, { tunic: '#8a3a3a', skin: '#f2c9a6', hair: '#c8a060', long: '#c8a060' },
  { tunic: '#3a7a5a', skin: '#c99067', hair: '#1a1210', cap: '#e8e8e8' }, { tunic: '#6a4a8a', skin: '#f0d0b8', hair: '#6a3a1a' }, { tunic: '#c87a2a', skin: '#8a5a3a', hair: '#141010', cap: '#2a4a8a' },
  { tunic: '#4a4a52', skin: '#f2d2b6', hair: '#e8c87a', long: '#e8c87a' }, { tunic: '#2a6a8a', skin: '#e0b090', hair: '#4a2a1a', cap: '#ffd23f' }];
const AS = 0.78, JS = 0.66;

// ---------- shots ----------
const IDS = ['wash', 'doctor', 'call', 'ego', 'applause', 'hair', 'tattoo', 'rocks', 'steal', 'ted', 'junior', 'chicken', 'pigeons', 'burrito', 'roaches', 'cat', 'vending', 'ring', 'sal', 'bald', 'rv'];
// where everyone stands
const POS = {
  wenWash: TOWN(-20.6, 0.16, -4.6), tipper: TOWN(-18.9, 0.16, -3.9),
  wenHosp: HOSP(-0.7, 0, -1.4), doc: HOSP(0.8, 0, -1.6),
  wenKit: KIT(-0.4, 0, -1.4), junior: KIT(0.9, 0, -1.9), cat: KIT(0.2, 0.95, -1.0),
  wenCorp: CORP(1.6, 0, -1.2), brainM: CORP(-0.6, 0.3, -3.0), brainF: CORP(-1.6, 0.3, -3.0),
  wenBath: BATH(0, 0, -1.6),
  jordy: TAT(-0.6, 0, -1.6), tatClient: TAT(0.9, 0, -1.9),
  rick: GAR(-0.5, 0, -1.6), mona: GAR(1.2, 0, -1.4),
  shelly: OFF(-0.5, 0, -1.5), ted: OFF(0.7, 0, -1.7),
  fredo: TOWN(-8, 0.16, -5.9), moe: TOWN(10, 0.16, 6.6), toro: TOWN(21.1, 0.72, 0.08), inspector: TOWN(25, 0.16, 1.6), timmy: TOWN(31.4, 0.16, -5.9),
  salOff: SAL(0.2, 0, -1.9), client: SAL(-1.3, 0, -1.4),
  wenBed: BED(-0.4, 0, -1.5),
  wenRV: DES(-0.9, 0, 1.2), salRV: DES(0.6, 0, 1.4),
};
const up = (p, dy) => [p[0], p[1] + dy, p[2]];
const C = (pos, look, fov = 46) => ({ pos, look, fov });
const CAMS = {
  wash: [C(TOWN(-17.6, 1.35, 1.6), TOWN(-20.4, 1.2, -4.8), 48)],
  doctor: [C(HOSP(0.4, 1.5, 2.6), HOSP(0, 1.2, -1.6))],
  call: [C(KIT(0.6, 1.45, 2.4), KIT(-0.4, 1.25, -1.6))],
  ego: [C(KIT(-0.2, 1.4, 1.6), KIT(-0.4, 1.3, -1.4), 40)],
  applause: [C(CORP(2.8, 1.8, 4.2), CORP(-0.4, 1.5, -2.6), 52)],
  hair: [C(BATH(0, 1.3, 0.9), BATH(0, 1.28, -1.6), 40)],
  tattoo: [C(TAT(0.8, 1.5, 2.6), TAT(0, 1.25, -1.8))],
  rocks: [C(GAR(0.6, 1.5, 2.7), GAR(0, 1.3, -1.8))],
  steal: [C(GAR(-0.8, 1.6, 2.6), GAR(0.4, 1.3, -1.8), 50)],
  ted: [C(OFF(0.5, 1.45, 2.4), OFF(0, 1.25, -1.6))],
  junior: [C(KIT(1.6, 1.45, 1.8), KIT(0.8, 1.1, -1.8))],
  chicken: [C(TOWN(-6.6, 1.5, -1.2), TOWN(-8, 1.6, -6.4), 48)],
  pigeons: [C(TOWN(11, 1.3, 2.4), TOWN(10, 0.9, 6.8), 48)],
  burrito: [C(TOWN(21.8, 1.55, 4.6), TOWN(21.1, 1.6, -0.3), 50)],
  roaches: [C(TOWN(31.6, 1.25, -2.2), TOWN(31.0, 0.9, -6.0), 52)],
  cat: [C(KIT(0.9, 1.45, 1.6), KIT(-0.1, 1.15, -1.2), 44)],
  vending: [C(SAL(0.9, 1.5, 2.6), SAL(-0.4, 1.3, -1.8), 50)],
  ring: [C(BED(0.5, 1.25, 0.7), BED(-0.6, 0.95, -1.8), 46)],
  sal: [C(SAL(0.6, 1.45, 1.4), SAL(0.2, 1.4, -1.9), 40)],
  bald: [C(BATH(0, 1.3, 0.9), BATH(0, 1.28, -1.6), 40)],
  rv: [C(DES(3.5, 1.4, 7.5), DES(-0.6, 1.6, -1), 50)],
};
// on a word, the camera snaps a little closer to what's named
const PUSH = {
  wash: [['coughed', up(POS.wenWash, 1.2), 0.3], ['tipped', up(POS.tipper, 1.2), 0.25]],
  doctor: [['cancer', up(POS.wenHosp, 1.3), 0.35]],
  call: [['braincorp', KIT(-0.4, 1.3, -1.6), 0.25]],
  applause: [['billion', CORP(-0.8, 2.0, -3), 0.2], ['polite', CORP(1, 1.5, -1), 0.25]],
  tattoo: [['chemistry', TAT(0, 2.0, -2.6), 0.3]],
  steal: [['all', GAR(0, 1.6, -2.6), -0.35]],
  burrito: [['inspectors', up(POS.inspector, 1.2), 0.25]],
  roaches: [['fear', TOWN(33, 0.5, -5.2), 0.35]],
  vending: [['vending', SAL(-1.6, 1.2, -2.2), 0.3]],
  ring: [['rang', BED(-1.3, 0.7, -1.9), 0.45]],
  rv: [['great', up(POS.salRV, 1.3), 0.25]],
};
for (const [id, ps] of Object.entries(PUSH)) { const ks = [CAMS[id][0]];
  for (const [w, target, k] of ps) { const prev = ks[ks.length - 1]; ks.push({ pos: lerp3(prev.pos, target, k), look: target, fov: prev.fov - (k < 0 ? -6 : 4), at: w }); }
  CAMS[id] = ks; }
// white-flash fly-throughs between places
const FLY = { doctor: { through: TOWN(-20.6, 1.3, -6.5), whiteout: 1 }, applause: { through: KIT(-0.4, 1.5, -3.2), whiteout: 1 }, tattoo: { through: BATH(0, 1.5, -3), whiteout: 1 },
  ted: { through: GAR(0, 1.5, -3), whiteout: 1 }, chicken: { through: KIT(0.8, 1.5, -3), whiteout: 1 }, cat: { through: TOWN(32, 1.5, -7), whiteout: 1 },
  ring: { through: SAL(-1.6, 1.5, -3), whiteout: 1 }, rv: { through: BATH(0, 1.5, -3), whiteout: 1 } };
// close-ups: [from word, to word (null = end), face, scale, side angle]
const FACE = (p, s) => [p[0], p[1] + 1.73 * s, p[2]];
const CLOSE = {
  wash: [['pity', null, POS.tipper, AS, 0.3]],
  doctor: [['insurance', null, POS.wenHosp, AS, 0.25]],
  ego: [['every', null, POS.wenKit, AS, 0]],
  applause: [['polite', null, POS.wenCorp, AS, -0.25]],
  hair: [['devastated', null, POS.wenBath, AS, 0]],
  rocks: [['they', null, POS.rick, AS, 0.2]],
  ted: [['boredom', null, POS.shelly, AS, -0.2]],
  chicken: [['never', null, POS.fredo, AS, 0.2]],
  burrito: [['hot', 'health', POS.toro, AS, 0.15]],
  sal: [['wendell', null, POS.salOff, 0.76, 0]],
  bald: [['bald', null, POS.wenBath, AS, 0]],
  rv: [['sal', 'great', POS.wenRV, AS, 0.3], ['great', null, POS.salRV, 0.76, -0.3]],
};
// who talks (lip sync from the voice) on which words of a shot: [character name, from word, to word]
const TALK = { doctor: [['doc', 'the', 'his']], rocks: [['rick', 'they', null]], burrito: [['toro', 'hot', 'health']], pigeons: [['moe', 'lectured', null]],
  sal: [['sal', 'wendell', null]], rv: [['wendell', 'sal', 'great'], ['sal', 'great', null]], call: [['brainM', 'they', null]] };

const room = (L) => ({ ...L, fogNear: 10, fogFar: 50 });
const LIGHTS = {
  town: { ...MOODS.overcast, sky: '#aeb8c8', ground: '#e8eef4', hemi: 1.15, sunI: 1.2, sun: '#e8eef8', fog: '#c4ccd8', fogNear: 18, fogFar: 90, sat: 1.12, vig: 0.22, snow: 1, clouds: 0.8, cloudCol: '#dfe4ec', cloudDark: '#8a94a4' },
  warm: room({ ...MOODS.sunClouds, hemi: 1.1, sky: '#f2e8d8', ground: '#a08a70', sat: 1.14, vig: 0.2 }),
  cool: room({ ...MOODS.overcast, hemi: 1.15, sky: '#e8eef6', ground: '#8a8a90', sunI: 1.4, sat: 1.12, vig: 0.2 }),
  hosp: room({ ...MOODS.overcast, hemi: 1.25, sky: '#eaf4f4', ground: '#9aa8a8', sunI: 1.4, sat: 1.06, vig: 0.24 }),
  night: room({ ...MOODS.moonNight, hemi: 0.75, sky: '#8a9ad0', ground: '#2a2a3a', gain: '#f2ecff', vig: 0.42 }),
  desk: room({ ...MOODS.evening, hemi: 0.9, sky: '#ffcf9a', ground: '#4a3a3a', vig: 0.4, sat: 1.1 }),
  desert: { ...MOODS.blueSky, sky: '#9ac8f4', ground: '#d8a870', fog: '#f2d8b8', fogNear: 40, fogFar: 260, sat: 1.2, vig: 0.18, clouds: 0.3 },
};
const LIGHT_OF = { wash: 'town', doctor: 'hosp', call: 'warm', ego: 'warm', applause: 'cool', hair: 'cool', tattoo: 'desk', rocks: 'warm', steal: 'warm', ted: 'cool', junior: 'warm',
  chicken: 'town', pigeons: 'town', burrito: 'town', roaches: 'town', cat: 'warm', vending: 'cool', ring: 'night', sal: 'desk', bald: 'night', rv: 'desert' };
const FOCUS = {};
for (const id of IDS) { const c = CAMS[id][0]; FOCUS[id] = c.look; }
const K = makeStory({ ids: IDS, cams: CAMS, lights: LIGHTS, fly: FLY, light: (S) => LIGHT_OF[S.id],
  tweak: (L, S, f) => { if (S.id === 'ring') { const k = f % 20; if (k < 3) L.gain = '#dfe8ff'; } },
  kicks: ['ego', 'ring'], focus: (S) => FOCUS[S.id], shadowAt: (S) => FOCUS[S.id] });
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor } = K;
export { LIGHTS };
const vert = (c, S) => ({ ...c, look: lerp3(c.look, FOCUS[S.id], 0.4), fov: Math.min(76, c.fov * 1.15) });
const closeAt = (f, S) => {
  for (const [w0, w1, p, sc, side] of CLOSE[S.id] || []) {
    const a = K.wordF(S, w0), b = w1 ? K.wordF(S, w1) : S.b + 1; if (f < a || f >= b || a === b) continue;
    const fp = FACE(p, sc), base = CAMS[S.id][0].pos; let dx = base[0] - fp[0], dz = base[2] - fp[2]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const c = Math.cos(side), sn = Math.sin(side), rx = dx * c - dz * sn, rz = dx * sn + dz * c, d = 2.7 * sc * (1 - 0.1 * smooth(ramp(f, a, Math.max(a + 1, b))));
    return { pos: [fp[0] + rx * d, fp[1] + 0.04 * sc, fp[2] + rz * d], look: [fp[0], fp[1] - 0.06 * sc, fp[2]], fov: 30, roll: 0, flash: 0, shadowAt: fp, close: true };
  }
  return null;
};
export const camAt = (f) => { const S = shotAt(f); return closeAt(f, S) || vert(K.camAt(f), S); };
export const dofAt = (f) => { const c = camAt(f); if (c.close) return { focus: Math.hypot(...c.pos.map((v, i) => v - c.look[i])), cinf: 6 }; return K.dofAt(f); };
const talking = (S, f, who) => { for (const [n, w0, w1] of TALK[S.id] || []) { if (n !== who) continue; const a = K.wordF(S, w0), b = w1 ? K.wordF(S, w1) : S.b + 1; if (f >= a && f < b) return talkAt(f, 1.15); } return null; };

// ---------- shared helpers (from the kit stories) ----------
const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const board = (bg, lines, fg = '#ffffff', accent = '#ffd23f') => (g, w, h) => {      // a giant billboard
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach(([t, s, c], i) => { g.font = `900 ${s * h}px Arial Black, Arial`; g.lineWidth = s * h * 0.12; g.strokeStyle = '#141020';
    const y = h * (0.3 + i * 0.36); g.strokeText(t, w / 2, y); g.fillStyle = c || (i ? accent : fg); g.fillText(t, w / 2, y); });
  g.strokeStyle = '#141020'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); };
const sign = (txt, bg = '#f4f4f0', fg = '#1a1a1a') => (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `900 ${h * 0.5 | 0}px Arial Black, Arial`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 2); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8); };
const tube = (ctx, a, b, r, mat, parent) => { const { THREE } = ctx; const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mat); m.position.copy(A.clone().add(Bv).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.castShadow = true; parent.add(m); return m; };

function roomShell(ctx, G, { w = 8, d = 8, h = 3.4, wall, floor, ceil, win = null }) {
  const { add, tbox } = ctx;
  add(tbox(w, 0.1, d, 1), floor, 0, -0.05, 0, G, { cast: false }); add(tbox(w, 0.1, d, 1), ceil, 0, h + 0.05, 0, G, { cast: false });
  add(tbox(0.12, h, d, 1), wall, -w / 2, h / 2, 0, G); add(tbox(0.12, h, d, 1), wall, w / 2, h / 2, 0, G); add(tbox(w, h, 0.12, 1), wall, 0, h / 2, d / 2, G);
  if (!win) { add(tbox(w, h, 0.12, 1), wall, 0, h / 2, -d / 2, G); return; }
  const [x0, x1, y0, y1] = win;
  add(tbox(w, y0, 0.12, 1), wall, 0, y0 / 2, -d / 2, G); add(tbox(w, h - y1, 0.12, 1), wall, 0, (h + y1) / 2, -d / 2, G);
  add(tbox(x0 + w / 2, y1 - y0, 0.12, 1), wall, (x0 - w / 2) / 2, (y0 + y1) / 2, -d / 2, G); add(tbox(w / 2 - x1, y1 - y0, 0.12, 1), wall, (x1 + w / 2) / 2, (y0 + y1) / 2, -d / 2, G);
}
const MATS = new Map();
const matOf = (ctx, key, mk) => { if (!MATS.has(key)) MATS.set(key, mk()); return MATS.get(key); };

function vehicle(ctx, parent, { kind = 'taxi', color = '#f2c21a', num = '7G12' } = {}) {
  const { THREE, add, box, toon } = ctx, g = new THREE.Group(); parent.add(g); const nc = { cast: false };
  const body = toon({ color: kind === 'police' ? '#f4f4f6' : color }), glass = matOf(ctx, 'vglass', () => toon({ color: '#24344a' })), black = matOf(ctx, 'vblack', () => toon({ color: '#141418' }));
  const chrome = matOf(ctx, 'vchrome', () => toon({ color: '#c8ccd4' })), headM = matOf(ctx, 'vhead', () => new THREE.MeshBasicMaterial({ color: '#fff6d8' })), tailM = matOf(ctx, 'vtail', () => new THREE.MeshBasicMaterial({ color: '#ff2a2a' }));
  if (kind === 'truck') {
    add(box(4.2, 2.6, 2.3), toon({ color: '#f2f2ee' }), -0.9, 1.75, 0, g); add(box(1.8, 1.9, 2.2), toon({ color: color }), 2.1, 1.35, 0, g); add(box(0.9, 0.8, 2.22), glass, 2.55, 1.85, 0, g);
    const side = SETS.canvasPlane(ctx, 4.0, 2.2, 512, g, { lit: true }); side.draw('t', board(['#ff7a1a', '#c81e3a'], [['QUICKBOX', 0.24], ['DELIVERY', 0.14]])); side.mesh.position.set(-0.9, 1.8, 1.16);
    const side2 = SETS.canvasPlane(ctx, 4.0, 2.2, 512, g, { lit: true }); side2.draw('t', board(['#ff7a1a', '#c81e3a'], [['QUICKBOX', 0.24], ['DELIVERY', 0.14]])); side2.mesh.position.set(-0.9, 1.8, -1.16); side2.mesh.rotation.y = Math.PI;
    for (const s of [-1, 1]) for (const x of [-2.2, 2.1]) { const w = add(new THREE.CylinderGeometry(0.48, 0.48, 0.34, 18), black, x, 0.48, s * 1.0, g); w.rotation.x = Math.PI / 2; const r = add(new THREE.CylinderGeometry(0.26, 0.26, 0.36, 12), chrome, x, 0.48, s * 1.0, g, nc); r.rotation.x = Math.PI / 2; }
    add(box(0.06, 0.2, 0.4), headM, 3.01, 0.9, 0.75, g, nc); add(box(0.06, 0.2, 0.4), headM, 3.01, 0.9, -0.75, g, nc);
    return { g };
  }
  const prof = new THREE.Shape([[2.3, 0.32], [2.36, 0.72], [2.2, 0.86], [1.15, 0.98], [-1.75, 1.0], [-2.25, 0.92], [-2.36, 0.62], [-2.3, 0.32]].map(([x, y]) => new THREE.Vector2(x, y)));
  const ex = (shape, w, bev) => { const geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 4 }); geo.translate(0, 0, -w / 2); return geo; };
  add(ex(prof, 1.62, 0.09), body, 0, 0, 0, g);
  const cab = new THREE.Shape([[0.95, 0.96], [0.25, 1.42], [-1.0, 1.46], [-1.65, 1.0]].map(([x, y]) => new THREE.Vector2(x, y)));
  add(ex(cab, 1.46, 0.06), glass, 0, 0, 0, g);
  const roofS = new THREE.Shape([[0.32, 1.38], [0.22, 1.47], [-0.98, 1.5], [-1.05, 1.41]].map(([x, y]) => new THREE.Vector2(x, y))); add(ex(roofS, 1.5, 0.04), body, 0, 0, 0, g);
  for (const x of [-0.35]) add(box(0.12, 0.46, 1.5), body, x, 1.2, 0, g, nc);                       // B pillar
  for (const s of [-1, 1]) for (const x of [-1.45, 1.45]) { const w = add(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 20), black, x, 0.36, s * 0.8, g); w.rotation.x = Math.PI / 2;
    const r = add(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 14), chrome, x, 0.36, s * 0.8, g, nc); r.rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(0.42, 0.06, 6, 16, Math.PI), black, x, 0.36, s * 0.9, g, nc); }
  for (const s of [-1, 1]) { add(box(0.05, 0.16, 0.38), headM, 2.42, 0.68, s * 0.58, g, nc); add(box(0.05, 0.14, 0.34), tailM, -2.42, 0.74, s * 0.6, g, nc); add(box(0.25, 0.06, 0.12), black, 1.0, 0.95, s * 0.9, g, nc); }
  add(box(0.1, 0.18, 1.5), chrome, 2.43, 0.42, 0, g, nc); add(box(0.1, 0.18, 1.5), chrome, -2.43, 0.42, 0, g, nc);
  add(box(0.06, 0.2, 0.9), black, 2.41, 0.6, 0, g, nc);                                                // grille
  if (kind === 'taxi') {
    const chk = matOf(ctx, 'checker', () => ctx.texM(cv(256, 32, (c, w, h) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#141414' : '#f4f4f4'; c.fillRect(i * 16, j * 16, 16, 16); } }), 1, 1));
    for (const s of [-1, 1]) { const st = add(box(3.0, 0.14, 0.02), chk, -0.2, 0.74, s * 0.9, g, nc); st.material = chk;
      const d = SETS.canvasPlane(ctx, 0.9, 0.3, 256, g, { lit: true }); d.draw('n', (c, w, h) => { c.fillStyle = '#f2c21a'; c.fillRect(0, 0, w, h); c.fillStyle = '#141414'; c.font = '900 64px Arial Black, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(num, w / 2, h / 2 + 3); });
      d.mesh.position.set(-0.85, 0.55, s * 0.905); if (s < 0) d.mesh.rotation.y = Math.PI; }
    add(box(0.75, 0.24, 0.28), matOf(ctx, 'taxisign', () => new THREE.MeshBasicMaterial({ color: '#fff8e0' })), -0.4, 1.62, 0, g, nc);
    const ts = SETS.canvasPlane(ctx, 0.72, 0.2, 256, g); ts.draw('t', (c, w, h) => { c.fillStyle = '#fff8e0'; c.fillRect(0, 0, w, h); c.fillStyle = '#141414'; c.font = '900 52px Arial Black, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', w / 2, h / 2 + 3); });
    ts.mesh.position.set(-0.4, 1.62, 0.145); const ts2 = ts.mesh.clone(); ts2.position.z = -0.145; ts2.rotation.y = Math.PI; g.add(ts2);
  }
  if (kind === 'police') {
    for (const s of [-1, 1]) { add(box(3.6, 0.22, 0.02), matOf(ctx, 'pblue', () => toon({ color: '#1e3a8a' })), 0, 0.72, s * 0.9, g, nc);
      const d = SETS.canvasPlane(ctx, 1.4, 0.3, 256, g, { lit: true }); d.draw('p', (c, w, h) => { c.fillStyle = '#f4f4f6'; c.fillRect(0, 0, w, h); c.fillStyle = '#1e3a8a'; c.font = '900 50px Arial Black, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('POLICE', w / 2, h / 2 + 3); });
      d.mesh.position.set(-0.6, 0.98 - 0.05, s * 0.9); if (s < 0) d.mesh.rotation.y = Math.PI; }
    add(box(0.3, 0.14, 1.2), black, -0.4, 1.56, 0, g, nc); add(box(0.28, 0.14, 0.5), matOf(ctx, 'pr', () => new THREE.MeshBasicMaterial({ color: '#ff2a2a' })), -0.4, 1.62, -0.32, g, nc);
    add(box(0.28, 0.14, 0.5), matOf(ctx, 'pb', () => new THREE.MeshBasicMaterial({ color: '#2a5aff' })), -0.4, 1.62, 0.32, g, nc);
  }
  return { g };
}
function txt(g, s, x, y, size, col) { g.font = `900 ${size}px Arial Black, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = size * 0.14; g.strokeStyle = '#141020'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// ---------- painted bits ----------
const snowView = (night) => cv(1024, 512, (g, w, h) => {                                // the snowy street seen through a window
  const gr = g.createLinearGradient(0, 0, 0, h); if (night) { gr.addColorStop(0, '#1a2244'); gr.addColorStop(1, '#4a5a8a'); } else { gr.addColorStop(0, '#b8c4d4'); gr.addColorStop(1, '#e8eef4'); }
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9; i++) { const x = i * 120 - 20, bw = 100, bh = 150 + rnd(i) * 120; g.fillStyle = night ? '#2a3050' : ['#b8a890', '#a8b4c4', '#c8b0a0'][i % 3]; g.fillRect(x, h - bh, bw, bh);
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x - 8, h - bh + 4); g.lineTo(x + bw / 2, h - bh - 40); g.lineTo(x + bw + 8, h - bh + 4); g.fill();
    g.fillStyle = night ? '#ffd27a' : '#5a6a80'; for (const wx of [18, 62]) g.fillRect(x + wx, h - bh + 40, 22, 30); }
  g.fillStyle = '#ffffff'; g.fillRect(0, h - 40, w, 40); for (let i = 0; i < 260; i++) { g.globalAlpha = 0.7; g.beginPath(); g.arc(rnd(i * 3) * w, rnd(i * 7) * h, 1.5 + rnd(i) * 2.5, 0, 7); g.fill(); } g.globalAlpha = 1; });
const desertSky = cv(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6ab0f0'); gr.addColorStop(1, '#ffe0b0'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c86a3a'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * 0.62); g.lineTo(140, h * 0.6); g.lineTo(180, h * 0.45); g.lineTo(380, h * 0.45); g.lineTo(420, h * 0.62); g.lineTo(700, h * 0.66); g.lineTo(740, h * 0.5); g.lineTo(900, h * 0.5); g.lineTo(940, h * 0.66); g.lineTo(w, h * 0.68); g.lineTo(w, h); g.fill();
  g.fillStyle = '#e8a060'; g.fillRect(0, h * 0.8, w, h * 0.2); });
const poster = (bg, lines) => board(bg, lines);

function windowView(ctx, G, x, y, z, w, h, night) {                                     // a painted view placed just behind a window hole
  const v = SETS.canvasPlane(ctx, w * 1.6, h * 1.6, 1024, G); v.draw(night ? 'n' : 'd', (g, cw, ch) => g.drawImage(snowView(night), 0, 0, cw, ch)); v.mesh.position.set(x, y, z - 0.6); return v;
}
function snowRoof(ctx, cg, w, h, d) {                                                   // white snow on both slopes of a cottage roof
  const { add, box, toon } = ctx, e = d / 2 + 0.25, rh = 1.7, L = Math.hypot(e, rh), a = Math.atan2(rh, e), white = matOf(ctx, 'snow', () => toon({ color: '#f6f8fc' }));
  for (const s of [-1, 1]) { const m = add(box(w + 0.3, 0.1, L + 0.05), white, 0, h + rh / 2 + 0.06, s * e / 2, cg, { cast: false }); m.rotation.x = s * a; }
}
function bench(ctx, G, x, z, ry = 0) { const { THREE, add, box, toon } = ctx, g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
  const wood = toon({ color: '#8a5a30' }), iron = toon({ color: '#2a2a2e' });
  for (let i = 0; i < 3; i++) add(box(1.8, 0.05, 0.12), wood, 0, 0.45, -0.15 + i * 0.15, g); for (let i = 0; i < 2; i++) add(box(1.8, 0.12, 0.04), wood, 0, 0.65 + i * 0.18, -0.25, g);
  for (const s of [-1, 1]) { add(box(0.06, 0.45, 0.5), iron, s * 0.8, 0.22, -0.05, g); add(box(0.06, 0.5, 0.06), iron, s * 0.8, 0.7, -0.27, g); }
  add(box(1.85, 0.06, 0.5), toon({ color: '#f6f8fc' }), 0, 0.5, -0.02, g, { cast: false }); return g; }
function table(ctx, G, x, z, r = 0.6, h = 0.78, col = '#a8784a') { const { THREE, add, toon } = ctx; add(new THREE.CylinderGeometry(r, r, 0.06, 24), toon({ color: col }), x, h, z, G);
  add(new THREE.CylinderGeometry(0.06, 0.08, h, 10), toon({ color: '#5a3a20' }), x, h / 2, z, G); add(new THREE.CylinderGeometry(0.35, 0.4, 0.04, 16), toon({ color: '#5a3a20' }), x, 0.02, z, G); }
function desk(ctx, G, x, z, col = '#6a4a2a') { const { add, box, toon } = ctx; add(box(1.8, 0.08, 0.8), toon({ color: col }), x, 0.76, z, G); for (const s of [-1, 1]) add(box(0.06, 0.74, 0.74), toon({ color: col }), x + s * 0.85, 0.37, z, G); }
function rv(ctx, G) { const { THREE, add, box, toon } = ctx, g = new THREE.Group(); G.add(g); const w = toon({ color: '#f2eee4' }), br = toon({ color: '#8a5a2a' }), gl = toon({ color: '#2a3a4a' }), blk = toon({ color: '#141418' });
  add(box(6.2, 2.4, 2.3), w, -0.6, 1.75, 0, g); add(box(1.6, 1.6, 2.2), w, 3.2, 1.35, 0, g); add(box(0.9, 0.8, 2.22), gl, 3.6, 1.75, 0, g);
  for (const s of [-1, 1]) { add(box(6.2, 0.18, 0.02), br, -0.6, 1.2, s * 1.16, g, { cast: false }); add(box(6.2, 0.1, 0.02), toon({ color: '#e8a020' }), -0.6, 1.4, s * 1.16, g, { cast: false });
    for (const x of [-2.6, -1.2, 0.6]) add(box(0.9, 0.6, 0.02), gl, x, 2.2, s * 1.16, g, { cast: false }); }
  add(box(0.8, 1.7, 0.03), toon({ color: '#e0dcd0' }), 1.6, 1.35, 1.17, g, { cast: false });
  for (const s of [-1, 1]) for (const x of [-2.4, 2.8]) { const wh = add(new THREE.CylinderGeometry(0.48, 0.48, 0.32, 18), blk, x, 0.48, s * 1.05, g); wh.rotation.x = Math.PI / 2; }
  add(box(1.2, 0.1, 2.4), toon({ color: '#c8c8c0' }), -0.6, 3.0, 0, g); return g; }

export const build = (ctx) => {
  const { THREE, add, box, tbox, toon, texM, P } = ctx;
  SETS.houseLightsOff(ctx);
  const grp = (k) => { const g = new THREE.Group(); g.position.set(...B[k]); ctx.world.add(g); return g; };
  const white = toon({ color: '#f4f6fa' }), basic = (c) => new THREE.MeshBasicMaterial({ color: c }), dark = toon({ color: '#1e1e24' });

  // ===== the town: a snowy main street (road along x), cottages both sides, car wash, chicken shop, park, burrito truck =====
  const T = grp('town');
  add(tbox(160, 0.1, 60, 1), texM(P.stone(95, 30, 8, 60), 30, 12, '#eef2f8'), 0, -0.05, 0, T, { cast: false });   // snow everywhere
  add(tbox(160, 0.1, 7, 1), texM(P.stone(94, 30, 6, 30, 64, 64), 30, 2, '#6e727a'), 0, 0.0, 0, T, { cast: false });  // the road, slushy
  for (let x = -70; x < 70; x += 3) add(box(1.4, 0.012, 0.14), basic('#e8e4d0'), x, 0.06, 0, T, { cast: false });
  for (const s of [-1, 1]) { add(box(160, 0.16, 2.6), toon({ color: '#d8dee6' }), 0, 0.08, s * 4.8, T, { cast: false }); add(box(160, 0.2, 0.16), toon({ color: '#c8ccd2' }), 0, 0.1, s * 3.5, T); }
  const walls = ['brick', 'plaster', 'stone', 'plasterB', 'brick', 'stoneB'], doors = ['#2a3a5a', '#5a2a2a', '#2a4a3a', '#6a4a1a', '#3a2a4a'];
  const house = (x, z, ry, i, lit = [0, 1]) => { const c = SETS.cottage(ctx, T, { x, z, w: 7.2, h: 4.4, d: 5, wall: walls[i % 6], roof: i % 2 ? 'slate' : 'tile', door: doors[i % 5], seed: 30 + i, ry, lit }); snowRoof(ctx, c.g, 7.2, 4.4, 5); return c; };
  [-38, -30, -14, -6.4, 0.8, 8, 16, 24, 32, 40].forEach((x, i) => { if (x === -6.4) x = -8; house(x, -9, Math.PI, i); });
  [-38, -30, -22, -14, -6, 20, 28, 36].forEach((x, i) => house(x, 11.5, 0, i + 3));
  for (const x of [-34, -18, -2, 12, 28]) for (const s of [-1, 1]) { const lg = new THREE.Group(); T.add(lg); SETS.streetLamp(ctx, lg, x, s * 4.4, { h: 3.4, on: true }); }
  // the car wash
  const cw = new THREE.Group(); cw.position.set(-22, 0, -6.2); T.add(cw);
  for (const [px, pz] of [[-3.4, -2.6], [3.4, -2.6], [-3.4, 2.4], [3.4, 2.4]]) add(box(0.25, 3.4, 0.25), toon({ color: '#2a6ab0' }), px, 1.7, pz, cw);
  add(box(7.2, 0.35, 5.4), toon({ color: '#2a6ab0' }), 0, 3.5, 0, cw); add(box(7.4, 0.12, 5.6), white, 0, 3.75, 0, cw, { cast: false });
  const cws = SETS.canvasPlane(ctx, 4.6, 0.9, 512, cw, { lit: true }); cws.draw('s', sign('SUDS CAR WASH', '#ffd23f', '#1a3a7a')); cws.mesh.position.set(0, 4.25, 2.75);
  for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(0.45, 0.45, 2.4, 14), toon({ color: '#e83a6a' }), s * 2.8, 1.4, -0.6, cw); }
  const wcar = vehicle(ctx, cw, { kind: 'car', color: '#3a6aa8' }); wcar.g.position.set(-0.6, 0, -0.4);
  // the chicken shop
  const ck = new THREE.Group(); ck.position.set(-8, 0, -6.45); T.add(ck);
  const cks = SETS.canvasPlane(ctx, 5.0, 1.0, 512, ck, { lit: true }); cks.draw('s', sign('CLUCK PALACE', '#c41e1e', '#ffd23f')); cks.mesh.position.set(0, 3.2, 0.06);
  const bucket = add(new THREE.CylinderGeometry(1.1, 0.8, 1.6, 20), texM(cv(256, 64, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#c41e1e' : '#ffffff'; g.fillRect(i * 16, 0, 16, h); } }), 3, 1), 2.4, 6.6, -2.5, ck);
  for (let i = 0; i < 8; i++) add(new THREE.SphereGeometry(0.32, 10, 8), toon({ color: '#d89040' }), 2.4 + Math.cos(i) * 0.55, 7.5, -2.5 + Math.sin(i) * 0.55, ck);
  add(box(3.0, 1.0, 0.6), toon({ color: '#f4f4f0' }), -1.6, 0.5, 0.35, ck); add(box(3.1, 0.06, 0.66), toon({ color: '#c8c8c8' }), -1.6, 1.02, 0.35, ck);
  // the park with a bench, a snowman and trees
  bench(ctx, T, 10, 7.4, Math.PI);
  for (const [x, z] of [[6, 8.5], [14.5, 9], [8, 10.5], [17, 7.2]]) SETS.tree(ctx, T, x, z, 1.1);
  for (let i = 0; i < 12; i++) add(box(0.08, 0.9, 0.08), toon({ color: '#3a3a40' }), 4.4 + i * 1.2, 0.45, 6.2, T); add(box(14, 0.06, 0.06), toon({ color: '#3a3a40' }), 11, 0.85, 6.2, T);
  const sm = new THREE.Group(); sm.position.set(13.5, 0, 7.6); T.add(sm);
  for (const [y, r] of [[0.45, 0.5], [1.15, 0.36], [1.65, 0.25]]) add(new THREE.SphereGeometry(r, 16, 12), white, 0, y, 0, sm);
  add(new THREE.ConeGeometry(0.05, 0.3, 8), toon({ color: '#ff7a1a' }), 0, 1.65, 0.38, sm).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.035, 6, 6), dark, s * 0.08, 1.72, 0.23, sm, { cast: false });
  add(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12), dark, 0, 1.95, 0, sm); add(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 12), dark, 0, 1.82, 0, sm);
  // Toro's burrito truck
  const bt = new THREE.Group(); bt.position.set(22, 0, -1.4); T.add(bt);
  add(box(4.4, 2.6, 2.3), toon({ color: '#c41e1e' }), -0.9, 1.75, 0, bt); add(box(1.8, 1.9, 2.2), toon({ color: '#e8a020' }), 2.1, 1.35, 0, bt); add(box(0.9, 0.8, 2.22), toon({ color: '#24344a' }), 2.55, 1.85, 0, bt);
  add(box(2.2, 1.0, 0.04), dark, -0.9, 1.8, 1.16, bt, { cast: false }); add(box(2.6, 0.08, 0.8), toon({ color: '#ffd23f' }), -0.9, 2.42, 1.5, bt).rotation.x = 0.3;
  const bts = SETS.canvasPlane(ctx, 4.0, 0.7, 512, bt, { lit: true }); bts.draw('s', sign("TORO'S BURRITOS", '#ffd23f', '#c41e1e')); bts.mesh.position.set(-0.9, 2.75, 1.17);
  add(box(4.42, 0.1, 2.32), white, -0.9, 3.1, 0, bt, { cast: false });
  for (const s of [-1, 1]) for (const x of [-2.2, 2.1]) { const w = add(new THREE.CylinderGeometry(0.48, 0.48, 0.34, 18), dark, x, 0.48, s * 1.0, bt); w.rotation.x = Math.PI / 2; }
  const cs = SETS.canvasPlane(ctx, 1.3, 0.5, 256, T, { lit: true }); cs.draw('c', sign('CLOSED BY HEALTH DEPT?', '#ffffff', '#c41e1e')); cs.mesh.position.set(26.5, 0.9, 1.2); cs.mesh.rotation.y = -0.3;
  // parked cars
  for (const [x, col] of [[-28, '#8a2a2a'], [4, '#2a2a30'], [36, '#e8e8ec']]) { const c = vehicle(ctx, T, { kind: 'car', color: col }); c.g.position.set(x, 0, 2.3); add(box(4.6, 0.12, 1.8), white, x, 1.55, 2.3, T, { cast: false }); }

  // ===== hospital room =====
  const H = grp('hosp');
  roomShell(ctx, H, { w: 8, d: 7, h: 3.2, wall: toon({ color: '#cfe8e0' }), floor: texM(P.planks(91), 3, 3, '#b8c4c8'), ceil: white, win: [1.0, 3.2, 1.0, 2.6] });
  windowView(ctx, H, 2.1, 1.8, -3.5, 2.2, 1.6, false);
  add(box(2.1, 0.5, 1.0), toon({ color: '#c8ccd4' }), -2.0, 0.55, -2.4, H); add(box(2.0, 0.2, 0.95), white, -2.0, 0.9, -2.4, H); add(box(0.5, 0.15, 0.8), white, -2.8, 1.05, -2.4, H);
  add(box(2.0, 0.12, 0.96), toon({ color: '#8ac0e8' }), -1.8, 1.0, -2.4, H);
  const mon = SETS.canvasPlane(ctx, 0.7, 0.5, 256, H, { lit: true }); mon.mesh.position.set(0.0, 1.9, -3.38); add(box(0.8, 0.6, 0.1), dark, 0.0, 1.9, -3.45, H);
  add(box(0.05, 1.6, 0.05), toon({ color: '#a8acb4' }), -0.9, 0.8, -3.0, H); add(box(0.3, 0.4, 0.12), toon({ color: '#e8f0f8' }), -0.9, 1.7, -3.0, H);
  const xr = SETS.canvasPlane(ctx, 0.9, 1.1, 256, H, { lit: true }); xr.draw('x', (g, w, h) => { g.fillStyle = '#0a0e14'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8d8e8'; g.lineWidth = 6;
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * 55, h / 2, 45, 100, 0, 0, 7); g.stroke(); } g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(w / 2 - 50, h / 2 - 20, 14, 0, 7); g.fill(); });
  xr.mesh.position.set(-3.2, 1.8, -3.38);

  // ===== the Gray kitchen =====
  const Kt = grp('kitchen');
  roomShell(ctx, Kt, { w: 8, d: 7, h: 3.0, wall: toon({ color: '#f2dca0' }), floor: texM(P.planks(92), 3, 3, '#c89a6a'), ceil: white, win: [-1.2, 0.8, 1.2, 2.4] });
  windowView(ctx, Kt, -0.2, 1.8, -3.5, 2.0, 1.2, false);
  add(box(8, 0.9, 0.65), toon({ color: '#5a8a7a' }), 0, 0.45, -3.15, Kt); add(box(8, 0.06, 0.7), toon({ color: '#e8e0d0' }), 0, 0.92, -3.15, Kt);
  add(box(0.9, 2.0, 0.7), toon({ color: '#e8ecf0' }), 3.0, 1.0, -3.0, Kt); add(box(0.04, 0.5, 0.04), dark, 2.62, 1.3, -2.64, Kt, { cast: false });
  for (const x of [-3.2, -2.4, 1.6, 2.2]) add(box(0.7, 0.7, 0.35), toon({ color: '#5a8a7a' }), x, 2.2, -3.3, Kt);
  table(ctx, Kt, 0.5, -1.0, 0.65);
  const bowl = add(new THREE.CylinderGeometry(0.22, 0.14, 0.14, 16), toon({ color: '#3a8ae8' }), 0.85, 0.88, -1.2, Kt); bowl.visible = false;
  const box2 = add(box(0.2, 0.3, 0.08), toon({ color: '#ffd23f' }), 0.15, 0.96, -0.7, Kt); box2.visible = false;
  const chalk = SETS.canvasPlane(ctx, 1.5, 1.0, 512, Kt, { lit: true }); chalk.mesh.position.set(-2.6, 1.8, -3.44); chalk.mesh.visible = false;
  chalk.draw('c', (g, w, h) => { g.fillStyle = '#1e3a2a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a5a2a'; g.lineWidth = 18; g.strokeRect(0, 0, w, h); g.fillStyle = '#f4f4ee'; g.font = '700 54px Comic Sans MS, Arial';
    g.fillText('H2O + C8H10N4O2', 30, 90); g.fillText('= TUNA?', 30, 170); g.fillText('MEOW = NO', 30, 250); g.font = '700 40px Comic Sans MS, Arial'; g.fillText('Quiz on Friday!', 30, 320); });
  const fridgeNote = SETS.canvasPlane(ctx, 0.3, 0.3, 128, Kt, { lit: true }); fridgeNote.draw('n', sign('B-DAY', '#ffd23f', '#1a1a1a')); fridgeNote.mesh.position.set(3.0, 1.5, -2.64);

  // ===== bathroom (the camera is the mirror) =====
  const Bt = grp('bath');
  roomShell(ctx, Bt, { w: 5, d: 5, h: 2.8, wall: texM(cv(128, 128, (g, w, h) => { g.fillStyle = '#d8eaf4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a8c0d0'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); } }), 2, 2), floor: texM(P.planks(93), 2, 2, '#a8b8c8'), ceil: white });
  add(box(1.4, 2.0, 0.1), toon({ color: '#ffffff' }), 1.4, 1.0, -2.4, Bt); add(box(1.3, 1.6, 0.04), basic('#b8d8e8'), 1.4, 1.2, -2.34, Bt, { cast: false });
  add(box(0.8, 0.06, 0.06), toon({ color: '#c8ccd4' }), -1.3, 1.4, -2.42, Bt); add(box(0.6, 0.9, 0.05), toon({ color: '#e85a7a' }), -1.3, 1.0, -2.4, Bt);
  const lightBar = add(box(1.2, 0.08, 0.08), basic('#fff6d8'), 0, 2.5, 0.7, Bt, { cast: false });
  add(box(0.9, 0.12, 0.5), white, 0, 0.85, 0.55, Bt); add(new THREE.CylinderGeometry(0.18, 0.2, 0.08, 16), toon({ color: '#e8f0f8' }), 0, 0.92, 0.55, Bt);
  const razor = add(box(0.04, 0.2, 0.04), toon({ color: '#3a8ae8' }), 0.3, 0.98, 0.5, Bt, { cast: false });

  // ===== bedroom at 3 a.m. =====
  const Bd = grp('bed');
  roomShell(ctx, Bd, { w: 7, d: 6, h: 2.8, wall: toon({ color: '#3a4a7a' }), floor: texM(P.planks(94), 3, 3, '#6a4a3a'), ceil: toon({ color: '#2a3a5a' }), win: [0.8, 2.6, 1.0, 2.3] });
  windowView(ctx, Bd, 1.7, 1.65, -3.0, 1.8, 1.3, true);
  add(box(2.2, 0.45, 2.4), toon({ color: '#5a3a2a' }), -0.2, 0.25, -1.6, Bd); add(box(2.1, 0.25, 2.2), toon({ color: '#e8e0f0' }), -0.2, 0.55, -1.5, Bd);
  add(box(2.15, 0.12, 1.5), toon({ color: '#6a5aa8' }), -0.2, 0.7, -1.0, Bd); add(box(2.3, 1.1, 0.12), toon({ color: '#5a3a2a' }), -0.2, 0.75, -2.8, Bd);
  add(box(0.5, 0.5, 0.45), toon({ color: '#5a3a2a' }), -1.65, 0.25, -2.4, Bd);
  const phone = add(box(0.16, 0.02, 0.3), dark, -1.6, 0.52, -2.35, Bd); const phoneGlow = add(box(0.14, 0.022, 0.27), basic('#bfe0ff'), -1.6, 0.525, -2.35, Bd, { cast: false });
  const clk = SETS.canvasPlane(ctx, 0.3, 0.14, 256, Bd, { lit: true }); clk.draw('c', (g, w, h) => { g.fillStyle = '#100808'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff2a2a'; g.font = '900 96px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('3:00', w / 2, h / 2 + 4); });
  clk.mesh.position.set(-1.75, 0.6, -2.5);
  const bedL = new THREE.PointLight('#9ac0ff', 0, 4, 1.5); bedL.position.set(-1.6, 0.9, -2.2); Bd.add(bedL);

  // ===== BrainCorp lobby =====
  const Co = grp('corp');
  roomShell(ctx, Co, { w: 14, d: 10, h: 5, wall: toon({ color: '#eef2f6' }), floor: texM(P.stone(95, 30, 8, 60), 4, 4, '#d8dce4'), ceil: white, win: [-6.8, 6.8, 0.2, 4.8] });
  windowView(ctx, Co, 0, 2.5, -5, 10, 5, false);
  for (let i = -3; i <= 3; i++) add(box(0.1, 4.8, 0.1), toon({ color: '#8a96a8' }), i * 2, 2.5, -4.95, Co, { cast: false });
  add(box(6, 0.3, 2.4), toon({ color: '#2a3a5a' }), -0.8, 0.15, -3.2, Co); add(box(0.8, 1.1, 0.5), toon({ color: '#f4f4f0' }), -0.1, 0.85, -2.8, Co);
  const logo = SETS.canvasPlane(ctx, 4.5, 1.1, 512, Co, { lit: true }); logo.draw('l', sign('BrainCorp', '#1e2a4a', '#8ad0ff')); logo.mesh.position.set(-0.8, 3.6, -4.7);
  const ban = SETS.canvasPlane(ctx, 5.5, 0.8, 512, Co, { lit: true }); ban.draw('b', sign('WELCOME WENDELL!', '#ffd23f', '#1e2a4a')); ban.mesh.position.set(-0.8, 2.6, -4.7);
  for (const x of [-5.5, 4.5]) { add(new THREE.CylinderGeometry(0.4, 0.3, 0.7, 14), toon({ color: '#f4f4f0' }), x, 0.35, -3.8, Co); add(new THREE.SphereGeometry(0.6, 12, 10), toon({ color: '#3a8a4a' }), x, 1.1, -3.8, Co); }

  // ===== Jordy's tattoo studio =====
  const Ta = grp('tattoo');
  roomShell(ctx, Ta, { w: 7, d: 6, h: 3.0, wall: toon({ color: '#2a2230' }), floor: texM(P.planks(95), 3, 3, '#3a3030'), ceil: toon({ color: '#1a1420' }) });
  const big = SETS.canvasPlane(ctx, 2.6, 1.3, 512, Ta, { lit: true }); big.mesh.position.set(0, 2.0, -2.94);
  big.draw('b', (g, w, h) => { g.fillStyle = '#f4ead0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1a1a1a'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); txt(g, 'DUDE,', w / 2, h * 0.33, h * 0.24, '#c41e3a'); txt(g, 'CHEMISTRY!', w / 2, h * 0.68, h * 0.24, '#1a6ab0'); });
  for (let i = 0; i < 6; i++) { const p = SETS.canvasPlane(ctx, 0.55, 0.7, 256, Ta, { lit: true }); p.mesh.position.set(-2.9 + (i % 3) * 0.7, 1.4 + Math.floor(i / 3) * 0.85, -2.94);
    p.draw('p' + i, (g, w, h) => { g.fillStyle = '#f4f0e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2c9a6'; g.beginPath(); g.ellipse(w * 0.32, h * 0.5, w * 0.24, h * 0.3, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(w * 0.68, h * 0.5, w * 0.24, h * 0.3, 0, 0, 7); g.fill();
      g.strokeStyle = '#c89070'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, h * 0.22); g.lineTo(w / 2, h * 0.78); g.stroke(); g.fillStyle = '#1a3a7a'; g.font = `900 ${h * 0.08}px Arial Black, Arial`; g.textAlign = 'center'; g.fillText('DUDE, CHEM!', w / 2, h * 0.56);
      g.fillStyle = '#1a1a1a'; g.font = `700 ${h * 0.07}px Arial`; g.fillText('#' + (i + 1), w / 2, h * 0.93); }); }
  const neon = SETS.canvasPlane(ctx, 1.4, 0.5, 256, Ta); neon.draw('n', (g, w, h) => { g.fillStyle = '#100a14'; g.fillRect(0, 0, w, h); g.shadowColor = '#ff3ac8'; g.shadowBlur = 20; g.fillStyle = '#ff6ad8'; g.font = 'italic 900 80px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('INK', w / 2, h / 2); });
  neon.mesh.position.set(2.2, 2.3, -2.94);
  add(box(0.8, 0.5, 1.8), toon({ color: '#141418' }), 1.4, 0.45, -1.8, Ta); add(box(0.8, 0.7, 0.2), toon({ color: '#141418' }), 1.4, 0.9, -2.6, Ta);
  const tatL = new THREE.PointLight('#ffd8f0', 3, 6, 1.4); tatL.position.set(0.3, 2.6, -1); Ta.add(tatL);

  // ===== Rick's garage and his rocks =====
  const Ga = grp('garage');
  roomShell(ctx, Ga, { w: 8, d: 7, h: 3.0, wall: texM(P.plaster(96, 30), 3, 1, '#b8b4ac'), floor: texM(P.stone(95, 30, 8, 40), 3, 3, '#8a8a88'), ceil: white });
  const shelfM = toon({ color: '#6a4a2a' }), rocks = [];
  for (let r = 0; r < 4; r++) { add(box(5.4, 0.06, 0.45), shelfM, 0, 0.6 + r * 0.55, -3.2, Ga);
    for (let i = 0; i < 9; i++) { const geo = [new THREE.DodecahedronGeometry(0.13), new THREE.IcosahedronGeometry(0.12), new THREE.OctahedronGeometry(0.13)][(i + r) % 3];
      const m = add(geo, toon({ color: ['#c8a0e8', '#8ad0c8', '#e8a060', '#a8a8b0', '#e86a8a', '#8ab0e8', '#e8d070'][(i * 3 + r) % 7] }), -2.4 + i * 0.6, 0.76 + r * 0.55, -3.15, Ga); m.rotation.set(i, r, i + r); rocks.push(m); } }
  for (const s of [-1, 1]) add(box(0.06, 2.4, 0.45), shelfM, s * 2.72, 1.2, -3.2, Ga);
  const rs = SETS.canvasPlane(ctx, 2.6, 0.45, 512, Ga, { lit: true }); rs.draw('s', sign("RICK'S MINERALS - DO NOT TOUCH", '#ffd23f', '#1a1a1a')); rs.mesh.position.set(0, 2.85, -3.35);
  add(box(1.8, 0.9, 0.7), toon({ color: '#5a5a62' }), 3.0, 0.45, -1.8, Ga); add(new THREE.CylinderGeometry(0.25, 0.3, 0.12, 14), toon({ color: '#1a2a5a' }), 3.0, 1.0, -1.8, Ga);
  const sack = add(new THREE.SphereGeometry(0.3, 12, 10), toon({ color: '#c8a870' }), 1.6, 0.5, -1.2, Ga); sack.visible = false;

  // ===== Ted's office =====
  const Of = grp('office');
  roomShell(ctx, Of, { w: 8, d: 7, h: 3.0, wall: toon({ color: '#c8d4e4' }), floor: texM(P.planks(97), 3, 3, '#8a8e98'), ceil: white, win: [-3.6, -0.6, 1.0, 2.6] });
  windowView(ctx, Of, -2.1, 1.8, -3.5, 2.6, 1.6, false);
  desk(ctx, Of, 1.6, -2.4); add(box(0.7, 0.45, 0.05), dark, 1.6, 1.05, -2.6, Of); add(new THREE.CylinderGeometry(0.2, 0.15, 0.35, 12), toon({ color: '#e8e8e8' }), 2.3, 0.98, -2.3, Of);
  const photo = SETS.canvasPlane(ctx, 0.22, 0.28, 128, Of, { lit: true }); photo.draw('p', (g, w, h) => { g.fillStyle = '#8a5a2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8e8f8'; g.fillRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#f2c9a6'; g.beginPath(); g.arc(w / 2, h * 0.45, 26, 0, 7); g.fill(); g.fillStyle = WEN_HAIR; g.beginPath(); g.arc(w / 2, h * 0.36, 26, Math.PI, 0); g.fill(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 3; g.strokeRect(w / 2 - 18, h * 0.42, 14, 10); g.strokeRect(w / 2 + 4, h * 0.42, 14, 10); });
  photo.mesh.position.set(0.95, 0.94, -2.3); photo.mesh.rotation.y = 0.4;
  add(box(0.5, 1.2, 0.5), toon({ color: '#6aa8d8' }), -3.2, 0.6, -2.6, Of); add(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12), basic('#bfe0ff'), -3.2, 1.45, -2.6, Of);

  // ===== Sal's office =====
  const Sa = grp('sal');
  roomShell(ctx, Sa, { w: 8, d: 7, h: 3.0, wall: toon({ color: '#e8d8a8' }), floor: texM(P.planks(98), 3, 3, '#8a2a3a'), ceil: white });
  const sp = SETS.canvasPlane(ctx, 2.8, 1.2, 512, Sa, { lit: true }); sp.mesh.position.set(0.4, 2.1, -3.44);
  sp.draw('s', (g, w, h) => { g.fillStyle = '#ffd23f'; g.fillRect(0, 0, w, h); g.fillStyle = '#c41e3a'; g.fillRect(0, 0, w, h * 0.22); txt(g, 'SAL BESTMAN, LAWYER', w / 2, h * 0.11, h * 0.12, '#ffffff');
    txt(g, 'GOT A PROBLEM?', w * 0.62, h * 0.45, h * 0.15, '#1a2a6a'); txt(g, 'I GOT A SUIT!', w * 0.62, h * 0.72, h * 0.15, '#c41e3a');
    g.fillStyle = '#f0c8a8'; g.beginPath(); g.arc(w * 0.15, h * 0.6, h * 0.2, 0, 7); g.fill(); g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(w * 0.15, h * 0.5, h * 0.2, Math.PI, 0); g.fill();
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(w * 0.12, h * 0.58, 6, 0, 7); g.arc(w * 0.18, h * 0.58, 6, 0, 7); g.fill(); g.beginPath(); g.arc(w * 0.15, h * 0.66, 18, 0.2, 2.9); g.stroke(); });
  desk(ctx, Sa, 0.4, -2.6, '#3a2a1a'); add(box(0.45, 0.06, 0.32), toon({ color: '#ffd23f' }), 0.9, 0.82, -2.5, Sa);
  for (const x of [-3.4, 3.4]) { add(new THREE.CylinderGeometry(0.22, 0.25, 3.0, 14), toon({ color: '#f4f0e4' }), x, 1.5, -3.2, Sa); }
  const vm = new THREE.Group(); vm.position.set(-2.4, 0, -2.6); Sa.add(vm);
  add(box(1.0, 2.0, 0.8), toon({ color: '#c41e1e' }), 0, 1.0, 0, vm); add(box(0.7, 1.3, 0.04), basic('#bfe0ff'), -0.08, 1.2, 0.41, vm, { cast: false });
  for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) add(box(0.12, 0.2, 0.06), toon({ color: ['#ffd23f', '#3a8ae8', '#e85a2a', '#3ac88a'][(r + i) % 4] }), -0.34 + i * 0.17, 0.7 + r * 0.3, 0.36, vm, { cast: false });
  const dent = add(new THREE.SphereGeometry(0.16, 10, 8), toon({ color: '#8a1414' }), 0.12, 1.4, 0.4, vm, { cast: false }); dent.scale.set(1, 1, 0.3);
  const lamp = new THREE.PointLight('#ffd8a0', 0, 5, 1.5); lamp.position.set(0.8, 1.4, -2.2); Sa.add(lamp);
  const brochure = add(box(0.3, 0.02, 0.22), toon({ color: '#e8f0f8' }), 0.0, 0.81, -2.4, Sa); brochure.visible = false;

  // ===== the desert, an RV =====
  const De = grp('desert');
  add(tbox(200, 0.1, 200, 1), texM(P.stone(95, 30, 8, 60), 40, 40, '#e0b07a'), 0, -0.05, 0, De, { cast: false });
  add(tbox(200, 0.02, 5, 1), toon({ color: '#5a5a5e' }), 0, 0.01, -4, De, { cast: false });
  const sky = SETS.canvasPlane(ctx, 240, 120, 1024, De); sky.draw('s', (g, w, h) => g.drawImage(desertSky, 0, 0, w, h)); sky.mesh.position.set(0, 40, -110);
  for (const [x, z, s] of [[-6, -9, 1.3], [5, -12, 1.0], [9, -6, 0.8], [-10, -4, 0.9], [14, -16, 1.4]]) { const cm = toon({ color: '#3a8a4a' }); add(new THREE.CylinderGeometry(0.25 * s, 0.3 * s, 2.6 * s, 10), cm, x, 1.3 * s, z, De);
    for (const d of [-1, 1]) { add(new THREE.CylinderGeometry(0.15 * s, 0.15 * s, 0.9 * s, 8), cm, x + d * 0.5 * s, 1.6 * s, z, De).rotation.z = Math.PI / 2; add(new THREE.CylinderGeometry(0.15 * s, 0.15 * s, 0.8 * s, 8), cm, x + d * 0.9 * s, 2.0 * s, z, De); } }
  const van = rv(ctx, De); van.position.set(-1.0, 0, -1.6);
  const chips = add(box(0.3, 0.4, 0.1), toon({ color: '#ff3a3a' }), 0, 0, 0, De, { cast: false }); chips.visible = false;

  return { mon, phoneGlow, bedL, rocks, sack, bowl, box2, chalk, lamp, brochure, razor, THREE };
};

export const update = (W, f, P) => {
  if (!P.rocks) return;
  P.mon.draw('m' + Math.floor(f / 3), (g, w, h) => { g.fillStyle = '#04140c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3aff8a'; g.lineWidth = 5; g.beginPath();
    for (let x = 0; x < w; x += 4) { const ph = (x + f * 6) % 120; g.lineTo(x, h * 0.55 - (ph > 50 && ph < 60 ? 70 : ph > 60 && ph < 66 ? -30 : 0)); } g.stroke(); g.fillStyle = '#3aff8a'; g.font = '700 30px monospace'; g.fillText('72', w - 60, 34); });
  const ring = W.ring && f % 20 < 12; P.phoneGlow.material.color.set(ring ? '#ffffff' : '#7a9ac0'); P.bedL.intensity = ring ? 2.5 : 0.3;
  P.rocks.forEach((r, i) => { r.visible = i >= W.stolen; }); P.sack.visible = W.stolen > 0;
  P.bowl.visible = P.box2.visible = !!W.breakfast; P.chalk.mesh.visible = !!W.chalk; P.lamp.intensity = W.salLamp ? 2.5 : 0; P.brochure.visible = !!W.salLamp;
};

// ---------- frame by frame ----------
export const worldAt = (f) => {
  const S = shotAt(f), id = S.id, w = (x, n = 0) => K.wordF(S, x, n);
  const W = { ring: id === 'ring', stolen: 0, breakfast: id === 'junior', chalk: id === 'cat', salLamp: id === 'sal' };
  if (id === 'steal') { const a = w('stole'), b = w('all'); W.stolen = f < a ? 0 : f < b ? 1 : Math.min(36, 1 + Math.floor(ramp(f, b, b + 14) * 35)); }
  return W;
};

export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [], w = (x, n = 0) => K.wordF(S, x, n);
  const A = (who, name, o, pos, s, x = {}) => out.push(actor(T, who, { seed: name.length * 7 + 3, blink: blinkAt(f, name.length * 7), bold: BOLD, talk: talking(S, f, name), ...o, who: name }, pos, { s, ...x }));
  const wendell = (o, pos, x) => A(f >= 0 && ['applause', 'hair'].includes(id) && !(id === 'hair' && f > lerp(S.a, S.b, 0.45)) ? BALD : (id === 'bald' && f >= w('bald')) || id === 'rv' ? BALD : WENDELL, 'wendell', o, pos, AS, x);
  const crowd = (i, o, pos, s = 0.74) => A(COATS[i % COATS.length], 'p' + i, o, pos, s);
  if (id === 'wash') { const cough = Math.floor(f / 6) % 2 && f < w('pity');
    wendell({ expr: cough ? 'pained' : 'nervous', R: 'reach', L: cough ? 'cheek' : 'hang', look: 0.4 }, POS.wenWash, { roll: cough ? 0.08 : 0 });
    crowd(0, { expr: f >= w('tipped') ? 'pained' : 'neutral', R: f >= w('tipped') ? 'reach' : 'hang', look: -0.6 }, POS.tipper); }
  if (id === 'doctor') { A(DOC, 'doc', { expr: 'neutral', R: 'hang', look: -0.6 }, POS.doc, AS);
    wendell({ expr: f >= w('insurance') ? 'shock' : f >= w('cancer') ? 'pained' : 'nervous', R: f >= w('insurance') ? 'phone' : 'hang', look: 0.3 }, POS.wenHosp); }
  if (id === 'call' || id === 'ego') wendell({ expr: id === 'ego' ? (f >= w('louder') ? 'dazed' : f >= w('no') ? 'stern' : 'nervous') : f >= w('pay') ? 'shock' : 'neutral', R: 'phone', look: id === 'ego' ? 0 : 0.3 }, POS.wenKit);
  if (id === 'applause') { A(BRAIN_M, 'brainM', { expr: 'grin', R: f < w('polite') ? 'point' : 'up', look: 0.6 }, POS.brainM, AS); A(BRAIN_F, 'brainF', { expr: 'smile', R: 'up', look: 0.5 }, POS.brainF, AS);
    wendell({ expr: f >= w('billion') ? 'pained' : 'smile', R: 'hang', look: -0.5 }, POS.wenCorp);
    for (let i = 0; i < 6; i++) { const clap = f >= w('polite') && Math.floor(f / 5 + i) % 2; crowd(i, { expr: 'neutral', R: clap ? 'up' : 'hang', L: clap ? 'up' : 'hang', look: -0.3 }, CORP(-3.6 + i * 1.3, 0, 0.6 + (i % 2) * 0.5)); } }
  if (id === 'hair' || id === 'bald') { const late = id === 'bald' && f >= w('bald');
    wendell({ expr: id === 'hair' ? (f > lerp(S.a, S.b, 0.45) ? 'pained' : 'smile') : late ? 'grin' : 'nervous', R: late ? 'up' : 'hang', look: 0 }, POS.wenBath); }
  if (id === 'tattoo') { A(JORDY, 'jordy', { expr: f >= w('chemistry') ? 'laugh' : 'grin', R: 'reach', look: 0.5 }, POS.jordy, JS);
    A(COATS[3], 'client', { expr: f >= w('butt') ? 'pained' : 'nervous', R: 'cheek', look: -0.5 }, POS.tatClient, 0.74, { roll: 0.25 });
    for (let i = 0; i < 3; i++) crowd(i + 4, { expr: 'nervous', R: 'cheek', L: 'cheek', look: -0.7 }, TAT(2.4 + i * 0.4, 0, -0.6 + i * 0.5)); }
  if (id === 'rocks' || id === 'steal') { const speech = id === 'rocks';
    A(RICK, 'rick', { expr: speech ? (f >= w('they') ? 'laugh' : 'grin') : 'grin', R: speech ? 'point' : 'up', look: speech ? -0.4 : -0.2 }, POS.rick, AS);
    A(MONA, 'mona', { expr: id === 'steal' ? 'grin' : 'dazed', R: id === 'steal' ? 'reach' : 'hang', look: id === 'steal' ? -0.7 : 0.4 }, id === 'steal' ? lerp3(POS.mona, GAR(1.8, 0, -2.2), smooth(ramp(f, S.a, S.b))) : POS.mona, AS); }
  if (id === 'ted') { A(SHELLY, 'shelly', { expr: f >= w('flirting') ? 'grin' : 'dazed', R: f >= w('flirting') ? 'cheek' : 'hang', look: 0.6 }, POS.shelly, AS);
    A(TED, 'ted', { expr: 'grin', R: 'up', look: -0.6 }, POS.ted, AS); }
  if (id === 'junior') { const fat = f >= w('gained'); A({ ...JUNIOR, stout: fat }, 'junior', { expr: f >= w('peace') ? 'laugh' : 'grin', R: 'reach', look: 0.2 }, POS.junior, fat ? 0.76 : JS); }
  if (id === 'chicken') { A(FREDO, 'fredo', { expr: 'stern', R: 'hang', look: 0 }, POS.fredo, AS); crowd(1, { expr: 'grin', R: 'up', look: -0.6 }, TOWN(-6.4, 0.16, -4.4)); }
  if (id === 'pigeons') A(MOE, 'moe', { expr: f >= w('lectured') ? 'stern' : 'neutral', R: f >= w('lectured') ? 'point' : 'hang', look: -0.3 }, POS.moe, 0.76);
  if (id === 'burrito') { A(TORO, 'toro', { expr: f >= w('hot') ? 'laugh' : 'grin', R: 'up', L: f >= w('hot') ? 'up' : 'hang', look: 0.4 }, POS.toro, AS);
    const run = smooth(ramp(f, w('health'), S.b)); A({ tunic: '#e8e8e8', shirt: '#3a5a8a', skin: '#f2c9a6', hair: '#8a6a3a', glasses: '#1a1a1a' }, 'inspector', { expr: f >= w('health') ? 'shock' : 'nervous', R: 'up', look: 0.8 }, lerp3(POS.inspector, TOWN(31, 0.16, 2.0), run), 0.76); }
  if (id === 'roaches') A(TIMMY, 'timmy', { expr: 'smile', R: 'up', look: 0.2 }, POS.timmy, 0.74, { roll: f >= w('polite') ? 0.12 * Math.sin(f * 0.25) : 0 });
  if (id === 'cat') wendell({ expr: f >= w('cat') ? 'grin' : 'dazed', R: 'point', look: 0.4 }, POS.wenKit);
  if (id === 'vending') { A(SALC, 'sal', { expr: 'grin', R: 'point', L: 'up', look: -0.5 }, POS.salOff, 0.76); A({ tunic: '#5a5a5a', skin: '#c99067', hair: '#141010', stout: true }, 'client', { expr: 'stern', R: 'up', look: 0.6 }, POS.client, 0.78); }
  if (id === 'ring') wendell({ expr: f >= w('rang') ? 'shock' : 'dazed', R: f >= w('rang') ? 'phone' : 'hang', look: -0.3 }, POS.wenBed);
  if (id === 'sal') A(SALC, 'sal', { expr: f >= w('mostly') ? 'nervous' : 'laugh', R: 'phone', L: f >= w('rv') ? 'up' : 'hang', look: 0 }, POS.salOff, 0.76);
  if (id === 'rv') { wendell({ expr: f >= w('great') ? 'grin' : 'stern', R: 'hang', look: 0.4 }, POS.wenRV); A(SALC, 'sal', { expr: f >= w('great') ? 'laugh' : 'grin', R: f >= w('great') ? 'up' : 'hang', look: -0.4 }, POS.salRV, 0.76); }
  return out;
};

// ---------- effects ----------
const bubble = (text, col = '#ffffff', tcol = '#1a1a1a') => (p) => { const g = p.g; g.save(); g.fillStyle = col; g.strokeStyle = '#1a1a1a'; g.lineWidth = 10;
  rr(g, 40, 260, 520, 300, 60); g.fill(); g.stroke(); g.beginPath(); g.moveTo(220, 556); g.lineTo(180, 680); g.lineTo(300, 556); g.fill(); g.restore(); txt(g, text, 300, 410, text.length > 8 ? 70 : 110, tcol); };
const cash = (t) => (p) => { const g = p.g; g.save(); g.translate(300, 500); g.rotate(Math.sin(t * 9) * 0.4); g.fillStyle = '#6ac86a'; g.strokeStyle = '#1a4a1a'; g.lineWidth = 8; g.fillRect(-160, -80, 320, 160); g.strokeRect(-160, -80, 320, 160); txt(g, '$1', 0, 0, 90, '#ffffff'); g.restore(); };
const cell = (t, k, big) => (p) => { const g = p.g; const y = 500 + Math.sin(t * 20 + k) * 30; g.fillStyle = big ? '#ff6a8a' : '#8ae86a'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 10;
  g.beginPath(); g.ellipse(300, y, 200, 170, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(240, y - 30, 20, 0, 7); g.arc(360, y - 30, 20, 0, 7); g.fill();
  g.beginPath(); g.ellipse(300, y + 60, 60, 45, 0, 0, 7); g.fill(); };
const pigeon = (t, k) => (p) => { const g = p.g; const hop = Math.abs(Math.sin(t * 8 + k)) * 40; g.save(); g.translate(300, 700 - hop);
  g.fillStyle = '#8a8e9a'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 10; g.beginPath(); g.ellipse(0, 0, 150, 100, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(110, -110, 60, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#6a3a8a'; g.beginPath(); g.ellipse(70, -40, 50, 40, 0, 0, 7); g.fill(); g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(165, -110); g.lineTo(215, -95); g.lineTo(165, -85); g.fill();
  g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(125, -120, 12, 0, 7); g.fill(); g.strokeStyle = '#e8a020'; g.lineWidth = 12; g.beginPath(); g.moveTo(-30, 90); g.lineTo(-30, 170); g.moveTo(40, 90); g.lineTo(40, 170); g.stroke(); g.restore(); };
const roach = (t, k) => (p) => { const g = p.g; g.save(); g.translate(300, 600); g.fillStyle = '#5a2a14'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 10; g.beginPath(); g.ellipse(0, 0, 170, 100, 0, 0, 7); g.fill(); g.stroke();
  for (let i = -1; i <= 1; i++) for (const s of [-1, 1]) { g.beginPath(); g.moveTo(i * 80, s * 80); g.lineTo(i * 80 + Math.sin(t * 30 + i) * 30, s * 160); g.stroke(); }
  g.fillStyle = '#c8a050'; g.fillRect(40, -200, 150, 110); g.strokeRect(40, -200, 150, 110); g.fillRect(90, -230, 50, 30); g.restore(); };
const catFx = (t) => (p) => { const g = p.g; g.save(); g.translate(300, 620); g.fillStyle = '#e8902a'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 12;
  g.beginPath(); g.ellipse(0, 80, 200, 150, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -150, 140, 0, 7); g.fill(); g.stroke();
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 60, -260); g.lineTo(s * 130, -360); g.lineTo(s * 135, -220); g.fill(); g.stroke(); }
  g.fillStyle = '#ffffff'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 55, -160, 42, 0, 7); g.fill(); g.stroke(); } g.fillStyle = '#1a1a1a'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 55, -160, 10, 30, 0, 0, 7); g.fill(); }
  g.lineWidth = 8; g.strokeStyle = '#3a8ae8'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 55, -160, 52, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(-3, -160); g.lineTo(3, -160); g.stroke();
  g.strokeStyle = '#1a1a1a'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, -95); g.lineTo(-20, -80); g.moveTo(0, -95); g.lineTo(20, -80); g.stroke(); g.restore(); };
const sparkle = (t) => (p) => { const g = p.g; g.save(); g.globalAlpha = 1 - t; g.fillStyle = '#ffffff'; g.translate(300, 500); g.rotate(t); for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.lineTo(22, 0); g.lineTo(0, -170 * (1 - t * 0.5)); g.lineTo(-22, 0); g.fill(); } g.restore(); };
const flame = (t) => (p) => { const g = p.g; for (let i = 0; i < 5; i++) { const x = 140 + i * 80, hgt = 300 + Math.sin(t * 25 + i * 2) * 120; const gr = g.createLinearGradient(0, 900, 0, 900 - hgt); gr.addColorStop(0, '#fff2a0'); gr.addColorStop(0.5, '#ff8a1a'); gr.addColorStop(1, 'rgba(255,40,10,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x - 60, 900); g.quadraticCurveTo(x, 900 - hgt * 1.4, x + 60, 900); g.fill(); } };
const heart = (t) => (p) => { const g = p.g; g.save(); g.translate(300, 500 - t * 200); g.globalAlpha = 1 - t; g.fillStyle = '#ff3a6a'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 10;
  g.beginPath(); g.moveTo(0, 120); g.bezierCurveTo(-260, -40, -120, -220, 0, -90); g.bezierCurveTo(120, -220, 260, -40, 0, 120); g.fill(); g.stroke(); g.restore(); };
const cough = (t) => (p) => { const g = p.g; g.save(); g.globalAlpha = 1 - t; g.fillStyle = '#e8eef4'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(300 + i * 60 * t * 3, 500 - i * 30, 70 + i * 20 * t, 0, 7); g.fill(); } g.restore(); };
const ringFx = (t) => (p) => { const g = p.g; g.save(); g.strokeStyle = '#ffffff'; g.lineCap = 'round'; for (let k = 0; k < 3; k++) { const r = (t + k / 3) % 1; g.globalAlpha = (1 - r) * 0.9; g.lineWidth = 16 * (1 - r) + 3; g.beginPath(); g.arc(300, 500, 70 + r * 240, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(300, 500, 70 + r * 240, Math.PI - 0.9, Math.PI + 0.9); g.stroke(); } g.restore(); };
const wig = (p) => { const g = p.g; g.fillStyle = WEN_HAIR; g.strokeStyle = '#1a1a1a'; g.lineWidth = 10; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(160 + (i % 5) * 70, 460 + Math.floor(i / 5) * 60, 60, 0, 7); g.fill(); g.stroke(); } };

export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [], w = (x, n = 0) => K.wordF(S, x, n), pop = (key, text, a, dur, pos, sc, col) => { if (f >= a && f < a + dur) out.push(fx(key + q(ramp(f, a, a + dur), 1), word(text, ramp(f, a, a + dur), col), pos, sc, { order: 8 })); };
  if (id === 'wash') { if (f < w('pity') && Math.floor(f / 6) % 2) out.push(fx('cg' + (f % 12), cough((f % 12) / 12), up(POS.wenWash, 1.4), 0.3, { order: 7 }));
    pop('cough', 'COUGH!', w('coughed'), 16, up(POS.wenWash, 2.0), 0.4, '#ffffff');
    if (f >= w('tipped')) { const t = ramp(f, w('tipped'), w('tipped') + 20); out.push(fx('cash' + q(t, 1), cash(t), lerp3(up(POS.tipper, 1.1), up(POS.wenWash, 1.0), smooth(t)), 0.22, { order: 7 })); } }
  if (id === 'doctor' && f >= w('insurance')) out.push(fx('ins', bubble('NOT HAVING CANCER?', '#ffffff', '#c41e3a'), up(POS.wenHosp, 2.2), 0.45, { order: 8 }));
  if (id === 'call') { pop('ok', 'BrainCorp', w('braincorp'), 22, KIT(-0.4, 2.2, -1.2), 0.5, '#8ad0ff'); if (f >= w('pay')) out.push(fx('$$', cash(f / 30), KIT(0.6, 1.8, -1.0), 0.18, { order: 7 })); }
  if (id === 'ego') { if (f >= w('no') && f < w('cancer')) out.push(fx('egoN', bubble('NO!', '#ff6a8a', '#ffffff'), KIT(-1.1, 2.1, -1.0), 0.5, { order: 8 }));
    if (f >= w('louder')) for (let k = 0; k < 7; k++) { const t = (f - w('louder')) / 30; out.push(fx('cl' + k + (f % 2), cell(t, k, false), KIT(-1.2 + (k % 4) * 0.45, 1.0 + Math.floor(k / 4) * 0.8 + (k % 2) * 0.15, -0.9), 0.14, { order: 7 })); out.push(fx('yes' + k, bubble('YES!', '#8ae86a', '#1a1a1a'), KIT(-1.2 + (k % 4) * 0.45, 1.35 + Math.floor(k / 4) * 0.8, -0.85), 0.14, { order: 8 })); }
    pop('said', 'YES.', w('said'), 18, KIT(-0.4, 2.1, -1.0), 0.45, '#ffd23f'); }
  if (id === 'applause') { pop('5k', '$5,000', w('five'), 22, CORP(-0.8, 3.0, -2.6), 0.6, '#c41e3a'); if (f >= w('polite')) pop('clap' + Math.floor(f / 10), 'clap.', w('polite') + Math.floor((f - w('polite')) / 10) * 10, 10, CORP(-2.5 + (Math.floor(f / 10) % 4) * 1.4, 2.4, 0.2), 0.3, '#ffffff'); }
  if (id === 'hair' && f > lerp(S.a, S.b, 0.45)) pop('sad', 'NOOO', w('devastated'), 20, BATH(0, 2.3, -1.4), 0.4, '#8ad0ff');
  if (id === 'tattoo') pop('dude', 'BZZZZ', w('artist'), 18, TAT(0.2, 1.9, -1.5), 0.35, '#ff6ad8');
  if (id === 'rocks') pop('min', 'MINERALS!', w('minerals'), 22, GAR(-0.5, 2.4, -1.2), 0.5, '#ffd23f');
  if (id === 'steal') pop('yoink', 'YOINK!', w('stole'), 16, GAR(1.3, 2.1, -1.2), 0.42, '#c8a0e8');
  if (id === 'ted' && f >= w('flirting')) for (let k = 0; k < 3; k++) { const t = ((f - w('flirting') + k * 12) % 36) / 36; out.push(fx('h' + k + q(t, 1), heart(t), OFF(0.1 + k * 0.2, 2.0, -1.4), 0.16, { order: 7 })); }
  if (id === 'junior') pop('40', '+40 LBS', w('gained'), 24, KIT(0.9, 2.2, -1.6), 0.5, '#e85a2a');
  if (id === 'chicken') for (let i = 0; i < 4; i++) { const k = (f + i * 9) % 30; if (k < 10) out.push(fx('sp' + i + k, sparkle(k / 10), TOWN(-9.6 + i * 0.9, 1.0 + (i % 2) * 0.6, -6.1), 0.25, { order: 7 })); }
  if (id === 'pigeons') for (let k = 0; k < 6; k++) out.push(fx('pg' + k + (Math.floor(f / 2) % 4), pigeon(f / 30, k), TOWN(8.4 + k * 0.55, 0.2, 4.4 + (k % 2) * 0.6), 0.28, { order: 6 }));
  if (id === 'burrito') { if (f >= w('hot')) out.push(fx('fl' + (Math.floor(f / 2) % 6), flame(f / 30), TOWN(21.1, 2.6, -0.1), 0.6, { order: 7 })); pop('h1', 'HOT!', w('hot'), 14, TOWN(20.2, 2.8, 0.2), 0.4, '#ff8a1a'); pop('h2', 'HOT!', w('hot', 1), 14, TOWN(22.2, 3.0, 0.2), 0.45, '#ff5a1a'); pop('h3', 'HOT!', w('hot', 2), 16, TOWN(21.2, 3.3, 0.2), 0.55, '#ff2a1a'); }
  if (id === 'roaches') for (let k = 0; k < 8; k++) { const t = ((f - S.a) / 30 * 0.6 + k / 8) % 1; out.push(fx('rc' + k + (f % 3), roach(f / 30, k), TOWN(31.8 + t * 6, 0.18, -5.6 + (k % 3) * 0.45), 0.18, { order: 6 })); }
  if (id === 'cat') out.push(fx('cat' + (f % 2), catFx(f / 30), POS.cat, 0.22, { order: 6 }));
  if (id === 'vending') pop('ow', 'OUCH!', w('assaulted'), 18, SAL(-2.2, 2.2, -2.2), 0.4, '#ffd23f');
  if (id === 'ring' && f >= w('rang')) { out.push(fx('rg' + (f % 20), ringFx((f % 20) / 20), BED(-1.6, 0.8, -2.2), 0.4, { order: 7 })); pop('bz', 'BZZZ!', w('rang'), 18, BED(-1.4, 1.5, -2.0), 0.35, '#bfe0ff'); }
  if (id === 'sal') pop('mostly', '...MOSTLY', w('mostly'), 24, SAL(0.2, 2.4, -1.6), 0.4, '#ff3a8a');
  if (id === 'bald' && f >= w('bald')) { const t = ramp(f, w('bald'), w('bald') + 12); out.push(fx('wig' + q(t, 1), wig, lerp3(up(POS.wenBath, 1.45), up(POS.wenBath, 1.85), smooth(t)), 0.16, { order: 7 })); pop('shine', '*SHINE*', w('secretly'), 18, BATH(0.3, 2.3, -1.4), 0.3, '#ffffff'); }
  if (id === 'rv') { pop('in', "I'M IN.", w('in'), 20, DES(-0.9, 2.6, 1.4), 0.45, '#ffffff'); pop('snack', 'SNACKS!', w('snacks'), 24, DES(0.6, 2.6, 1.6), 0.5, '#ffd23f'); }
  return out;
};
