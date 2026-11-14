// "There Was An Extra Face On Our Video Call": the living room at night, a laptop on a desk by the window.
import { TIMING, TOTAL as T_TOTAL } from './timing.js';
import * as TT from './toon.js';
export const FPS = 30, TOTAL = T_TOTAL, DECK = 0;
const IDS = ['wide', 'four', 'laugh', 'fifth', 'notice', 'mic', 'chat', 'reply', 'count', 'hand', 'slam', 'reflect'];
export const SHOTS = IDS.map((id, i) => ({ id, i, a: TIMING[i].a, b: TIMING[i].b, beat: TIMING[i].beat, light: 'night' }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ramp = (f, a, b) => clamp((f - a) / (b - a));
const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;
const sh = (id) => SHOTS[IDS.indexOf(id)];

export const LIGHTS = {
  night: { az: 180, el: 26, sky: '#6f80c0', ground: '#22223e', hemi: 0.8, sun: '#b8ccff', sunI: 2.0, fog: '#141c3c', fogNear: 7, fogFar: 34,
    skyTop: '#060a22', skyHor: '#1e2a58', sat: 1.08, vig: 0.4, shadowExt: 7, lamp: 0, tv: 0, porch: 0, fill: 0.7, gain: '#e6ecff', lift: '#03040c' },
};
export const lightFor = (S, f) => {
  const L = { ...LIGHTS.night };
  if (['hand', 'slam', 'reflect'].includes(S.id)) L.vig = 0.52;
  return L;
};

// the desk, the laptop and its glow
const DESK = [-2.7, 0, -0.2], KID = [-1.9, -0.06, -0.2], SCREEN = [-2.78, 0.97, -0.2];
const SW = 1024, SHH = 680;
let scr = null;
export const build = ({ THREE, world, add, box, toon, scene, tvG, rug }) => {
  rug.visible = false;
  const wood = toon({ color: '#6a4528' }), dark = toon({ color: '#20222c' }), grey = toon({ color: '#9aa0b4' });
  add(box(0.9, 0.05, 1.3), wood, DESK[0], 0.72, DESK[2], world);
  for (const [dx, dz] of [[-0.4, -0.6], [0.4, -0.6], [-0.4, 0.6], [0.4, 0.6]]) add(box(0.05, 0.72, 0.05), wood, DESK[0] + dx, 0.36, DESK[2] + dz, world);
  add(box(0.45, 0.06, 0.45), toon({ color: '#3a6a9a' }), -1.82, 0.45, -0.2, world);                        // chair
  add(box(0.05, 0.62, 0.45), toon({ color: '#3a6a9a' }), -1.6, 0.76, -0.2, world);
  for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) add(box(0.04, 0.45, 0.04), grey, -1.82 + dx, 0.22, -0.2 + dz, world);
  const lap = new THREE.Group(); lap.position.set(-2.62, 0.75, -0.2); lap.rotation.y = Math.PI / 2; world.add(lap);
  add(box(0.6, 0.025, 0.4), grey, 0, 0.012, 0, lap);
  add(box(0.5, 0.004, 0.2), dark, 0, 0.026, 0.05, lap);                                                    // keyboard
  const lid = new THREE.Group(); lid.position.set(0, 0.02, -0.2); lap.add(lid);
  add(box(0.6, 0.4, 0.018), grey, 0, 0.2, 0, lid);
  const c = document.createElement('canvas'); c.width = SW; c.height = SHH;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.37), new THREE.MeshBasicMaterial({ map: tex })); screen.position.set(0, 0.2, 0.011); lid.add(screen);
  screen.userData.ndSkip = true;
  const glow = new THREE.PointLight('#8fb8ff', 0, 4, 1.6); glow.position.set(-2.25, 1.05, -0.2); scene.add(glow);
  // the TV across the room: its dark glass holds the last reflection
  const rc = document.createElement('canvas'); rc.width = 640; rc.height = 400;
  const rtex = new THREE.CanvasTexture(rc); rtex.colorSpace = THREE.SRGBColorSpace;
  const refl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6), new THREE.MeshBasicMaterial({ map: rtex, transparent: true })); refl.position.set(0, 0.9, 0.065); tvG.add(refl);
  refl.userData.ndSkip = true;
  scr = { g: c.getContext('2d'), tex, lid, glow, screen, rg: rc.getContext('2d'), rtex, refl };
  return scr;
};

// ---------- the call, drawn onto the laptop screen ----------
const FR = [{ who: 'civA', name: 'Kavya', seed: 21 }, { who: 'civB', name: 'Rahul', seed: 22 }, { who: 'civC', name: 'Sam', seed: 23 }, { who: 'kid', name: 'You', seed: 9 }];
const INKC = '#241726';
function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function person(g, who, o, x, y, w, h) {          // head and shoulders of a cast card, framed in a tile
  const s = h / 470; g.save(); rrect(g, x, y, w, h, 18); g.clip();
  g.translate(x + w / 2 - 300 * s, y - 115 * s); g.scale(s, s);
  TT.romanFront(new TT.Pen(g), who, o); g.restore();
}
function backOfHead(g, x, y, w, h, tint = '#3f6fb0') {   // your own camera… showing the back of your head
  g.save(); rrect(g, x, y, w, h, 18); g.clip();
  g.fillStyle = '#2a2f48'; g.fillRect(x, y, w, h);
  const cx = x + w / 2, s = h / 280;
  g.lineWidth = 6 * s; g.strokeStyle = INKC;
  g.fillStyle = tint; g.beginPath(); g.ellipse(cx, y + h + 20 * s, 150 * s, 120 * s, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#f5c9a0'; for (const e of [-1, 1]) { g.beginPath(); g.ellipse(cx + e * 92 * s, y + 150 * s, 16 * s, 24 * s, 0, 0, 7); g.fill(); g.stroke(); }
  g.fillStyle = '#2b1d16'; g.beginPath(); g.ellipse(cx, y + 140 * s, 92 * s, 100 * s, 0, 0, 7); g.fill(); g.stroke();
  g.restore();
}
function hand(g, x, y, w, h, k) {                  // a long grey hand coming from behind, towards the shoulder
  if (k <= 0) return;
  g.save(); rrect(g, x, y, w, h, 18); g.clip();
  const sx = x + w * 0.05, sy = y - 10, ex = lerp(sx, x + w * 0.42, k), ey = lerp(sy, y + h * 0.72, k);
  g.lineCap = 'round'; g.strokeStyle = INKC; g.lineWidth = 46; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + 10, (sy + ey) / 2, ex, ey); g.stroke();
  g.strokeStyle = '#b8bccb'; g.lineWidth = 34; g.stroke();
  for (let i = 0; i < 4; i++) { const a = 0.6 + i * 0.32; g.strokeStyle = INKC; g.lineWidth = 15; g.beginPath(); g.moveTo(ex, ey); g.lineTo(ex + Math.cos(a) * 52, ey + Math.sin(a) * 52); g.stroke(); g.strokeStyle = '#b8bccb'; g.lineWidth = 8; g.stroke(); }
  g.restore();
}
function label(g, txt, x, y, col = '#fff') { g.font = '700 26px Arial'; const w = g.measureText(txt).width + 26; g.fillStyle = 'rgba(0,0,0,0.6)'; rrect(g, x, y, w, 38, 10); g.fill(); g.fillStyle = col; g.fillText(txt, x + 13, y + 27); }
function drawScreen(f) {
  const g = scr.g, S = shotAt(f), i = S.i, bt = S.beat;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#141626'; g.fillRect(0, 0, SW, SHH);
  g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(34, 30, 9, 0, 7); g.fill(); g.font = '700 24px Arial'; g.fillStyle = '#e6e8f2'; g.fillText('Late-night call', 52, 39);
  const five = i > 3 || (i === 3 && f >= bt);
  const tiles = five ? [[14, 60, 324, 270], [350, 60, 324, 270], [686, 60, 324, 270], [182, 342, 324, 270], [518, 342, 324, 270]]
    : [[14, 60, 490, 300], [520, 60, 490, 300], [14, 372, 490, 300], [520, 372, 490, 300]];
  const order = five ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
  order.forEach((k) => {
    const [x, y, w, h] = tiles[k];
    if (k < 4) {
      const F = FR[k], me = k === 3;
      const laugh = i <= 2 || (i === 3 && f < bt);
      const worried = i >= 4 && !me;
      if (me && i >= 8) backOfHead(g, x, y, w, h);
      else {
        g.fillStyle = ['#3a4a7a', '#5a3a6a', '#3a6a5a', '#4a4a6a'][k]; rrect(g, x, y, w, h, 18); g.fill();
        const expr = me ? (i >= 3 && five ? 'nervous' : laugh ? 'laugh' : 'neutral') : laugh ? (k === 1 ? 'grin' : 'laugh') : worried ? 'neutral' : 'smile';
        person(g, F.who, { seed: F.seed, expr, blink: (f + F.seed * 7) % 53 < 3 ? 1 : 0, look: me ? 0 : (k - 1) * 0.3, headTilt: laugh ? Math.round(5 * Math.sin(f * 0.35 + k)) : 0 }, x, y, w, h);
      }
      if (me && i >= 9) hand(g, x, y, w, h, smooth(ramp(f, sh('hand').a + 4, sh('hand').beat + 6)));
      label(g, F.name, x + 12, y + h - 50);
      if (i === 8 && k < 3) { const a = ramp(f, S.a + 8 + k * 14, S.a + 14 + k * 14); if (a > 0) { g.globalAlpha = a; g.font = '900 90px Arial Black'; g.lineWidth = 12; g.strokeStyle = INKC; g.strokeText(String(k + 1), x + w - 80, y + 92); g.fillStyle = '#ffd23f'; g.fillText(String(k + 1), x + w - 80, y + 92); g.globalAlpha = 1; } }
      if (me && i === 8 && f > S.beat) { g.font = '900 120px Arial Black'; g.lineWidth = 14; g.strokeStyle = INKC; g.strokeText('?', x + w - 90, y + 110); g.fillStyle = '#ffd23f'; g.fillText('?', x + w - 90, y + 110); }
    } else {                                        // the fifth square: camera off, no name
      const pop = i === 3 ? smooth(ramp(f, bt, bt + 8)) : 1;
      g.save(); g.translate(x + w / 2, y + h / 2); g.scale(pop, pop); g.translate(-(x + w / 2), -(y + h / 2));
      g.fillStyle = '#05050a'; rrect(g, x, y, w, h, 18); g.fill();
      g.font = '900 150px Arial Black'; g.fillStyle = '#3a3d50'; g.textAlign = 'center'; g.fillText('?', x + w / 2, y + h / 2 + 52); g.textAlign = 'left';
      if (i >= 5) {                                 // its microphone is on: something breathing
        g.strokeStyle = '#3ccf72'; g.lineWidth = 7; g.beginPath();
        for (let b = 0; b < 16; b++) { const a2 = 8 + 34 * Math.abs(Math.sin(f * 0.12 + b * 0.6)) * (0.5 + 0.5 * Math.sin(f * 0.05)); g.moveTo(x + 70 + b * 12, y + h - 78 - a2); g.lineTo(x + 70 + b * 12, y + h - 78 + a2); }
        g.stroke(); g.strokeStyle = '#3ccf72'; g.lineWidth = 8; rrect(g, x, y, w, h, 18); g.stroke();
      }
      label(g, '(no name)', x + 12, y + h - 50, '#c8cad8');
      g.restore();
    }
    g.lineWidth = 6; g.strokeStyle = INKC; rrect(g, x, y, w, h, 18); g.stroke();
  });
  if (i === 6 || i === 7) {                          // the chat
    g.fillStyle = 'rgba(16,18,30,0.94)'; rrect(g, 560, 330, 450, 330, 20); g.fill(); g.strokeStyle = '#4a5070'; g.lineWidth = 4; g.stroke();
    g.font = '700 26px Arial'; g.fillStyle = '#9aa0c0'; g.fillText('Chat', 584, 368);
    const msg = 'Who added this?', n = i === 6 ? Math.floor(ramp(f, S.a + 6, S.beat) * msg.length) : msg.length;
    g.fillStyle = '#2f6fd8'; rrect(g, 700, 390, 290, 64, 18); g.fill(); g.fillStyle = '#fff'; g.font = '700 28px Arial'; g.fillText(msg.slice(0, n) + (i === 6 && f % 20 < 10 ? '|' : ''), 718, 432);
    if (i === 7) { const a = smooth(ramp(f, S.a + 4, S.a + 12)); g.globalAlpha = a; g.fillStyle = '#3a3d50'; rrect(g, 584, 470, 410, 110, 18); g.fill(); g.fillStyle = '#ffd23f'; g.font = '700 22px Arial'; g.fillText('Sam', 602, 500); g.fillStyle = '#fff'; g.font = '700 26px Arial'; g.fillText('Added who? It\'s just', 602, 534); g.fillText('the three of us.', 602, 564); g.globalAlpha = 1; }
  }
  scr.tex.needsUpdate = true;
}
function drawReflection(f) {                       // the dark TV: two of you
  const g = scr.rg, S = shotAt(f);
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 640, 400);
  g.fillStyle = 'rgba(6,8,16,0.9)'; g.fillRect(0, 0, 640, 400);
  const a = 0.5 * smooth(ramp(f, S.a, S.a + 20)), a2 = 0.5 * smooth(ramp(f, S.beat - 10, S.beat + 10));
  for (const [x, al, expr] of [[180, a, 'nervous'], [450, a2, 'grin']]) {
    if (al <= 0) continue;
    g.save(); g.globalAlpha = al; g.translate(x - 300 * 0.5, 40); g.scale(0.5, 0.5); TT.romanFront(new TT.Pen(g), 'kid', { seed: 9, expr, blink: 0, look: x < 300 ? 0.4 : -0.4 }); g.restore();
  }
  const gr = g.createLinearGradient(0, 0, 640, 400); gr.addColorStop(0, 'rgba(160,190,255,0.16)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 640, 400);
  scr.rtex.needsUpdate = true;
}
export const update = (W, f) => {
  if (!scr) return;
  const S = shotAt(f);
  scr.lid.rotation.x = -0.26 + (W.lid ?? 0) * (Math.PI / 2 - 0.26) * -1 + (W.lid ?? 0) * 0;      // open, tilted back
  scr.lid.rotation.x = lerp(-0.26, Math.PI / 2, W.lid ?? 0);
  scr.screen.visible = (W.lid ?? 0) < 0.95; scr.glow.intensity = (1 - (W.lid ?? 0)) * 1.8 * (0.92 + 0.08 * Math.sin(f * 0.7));
  if (scr.screen.visible) drawScreen(f);
  scr.refl.visible = S.id === 'reflect'; if (scr.refl.visible) drawReflection(f);
};

// cameras
const CAMS = {
  wide: [{ pos: [1.8, 1.75, 2.4], look: [-2.2, 0.9, -0.3], fov: 48 }, { pos: [1.3, 1.65, 1.9], look: [-2.2, 0.92, -0.3], fov: 45 }],
  four: [{ pos: [-1.4, 1.3, 0.35], look: [-2.78, 0.97, -0.2], fov: 36 }, { pos: [-1.55, 1.25, 0.25], look: [-2.78, 0.97, -0.2], fov: 33 }],
  laugh: [{ pos: [-1.7, 1.0, -0.12], look: [-2.78, 0.96, -0.12], fov: 33 }, { pos: [-1.85, 1.0, -0.12], look: [-2.78, 0.96, -0.12], fov: 31 }],
  fifth: [{ pos: [-1.7, 0.98, -0.22], look: [-2.78, 0.94, -0.22], fov: 33 }, { pos: [-1.95, 0.95, -0.27], look: [-2.78, 0.9, -0.27], fov: 30 }],
  notice: [{ pos: [-2.5, 1.22, 0.5], look: [-1.9, 1.08, -0.2], fov: 46 }, { pos: [-2.45, 1.2, 0.4], look: [-1.9, 1.1, -0.2], fov: 42 }],
  mic: [{ pos: [-2.25, 0.94, -0.26], look: [-2.78, 0.92, -0.26], fov: 26 }, { pos: [-2.4, 0.92, -0.26], look: [-2.78, 0.92, -0.26], fov: 24 }],
  chat: [{ pos: [-1.45, 1.3, 0.35], look: [-2.78, 0.95, -0.25], fov: 34 }, { pos: [-1.6, 1.26, 0.25], look: [-2.78, 0.93, -0.28], fov: 31 }],
  reply: [{ pos: [-2.0, 0.92, -0.33], look: [-2.78, 0.88, -0.35], fov: 29 }, { pos: [-2.15, 0.9, -0.35], look: [-2.78, 0.88, -0.35], fov: 27 }],
  count: [{ pos: [-1.7, 1.0, -0.2], look: [-2.78, 0.96, -0.2], fov: 34 }, { pos: [-1.85, 0.98, -0.16], look: [-2.78, 0.95, -0.16], fov: 32 }],
  hand: [{ pos: [-2.25, 0.93, -0.12], look: [-2.78, 0.9, -0.12], fov: 24 }, { pos: [-2.4, 0.92, -0.1], look: [-2.78, 0.9, -0.1], fov: 21, roll: 2 }],
  slam: [{ pos: [-0.4, 1.45, 1.6], look: [-2.3, 0.9, -0.3], fov: 44 }, { pos: [-0.2, 1.45, 1.9], look: [-2.0, 1.0, -0.2], fov: 48 }],
  reflect: [{ pos: [0.55, 1.05, 1.0], look: [-0.2, 0.9, 2.4], fov: 40 }, { pos: [0.35, 1.0, 1.35], look: [-0.2, 0.9, 2.4], fov: 37 }],
};
export const camAt = (f) => {
  const S = shotAt(f), K = CAMS[S.id], t = smooth(ramp(f, S.a, S.b)), a = K[0], b = K[1];
  const c = { pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll || 0, b.roll || 0, t) };
  const kicks = [sh('fifth').beat, sh('hand').beat, sh('slam').beat, sh('reflect').beat];
  for (const k of kicks) { const d = f - k; if (d >= 0 && d < 7) { const s = (d % 2 ? -1 : 1) * 0.03 * (1 - d / 7); c.look = [c.look[0], c.look[1] + s * 2, c.look[2] + s]; c.roll += s * 18; } }
  c.flash = 0; c.shadowAt = [-1.5, 0.8, -0.2];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (['four', 'chat', 'laugh', 'fifth', 'mic', 'reply', 'count', 'hand'].includes(S.id)) return { focus: dist(C.pos, SCREEN), cinf: 6 };
  if (S.id === 'notice') return { focus: dist(C.pos, [-1.9, 1.1, -0.2]), cinf: 10 };
  if (S.id === 'reflect') return { focus: dist(C.pos, [-0.2, 0.9, 2.4]), cinf: 10 };
  return { focus: dist(C.pos, [-2.0, 0.95, -0.2]), cinf: 5 };
};
export const worldAt = (f) => {
  const S = shotAt(f);
  const W = { door: 0, doorShake: 0, wind: 0.6, motes: true, gap: false, feet: false, lid: 0 };
  if (S.id === 'slam') W.lid = smooth(ramp(f, S.beat - 8, S.beat));
  if (S.id === 'reflect') W.lid = 1;
  return W;
};

// actors
const blinkAt = (f, seed) => { const per = 38 + (seed * 17) % 31, ph = (f + seed * 13) % per; return ph < 2 ? 0.5 : ph < 4 ? 1 : 0; };
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const BACK = (pos, extra = {}) => ({ key: 'kidback', draw: (p) => { const g = p.g; g.lineWidth = 8; g.strokeStyle = INKC;
    g.fillStyle = '#3f6fb0'; g.beginPath(); g.roundRect(190, 520, 220, 380, 90); g.fill(); g.stroke();
    g.fillStyle = '#f5c9a0'; for (const e of [-1, 1]) { g.beginPath(); g.ellipse(300 + e * 98, 400, 18, 26, 0, 0, 7); g.fill(); g.stroke(); }
    g.fillStyle = '#2b1d16'; g.beginPath(); g.ellipse(300, 385, 100, 112, 0, 0, 7); g.fill(); g.stroke(); },
  x: pos[0], y: pos[1], z: pos[2], s: 0.72, blob: false, ...extra });
const SCR = '#c4d6ff';
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (['wide', 'four', 'chat'].includes(S.id)) out.push(BACK(KID, { tint: '#b8c6f0' }));
  if (S.id === 'notice') out.push(R(T, 'kid', { seed: 9, expr: f > S.beat ? 'nervous' : 'wary', look: -0.2, blink: blinkAt(f, 9) }, KID, { s: 0.72, tint: SCR, blob: false }));
  if (S.id === 'slam') {
    const up = smooth(ramp(f, S.beat + 4, S.beat + 18));
    out.push(R(T, 'kid', { seed: 9, expr: 'scared', look: q(Math.sin(f * 0.12) * 0.7, 1), blink: 0 }, [lerp(-1.9, -1.75, up), lerp(-0.06, 0, up), lerp(-0.2, 0.15, up)], { s: 0.72, tint: '#b8c6f0' }));
  }
  return out;
};
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const word = (txt, t) => (p) => { const g = p.g; g.save(); g.font = '900 150px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round';
  g.globalAlpha = Math.max(0, 1 - t * 1.1); g.translate(300, 500); g.scale(1 + t * 0.35, 1 + t * 0.35); g.rotate(-0.08);
  g.lineWidth = 22; g.strokeStyle = INKC; g.strokeText(txt, 0, 0); g.fillStyle = '#ffd23f'; g.fillText(txt, 0, 0); g.restore(); };
export const fxAt = (f) => {
  const S = shotAt(f), out = [];
  if (S.id === 'slam') { const d = f - S.beat; if (d >= 0 && d < 16) { const t = q(d / 16); out.push(FX('slam' + t, word('SLAM', t), [-2.5, 1.35, -0.2], 0.6)); } }
  return out;
};
