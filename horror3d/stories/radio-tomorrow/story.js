// "My Grandpa's Radio Plays Tomorrow's News" (Part 1). Grandpa's old valve radio glows amber at night and reads out
// tomorrow. First it warns of a girl on a red bicycle at the Mill Road corner: he grabs her handlebars and a runaway
// lorry thunders past where she would have been. Next it warns of a kitchen fire at number twelve: he hammers on the
// door and the mum runs out with her baby. The third night it names an old man. He begs me not to let him go out.
// Ten fourteen: his chair is empty. Ten fifteen at the corner: the lorry is metres away, and the picture freezes.
// The end line asks viewers: SAVE HIM or LET IT HIT? The top comment decides Part 2.
// Look: bright cards with bold ink edges; Grandpa with white hair, white moustache and round glasses; a detailed
// sitting room (wallpaper, planks, armchair, standard lamp, bookshelf, clock, moonlit window); Mill Road as a real
// steep street of terraced houses running down to a junction with a street clock; a real bicycle (spoked wheels,
// cranks and pedals that turn while she pedals) and a real lorry (cab, grille, mirrors, box body, six wheels).
// Camera: slow push-ins on the radio, a wide low shot up the hill, a low angle on the grab, the lorry passing
// behind them, a close push on Grandpa's face, and a wide hold on the empty chair.
import * as SETS from './sets.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

// ---------- places ----------
const RB = [160, 0, 0], R = (x, y, z) => [RB[0] + x, RB[1] + y, RB[2] + z];          // Grandpa's sitting room
const MB = [160, 0, 90], M = (x, y, z) => [MB[0] + x, MB[1] + y, MB[2] + z];          // Mill Road and the junction
const elev = (z) => (z < -6 ? (-6 - z) * 0.14 : 0);                                    // Mill Road climbs away from the junction
const ME_ = (x, z, dy = 0) => M(x, elev(z) + dy, z);

// ---------- cast: everyone different at a glance, bold ink edges ----------
const BOLD = 1.55;
const GP = { tunic: '#8a6440', skin: '#f2d2b6', hair: '#dfe2e8', moustache: '#eef0f2', brows: '#eef0f2', glasses: '#2a2420', stout: true };     // cardigan, white hair, glasses
const GPC = { ...GP, tunic: '#40536e', cap: '#6a5a48', brim: '#6a5a48' };                                                                      // in his coat and flat cap
const ME = { tunic: '#2f86d8', skin: '#f5c9a0', hair: '#2a1a12' };                                                                             // me: blue hoodie
const GIRL = { tunic: '#f4c534', skin: '#e8b48e', hair: '#5a2e16', long: '#5a2e16' };                                                         // yellow top, long brown hair
const MUM = { tunic: '#2a9a8a', skin: '#c99067', hair: '#1e1410', long: '#1e1410', dress: '#2a9a8a' };                                        // the mum at number twelve: teal dress, long black hair
const GPS = 0.8, MES = 0.62, GIS = 0.7, MUS = 0.76;
const N12 = { x: -6.6, z: -28.5 }, N12DOOR = ME_(-6.62, -28.5), N12WIN = ME_(-6.62, -29.55, 1.35), GPKNOCK = ME_(-6.05, -28.15, 0.13);

const RADIO = R(-0.25, 0.62, -1.45), DIAL = R(-0.25, 0.74, -1.31), GPROOM = R(-0.66, 0, -0.9), MEROOM = R(0.6, 0, 0.55), CHAIR = R(0.75, 0.7, -1.35);
const BIKE_X = 0.7, STOP_Z = -5.2, GPGRAB = ME_(-0.25, -5.0), LANE_Z = 1.3, HIT_X = -2.0, GPHIT = M(HIT_X, 0, 1.45), SCLOCK = M(-4.3, 0, -4.4);

const IDS = ['radio', 'broadcast', 'coat', 'hill', 'grab', 'lorry', 'shaking', 'warn2', 'knock', 'smoke', 'night2', 'oldman', 'switch', 'plea', 'empty', 'corner'];
const CAMS = {
  radio: [{ pos: R(0.35, 1.15, 0.9), look: R(-0.5, 1.0, -1.3), fov: 46 }, { pos: R(0.05, 1.05, -0.1), look: R(-0.5, 0.95, -1.3), fov: 42 }],          // push in from the room to the radio
  broadcast: [{ pos: R(-0.18, 0.8, -0.72), look: DIAL, fov: 34 }, { pos: R(-0.22, 0.77, -0.92), look: DIAL, fov: 28 }],                          // the glowing dial, closer and closer
  coat: [{ pos: R(0.7, 1.45, 0.95), look: R(1.55, 1.35, 0.65), fov: 36 }, { pos: R(-0.9, 1.5, 1.9), look: R(1.3, 1.2, 0.6), fov: 46 }],             // zoom out: from his buttons to the whole room
  hill: [{ pos: M(-2.6, 2.4, -1.6), look: SCLOCK.map((v, i) => v + [0, 3.0, 0][i]), fov: 30 }, { pos: ME_(1.3, -6.5, 0.5), look: ME_(0.4, -24, 1.4), fov: 36 }],   // the clock says 10:14, then low and wide up the hill
  grab: [{ pos: ME_(-1.4, -1.9, 0.4), look: ME_(0.3, -6, 0.9), fov: 44 }, { pos: ME_(-1.1, -2.6, 0.35), look: ME_(0.3, -5.4, 1.0), fov: 40 }],    // low angle as he steps out
  lorry: [{ pos: ME_(1.6, -10.5, 1.45), look: M(0.2, 1.4, 0.8), fov: 42 }, { pos: ME_(1.5, -10.0, 1.4), look: M(0.0, 1.5, 0.8), fov: 40 }],        // from up the hill: them in front, the lorry behind
  shaking: [{ pos: ME_(-0.7, -2.2, 1.4), look: ME_(0.15, -5.1, 1.25), fov: 46 }, { pos: ME_(-0.6, -2.7, 1.38), look: ME_(0.15, -5.1, 1.25), fov: 42 }],
  warn2: [{ pos: R(0.3, 1.2, -0.2), look: R(-0.45, 1.05, -1.25), fov: 44 }, { pos: R(0.12, 1.1, -0.5), look: R(-0.4, 0.95, -1.35), fov: 40 }],          // the second warning
  knock: [{ pos: ME_(-2.6, -25.4, 1.6), look: ME_(-6.4, -28.6, 1.5), fov: 44 }, { pos: ME_(-3.2, -26.2, 1.5), look: ME_(-6.4, -28.6, 1.45), fov: 40 }],
  smoke: [{ pos: ME_(-2.4, -31.6, 1.35), look: ME_(-6.2, -28.6, 1.5), fov: 46 }, { pos: ME_(-2.2, -31.2, 1.3), look: ME_(-5.4, -28.4, 1.4), fov: 48 }],
  night2: [{ pos: R(0.85, 1.4, 1.35), look: R(-0.4, 0.95, -1.3), fov: 42 }, { pos: R(0.7, 1.35, 1.0), look: R(-0.4, 0.9, -1.35), fov: 38 }],       // over my shoulder
  oldman: [{ pos: R(-0.1, 0.9, -0.2), look: R(-0.75, 1.35, -0.95), fov: 48 }, { pos: R(-0.2, 0.95, -0.38), look: R(-0.76, 1.4, -0.95), fov: 44 }],   // low past the radio up to his face
  switch: [{ pos: R(0.95, 1.3, 1.25), look: R(-0.6, 1.2, -1.1), fov: 40 }, { pos: R(0.75, 1.3, 1.0), look: R(-0.75, 1.35, -1.0), fov: 36 }],
  plea: [{ pos: R(-0.3, 1.5, 0.95), look: R(-0.78, 1.45, -0.95), fov: 38 }, { pos: R(-0.45, 1.5, 0.4), look: R(-0.78, 1.47, -0.95), fov: 34 }],   // push in on his face
  empty: [{ pos: R(-0.5, 1.6, 1.85), look: R(0.6, 1.0, -1.4), fov: 50 }, { pos: R(-0.1, 1.35, 1.0), look: R(0.6, 0.95, -1.4), fov: 44 }],          // wide: the empty chair, the radio glowing, the clock
  corner: [{ pos: M(-7.4, 1.25, 4.7), look: M(3.0, 1.5, 1.3), fov: 46 }, { pos: M(-6.2, 1.15, 4.1), look: M(-0.6, 1.5, 1.3), fov: 38 }],
};
const room = (L) => ({ ...L, fogNear: 8, fogFar: 40 });
const LIGHTS = {
  night: room({ ...MOODS.moonNight, hemi: 0.6, sky: '#8a9ad0', ground: '#3a2a22', gain: '#fff2e2', lift: '#06040a', vig: 0.42, sat: 1.12 }),
  morning: room({ ...MOODS.sunClouds, hemi: 1.05, sky: '#d8e8f8', ground: '#8a6a50', gain: '#ffffff', lift: '#000000', vig: 0.22, sat: 1.14 }),
  street: { ...MOODS.sunClouds, fogNear: 30, fogFar: 160, clouds: 0.5, sat: 1.16, vig: 0.2 },
  dusk: { ...MOODS.evening, fogNear: 20, fogFar: 120, hemi: 0.85, vig: 0.34, sat: 1.15, clouds: 0.45, cloudCol: '#ffb88a', cloudDark: '#6a4a6a' },
};
const FOCUS = (S) => ({ radio: RADIO.map((v, i) => v + [0, 0.15, 0][i]), broadcast: DIAL, coat: R(1.5, 1.35, 0.65), hill: ME_(0.6, -18, 1.2), grab: ME_(0.3, -5.2, 0.95),
  lorry: M(0.2, 1.3, 0.5), shaking: ME_(0.25, -5.1, 1.2), night2: R(-0.5, 1.0, -1.2), oldman: R(-0.76, 1.4, -0.95), switch: R(-0.7, 1.3, -0.95), plea: R(-0.78, 1.47, -0.95),
  empty: CHAIR, corner: M(HIT_X, 1.2, 1.4), warn2: RADIO.map((v, i) => v + [0, 0.25, 0][i]), knock: ME_(-6.3, -28.4, 1.4), smoke: ME_(-5.6, -28.6, 1.3) }[S.id]);
const NIGHT = new Set(['radio', 'broadcast', 'warn2', 'night2', 'oldman', 'switch', 'plea']);
const STREET = ['hill', 'grab', 'lorry', 'shaking', 'corner'], DUSK = ['knock', 'smoke'];
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (STREET.includes(S.id) ? 'street' : DUSK.includes(S.id) ? 'dusk' : NIGHT.has(S.id) ? 'night' : 'morning'),
  tweak: (L_, S, f) => {
    if (S.id === 'plea') L_.vig = 0.6;
    if (S.id === 'empty') L_.vig = 0.4 + 0.2 * ramp(f, S.a, S.b);
    if (S.id === 'corner' && f >= S.beat) { const t = ramp(f, S.beat, S.beat + 8); L_.sat = 1.16 - 0.8 * t; L_.vig = 0.2 + 0.4 * t; }   // freeze: the colour drains out
  },
  kicks: ['lorry', 'knock'],
  focus: (S) => FOCUS(S),
  shadowAt: (S) => (STREET.includes(S.id) || DUSK.includes(S.id) ? FOCUS(S) : R(0, 1, -0.6)),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, dofAt } = K;
export { LIGHTS };
// vertical 9:16: centre each shot on its subject; glide between shots in one place, hard cuts between places
const CUTS = new Set(['coat', 'hill', 'grab', 'lorry', 'warn2', 'knock', 'night2', 'empty', 'corner']), GLIDE = 20, PULL = { hill: 0.35, corner: 0.55, lorry: 0.6, coat: 0.5, empty: 0.5 };
const mix = (a, b, t) => ({ ...b, pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t) });
const vert = (c, S) => { const p = FOCUS(S); return { ...c, look: lerp3(c.look, p, PULL[S.id] ?? 0.65), fov: Math.min(75, c.fov * 1.2) }; };
const cam = (f) => vert(K.camAt(f), shotAt(f));
export const camAt = (f) => { const S = shotAt(f); if (S.id === 'corner' && f > S.beat) f = S.beat; const c = cam(f); if (S.i === 0 || CUTS.has(S.id) || f - S.a >= GLIDE) return c; return mix(cam(S.a - 1), c, smooth((f - S.a) / GLIDE)); };

// ---------- textures painted here ----------
const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const wallpaper = () => cv(512, 512, (g, w, h) => { g.fillStyle = '#d8c494'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 64) { g.fillStyle = '#c8b07c'; g.fillRect(x, 0, 22, h); g.fillStyle = '#e4d2a6'; g.fillRect(x + 26, 0, 4, h); }
  g.fillStyle = '#9a6a4a'; for (let y = 32; y < h; y += 64) for (let x = 43; x < w; x += 64) { g.beginPath(); g.ellipse(x, y + (x % 128 ? 32 : 0), 6, 9, 0, 0, 7); g.fill();
    g.fillStyle = '#6a8a5a'; g.beginPath(); g.ellipse(x - 7, y + 6 + (x % 128 ? 32 : 0), 5, 2.5, 0.6, 0, 7); g.fill(); g.fillStyle = '#9a6a4a'; } });
const rugTex = () => cv(512, 384, (g, w, h) => { g.fillStyle = '#7a2a2a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8b46a'; g.lineWidth = 14; g.strokeRect(24, 24, w - 48, h - 48);
  g.lineWidth = 5; g.strokeStyle = '#2a3a5a'; g.strokeRect(50, 50, w - 100, h - 100); g.fillStyle = '#d8b46a';
  for (let i = 0; i < 5; i++) { g.save(); g.translate(w / 2, h / 2); g.rotate(i * Math.PI / 5); g.fillRect(-90, -8, 180, 16); g.restore(); }
  g.fillStyle = '#2a3a5a'; g.beginPath(); g.ellipse(w / 2, h / 2, 40, 40, 0, 0, 7); g.fill(); });
const fabric = (col, dark) => cv(256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.strokeStyle = dark; g.globalAlpha = 0.35; g.lineWidth = 2;
  for (let i = -h; i < w; i += 10) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); } g.globalAlpha = 1; });
const grilleDraw = (g, w, h) => { g.fillStyle = '#5a3a1e'; g.fillRect(0, 0, w, h);                              // speaker cloth behind a wooden sunburst fret
  g.fillStyle = '#c8a46a'; g.fillRect(14, 14, w - 28, h - 28); g.strokeStyle = '#a8844a'; g.lineWidth = 2; for (let x = 18; x < w - 14; x += 6) { g.beginPath(); g.moveTo(x, 14); g.lineTo(x, h - 14); g.stroke(); }
  g.fillStyle = '#5a3a1e'; for (let i = 0; i < 9; i++) { g.save(); g.translate(w / 2, h - 10); g.rotate(-Math.PI / 2 + (i - 4) * 0.33); g.fillRect(-7, 0, 14, h * 1.2); g.restore(); }
  g.strokeStyle = '#2a1a0c'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); };
const dialDraw = (on) => (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  if (on > 0) { gr.addColorStop(0, `rgba(255,${200 + 30 * on | 0},120,1)`); gr.addColorStop(1, `rgba(${230 * on | 0},${130 * on | 0},40,1)`); } else { gr.addColorStop(0, '#3a2a1a'); gr.addColorStop(1, '#22180e'); }
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = on > 0 ? '#5a2a08' : '#4a3a2a'; g.fillStyle = g.strokeStyle; g.lineWidth = 3;
  for (let i = 0; i <= 40; i++) { const x = 30 + i * (w - 60) / 40; g.beginPath(); g.moveTo(x, h * 0.62); g.lineTo(x, h * (i % 5 ? 0.74 : 0.84)); g.stroke(); }
  g.font = '700 17px Georgia, serif'; g.textAlign = 'center'; [['LONDON', 0.14], ['PARIS', 0.33], ['ROME', 0.5], ['TOMORROW', 0.8]].forEach(([t, k]) => g.fillText(t, 30 + k * (w - 60), h * 0.42));
  g.strokeStyle = on > 0 ? '#c01010' : '#5a2a1a'; g.lineWidth = 6; const nx = 30 + 0.8 * (w - 60); g.beginPath(); g.moveTo(nx, 8); g.lineTo(nx, h - 8); g.stroke();
  g.strokeStyle = '#1a0e06'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); };
const clockDraw = (hh, mm) => (g, w) => { g.fillStyle = '#f6f0e2'; g.beginPath(); g.arc(w / 2, w / 2, w * 0.47, 0, 7); g.fill(); g.lineWidth = 12; g.strokeStyle = '#1e1812'; g.stroke();
  g.fillStyle = '#1e1812'; g.font = `700 ${w * 0.1 | 0}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; g.fillText(String(i), w / 2 + Math.sin(a) * w * 0.36, w / 2 - Math.cos(a) * w * 0.36); }
  const hand = (a, l, lw, c = '#1e1812') => { g.strokeStyle = c; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(w / 2, w / 2); g.lineTo(w / 2 + Math.sin(a) * l, w / 2 - Math.cos(a) * l); g.stroke(); };
  hand((mm / 60) * Math.PI * 2, w * 0.38, w * 0.035); hand(((hh % 12 + mm / 60) / 12) * Math.PI * 2, w * 0.24, w * 0.055); g.fillStyle = '#b02020'; g.beginPath(); g.arc(w / 2, w / 2, w * 0.03, 0, 7); g.fill(); };
const boxSide = (g, w, h) => { g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#c42a2a'; g.fillRect(0, h * 0.72, w, h * 0.12);
  g.fillStyle = '#1e3a6a'; g.font = `900 ${h * 0.26 | 0}px Arial Black, Arial`; g.textAlign = 'center'; g.fillText('MILL HAULAGE', w / 2, h * 0.48);
  g.font = `700 ${h * 0.09 | 0}px Arial`; g.fillText('NATIONWIDE  ·  SINCE 1962', w / 2, h * 0.64); g.strokeStyle = '#8a8a8a'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); };
const sign = (txt) => (g, w, h) => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1a1a1a'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = '#1a1a1a'; g.font = `700 ${h * 0.5 | 0}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 2); };

// tube between two points
const tube = (ctx, a, b, r, mat, parent) => { const { THREE } = ctx; const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), l = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 10), mat); m.position.copy(A.clone().add(B).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  m.castShadow = true; parent.add(m); return m; };

// ---------- the bicycle: travels along +z, pedals and wheels turn ----------
function bicycle(ctx, parent) {
  const { THREE, add, box, toon } = ctx; const g = new THREE.Group(); parent.add(g);
  const red = toon({ color: '#d8262a' }), black = toon({ color: '#16161a' }), silver = toon({ color: '#d0d4dc' }), chrome = toon({ color: '#e8ecf2' }), brown = toon({ color: '#5a3a22' });
  const RA = [0, 0.34, -0.52], FA = [0, 0.34, 0.54], BB = [0, 0.3, 0], ST = [0, 0.84, -0.14], HT = [0, 0.86, 0.4], HB = [0, 0.98, 0.36];
  const wheel = (at) => { const w = new THREE.Group(); w.position.set(...at); g.add(w);
    const ty = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.032, 10, 40), black); ty.rotation.y = Math.PI / 2; ty.castShadow = true; w.add(ty);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.012, 6, 40), silver); rim.rotation.y = Math.PI / 2; w.add(rim);
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, s = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.58, 4), chrome); s.rotation.x = a; w.add(s); }
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 10), silver, 0, 0, 0, w).rotation.z = Math.PI / 2; return w; };
  const wr = wheel(RA), wf = wheel(FA);
  for (const [a, b, r] of [[RA, BB, 0.018], [RA, ST, 0.015], [BB, ST, 0.024], [ST, HT, 0.024], [BB, HT, 0.027], [HT, FA, 0.02], [HT, HB, 0.02]]) {
    if (a === RA || a === HT && b === FA) for (const s of [-1, 1]) tube(ctx, [a[0] + s * 0.05, a[1], a[2]], [b[0] + (b === FA ? s * 0.05 : s * 0.012), b[1], b[2]], r, a === HT ? silver : red, g);
    else tube(ctx, a, b, r, b === HB ? silver : red, g); }
  tube(ctx, [-0.27, 0.98, 0.33], [0.27, 0.98, 0.33], 0.014, silver, g); for (const s of [-1, 1]) tube(ctx, [s * 0.2, 0.98, 0.33], [s * 0.27, 0.98, 0.33], 0.022, black, g);   // bars and grips
  add(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), silver, 0, 0.9, -0.17, g);
  const sad = add(box(0.13, 0.05, 0.26), black, 0, 0.98, -0.18, g); sad.rotation.x = 0.06;                                             // saddle
  add(new THREE.SphereGeometry(0.025, 10, 8), chrome, 0.16, 1.0, 0.33, g);                                                              // bell
  for (const s of [-1, 1]) tube(ctx, [0, 0.62, -0.52], [s * 0.13, 0.62, -0.52], 0.01, silver, g);
  add(new THREE.CylinderGeometry(0.33, 0.33, 0.06, 20, 1, true, 0, Math.PI * 0.6), red, 0, 0.36, -0.52, g).rotation.z = Math.PI / 2;     // mudguard
  // chainring + chain + crank arms with pedals
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 24), silver); ring.rotation.y = Math.PI / 2; ring.position.set(0.05, ...BB.slice(1)); g.add(ring);
  for (const y of [0.4, 0.2]) tube(ctx, [0.05, y, 0], [0.05, 0.34 + (y - 0.3) * 0.5, -0.52], 0.006, toon({ color: '#3a3a3e' }), g);
  const crank = new THREE.Group(); crank.position.set(...BB); g.add(crank);
  const pedals = [];
  for (const s of [-1, 1]) { const arm = new THREE.Group(); arm.rotation.x = s > 0 ? 0 : Math.PI; crank.add(arm);
    add(box(0.022, 0.17, 0.03), silver, s * 0.08, -0.085, 0, arm); const pd = add(box(0.1, 0.024, 0.06), black, s * 0.13, -0.17, 0, arm); pedals.push(pd); }
  return { g, wr, wf, crank };
}

// ---------- the lorry: drives along -x (cab at the -x end) ----------
function lorry(ctx, parent) {
  const { THREE, add, box, toon } = ctx; const g = new THREE.Group(); parent.add(g);
  const cabM = toon({ color: '#1f5fae' }), dark = toon({ color: '#141418' }), chrome = toon({ color: '#d8dce4' }), glassM = toon({ color: '#2a3a52' }), tyre = toon({ color: '#121214' });
  add(box(9.2, 0.35, 1.6), dark, 0.2, 0.75, 0, g);                                                          // chassis
  add(box(2.3, 2.45, 2.5), cabM, -3.35, 2.05, 0, g); add(box(2.0, 0.35, 2.4), cabM, -3.2, 3.4, 0, g);     // cab and roof
  add(box(0.04, 1.0, 2.2), glassM, -4.52, 2.55, 0, g); for (const s of [-1, 1]) add(box(1.1, 0.75, 0.03), glassM, -3.7, 2.6, s * 1.26, g);   // windscreen, side windows
  add(box(0.06, 0.9, 1.7), dark, -4.53, 1.35, 0, g); for (let k = 0; k < 6; k++) add(box(0.07, 0.05, 1.6), chrome, -4.55, 1.0 + k * 0.14, 0, g);   // grille
  add(box(0.25, 0.32, 2.55), dark, -4.55, 0.7, 0, g);                                                        // bumper
  for (const s of [-1, 1]) { add(box(0.05, 0.22, 0.36), new THREE.MeshBasicMaterial({ color: '#fff6d0' }), -4.57, 1.0, s * 0.95, g, { cast: false });
    add(box(0.05, 0.1, 0.2), new THREE.MeshBasicMaterial({ color: '#ffa020' }), -4.56, 1.25, s * 1.1, g, { cast: false });
    tube(ctx, [-4.3, 2.8, s * 1.25], [-4.45, 2.8, s * 1.55], 0.02, chrome, g); add(box(0.08, 0.45, 0.22), dark, -4.42, 2.6, s * 1.6, g);   // mirrors
    add(box(0.5, 0.06, 0.4), dark, -3.0, 0.62, s * 1.25, g); add(box(0.5, 0.06, 0.4), dark, -3.0, 0.38, s * 1.25, g); }                  // steps
  add(box(6.6, 3.0, 2.55), toon({ color: '#f2f2ee' }), 1.25, 2.4, 0, g);                                     // box body
  for (const s of [-1, 1]) { const p = SETS.canvasPlane(ctx, 6.4, 2.6, 1024, g, { lit: true }); p.draw('s', boxSide); p.mesh.position.set(1.25, 2.4, s * 1.285); p.mesh.rotation.y = s > 0 ? 0 : Math.PI; }
  const fuel = add(new THREE.CylinderGeometry(0.28, 0.28, 1.0, 14), chrome, -1.6, 0.85, 0.95, g); fuel.rotation.z = Math.PI / 2;
  const wheels = [];
  for (const x of [-3.2, 2.0, 3.2]) for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(x, 0.52, s * 1.05); g.add(w);
    const t = add(new THREE.CylinderGeometry(0.52, 0.52, 0.42, 22), tyre, 0, 0, 0, w); t.rotation.x = Math.PI / 2;
    const hub = add(new THREE.CylinderGeometry(0.28, 0.28, 0.44, 10), chrome, 0, 0, 0, w); hub.rotation.x = Math.PI / 2;
    for (let k = 0; k < 5; k++) { const n = add(new THREE.CylinderGeometry(0.04, 0.04, 0.46, 6), dark, Math.cos(k * 1.256) * 0.17, Math.sin(k * 1.256) * 0.17, 0, w); n.rotation.x = Math.PI / 2; }
    add(box(1.2, 0.08, 0.5), dark, 0, 0.6, 0, w); wheels.push(w); }
  return { g, wheels };
}

// ---------- the sets ----------
export const build = (ctx) => {
  const { THREE, add, box, tbox, toon, texM, P } = ctx;
  SETS.houseLightsOff(ctx);
  // ===== Grandpa's sitting room =====
  const G = new THREE.Group(); G.position.set(...RB); ctx.world.add(G);
  const wp = texM(wallpaper(), 3, 1.5), floor = texM(P.planks(61), 3, 3, '#a8784e'), ceil = texM(P.plaster(62, 40), 2, 2, '#f0e8d8'), skirt = toon({ color: '#5a3a24' });
  add(tbox(4.4, 0.1, 4.4, 1), floor, 0, -0.05, 0, G, { cast: false }); add(tbox(4.4, 0.1, 4.4, 1), ceil, 0, 2.75, 0, G, { cast: false });
  // back wall (z = -2.2) with the window (x -1.75..-0.65, y 0.95..2.15)
  add(tbox(4.4, 0.95, 0.12, 1), wp, 0, 0.475, -2.2, G); add(tbox(4.4, 0.6, 0.12, 1), wp, 0, 2.45, -2.2, G);
  add(tbox(0.45, 1.2, 0.12, 1), wp, -1.975, 1.55, -2.2, G); add(tbox(2.85, 1.2, 0.12, 1), wp, 0.775, 1.55, -2.2, G);
  // left wall, front wall, right wall with a door hole (z 0.25..1.15)
  add(tbox(0.12, 2.8, 4.4, 1), wp, -2.2, 1.4, 0, G); add(tbox(4.4, 2.8, 0.12, 1), wp, 0, 1.4, 2.2, G);
  add(tbox(0.12, 2.8, 2.45, 1), wp, 2.2, 1.4, -0.975, G); add(tbox(0.12, 2.8, 1.05, 1), wp, 2.2, 1.4, 1.675, G); add(tbox(0.12, 0.7, 0.9, 1), wp, 2.2, 2.4, 0.7, G);
  for (const [x, z, w, d] of [[0, -2.13, 4.4, 0.03], [-2.13, 0, 0.03, 4.4], [0, 2.13, 4.4, 0.03]]) { add(box(w, 0.14, d), skirt, x, 0.07, z, G, { cast: false }); add(box(w, 0.06, d), skirt, x, 2.0, z, G, { cast: false }); }   // skirting, picture rail
  // window: frame, mullions, sill, curtains
  const white = toon({ color: '#f2eee4' });
  for (const [w, h, x, y] of [[1.2, 0.08, -1.2, 2.15], [1.2, 0.08, -1.2, 0.95], [0.08, 1.25, -1.78, 1.55], [0.08, 1.25, -0.62, 1.55], [0.05, 1.2, -1.2, 1.55], [1.1, 0.05, -1.2, 1.6]]) add(box(w, h, 0.1), white, x, y, -2.18, G);
  add(box(1.35, 0.06, 0.24), white, -1.2, 0.92, -2.08, G);
  const curt = toon({ color: '#8a2a34', side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const c = add(new THREE.PlaneGeometry(0.45, 1.6, 10, 1), curt, -1.2 + s * 0.78, 1.42, -2.1, G, { cast: false }); const pa = c.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 26) * 0.03); }
  tube(ctx, [-2.05, 2.25, -2.08], [-0.35, 2.25, -2.08], 0.015, toon({ color: '#b08a3a' }), G);
  // armchair (green velvet), cushion, antimacassar
  const velvet = texM(fabric('#3e6a4c', '#24402c'), 2, 2), chair = new THREE.Group(); chair.position.set(0.75, 0, -1.35); G.add(chair);
  add(box(0.86, 0.36, 0.8), velvet, 0, 0.3, 0, chair); add(box(0.7, 0.12, 0.66), velvet, 0, 0.53, 0.04, chair);
  add(box(0.86, 0.82, 0.2), velvet, 0, 0.83, -0.32, chair); add(box(0.4, 0.22, 0.02), toon({ color: '#f4eee0' }), 0, 1.12, -0.21, chair, { cast: false });
  for (const s of [-1, 1]) { add(box(0.16, 0.3, 0.8), velvet, s * 0.43, 0.62, 0, chair); add(new THREE.CylinderGeometry(0.09, 0.09, 0.8, 12), velvet, s * 0.43, 0.78, 0, chair).rotation.x = Math.PI / 2; }
  for (const [x, z] of [[-0.36, 0.34], [0.36, 0.34], [-0.36, -0.34], [0.36, -0.34]]) add(new THREE.CylinderGeometry(0.03, 0.02, 0.12, 8), skirt, x, 0.06, z, chair);
  // side table and the radio
  const wood = texM(P.planks(63), 1, 1, '#7a4a28');
  add(box(0.6, 0.04, 0.48), wood, -0.25, 0.6, -1.45, G); for (const [x, z] of [[-0.5, -1.65], [0, -1.65], [-0.5, -1.25], [0, -1.25]]) add(new THREE.CylinderGeometry(0.02, 0.016, 0.58, 8), skirt, x, 0.29, z, G);
  add(box(0.5, 0.02, 0.38), wood, -0.25, 0.18, -1.45, G);
  const rad_ = new THREE.Group(); rad_.position.set(-0.25, 0.62, -1.45); G.add(rad_);
  const cab = toon({ color: '#6a3a1c' });
  add(box(0.5, 0.26, 0.26), cab, 0, 0.13, 0, rad_); const dome = add(new THREE.CylinderGeometry(0.25, 0.25, 0.26, 28, 1, false, -Math.PI / 2, Math.PI), cab, 0, 0.26, 0, rad_); dome.rotation.x = Math.PI / 2; dome.scale.set(1, 1, 0.5);
  add(box(0.52, 0.02, 0.28), toon({ color: '#3a1e0c' }), 0, 0.01, 0, rad_);
  const grille = SETS.canvasPlane(ctx, 0.36, 0.2, 256, rad_, { lit: true }); grille.draw('g', grilleDraw); grille.mesh.position.set(0, 0.27, 0.132);
  const dial = SETS.canvasPlane(ctx, 0.32, 0.075, 512, rad_, { lit: false }); dial.mesh.position.set(0, 0.11, 0.132);
  const knobs = [-0.18, 0.18].map((x) => { const k = add(new THREE.CylinderGeometry(0.032, 0.036, 0.03, 16), toon({ color: '#2a1a10' }), x, 0.06, 0.14, rad_); k.rotation.x = Math.PI / 2; return k; });
  const radLight = new THREE.PointLight('#ffa040', 0, 4.5, 1.4); radLight.position.set(-0.25, 0.8, -1.0); G.add(radLight);
  // standard lamp, bookshelf, photos, wall clock, rug, coat stand, door
  const lamp = new THREE.Group(); lamp.position.set(1.6, 0, -1.6); G.add(lamp);
  add(new THREE.CylinderGeometry(0.16, 0.2, 0.05, 16), skirt, 0, 0.025, 0, lamp); add(new THREE.CylinderGeometry(0.018, 0.018, 1.5, 8), toon({ color: '#b08a3a' }), 0, 0.78, 0, lamp);
  add(new THREE.CylinderGeometry(0.16, 0.26, 0.28, 18, 1, true), toon({ color: '#f0d8a0', side: THREE.DoubleSide, emissive: '#5a3a10' }), 0, 1.58, 0, lamp);
  const lampL = new THREE.PointLight('#ffcf8a', 0, 5, 1.5); lampL.position.set(1.6, 1.45, -1.55); G.add(lampL);
  const shelf = new THREE.Group(); shelf.position.set(-2.0, 0, 0.2); G.add(shelf);
  add(box(0.3, 1.8, 1.2), wood, 0, 0.9, 0, shelf); const bookC = ['#7a2a2a', '#2a4a6a', '#3a5a2a', '#8a6a2a', '#5a2a5a', '#2a2a2a', '#a84a2a'];
  for (let r_ = 0; r_ < 4; r_++) { add(box(0.28, 0.03, 1.14), skirt, 0.02, 0.3 + r_ * 0.42, 0, shelf); let z = -0.52;
    while (z < 0.5) { const w = 0.04 + ((r_ * 7 + z * 31) % 3 + 3) % 3 * 0.015, hh = 0.26 + ((z * 97 + r_ * 13) % 5 + 5) % 5 * 0.02; add(box(0.2, hh, w), toon({ color: bookC[Math.abs((z * 50 + r_ * 3) | 0) % bookC.length] }), 0.04, 0.32 + r_ * 0.42 + hh / 2, z + w / 2, shelf); z += w + 0.006; } }
  for (const [x, y, w, h, c] of [[1.9, 1.55, 0.36, 0.44, '#c8a46a'], [-0.2, 1.7, 0.3, 0.38, '#2a2a2a'], [0.25, 1.62, 0.22, 0.28, '#c8a46a']]) {
    add(box(w, h, 0.03), toon({ color: c }), x, y, -2.13, G); add(box(w * 0.8, h * 0.8, 0.01), toon({ color: ['#8aa0b8', '#c8b090', '#a0b890'][(x * 10 | 0) % 3 + (x < 0 ? 3 : 0) % 3] || '#a8a090' }), x, y, -2.11, G, { cast: false }); }
  const clockG = new THREE.Group(); clockG.position.set(0.75, 2.12, -2.12); G.add(clockG);
  add(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 28), toon({ color: '#3a2414' }), 0, 0, 0, clockG).rotation.x = Math.PI / 2;
  const face = SETS.canvasPlane(ctx, 0.38, 0.38, 256, clockG, { lit: true }); face.mesh.position.z = 0.03;
  const rug = add(new THREE.PlaneGeometry(2.4, 1.7), texM(rugTex()), 0.2, 0.012, -0.4, G, { cast: false }); rug.rotation.x = -Math.PI / 2;
  const stand = new THREE.Group(); stand.position.set(1.85, 0, 1.75); G.add(stand);
  add(new THREE.CylinderGeometry(0.025, 0.03, 1.8, 8), skirt, 0, 0.9, 0, stand); add(new THREE.CylinderGeometry(0.2, 0.22, 0.04, 12), skirt, 0, 0.02, 0, stand);
  const hung = new THREE.Group(); stand.add(hung);
  add(box(0.42, 0.95, 0.22), toon({ color: GPC.tunic }), 0, 1.22, 0.1, hung); add(new THREE.CylinderGeometry(0.13, 0.14, 0.08, 14), toon({ color: GPC.cap }), 0, 1.8, 0.05, hung); add(box(0.2, 0.02, 0.1), toon({ color: GPC.cap }), 0, 1.77, 0.17, hung);
  const doorH = new THREE.Group(); doorH.position.set(2.2, 0, 1.15); G.add(doorH);
  add(box(0.05, 2.05, 0.9), toon({ color: '#6a4a2e' }), 0, 1.025, -0.45, doorH); add(new THREE.SphereGeometry(0.035, 10, 8), toon({ color: '#c8a040' }), -0.05, 1.0, -0.8, doorH);
  for (const y of [0.55, 1.45]) add(box(0.06, 0.6, 0.65), toon({ color: '#5a3a22' }), 0, y, -0.45, doorH, { cast: false });
  const hallL = new THREE.PointLight('#fff2d8', 0, 5, 1.2); hallL.position.set(2.9, 1.6, 0.7); G.add(hallL);
  add(tbox(2, 2.8, 2, 1), wp, 3.4, 1.4, 0.7, G);                                                        // the hall beyond the door

  // ===== Mill Road and the junction =====
  const S_ = new THREE.Group(); S_.position.set(...MB); ctx.world.add(S_);
  const asphalt = (rx, ry) => texM(P.stone(94, 30, 6, 30, 64, 64), rx, ry, '#8a8e96'), pave = (rx, ry) => texM(P.stone(95, 30, 8, 56), rx, ry, '#a8a49c');
  const slope = (w, z0, z1, x, dy, mat) => { const g = new THREE.PlaneGeometry(w, z0 - z1, 1, 30); g.rotateX(-Math.PI / 2); g.translate(x, 0, (z0 + z1) / 2);
    const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) pa.setY(i, elev(pa.getZ(i)) + dy); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; S_.add(m); return m; };
  slope(6.2, -3.6, -60, 0, 0, asphalt(2, 14)); for (const s of [-1, 1]) slope(2.6, -3.6, -60, s * 4.4, 0.13, pave(1, 14));
  add(tbox(90, 0.1, 7.2, 2), asphalt(18, 2), 0, -0.05, 0, S_, { cast: false });                                        // the cross road
  for (const s of [-1, 1]) { add(tbox(90, 0.14, 3, 1), pave(20, 1), 0, 0.07, s * 5.1, S_, { cast: false }); }
  for (let x = -44; x < 44; x += 3) if (Math.abs(x) > 4) add(box(1.5, 0.012, 0.14), new THREE.MeshBasicMaterial({ color: '#f4f4ee' }), x, 0.006, 0, S_, { cast: false });   // centre line
  for (let k = 0; k < 6; k++) add(box(0.5, 0.012, 2.2), new THREE.MeshBasicMaterial({ color: '#f4f4ee' }), -2.5 + k * 1.0, 0.006, -2.4, S_, { cast: false });                  // zebra crossing
  for (const s of [-1, 1]) for (const z of [-3.8, -3.2]) { const p = add(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), toon({ color: '#2a2a2a' }), s * 3.6, 1.1, z === -3.8 ? -3.6 : -1.2, S_);
    if (z === -3.8) add(new THREE.SphereGeometry(0.15, 14, 10), new THREE.MeshBasicMaterial({ color: '#ffb020' }), s * 3.6, 2.25, -3.6, S_, { cast: false }); }     // belisha beacons
  // houses up both sides of the hill, stepped down the slope
  const walls = ['brick', 'plaster', 'stone', 'plasterB', 'brick', 'stoneB', 'plaster', 'brick', 'stone', 'plasterB'], doors = ['#2a3a5a', '#5a2a2a', '#2a4a3a', '#6a4a1a', '#3a2a4a'];
  let n12 = null;
  for (const s of [-1, 1]) for (let k = 0; k < 10; k++) { const z = -9 - k * 3.9, y = elev(z + 1.95), x = s * 8.6;
    const c = SETS.cottage(ctx, S_, { x, z, w: 3.9, wall: walls[(k + (s > 0 ? 3 : 0)) % walls.length], roof: k % 2 ? 'slate' : 'tile', door: doors[(k * 2 + (s > 0 ? 1 : 0)) % doors.length], seed: k * 3 + (s > 0 ? 50 : 10), ry: s < 0 ? -Math.PI / 2 : Math.PI / 2, number: s < 0 ? 2 + k * 2 : 1 + k * 2, lit: [] });
    c.g.position.y = y; add(tbox(4, 1.6, 3.9, 1), toon({ color: '#6a665e' }), x, y - 0.8, z, S_); if (s < 0 && k === 5) n12 = c; }
  // number twelve: a kitchen fire behind the ground-floor window, a glow inside, the front door that bursts open
  const fireTex = P.tex(cv(128, 192, (g, w, h) => { const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#fff4a0'); gr.addColorStop(0.4, '#ff8a1a'); gr.addColorStop(1, '#5a1a0a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(40,20,20,0.75)'; g.fillRect(0, 0, w, h * 0.3);
    g.fillStyle = '#ffd040'; for (let i = 0; i < 7; i++) { g.beginPath(); const x = 10 + i * 18; g.moveTo(x - 10, h); g.quadraticCurveTo(x, h * (0.3 + (i % 3) * 0.1), x + 10, h); g.fill(); } }));
  const n12glass = n12.glass[0], n12map = n12glass.map;
  const fireL = new THREE.PointLight('#ff7a20', 0, 9, 1.4); fireL.position.set(N12WIN[0] - MB[0] - 0.9, N12WIN[1] - MB[1], N12WIN[2] - MB[2]); S_.add(fireL);
  const fireOut = new THREE.PointLight('#ff8a30', 0, 6, 1.6); fireOut.position.set(N12WIN[0] - MB[0] + 0.6, N12WIN[1] - MB[1], N12WIN[2] - MB[2]); S_.add(fireOut);
  // corner buildings around the junction
  const corner = [[-11, -6.2, 'brick', 0], [11, -6.2, 'plaster', 0], [-14, 10, 'stone', Math.PI], [-6, 10, 'brick', Math.PI], [2, 10, 'plasterB', Math.PI], [10, 10, 'stoneB', Math.PI], [18, 10, 'brick', Math.PI], [-22, 10, 'plaster', Math.PI]];
  corner.forEach(([x, z, wall, ry], i) => SETS.cottage(ctx, S_, { x, z, w: 7.6, wall, roof: i % 2 ? 'tile' : 'slate', seed: 70 + i, ry, door: doors[i % doors.length], lit: [] }));
  const shop = SETS.canvasPlane(ctx, 3.0, 0.5, 512, S_, { lit: true }); shop.draw('s', sign('CORNER STORE')); shop.mesh.position.set(-11, 2.9, -2.35);
  const roadSign = SETS.canvasPlane(ctx, 1.2, 0.3, 256, S_, { lit: true }); roadSign.draw('m', sign('MILL ROAD')); roadSign.mesh.position.set(-3.7, 2.2, -3.3);
  add(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), toon({ color: '#2a2a2a' }), -3.7, 1.1, -3.4, S_);
  // the street clock on the corner (faces on four sides)
  const sc = new THREE.Group(); sc.position.set(SCLOCK[0] - MB[0], 0, SCLOCK[2] - MB[2]); S_.add(sc);
  const iron = toon({ color: '#1e3a2e' }); add(new THREE.CylinderGeometry(0.16, 0.24, 0.5, 14), iron, 0, 0.25, 0, sc); add(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 12), iron, 0, 1.55, 0, sc);
  add(box(0.72, 0.72, 0.72), iron, 0, 3.15, 0, sc); add(new THREE.ConeGeometry(0.5, 0.35, 4), iron, 0, 3.68, 0, sc).rotation.y = Math.PI / 4; add(new THREE.SphereGeometry(0.08, 10, 8), toon({ color: '#c8a040' }), 0, 3.9, 0, sc);
  const sfaces = [0, 1, 2, 3].map((k) => { const p = SETS.canvasPlane(ctx, 0.6, 0.6, 256, sc, { lit: true }); const a = k * Math.PI / 2; p.mesh.position.set(Math.sin(a) * 0.37, 3.15, Math.cos(a) * 0.37); p.mesh.rotation.y = a; return p; });
  // lamps, trees, a postbox, a bench
  for (const z of [-8, -19, -33, -42]) for (const s of [-1, 1]) { const lg = new THREE.Group(); lg.position.y = elev(z); S_.add(lg); SETS.streetLamp(ctx, lg, s * 5.4, z); }
  for (const [x, z] of [[-5.6, -13], [5.6, -23], [-5.6, -33], [14, 6.8], [-18, 6.8], [24, 6.8]]) { const tg = new THREE.Group(); tg.position.y = elev(z); S_.add(tg); SETS.tree(ctx, tg, x, z, 0.9); }
  add(new THREE.CylinderGeometry(0.24, 0.24, 1.1, 18), toon({ color: '#c41e1e' }), -5.4, 0.68, -4.0, S_); add(new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon({ color: '#c41e1e' }), -5.4, 1.23, -4.0, S_);
  add(box(0.3, 0.05, 0.02), toon({ color: '#1a1a1a' }), -5.4, 1.0, -3.76, S_, { cast: false });
  for (const s of [-1, 1]) add(box(1.6, 0.06, 0.4), wood, 6.0 + s * 0.0, 0.5, -4.6, S_);
  // parked cars along the cross road
  for (const [x, col] of [[-16, '#3a6a9a'], [9, '#c8c8c0'], [20, '#7a2a2a']]) { const c = SETS.car(ctx, S_, { color: col }); c.g.position.set(x, 0, 3.0); }
  // the sewer cover in the road at the corner: Grandpa is standing right on it at ten fifteen (Part 2 starts here)
  const mh = add(new THREE.CylinderGeometry(0.42, 0.44, 0.04, 40), toon({ color: '#3a3a40' }), HIT_X, 0.015, 1.45, S_, { cast: false });
  const mhTop = add(new THREE.CircleGeometry(0.38, 40), texM(cv(256, 256, (g, w) => { g.fillStyle = '#4a4a50'; g.fillRect(0, 0, w, w);
    g.strokeStyle = '#2a2a2e'; g.lineWidth = 8; for (const r of [120, 96, 40]) { g.beginPath(); g.arc(w / 2, w / 2, r, 0, 7); g.stroke(); }
    g.lineWidth = 6; for (let k = -4; k <= 4; k++) { const o = k * 20; g.beginPath(); g.moveTo(w / 2 + o, 40); g.lineTo(w / 2 + o, w - 40); g.stroke(); g.beginPath(); g.moveTo(40, w / 2 + o); g.lineTo(w - 40, w / 2 + o); g.stroke(); }
    g.fillStyle = '#6a6a72'; g.font = '900 30px Arial Black, Arial'; g.textAlign = 'center'; g.fillText('SEWER', w / 2, 70); g.fillText('1908', w / 2, w - 52); })), HIT_X, 0.04, 1.45, S_, { cast: false });
  mhTop.rotation.x = -Math.PI / 2;
  const bike = bicycle(ctx, S_), truck = lorry(ctx, S_);
  // what he leaves on the road: his flat cap and his glasses
  const capG = new THREE.Group(); S_.add(capG); add(new THREE.CylinderGeometry(0.15, 0.16, 0.08, 16), toon({ color: GPC.cap }), 0, 0.04, 0, capG); add(box(0.22, 0.02, 0.12), toon({ color: GPC.cap }), 0, 0.02, 0.17, capG);
  const glG = new THREE.Group(); S_.add(glG); const rimM = toon({ color: '#2a2420' });
  for (const s of [-1, 1]) { const r_ = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.005, 6, 20), rimM); r_.rotation.x = Math.PI / 2; r_.position.set(s * 0.042, 0.01, 0); glG.add(r_); }
  tube(ctx, [-0.08, 0.01, 0], [-0.12, 0.012, -0.11], 0.003, rimM, glG); tube(ctx, [0.08, 0.01, 0], [0.13, 0.012, -0.09], 0.003, rimM, glG);
  return { G, dial, grille, knobs, radLight, lampL, face, hung, doorH, hallL, sfaces, bike, truck, capG, glG, n12, n12glass, n12map, fireTex, fireL, fireOut };
};

export const update = (W, f, P) => {
  if (!P.dial) return;
  const on = W.radio; P.dial.draw('d' + q(on, 1), dialDraw(on)); P.radLight.intensity = 2.6 * on;
  P.grille.mesh.scale.setScalar(1 + (W.talk ? 0.012 * Math.sin(f * 2.1) : 0)); P.knobs[1].rotation.y = W.knob;
  P.lampL.intensity = W.lamp; P.face.draw('c' + W.hh + ':' + W.mm, clockDraw(W.hh, W.mm));
  P.hung.visible = W.coatHung; P.doorH.rotation.y = -W.door * 1.4; P.hallL.intensity = W.door * 2.5;
  P.sfaces.forEach((s) => s.draw('s' + W.smm, clockDraw(10, W.smm)));
  const B = W.bike; P.bike.g.visible = !!B; if (B) { P.bike.g.position.set(BIKE_X, elev(B.z), B.z); P.bike.g.rotation.x = B.z < -6 ? Math.atan(0.14) : 0; P.bike.wr.rotation.x = P.bike.wf.rotation.x = B.d / 0.33; P.bike.crank.rotation.x = B.d / 0.33 / 2.4; }
  const T_ = W.lorry; P.truck.g.visible = !!T_; if (T_) { P.truck.g.position.set(T_.x, 0, LANE_Z); P.truck.wheels.forEach((w) => (w.rotation.z = -T_.x / 0.52)); P.truck.g.rotation.z = T_.shake ? 0.004 * Math.sin(f * 3) : 0; }
  P.capG.visible = !!W.cap; if (W.cap) { P.capG.position.set(...W.cap.p); P.capG.rotation.set(0, W.cap.r, 0); }
  P.glG.visible = !!W.glasses; if (W.glasses) P.glG.position.set(...W.glasses);
  const fl = W.fire ? W.fire * (0.75 + 0.25 * Math.sin(f * 1.7) * Math.sin(f * 0.63)) : 0;
  if ((P.n12glass.map === P.fireTex) !== !!W.fire) { P.n12glass.map = W.fire ? P.fireTex : P.n12map; P.n12glass.needsUpdate = true; }
  if (W.fire) P.n12glass.color.setRGB(1.2 + fl * 0.6, 0.9 + fl * 0.3, 0.8);
  P.fireL.intensity = 6 * fl; P.fireOut.intensity = 2.2 * fl; P.n12.door.rotation.y = -W.door12 * 1.5;
};

// bike: distance travelled at frame f in the shots where she rides
const bikeAt = (f, S) => {
  if (S.id === 'hill') { const t = ramp(f, S.a, S.b); const z = lerp(-40, -12, t); return { z, d: (z + 40) * 1.0 }; }
  if (S.id === 'grab') { const t = ramp(f, S.a, S.beat); const e = 1 - (1 - t) * (1 - t); const z = lerp(-13, STOP_Z, e); return { z, d: 28 + (z + 13) }; }
  if (S.id === 'lorry' || S.id === 'shaking') return { z: STOP_Z, d: 28 + (STOP_Z + 13) };
  return null;
};
export const worldAt = (f) => {
  const S = shotAt(f), id = S.id, i = S.i;
  const W = { radio: 0, talk: false, knob: 0, lamp: 0, hh: 9, mm: 0, coatHung: true, door: 0, smm: 14, bike: bikeAt(f, S), lorry: null, cap: null, glasses: null, fire: 0, door12: 0 };
  if (NIGHT.has(id)) { W.lamp = 0.9; W.radio = 1; W.hh = i < 2 ? 9 : 10; W.mm = i < 2 ? 2 : id === 'warn2' ? 12 : 41; W.talk = ['broadcast', 'warn2', 'oldman'].includes(id); }
  if (id === 'knock') W.fire = 0.8;
  if (id === 'smoke') { W.fire = 1; W.door12 = smooth(ramp(f, S.a, S.a + 8)); }
  if (id === 'radio') W.radio = smooth(ramp(f, S.a, S.a + 14));
  if (id === 'switch') { const t = ramp(f, S.a + 6, S.beat); W.knob = -2 * t; W.radio = 1 - smooth(t); }
  if (id === 'plea') W.radio = 0;
  if (id === 'coat') { W.hh = 9; W.mm = 58; W.coatHung = false; W.door = smooth(ramp(f, S.beat, S.b - 4)); }
  if (id === 'empty') { W.radio = 1; W.talk = true; W.hh = 10; W.mm = 14; W.coatHung = false; W.door = 0.35; }
  if (id === 'hill') W.smm = 14;
  if (['grab', 'lorry', 'shaking'].includes(id)) W.smm = 15;
  if (id === 'lorry') W.lorry = { x: lerp(24, -30, ramp(f, S.a + 2, S.b - 2)), shake: true };
  if (id === 'corner') { const ff = Math.min(f, S.beat); W.smm = 15; W.lorry = { x: HIT_X + 4.55 + 1.1 + (S.beat - ff) * 0.6, shake: f <= S.beat }; }   // freezes a metre from him
  return W;
};

// ---------- the cast ----------
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const gp = (expr, o = {}, pos = GPROOM, coat = false) => out.push(actor(T, coat ? GPC : GP, { seed: 4, expr, blink: blinkAt(f, 4), bold: BOLD, ...o, who: coat ? 'gpc' : 'gp' }, pos, { s: GPS, ...(o.x || {}) }));
  const me = (expr, o = {}, pos = MEROOM) => out.push(actor(T, ME, { seed: 22, expr, blink: blinkAt(f, 22), bold: BOLD, ...o, who: 'me' }, pos, { s: MES }));
  const girl = (expr, o = {}, pos, x = {}) => out.push(actor(T, GIRL, { seed: 41, expr, blink: blinkAt(f, 41), bold: BOLD, ...o, who: 'girl' }, pos, { s: GIS, ...x }));
  if (id === 'radio') gp('wary', { R: 'cheek', look: 0.5, tilt: 4 });
  if (id === 'coat') { gp('stubborn', { L: 'belly', R: 'reach', look: 0.3 }, R(1.5, 0, 0.62), true); me('wary', { look: 0.7 }, R(0.15, 0, 1.0)); }
  if (id === 'warn2') gp(f < S.beat ? 'wary' : 'stern', { R: 'cheek', look: 0.5, tilt: 4 });
  if (id === 'night2') { const late = f > S.beat; gp(late ? 'shock' : 'smile', { R: late ? 'cheek' : 'hang', look: 0.3 }); me(late ? 'scared' : 'grin', { look: -0.6 }, R(0.55, 0, 0.75)); }
  if (id === 'oldman') gp('shock', { L: 'cheek', R: 'cheek', look: 0.4 });
  if (id === 'switch') { const t = ramp(f, S.a + 6, S.beat); gp(f < S.beat + 4 ? 'stern' : 'pained', { R: f < S.beat + 4 ? 'reach' : 'hang', lift: 0.2, look: f < S.beat + 4 ? 0.5 * (1 - t) : -0.8 }); }
  if (id === 'plea') gp('pained', { L: 'reach', look: 0.9, headTilt: -5 });
  // on Mill Road
  const B = bikeAt(f, S);
  if (B) {
    const stopped = id !== 'hill' && (id !== 'grab' || f >= S.beat);
    const pos = ME_(BIKE_X, B.z + 0.05, 0.22), step = stopped ? 0 : ((B.d / 0.33 / 2.4) / (Math.PI * 2)) % 1;
    const ex = id === 'hill' ? 'grin' : id === 'grab' ? (f < S.beat - 4 ? 'grin' : 'shock') : id === 'lorry' ? 'shock' : 'scared';
    const shake = id === 'shaking' || (id === 'lorry' && f > S.beat) ? Math.sin(f * 2.7) * 0.012 : 0;
    girl(ex, { step, look: id === 'lorry' && f > S.beat - 6 ? 0.9 : id === 'shaking' ? -0.4 : 0, R: 'hang', L: 'hang' }, [pos[0] + shake, pos[1], pos[2]], { blob: false });
  }
  if (id === 'grab') { const t = smooth(ramp(f, S.a + 2, S.beat - 2)); gp(f < S.beat ? 'stern' : 'relief', { R: 'reach', lift: 0.15, look: 0.6 }, lerp3(ME_(-3.6, -5.0), GPGRAB, t), true); }
  if (id === 'lorry') gp(f > S.beat ? 'shock' : 'relief', { R: 'reach', lift: 0.1, look: 0.8 }, GPGRAB, true);
  if (id === 'shaking') gp('smile', { L: 'reach', look: 0.5 }, GPGRAB, true);
  if (id === 'corner') { const ff = Math.min(f, S.beat);                       // he turns, sees it, and the picture freezes
    gp(ff < S.beat - 14 ? 'neutral' : 'shock', { look: ff < S.beat - 14 ? -0.6 : 0.9, R: ff < S.beat - 6 ? 'hang' : 'up', L: ff < S.beat - 6 ? 'hang' : 'up', blink: ff < S.beat - 14 ? blinkAt(ff, 4) : 0 }, GPHIT, true); }
  // number twelve: he hammers on the door; smoke rolls out and the mum runs past him with her baby
  if (id === 'knock') gp('stern', { R: 'knock', kn: Math.abs(Math.sin(f * 0.9)), look: 0.6 }, GPKNOCK, true);
  if (id === 'smoke') { gp(f < S.beat ? 'shock' : 'relief', { R: 'reach', look: -0.4 }, lerp3(GPKNOCK, ME_(-5.4, -27.4, 0.13), smooth(ramp(f, S.a, S.a + 12))), true);
    const t = smooth(ramp(f, S.a + 6, S.b - 4)), mp = lerp3(ME_(-6.7, -28.5, 0.1), ME_(-4.4, -29.5, 0.13), t);
    out.push(actor(T, MUM, { seed: 15, expr: t < 0.7 ? 'scared' : 'relief', blink: blinkAt(f, 15), bold: BOLD, R: 'belly', L: 'belly', step: (f * 0.09) % 1, who: 'mum' }, mp, { s: MUS }));
    out.push(fx('baby' + (f % 20 < 10 ? 0 : 1), baby(f % 20 < 10), [mp[0] + 0.12, mp[1] + 0.62, mp[2] - 0.1], 0.3, { order: 4 })); }
  // dust behind the lorry, and the impact burst
  if (id === 'lorry' && f > S.beat - 2) { const k = ramp(f, S.beat - 2, S.b); out.push(fx('du' + q(k, 2), (p) => T.fxDust(p, k), M(lerp(4, -8, k), 0.0, LANE_Z - 0.4), 1.4)); }
  return out;
};
// fx: crackle rings from the speaker, the lorry's horn, the time words
const baby = (cry) => (p) => { const g = p.g; g.save(); g.lineWidth = 14; g.strokeStyle = '#241726';            // a swaddled baby: blanket, little face
  g.fillStyle = '#f4ecd8'; g.beginPath(); g.ellipse(300, 520, 210, 150, -0.3, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#f2c8a4'; g.beginPath(); g.ellipse(200, 470, 82, 78, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#241726'; for (const x of [175, 225]) { g.beginPath(); g.ellipse(x, 462, 8, cry ? 3 : 8, 0, 0, 7); g.fill(); }
  g.beginPath(); g.ellipse(200, 505, 16, cry ? 14 : 5, 0, 0, 7); g.fill(); g.strokeStyle = '#8ab4e0'; g.lineWidth = 10; g.beginPath(); g.moveTo(110, 560); g.quadraticCurveTo(300, 470, 470, 600); g.stroke(); g.restore(); };
const smokeDraw = (k, dark) => (p) => { const g = p.g; g.save();
  for (let i = 0; i < 6; i++) { const a = i * 1.7, r = 110 + 90 * k + (i % 3) * 30; g.globalAlpha = Math.max(0, 0.85 - k * 0.8);
    g.fillStyle = i % 2 ? dark : '#8a8a90'; g.beginPath(); g.ellipse(300 + Math.cos(a) * 90 * (0.4 + k), 600 - k * 260 + Math.sin(a) * 60, r, r * 0.8, 0, 0, 7); g.fill(); }
  g.restore(); };
const rings = (t, col = '#ffd890') => (p) => { const g = p.g; g.save(); g.strokeStyle = col; g.lineCap = 'round';
  for (let k = 0; k < 3; k++) { const r = ((t + k / 3) % 1); g.globalAlpha = (1 - r) * 0.9; g.lineWidth = 14 * (1 - r) + 3; g.beginPath(); g.arc(300, 500, 80 + r * 260, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(300, 500, 80 + r * 260, Math.PI - 0.9, Math.PI + 0.9); g.stroke(); }
  g.restore(); };
export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [];
  if (id === 'knock' || id === 'smoke') for (let j = 0; j < 4; j++) { const k = ((f * 0.025) + j / 4) % 1, src = id === 'smoke' && j % 2 ? N12DOOR : N12WIN;     // smoke from the window (and the open door)
    out.push(fx('sm' + j + q(k, 2), smokeDraw(k, '#3a3a40'), [src[0] + 0.5 + k * 0.8, src[1] + (src === N12DOOR ? 0.6 : 0.2) + k * 2.2, src[2] + (j - 1.5) * 0.25], 0.9 + k * 0.6, { order: 3 })); }
  if (['broadcast', 'warn2', 'oldman', 'empty'].includes(id)) out.push(fx('rg' + (f % 30), rings((f % 30) / 30), RADIO.map((v, i) => v + [0, 0.27, 0.18][i]), 0.32, { order: 6 }));
  if (id === 'corner' && f > S.beat - 22 && f < S.beat) { const k = ramp(f, S.beat - 22, S.beat - 4); out.push(fx('hn' + q(k, 1), word('HOOONK', k, '#ffd23f'), M(HIT_X + 4, 2.6, LANE_Z - 0.8), 0.5)); }
  if (id === 'hill' && f < S.a + 30) out.push(fx('t1014', word('10:14', ramp(f, S.a, S.a + 30) * 0.6, '#ffffff'), SCLOCK.map((v, i) => v + [0.4, 1.9, 0.8][i]), 0.45));
  if (id === 'corner' && f < S.a + 26) out.push(fx('t1015', word('10:15', ramp(f, S.a, S.a + 26) * 0.6, '#ff5040'), M(HIT_X - 1.2, 2.9, LANE_Z - 0.5), 0.45));
  return out;
};
