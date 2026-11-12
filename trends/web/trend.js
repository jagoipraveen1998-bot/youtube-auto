// Tamil world-trend Short: one painted cartoon per line, moving camera, pop stickers, word-by-word Tamil captions.
const P = window.PLAN, W = 1080, H = 1920, FPS = 30;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const IMG = [];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = t => t * t * (3 - 2 * t);
const back = t => { const c = 1.70158; t -= 1; return 1 + (c + 1) * t * t * t + c * t * t; };
const FONT = '"Noto Sans Tamil", "Noto Sans", "DejaVu Sans", sans-serif';
const ACC = ['#ffd23f', '#3ee0c3', '#ff6b9a', '#7cc4ff'];

function text(s, x, y, size, fill, stroke = '#0b0a14', align = 'center', weight = 900) {
  ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (stroke) { ctx.lineWidth = size * 0.2; ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill; ctx.fillText(s, x, y);
}
function pill(x, y, w, h, fill) { ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fillStyle = fill; ctx.fill(); }

function photo(i, f, sh) {                         // the line's painting, with its own camera move
  const im = IMG[i]; const t = (f - sh.a) / Math.max(1, sh.b - sh.a);
  ctx.fillStyle = '#141428'; ctx.fillRect(0, 0, W, H);
  if (!im) return;
  const k0 = Math.max(W / im.width, H / im.height);
  const moves = [[1.0, 1.14, 0, 0], [1.16, 1.02, -40, 30], [1.05, 1.18, 60, -40], [1.12, 1.0, 0, 60]];
  const [z0, z1, dx, dy] = moves[i % moves.length];
  const punch = 1 + 0.06 * Math.max(0, 1 - (f - sh.a) / 6);  // a little zoom punch on each cut
  const z = k0 * (z0 + (z1 - z0) * ease(t)) * punch, w = im.width * z, h = im.height * z;
  ctx.drawImage(im, W / 2 - w / 2 + dx * (t - 0.5), H / 2 - h / 2 + dy * (t - 0.5), w, h);
  const g = ctx.createLinearGradient(0, H * 0.55, 0, H);  // dark at the bottom so captions read
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.55, W, H * 0.45);
  const g2 = ctx.createLinearGradient(0, 0, 0, 300); g2.addColorStop(0, 'rgba(0,0,0,0.55)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, 300);
}

function sticker(s, f, sh, i) {                    // pops in with a bounce, wobbles, tilted
  if (!s) return;
  const at = sh.a + 6, p = clamp((f - at) / 10); if (p <= 0) return;
  const k = back(p), col = ACC[i % ACC.length];
  ctx.save(); ctx.translate(W / 2, 470); ctx.rotate((i % 2 ? 0.05 : -0.05) + Math.sin(f * 0.15) * 0.015); ctx.scale(k, k);
  ctx.font = `900 92px ${FONT}`; const w = Math.min(980, ctx.measureText(s).width + 100);
  ctx.fillStyle = '#0b0a14'; ctx.beginPath(); ctx.roundRect(-w / 2 + 10, -66 + 12, w, 132, 30); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-w / 2, -66, w, 132, 30); ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = '#0b0a14'; ctx.stroke();
  const fit = Math.min(1, (w - 70) / ctx.measureText(s).width);
  ctx.scale(fit, fit); text(s, 0, 4, 92, '#0b0a14', null);
  ctx.restore();
}

function captions(f, sh) {                          // 2-4 words at a time, the spoken word in yellow
  const words = sh.words; if (!words.length) return;
  const t = (f - sh.a) / FPS;
  let cur = words.findIndex(w => t < w[1]); if (cur < 0) cur = words.length - 1;
  const start = Math.floor(cur / 3) * 3, chunk = words.slice(start, start + 3);
  ctx.font = `900 92px ${FONT}`;
  const widths = chunk.map(w => ctx.measureText(w[2]).width), gap = 28;
  let total = widths.reduce((a, b) => a + b, 0) + gap * (chunk.length - 1);
  const fit = Math.min(1, 960 / total);
  ctx.save(); ctx.translate(W / 2, 1450); ctx.scale(fit, fit);
  let x = -total / 2;
  chunk.forEach((w, j) => {
    const on = start + j === cur, pop = on ? 1 + 0.08 * Math.max(0, 1 - (t - w[0]) * 6) : 1;
    ctx.save(); ctx.translate(x + widths[j] / 2, 0); ctx.scale(pop, pop);
    text(w[2], 0, 0, 92, on ? '#ffd23f' : '#ffffff'); ctx.restore();
    x += widths[j] + gap;
  });
  ctx.restore();
}

function header(f) {
  pill(40, 60, 420, 84, '#e8453c');
  text('🌍 உலக TREND', 250, 104, 46, '#ffffff', null);
  const p = clamp(f / P.frames);
  pill(40, 168, 1000, 14, 'rgba(255,255,255,0.25)'); pill(40, 168, 1000 * p, 14, '#ffd23f');
}

function outro(f) {                                 // follow card over the last painting
  const t = clamp((f - P.end) / 12);
  ctx.fillStyle = `rgba(10,8,24,${0.78 * t})`; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, 900); const k = back(t); ctx.scale(k, k);
  text(P.channel || '', 0, -170, 86, '#ffd23f');
  pill(-330, -50, 660, 140, '#e8453c'); text('FOLLOW பண்ணுங்க!', 0, 20, 64, '#ffffff', null);
  text('daily world trends, Chennai style 🔥', 0, 200, 54, '#ffffff');
  ctx.restore();
}

window.renderFrame = function (f) {
  const sh = P.shots.find(s => f >= s.a && f < s.b) || P.shots[P.shots.length - 1];
  const i = P.shots.indexOf(sh);
  photo(i, f, sh);
  header(f);
  sticker(sh.sticker, f, sh, i);
  captions(f, sh);
  if (f - sh.a < 3 && i > 0) { ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - (f - sh.a) / 3)})`; ctx.fillRect(0, 0, W, H); }
  if (f >= P.end) outro(f);
};
(function () {
  let left = P.images.length;
  if (!left) { window.ready = true; return; }
  P.images.forEach((src, i) => { const im = new Image(); im.onload = im.onerror = () => { IMG[i] = im.width ? im : null; if (--left === 0) document.fonts.ready.then(() => { window.ready = true; }); }; im.src = src; });
})();
