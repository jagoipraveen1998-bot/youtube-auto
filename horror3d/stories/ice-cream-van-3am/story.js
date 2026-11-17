// "The Ice Cream Van Came At 3AM": the kid's bedroom set (sets.js) with an ice cream van parked outside
// under the street lamp. The man sells you "Your Favourite Memory"; next morning Grandma is gone from the
// birthday photo, and at night he's back, right outside your window.
import * as SETS from './sets.js';
import { OUTFITS } from './toon.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const B = [-40, 0, 0], W0 = (x, y, z) => [B[0] + x, B[1] + y, B[2] + z];
const VO = [-7.4, -0.55, -2.2], VL = (x, y, z) => W0(VO[0] + x, VO[1] + y, VO[2] + z);       // van-local spots
const MAN = { tunic: '#f2f0ea', skin: '#f0d8c8', cap: '#e04a7a', hair: '#2a2018' };            // the ice cream man
const YOU = { ...OUTFITS.kid, tunic: '#4a7ac0' };
const KIDWIN = W0(-1.7, 0, -0.1), KIDVAN = VL(1.75, 0, 0.2), KIDROOM = W0(0.65, 0, 0.35), MUM = W0(-0.45, 0, -0.35), PHOTO = W0(-0.12, 1.12, 0.05);

const IDS = ['song', 'van', 'smile', 'menu', 'free', 'taste', 'photo', 'blank', 'chair', 'again', 'seconds'];
const CAMS = {
  song: [{ pos: W0(0.9, 1.35, 1.5), look: W0(-1.6, 1.15, -0.2), fov: 50 }, { pos: W0(0.5, 1.35, 1.2), look: W0(-1.7, 1.2, -0.2), fov: 42 }],
  van: [{ pos: W0(-1.2, 1.5, 0.9), look: VL(0.9, 1.7, -0.3), fov: 46 }, { pos: W0(-1.7, 1.5, 0.45), look: VL(0.9, 1.8, -0.3), fov: 34 }],
  smile: [{ pos: VL(3.0, 1.75, 0.2), look: VL(0.45, 1.9, -0.3), fov: 34 }, { pos: VL(2.5, 1.85, -0.1), look: VL(0.45, 1.95, -0.3), fov: 26 }],
  menu: [{ pos: VL(2.2, 1.9, 1.1), look: VL(0.96, 1.85, 0.8), fov: 44 }, { pos: VL(2.0, 1.88, 1.0), look: VL(0.96, 1.8, 0.8), fov: 40 }],
  free: [{ pos: VL(4.0, 1.45, -1.9), look: VL(1.0, 1.45, -0.1), fov: 42 }, { pos: VL(3.6, 1.45, -1.6), look: VL(1.1, 1.4, -0.05), fov: 38 }],
  taste: [{ pos: VL(3.0, 1.1, 0.9), look: VL(1.75, 1.0, 0.2), fov: 34 }, { pos: VL(2.7, 1.05, 0.75), look: VL(1.75, 1.0, 0.2), fov: 28 }],
  photo: [{ pos: W0(0.35, 1.4, 1.65), look: W0(-0.15, 1.05, -0.1), fov: 50 }, { pos: W0(0.2, 1.3, 1.25), look: PHOTO, fov: 40 }],
  blank: [{ pos: W0(0.25, 1.0, 1.55), look: W0(0.65, 0.92, 0.35), fov: 34 }, { pos: W0(0.35, 0.98, 1.35), look: W0(0.65, 0.92, 0.35), fov: 30 }],
  chair: [{ pos: W0(-0.08, 1.14, 0.85), look: PHOTO, fov: 40 }, { pos: W0(-0.1, 1.13, 0.7), look: PHOTO, fov: 38 }],
  again: [{ pos: W0(-0.4, 1.45, 0.9), look: VL(0.6, 1.5, -0.3), fov: 46 }, { pos: W0(-1.0, 1.45, 0.6), look: VL(0.7, 1.6, -0.3), fov: 38 }],
  seconds: [{ pos: W0(-0.5, 1.45, 0.9), look: W0(-2.7, 1.35, 0.12), fov: 46 }, { pos: W0(-1.2, 1.42, 0.5), look: W0(-2.7, 1.4, 0.12), fov: 38 }],
};
const LIGHTS = {
  night: { ...MOODS.night, hemi: 0.75, fogNear: 10, fogFar: 40, vig: 0.42 },
  memory: { ...MOODS.evening, hemi: 1.1, fog: '#7a5a4a', fogNear: 8, fogFar: 40, vig: 0.35, gain: '#fff0d8' },
  morning: { ...MOODS.morning, hemi: 1.0, vig: 0.3 },
  cold: { ...MOODS.dread, hemi: 0.62, fogNear: 8, fogFar: 34, vig: 0.6 },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S, f) => (S.id === 'taste' && f >= S.beat - 10 ? 'memory' : S.i >= 6 && S.i <= 8 ? 'morning' : S.i >= 9 ? 'cold' : 'night'),
  tweak: (L, S, f) => { if (S.id === 'chair' && f >= S.beat) { L.sat = 0.75; L.vig = 0.6; } if (S.id === 'seconds') L.vig = 0.72; },
  kicks: ['chair', 'seconds'],
  focus: (S) => ({ song: KIDWIN, van: VL(0.9, 1.8, -0.3), smile: VL(0.45, 1.95, -0.3), menu: VL(0.96, 1.8, 0.8), free: VL(1.3, 1.4, 0), taste: VL(1.75, 1.0, 0.2),
    photo: PHOTO, blank: W0(0.65, 0.92, 0.35), chair: PHOTO, again: VL(0.7, 1.6, -0.3), seconds: W0(-2.7, 1.4, 0.12) }[S.id]),
  shadowAt: (S) => (S.i >= 6 && S.i <= 8 ? W0(0, 0.8, 0) : VL(1.5, 1, 0)),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, camAt, dofAt } = K;
export { LIGHTS };

// the birthday photo: you blowing out candles, Grandma in her chair beside you (gran = 0..1 fades her out)
const drawPhoto = (gran) => (g, w, h) => {
  g.fillStyle = '#f6f2e8'; g.fillRect(0, 0, w, h);
  const x0 = 18, y0 = 18, W = w - 36, H = h - 70;
  const bg = g.createLinearGradient(0, y0, 0, y0 + H); bg.addColorStop(0, '#e8b878'); bg.addColorStop(1, '#a8683a'); g.fillStyle = bg; g.fillRect(x0, y0, W, H);
  g.fillStyle = '#c99a6a'; g.fillRect(x0, y0 + H * 0.68, W, H * 0.32);                                         // table
  // the chair (always there)
  g.fillStyle = '#6a3a22'; g.fillRect(x0 + W * 0.66, y0 + H * 0.2, W * 0.26, H * 0.06); g.fillRect(x0 + W * 0.66, y0 + H * 0.2, W * 0.05, H * 0.5); g.fillRect(x0 + W * 0.87, y0 + H * 0.2, W * 0.05, H * 0.5);
  g.fillRect(x0 + W * 0.66, y0 + H * 0.5, W * 0.26, H * 0.05);
  if (gran > 0) {                                                                                                  // Grandma
    g.globalAlpha = gran;
    g.fillStyle = '#7b4a8f'; g.beginPath(); g.ellipse(x0 + W * 0.79, y0 + H * 0.55, W * 0.11, H * 0.17, 0, 0, 7); g.fill();
    g.fillStyle = '#f3d0b4'; g.beginPath(); g.arc(x0 + W * 0.79, y0 + H * 0.3, W * 0.075, 0, 7); g.fill();
    g.fillStyle = '#d9d6d2'; g.beginPath(); g.arc(x0 + W * 0.79, y0 + H * 0.26, W * 0.08, Math.PI, 0); g.fill();
    g.fillStyle = '#241726'; for (const dx of [-0.025, 0.025]) { g.beginPath(); g.arc(x0 + W * (0.79 + dx), y0 + H * 0.3, 3, 0, 7); g.fill(); }
    g.lineWidth = 3; g.strokeStyle = '#241726'; g.beginPath(); g.arc(x0 + W * 0.79, y0 + H * 0.315, 9, 0.2, Math.PI - 0.2); g.stroke();
    g.globalAlpha = 1;
  }
  // you, cheeks puffed, blowing
  g.fillStyle = '#3f6fb0'; g.beginPath(); g.ellipse(x0 + W * 0.3, y0 + H * 0.62, W * 0.12, H * 0.14, 0, 0, 7); g.fill();
  g.fillStyle = '#f5c9a0'; g.beginPath(); g.arc(x0 + W * 0.3, y0 + H * 0.38, W * 0.1, 0, 7); g.fill();
  g.fillStyle = '#2b1d16'; g.beginPath(); g.arc(x0 + W * 0.3, y0 + H * 0.34, W * 0.105, Math.PI, 0); g.fill();
  g.fillStyle = '#241726'; g.beginPath(); g.arc(x0 + W * 0.36, y0 + H * 0.41, 6, 0, 7); g.fill();
  // the cake with seven candles
  g.fillStyle = '#f2e6f0'; g.fillRect(x0 + W * 0.4, y0 + H * 0.56, W * 0.24, H * 0.13); g.fillStyle = '#e8508a'; g.fillRect(x0 + W * 0.4, y0 + H * 0.6, W * 0.24, H * 0.025);
  for (let k = 0; k < 7; k++) { const cx = x0 + W * (0.42 + k * 0.033); g.fillStyle = '#7ac0e8'; g.fillRect(cx, y0 + H * 0.5, 4, H * 0.06); g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(cx + 2, y0 + H * 0.485, 3, 7, 0, 0, 7); g.fill(); }
  g.fillStyle = '#5a4a3a'; g.font = 'italic 26px Georgia'; g.textAlign = 'center'; g.fillText('7th birthday', w / 2, h - 22);
};
const drawMenu = (reveal) => (g, w, h) => {
  g.fillStyle = '#2a1e3a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffd23f'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20);
  g.textAlign = 'center'; g.fillStyle = '#ffd23f'; g.font = '900 54px Arial Black, Arial'; g.fillText('MENU', w / 2, 86);
  g.font = '700 40px Arial'; g.fillStyle = '#f4f0f6';
  ['Vanilla', 'Chocolate', 'Strawberry'].forEach((t, i) => g.fillText(t, w / 2, 170 + i * 66));
  if (reveal > 0) {
    g.globalAlpha = reveal; g.shadowColor = '#ff7ab0'; g.shadowBlur = 30; g.fillStyle = '#ff9ac8'; g.font = '900 38px Arial Black, Arial';
    g.fillText('YOUR FAVOURITE', w / 2, 420); g.fillText('MEMORY', w / 2, 468); g.shadowBlur = 0; g.font = '700 30px Arial'; g.fillStyle = '#ffd23f'; g.fillText('FREE', w / 2, 520); g.globalAlpha = 1;
  }
};

// ---------- the set ----------
export const build = (ctx) => {
  const { THREE, add, box, toon } = ctx;
  SETS.houseLightsOff(ctx);
  const br = SETS.bedroom(ctx, { at: B });
  const G = new THREE.Group(); G.position.set(...W0(...VO)); ctx.world.add(G);
  const white = toon({ color: '#f4f0f6' }), pink = toon({ color: '#e8508a' }), blue = toon({ color: '#7ac0e8' }), dark = toon({ color: '#1a1c24' });
  add(box(1.9, 1.1, 3.2), white, 0, 0.85, -0.4, G); add(box(1.92, 0.22, 3.22), pink, 0, 0.78, -0.4, G);
  add(box(1.96, 0.12, 3.26), white, 0, 2.56, -0.4, G);
  add(box(0.04, 1.2, 3.2), white, -0.93, 1.95, -0.4, G); add(box(1.9, 1.2, 0.04), white, 0, 1.95, -1.98, G); add(box(1.9, 1.2, 0.04), white, 0, 1.95, 1.18, G);
  add(box(0.04, 1.2, 1.0), white, 0.93, 1.95, -1.5, G); add(box(0.04, 1.2, 0.8), white, 0.93, 1.95, 0.8, G); add(box(0.04, 0.3, 1.4), white, 0.93, 2.35, -0.3, G);
  add(box(0.32, 0.05, 1.45), pink, 1.08, 1.42, -0.3, G);
  const awn = add(box(0.55, 0.04, 1.6), pink, 1.18, 2.42, -0.3, G); awn.rotation.z = -0.25;
  add(box(1.86, 1.1, 0.02), toon({ color: '#f6e0ea' }), 0, 1.95, -1.94, G);                                    // inside: freezer wall
  for (let k = 0; k < 6; k++) add(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10), toon({ color: ['#e8508a', '#7ac0e8', '#ffd23f'][k % 3] }), -0.55 + (k % 3) * 0.2, 1.62 + Math.floor(k / 3) * 0.3, -1.85, G);
  add(box(1.9, 1.3, 1.1), blue, 0, 1.0, 1.75, G); add(box(1.92, 0.55, 0.9), dark, 0, 1.5, 1.8, G);                  // the cab
  for (const s of [-1, 1]) for (const z of [-1.4, 1.75]) { const w = add(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 16), dark, s * 0.86, 0.36, z, G); w.rotation.z = Math.PI / 2; }
  for (const s of [-0.6, 0.6]) add(box(0.3, 0.16, 0.05), new THREE.MeshBasicMaterial({ color: '#fff4c8' }), s, 0.8, 2.31, G, { cast: false });
  add(new THREE.ConeGeometry(0.28, 0.7, 14), toon({ color: '#d8a050' }), 0, 2.98, 0.4, G).rotation.x = Math.PI;      // the giant cone on the roof
  add(new THREE.SphereGeometry(0.34, 14, 12), toon({ color: '#ff9ac8' }), 0, 3.4, 0.4, G);
  const bulbs = []; for (let k = 0; k < 9; k++) { const m = new THREE.MeshBasicMaterial({ color: ['#ff6a9a', '#ffd23f', '#7ae0ff'][k % 3] }); bulbs.push(m); add(new THREE.SphereGeometry(0.045, 8, 6), m, 0.99, 2.52, -1.9 + k * 0.38, G, { cast: false }); }
  const menu = SETS.canvasPlane(ctx, 0.66, 0.9, 512, G, { lit: false }); menu.mesh.position.set(0.97, 1.88, 0.8); menu.mesh.rotation.y = Math.PI / 2;
  const glow = new THREE.PointLight('#ffe0b0', 0, 9, 1.2); glow.position.set(0.2, 2.15, -0.3); G.add(glow);
  const spill = new THREE.PointLight('#ffd0e0', 0, 7, 1.3); spill.position.set(1.8, 2.0, -0.3); G.add(spill);
  // the morning photo (held by Mum)
  const R = new THREE.Group(); ctx.world.add(R);
  const photo = SETS.canvasPlane(ctx, 0.3, 0.37, 512, R, { lit: true }); photo.mesh.position.set(...PHOTO);
  return { br, G, menu, glow, spill, bulbs, photo };
};
export const update = (W, f, P) => {
  if (!P.br) return;
  P.br.state(W, f);
  P.G.visible = W.van;
  P.glow.intensity = W.van ? W.vanGlow : 0; P.spill.intensity = W.van ? W.vanGlow * 0.8 : 0;
  P.bulbs.forEach((m, k) => m.color.set(W.van && ((f >> 3) + k) % 3 ? ['#ff6a9a', '#ffd23f', '#7ae0ff'][k % 3] : '#3a3040'));
  P.menu.draw('m' + W.reveal, drawMenu(W.reveal));
  P.photo.mesh.visible = W.photo; if (W.photo) P.photo.draw('p' + W.gran, drawPhoto(W.gran));
};
export const worldAt = (f) => {
  const S = shotAt(f), i = S.i, id = S.id;
  const W = { door: 0, beep: -1, lamp: 0, moon: 0.7, street: 1.6, headlights: 0, car: false, van: true, vanGlow: 1.6, reveal: 0, photo: false, gran: 1 };
  if (id === 'menu') W.reveal = q(smooth(ramp(f, S.beat - 8, S.beat + 8)), 1);
  if (i > 3 && i < 6) W.reveal = 1;
  if (i >= 6 && i <= 8) { W.van = false; W.moon = 0; W.street = 0; W.photo = true; }
  if (id === 'chair') W.gran = q(1 - smooth(ramp(f, S.beat - 14, S.beat + 4)), 1);
  if (i >= 9) { W.vanGlow = 1.2; W.street = id === 'seconds' && (f % 23 < 2) ? 0 : 1.1; W.moon = 0.5; }
  return W;
};

// ---------- the cast ----------
const KS = 0.62, MS = 0.86;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const you = (expr, o = {}, pos = KIDVAN, extra = {}) => out.push(actor(T, YOU, { seed: 31, expr, blink: blinkAt(f, 31), ...o, who: 'you' }, pos, { s: KS, ...extra }));
  const man = (expr, o = {}, pos = VL(0.5, 0.72, -0.3), extra = {}) => out.push(actor(T, MAN, { seed: 52, expr, blink: blinkAt(f, 52), ...o, who: 'man' }, pos, { s: MS, blob: false, ...extra }));
  if (id === 'song') you(f < S.beat ? 'nervous' : 'wary', { look: -0.7, headTilt: f >= S.beat ? 6 : 0 }, KIDWIN);
  if (id === 'van') man('smile', { look: 0.4 });
  if (id === 'smile') man(f < S.beat ? 'smile' : 'creepy', { look: 0.2, blink: f >= S.beat ? 0 : blinkAt(f, 52) });
  if (id === 'menu' || id === 'free') man(id === 'free' ? 'creepy' : 'smile', { look: 0.3, R: id === 'free' ? 'reach' : 'hang', blink: id === 'free' ? 0 : blinkAt(f, 52) });
  if (id === 'free') you(f < S.beat ? 'smile' : 'laugh', { look: -0.5 });
  if (id === 'taste') you(f < S.beat ? 'smile' : 'smile_closed', { look: -0.2, R: 'lift' });
  if (id === 'photo') { out.push(actor(T, 'mum', { seed: 9, expr: 'smile', blink: blinkAt(f, 9), R: 'lift', look: 0.4 }, MUM, { s: 0.82 })); you('neutral', { look: -0.6 }, KIDROOM); }
  if (id === 'blank') you(f < S.beat ? 'nervous' : 'dazed', { look: -0.4 }, KIDROOM);
  if (id === 'again') { you('scared', { look: -0.7, blink: 0 }, W0(-1.5, 0, 0.45)); man('smile', { look: 0.3 }); }
  if (id === 'seconds') { man('creepy', { look: 0.15, R: f >= S.beat ? 'knock' : 'wave', blink: 0 }, W0(-2.75, -0.05, 0.12), { s: 0.9 }); }
  return out;
};
const note = (t) => (p) => { const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - t); g.font = '900 230px Arial'; g.textAlign = 'center'; g.lineWidth = 16; g.strokeStyle = '#241726';
  g.strokeText('♪', 300, 560); g.fillStyle = '#ff9ac8'; g.fillText('♪', 300, 560); g.restore(); };
const cone = (p) => { const g = p.g; g.fillStyle = '#d8a050'; g.beginPath(); g.moveTo(240, 420); g.lineTo(360, 420); g.lineTo(300, 720); g.fill(); g.lineWidth = 10; g.strokeStyle = '#241726'; g.stroke();
  g.fillStyle = '#ffd8a8'; g.beginPath(); g.arc(300, 390, 80, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#ffd23f'; for (const [x, y] of [[270, 360], [330, 380], [300, 340]]) { g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); } };
const sparkle = (t) => (p) => { const g = p.g; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.9 * Math.sin(Math.PI * t);
  const gr = g.createRadialGradient(300, 500, 0, 300, 500, 90); gr.addColorStop(0, '#fff2c0'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(200, 400, 200, 200); g.restore(); };
export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [];
  if (id === 'song' || id === 'van' || id === 'again') for (let k = 0; k < 3; k++) {
    const t = q(((f + k * 20) % 60) / 60, 1), base = id === 'song' ? W0(-2.3, 1.3, -0.3 + k * 0.25) : VL(1.0, 2.4, -1 + k * 0.6);
    out.push(fx('n' + k + t, note(t), [base[0] + 0.2 * t, base[1] + 0.5 * t, base[2]], id === 'song' ? 0.22 : 0.6));
  }
  if (id === 'taste') {
    out.push(fx('cone', cone, VL(2.05, 0.42, 0.42), 0.26, { order: 6 }));
    if (f >= S.beat - 10) for (let k = 0; k < 6; k++) { const t = q(((f + k * 11) % 40) / 40, 1); out.push(fx('s' + k + t, sparkle(t), VL(1.4 + 0.15 * k, 0.8 + 0.25 * (k % 3) + 0.3 * t, 0.1 + 0.08 * k), 0.35)); }
  }
  if (id === 'seconds') { const d = f - S.beat - 6; if (d >= 0 && d < 26) { const t = q(d / 26); out.push(fx('sec' + t, word('SECONDS?', t, '#ff9ac8'), W0(-2.2, 1.7, 0.1), 0.5)); } }
  return out;
};
