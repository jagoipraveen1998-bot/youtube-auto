// "My Brother Is Trapped Inside Our Bathroom Mirror" (The Mirror Is a Lock, Part 1). A tiled bathroom at night.
// The mirror over the sink is a window into a dark copy of the room: my little brother stands in it, and a tall
// black thing with pale eyes comes closer every shot until its hands are on his shoulders. He presses a note to
// the glass; I lift the hammer; Mum stops me and plays Dad's tape. Through the curtain, every neighbour across the
// street stands in a lit window, smiling. The thing rises huge behind him as he whispers; the clock strikes twelve
// and the hammer hangs at the glass. The choice (BREAK IT / KEEP IT LOCKED) is the on-screen end line.
// Look: moonlit sky with clouds, detailed houses across the street (sets.js cottage), Nolan-style framing:
// slow push-in on the mirror, low angle under the hammer, dead-centre street through the window, a wide hold at the end.
import * as SETS from './sets.js';
import { OUTFITS } from './toon.js';
import { makeStory, MOODS, SHOT, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';
import { animeActor } from './anime.js';            // anime-style cast (our own designs)

const MB = [120, 0, 0], L = (x, y, z) => [MB[0] + x, MB[1] + y, MB[2] + z];
// cast: everyone different at a glance
const SIS = { ...OUTFITS.kid, tunic: '#3f7a5a', hair: '#3a2418', pigtails: '#3a2418', ribbon: '#e8c84a' };     // me: green hoodie, pigtails
const BRO = { ...OUTFITS.kid, tunic: '#d8c86a', hair: '#8a5a2a' };                                             // little brother: yellow jumper, light brown hair
const MUM = { ...OUTFITS.mum, tunic: '#6a4a7a', hair: '#2a1a14', long: '#2a1a14', bun: '#2a1a14', dress: '#4a3a5a' };   // Mum: long dark hair, bun, purple
const THING = { ...OUTFITS.kid, tunic: '#000000' };
const MIR = L(0, 1.6, -1.5), BROP = L(0, 0.55, -2.35), SISP = L(0.2, 0, 0.55), MUMP = L(-0.35, 0, 0.75), WIN = L(-1.5, 1.5, 0.1), CLOCK = L(1.48, 1.95, 0.55), REC = L(0.5, 0.93, -1.18);

const IDS = ['trapped', 'closer', 'hands', 'note', 'hammer', 'mum', 'recording', 'crying', 'curtain', 'street', 'whisper', 'twelve'];
const CAMS = {
  trapped: SHOT.pushIn(L(0, 1.55, -1.5), [0, 1], 2.6),                                                 // slow push at the mirror
  closer: [{ pos: L(0.45, 1.5, 0.3), look: L(0, 1.5, -3.2), fov: 40 }, { pos: L(0.3, 1.5, 0.0), look: L(0, 1.5, -3.4), fov: 36 }],
  hands: [{ pos: L(0.05, 1.6, -0.55), look: L(0, 1.45, -2.35), fov: 30 }, { pos: L(0.02, 1.58, -0.75), look: L(0, 1.45, -2.35), fov: 27 }],
  note: [{ pos: L(0.08, 1.6, -0.95), look: L(0, 1.58, -1.5), fov: 32 }, { pos: L(0.05, 1.6, -1.1), look: L(0, 1.58, -1.5), fov: 30 }],
  hammer: [{ pos: L(0.0, 1.05, -0.95), look: L(0.25, 1.5, 0.55), fov: 52 }, { pos: L(0.0, 1.0, -0.85), look: L(0.3, 1.6, 0.55), fov: 48 }],   // low angle from just in front of the mirror
  mum: [{ pos: L(-0.2, 1.35, -0.9), look: L(-0.05, 1.15, 0.65), fov: 48 }, { pos: L(-0.15, 1.3, -0.8), look: L(-0.05, 1.15, 0.65), fov: 44 }],
  recording: [{ pos: L(0.15, 1.35, -0.2), look: REC, fov: 40 }, { pos: L(0.2, 1.25, -0.4), look: REC, fov: 36 }],
  crying: SHOT.pushIn(L(0, 1.45, -2.35), [0.08, 1], 1.9),
  curtain: [{ pos: L(0.5, 1.45, 1.25), look: L(-1.5, 1.45, 0.0), fov: 46 }, { pos: L(0.4, 1.45, 1.05), look: L(-1.5, 1.5, 0.0), fov: 42 }],
  street: [{ pos: L(-0.9, 1.55, 0.1), look: L(-14, 2.6, 0.1), fov: 42 }, { pos: L(-2.8, 1.7, 0.1), look: L(-14, 2.7, 0.1), fov: 40 }],   // through the window, dead centre
  whisper: [{ pos: L(0, 1.45, 0.6), look: L(0, 1.85, -2.6), fov: 44 }, { pos: L(0, 1.4, 0.35), look: L(0, 1.95, -2.6), fov: 42 }],
  twelve: [{ pos: L(0.95, 1.9, 0.55), look: CLOCK, fov: 30 }, { pos: L(0.35, 1.3, 0.9), look: L(0, 1.65, -1.6), fov: 46 }],
};
const LIGHTS = {
  bath: { ...MOODS.moonNight, hemi: 0.55, sky: '#8a9ab8', ground: '#2a2a34', fog: '#0c1020', fogNear: 6, fogFar: 30, gain: '#e8eeff', lift: '#06080e', vig: 0.5, sat: 1.0 },
  glass: { ...MOODS.moonNight, hemi: 0.45, sky: '#7a9a9a', ground: '#141a1e', fog: '#06100e', fogNear: 3, fogFar: 14, gain: '#d4f0ea', lift: '#030807', vig: 0.62, sat: 0.95 },
  street: { ...MOODS.moonNight, hemi: 0.7, fog: '#121a36', fogNear: 10, fogFar: 60, moonAz: 180, moonEl: 22, clouds: 0.42, vig: 0.4, sat: 1.0 },
};
const FOCUS = (S) => ({ trapped: L(0, 1.55, -2.0), closer: L(0, 1.5, -2.8), hands: L(0, 1.45, -2.35), note: L(0, 1.58, -1.5), hammer: L(0.2, 1.45, 0.55), mum: L(-0.1, 1.15, 0.65),
  recording: REC, crying: L(0, 1.45, -2.35), curtain: L(-1.5, 1.45, 0.1), street: L(-14, 2.6, 0.1), whisper: L(0, 1.8, -2.6), twelve: L(0, 1.6, -1.6) }[S.id]);
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.id === 'street' ? 'street' : ['hands', 'crying', 'whisper'].includes(S.id) ? 'glass' : 'bath'),
  tweak: (L_, S, f) => { if (S.id === 'whisper') L_.vig = 0.74; if (S.id === 'twelve' && f > S.beat) L_.vig = 0.66;
    if ((S.id === 'hands' || S.id === 'whisper') && f >= S.beat && f < S.beat + 3) { L_.gain = '#ffffff'; L_.lift = '#3a3a48'; L_.vig = 0.1; } },   // impact flash frame
  kicks: ['hands', 'whisper'],
  focus: (S) => FOCUS(S),
  shadowAt: () => L(0, 1, -0.5),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, dofAt } = K;
export { LIGHTS };
// vertical 9:16: centre each shot on its subject; glide between shots, hard cuts on the scares
const CUTS = new Set(['hands', 'curtain', 'street', 'whisper', 'twelve']), GLIDE = 24, PULL = { street: 0, twelve: 0, curtain: 0.3 };
const mix = (a, b, t) => ({ ...b, pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t) });
const vert = (c, S) => { const p = FOCUS(S); return { ...c, look: lerp3(c.look, p, PULL[S.id] ?? 0.7), fov: Math.min(75, c.fov * 1.2) }; };
const cam = (f) => vert(K.camAt(f), shotAt(f));
export const camAt = (f) => { const S = shotAt(f), c = cam(f); if (S.i === 0 || CUTS.has(S.id) || f - S.a >= GLIDE) return c; return mix(cam(S.a - 1), c, smooth((f - S.a) / GLIDE)); };

// ---------- textures painted here ----------
const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const tiles = (col, grout, n = 8) => cv(512, 512, (g, w) => { g.fillStyle = grout; g.fillRect(0, 0, w, w); const s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = Math.sin(i * 12.9 + j * 78.2) * 0.5 + 0.5; g.fillStyle = col; g.globalAlpha = 0.9 + 0.1 * v; g.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
    g.globalAlpha = 0.25; g.fillStyle = '#ffffff'; g.fillRect(i * s + 6, j * s + 6, s * 0.5, 4); g.globalAlpha = 1; } });
const checker = () => cv(512, 512, (g, w) => { const s = w / 8; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#2a2c34' : '#d8d8d0'; g.fillRect(i * s, j * s, s, s); } });
const glassTex = () => cv(256, 320, (g, w, h) => { g.clearRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(200,230,240,0.18)'); gr.addColorStop(1, 'rgba(120,160,180,0.08)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,0.16)'; g.beginPath(); g.moveTo(30, h); g.lineTo(120, 0); g.lineTo(150, 0); g.lineTo(60, h); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.moveTo(150, h); g.lineTo(220, 0); g.lineTo(232, 0); g.lineTo(162, h); g.fill(); });
const noteDraw = (g, w, h) => { g.fillStyle = '#f2ecd8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8c8e8'; g.lineWidth = 2; for (let y = 40; y < h; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.save(); g.translate(w, 0); g.scale(-1, 1);                        // written from behind the glass, so it reads the right way round from our side
  g.restore(); g.fillStyle = '#b02020'; g.font = '700 46px "Comic Sans MS", cursive'; g.textAlign = 'center';
  g.fillText('BREAK IT', w / 2, h * 0.36); g.fillText('BEFORE', w / 2, h * 0.58); g.fillText('MIDNIGHT', w / 2, h * 0.8); };
// a neighbour standing in a lit window: warm room, dark figure, pale face with a wide fixed smile
const neighbour = (seed) => cv(128, 192, (g, w, h) => {
  const r = (k) => { const v = Math.sin(seed * 91.7 + k * 37.3) * 43758.5; return v - Math.floor(v); };
  const gr = g.createRadialGradient(w / 2, h * 0.45, 8, w / 2, h * 0.45, h * 0.7); gr.addColorStop(0, '#ffe0a0'); gr.addColorStop(1, '#a8601e'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(110,30,30,0.85)'; g.fillRect(0, 0, 18, h); g.fillRect(w - 18, 0, 18, h);
  const cx = w / 2 + (r(1) - 0.5) * 16, hy = h * 0.42;
  g.fillStyle = ['#2a2a3a', '#3a2a2a', '#2a3a32', '#3a3428'][(r(2) * 4) | 0]; g.beginPath(); g.ellipse(cx, h * 0.98, 44, 70, 0, 0, 7); g.fill();          // shoulders
  g.fillStyle = ['#e8c8a8', '#c89068', '#f0d4b8', '#a87050'][(r(3) * 4) | 0]; g.beginPath(); g.ellipse(cx, hy, 26, 31, 0, 0, 7); g.fill();               // face
  g.fillStyle = ['#1a1410', '#6a4a2a', '#c8c4be', '#2a1a10'][(r(4) * 4) | 0]; g.beginPath(); g.ellipse(cx, hy - 20, 28, 16, 0, Math.PI, 0); g.fill();       // hair
  g.fillStyle = '#100808'; for (const dx of [-9, 9]) { g.beginPath(); g.ellipse(cx + dx, hy - 4, 3.5, 4.5, 0, 0, 7); g.fill(); }                               // still eyes
  g.strokeStyle = '#3a0808'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(cx - 15, hy + 9); g.quadraticCurveTo(cx, hy + 24, cx + 15, hy + 9); g.stroke();    // the smile
  g.fillStyle = '#fff8f0'; g.beginPath(); g.moveTo(cx - 13, hy + 10); g.quadraticCurveTo(cx, hy + 21, cx + 13, hy + 10); g.quadraticCurveTo(cx, hy + 15, cx - 13, hy + 10); g.fill(); });

// ---------- the set ----------
export const build = (ctx) => {
  const { THREE, add, box, tbox, toon, texM, P } = ctx;
  SETS.houseLightsOff(ctx);
  const G = new THREE.Group(); G.position.set(...MB); ctx.world.add(G);
  const tileW = texM(tiles('#eef2f0', '#a8b0ac'), 3, 2), tileD = texM(tiles('#6a9a92', '#3a5a56', 10), 3, 2), paint = texM(P.weather(P.plaster(91, 190), 92, 0.6), 2, 1, '#c8d4d8');
  const floor = texM(checker(), 3, 3), chrome = toon({ color: '#c8d0d8' }), white = toon({ color: '#f4f4f0' }), wood = texM(P.planks(93), 1, 1, '#6a4a30'), dark = toon({ color: '#14161a' });
  // room 3 x 3 x 2.6; back wall (z = -1.5) has the mirror opening, left wall (x = -1.5) the window
  add(tbox(3, 0.1, 3, 1), floor, 0, -0.05, 0, G, { cast: false }); add(tbox(3, 0.1, 3, 1), paint, 0, 2.65, 0, G, { cast: false });
  const wall = (w, h, x, y, z, ry = 0, lower = true) => { const m = add(tbox(w, h, 0.1, 1), y + h / 2 < 1.25 ? tileW : paint, x, y, z, G); m.rotation.y = ry; return m; };
  // back wall around the mirror hole (x -0.5..0.5, y 1.0..2.2)
  add(tbox(3, 1.0, 0.1, 1), tileW, 0, 0.5, -1.55, G); add(tbox(3, 0.4, 0.1, 1), paint, 0, 2.4, -1.55, G);
  add(tbox(1.0, 1.2, 0.1, 1), tileW, -1.0, 1.6, -1.55, G); add(tbox(1.0, 1.2, 0.1, 1), tileW, 1.0, 1.6, -1.55, G);
  // right wall + front wall
  add(tbox(0.1, 2.6, 3, 1), tileW, 1.55, 1.3, 0, G); add(tbox(3, 2.6, 0.1, 1), tileW, 0, 1.3, 1.55, G);
  // left wall around the window hole (z -0.4..0.6, y 0.95..2.05)
  add(tbox(0.1, 0.95, 3, 1), tileW, -1.55, 0.475, 0, G); add(tbox(0.1, 0.55, 3, 1), paint, -1.55, 2.325, 0, G);
  add(tbox(0.1, 1.1, 1.1, 1), tileW, -1.55, 1.5, -0.95, G); add(tbox(0.1, 1.1, 0.9, 1), tileW, -1.55, 1.5, 1.05, G);
  for (const [x, z, w, d] of [[0, -1.49, 3, 0.03], [1.49, 0, 0.03, 3], [0, 1.49, 3, 0.03], [-1.49, 0, 0.03, 3]]) add(box(w, 0.05, d), toon({ color: '#5a6a68' }), x, 1.22, z, G, { cast: false });   // tile trim
  // the mirror: ornate dark frame, faint glass; behind it a dark copy of the room where my brother is
  for (const [w, h, x, y] of [[1.2, 0.12, 0, 2.26], [1.2, 0.12, 0, 0.94], [0.12, 1.4, -0.56, 1.6], [0.12, 1.4, 0.56, 1.6]]) add(box(w, h, 0.08), toon({ color: '#3a2a1e' }), x, y, -1.47, G);
  for (const [x, y] of [[-0.56, 2.26], [0.56, 2.26], [-0.56, 0.94], [0.56, 0.94]]) add(new THREE.SphereGeometry(0.06, 10, 8), toon({ color: '#b08a3a' }), x, y, -1.43, G);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.2), new THREE.MeshBasicMaterial({ map: P.tex(glassTex()), transparent: true, depthWrite: false }));
  gl.position.set(0, 1.6, -1.5); gl.userData.ndSkip = true; gl.renderOrder = 6; G.add(gl);
  const M = new THREE.Group(); M.position.set(0, 0, 0); G.add(M);      // the other side: deep, tall, sea-green and dark
  add(tbox(3, 0.1, 5, 1), floor, 0, 0.5, -4.1, M, { cast: false }); add(tbox(0.1, 5, 5, 1), tileD, -1.5, 2.5, -4.1, M); add(tbox(0.1, 5, 5, 1), tileD, 1.5, 2.5, -4.1, M);
  add(tbox(3, 5, 0.1, 1), tileD, 0, 2.5, -6.6, M); add(tbox(3, 0.1, 5, 1), tileD, 0, 5.0, -4.1, M, { cast: false });
  add(box(0.8, 0.85, 0.5), toon({ color: '#1e2a2a' }), 0.9, 0.95, -2.2, M); add(new THREE.CylinderGeometry(0.22, 0.18, 0.08, 16), toon({ color: '#5a6a6a' }), 0.9, 1.4, -2.2, M);   // its sink, mirrored
  const mirL = new THREE.PointLight('#8ae0d0', 2.2, 8, 1.2); mirL.position.set(0.4, 2.6, -2.0); M.add(mirL);
  const back = new THREE.PointLight('#a8f0e0', 3, 7, 1.2); back.position.set(0, 2.2, -5.8); M.add(back);   // a pale glow at the far end, so the thing stands out black against it
  // the note he presses to the glass (from the other side)
  const note = SETS.canvasPlane(ctx, 0.28, 0.36, 256, G, { lit: false }); note.draw('n', noteDraw); note.mesh.position.set(0.05, 1.58, -1.52); note.mesh.rotation.z = -0.06;
  // sink and vanity
  add(box(1.0, 0.85, 0.5), wood, 0.35, 0.43, -1.25, G); for (const x of [0.12, 0.58]) add(box(0.4, 0.7, 0.02), toon({ color: '#5a3a24' }), x, 0.43, -0.99, G);
  add(box(1.04, 0.05, 0.54), toon({ color: '#e8e6e0' }), 0.35, 0.88, -1.25, G); const basin = add(new THREE.CylinderGeometry(0.2, 0.15, 0.1, 20), white, 0.0, 0.92, -1.25, G);
  add(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 8), chrome, 0, 1.0, -1.42, G).rotation.x = 0.0; add(box(0.03, 0.03, 0.14), chrome, 0, 1.1, -1.36, G);
  for (const x of [-0.08, 0.08]) add(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 10), chrome, x, 0.93, -1.42, G);
  add(new THREE.CylinderGeometry(0.03, 0.035, 0.16, 10), toon({ color: '#5a9ac8' }), 0.7, 0.98, -1.35, G); add(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 10), toon({ color: '#e87a8a' }), 0.78, 0.96, -1.3, G);
  // bath with a shower rail, towel, toilet
  add(box(0.75, 0.55, 1.7), white, 1.12, 0.28, 0.45, G); add(box(0.6, 0.1, 1.55), toon({ color: '#b8c8d0' }), 1.12, 0.52, 0.45, G);
  add(new THREE.CylinderGeometry(0.012, 0.012, 1.7, 6), chrome, 0.76, 2.1, 0.45, G).rotation.x = Math.PI / 2;
  const sc = add(new THREE.PlaneGeometry(1.0, 1.4, 12, 1), toon({ color: '#9ab8c0', side: THREE.DoubleSide }), 0.76, 1.4, 1.0, G); sc.rotation.y = Math.PI / 2;
  { const pa = sc.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 18) * 0.035); }
  add(box(0.06, 0.5, 0.3), toon({ color: '#c84a4a' }), 1.48, 1.3, -0.6, G);
  add(box(0.4, 0.4, 0.55), white, -1.15, 0.2, -1.1, G); add(box(0.42, 0.06, 0.5), white, -1.15, 0.43, -1.05, G); add(box(0.4, 0.45, 0.16), white, -1.15, 0.65, -1.38, G);
  // the window onto the street, a frame, and two curtains that slide apart
  for (const [w, h, z, y] of [[0.08, 1.2, -0.42, 1.5], [0.08, 1.2, 0.62, 1.5]]) add(box(0.12, h, w), white, -1.5, y, z, G);
  for (const y of [0.92, 2.08, 1.5]) add(box(0.12, 0.07, 1.1), white, -1.5, y, 0.1, G);
  add(box(0.12, 1.1, 0.05), white, -1.5, 1.5, 0.1, G);
  add(box(0.25, 0.05, 1.3), white, -1.42, 0.9, 0.1, G);                                                        // sill
  add(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 6), chrome, -1.44, 2.18, 0.1, G).rotation.x = Math.PI / 2;
  const curtM = toon({ color: '#7a3a4a', side: THREE.DoubleSide }), curtains = [-1, 1].map((s) => { const c = add(new THREE.PlaneGeometry(0.6, 1.3, 10, 1), curtM, -1.43, 1.5, 0.1 + s * 0.28, G, { cast: false }); c.rotation.y = Math.PI / 2;
    const pa = c.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 22) * 0.025); return c; });
  // wall clock by the door
  const clockG = new THREE.Group(); clockG.position.set(1.49, 1.95, 0.55); clockG.rotation.y = -Math.PI / 2; G.add(clockG);
  add(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 24), toon({ color: '#3a2a1e' }), 0, 0, 0, clockG).rotation.x = Math.PI / 2;
  const face = SETS.canvasPlane(ctx, 0.3, 0.3, 256, clockG, { lit: true }); face.mesh.position.z = 0.025;
  // Dad's old tape recorder on the counter, and the hammer
  const rec = new THREE.Group(); rec.position.set(0.5, 0.93, -1.18); rec.rotation.y = -0.3; G.add(rec);
  add(box(0.3, 0.1, 0.18), toon({ color: '#2a2a30' }), 0, 0.05, 0, rec); add(box(0.24, 0.05, 0.02), toon({ color: '#6a6a72' }), 0, 0.06, 0.09, rec);
  const reels = [-0.06, 0.06].map((x) => { const r = add(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 12), toon({ color: '#e8e2d2' }), x, 0.06, 0.1, rec); r.rotation.x = Math.PI / 2; return r; });
  const recLed = add(new THREE.SphereGeometry(0.01, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3030' }), 0.12, 0.09, 0.09, rec, { cast: false });
  const hammer = new THREE.Group(); G.add(hammer);
  add(new THREE.CylinderGeometry(0.018, 0.022, 0.34, 10), toon({ color: '#8a5a2a' }), 0, 0, 0, hammer);
  add(box(0.15, 0.05, 0.05), toon({ color: '#5a5e66' }), 0, 0.18, 0, hammer); add(box(0.04, 0.04, 0.05), toon({ color: '#5a5e66' }), -0.09, 0.2, 0, hammer);
  // light: one bulb on the ceiling (it flickers when the thing rises)
  const bulb = SETS.bulb(ctx, G, 0.1, 2.6, 0.7, '#e8f0ff');
  // the street outside: road, pavement, lamps, and a row of real houses facing us, a neighbour in every window
  const S_ = new THREE.Group(); S_.position.set(-1.5, 0, 0); G.add(S_);
  add(tbox(6, 0.1, 40, 2), texM(P.stone(94, 30, 6, 30, 64, 64), 4, 20, '#4a4c52'), -6.5, -0.2, 0, S_, { cast: false });          // road
  for (const x of [-2.2, -10.8]) add(tbox(2.2, 0.15, 40, 1), texM(P.stone(95, 30, 8, 56), 2, 20, '#9a9690'), x, -0.075, 0, S_, { cast: false });
  for (const z of [-6, 2, 10]) SETS.streetLamp(ctx, S_, -9.9, z, { on: true });
  const NB = [];
  for (let k = -3; k <= 3; k++) {
    const c = SETS.cottage(ctx, S_, { x: -14, z: k * 3.6, w: 3.6, wall: ['brick', 'plaster', 'stone', 'plasterB', 'brick', 'stoneB', 'plaster'][k + 3], roof: k % 2 ? 'slate' : 'tile', door: ['#2a3a5a', '#5a2a2a', '#2a4a3a'][(k + 3) % 3], seed: k + 40, ry: -Math.PI / 2, number: 20 + k, lit: [0, 1, 2] });
    c.glass.forEach((gm, i) => { gm.map = P.tex(neighbour(k * 7 + i + 50)); gm.color.set('#ffffff'); gm.needsUpdate = true; NB.push(gm); });
  }
  return { gl, note, M, curtains, face, reels, recLed, hammer, bulb, mirL, NB };
};
const clockDraw = (mins) => (g, w) => { g.fillStyle = '#f2ece0'; g.beginPath(); g.arc(w / 2, w / 2, w * 0.47, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#2a2420'; g.stroke();
  g.fillStyle = '#2a2420'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.arc(w / 2 + Math.sin(a) * w * 0.38, w / 2 - Math.cos(a) * w * 0.38, i % 3 ? 4 : 8, 0, 7); g.fill(); }
  const hand = (a, l, lw) => { g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(w / 2, w / 2); g.lineTo(w / 2 + Math.sin(a) * l, w / 2 - Math.cos(a) * l); g.stroke(); };
  hand((mins / 60) * Math.PI * 2, w * 0.36, 7); hand(((11 + mins / 60) / 12) * Math.PI * 2, w * 0.24, 11); };
export const update = (W, f, P) => {
  if (!P.gl) return;
  P.note.mesh.visible = W.note;
  P.curtains.forEach((c, i) => { const s = i ? 1 : -1; c.position.z = 0.1 + s * (0.28 + 0.42 * W.curtain); c.scale.x = 1 - 0.45 * W.curtain; });
  P.face.draw('c' + W.mins, clockDraw(W.mins));
  P.reels.forEach((r) => (r.rotation.y = W.tape ? f * 0.25 : 0)); P.recLed.visible = W.tape && f % 30 < 20;
  P.hammer.visible = W.hammer !== null; if (W.hammer) { P.hammer.position.set(...W.hammer.p.map((v, i) => v - MB[i])); P.hammer.rotation.set(W.hammer.r[0], W.hammer.r[1], W.hammer.r[2]); }
  P.bulb.light.intensity = W.bulb; P.bulb.glassM.color.set(W.bulb > 0.5 ? '#e8f0ff' : '#3a3a40');
  P.mirL.intensity = W.mirror;
};
export const worldAt = (f) => {
  const S = shotAt(f), id = S.id, i = S.i;
  const W = { note: i >= 3 && i <= 4, curtain: i >= 9 ? 1 : 0, mins: 57 + Math.min(2, Math.floor(i / 5)), tape: id === 'recording' || id === 'mum', hammer: { p: L(0.62, 0.95, -1.0), r: [Math.PI / 2, 0, 0.3] }, bulb: 2.4, mirror: 2.2 };
  if (id === 'curtain') W.curtain = smooth(ramp(f, S.a + 6, S.beat + 10));
  const HAND = L(-0.1, 1.3, 0.52);
  const held = (t) => ({ p: lerp3(L(0.62, 0.95, -1.0), HAND, t), r: [lerp(Math.PI / 2, 0.1, t), 0, lerp(0.3, 0.15, t)] });
  if (id === 'hammer') W.hammer = held(smooth(ramp(f, S.a + 4, S.beat + 6)));
  if (id === 'mum' || id === 'recording' || id === 'crying') W.hammer = held(1);
  if (id === 'mum') W.hammer = { p: HAND, r: [0.1, 0, 0.15] };
  if (i >= 8 && i <= 10) W.hammer = null;
  if (id === 'whisper') { W.bulb = (f - S.a) % 9 < 2 || f > S.beat ? 0.4 : 2.4; W.mirror = f > S.beat ? 3.2 : 2.2; }
  if (id === 'twelve') { W.mins = 60; const t = smooth(ramp(f, S.beat, S.b - 30)); W.hammer = { p: lerp3(HAND, L(0.16, 1.62, -1.32), t), r: [0, 0.2, lerp(-0.2, Math.PI / 2 - 0.3, t)] }; W.bulb = 1.2; }
  return W;
};

// ---------- the cast ----------
const KS = 0.62;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, i = S.i, out = [];
  const inGlass = (o = {}, x = {}) => out.push(animeActor('bro', { blink: blinkAt(f, 57), look: 0, ...o }, BROP, { s: 0.5, tint: '#d8ece8', blob: false, ...x }));
  // the thing: a tall black figure deep in the glass, closer each time; huge when it rises
  const thing = (z, s, y = 0.55, x = 0.05) => out.push(actor(T, THING, { seed: 99, expr: 'neutral', blink: 0, look: 0 }, L(x, y, z), { s, tint: '#020204', blob: false, shadow: false, order: 1 }));
  const thingAt = { trapped: [-5.6, 0.7], closer: [-4.2, 0.8], hands: [-2.75, 0.85], note: [-3.0, 0.8], hammer: null, mum: null, recording: null, crying: [-2.9, 0.85], curtain: null, street: null, whisper: [-2.95, 0.85], twelve: [-2.8, 1.9] }[id];
  if (thingAt) {
    let [z, s] = thingAt, y = 0.55;
    if (id === 'whisper') { const t = smooth(ramp(f, S.beat - 4, S.b - 6)); s = lerp(0.85, 2.0, t); y = lerp(0.55, 0.3, t); }
    thing(z, s, y);
  }
  const broExpr = { trapped: 'scared', closer: 'scared', hands: 'shock', note: 'nervous', hammer: 'nervous', mum: 'pained', recording: 'pained', crying: 'cry', curtain: 'dazed', whisper: 'creepy', twelve: 'creepy' }[id];
  if (broExpr && !['curtain', 'street', 'recording'].includes(id)) inGlass({ expr: broExpr, R: id === 'note' ? 'up' : 'hang', look: id === 'whisper' || id === 'twelve' ? 0 : 0.2, tearT: id === 'crying' ? q((f % 40) / 40, 1) : 0 });
  const sis = (expr, o = {}, pos = SISP) => out.push(animeActor('sis', { expr, blink: blinkAt(f, 31), ...o }, pos, { s: 0.66 }));
  const mum = (expr, o = {}, pos = MUMP) => out.push(animeActor('mum', { expr, blink: blinkAt(f, 9), ...o }, pos, { s: 0.78 }));
  if (id === 'hammer') sis('stubborn', { R: 'lift', look: -0.1 });
  if (id === 'mum') { sis('shock', { R: 'lift', look: 0.6 }); mum('stern', { R: 'reach', look: -0.6 }); }
  if (id === 'curtain') { mum('wary', { R: 'reach', look: -0.8 }, L(-1.15, 0, -0.55)); sis('scared', { look: -0.7 }, L(0.0, 0, 0.55)); }
  // the end: no one in frame, just the hammer hanging at the glass
  return out;
};
// fx: the thing's pale eyes, its long black hands on his shoulders, the sob, the clock's strike, the word KEEP IT
const eyes = (o) => (p) => { const g = p.g; g.save(); g.globalAlpha = o; g.shadowColor = '#e8fff8'; g.shadowBlur = 24; g.fillStyle = '#f0fff8';
  for (const x of [262, 338]) { g.beginPath(); g.ellipse(x, 460, 15, 8, x < 300 ? 0.2 : -0.2, 0, 7); g.fill(); } g.restore(); };
const hands = (t) => (p) => { const g = p.g; g.save(); g.fillStyle = '#030305';
  for (const s of [-1, 1]) { const x = 300 + s * 120, y = 330 + (1 - t) * -120; g.beginPath(); g.ellipse(x, y, 52, 34, s * 0.3, 0, 7); g.fill();
    for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x - 36 + k * 22, y + 10); g.quadraticCurveTo(x - 40 + k * 24 + s * 6, y + 70, x - 30 + k * 22, y + 110 + (k === 1 || k === 2 ? 20 : 0)); g.lineWidth = 15; g.lineCap = 'round'; g.strokeStyle = '#030305'; g.stroke(); } }
  g.restore(); };
const tear = (t) => (p) => { const g = p.g; g.fillStyle = 'rgba(170,215,240,0.95)'; for (const x of [266, 334]) { const y = 470 + (t * 160) % 120; g.beginPath(); g.ellipse(x, y, 6, 10, 0, 0, 7); g.fill(); } };
// anime impact: radial speed lines bursting from the centre for a few frames
const speed = (t) => (p) => { const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - t); g.strokeStyle = '#f4f8ff'; g.lineCap = 'round';
  for (let k = 0; k < 44; k++) { const a = k / 44 * Math.PI * 2 + (k % 3) * 0.05, r0 = 250 + (k % 5) * 30 - t * 60, r1 = 900;
    g.lineWidth = 4 + (k % 4) * 3; g.beginPath(); g.moveTo(300 + Math.cos(a) * r0, 500 + Math.sin(a) * r0 * 1.4); g.lineTo(300 + Math.cos(a) * r1, 500 + Math.sin(a) * r1 * 1.4); g.stroke(); }
  g.restore(); };
export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [];
  if ((id === 'hands' || id === 'whisper') && f >= S.beat && f < S.beat + 12) { const c = camAt(f), d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], n = Math.hypot(...d);
    const k = 1.4, sc = 2 * k * Math.tan((c.fov || 40) * 1.2 * Math.PI / 360) / 2.25 * 1.05; out.push(fx('sp' + (f - S.beat), speed((f - S.beat) / 12), [c.pos[0] + d[0] / n * k, c.pos[1] + d[1] / n * k - 0.475 * 2.25 * sc, c.pos[2] + d[2] / n * k], sc, { order: 9 })); }
  const thingPos = { trapped: [-5.6, 0.7], closer: [-4.2, 0.8], hands: [-2.75, 0.85], note: [-3.0, 0.8], crying: [-2.9, 0.85], whisper: [-2.95, 0.85], twelve: [-2.8, 1.9] }[id];
  if (thingPos) { let [z, s] = thingPos, y = 0.55; if (id === 'whisper') { const t = smooth(ramp(f, S.beat - 4, S.b - 6)); s = lerp(0.85, 2.0, t); y = lerp(0.55, 0.3, t); }
    out.push(fx('e' + q(s, 2), eyes(1), L(0.05, y + 1.03 * s, z + 0.05), 0.3 * s / 0.66, { order: 3 })); }
  if (id === 'hands' || id === 'crying' || id === 'whisper' || id === 'twelve') { const t = id === 'hands' ? smooth(ramp(f, S.a + 4, S.beat)) : 1; out.push(fx('h' + q(t, 1), hands(t), L(0.0, 0.62, BROP[2] + 0.06 - MB[2]), 0.48, { order: 4 })); }
  if (id === 'crying') out.push(fx('t' + (f % 30), tear(f / 30), L(0.0, 0.58, BROP[2] + 0.05 - MB[2]), 0.48, { order: 5 }));
  if (id === 'twelve' && f > S.a + 6 && f < S.beat) { const d = (f - S.a - 6) % 28; if (d < 14) out.push(fx('dong' + d, word('DONG', q(d / 14), '#e8eef8'), L(1.2, 2.35, 0.55), 0.22)); }
  return out;
};
