// "What If The Spider Bit A Rich Kid?" (Twist Tales). New York. Peter Sterling, the spoiled son of the city's richest
// surgeon, is bitten by a glowing spider in his father's lab. He uses his powers to show off: the school trophy webbed
// onto his shelf, climbing past the club queue, swinging to school in gold sneakers. Then he hears Walter, the old
// butler, cry for help: two thieves have him in the middle of the busiest crossing. Peter swings down, webs them to a
// cab, stops the traffic, and the whole city films it. At home his father, in a glittering gold suit, is smiling:
// he hired the thieves to get the family trending. And Walter is fired for screaming too slowly.
// Our own designs only: a red-and-gold suit with a full mask, gold lenses and a gold spider crest (no web pattern),
// a fictional city with generic billboards and yellow cabs, no real brands or landmarks.
import * as SETS from './sets.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word, windUp, settle, snap } from './kit.js';

// ---------- places (far apart in one world) ----------
const B = { lab: [220, 0, 0], gala: [220, 0, 90], room: [300, 0, 0], city: [300, 0, 160], school: [380, 0, 0], club: [380, 0, 90], mansion: [460, 0, 0] };
const at = (k) => (x, y, z) => [B[k][0] + x, B[k][1] + y, B[k][2] + z];
const LAB = at('lab'), GALA = at('gala'), ROOM = at('room'), CITY = at('city'), SCH = at('school'), CLUB = at('club'), MAN = at('mansion');

// ---------- cast ----------
const BOLD = 1.55;
const PETER = { tunic: '#e8436a', skin: '#f2c9a6', hair: '#e8c46a', shoes: '#f2c230' };                                     // pink designer hoodie, blond, gold sneakers
const SUIT = { tunic: '#c4161c', skin: '#c4161c', hair: '#c4161c', stripes: '#f2c230', crest: '#f2c230', mask: '#f2c230', fullmask: true, shoes: '#f2c230' };
const THOMAS = { tunic: '#c9a227', shirt: '#fff6dc', tie: '#1a1a1a', skin: '#e8c0a0', hair: '#c8c8c8', moustache: '#a8a8a8', stout: true, glasses: '#c9a227', glitter: '#fff6c0', shoes: '#1a1a1a' };
const WALTER = { tunic: '#1e1e22', shirt: '#ffffff', bowtie: '#141414', skin: '#f0d0b8', hair: '#e8e8e8', brows: '#e8e8e8' };
const THIEF1 = { tunic: '#2a2a30', skin: '#c99067', cap: '#1a1a1e', maskBand: '#101012', mask: '#2a2a30' };
const THIEF2 = { tunic: '#3a2a22', skin: '#e8b48e', cap: '#202024', maskBand: '#101012', mask: '#3a2a22' };
const CROWD = [{ tunic: '#3a7ad0', skin: '#e8b48e', hair: '#2a1a12' }, { tunic: '#2aa070', skin: '#c99067', hair: '#1a1210', long: '#1a1210' },
  { tunic: '#e07a2a', skin: '#f2c9a6', hair: '#6a3a1a' }, { tunic: '#8a4ac0', skin: '#8a5a3a', hair: '#141010' }, { tunic: '#d0d0d8', skin: '#f2d2b6', hair: '#c8a060', long: '#c8a060' },
  { tunic: '#2a4a6a', skin: '#e0b090', cap: '#c03030' }, { tunic: '#c84a6a', skin: '#c99067', hair: '#2a1a12', pigtails: '#2a1a12' }];
const PS = 0.66, TS = 0.8, WS = 0.78, XS = 0.78;

// ---------- key spots ----------
const TANK = LAB(0.4, 1.25, -2.2), CHEQUE = GALA(1.2, 2.6, -6.2), PILE = ROOM(0.3, 0, -1.6), TROPHY = SCH(-1.8, 1.55, -4.2), NEON = CLUB(0, 6.5, -5.4);
const DOOR = MAN(0, 0, -5.4), CAR = MAN(5.5, 0, 0.5), CROSS = CITY(0, 0, 0), CAB = CITY(3.2, 0, -2.0);
const IDS = ['bite', 'gala', 'gifts', 'powers', 'trophy', 'club', 'swing', 'walter', 'hear', 'grabbed', 'webs', 'filmed', 'hired', 'fired'];

const up = (p, dy) => [p[0], p[1] + dy, p[2]];
const CAMS = {
  bite: [{ pos: LAB(-2.2, 1.7, 2.6), look: LAB(0.2, 1.3, -1.8), fov: 48 }],
  gala: [{ pos: GALA(-2.6, 2.1, 1.8), look: GALA(-0.4, 2.0, -5.6), fov: 50 }],
  gifts: [{ pos: ROOM(-2.0, 1.6, 3.0), look: ROOM(0.2, 1.4, -1.6), fov: 52 }],
  powers: [{ pos: CITY(-6.0, 1.8, 27.5), look: CITY(-11, 3.4, 21.2), fov: 50 }],
  trophy: [{ pos: SCH(1.6, 1.5, 2.4), look: SCH(-0.8, 1.35, -3.6), fov: 50 }],
  club: [{ pos: CLUB(4.5, 1.3, 7.0), look: CLUB(-0.5, 3.5, -5), fov: 54 }],
  swing: [{ pos: CITY(2.0, 1.3, 2), look: CITY(-1, 14, 40), fov: 58 }],
  walter: [{ pos: MAN(0.6, 1.6, 3.0), look: MAN(0.1, 1.4, -2.0), fov: 48 }],
  hear: [{ pos: ROOM(-1.4, 1.45, 0.9), look: ROOM(-3.0, 1.3, -3.0), fov: 46 }],
  grabbed: [{ pos: CITY(-6.5, 3.2, 14), look: CITY(0, 1.3, 2), fov: 50 }],
  webs: [{ pos: CITY(5.5, 1.2, 10), look: CITY(0, 3.0, 0), fov: 56 }],
  filmed: [{ pos: MAN(-5.5, 1.9, 6.5), look: MAN(0.3, 1.6, -2.2), fov: 54 }],
  hired: [{ pos: MAN(-0.3, 1.65, 0.6), look: MAN(0.2, 1.75, -2.3), fov: 42 }],
  fired: [{ pos: MAN(0.9, 1.55, 0.8), look: MAN(-0.4, 1.5, -2.1), fov: 46 }],
};
// on the word, the camera snaps in (under half a second) to the thing being named
const PUSH = {
  bite: [['glowing', TANK, 0.35], ['bitten', LAB(-0.25, 1.35, -1.55), 0.5]],
  gala: [['father', GALA(-1.2, 2.1, -5.6), 0.3], ['millions', CHEQUE, 0.35]],
  gifts: [['everything', ROOM(0.3, 1.4, -1.6), 0.4]],
  powers: [['walls', CITY(-11, 3.6, 21), 0.3], ['cars', { pos: CITY(-3.8, 1.7, 31.5), look: CITY(-6.5, 1.8, 25.6), fov: 50 }], ['whisper', { pos: CITY(-5.0, 1.5, 29.0), look: CITY(-5.6, 1.4, 26.2), fov: 48 }]],
  trophy: [['trophy', TROPHY, 0.3], ['shelf', SCH(0.3, 1.2, -1.9), 0.12]],
  club: [['climbed', CLUB(-0.4, 4.6, -4.9), 0.35], ['queue', CLUB(1.4, 1.5, -2.0), 0.2]],
  swing: [['swung', CITY(-1, 13, 30), 0.25], ['sneakers', CITY(-1, 11, 22), 0.45]],
  walter: [['no', MAN(-0.6, 1.75, -2.2), 0.45]],
  hear: [['heard', ROOM(-3.0, 1.3, -3.0), 0.35], ['help', ROOM(-2.6, 1.6, -3.6), 0.25]],
  grabbed: [['thieves', CITY(0, 1.4, 2), 0.35], ['crossing', CITY(0, 3, 2), -0.4]],
  webs: [['webs', CITY(0, 1.5, 1.5), 0.35], ['traffic', CITY(0, 3, 0), -0.3]],
  filmed: [['filmed', MAN(-2.0, 1.5, 3.6), 0.25], ['smiling', MAN(0.2, 1.8, -2.3), 0.6]],
  hired: [['thieves', MAN(0.2, 1.8, -2.3), 0.3], ['trending', MAN(0.2, 1.8, -2.3), 0.25]],
  fired: [['fired', MAN(-1.0, 1.65, -2.0), 0.4]],
};
for (const [id, ps] of Object.entries(PUSH)) {
  const ks = [CAMS[id][0]];
  for (const [w, target, k] of ps) { const prev = ks[ks.length - 1]; if (!Array.isArray(target)) { ks.push({ ...target, at: w }); continue; } ks.push({ pos: lerp3(prev.pos, target, k), look: target, fov: prev.fov - (k < 0 ? -6 : 5), at: w }); }
  CAMS[id] = ks;
}
// between places: push into something bright, a white flash, glide into the next place
const FLY = { gala: { through: TANK, whiteout: 1 }, gifts: { through: CHEQUE, whiteout: 1 }, powers: { through: ROOM(-0.5, 2.2, -4.4), whiteout: 1 },
  trophy: { through: CITY(-10, 30, 0), whiteout: 1 }, club: { through: TROPHY, whiteout: 1 }, hear: { through: MAN(-0.6, 1.7, -2.2), whiteout: 1 },
  grabbed: { through: ROOM(-0.6, 1.9, -4.4), whiteout: 1 }, filmed: { through: CITY(0, 25, 0), whiteout: 1 } };

const inside = (L) => ({ ...L, fogNear: 10, fogFar: 50 });
const LIGHTS = {
  lab: inside({ ...MOODS.dread, hemi: 0.95, sky: '#8ab0a0', ground: '#2a3a3a', gain: '#eafff0', lift: '#04080a', vig: 0.38, sat: 1.12 }),
  day: { ...MOODS.sunClouds, fogNear: 60, fogFar: 320, sat: 1.18, vig: 0.18 },
  blue: { ...MOODS.blueSky, fogNear: 70, fogFar: 340, sat: 1.18, vig: 0.16 },
  dusk: { ...MOODS.evening, fogNear: 50, fogFar: 300, hemi: 1.0, sat: 1.18, vig: 0.24, clouds: 0.4, cloudCol: '#ffb88a', cloudDark: '#7a5a8a' },
  room: inside({ ...MOODS.sunClouds, hemi: 1.1, sky: '#e8eef8', ground: '#a08a70', sat: 1.16, vig: 0.18 }),
  night: { ...MOODS.moonNight, fogNear: 30, fogFar: 200, hemi: 0.95, sat: 1.14, vig: 0.34, clouds: 0.3 },
  roomNight: inside({ ...MOODS.moonNight, hemi: 0.8, sky: '#8a9ad0', ground: '#3a2a3a', gain: '#f2ecff', vig: 0.4 }),
};
const LIGHT_OF = { bite: 'lab', gala: 'day', gifts: 'room', powers: 'blue', trophy: 'room', club: 'night', swing: 'dusk', walter: 'day', hear: 'roomNight',
  grabbed: 'dusk', webs: 'dusk', filmed: 'night', hired: 'night', fired: 'night' };
const FOCUS = { bite: LAB(-0.25, 1.35, -1.6), gala: GALA(-1.2, 2.1, -5.6), gifts: ROOM(0.3, 1.6, -1.6), powers: CITY(-5.4, 1.6, 25.6), trophy: SCH(-0.4, 1.3, -2.6),
  club: CLUB(-0.4, 3.8, -4.9), swing: CITY(-1, 12, 26), walter: MAN(0.1, 1.4, -1.9), hear: ROOM(-3.0, 1.3, -3.0), grabbed: CITY(0, 1.4, 2),
  webs: CITY(0, 1.6, 1), filmed: MAN(0.3, 1.6, -2.2), hired: MAN(0.2, 1.8, -2.3), fired: MAN(-0.5, 1.5, -2.1) };
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS, fly: FLY,
  light: (S) => LIGHT_OF[S.id],
  tweak: (L, S, f) => {
    if (S.id === 'filmed') { const k = (f * 7) % 23; if (k < 2) { L.gain = '#ffffff'; L.lift = '#262630'; } }          // phone flashes
    if (S.id === 'gala') { const k = (f * 5) % 31; if (k < 2) { L.lift = '#202024'; } }
    if (S.id === 'hired') L.vig = 0.5;
  },
  kicks: ['bite', 'webs'],
  focus: (S) => FOCUS[S.id],
  shadowAt: (S) => FOCUS[S.id],
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, dofAt } = K;
export { LIGHTS };
const vert = (c, S) => ({ ...c, look: lerp3(c.look, FOCUS[S.id], 0.45), fov: Math.min(76, c.fov * 1.15) });
export const camAt = (f) => { const S = shotAt(f);
  if (S.id === 'swing') { const p = swingPos(f, S).p, c = K.camAt(f); return { ...c, pos: [p[0] + 5.5, p[1] - 0.8, p[2] + 7.5], look: [p[0], p[1] + 0.3, p[2] - 1.5], fov: 50, roll: 0.06 }; }
  return vert(K.camAt(f), S); };

// ---------- painted textures ----------
const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const towerTex = (base, glass, lit, seed) => cv(256, 512, (g, w, h) => {                // one tower face: floors of windows
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 6; x++) { const on = rnd(seed * 97 + y * 13 + x) < lit;
    g.fillStyle = on ? '#ffe2a0' : glass; g.fillRect(8 + x * 41, 6 + y * 32, 33, 22);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(8 + x * 41, 6 + y * 32, 33, 4); }
  g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < 16; y++) g.fillRect(0, 30 + y * 32, w, 3); });
const board = (bg, lines, fg = '#ffffff', accent = '#ffd23f') => (g, w, h) => {      // a giant billboard
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach(([t, s, c], i) => { g.font = `900 ${s * h}px Arial Black, Arial`; g.lineWidth = s * h * 0.12; g.strokeStyle = '#141020';
    const y = h * (0.3 + i * 0.36); g.strokeText(t, w / 2, y); g.fillStyle = c || (i ? accent : fg); g.fillText(t, w / 2, y); });
  g.strokeStyle = '#141020'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); };
const sign = (txt, bg = '#f4f4f0', fg = '#1a1a1a') => (g, w, h) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `900 ${h * 0.5 | 0}px Arial Black, Arial`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 2); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8); };
const neon = (txt, col) => (g, w, h) => { g.fillStyle = '#120a1a'; g.fillRect(0, 0, w, h); g.font = `italic 900 ${h * 0.55 | 0}px Arial Black, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = col; g.shadowBlur = 40; g.fillStyle = col; g.fillText(txt, w / 2, h / 2); g.shadowBlur = 0; g.fillStyle = '#ffffff'; g.globalAlpha = 0.6; g.fillText(txt, w / 2, h / 2); };
const cheque = (g, w, h) => { g.fillStyle = '#f4f2e8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2a6a4a'; g.lineWidth = 14; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = '#1a3a2a'; g.font = `700 ${h * 0.09 | 0}px Georgia`; g.fillText('PAY TO: STERLING CHILDREN\'S HOSPITAL', 40, h * 0.2);
  g.font = `900 ${h * 0.3 | 0}px Arial Black, Arial`; g.fillStyle = '#1e7a3a'; g.textAlign = 'center'; g.fillText('$50,000,000', w / 2, h * 0.58);
  g.font = `italic 700 ${h * 0.1 | 0}px Georgia`; g.fillStyle = '#1a1a1a'; g.textAlign = 'right'; g.fillText('Dr. Thomas Sterling', w - 50, h * 0.86); };

const tube = (ctx, a, b, r, mat, parent) => { const { THREE } = ctx; const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mat); m.position.copy(A.clone().add(Bv).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.castShadow = true; parent.add(m); return m; };

// a room shell: floor, walls, ceiling; a big window in the back wall
function roomShell(ctx, G, { w = 8, d = 8, h = 3.4, wall, floor, ceil, win = null }) {
  const { add, tbox } = ctx;
  add(tbox(w, 0.1, d, 1), floor, 0, -0.05, 0, G, { cast: false }); add(tbox(w, 0.1, d, 1), ceil, 0, h + 0.05, 0, G, { cast: false });
  add(tbox(0.12, h, d, 1), wall, -w / 2, h / 2, 0, G); add(tbox(0.12, h, d, 1), wall, w / 2, h / 2, 0, G); add(tbox(w, h, 0.12, 1), wall, 0, h / 2, d / 2, G);
  if (!win) { add(tbox(w, h, 0.12, 1), wall, 0, h / 2, -d / 2, G); return; }
  const [x0, x1, y0, y1] = win;
  add(tbox(w, y0, 0.12, 1), wall, 0, y0 / 2, -d / 2, G); add(tbox(w, h - y1, 0.12, 1), wall, 0, (h + y1) / 2, -d / 2, G);
  add(tbox(x0 + w / 2, y1 - y0, 0.12, 1), wall, (x0 - w / 2) / 2, (y0 + y1) / 2, -d / 2, G); add(tbox(w / 2 - x1, y1 - y0, 0.12, 1), wall, (x1 + w / 2) / 2, (y0 + y1) / 2, -d / 2, G);
}
// the skyline seen through a window: a painted backdrop far behind it
const skyline = (night) => cv(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h);
  if (night) { gr.addColorStop(0, '#0a0e2a'); gr.addColorStop(1, '#3a2a5a'); } else { gr.addColorStop(0, '#5aa0e8'); gr.addColorStop(1, '#d8ecfa'); }
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) { const bw = 30 + rnd(i) * 50, bh = 120 + rnd(i + 9) * 300, x = i * 40 - 20; g.fillStyle = night ? '#1a1a34' : ['#8aa4c4', '#7a90b0', '#9ab0cc'][i % 3]; g.fillRect(x, h - bh, bw, bh);
    g.fillStyle = night ? '#ffd27a' : 'rgba(255,255,255,0.5)'; for (let y = h - bh + 8; y < h - 6; y += 14) for (let xx = x + 4; xx < x + bw - 6; xx += 10) if (rnd(xx * 3 + y) < (night ? 0.4 : 0.6)) g.fillRect(xx, y, 5, 7); } });

// ---------- the gold supercar (our own design) ----------
function supercar(ctx, parent) {
  const { THREE, add, box, toon } = ctx; const g = new THREE.Group(); parent.add(g);
  const gold = toon({ color: '#e0b030' }), dark = toon({ color: '#141418' }), glass = toon({ color: '#1e2a3a' }), rim = toon({ color: '#2a2a2e' });
  add(box(4.6, 0.42, 2.0), gold, 0, 0.5, 0, g);
  const cab = add(new THREE.CylinderGeometry(1.0, 1.0, 1.8, 3, 1), glass, -0.2, 0.86, 0, g); cab.rotation.set(Math.PI / 2, 0, -Math.PI / 2); cab.scale.set(1.5, 1, 0.42);
  add(box(1.2, 0.08, 2.1), gold, -2.1, 1.0, 0, g); for (const s of [-1, 1]) add(box(0.1, 0.35, 0.1), dark, -2.0, 0.8, s * 0.8, g);   // spoiler
  add(box(0.08, 0.2, 1.7), new THREE.MeshBasicMaterial({ color: '#fff4c8' }), 2.31, 0.58, 0, g, { cast: false });
  add(box(0.06, 0.12, 1.8), new THREE.MeshBasicMaterial({ color: '#ff2a2a' }), -2.31, 0.62, 0, g, { cast: false });
  for (const s of [-1, 1]) for (const x of [-1.45, 1.45]) { const w = add(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 18), dark, x, 0.42, s * 0.95, g); w.rotation.x = Math.PI / 2;
    const r_ = add(new THREE.CylinderGeometry(0.26, 0.26, 0.32, 10), gold, x, 0.42, s * 0.96, g); r_.rotation.x = Math.PI / 2; }
  add(box(4.4, 0.1, 1.9), dark, 0, 0.28, 0, g);
  return g;
}
// a skyscraper: textured box with a roof cap
function tower(ctx, parent, x, z, w, d, h, i) {
  const { add, tbox, texM, toon } = ctx;
  const cols = [['#b8bcc4', '#4a6a8a'], ['#c8b090', '#3a5070'], ['#8a96a8', '#2a3a58'], ['#d0c8b8', '#5a7aa0'], ['#6a7488', '#20304a']][i % 5];
  const m = texM(towerTex(cols[0], cols[1], 0.18, i), 1 / 24, 1 / 48);
  add(tbox(w, h, d, 1), m, x, h / 2, z, parent);
  add(tbox(w * 0.9, 1.2, d * 0.9, 1), toon({ color: '#3a3a44' }), x, h + 0.6, z, parent);
  if (i % 3 === 0) add(tbox(w * 0.5, 6, d * 0.5, 1), m, x, h + 4, z, parent);
}

export const build = (ctx) => {
  const { THREE, add, box, tbox, toon, texM, P } = ctx;
  SETS.houseLightsOff(ctx);
  const grp = (k) => { const g = new THREE.Group(); g.position.set(...B[k]); ctx.world.add(g); return g; };
  const white = toon({ color: '#eef0f2' }), steel = toon({ color: '#aab2bc' }), darkM = toon({ color: '#1a1a22' }), goldM = toon({ color: '#e0b030' });
  const basic = (c) => new THREE.MeshBasicMaterial({ color: c });

  // ===== the lab (night): tiles, steel benches, the glowing spider tank =====
  const L = grp('lab');
  roomShell(ctx, L, { w: 8, d: 7, h: 3.4, wall: texM(P.plaster(81, 30), 3, 1, '#d8e4e8'), floor: texM(P.planks(82), 3, 3, '#5a6470'), ceil: white });
  add(box(4.6, 0.08, 1.0), steel, 0.4, 0.92, -2.4, L); for (const x of [-1.7, 2.5]) add(box(0.08, 0.9, 0.9), steel, x, 0.45, -2.4, L);
  const tank = add(box(1.1, 0.7, 0.6), new THREE.MeshBasicMaterial({ color: '#7affb0', transparent: true, opacity: 0.45 }), 0.4, 1.31, -2.2, L, { cast: false });
  add(box(1.14, 0.04, 0.64), steel, 0.4, 1.67, -2.2, L);
  const tankL = new THREE.PointLight('#8affc0', 5, 6, 1.4); tankL.position.set(0.4, 1.5, -1.6); L.add(tankL);
  for (let i = 0; i < 6; i++) { const tb = add(new THREE.CylinderGeometry(0.05, 0.05, 0.28, 10), basic(['#ff5a8a', '#5ac8ff', '#ffd23f'][i % 3]), -1.2 + i * 0.18, 1.1, -2.6, L, { cast: false }); }
  for (const x of [-2.8, 2.9]) { add(box(1.6, 1.0, 0.08), darkM, x, 2.0, -3.42, L); const sc = SETS.canvasPlane(ctx, 1.4, 0.8, 256, L); sc.draw('m', (g, w, h) => { g.fillStyle = '#04140c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3aff8a'; g.lineWidth = 4; g.beginPath(); for (let i = 0; i < w; i += 8) g.lineTo(i, h / 2 + Math.sin(i * 0.08 + x) * 30 * (i % 40 < 20 ? 1 : 0.2)); g.stroke(); g.fillStyle = '#3aff8a'; g.font = '700 22px monospace'; g.fillText('SPECIMEN 7: DO NOT TOUCH', 10, 30); });
    sc.mesh.position.set(x, 2.0, -3.36); }
  const labSign = SETS.canvasPlane(ctx, 2.6, 0.45, 512, L, { lit: true }); labSign.draw('s', sign('STERLING RESEARCH', '#1a2a3a', '#e0b030')); labSign.mesh.position.set(0.4, 2.9, -3.42);

  // ===== the hospital gala (day): glass tower, stage, giant cheque, crowd =====
  const Gg = grp('gala');
  add(tbox(80, 0.1, 60, 1), texM(P.stone(95, 30, 8, 60), 16, 12, '#b8b4ac'), 0, -0.05, 0, Gg, { cast: false });
  tower(ctx, Gg, 0, -16, 26, 16, 46, 1); tower(ctx, Gg, -24, -18, 14, 14, 70, 2); tower(ctx, Gg, 24, -18, 16, 14, 60, 3);
  const hs = SETS.canvasPlane(ctx, 18, 2.2, 1024, Gg, { lit: true }); hs.draw('h', sign("STERLING CHILDREN'S HOSPITAL", '#ffffff', '#c41e3a')); hs.mesh.position.set(0, 9, -7.9);
  add(box(10, 0.6, 4), toon({ color: '#7a1a2a' }), 0, 0.3, -5.5, Gg); add(box(10, 0.04, 4), toon({ color: '#c41e3a' }), 0, 0.62, -5.5, Gg, { cast: false });
  const ch = SETS.canvasPlane(ctx, 3.6, 1.6, 1024, Gg, { lit: true }); ch.draw('c', cheque); ch.mesh.position.set(1.2, 2.6, -6.6);
  add(box(0.08, 2.0, 0.08), darkM, 0.0, 1.6, -6.7, Gg); add(box(0.08, 2.0, 0.08), darkM, 2.4, 1.6, -6.7, Gg);
  for (const x of [-4.5, 4.5]) { add(new THREE.CylinderGeometry(0.05, 0.05, 3, 8), darkM, x, 2.1, -4, Gg); add(box(1.2, 0.8, 0.3), toon({ color: '#c41e3a' }), x, 3.6, -4, Gg); }
  for (let i = 0; i < 10; i++) { const b = add(new THREE.SphereGeometry(0.28, 12, 10), basic(['#ffd23f', '#ff5a8a', '#5ac8ff', '#ffffff'][i % 4]), -4.5 + i, 3.9 + (i % 3) * 0.3, -6.9, Gg, { cast: false }); }

  // ===== Peter's room: gift mountain, gold gaming chair, neon name, big window on the skyline =====
  const R = grp('room');
  roomShell(ctx, R, { w: 9, d: 9, h: 3.6, wall: texM(P.plaster(83, 20), 3, 1, '#2a2440'), floor: texM(P.planks(84), 3, 3, '#c8a878'), ceil: white, win: [-2.6, 1.6, 0.8, 3.1] });
  const sky1 = SETS.canvasPlane(ctx, 18, 9, 1024, R); sky1.mesh.position.set(-0.5, 2.5, -9); const skyDay = skyline(false), skyNight = skyline(true);
  for (const [x, y, w, h] of [[-0.5, 0.8, 4.4, 0.08], [-0.5, 3.1, 4.4, 0.08], [-2.6, 1.95, 0.08, 2.3], [1.6, 1.95, 0.08, 2.3], [-0.5, 1.95, 0.06, 2.3]]) add(box(w, h, 0.12), toon({ color: '#d8d8e0' }), x, y, -4.45, R);
  const giftCols = ['#e8436a', '#3a8ae8', '#ffd23f', '#3ac88a', '#a85ae8', '#ff8a3a'];
  for (let i = 0; i < 26; i++) { const s = 0.35 + rnd(i) * 0.4, x = 0.3 + (rnd(i + 3) - 0.5) * 2.6 * (1 - i / 34), z = -1.6 + (rnd(i + 7) - 0.5) * 1.6, y = s / 2 + Math.floor(i / 7) * 0.42 + rnd(i + 11) * 0.1;
    const b = add(box(s, s, s), toon({ color: giftCols[i % 6] }), x, y, z, R); b.rotation.y = rnd(i) * 1.5;
    add(box(s * 1.02, s * 1.02, 0.07), toon({ color: '#ffffff' }), x, y, z, R).rotation.y = rnd(i) * 1.5; }
  const chair = new THREE.Group(); chair.position.set(2.6, 0, -2.4); R.add(chair); add(box(0.8, 0.15, 0.8), goldM, 0, 0.55, 0, chair); add(box(0.8, 1.1, 0.15), goldM, 0, 1.1, -0.35, chair); add(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), darkM, 0, 0.25, 0, chair);
  add(box(2.6, 1.4, 0.08), darkM, 3.0, 1.8, -4.38, R); const tv = SETS.canvasPlane(ctx, 2.4, 1.25, 512, R); tv.draw('t', board(['#3a1a6a', '#e8436a'], [['LEVEL 99', 0.28], ['WINNER', 0.22]])); tv.mesh.position.set(3.0, 1.8, -4.32);
  const nm = SETS.canvasPlane(ctx, 2.4, 0.7, 512, R); nm.draw('n', neon('PETER', '#ff4ad0')); nm.mesh.position.set(-3.0, 2.6, -4.38);
  const roomL = new THREE.PointLight('#ffd8f0', 0, 9, 1.4); roomL.position.set(0, 3.0, 0); R.add(roomL);

  // ===== the city: an avenue of towers, a big crossing with giant billboards, yellow cabs =====
  const C = grp('city');
  add(tbox(14, 0.1, 400, 2), texM(P.stone(94, 30, 6, 30, 64, 64), 3, 80, '#55585e'), 0, -0.05, 0, C, { cast: false });
  add(tbox(400, 0.1, 14, 2), texM(P.stone(94, 30, 6, 30, 64, 64), 80, 3, '#55585e'), 0, -0.06, 0, C, { cast: false });
  for (const s of [-1, 1]) { add(tbox(4, 0.16, 400, 1), texM(P.stone(95, 30, 8, 60), 1, 80, '#b0aca4'), s * 9, 0.08, 0, C, { cast: false }); add(tbox(400, 0.16, 4, 1), texM(P.stone(95, 30, 8, 60), 80, 1, '#b0aca4'), 0, 0.08, s * 9, C, { cast: false }); }
  for (let k = -6; k <= 6; k++) { if (k === 0) continue; for (let j = 0; j < 4; j++) add(box(0.3, 0.012, 2.5), basic('#f4f4ee'), 0, 0.01, k * 12 + j * 3 - 4.5, C, { cast: false }); }
  for (const s of [-1, 1]) for (let k = 0; k < 8; k++) add(box(0.7, 0.012, 3.2), basic('#f4f4ee'), -5.6 + k * 1.6, 0.01, s * 8.6, C, { cast: false });   // zebra
  for (const s of [-1, 1]) for (const zz of [-1, 1]) {                                                  // towers on the four corners and along the avenue
    let z = zz * 13;
    for (let i = 0; i < 9; i++) { const w = 12 + rnd(i * 7 + s) * 8, h = 30 + rnd(i * 3 + zz + s * 5) * 90; tower(ctx, C, s * (11.5 + 8), z + zz * w / 2, 16, w, h, i + (s > 0 ? 4 : 0)); z += zz * (w + 1.5); } }
  for (const s of [-1, 1]) for (const xs of [-1, 1]) tower(ctx, C, xs * (40 + 12), s * 20, 24, 16, 60 + 30 * (s + xs + 2) / 2, 7 + s + xs);
  const ads = [[['#e8436a', '#7a1a8a'], [['GOLD KICKS', 0.26], ['JUST BOUGHT IT', 0.13]]], [['#1a6ae8', '#1ac8e8'], [['STERLING HEALTH', 0.18], ['WE CARE A LOT', 0.14]]],
    [['#ffb020', '#ff5a2a'], [['FIZZ POP', 0.3], ['TASTE THE LOUD', 0.14]]], [['#141420', '#3a3a6a'], [['NEWS 24', 0.28], ['LIVE', 0.18]]]];
  [[-11.4, 8, 4.5, Math.PI / 2], [11.4, 9, -4.5, -Math.PI / 2], [-11.4, 18, -6, Math.PI / 2], [11.4, 15, 6, -Math.PI / 2]].forEach(([x, y, z, ry], i) => {
    const bd = SETS.canvasPlane(ctx, 9, 5, 512, C); bd.draw('b', board(...ads[i])); bd.mesh.position.set(x, y, z); bd.mesh.rotation.y = ry; });
  for (const [x, z] of [[-7.5, -7.5], [7.5, 7.5], [-7.5, 7.5], [7.5, -7.5]]) { add(new THREE.CylinderGeometry(0.1, 0.12, 4.5, 8), darkM, x, 2.25, z, C); add(box(0.4, 1.1, 0.4), toon({ color: '#2a2a2e' }), x, 4.2, z, C);
    add(new THREE.SphereGeometry(0.12, 10, 8), basic(['#ff3030', '#30ff60'][(x * z > 0) ? 0 : 1]), x, 4.45, z + 0.21, C, { cast: false }); }
  for (const z of [-40, -25, 25, 40, 60, 80]) for (const s of [-1, 1]) { const lg = new THREE.Group(); C.add(lg); SETS.streetLamp(ctx, lg, s * 7.6, z, { h: 5 }); }
  for (const [x, z] of [[-8.5, 30], [8.5, 46], [-8.5, 62], [8.5, -30]]) SETS.tree(ctx, C, x, z, 1.1);
  const cabs = []; for (let i = 0; i < 9; i++) { const c = SETS.car(ctx, C, { color: i % 4 === 3 ? '#3a6aa8' : '#f2c21a' }); c.g.rotation.y = i % 2 ? -Math.PI / 2 : Math.PI / 2;
    if (i % 4 !== 3) { add(box(0.5, 0.25, 0.25), basic('#ffffff'), -0.2, 1.45, 0, c.g, { cast: false }); add(box(4.02, 0.12, 1.72), darkM, 0, 0.75, 0, c.g, { cast: false }); }
    cabs.push(c.g); }
  const liftCab = SETS.car(ctx, C, { color: '#f2c21a' }); liftCab.g.rotation.y = Math.PI / 2;
  const stuckCab = SETS.car(ctx, C, { color: '#f2c21a' }); stuckCab.g.position.set(...[CAB[0] - B.city[0], 0, CAB[2] - B.city[2]]); stuckCab.g.rotation.y = 0.4;
  const wall = new THREE.Group(); C.add(wall);                                                           // the wall Peter climbs in 'powers'
  add(tbox(0.4, 14, 10, 1), texM(towerTex('#b0a090', '#4a5a70', 0.1, 33), 1 / 24, 1 / 48), -11.6, 7, 22, wall);

  // ===== the school hall: trophy case and a banner =====
  const S = grp('school');
  roomShell(ctx, S, { w: 9, d: 9, h: 4, wall: texM(P.plaster(85, 30), 3, 1, '#c8d0e0'), floor: texM(P.planks(86), 3, 3, '#a87850'), ceil: white });
  add(box(3.6, 2.2, 0.6), toon({ color: '#5a3a24' }), -1.8, 1.1, -4.15, S); add(box(3.3, 1.8, 0.02), new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.25 }), -1.8, 1.25, -3.84, S, { cast: false });
  for (const [x, s] of [[-3.0, 0.7], [-2.4, 0.8], [-1.2, 0.8], [-0.6, 0.6]]) { add(new THREE.CylinderGeometry(0.12 * s, 0.06 * s, 0.3 * s, 12), goldM, x, 0.7 + 0.15 * s, -4.15, S); add(box(0.24 * s, 0.1, 0.24 * s), darkM, x, 0.55, -4.15, S); }
  const cup = new THREE.Group(); S.add(cup); add(new THREE.CylinderGeometry(0.22, 0.1, 0.4, 16), goldM, 0, 0.32, 0, cup); add(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 8), goldM, 0, 0.12, 0, cup);
  add(box(0.28, 0.06, 0.28), darkM, 0, 0.03, 0, cup); for (const s of [-1, 1]) add(new THREE.TorusGeometry(0.1, 0.025, 6, 12), goldM, s * 0.25, 0.36, 0, cup);
  const bn = SETS.canvasPlane(ctx, 5, 1, 512, S, { lit: true }); bn.draw('b', sign('HUDSON PREP ACADEMY', '#1a3a6a', '#ffd23f')); bn.mesh.position.set(0, 3.2, -4.42);
  const shelfB = SETS.canvasPlane(ctx, 1.4, 0.35, 256, S, { lit: true }); shelfB.draw('s', sign('CHAMPIONS 2026', '#ffd23f', '#1a1a1a')); shelfB.mesh.position.set(-1.8, 2.45, -3.84);

  // ===== the club (night): neon sign, red rope, the queue =====
  const Cl = grp('club');
  add(tbox(60, 0.1, 30, 1), texM(P.stone(95, 30, 8, 40), 12, 6, '#5a5860'), 0, -0.05, 0, Cl, { cast: false });
  add(tbox(14, 14, 2, 1), texM(towerTex('#2a2440', '#1a1830', 0.25, 44), 1 / 24, 1 / 48), 0, 7, -6.4, Cl); tower(ctx, Cl, -16, -10, 14, 14, 50, 5); tower(ctx, Cl, 16, -10, 14, 14, 44, 6);
  const nn = SETS.canvasPlane(ctx, 5, 1.6, 512, Cl); nn.draw('n', neon('VELVET ROOM', '#ff3ac8')); nn.mesh.position.set(0, 6.5, -5.35);
  add(box(2, 2.6, 0.1), toon({ color: '#3a0a2a' }), 0, 1.3, -5.38, Cl);
  for (let i = 0; i < 7; i++) add(new THREE.CylinderGeometry(0.04, 0.05, 0.9, 8), goldM, 1.4 + i * 0.9, 0.45, -3.6, Cl);
  for (let i = 0; i < 6; i++) tube(ctx, [1.4 + i * 0.9, 0.85, -3.6], [2.3 + i * 0.9, 0.85, -3.6], 0.035, toon({ color: '#c41e3a' }), Cl);
  const clubL = new THREE.PointLight('#ff4ad0', 6, 14, 1.3); clubL.position.set(0, 5.5, -3.5); Cl.add(clubL);

  // ===== the Sterling mansion: white columns, gold doors, fountain, the gold supercar =====
  const M = grp('mansion');
  add(tbox(90, 0.1, 60, 1), texM(P.stone(96, 30, 10, 70), 18, 12, '#d8d4c8'), 0, -0.05, 0, M, { cast: false });
  add(tbox(30, 0.1, 6, 1), texM(P.stone(95, 100, 30, 40), 6, 1, '#4a8a3a'), -14, 0.0, 6, M, { cast: false });
  const wallW = texM(towerTex('#f2eee4', '#7a96b8', 0.0, 55), 1 / 24, 1 / 30);
  add(tbox(34, 11, 12, 1), wallW, 0, 5.5, -11.4, M); add(tbox(14, 9, 12, 1), wallW, -24, 4.5, -12, M); add(tbox(14, 9, 12, 1), wallW, 24, 4.5, -12, M);
  for (let i = 0; i < 6; i++) { if (i === 2 || i === 3) continue; add(new THREE.CylinderGeometry(0.42, 0.48, 9, 16), white, -7.5 + i * 3, 4.5, -4.6, M); add(box(1.1, 0.4, 1.1), white, -7.5 + i * 3, 9.1, -4.6, M); }
  const ped = add(new THREE.CylinderGeometry(9, 9, 1.6, 3, 1), white, 0, 10.2, -4.6, M); ped.rotation.set(Math.PI / 2, 0, Math.PI / 2); ped.scale.set(0.38, 1, 1.3);
  add(box(14, 0.5, 2.2), white, 0, 9.3, -4.6, M);
  for (const s of [-1, 1]) add(box(1.4, 3.2, 0.12), goldM, s * 0.72, 1.6, -5.42, M);
  add(box(16, 0.3, 4.4), white, 0, 0.15, -3.2, M); add(box(6, 0.15, 1.2), white, 0, 0.075, -0.4, M);
  add(new THREE.CylinderGeometry(2.2, 2.4, 0.6, 28), white, 0, 0.3, 6, M); add(new THREE.CylinderGeometry(2.0, 2.0, 0.05, 28), basic('#5ab8e8'), 0, 0.58, 6, M, { cast: false });
  add(new THREE.CylinderGeometry(0.25, 0.4, 1.8, 12), white, 0, 1.2, 6, M); add(new THREE.SphereGeometry(0.4, 14, 10), goldM, 0, 2.2, 6, M);
  const car = supercar(ctx, M); car.position.set(CAR[0] - B.mansion[0], 0, CAR[2] - B.mansion[2]); car.rotation.y = 0.5;
  const plate = SETS.canvasPlane(ctx, 0.9, 0.22, 256, car, { lit: true }); plate.draw('p', sign('STERLNG 1', '#ffd23f', '#1a1a1a')); plate.mesh.position.set(2.32, 0.42, 0); plate.mesh.rotation.y = Math.PI / 2;
  const gate = new THREE.Group(); gate.position.z = 13; M.add(gate); for (let i = -12; i <= 12; i++) if (Math.abs(i) > 2) add(box(0.08, 2.4, 0.08), goldM, i * 0.9, 1.2, 0, gate); add(box(22, 0.12, 0.12), goldM, 0, 2.3, 0, gate);
  const porch = new THREE.PointLight('#ffe2a0', 0, 12, 1.3); porch.position.set(0, 4, -3); M.add(porch);
  for (const x of [-9, 9]) { const lg = new THREE.Group(); M.add(lg); SETS.streetLamp(ctx, lg, x, 2, { h: 3.6, on: true }); }

  // webs: four thin white lines we stretch between points each frame
  const webM = toon({ color: '#ffffff' }), webs = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 6), webM); m.visible = false; ctx.world.add(m); return m; });
  return { tank, tankL, sky1, skyDay, skyNight, roomL, cabs, liftCab: liftCab.g, cup, porch, webs, THREE };
};

const setWeb = (P, i, a, b) => { const m = P.webs[i]; if (!a) { m.visible = false; return; } const { THREE } = P;
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), l = d.length(); m.visible = l > 0.05;
  m.position.copy(A.clone().add(Bv).multiplyScalar(0.5)); m.scale.set(1, Math.max(0.01, l), 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); };

export const update = (W, f, P) => {
  if (!P.tank) return;
  P.tankL.intensity = 4 + Math.sin(f * 0.3) * 1.5;
  const sky = W.night ? P.skyNight : P.skyDay; P.sky1.draw(W.night ? 'n' : 'd', (g, w, h) => g.drawImage(sky, 0, 0, w, h)); P.roomL.intensity = W.night ? 2.0 : 0.6;
  P.cabs.forEach((c, i) => { const lane = i % 2 ? 4.2 : -4.2, dir = i % 2 ? -1 : 1, z0 = -150 + i * 33; let z = ((z0 + dir * W.traffic * 0.9 + 600) % 300) - 150;
    if (W.stopped && Math.abs(z) < 14) z = z > 0 ? 12 + i : -12 - i; c.position.set(lane, 0, z); });
  P.liftCab.position.set(...W.liftCab); P.liftCab.rotation.y = 0;
  P.cup.position.set(...W.cup);
  P.porch.intensity = W.porch;
  for (let i = 0; i < 4; i++) setWeb(P, i, W.webs[i] && W.webs[i][0], W.webs[i] && W.webs[i][1]);
};

// ---------- where everything is, frame by frame ----------
const ptoward = (a, b, t) => lerp3(a, b, Math.max(0, Math.min(1, t)));
export const worldAt = (f) => {
  const S = shotAt(f), id = S.id, w = (x, n = 0) => K.wordF(S, x, n);
  const W = { night: ['hear'].includes(id), traffic: f, stopped: ['webs'].includes(id), liftCab: [-150, -10, 0], cup: [-1.8, 0.62, -4.15], porch: ['filmed', 'hired', 'fired'].includes(id) ? 4 : 0, webs: [] };
  W.liftCab = CITY(-14, 0, 60).map((v, i) => v - B.city[i]);                                                    // parked out of sight
  if (id === 'powers') { const t = windUp(ramp(f, w('cars'), w('cars') + 18)); W.liftCab = [-5.4, lerp(0, 1.65, t), 24.4]; }
  if (id === 'trophy') { const t = snap(ramp(f, w('trophy'), w('trophy') + 14)); W.cup = lerp3([-1.8, 0.62, -4.15], [0.2, 1.2, -1.8], t);
    if (f >= w('trophy') - 2 && f < w('trophy') + 16) W.webs[0] = [SCH(0.15, 1.25, -1.7), SCH(...W.cup)]; }
  if (id === 'club') {}
  if (id === 'swing') { const sw = swingPos(f, S); W.webs[0] = [up(sw.p, 0.85), sw.anchor]; }
  if (id === 'powers' && f > w('walls') - 4 && f < w('cars')) W.webs = [];
  if (id === 'webs') { const fw = w('webs');
    for (const [i, tgt] of [[0, THIEF_AT(f, S, 0)], [1, THIEF_AT(f, S, 1)]]) { const t = snap(ramp(f, fw + i * 5, fw + i * 5 + 6));
      if (f >= fw + i * 5) W.webs[i] = [CITY(0.4, 1.3, -1.6), ptoward(CITY(0.4, 1.3, -1.6), up(tgt, 1.0), t)]; }
    const land = swingDown(f, S); if (land.anchor) W.webs[2] = [up(land.p, 0.85), land.anchor]; }
  return W;
};
// Peter's swing along the avenue (shot 'swing'): pendulum arcs between anchors high on the towers
const swingPos = (f, S) => { const t = ramp(f, S.a, S.b), seg = Math.min(2, Math.floor(t * 3)), u = t * 3 - seg;
  const anchors = [CITY(-19.5, 34, 56), CITY(19.5, 38, 38), CITY(-19.5, 36, 20)], a = anchors[seg];
  const z = lerp(70 - seg * 18, 52 - seg * 18, u), x = lerp(seg % 2 ? -3 : 3, seg % 2 ? 3 : -3, u), y = 14 - Math.sin(u * Math.PI) * 6;
  return { p: CITY(x, y, z), anchor: a }; };
// Peter swinging down into the crossing (shot 'webs' start)
const swingDown = (f, S) => { const t = ramp(f, S.a, S.a + 18); if (t >= 1) return { p: CITY(0.4, 0, -1.6), anchor: null };
  const e = smooth(t); return { p: CITY(lerp(-9, 0.4, e), lerp(12, 0, e) + Math.sin(e * Math.PI) * 2, lerp(-14, -1.6, e)), anchor: CITY(-19.5, 36, -10) }; };
const THIEF_AT = (f, S, k) => { const base = k ? CITY(1.3, 0, 1.6) : CITY(-1.3, 0, 2.2), stuck = k ? CITY(2.4, 0, -1.3) : CITY(3.8, 0, -2.4);
  if (S.id !== 'webs') return base; const t = snap(ramp(f, K.wordF(S, 'webs') + k * 5 + 4, K.wordF(S, 'webs') + k * 5 + 12)); return lerp3(base, stuck, t); };

export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [], w = (x, n = 0) => K.wordF(S, x, n);
  const A = (who, name, o, pos, s, x = {}) => out.push(actor(T, who, { seed: name.length * 7 + 3, blink: blinkAt(f, name.length * 7), bold: BOLD, ...o, who: name }, pos, { s, ...x }));
  const peter = (o, pos, x) => A(PETER, 'peter', o, pos, PS, x), hero = (o, pos, x) => A(SUIT, 'hero', o, pos, PS, x);
  const thomas = (o, pos, x) => A(THOMAS, 'thomas', o, pos, TS, x), walter = (o, pos, x) => A(WALTER, 'walter', o, pos, WS, x);
  if (id === 'bite') { const bit = f >= w('bitten'); peter({ expr: bit ? 'shock' : 'grin', R: 'reach', look: 0.4 }, LAB(-0.6, 0, -1.4)); }
  if (id === 'gala') { thomas({ expr: 'grin', R: 'up', look: 0.2 }, GALA(-1.2, 0.62, -5.6));
    for (let i = 0; i < 7; i++) A(CROWD[i], 'c' + i, { expr: i % 2 ? 'smile' : 'grin', R: i % 3 ? 'hang' : 'up', look: (i - 3) * 0.1 }, GALA(-4.2 + i * 1.3 + rnd(i) * 0.4, 0, -2.9 + rnd(i + 3) * 0.8), 0.76); }
  if (id === 'gifts') peter({ expr: 'grin', R: 'up', L: 'up', look: 0.3 }, ROOM(0.3, 1.3, -1.6));
  if (id === 'powers') { const fc = w('cars');
    if (f < fc) { const t = ramp(f, S.a, fc); peter({ expr: 'grin', R: 'up', L: 'reach', look: 0.5 }, CITY(-11.1, lerp(2.0, 4.6, t), 21), { blob: false }); }
    else peter({ expr: f > w('whisper') ? 'nervous' : 'laugh', R: 'up', L: 'up', look: f > w('whisper') ? -0.7 : 0.3 }, CITY(-5.3, 0.16, 25.9)); }
  if (id === 'trophy') peter({ expr: f >= w('trophy') ? 'grin' : 'smile', R: 'reach', look: 0.4 }, SCH(0.4, 0, -1.6));
  if (id === 'club') { const t = ramp(f, S.a + 4, w('queue') + 8); peter({ expr: 'grin', R: 'up', L: 'reach', look: 0.6 }, CLUB(lerp(-1.5, 1.6, t), lerp(2.6, 4.4, t), -4.9), { blob: false });
    for (let i = 0; i < 6; i++) A(CROWD[(i + 2) % 7], 'q' + i, { expr: f > w('climbed') ? 'shock' : 'neutral', look: -0.5, R: f > w('climbed') && i % 2 ? 'up' : 'hang' }, CLUB(1.8 + i * 0.9, 0, -2.8), 0.74);
    A({ tunic: '#141418', skin: '#8a5a3a', hair: '#141010', stout: true }, 'bouncer', { expr: 'stern', look: 0.4 }, CLUB(0.2, 0, -3.6), 0.84); }
  if (id === 'swing') { const sw = swingPos(f, S); hero({ expr: 'grin', R: 'up', L: 'reach' }, sw.p, { blob: false, roll: Math.sin(ramp(f, S.a, S.b) * Math.PI * 6) * 0.25 }); }
  if (id === 'walter') { walter({ expr: 'stern', R: 'point', look: 0.4 }, MAN(-0.6, 0.3, -2.2)); peter({ expr: 'pained', look: -0.5, L: 'reach' }, MAN(0.5, 0.3, -1.2)); }
  if (id === 'hear') { const hrd = f >= w('heard'); peter({ expr: hrd ? 'shock' : 'neutral', R: hrd ? 'cheek' : 'hang', look: -0.2 }, ROOM(-3.0, 0, -3.0)); }
  if (id === 'grabbed' || id === 'webs') {
    walter({ expr: id === 'webs' && f > w('traffic') ? 'relief' : 'nervous', R: 'up', L: 'up' }, CITY(0, 0, 2));
    A(THIEF1, 'thief1', { expr: id === 'webs' && f > w('webs') + 6 ? 'shock' : 'stern', R: 'reach', look: 0.5 }, THIEF_AT(f, S, 0), XS);
    A(THIEF2, 'thief2', { expr: id === 'webs' && f > w('webs') + 11 ? 'shock' : 'grin', L: 'reach', look: -0.5 }, THIEF_AT(f, S, 1), XS);
    for (let i = 0; i < 7; i++) { const sd = i % 2 ? 1 : -1; A(CROWD[i], 'cc' + i, { expr: id === 'webs' ? 'grin' : 'shock', R: 'phone', look: -sd * 0.3 }, CITY(-6.5 + i * 2.1, 0.16, -8.6 - rnd(i) * 1.2), 0.74); }
    if (id === 'webs') { const d = swingDown(f, S); hero({ expr: f > w('webs') ? 'stern' : 'grin', R: f > w('webs') - 2 ? 'reach' : 'up', L: 'up' }, d.p, { blob: !d.anchor }); } }
  if (['filmed', 'hired', 'fired'].includes(id)) {
    const smile = id !== 'fired' || f < w('fired');
    thomas({ expr: id === 'hired' ? 'laugh' : smile ? 'grin' : 'stern', R: id === 'fired' && f >= w('fired') ? 'reach' : id === 'hired' ? 'up' : 'hang', look: id === 'fired' ? -0.7 : 0.2 }, MAN(0.2, 0.3, -2.3));
    if (id !== 'hired') walter({ expr: id === 'fired' && f >= w('fired') ? 'shock' : 'relief', look: 0.6 }, MAN(-1.0, 0.3, -2.0));
    if (id === 'filmed') { hero({ expr: 'pained', look: 0.6, R: 'hang' }, MAN(1.4, 0.3, -1.9));
      for (let i = 0; i < 7; i++) A(CROWD[i], 'g' + i, { expr: 'grin', R: 'phone', look: 0.2 }, MAN((i < 4 ? -8.5 + i * 1.5 : 3.5 + (i - 4) * 1.5), 0, 2.6 + rnd(i) * 1.2), 0.74); } }
  return out;
};

// ---------- effects ----------
const spiderFx = (glow) => (p) => { const g = p.g; g.save(); g.translate(300, 520); g.strokeStyle = '#141018'; g.lineWidth = 16; g.lineCap = 'round';
  for (let k = 0; k < 4; k++) for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, -10 + k * 22); g.lineTo(s * 120, -60 + k * 40); g.lineTo(s * 170, 20 + k * 40); g.stroke(); }
  g.fillStyle = '#141018'; g.beginPath(); g.ellipse(0, 40, 70, 90, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, -60, 46, 40, 0, 0, 7); g.fill();
  g.fillStyle = `rgba(160,255,190,${0.6 + 0.4 * glow})`; g.shadowColor = '#7affb0'; g.shadowBlur = 40; for (const [x, y] of [[0, 20], [-24, 60], [24, 60], [0, 95]]) { g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); }
  g.restore(); };
const phone = (on) => (p) => { const g = p.g; g.save(); g.fillStyle = '#141418'; g.fillRect(200, 300, 200, 380); g.fillStyle = on ? '#ffffff' : '#9ad0ff'; g.fillRect(218, 330, 164, 300);
  g.fillStyle = '#ff3030'; g.beginPath(); g.arc(300, 600, 18, 0, 7); g.fill(); g.restore(); };
const rings = (t, col = '#ffffff') => (p) => { const g = p.g; g.save(); g.strokeStyle = col; g.lineCap = 'round';
  for (let k = 0; k < 3; k++) { const r = (t + k / 3) % 1; g.globalAlpha = (1 - r) * 0.9; g.lineWidth = 14 * (1 - r) + 3; g.beginPath(); g.arc(300, 500, 70 + r * 240, -0.9, 0.9); g.stroke(); }
  g.restore(); };
const splat = (p) => { const g = p.g; g.save(); g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 9; g.lineCap = 'round';
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; g.beginPath(); g.moveTo(300, 500); g.lineTo(300 + Math.cos(a) * 240, 500 + Math.sin(a) * 300); g.stroke(); }
  for (const r of [90, 170, 250]) { g.beginPath(); for (let k = 0; k <= 10; k++) { const a = k / 10 * Math.PI * 2; g.lineTo(300 + Math.cos(a) * r, 500 + Math.sin(a) * r * 1.2); } g.stroke(); }
  g.restore(); };
const sparkle = (t) => (p) => { const g = p.g; g.save(); g.globalAlpha = 1 - t; g.fillStyle = '#ffffff'; g.translate(300, 500); g.rotate(t); for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.lineTo(20, 0); g.lineTo(0, -160 * (1 - t * 0.5)); g.lineTo(-20, 0); g.fill(); } g.restore(); };

export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [], w = (x, n = 0) => K.wordF(S, x, n);
  if (id === 'bite') { const fb = w('bitten'), t = ramp(f, w('glowing'), fb);
    out.push(fx('sp' + q(t, 1), spiderFx(Math.sin(f * 0.3) * 0.5 + 0.5), lerp3(LAB(0.2, 1.25, -2.0), LAB(-0.3, 1.32, -1.55), smooth(t)), 0.16, { order: 6 }));
    if (f >= fb && f < fb + 16) out.push(fx('bt' + q(ramp(f, fb, fb + 16), 1), word('BITE!', ramp(f, fb, fb + 16), '#7affb0'), LAB(-0.4, 1.7, -1.3), 0.5, { order: 8 })); }
  if (id === 'gala') for (let i = 0; i < 3; i++) { const k = ((f + i * 11) % 31) / 31; if (k < 0.3) out.push(fx('fl' + i + q(k, 1), sparkle(k / 0.3), GALA(-3 + i * 2.8, 2.2 + i * 0.3, -2.6), 0.3, { order: 7 })); }
  if (id === 'powers' && f >= w('whisper')) out.push(fx('rg' + (f % 30), rings((f % 30) / 30), CITY(-5.0, 1.6, 26.7), 0.4, { order: 6 }));
  if (id === 'hear' && f >= w('heard')) out.push(fx('rh' + (f % 30), rings((f % 30) / 30, '#ffd23f'), ROOM(-2.8, 1.5, -2.8), 0.42, { order: 6 }));
  if (id === 'hear' && f >= w('help') && f < w('help') + 18) out.push(fx('help' + q(ramp(f, w('help'), w('help') + 18), 1), word('HELP!', ramp(f, w('help'), w('help') + 18), '#ff5a5a'), ROOM(-2.2, 2.3, -3.6), 0.5, { order: 8 }));
  if (id === 'webs') { const fw = w('webs');
    for (let k = 0; k < 2; k++) if (f > fw + k * 5 + 10) { const tp = THIEF_AT(f, S, k); out.push(fx('spl' + k, splat, up(tp, 0.55), 0.62, { order: 7 })); }
    if (f >= fw && f < fw + 16) out.push(fx('thw' + q(ramp(f, fw, fw + 16), 1), word('THWIP!', ramp(f, fw, fw + 16), '#ffffff'), CITY(-0.6, 3.2, -0.5), 0.5, { order: 8 })); }
  if (['grabbed', 'webs', 'filmed'].includes(id)) {                                                             // everyone films it
    const spots = id === 'filmed' ? [0, 1, 2, 3, 4, 5, 6].map((i) => MAN((i < 4 ? -8.5 + i * 1.5 : 3.5 + (i - 4) * 1.5) + 0.25, 1.45, 2.6 + rnd(i) * 1.2 + 0.3)) : [0, 1, 2, 3, 4, 5, 6].map((i) => { return CITY(-6.5 + i * 2.1 + 0.2, 1.4, -8.6 - rnd(i) * 1.2 + 0.3); });
    spots.forEach((p, i) => { const k = (f + i * 7) % 23; if (k < 4) out.push(fx('ph' + i + k, sparkle(k / 4), up(p, 0.25), 0.22, { order: 7 })); }); }
  if (id === 'hired' && f >= w('trending') && f < w('trending') + 20) out.push(fx('tr' + q(ramp(f, w('trending'), w('trending') + 20), 1), word('#1 TRENDING', ramp(f, w('trending'), w('trending') + 20), '#ffd23f'), MAN(0.2, 2.9, -2.1), 0.55, { order: 8 }));
  if (id === 'fired' && f >= w('fired') && f < w('fired') + 18) out.push(fx('fi' + q(ramp(f, w('fired'), w('fired') + 18), 1), word('FIRED!', ramp(f, w('fired'), w('fired') + 18), '#ff5a5a'), MAN(-1.0, 2.6, -1.8), 0.5, { order: 8 }));
  return out;
};
