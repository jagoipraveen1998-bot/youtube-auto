// ===== core: canvas, maths, drawing helpers, camera projection =====
const W = 1080, H = 1920, FPS = 30;
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
const INK = '#120d1c';
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = k => k * k * (3 - 2 * k);
const eio = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const eout = k => 1 - Math.pow(1 - k, 3);
function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function shadeHex(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  return '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
}
function glow(x, y, r, col, a = 1) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, r)); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
}
function poly(pts, fill, line = 0, stroke = INK) {
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (line) { ctx.lineWidth = line; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function ellipse(x, y, rx, ry, fill, line = 0, rot = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, 7);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (line) { ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke(); }
}
function bigText(txt, x, y, size, fill, opts = {}) {
  ctx.save(); ctx.font = `${opts.weight || 900} ${size}px ${opts.font || 'Impact, "Arial Black", sans-serif'}`;
  ctx.textAlign = opts.align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (opts.glow) { ctx.shadowColor = opts.glow; ctx.shadowBlur = size * 0.5; }
  if (opts.stroke !== false) { ctx.lineWidth = size * (opts.sw || 0.16); ctx.strokeStyle = opts.stroke || INK; ctx.strokeText(txt, x, y); }
  ctx.shadowBlur = 0; ctx.fillStyle = fill; ctx.fillText(txt, x, y); ctx.restore();
}

// ----- the moving camera over a real-size pitch (metres). X across, Z down the pitch, Y up -----
let CAM = { x: 0, z: -30, h: 1.6, f: 900, hz: 760, roll: 0 };
function proj(X, Z, Y = 0) {
  const d = Math.max(0.3, Z - CAM.z), k = CAM.f / d;
  return [W / 2 + (X - CAM.x) * k, CAM.hz + (CAM.h - Y) * k, k];
}

// ----- palettes -----
const KAITO = { name: 'KAITO', num: 7, shirt: '#d8261c', shirt2: '#ff7a1a', shorts: '#f4f0ea', socks: '#d8261c', boots: '#ffcf33',
  skin: '#e9b58d', hair: '#2a1410', hairTip: '#ff5a1a', eye: '#ffb02a', style: 'spike', build: 1.0, aura: 'fire' };
const REN = { name: 'REN', num: 10, shirt: '#2d7fe0', shirt2: '#9fd8ff', shorts: '#13254a', socks: '#2d7fe0', boots: '#e9f6ff',
  skin: '#f0c49c', hair: '#1a2340', hairTip: '#5ab8ff', eye: '#3fb8ff', style: 'swept', build: 0.92, aura: 'water' };
const BARRY = { name: 'BUNCE', num: 5, shirt: '#2a2a33', shirt2: '#55556a', shorts: '#1a1a22', socks: '#2a2a33', boots: '#111111',
  skin: '#f1c6a8', hair: '#c9a46a', hairTip: '#e4c78f', eye: '#5a7a9a', style: 'neat', build: 1.22, aura: null };
const DEF = { shirt: '#f2f2f2', shirt2: '#c9c9d6', shorts: '#2b2b38', socks: '#f2f2f2', boots: '#222', skin: '#c98d62', hair: '#151018', hairTip: '#151018', eye: '#3a2a20', style: 'crop', build: 1.05 };
const DEF2 = Object.assign({}, DEF, { skin: '#f0c49c', hair: '#6a4a2a', hairTip: '#6a4a2a' });
const KEEP = { shirt: '#27c46a', shirt2: '#9ff0b8', shorts: '#14301f', socks: '#27c46a', boots: '#222', skin: '#e0a882', hair: '#2a1a10', hairTip: '#2a1a10', eye: '#3a2a20', style: 'crop', build: 1.1, gloves: '#ffe14a' };
