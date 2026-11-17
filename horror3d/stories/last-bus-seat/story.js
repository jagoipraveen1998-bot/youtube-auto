// "Something Sat Next To Me On The Last Bus": a night bus interior built here (seats, poles, strip lights,
// sliding front doors, a driver's mirror, streetlights sliding past the windows). Nothing gets on, the seat beside
// you sinks, a smiley is drawn on the fogged glass, and in the mirror something on the back seat waves.
import * as TT from './toon.js';
import * as SETS from './sets.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const AT = [0, 0, -90], W0 = (x, y, z) => [AT[0] + x, AT[1] + y, AT[2] + z];
const GHOST = { ...TT.OUTFITS.marlow, tunic: '#cfd6e6', dress: '#cfd6e6', skin: '#e2e6f0', hair: '#121016' };
const ROW = -3.6;                                                    // your row (right side, near the back)
const YOU = W0(0.42, -0.36, ROW), NEXT = W0(0.92, 0.5, ROW), WIN = W0(1.2, 1.35, ROW - 0.4), MIRROR = W0(-0.15, 2.0, 4.82),
  FRONT = W0(0.35, 0, 3.55), DRIVER = W0(-0.62, -0.32, 4.25), DOOR = W0(1.2, 1.1, 4.0), BACK = W0(0.0, 0.8, -4.6);

const IDS = ['ride', 'ears', 'doors', 'sink', 'fog', 'smiley', 'front', 'mirror', 'wave', 'driver', 'end'];
const CAMS = {
  ride: [{ pos: W0(0.0, 1.75, 4.3), look: W0(0.1, 0.9, -3.5), fov: 56 }, { pos: W0(0.0, 1.7, 3.2), look: W0(0.2, 0.9, -3.6), fov: 50 }],
  ears: [{ pos: W0(-0.15, 1.4, -2.85), look: W0(0.42, 0.95, ROW), fov: 46 }, { pos: W0(-0.05, 1.35, -2.95), look: W0(0.42, 0.95, ROW), fov: 40 }],
  doors: [{ pos: W0(-0.5, 1.5, 2.2), look: DOOR, fov: 50 }, { pos: W0(-0.4, 1.45, 2.6), look: DOOR, fov: 44 }],
  sink: [{ pos: W0(0.1, 1.45, -2.8), look: W0(0.68, 0.65, ROW), fov: 48 }, { pos: W0(0.15, 1.4, -2.9), look: W0(0.75, 0.6, ROW), fov: 42 }],
  fog: [{ pos: W0(0.2, 1.4, -2.9), look: WIN, fov: 44 }, { pos: W0(0.3, 1.4, -3.1), look: WIN, fov: 36 }],
  smiley: [{ pos: W0(0.35, 1.38, -3.3), look: WIN, fov: 36 }, { pos: W0(0.45, 1.38, -3.45), look: WIN, fov: 30 }],
  front: [{ pos: W0(-0.6, 1.5, 1.3), look: W0(0.35, 1.1, 3.55), fov: 44 }, { pos: W0(-0.55, 1.45, 1.8), look: W0(0.35, 1.15, 3.55), fov: 40 }],
  mirror: [{ pos: W0(0.25, 1.45, 3.4), look: MIRROR, fov: 34 }, { pos: W0(0.15, 1.6, 3.8), look: MIRROR, fov: 26 }],
  wave: [{ pos: W0(0.0, 1.85, 4.25), look: MIRROR, fov: 20 }, { pos: W0(-0.08, 1.92, 4.45), look: MIRROR, fov: 14 }],
  driver: [{ pos: W0(0.35, 1.3, 2.7), look: W0(-0.55, 1.05, 4.25), fov: 44 }, { pos: W0(0.25, 1.3, 2.95), look: W0(-0.58, 1.1, 4.25), fov: 38 }],
  end: [{ pos: W0(-0.7, 1.35, 1.7), look: W0(0.45, 1.2, 3.45), fov: 42 }, { pos: W0(-0.65, 1.35, 2.0), look: W0(0.45, 1.25, 3.45), fov: 36 }],
};
const LIGHTS = {
  bus: { ...MOODS.night, az: 160, el: 40, hemi: 1.0, sky: '#b8c8e8', ground: '#2a2c38', sun: '#dfe8ff', sunI: 1.1, fog: '#0a0e1e', fogNear: 9, fogFar: 40,
    skyTop: '#03050f', skyHor: '#0c1430', vig: 0.36, gain: '#f2f6ff', lift: '#02030a', shadowExt: 6 },
  cold: { ...MOODS.dread, az: 160, el: 40, hemi: 0.75, sun: '#b8c4f0', sunI: 0.8, fogNear: 7, fogFar: 30, vig: 0.6, shadowExt: 6 },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.i >= 3 ? 'cold' : 'bus'),
  tweak: (L, S) => { if (['wave', 'end'].includes(S.id)) L.vig = 0.75; },
  kicks: ['sink', 'wave'],
  focus: (S) => ({ ride: W0(0.3, 0.9, ROW), ears: W0(0.42, 1.0, ROW), doors: DOOR, sink: NEXT, fog: WIN, smiley: WIN, front: W0(0.35, 1.1, 3.55),
    mirror: MIRROR, wave: MIRROR, driver: W0(-0.62, 1.15, 4.25), end: W0(0.3, 1.2, 3.55) }[S.id]),
  shadowAt: (S) => (S.i >= 6 ? W0(0, 1, 3.6) : W0(0.5, 0.8, ROW)),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, camAt, dofAt } = K;
export { LIGHTS };

// ---------- the bus ----------
export const build = (ctx) => {
  const { THREE, add, box, toon, world } = ctx;
  SETS.houseLightsOff(ctx);
  const G = new THREE.Group(); G.position.set(...AT); world.add(G);
  const L = 10, Wd = 2.5, H = 2.35, Z0 = -5, Z1 = 5;
  const body = toon({ color: '#d8dce6' }), trim = toon({ color: '#3a3e4a' }), floorM = toon({ color: '#4a4e5a' }), seatM = toon({ color: '#2f4f8f' }), seatF = toon({ color: '#3d64b0' }), pole = toon({ color: '#e0b030' });
  const glass = new THREE.MeshBasicMaterial({ color: '#0a1022', transparent: true, opacity: 0.55 });
  add(box(Wd, 0.1, L), floorM, 0, -0.05, 0, G, { cast: false });
  add(box(0.12, 0.06, L), toon({ color: '#c8a030' }), 0, 0.005, 0, G, { cast: false });                  // aisle strip
  add(box(Wd, 0.08, L), toon({ color: '#eceef4' }), 0, H, 0, G, { cast: false });
  const DZ0 = 3.45, DZ1 = 4.45;                                            // the doorway on the right, near the front
  for (const s of [-1, 1]) {                                               // side walls: low panel, window band, top panel
    const segs = s < 0 ? [[Z0, Z1]] : [[Z0, DZ0], [DZ1, Z1]];
    for (const [a, b] of segs) { const len = b - a, mz = (a + b) / 2;
      add(box(0.08, 0.95, len), body, s * Wd / 2, 0.47, mz, G); add(box(0.03, 1.05, len), glass, s * (Wd / 2 + 0.02), 1.47, mz, G, { cast: false }).userData.ndSkip = true; }
    add(box(0.08, 0.35, L), body, s * Wd / 2, H - 0.17, 0, G);
    for (let z = Z0; z <= Z1; z += 1.4) if (!(s > 0 && z > DZ0 - 0.1 && z < DZ1 + 0.1)) add(box(0.1, 1.05, 0.08), trim, s * Wd / 2, 1.47, z, G);
    
  }
  add(box(Wd, H, 0.1), body, 0, H / 2, Z0, G); add(box(Wd * 0.8, 0.7, 0.02), glass, 0, 1.55, Z0 + 0.06, G, { cast: false });
  add(box(Wd, 0.9, 0.1), body, 0, 0.45, Z1, G); add(box(Wd, 1.25, 0.02), glass, 0, 1.55, Z1 + 0.02, G, { cast: false });   // windscreen
  // the back bench and the seat rows
  const seat = (x, z, w = 0.95) => {
    add(box(w, 0.42, 0.5), trim, x, 0.21, z, G); const c = add(box(w - 0.04, 0.09, 0.48), seatF, x, 0.46, z, G);
    add(box(w, 0.62, 0.1), seatM, x, 0.8, z - 0.24, G); return c;
  };
  seat(0, -4.6, Wd - 0.12);
  const cush = {};
  for (let z = -3.6; z <= 2.2; z += 1.2) for (const x of [-0.72, 0.68]) { const c = seat(x, z); if (Math.abs(z - ROW) < 0.01 && x > 0) cush.row = c; }
  // the seat beside you is its own cushion so it can sink
  cush.row.scale.x = 0.48; cush.row.position.x = AT[0] * 0 + 0.44; const next = add(box(0.44, 0.09, 0.48), seatF, 0.92, 0.46, ROW, G);
  for (const z of [-2.4, 0]) { add(new THREE.CylinderGeometry(0.025, 0.025, H, 8), pole, 0.32, H / 2, z, G); add(new THREE.CylinderGeometry(0.025, 0.025, H, 8), pole, -0.32, H / 2, z, G); }
  add(new THREE.CylinderGeometry(0.02, 0.02, L, 8), pole, 0.32, 2.05, 0, G).rotation.x = Math.PI / 2;
  // strip lights
  const stripM = new THREE.MeshBasicMaterial({ color: '#eaf2ff' }), strips = [];
  for (const s of [-1, 1]) { const m = add(box(0.1, 0.03, L - 0.6), stripM, s * 0.75, H - 0.03, 0, G, { cast: false }); m.userData.ndSkip = true; strips.push(m); }
  const lamps = [-3.2, 0, 3.2].map((z) => { const l = new THREE.PointLight('#dfe8ff', 1.6, 5.5, 1.3); l.position.set(0, H - 0.2, z); G.add(l); return l; });
  // driver's cab: wheel, dash, the round mirror above the windscreen
  add(box(0.9, 0.9, 0.5), trim, -0.65, 0.45, 4.7, G);
  const wheel = add(new THREE.TorusGeometry(0.22, 0.03, 8, 20), toon({ color: '#14161c' }), -0.62, 1.05, 4.45, G); wheel.rotation.x = -1.0;
  add(box(0.7, 0.42, 0.5), trim, -0.62, 0.21, 4.25, G); add(box(0.6, 0.08, 0.5), seatF, -0.62, 0.46, 4.25, G);
  const mir = SETS.canvasPlane(ctx, 0.62, 0.32, 512, G); mir.mesh.position.set(-0.15, 2.0, 4.82); mir.mesh.rotation.y = Math.PI;
  add(box(0.68, 0.38, 0.04), toon({ color: '#14161c' }), -0.15, 2.0, 4.85, G);
  // front doors (slide open towards the front)
  const doorM = toon({ color: '#9aa4b8' });
  const dA = add(box(0.04, 2.0, 0.5), doorM, Wd / 2, 1.0, 3.7, G, { cast: false }), dB = add(box(0.04, 2.0, 0.5), doorM, Wd / 2, 1.0, 4.2, G, { cast: false });
  for (const d of [dA, dB]) { const w = add(box(0.05, 1.1, 0.36), new THREE.MeshBasicMaterial({ color: '#0c1428' }), 0, 0.25, 0, d, { cast: false }); w.userData.ndSkip = true; }
  // outside: streetlights that slide past, a bus stop
  const outside = new THREE.Group(); G.add(outside);
  const glowM = new THREE.MeshBasicMaterial({ color: '#ffcf7a' }), passers = [];
  for (let k = 0; k < 6; k++) for (const s of [-1, 1]) { const m = add(new THREE.SphereGeometry(0.16, 10, 8), glowM, s * 3.2, 2.6, 0, outside, { cast: false }); m.userData.ndSkip = true; passers.push({ m, k, s }); }
  const stop = new THREE.Group(); stop.position.set(3.0, 0, 3.6); G.add(stop);
  add(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), trim, 0, 1.2, 0, stop);
  const sign = SETS.canvasPlane(ctx, 0.6, 0.6, 256, stop); sign.mesh.position.set(0, 2.3, 0); sign.mesh.rotation.y = -Math.PI / 2;
  sign.draw('stop', (g, w, h) => { g.fillStyle = '#c03030'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.46, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '900 64px Arial Black'; g.textAlign = 'center'; g.fillText('BUS', w / 2, h * 0.6); });
  add(box(0.1, 0.05, 6), toon({ color: '#3a3c44' }), 0, -0.25, 0, G);
  const fogP = SETS.canvasPlane(ctx, 0.62, 0.62, 512, G, { alpha: true }); fogP.mesh.position.set(1.19, 1.38, ROW - 0.4); fogP.mesh.rotation.y = -Math.PI / 2;
  return { G, next, mir, dA, dB, passers, stop, fogP, lamps, strips, stripM };
};

const drawMirror = (P, f, ghost, wave) => P.mir.draw('m' + ghost + (ghost ? q(Math.sin(f * 0.35), 1) : ''), (g, w, h) => {
  g.save(); g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 4, h / 2 - 4, 0, 0, 7); g.clip();
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a4258'); gr.addColorStop(1, '#151a28'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#eaf2ff'; g.fillRect(w * 0.2, h * 0.05, w * 0.6, 6);                                        // the strip light, reversed
  g.fillStyle = '#2f4f8f'; g.fillRect(w * 0.18, h * 0.55, w * 0.64, h * 0.22); g.fillStyle = '#3d64b0'; g.fillRect(w * 0.18, h * 0.72, w * 0.64, h * 0.08);   // the back bench
  for (const x of [0.12, 0.88]) { g.fillStyle = '#2f4f8f'; g.fillRect(w * (x - 0.08), h * 0.62, w * 0.16, h * 0.3); }
  if (ghost) { g.save(); const s = h * 0.62 / 1000; g.translate(w * 0.5 - 300 * s, h * 0.86 - 975 * s); g.scale(s, s);
    TT.romanFront(new TT.Pen(g), GHOST, { seed: 61, expr: 'creepy', blink: 0, look: 0.1, headTilt: 6, R: 'wave', wv: f * 0.35 }); g.restore();
    g.fillStyle = 'rgba(180,200,255,0.12)'; g.fillRect(0, 0, w, h); }
  g.restore(); g.strokeStyle = '#0c0e14'; g.lineWidth = 10; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 5, h / 2 - 5, 0, 0, 7); g.stroke();
});
const drawFog = (P, fog, smile) => P.fogP.draw('fog' + q(fog, 1) + '_' + q(smile, 1), (g, w, h) => {
  g.clearRect(0, 0, w, h); if (fog <= 0) return;
  const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, `rgba(220,228,240,${0.75 * fog})`); gr.addColorStop(1, 'rgba(220,228,240,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (smile > 0) {                                                         // drawn from the outside in: eyes, then the mouth
    g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round'; g.lineWidth = 22; g.strokeStyle = '#000';
    if (smile > 0.1) { g.beginPath(); g.arc(w * 0.38, h * 0.38, 8, 0, 7); g.stroke(); }
    if (smile > 0.25) { g.beginPath(); g.arc(w * 0.62, h * 0.38, 8, 0, 7); g.stroke(); }
    if (smile > 0.35) { g.beginPath(); g.arc(w / 2, h * 0.5, w * 0.2, 0.25, 0.25 + (Math.PI - 0.5) * Math.min(1, (smile - 0.35) / 0.6)); g.stroke(); }
    g.globalCompositeOperation = 'source-over';
  }
});
export const update = (W, f, P) => {
  if (!P.G) return;
  const sink = W.sink ?? 0; P.next.position.y = 0.46 - 0.07 * sink; P.next.scale.y = 1 - 0.45 * sink;
  const d = W.doors ?? 0; P.dA.position.z = 3.7 + 0.45 * d; P.dB.position.z = 4.2 + 0.45 * d;
  const spd = W.speed ?? 1, z0 = (f * 0.18 * spd) % 16;
  P.passers.forEach(({ m, k, s }) => { m.position.set(s * 3.2, 2.6, 8 - ((k * 2.7 + z0) % 16)); });
  P.stop.visible = !!W.stop;
  const lit = W.lights ?? 1; P.lamps.forEach((l) => { l.intensity = 1.6 * lit; }); P.stripM.color.set(lit > 0.6 ? '#eaf2ff' : '#6a7080');
  drawMirror(P, f, !!W.ghost); drawFog(P, W.fog ?? 0, W.smile ?? 0);
};
export const worldAt = (f) => {
  const S = shotAt(f), id = S.id, i = S.i;
  const W = { speed: 1, doors: 0, stop: false, sink: 0, fog: 0, smile: 0, ghost: false, lights: 1, motes: false, gap: false, feet: false, wind: 0 };
  if (id === 'doors') { W.speed = 0; W.stop = true; W.doors = smooth(ramp(f, S.a + 6, S.beat)); }
  if (i >= 3) W.sink = id === 'sink' ? smooth(ramp(f, S.beat - 4, S.beat + 6)) : 1;
  if (i >= 4) W.fog = id === 'fog' ? smooth(ramp(f, S.a + 4, S.beat + 10)) : 1;
  if (i >= 5) W.smile = id === 'smiley' ? smooth(ramp(f, S.a + 4, S.b - 6)) : 1;
  if (id === 'wave' && f >= S.beat - 2) W.ghost = true;
  if (i >= 8) W.lights = (f % 23 < 2) ? 0.35 : 0.85;
  if (id === 'end' && f >= S.beat) W.lights = (f % 11 < 3) ? 0.2 : 0.6;
  return W;
};

// ---------- the cast ----------
const YS = 0.8;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const you = (expr, o = {}, pos = YOU) => out.push(actor(T, 'kid', { seed: 9, expr, blink: blinkAt(f, 9), ...o }, pos, { s: YS }));
  const driver = (expr, o = {}) => out.push(actor(T, 'workB', { seed: 44, expr, blink: blinkAt(f, 44), ...o }, DRIVER, { s: 0.86 }));
  if (id === 'ride') { you('neutral', { look: 0.2 }); driver('neutral', { look: 0.3 }); }
  if (id === 'ears') you(f < S.beat ? 'neutral' : 'smile', { R: 'cheek', L: f >= S.beat ? 'cheek' : 'hang', look: 0.3 });
  if (id === 'doors') driver('neutral', { look: 0.6 });
  if (id === 'sink') you(f < S.beat ? 'neutral' : 'wary', { look: 0.7, R: 'cheek' });
  if (id === 'fog' || id === 'smiley') you(id === 'fog' ? 'wary' : 'scared', { look: 0.8, blink: id === 'smiley' ? 0 : blinkAt(f, 9) });
  if (id === 'front' || id === 'mirror') you(id === 'front' ? 'scared' : 'nervous', { look: -0.2, R: 'reach' }, FRONT);
  if (id === 'driver') { driver(f < S.beat ? 'neutral' : 'creepy', { look: -0.5, blink: f >= S.beat ? 0 : blinkAt(f, 44) }); you('scared', { look: -0.6, blink: 0 }, FRONT); }
  if (id === 'end') {
    you(f < S.beat ? 'nervous' : 'scared', { look: f < S.beat ? -0.8 : 0.6, blink: f >= S.beat ? 0 : blinkAt(f, 9) }, FRONT);
    if (f >= S.beat) { const t = smooth(ramp(f, S.beat, S.beat + 14)); out.push(actor(T, GHOST, { seed: 61, expr: 'creepy', blink: 0, look: 0.7, headTilt: 8, who: 'ghost' }, W0(0.68, 0, 3.3), { s: YS, tint: '#c8d0e8', alpha: lerp(0, 0.92, t), order: 3 })); }
  }
  return out;
};
export const fxAt = (f) => {
  const S = shotAt(f), out = [];
  if (S.id === 'doors') { const d = f - S.a - 6; if (d >= 0 && d < 18) { const t = q(d / 18); out.push(fx('hiss' + t, word('PSSHH', t, '#dfe6ff'), W0(1.0, 1.9, 3.9), 0.45)); } }
  if (S.id === 'sink') { const d = f - S.beat + 2; if (d >= 0 && d < 16) { const t = q(d / 16); out.push(fx('creak' + t, word('CREAK', t, '#c8d0ff'), W0(0.95, 1.1, ROW + 0.1), 0.32)); } }
  return out;
};
