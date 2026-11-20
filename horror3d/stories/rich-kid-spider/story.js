// "What If The Spider Bit A Rich Kid?" (Twist Tales). New York. Peter Sterling, the spoiled son of the city's richest
// surgeon, is bitten by a glowing spider in his father's lab. He uses his powers to show off: the school trophy webbed
// onto his shelf, climbing past the club queue, swinging to school in gold sneakers. Then he hears Walter, the old
// butler, cry for help: two thieves have him in the middle of the busiest crossing. Peter swings down, webs them to a
// cab, stops the traffic, and the whole city films it. At home his father, in a glittering gold suit, is smiling:
// he hired the thieves to get the family trending. And Walter is fired for screaming too slowly.
// Our own designs only: a red-and-gold suit with a full mask, gold lenses and a gold spider crest (no web pattern),
// a fictional city with generic billboards and yellow cabs, no real brands or landmarks.
import * as SETS from './sets.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, talkAt, actor, fx, word, windUp, settle, snap } from './kit.js';

// ---------- places (far apart in one world) ----------
const B = { lab: [220, 0, 0], gala: [220, 0, 90], room: [300, 0, 0], city: [300, 0, 160], school: [380, 0, 0], club: [380, 0, 90], mansion: [460, 0, 0] };
const at = (k) => (x, y, z) => [B[k][0] + x, B[k][1] + y, B[k][2] + z];
const LAB = at('lab'), GALA = at('gala'), ROOM = at('room'), CITY = at('city'), SCH = at('school'), CLUB = at('club'), MAN = at('mansion');

// ---------- cast ----------
const BOLD = 1.55;
const PETER = { tunic: '#e8436a', skin: '#f2c9a6', hair: '#e8c46a', shoes: '#f2c230' };                                     // pink designer hoodie, blond, gold sneakers
const SUIT_OFF = { tunic: '#c4161c', skin: '#f2c9a6', hair: '#e8c46a', stripes: '#f2c230', crest: '#f2c230', shoes: '#f2c230' };   // mask off, at home
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
const LIGHT_OF = { bite: 'lab', gala: 'day', gifts: 'room', powers: 'blue', trophy: 'room', club: 'night', swing: 'blue', walter: 'day', hear: 'room',
  grabbed: 'blue', webs: 'blue', filmed: 'night', hired: 'night', fired: 'night' };
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
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor } = K;
export { LIGHTS };
const vert = (c, S) => ({ ...c, look: lerp3(c.look, FOCUS[S.id], 0.45), fov: Math.min(76, c.fov * 1.15) });
// CLOSE-UPS: on a word the camera cuts in tight on a face (the reaction), drifts in a little, and cuts back out on the next word
const FACE = (p, s) => [p[0], p[1] + 1.73 * s, p[2]];
const POS = { peterLab: LAB(-0.6, 0, -1.4), thomasGala: GALA(-1.2, 0.62, -5.6), peterPile: ROOM(0.3, 1.3, -1.6), peterCar: CITY(-5.3, 0.16, 25.9), peterHall: SCH(0.4, 0, -1.6),
  queue0: CLUB(1.8, 0, -2.8), walterPorch: MAN(-0.6, 0.3, -2.2), peterWin: ROOM(-3.0, 0, -3.0), walterX: CITY(0, 0, 2), thomasHome: MAN(0.2, 0.3, -2.3), heroHome: MAN(1.4, 0.3, -1.9), walterHome: MAN(-1.0, 0.3, -2.0) };
const CLOSE = {
  bite: [['bitten', null, POS.peterLab, PS, 0.3]], gala: [['father', 'famous', POS.thomasGala, TS, -0.2]], gifts: [['everything', null, POS.peterPile, PS, 0.2]],
  powers: [['whisper', null, POS.peterCar, PS, 0.25]], trophy: [['shelf', null, POS.peterHall, PS, -0.25]], club: [['every', null, POS.queue0, 0.74, 0.3]],
  walter: [['no', null, POS.walterPorch, WS, 0.25]], hear: [['heard', 'help', POS.peterWin, PS, 0.2]], grabbed: [['grabbed', 'middle', POS.walterX, WS, -0.3]],
  filmed: [['smiling', null, POS.thomasHome, TS, 0.15]],
  hired: [['i', 'trending', POS.thomasHome, TS, -0.15], ['trending', 'number', POS.heroHome, PS, 0.35], ['number', null, POS.thomasHome, TS, 0.1]],
  fired: [['walter', 'took', POS.thomasHome, TS, -0.2], ['took', 'scream', POS.walterHome, WS, 0.3], ['scream', null, POS.thomasHome, TS, 0.15]] };
const closeAt = (f, S) => {
  for (const [w0, w1, p, sc, side] of CLOSE[S.id] || []) {
    const a = K.wordF(S, w0), b = w1 ? K.wordF(S, w1) : S.b + 1; if (f < a || f >= b || a === b) continue;
    const fp = FACE(p, sc), base = CAMS[S.id][0].pos; let dx = base[0] - fp[0], dz = base[2] - fp[2]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const c = Math.cos(side), sn = Math.sin(side), rx = dx * c - dz * sn, rz = dx * sn + dz * c, d = 2.7 * sc * (1 - 0.1 * smooth(ramp(f, a, Math.max(a + 1, b))));
    return { pos: [fp[0] + rx * d, fp[1] + 0.04 * sc, fp[2] + rz * d], look: [fp[0], fp[1] - 0.06 * sc, fp[2]], fov: 30, roll: 0, flash: 0, shadowAt: fp, close: true };
  }
  return null;
};
export const dofAt = (f) => { const c = camAt(f); if (c.close || shotAt(f).id === 'swing') return { focus: Math.hypot(...c.pos.map((v, i) => v - c.look[i])), cinf: 6 }; return K.dofAt(f); };
export const camAt = (f) => { const S = shotAt(f); const cl = closeAt(f, S); if (cl) return cl;
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
// ---------- New York architecture (our own generic designs) ----------
// facade tiles: each canvas is one 12 m x 12 m patch (4 bays x 4 floors), repeated over the walls
const BRICKS = ['#8a4a3a', '#9a5a44', '#7a3e32', '#a8785a', '#6e4a3e'], CURTAINS = ['#f2e2b8', '#c8d8e8', '#e8b8a8', '#d8e8c8', '#f4f0e8', '#b8a8d0'];
const winPane = (g, x, y, w, h, s, lit, curtain) => {                              // one window: frame, glass with sky glint, maybe a lit room / curtain
  g.fillStyle = '#f2ede2'; g.fillRect(x - 4, y - 4, w + 8, h + 8);
  if (lit) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#ffe9b0'); gr.addColorStop(1, '#f2b860'); g.fillStyle = gr; }
  else { const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#5a7a9c'); gr.addColorStop(0.45, '#2a3a52'); gr.addColorStop(1, '#1a2436'); g.fillStyle = gr; }
  g.fillRect(x, y, w, h);
  if (curtain) { g.fillStyle = curtain; g.fillRect(x, y, w * 0.32, h); g.fillRect(x + w * 0.68, y, w * 0.32, h); }
  if (!lit) { g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.moveTo(x + w * 0.15, y + h); g.lineTo(x + w * 0.55, y); g.lineTo(x + w * 0.75, y); g.lineTo(x + w * 0.35, y + h); g.fill(); }
  g.fillStyle = '#f2ede2'; g.fillRect(x, y + h * 0.48, w, 4); g.fillRect(x + w / 2 - 2, y, 4, h);
};
const facade = (style, seed) => cv(512, 512, (g, W, H) => {
  const R = (k) => rnd(seed * 131 + k);
  if (style === 'brick') {
    const base = BRICKS[seed % BRICKS.length]; g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 6) { g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(0, y, W, 1); for (let x = (y / 6) % 2 ? 0 : 7; x < W; x += 14) { g.fillRect(x, y, 1, 6); if (R(x * 7 + y) < 0.12) { g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + 1, y + 1, 12, 5); g.fillStyle = 'rgba(0,0,0,0.13)'; } } }
    for (let fy = 0; fy < 4; fy++) for (let bx = 0; bx < 4; bx++) { const x = bx * 128 + 36, y = fy * 128 + 26, k = fy * 4 + bx;
      g.fillStyle = '#d8cfbc'; g.fillRect(x - 10, y - 14, 76, 10); g.fillRect(x - 8, y + 86, 72, 8);           // lintel and sill
      winPane(g, x, y, 56, 82, seed, R(k) < 0.16, R(k + 40) < 0.5 ? CURTAINS[(k + seed) % 6] : null);
      if (R(k + 90) < 0.12) { g.fillStyle = '#c8ccd0'; g.fillRect(x + 8, y + 70, 40, 20); g.fillStyle = '#8a9096'; for (let i = 0; i < 5; i++) g.fillRect(x + 12 + i * 7, y + 74, 3, 12); } }  // air conditioner
  } else if (style === 'deco') {
    const base = ['#d8ccb0', '#cfc2a2', '#e2d8c2', '#bfb39a'][seed % 4]; g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let bx = 0; bx < 4; bx++) { g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(bx * 128, 0, 22, H); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(bx * 128 + 22, 0, 5, H); }
    for (let fy = 0; fy < 4; fy++) for (let bx = 0; bx < 4; bx++) { const x = bx * 128 + 40, y = fy * 128 + 16, k = fy * 4 + bx;
      g.fillStyle = '#2a3446'; g.fillRect(x - 4, y - 4, 74, 104); winPane(g, x, y, 66, 72, seed, R(k) < 0.2, null);
      g.fillStyle = '#7a6a50'; g.fillRect(x - 4, y + 78, 74, 22); g.strokeStyle = '#c8a860'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 4, y + 96); g.lineTo(x + 33, y + 82); g.lineTo(x + 62, y + 96); g.stroke(); }
  } else if (style === 'glass') {
    const top = ['#8ac0e8', '#7ab8c8', '#9ab0d8', '#88c8d0'][seed % 4], bot = ['#1e3a5a', '#16384a', '#24304e', '#1a4048'][seed % 4];
    const gr = g.createLinearGradient(0, 0, W * 0.4, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.moveTo(W * 0.1, H); g.lineTo(W * 0.5, 0); g.lineTo(W * 0.72, 0); g.lineTo(W * 0.32, H); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.moveTo(W * 0.62, H); g.lineTo(W * 0.95, 0); g.lineTo(W, 0); g.lineTo(W * 0.7, H); g.fill();
    for (let y = 0; y < 4; y++) { if (R(y) < 0.5) for (let x = 0; x < 16; x++) if (R(y * 16 + x + 7) < 0.18) { g.fillStyle = 'rgba(255,226,160,0.75)'; g.fillRect(x * 32 + 2, y * 128 + 22, 28, 96); } }
    g.fillStyle = '#c8d4e0'; for (let x = 0; x < W; x += 32) g.fillRect(x, 0, 2, H);
    for (let y = 0; y < 4; y++) { g.fillStyle = 'rgba(10,20,30,0.55)'; g.fillRect(0, y * 128, W, 20); g.fillStyle = '#d8e2ea'; g.fillRect(0, y * 128 + 19, W, 2); }
  } else if (style === 'office') {
    const base = ['#b8b4ac', '#a8aab0', '#c4bcae', '#9aa0a8'][seed % 4]; g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let fy = 0; fy < 4; fy++) { const y = fy * 128 + 30; const gr = g.createLinearGradient(0, y, 0, y + 70); gr.addColorStop(0, '#4a6a7a'); gr.addColorStop(1, '#1e2e3a'); g.fillStyle = gr; g.fillRect(0, y, W, 70);
      for (let x = 0; x < 16; x++) if (R(fy * 16 + x) < 0.14) { g.fillStyle = '#ffe2a0'; g.fillRect(x * 32 + 3, y + 3, 26, 64); }
      g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(0, y, W, 6); g.fillStyle = '#d0d4d8'; for (let x = 0; x < W; x += 32) g.fillRect(x, y, 3, 70);
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, y + 70, W, 6); }
  } else {                                                                          // 'mansion': cream stone, tall arched windows with dark shutters
    g.fillStyle = '#f2ece0'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(0,0,0,0.06)'; for (let y = 0; y < H; y += 32) g.fillRect(0, y, W, 2);
    for (let fy = 0; fy < 2; fy++) for (let bx = 0; bx < 4; bx++) { const x = bx * 128 + 40, y = fy * 256 + 50, k = fy * 4 + bx;
      g.fillStyle = '#2a3a2a'; g.fillRect(x - 26, y, 20, 150); g.fillRect(x + 54, y, 20, 150);
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + 24, y + 4, 34, Math.PI, 0); g.fill(); winPane(g, x, y, 48, 150, seed, R(k) < 0.5, '#f4e8c8');
      g.fillStyle = '#e0d6c4'; g.fillRect(x - 12, y + 154, 72, 10); }
  }
});
const SHOPS = ['DELI', 'PIZZA', 'BAGELS', 'COFFEE', 'PHARMACY', 'DINER', 'SHOES', 'FLOWERS', 'BOOKS', 'BANK', 'HARDWARE', 'LAUNDRY', 'JEWELRY', 'GROCERY', 'TACOS', 'BAKERY'];
const SHOPCOL = [['#1a3a2a', '#ffd23f'], ['#7a1a1a', '#ffffff'], ['#14233e', '#ffffff'], ['#2a1a10', '#f2c27a'], ['#ffffff', '#c41e3a'], ['#141414', '#ff8ad0']];
const shopTex = (seed) => cv(512, 192, (g, W, H) => {                               // a 12 m x 4.5 m strip of shop fronts
  g.fillStyle = '#2a2a30'; g.fillRect(0, 0, W, H);
  for (let b = 0; b < 4; b++) { const x = b * 128 + 8, lit = rnd(seed * 7 + b) < 0.75;
    const gr = g.createLinearGradient(0, 30, 0, 170); gr.addColorStop(0, lit ? '#fff2c8' : '#5a6a7a'); gr.addColorStop(1, lit ? '#f0b050' : '#2a3442'); g.fillStyle = gr;
    if ((b + seed) % 3 === 0) { g.fillRect(x, 40, 60, 140); g.fillStyle = '#4a2a1a'; g.fillRect(x + 66, 40, 46, 140); g.fillStyle = '#d8b060'; g.fillRect(x + 100, 110, 5, 14); }  // door
    else { g.fillRect(x, 40, 112, 120); for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(60,30,20,0.35)'; g.fillRect(x + 6, 70 + i * 32, 100, 5); for (let j = 0; j < 5; j++) { g.fillStyle = ['#e8436a', '#3a8ae8', '#ffd23f', '#3ac88a', '#ffffff'][(i + j + b) % 5]; g.fillRect(x + 10 + j * 19, 56 + i * 32, 12, 14); } } }
    g.fillStyle = '#c8c0b0'; g.fillRect(x - 8, 160, 128, 32); g.fillStyle = '#d8d0c0'; g.fillRect(x - 8, 0, 8, H); }
  g.fillStyle = '#18181c'; g.fillRect(0, 0, W, 30);
});
const awnTex = (a, b) => cv(128, 64, (g, W, H) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 16, 0, 16, H); } g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, H - 8, W, 8); });
const MATS = new Map();
const matOf = (ctx, key, mk) => { if (!MATS.has(key)) MATS.set(key, mk()); return MATS.get(key); };

// one building. Its street side faces `face` ([nx, nz]); fw = frontage width, fd = depth, h = height.
function tower(ctx, parent, { x, z, fw, fd, h, style, seed, face = [0, 1], shop = true, fire = true }) {
  const { THREE, add, box, tbox, texM, toon } = ctx;
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(face[0], face[1]); parent.add(g);
  const F = matOf(ctx, style + (seed % 3), () => texM(facade(style, seed % 3 + (style === 'brick' ? seed % 5 : 0)), 1 / 12, 1 / 12));
  const stone = matOf(ctx, 'stone' + style, () => toon({ color: style === 'brick' ? '#d8cfbc' : style === 'glass' ? '#d0d8e0' : '#cfc6b2' }));
  const iron = matOf(ctx, 'iron', () => toon({ color: '#26262c' })), grey = matOf(ctx, 'grey', () => toon({ color: '#8a8e96' }));
  const nc = { cast: false };
  let roof = h;
  if (style === 'deco') {
    const h1 = h * 0.62, h2 = h * 0.22, h3 = h * 0.1;
    add(tbox(fw, h1, fd, 1), F, 0, h1 / 2, 0, g); add(box(fw + 0.6, 0.6, fd + 0.6), stone, 0, h1 + 0.3, 0, g, nc);
    add(tbox(fw * 0.74, h2, fd * 0.74, 1), F, 0, h1 + h2 / 2, 0, g); add(box(fw * 0.74 + 0.5, 0.5, fd * 0.74 + 0.5), stone, 0, h1 + h2 + 0.25, 0, g, nc);
    add(tbox(fw * 0.48, h3, fd * 0.48, 1), F, 0, h1 + h2 + h3 / 2, 0, g);
    const top = h1 + h2 + h3, cr = add(new THREE.ConeGeometry(fw * 0.3, h * 0.07, 4), stone, 0, top + h * 0.035, 0, g); cr.rotation.y = Math.PI / 4;
    add(new THREE.CylinderGeometry(0.06, 0.35, h * 0.12, 8), grey, 0, top + h * 0.07 + h * 0.06, 0, g);
    add(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3a3a' }), 0, top + h * 0.19, 0, g, nc);
    for (let k = 0; k < 6; k++) for (const s of [-1, 1]) { if (s < 0 && k % 2) continue; add(box(0.45, h1 - 6, 0.4), stone, -fw / 2 + fw * (k + 0.5) / 6, 5 + (h1 - 6) / 2, s * (fd / 2 + 0.15), g, nc); }
    roof = -1;
  } else {
    add(tbox(fw, h, fd, 1), F, 0, h / 2, 0, g);
    if (style === 'brick') {
      add(box(fw + 1.0, 0.9, fd + 1.0), stone, 0, h + 0.1, 0, g, nc); add(box(fw + 0.5, 0.35, fd + 0.5), iron, 0, h - 0.5, 0, g, nc);
      const wt = new THREE.Group(); wt.position.set(fw * 0.2, h + 0.5, -fd * 0.15); g.add(wt);       // the rooftop water tower
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(box(0.16, 2.2, 0.16), iron, a * 0.9, 1.1, b * 0.9, wt, nc);
      add(new THREE.CylinderGeometry(1.45, 1.45, 2.8, 16), matOf(ctx, 'wood', () => toon({ color: '#8a6a4a' })), 0, 3.6, 0, wt);
      for (const y of [2.6, 3.6, 4.6]) add(new THREE.TorusGeometry(1.47, 0.05, 4, 20), iron, 0, y, 0, wt, nc).rotation.x = Math.PI / 2;
      add(new THREE.ConeGeometry(1.6, 1.2, 16), matOf(ctx, 'wroof', () => toon({ color: '#4a3a30' })), 0, 5.6, 0, wt);
      if (fire) for (let k = 0; k * 3 + 7 < Math.min(h - 3, 34); k++) {                                  // the fire escape
        const y = 7 + k * 3, cx = -fw * 0.22, pw = Math.min(5, fw * 0.4), zf = fd / 2 + 0.55;
        add(box(pw, 0.08, 1.1), iron, cx, y, zf, g, nc); add(box(pw, 0.05, 0.05), iron, cx, y + 0.95, zf + 0.53, g, nc); add(box(pw, 0.05, 0.05), iron, cx, y + 0.5, zf + 0.53, g, nc);
        for (const e of [-1, 1]) { add(box(0.05, 0.95, 1.1), iron, cx + e * pw / 2, y + 0.48, zf, g, nc); }
        for (let p = 1; p < 4; p++) add(box(0.04, 0.95, 0.04), iron, cx - pw / 2 + pw * p / 4, y + 0.48, zf + 0.53, g, nc);
        if (k > 0) { const l = add(box(0.55, 3.6, 0.05), iron, cx + pw * 0.15, y - 1.5, zf - 0.1, g, nc); l.rotation.z = 0.62; }
      }
    } else if (style === 'glass') {
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(box(0.35, h, 0.35), stone, a * fw / 2, h / 2, b * fd / 2, g, nc);
      add(tbox(fw * 0.8, 5, fd * 0.8, 1), F, 0, h + 2.5, 0, g); add(tbox(fw * 0.5, 4, fd * 0.5, 1), F, 0, h + 7, 0, g);
      add(new THREE.CylinderGeometry(0.08, 0.2, 14, 6), grey, 0, h + 16, 0, g); add(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3a3a' }), 0, h + 23, 0, g, nc);
      roof = -1;
    } else {
      add(box(fw + 0.4, 0.6, fd + 0.4), stone, 0, h + 0.3, 0, g, nc);
      for (let y = 12; y < h - 4; y += 24) add(box(fw + 0.3, 0.4, fd + 0.3), stone, 0, y, 0, g, nc);
    }
  }
  if (roof > 0) for (let i = 0; i < 2; i++) add(box(2 + rnd(seed + i) * 2, 1.4, 2), grey, (rnd(seed * 3 + i) - 0.5) * fw * 0.6, roof + 0.7, (rnd(seed * 5 + i) - 0.5) * fd * 0.5, g, nc);
  if (shop) {                                                                       // shop fronts, a ledge, striped awnings and a sign
    add(tbox(fw + 0.2, 4.5, fd + 0.2, 1), matOf(ctx, 'shop' + (seed % 4), () => texM(shopTex(seed % 4), 1 / 12, 1 / 4.5)), 0, 2.25, 0, g);
    add(box(fw + 0.7, 0.35, fd + 0.7), stone, 0, 4.65, 0, g, nc);
    const n = Math.max(1, Math.floor(fw / 5)), ac = [['#c41e3a', '#ffffff'], ['#1e6a3a', '#ffffff'], ['#1a3a7a', '#f2e2b8'], ['#e8a020', '#ffffff']][seed % 4];
    const aw = matOf(ctx, 'awn' + (seed % 4), () => texM(awnTex(...ac), 1 / 3, 1));
    for (let k = 0; k < n; k++) { const a = add(box(fw / n * 0.82, 0.07, 1.6), aw, -fw / 2 + fw * (k + 0.5) / n, 3.85, fd / 2 + 0.85, g, nc); a.rotation.x = 0.34; }
    const name = SHOPS[seed % SHOPS.length], cc = SHOPCOL[seed % SHOPCOL.length];
    const sg = SETS.canvasPlane(ctx, Math.min(fw * 0.6, 7), 0.85, 512, g, { lit: true }); sg.draw('s', sign(name, cc[0], cc[1])); sg.mesh.position.set(0, 5.35, fd / 2 + 0.36);
  }
  return g;
}
// a row of buildings along one side of a street, varied styles and heights
function block(ctx, parent, { x0, z0, dx, dz, count, face, depth = 16, seed = 1, tall = 1, first = null }) {
  const styles = ['brick', 'deco', 'brick', 'glass', 'office', 'brick', 'glass', 'deco', 'office'];
  let t = 0;
  for (let i = 0; i < count; i++) {
    const fw = 11 + rnd(seed * 17 + i) * 9, st = i === 0 && first ? first : styles[(seed + i * 5) % styles.length];
    const h = st === 'brick' ? 22 + rnd(seed + i * 3) * 16 : (st === 'office' ? 40 + rnd(seed + i) * 40 : (55 + rnd(seed * 7 + i) * 75) * tall);
    tower(ctx, parent, { x: x0 + dx * (t + fw / 2), z: z0 + dz * (t + fw / 2), fw, fd: depth, h, style: st, seed: seed * 11 + i, face });
    t += fw + (rnd(seed + i * 13) < 0.3 ? 2.5 : 0.2);
  }
}
// far-off skyline painted on big transparent boards around a place, so no view ends in empty fog
const farSky = (seed, dusk) => cv(2048, 512, (g, W, H) => {
  for (let layer = 0; layer < 2; layer++) { let x = 0; while (x < W) { const bw = 24 + rnd(seed + x) * 70, bh = (layer ? 120 : 200) + rnd(seed * 3 + x) * (layer ? 220 : 280);
    g.fillStyle = layer ? (dusk ? '#5a5a7a' : '#8a9ab4') : (dusk ? '#7a7290' : '#a8b8cc'); g.fillRect(x, H - bh, bw, bh);
    if (rnd(x + seed) < 0.15) g.fillRect(x + bw / 2 - 2, H - bh - 40, 4, 40);
    if (layer) { g.fillStyle = dusk ? 'rgba(255,214,140,0.8)' : 'rgba(255,255,255,0.25)'; for (let y = H - bh + 8; y < H - 6; y += 12) for (let xx = x + 4; xx < x + bw - 5; xx += 9) if (rnd(xx * 3 + y) < (dusk ? 0.35 : 0.5)) g.fillRect(xx, y, 4, 6); }
    x += bw + 2; } } });
function skylineRing(ctx, parent, r, dusk) {
  const { THREE } = ctx;
  for (let k = 0; k < 4; k++) { const tex = new THREE.CanvasTexture(farSky(k * 19 + 3, dusk)); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.1, r * 0.55), new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, depthWrite: false }));
    const a = k * Math.PI / 2; m.position.set(Math.sin(a) * r, r * 0.27 - 2, Math.cos(a) * r); m.rotation.y = a + Math.PI; m.userData.ndSkip = true; m.renderOrder = -1; parent.add(m); }
}
// street furniture
function streetBits(ctx, C) {
  const { THREE, add, box, toon, texM } = ctx, nc = { cast: false };
  const red = toon({ color: '#c8202a' }), blue = toon({ color: '#2a4aa8' }), green = toon({ color: '#1e4a2e' }), iron = toon({ color: '#26262c' }), silver = toon({ color: '#b8bcc4' });
  const hydrant = (x, z) => { add(new THREE.CylinderGeometry(0.17, 0.21, 0.6, 12), red, x, 0.46, z, C); add(new THREE.SphereGeometry(0.18, 10, 8), red, x, 0.78, z, C, nc);
    for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 8), silver, x + s * 0.2, 0.58, z, C, nc).rotation.z = Math.PI / 2; };
  const mailbox = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0.16, z); g.rotation.y = ry; C.add(g); add(box(0.55, 0.8, 0.5), blue, 0, 0.75, 0, g);
    const t = add(new THREE.CylinderGeometry(0.25, 0.25, 0.55, 14, 1, false, 0, Math.PI), blue, 0, 1.15, 0, g); t.rotation.z = Math.PI / 2; t.rotation.y = Math.PI / 2;
    for (const a of [-1, 1]) for (const b of [-1, 1]) add(box(0.06, 0.35, 0.06), iron, a * 0.22, 0.18, b * 0.2, g, nc); };
  const bin = (x, z) => { add(new THREE.CylinderGeometry(0.32, 0.27, 0.95, 12), green, x, 0.64, z, C); add(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 12), iron, x, 1.12, z, C, nc); };
  const kiosk = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0.16, z); g.rotation.y = ry; C.add(g);
    add(box(3.0, 2.5, 1.8), toon({ color: '#2a6a3a' }), 0, 1.25, 0, g); add(box(3.5, 0.15, 2.3), toon({ color: '#1e4a2a' }), 0, 2.6, 0, g);
    const f = SETS.canvasPlane(ctx, 2.8, 1.5, 512, g, { lit: true }); f.draw('m', (c, w, h) => { c.fillStyle = '#f4f0e0'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 12; i++) { c.fillStyle = ['#e8436a', '#3a8ae8', '#ffd23f', '#3ac88a', '#a85ae8', '#ff8a3a'][i % 6]; c.fillRect(8 + (i % 6) * 83, 8 + Math.floor(i / 6) * 130, 74, 118);
        c.fillStyle = '#ffffff'; c.fillRect(14 + (i % 6) * 83, 18 + Math.floor(i / 6) * 130, 50, 10); } c.fillStyle = '#1a1a1a'; c.font = '900 30px Arial Black, Arial'; });
    f.mesh.position.set(0, 1.25, 0.91);
    const s = SETS.canvasPlane(ctx, 2.6, 0.45, 512, g, { lit: true }); s.draw('s', sign('NEWS', '#ffd23f', '#1a1a1a')); s.mesh.position.set(0, 2.9, 1.16); };
  const steam = (x, z) => { const st = add(new THREE.CylinderGeometry(0.38, 0.42, 1.9, 14), matOf(ctx, 'steam', () => texM(awnTex('#f26a1a', '#ffffff'), 2, 1)), x, 0.95, z, C);
    st.rotation.z = Math.PI / 2; st.rotation.z = 0; };
  for (const s of [-1, 1]) for (const z of [-58, -33, -14, 16, 29, 47, 71]) { hydrant(s * 10.1, z + 2); bin(s * 7.9, z - 3); }
  for (const z of [-21, 36, 63]) mailbox(-7.9, z, Math.PI / 2); for (const z of [-48, 22, 56]) mailbox(7.9, z, -Math.PI / 2);
  kiosk(-9.6, 34, Math.PI / 2); kiosk(9.6, -38, -Math.PI / 2); kiosk(-14, 9.6, Math.PI);
  for (const [x, z] of [[2.2, 33], [-2.4, -27], [-1.6, 55], [16, -2.2], [-24, 2.0]]) steam(x, z);
  for (const s of [-1, 1]) for (const z of [-64, -52, 38, 52, 77]) { const c = vehicle(ctx, C, { kind: rnd(z + s) < 0.4 ? 'taxi' : 'car', color: ['#3a6aa8', '#e8e8ec', '#2a2a30', '#a82a2a', '#4a8a5a'][Math.floor(rnd(z * s) * 5)], num: '4P' + Math.abs(z) }); c.g.position.set(s * 6.2, 0, z + s * 3); c.g.rotation.y = Math.PI / 2; }
  // bus shelter on the corner
  const bs = new THREE.Group(); bs.position.set(9.4, 0.16, 20); bs.rotation.y = -Math.PI / 2; C.add(bs);
  for (const x of [-1.8, 1.8]) add(box(0.08, 2.4, 0.08), iron, x, 1.2, -0.7, bs, nc);
  add(box(4, 0.1, 1.6), iron, 0, 2.45, 0, bs); add(box(3.6, 2.0, 0.04), new THREE.MeshBasicMaterial({ color: '#a8c8e0', transparent: true, opacity: 0.35 }), 0, 1.2, -0.75, bs, nc);
  const ad = SETS.canvasPlane(ctx, 1.4, 2.0, 256, bs); ad.draw('a', board(['#ff5a8a', '#7a1a8a'], [['FIZZ', 0.18], ['POP', 0.18]])); ad.mesh.position.set(1.15, 1.2, -0.72);
}

// ---------- vehicles: a rounded sedan body (side profile extruded), glass cabin, real wheels; taxi, police, plain car, box truck ----------
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
// ---------- giant LED screens (they glow; a few animate) ----------
const ART = [
  (g, w, h, t) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#5a1aa8'); gr.addColorStop(1, '#e83a8a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h * 0.32); g.rotate(t * 0.6); g.strokeStyle = '#ffd23f'; g.lineWidth = w * 0.03; g.beginPath(); g.arc(0, 0, w * 0.16, 0.3, 5.2); g.stroke(); g.restore();
    txt(g, 'TWIST', w / 2, h * 0.62, h * 0.2, '#ffffff'); txt(g, 'TALES', w / 2, h * 0.84, h * 0.2, '#ffd23f'); },
  (g, w, h, t) => { g.fillStyle = '#06080e'; g.fillRect(0, 0, w, h); const x = ((t * 0.25) % 1.4 - 0.2) * w, gr = g.createLinearGradient(x - w * 0.3, 0, x + w * 0.3, 0); gr.addColorStop(0, 'rgba(60,140,255,0)'); gr.addColorStop(0.5, 'rgba(120,200,255,0.55)'); gr.addColorStop(1, 'rgba(60,140,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a2a4a'; g.strokeStyle = '#9ad0ff'; g.lineWidth = 6; rr(g, w * 0.36, h * 0.12, w * 0.28, h * 0.56, 20); g.fill(); g.stroke(); g.fillStyle = '#3a8ae8'; rr(g, w * 0.39, h * 0.16, w * 0.22, h * 0.46, 10); g.fill();
    txt(g, 'NOVA 9', w / 2, h * 0.84, h * 0.13, '#ffffff'); },
  (g, w, h, t) => { const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.7); gr.addColorStop(0, '#ffd23f'); gr.addColorStop(1, '#ff4a1a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc((i * 97 + t * 40) % w, h - ((t * 60 + i * 53) % h), 8 + i % 4 * 4, 0, 7); g.fill(); }
    g.fillStyle = '#c81e1e'; rr(g, w * 0.42, h * 0.18, w * 0.16, h * 0.5, 30); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(w * 0.42, h * 0.36, w * 0.16, h * 0.08); txt(g, 'FIZZ POP', w / 2, h * 0.86, h * 0.13, '#ffffff'); },
  (g, w, h, t) => { g.fillStyle = '#ff3a8a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(w / 2, h * 0.45, w * 0.32, h * 0.16, -0.15 + Math.sin(t) * 0.05, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.fillRect(w * 0.2, h * 0.52, w * 0.6, h * 0.05); txt(g, 'GOLD KICKS', w / 2, h * 0.82, h * 0.14, '#ffffff'); },
  (g, w, h, t) => { g.fillStyle = '#0a1430'; g.fillRect(0, 0, w, h); g.fillStyle = '#c81e1e'; g.fillRect(0, 0, w * 0.4, h * 0.22); txt(g, 'NEWS 24', w * 0.2, h * 0.12, h * 0.11, '#ffffff');
    g.fillStyle = '#1e3a7a'; g.fillRect(0, h * 0.3, w, h * 0.45); txt(g, 'LIVE', w * 0.5, h * 0.53, h * 0.24, '#ffffff'); g.fillStyle = '#ffd23f'; g.fillRect(0, h * 0.8, w, h * 0.2);
    g.save(); g.beginPath(); g.rect(0, h * 0.8, w, h * 0.2); g.clip(); const s = 'MASKED HERO SPOTTED DOWNTOWN  +++  CITY TRAFFIC STOPPED  +++  '; g.fillStyle = '#141414'; g.font = `900 ${h * 0.12}px Arial Black, Arial`; g.textBaseline = 'middle'; g.textAlign = 'left';
    const off = (t * 160) % (s.length * h * 0.08); g.fillText(s + s, -off, h * 0.9); g.restore(); },
  (g, w, h, t) => { const cols = ['#ffffff', '#ffd23f', '#f2f2f2', '#e8a020', '#141414', '#c81e1e']; const k = Math.floor(t * 2);
    for (let y = 0; y < 6; y++) for (let x = 0; x < 3; x++) { g.fillStyle = cols[(x * 5 + y * 3 + k) % cols.length]; g.fillRect(x * w / 3, y * h / 6, w / 3 - 4, h / 6 - 4); } },
  (g, w, h, t) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a0a3a'); gr.addColorStop(1, '#e83a5a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { const x = w * (0.12 + i * 0.15), b = Math.sin(t * 3 + i) * h * 0.03; g.fillStyle = '#141018'; g.beginPath(); g.arc(x, h * 0.42 + b, w * 0.035, 0, 7); g.fill(); g.fillRect(x - w * 0.03, h * 0.46 + b, w * 0.06, h * 0.2);
      g.lineWidth = w * 0.015; g.strokeStyle = '#141018'; g.beginPath(); g.moveTo(x, h * 0.5 + b); g.lineTo(x + (i % 2 ? 1 : -1) * w * 0.06, h * 0.36 + b); g.stroke(); }
    txt(g, 'THE BIG SHOW', w / 2, h * 0.18, h * 0.11, '#ffd23f'); txt(g, 'NOW PLAYING', w / 2, h * 0.84, h * 0.08, '#ffffff'); },
  (g, w, h, t) => { g.fillStyle = Math.floor(t * 2) % 2 ? '#ffd23f' : '#c81e1e'; g.fillRect(0, 0, w, h); txt(g, 'MEGA', w / 2, h * 0.3, h * 0.22, Math.floor(t * 2) % 2 ? '#c81e1e' : '#ffd23f');
    txt(g, 'SALE', w / 2, h * 0.55, h * 0.22, '#ffffff'); txt(g, '70% OFF', w / 2, h * 0.8, h * 0.13, '#141414'); },
];
function txt(g, s, x, y, size, col) { g.font = `900 ${size}px Arial Black, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = size * 0.14; g.strokeStyle = '#141020'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
// one screen: a glowing canvas in a dark frame, mounted at (x,y,z) facing ry; curved=true wraps a quarter cylinder round a corner
function screen(ctx, parent, list, { x, y, z, w, h, ry = 0, art = 0, anim = false, curved = false, px = 512 }) {
  const { THREE, add, box } = ctx; const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; const m = new THREE.MeshBasicMaterial({ map: tex });
  let mesh;
  if (curved) { const r = w / (Math.PI / 2); mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24, 1, true, 0, Math.PI / 2), m); mesh.position.set(x, y, z); mesh.rotation.y = ry; }
  else { mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); mesh.position.set(x, y, z); mesh.rotation.y = ry;
    const fr = add(box(w + 0.3, h + 0.3, 0.3), matOf(ctx, 'scrframe', () => ctx.toon({ color: '#18181e' })), x, y, z, parent, { cast: false }); fr.rotation.y = ry; fr.translateZ(-0.17); }
  mesh.userData.ndSkip = true; parent.add(mesh);
  const draw = (t) => { const g = c.getContext('2d'); ART[art % ART.length](g, c.width, c.height, t); g.fillStyle = 'rgba(0,0,0,0.12)'; for (let yy = 0; yy < c.height; yy += 4) g.fillRect(0, yy, c.width, 1); tex.needsUpdate = true; };
  draw(0); if (anim) list.push({ draw, last: -1 });
  return mesh;
}
// Twist-Square crossing: every corner building wrapped in screens, a curved screen on each corner, blade signs, and a tower of screens closing the avenue
function screensSquare(ctx, C, list) {
  const { THREE, add, box, toon } = ctx; let a = 0;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const fx = sx * 11.35, fz = sz * 11.35, ryA = -sx * Math.PI / 2, ryC = sz > 0 ? Math.PI : 0;
    screen(ctx, C, list, { x: fx, y: 9.5, z: sz * 19, w: 9, h: 6.5, ry: ryA, art: a++, anim: true });               // on the avenue face
    screen(ctx, C, list, { x: fx, y: 18.5, z: sz * 17, w: 12, h: 7, ry: ryA, art: a++, anim: a % 3 === 0 });
    screen(ctx, C, list, { x: sx * 19, y: 10.5, z: fz, w: 10, h: 7.5, ry: ryC, art: a++, anim: true });             // on the cross-street face
    screen(ctx, C, list, { x: sx * 24, y: 21, z: fz, w: 14, h: 8, ry: ryC, art: a++ });
    const qy = sx > 0 ? (sz > 0 ? 0 : Math.PI / 2) : (sz > 0 ? -Math.PI / 2 : Math.PI);                              // quarter cylinder bulging out of the corner
    screen(ctx, C, list, { x: sx * 13.6, y: 13, z: sz * 13.6, w: 5.2, h: 10, ry: qy, art: 5, anim: true, curved: true });
    const bl = new THREE.Group(); bl.position.set(fx - sx * 0.1, 12, sz * 24); C.add(bl);                          // a vertical blade sign sticking out
    add(box(0.35, 13, 2.0), toon({ color: '#141418' }), 0, 0, 0, bl, { cast: false });
    for (const s of [-1, 1]) { const p = SETS.canvasPlane(ctx, 1.8, 12.6, 256, bl); p.draw('b', (g, w, h) => { g.fillStyle = '#141418'; g.fillRect(0, 0, w, h); const word = ['TWIST', 'SQUARE', 'NOVA', 'STAGE'][(a + (sz > 0 ? 1 : 0)) % 4];
      g.font = `900 ${w * 0.62}px Arial Black, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; [...word].forEach((ch, i) => g.fillText(ch, w / 2, h * (i + 0.7) / (word.length + 0.4))); });
      p.mesh.position.set(s * 0.19, 0, 0); p.mesh.rotation.y = s * Math.PI / 2; }
  }
  const T = new THREE.Group(); T.position.set(0, 0, -178); C.add(T);                                                // the tower of screens at the end of the avenue
  add(ctx.tbox(14, 70, 12, 1), matOf(ctx, 'glass1', () => ctx.texM(facade('glass', 1), 1 / 12, 1 / 12)), 0, 35, 0, T);
  for (let k = 0; k < 6; k++) screen(ctx, T, list, { x: 0, y: 7 + k * 9.6, z: 6.2, w: 12.5, h: 8.6, art: (k * 3 + 1) % ART.length, anim: k < 3 });
  screen(ctx, T, list, { x: 0, y: 71.5, z: 4, w: 8, h: 5, art: 2 });
  add(new THREE.CylinderGeometry(0.15, 0.3, 14, 8), toon({ color: '#8a8e96' }), 0, 84, 0, T);
}
// street dressing near the crossing: planters with shrubs, white bollards, manhole covers, NYC mast-arm signals
function crossingBits(ctx, C) {
  const { THREE, add, box, toon } = ctx; const nc = { cast: false };
  const con = matOf(ctx, 'planter', () => toon({ color: '#d8d0c0' })), leaf = [toon({ color: '#2e7a3a' }), toon({ color: '#4a9a3a' }), toon({ color: '#7a3a6a' })], white = matOf(ctx, 'bol', () => toon({ color: '#eeeeea' }));
  for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { const x = s * 9.9, z = s * (14 + k * 3.2);
    add(new THREE.CylinderGeometry(0.75, 0.55, 0.9, 16), con, x, 0.61, z, C); for (let j = 0; j < 4; j++) add(new THREE.SphereGeometry(0.42 - j * 0.05, 10, 8), leaf[(j + k) % 3], x + Math.cos(j * 2) * 0.3, 1.2 + j * 0.08, z + Math.sin(j * 2) * 0.3, C, nc); }
  for (let k = 0; k < 12; k++) { const z = 16 + k * 1.4; add(new THREE.CylinderGeometry(0.15, 0.17, 0.95, 10), white, 0, 0.48, z, C); add(new THREE.SphereGeometry(0.15, 8, 6), white, 0, 0.95, z, C, nc); }
  for (const [x, z] of [[2.5, 18], [-3, 26], [3.4, -22], [-2, -40], [1.5, 44]]) add(new THREE.CylinderGeometry(0.45, 0.45, 0.02, 18), matOf(ctx, 'manhole', () => toon({ color: '#2a2a2e' })), x, 0.012, z, C, nc);
  for (const [sx, sz] of [[-1, -1], [1, 1], [-1, 1], [1, -1]]) {                                                    // mast-arm signals with yellow heads
    const px = sx * 8.2, pz = sz * 8.2, pole = toon({ color: '#3a3e44' }); add(new THREE.CylinderGeometry(0.14, 0.18, 6.4, 10), pole, px, 3.2, pz, C);
    const arm = add(box(5.5, 0.14, 0.14), pole, px - sx * 2.8, 6.1, pz, C, nc);
    for (const d of [2.2, 4.6]) { const hx = px - sx * d; add(box(0.42, 1.25, 0.42), toon({ color: '#e8b81a' }), hx, 5.3, pz, C, nc);
      ['#ff2a2a', '#ffb81a', '#2aff6a'].forEach((col, i) => add(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: i === ((sx * sz > 0) ? 0 : 2) ? col : '#2a2a2a' }), hx, 5.7 - i * 0.38, pz + sz * 0.22, C, nc)); }
    const sg = SETS.canvasPlane(ctx, 2.4, 0.42, 256, C, { lit: true }); sg.draw('s', sign(sz > 0 ? 'W 44 ST' : 'TWIST AVE', '#1e6a3a', '#ffffff')); sg.mesh.position.set(px - sx * 1.2, 6.55, pz); sg.mesh.rotation.y = sz > 0 ? Math.PI : 0;
  }
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
  tower(ctx, Gg, { x: 0, z: -16, fw: 26, fd: 16, h: 46, style: 'glass', seed: 1, shop: false }); tower(ctx, Gg, { x: -25, z: -18, fw: 18, fd: 14, h: 95, style: 'deco', seed: 2 }); tower(ctx, Gg, { x: 24, z: -18, fw: 18, fd: 14, h: 70, style: 'office', seed: 3 });
  block(ctx, Gg, { x0: -36, z0: -32, dx: -1, dz: 0, count: 3, face: [0, 1], seed: 21 }); block(ctx, Gg, { x0: 35, z0: -32, dx: 1, dz: 0, count: 3, face: [0, 1], seed: 22 }); skylineRing(ctx, Gg, 210, false);
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
  add(tbox(14, 0.1, 400, 2), texM(P.stone(94, 30, 6, 30, 64, 64), 3, 80, '#7a7e86'), 0, -0.05, 0, C, { cast: false });
  add(tbox(400, 0.1, 14, 2), texM(P.stone(94, 30, 6, 30, 64, 64), 80, 3, '#7a7e86'), 0, -0.06, 0, C, { cast: false });
  for (const s of [-1, 1]) { add(tbox(4, 0.16, 400, 1), texM(P.stone(95, 30, 8, 60), 1, 80, '#b0aca4'), s * 9, 0.08, 0, C, { cast: false }); add(tbox(400, 0.16, 4, 1), texM(P.stone(95, 30, 8, 60), 80, 1, '#b0aca4'), 0, 0.08, s * 9, C, { cast: false }); }
  for (let k = -6; k <= 6; k++) { if (k === 0) continue; for (let j = 0; j < 4; j++) add(box(0.3, 0.012, 2.5), basic('#f4f4ee'), 0, 0.01, k * 12 + j * 3 - 4.5, C, { cast: false }); }
  for (const s of [-1, 1]) for (let k = 0; k < 8; k++) add(box(0.7, 0.012, 3.2), basic('#f4f4ee'), -5.6 + k * 1.6, 0.01, s * 8.6, C, { cast: false });   // zebra
  for (const s of [-1, 1]) for (const zz of [-1, 1]) block(ctx, C, { x0: s * 19.5, z0: zz * 11.5, dx: 0, dz: zz, count: 10, face: [-s, 0], seed: 3 + s + zz * 2 + 4, first: (s + zz) % 4 ? 'glass' : 'deco' });   // the avenue
  for (const s of [-1, 1]) for (const xs of [-1, 1]) block(ctx, C, { x0: xs * 27.8, z0: s * 19.5, dx: xs, dz: 0, count: 6, face: [0, -s], seed: 30 + s + xs * 3, tall: 1.2 });   // the cross street
  streetBits(ctx, C); skylineRing(ctx, C, 240, false);
  const screens = []; screensSquare(ctx, C, screens); crossingBits(ctx, C);
  for (const z of [-40, -25, 25, 40, 60, 80]) for (const s of [-1, 1]) { const lg = new THREE.Group(); C.add(lg); SETS.streetLamp(ctx, lg, s * 7.6, z, { h: 5 }); }
  for (const [x, z] of [[-8.5, 30], [8.5, 46], [-8.5, 62], [8.5, -30]]) SETS.tree(ctx, C, x, z, 1.1);
  const cabs = []; for (let i = 0; i < 11; i++) { const kind = i === 4 ? 'police' : i === 8 ? 'truck' : i % 4 === 3 ? 'car' : 'taxi';
    const c = vehicle(ctx, C, { kind, color: kind === 'car' ? ['#3a6aa8', '#e8e8ec', '#2a2a30'][i % 3] : kind === 'truck' ? '#2a5aa8' : '#f2c21a', num: (3 + i) + 'K' + (17 + i * 3) }); c.g.rotation.y = i % 2 ? -Math.PI / 2 : Math.PI / 2; cabs.push(c.g); }
  const liftCab = vehicle(ctx, C, { kind: 'taxi', num: '5T88' }); liftCab.g.rotation.y = Math.PI / 2;
  const stuckCab = vehicle(ctx, C, { kind: 'taxi', num: '9W21' }); stuckCab.g.position.set(...[CAB[0] - B.city[0], 0, CAB[2] - B.city[2]]); stuckCab.g.rotation.y = 0.4;
  for (const [x, z, k] of [[-6.4, -16, 'police'], [6.4, 15, 'taxi'], [-6.4, 22, 'taxi'], [6.4, -19, 'truck']]) { const v = vehicle(ctx, C, { kind: k, color: '#2a5aa8', num: '2H' + Math.round(Math.abs(z)) }); v.g.position.set(x, 0, z); v.g.rotation.y = Math.PI / 2; }


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
  add(tbox(14, 14, 2, 1), texM(facade('brick', 4), 1 / 12, 1 / 12), 0, 7, -6.4, Cl); tower(ctx, Cl, { x: -16, z: -10, fw: 16, fd: 14, h: 30, style: 'brick', seed: 5 }); tower(ctx, Cl, { x: 16, z: -10, fw: 16, fd: 14, h: 80, style: 'glass', seed: 6 }); skylineRing(ctx, Cl, 200, true);
  const nn = SETS.canvasPlane(ctx, 5, 1.6, 512, Cl); nn.draw('n', neon('VELVET ROOM', '#ff3ac8')); nn.mesh.position.set(0, 6.5, -5.35);
  add(box(2, 2.6, 0.1), toon({ color: '#3a0a2a' }), 0, 1.3, -5.38, Cl);
  for (let i = 0; i < 7; i++) add(new THREE.CylinderGeometry(0.04, 0.05, 0.9, 8), goldM, 1.4 + i * 0.9, 0.45, -3.6, Cl);
  for (let i = 0; i < 6; i++) tube(ctx, [1.4 + i * 0.9, 0.85, -3.6], [2.3 + i * 0.9, 0.85, -3.6], 0.035, toon({ color: '#c41e3a' }), Cl);
  const clubL = new THREE.PointLight('#ff4ad0', 6, 14, 1.3); clubL.position.set(0, 5.5, -3.5); Cl.add(clubL);

  // ===== the Sterling mansion: white columns, gold doors, fountain, the gold supercar =====
  const M = grp('mansion');
  add(tbox(90, 0.1, 60, 1), texM(P.stone(96, 30, 10, 70), 18, 12, '#d8d4c8'), 0, -0.05, 0, M, { cast: false });
  add(tbox(30, 0.1, 6, 1), texM(P.stone(95, 100, 30, 40), 6, 1, '#4a8a3a'), -14, 0.0, 6, M, { cast: false });
  const wallW = texM(facade('mansion', 1), 1 / 12, 1 / 12); skylineRing(ctx, M, 200, true);
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
  const hedge = toon({ color: '#2e6a2e' }), pot = toon({ color: '#d8d0c0' });
  for (const sx of [-1, 1]) { add(box(9, 1.1, 1.0), hedge, sx * 9, 0.55, 1.2, M); for (const x of [4.2, 13.8]) { add(box(0.9, 0.7, 0.9), pot, sx * x, 0.35, 1.2, M); add(new THREE.SphereGeometry(0.75, 12, 10), hedge, sx * x, 1.4, 1.2, M); }
    for (let k = 0; k < 4; k++) { const lp = new THREE.Group(); M.add(lp); add(new THREE.CylinderGeometry(0.07, 0.1, 3.2, 8), goldM, sx * (3.4 + k * 3.2), 1.6, 9.5, lp); add(new THREE.SphereGeometry(0.25, 10, 8), basic('#fff2c0'), sx * (3.4 + k * 3.2), 3.3, 9.5, lp, { cast: false }); } }
  for (let i = -16; i <= 16; i++) add(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8), white, i * 1.0, 11.45, -5.6, M, { cast: false });
  add(box(34, 0.2, 0.4), white, 0, 11.95, -5.6, M); add(box(34.6, 0.6, 12.6), toon({ color: '#5a6a7a' }), 0, 11.3, -11.4, M);
  const gate = new THREE.Group(); gate.position.z = 13; M.add(gate); for (let i = -12; i <= 12; i++) if (Math.abs(i) > 2) add(box(0.08, 2.4, 0.08), goldM, i * 0.9, 1.2, 0, gate); add(box(22, 0.12, 0.12), goldM, 0, 2.3, 0, gate);
  const porch = new THREE.PointLight('#ffe2a0', 0, 12, 1.3); porch.position.set(0, 4, -3); M.add(porch);
  for (const x of [-9, 9]) { const lg = new THREE.Group(); M.add(lg); SETS.streetLamp(ctx, lg, x, 2, { h: 3.6, on: true }); }

  // webs: four thin white lines we stretch between points each frame
  const webM = toon({ color: '#ffffff' }), webs = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 6), webM); m.visible = false; ctx.world.add(m); return m; });
  return { tank, tankL, sky1, skyDay, skyNight, roomL, cabs, liftCab: liftCab.g, cup, porch, webs, screens, THREE };
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
  if (P.screens && W.city) for (const sc of P.screens) { const k = Math.floor(f / 3); if (k !== sc.last) { sc.last = k; sc.draw(f / 30); } }
  P.liftCab.position.set(...W.liftCab); P.liftCab.rotation.y = 0;
  P.cup.position.set(...W.cup);
  P.porch.intensity = W.porch;
  for (let i = 0; i < 4; i++) setWeb(P, i, W.webs[i] && W.webs[i][0], W.webs[i] && W.webs[i][1]);
};

// ---------- where everything is, frame by frame ----------
const ptoward = (a, b, t) => lerp3(a, b, Math.max(0, Math.min(1, t)));
export const worldAt = (f) => {
  const S = shotAt(f), id = S.id, w = (x, n = 0) => K.wordF(S, x, n);
  const W = { city: ['powers', 'swing', 'grabbed', 'webs'].includes(id), night: false, traffic: f, stopped: ['webs'].includes(id), liftCab: [-150, -10, 0], cup: [-1.8, 0.62, -4.15], porch: ['filmed', 'hired', 'fired'].includes(id) ? 4 : 0, webs: [] };
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
  const peter = (o, pos, x) => A(PETER, 'peter', o, pos, PS, x), hero = (o, pos, x) => A(SUIT, 'hero', o, pos, PS, x), heroOff = (o, pos, x) => A(SUIT_OFF, 'heroOff', o, pos, PS, x);
  const thomas = (o, pos, x) => A(THOMAS, 'thomas', o, pos, TS, x), walter = (o, pos, x) => A(WALTER, 'walter', o, pos, WS, x);
  if (id === 'bite') { const bit = f >= w('bitten'); peter({ expr: bit ? 'shock' : 'grin', R: 'reach', look: 0.4 }, LAB(-0.6, 0, -1.4)); }
  if (id === 'gala') { thomas({ expr: 'grin', R: 'up', look: 0.2 }, GALA(-1.2, 0.62, -5.6));
    for (let i = 0; i < 7; i++) A(CROWD[i], 'c' + i, { expr: i % 2 ? 'smile' : 'grin', R: i % 3 ? 'hang' : 'up', look: (i - 3) * 0.1 }, GALA(-4.2 + i * 1.3 + rnd(i) * 0.4, 0, -2.9 + rnd(i + 3) * 0.8), 0.76); }
  if (id === 'gifts') peter({ expr: f >= w('everything') ? 'laugh' : 'grin', R: 'up', L: 'up', look: f >= w('everything') ? 0 : 0.3 }, ROOM(0.3, 1.3, -1.6));
  if (id === 'powers') { const fc = w('cars');
    if (f < fc) { const t = ramp(f, S.a, fc); peter({ expr: 'grin', R: 'up', L: 'reach', look: 0.5 }, CITY(-11.1, lerp(2.0, 4.6, t), 21), { blob: false }); }
    else peter({ expr: f > w('whisper') ? 'nervous' : 'laugh', R: 'up', L: 'up', look: f > w('whisper') ? -0.7 : 0.3 }, CITY(-5.3, 0.16, 25.9)); }
  if (id === 'trophy') peter({ expr: f >= w('shelf') ? 'laugh' : f >= w('trophy') ? 'grin' : 'smile', R: f >= w('shelf') ? 'up' : 'reach', look: f >= w('shelf') ? 0 : 0.4 }, SCH(0.4, 0, -1.6));
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
    const fired = id === 'fired' && f >= w('fired'), smug = id === 'fired' && f >= w('took');
    thomas({ expr: id === 'hired' ? (f >= w('trending') ? 'grin' : 'laugh') : id === 'fired' ? (smug ? 'grin' : 'stern') : 'grin',
      R: fired && !smug ? 'point' : id === 'hired' ? 'up' : 'hang', look: id === 'fired' && !smug ? -0.7 : 0.1,
      talk: id === 'filmed' ? null : talkAt(f, 1.15) }, POS.thomasHome, { roll: id === 'filmed' ? 0 : 0.03 * ((talkAt(f) || { open: 0 }).open) * Math.sin(f * 0.7) });
    if (id !== 'hired') walter({ expr: fired ? 'shock' : 'relief', R: fired ? 'cheek' : 'hang', look: 0.5 }, POS.walterHome);
    heroOff({ expr: id === 'filmed' ? 'grin' : id === 'hired' ? (f >= w('trending') ? 'shock' : 'nervous') : 'dazed', look: -0.5, R: id === 'hired' && f >= w('trending') ? 'cheek' : 'hang' }, POS.heroHome);
    if (id === 'filmed') for (let i = 0; i < 7; i++) A(CROWD[i], 'g' + i, { expr: 'grin', R: 'phone', look: 0.2 }, MAN((i < 4 ? -8.5 + i * 1.5 : 3.5 + (i - 4) * 1.5), 0, 2.6 + rnd(i) * 1.2), 0.74); }
  if (['powers', 'swing'].includes(id)) for (let i = 0; i < 10; i++) {                                         // people walking on the sidewalks
    const sd = i % 2 ? 1 : -1, z = ((i * 23 + sd * f * 0.045 * (0.8 + rnd(i) * 0.4)) % 140 + 140) % 140 - 30;
    A(CROWD[i % 7], 'wk' + i, { expr: i % 3 ? 'neutral' : 'smile', look: sd * 0.8, bob: Math.abs(Math.sin(f * 0.25 + i)) * 0.03, R: i % 4 === 0 ? 'phone' : 'hang' }, CITY(sd * (9.4 + rnd(i + 5) * 1.4), 0.16, z), 0.72); }
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
    if (f >= fb && f < fb + 16) out.push(fx('bt' + q(ramp(f, fb, fb + 16), 1), word('BITE!', ramp(f, fb, fb + 16), '#7affb0'), LAB(-0.2, 1.75, -1.0), 0.3, { order: 8 })); }
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
