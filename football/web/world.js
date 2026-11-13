// ===== stadium, pitch, crowd, goal, and the fire / water / anime effects =====
// pre-drawn crowd strip (big, so the camera can slide across it)
const CROWD = document.createElement('canvas'); CROWD.width = 3000; CROWD.height = 700;
(function makeCrowd() {
  const g = CROWD.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 700); grad.addColorStop(0, '#0b0c22'); grad.addColorStop(1, '#1d1a38'); g.fillStyle = grad; g.fillRect(0, 0, 3000, 700);
  for (let row = 0; row < 22; row++) {
    const y = 20 + row * 31, sz = 9 + row * 0.55;
    for (let i = 0; i < 260; i++) {
      const x = i * 11.6 + (row % 2) * 6 + rnd(row * 999 + i) * 4, side = x < 1500;
      const pal = side ? ['#d8261c', '#ff7a1a', '#ffcf33', '#f4f0ea', '#b81c14'] : ['#2d7fe0', '#9fd8ff', '#13254a', '#f4f0ea', '#1d5fb8'];
      g.fillStyle = pal[Math.floor(rnd(row * 31 + i * 7) * 5)]; g.fillRect(x, y + 6, sz * 0.9, sz * 1.4);
      g.fillStyle = ['#e9b58d', '#c98d62', '#8a5a3a', '#f0c49c'][Math.floor(rnd(i * 13 + row) * 4)]; g.beginPath(); g.arc(x + sz * 0.45, y + 2, sz * 0.42, 0, 7); g.fill();
    }
  }
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = '900 70px Impact, sans-serif'; g.textAlign = 'center';
  g.save(); g.fillStyle = '#d8261c'; g.fillRect(380, 420, 520, 110); g.fillStyle = '#fff'; g.fillText('KAITO 7', 640, 500); g.restore();
  g.save(); g.fillStyle = '#2d7fe0'; g.fillRect(2100, 420, 520, 110); g.fillStyle = '#fff'; g.fillText('REN 10', 2360, 500); g.restore();
})();

function sky(t, tint = null) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05061a'); g.addColorStop(0.5, '#121a44'); g.addColorStop(1, '#0a0c22');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.5 * rnd(i)})`; ctx.fillRect(rnd(i + 3) * W, rnd(i + 7) * 500, 2, 2); }
}
// floodlights: towers and beams of haze
function floodlights(t, a = 1) {
  for (const [x, y] of [[90, 210], [990, 210]]) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {
      const g = ctx.createLinearGradient(x, y, W / 2, 1200); g.addColorStop(0, `rgba(255,250,230,${0.16 * a})`); g.addColorStop(1, 'rgba(255,250,230,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x + 30, y); ctx.lineTo(W / 2 + (x < W / 2 ? 300 : -300) + k * 120 - 120, 1500); ctx.lineTo(W / 2 + (x < W / 2 ? -100 : 100) + k * 120 - 120, 1500); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { ellipse(x - 45 + c * 30, y - 30 + r * 30, 12, 12, '#fffbe8'); }
    glow(x, y, 260 * a, 'rgba(255,248,220,0.9)', 0.8);
  }
}
// the stands behind the far end, sliding with the camera; t drives the bouncing and phone flashes
function stands(t, topY, botY, offset = 0, jump = 0) {
  const h = botY - topY; if (h < 4) return;
  const sx = ((offset % 1500) + 1500) % 1500;
  ctx.drawImage(CROWD, sx + 300, 0, 1080 * (1500 / 1080) * 0.72 + 400, 700, -40, topY + Math.sin(t * 9) * jump, W + 80, h);
  for (let i = 0; i < 40; i++) {                                   // camera flashes
    const ph = (t * 1.7 + rnd(i) * 10) % 1; if (ph < 0.06) glow(rnd(i * 3) * W, topY + rnd(i * 5) * h, 26, 'rgba(255,255,255,1)', 1 - ph / 0.06);
  }
  ctx.fillStyle = 'rgba(5,6,20,0.25)'; ctx.fillRect(0, topY, W, h);
  ctx.fillStyle = '#22223a'; ctx.fillRect(0, botY - 14, W, 14);       // advertising board
  const adg = ctx.createLinearGradient(0, 0, W, 0); adg.addColorStop(0, '#ff5a1a'); adg.addColorStop(0.5, '#ffe14a'); adg.addColorStop(1, '#2d7fe0');
  ctx.fillStyle = adg; ctx.globalAlpha = 0.85; ctx.fillRect(0, botY - 10, W, 6); ctx.globalAlpha = 1;
}
// the pitch in perspective: mowing stripes, lines, centre circle, boxes
function pitch(t) {
  const far = 140;
  const [, hy] = proj(0, CAM.z + far);
  ctx.fillStyle = '#1f7a35'; ctx.fillRect(0, hy, W, H - hy);
  for (let z = -60; z < 70; z += 5.5) {
    if (z + 5.5 < CAM.z + 0.4) continue;
    const z0 = Math.max(z, CAM.z + 0.4), z1 = z + 5.5;
    const a = proj(-45, z0), b = proj(45, z0), c = proj(45, z1), d = proj(-45, z1);
    poly([[a[0], a[1]], [b[0], b[1]], [c[0], c[1]], [d[0], d[1]]], Math.round((z + 60) / 5.5) % 2 ? '#2a9443' : '#238a3c');
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.88)'; ctx.lineCap = 'round';
  const line = (pts) => { ctx.beginPath(); let started = false; for (const [X, Z] of pts) { if (Z < CAM.z + 0.5) { started = false; continue; } const [x, y, k] = proj(X, Z); ctx.lineWidth = Math.max(1.5, 0.12 * k); if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y); } ctx.stroke(); };
  const sample = (f, n = 40) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
  line([[-34, -52.5], [-34, 52.5]]); line([[34, -52.5], [34, 52.5]]); line([[-34, 0], [34, 0]]);
  line(sample(k => [-34 + 68 * k, 0])); line(sample(k => [-34 + 68 * k, 52.5]));
  line(sample(k => [Math.cos(k * 6.2832) * 9.15, Math.sin(k * 6.2832) * 9.15], 64));
  line([[-20.15, 52.5], [-20.15, 36], [20.15, 36], [20.15, 52.5]]); line([[-9.16, 52.5], [-9.16, 47], [9.16, 47], [9.16, 52.5]]);
  line([[-20.15, -52.5], [-20.15, -36], [20.15, -36], [20.15, -52.5]]);
  const [cx, cy, ck] = proj(0, 0); if (0 > CAM.z + 0.5) ellipse(cx, cy, 0.3 * ck, 0.3 * ck * (CAM.h / Math.max(0.5, -CAM.z)) + 1, '#fff');
}
// the goal at Z = 52.5; hit (0..1) makes the net bulge where the ball lands
function goal(t, hit = 0, hx = 0, hy = 1.2) {
  const Z = 52.5, D = 2.2;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i <= 18; i++) {
    const X = -3.66 + i * 7.32 / 18;
    ctx.beginPath();
    for (let j = 0; j <= 10; j++) {
      const Y = j * 2.44 / 10, dd = Math.exp(-((X - hx) ** 2 + (Y - hy) ** 2) / 1.6) * hit * 1.6;
      const [x, y, k] = proj(X, Z + D + dd, Y); ctx.lineWidth = Math.max(1, 0.04 * k); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  for (let j = 0; j <= 10; j++) {
    const Y = j * 2.44 / 10; ctx.beginPath();
    for (let i = 0; i <= 18; i++) { const X = -3.66 + i * 7.32 / 18, dd = Math.exp(-((X - hx) ** 2 + (Y - hy) ** 2) / 1.6) * hit * 1.6; const [x, y] = proj(X, Z + D + dd, Y); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
  }
  const post = (X1, Y1, X2, Y2) => { const [a, b, k] = proj(X1, Z, Y1), [c, d] = proj(X2, Z, Y2); ctx.lineCap = 'round'; ctx.lineWidth = 0.16 * k + 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); ctx.lineWidth = 0.16 * k; ctx.strokeStyle = '#ffffff'; ctx.stroke(); };
  post(-3.66, 0, -3.66, 2.44); post(3.66, 0, 3.66, 2.44); post(-3.66, 2.44, 3.66, 2.44);
}
// draw a player standing on the pitch at world (X, Z)
function onPitch(o, X, Z, Y = 0) {
  if (Z < CAM.z + 0.8) return null;
  const [x, y, k] = proj(X, Z, Y); o.x = x; o.y = y; o.h = 1.8 * k; player(o); return o;
}
function ballAt(X, Z, Y, spin, trail) { if (Z < CAM.z + 0.5) return; const [x, y, k] = proj(X, Z, Y + 0.11); ball(x, y, Math.max(3, 0.11 * k), spin, trail); }

// ---------- effects ----------
function fire(x, y, w, h, t, a = 1, n = 60) {      // licking flames rising from (x, y)
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
  for (let i = 0; i < n; i++) {
    const life = (t * (1.1 + rnd(i) * 0.9) + rnd(i * 7)) % 1, px = x + (rnd(i * 3) - 0.5) * w + Math.sin(t * 6 + i) * w * 0.05;
    const py = y - life * h, r = (1 - life) * w * (0.12 + rnd(i * 5) * 0.12);
    const g = ctx.createRadialGradient(px, py, 0, px, py, Math.max(1, r));
    g.addColorStop(0, 'rgba(255,240,180,0.95)'); g.addColorStop(0.35, 'rgba(255,130,30,0.75)'); g.addColorStop(1, 'rgba(200,20,10,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, Math.max(1, r), 0, 7); ctx.fill();
  }
  ctx.restore();
}
function water(x, y, w, h, t, a = 1, n = 9) {     // swirling ribbons of water and droplets
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const ph = t * (1.4 + rnd(i) * 0.8) + i * 0.7;
    ctx.strokeStyle = i % 2 ? 'rgba(120,210,255,0.55)' : 'rgba(220,245,255,0.45)'; ctx.lineWidth = 6 + rnd(i * 2) * 12;
    ctx.beginPath();
    for (let k = 0; k <= 24; k++) { const q = k / 24, ang = ph + q * 3.5; const px = x + Math.cos(ang) * w * (0.35 + 0.15 * rnd(i)), py = y - q * h + Math.sin(ang) * w * 0.12; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
  }
  for (let i = 0; i < 26; i++) { const life = (t * 0.8 + rnd(i * 9)) % 1; ellipse(x + (rnd(i * 4) - 0.5) * w * 1.1, y - life * h * 1.1, 5 * (1 - life) + 2, 7 * (1 - life) + 2, 'rgba(190,235,255,0.8)'); }
  ctx.restore();
}
function speedLines(t, cx, cy, col = 'rgba(255,255,255,0.6)', n = 70, inner = 260) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = rnd(i * 13 + Math.floor(t * 20)) * 6.283, r0 = inner + rnd(i * 7 + Math.floor(t * 20)) * 300;
    ctx.lineWidth = 2 + rnd(i) * 6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * 2000, cy + Math.sin(a) * 2000); ctx.stroke();
  }
  ctx.restore();
}
function hLines(t, col = 'rgba(255,255,255,0.5)', dir = 1) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'round';
  for (let i = 0; i < 40; i++) { const y = rnd(i * 5) * H, x = ((rnd(i * 3) * W * 2 - t * 3000 * dir) % (W * 2) + W * 2) % (W * 2) - W * 0.5, l = 120 + rnd(i) * 400; ctx.lineWidth = 2 + rnd(i * 9) * 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y); ctx.stroke(); }
  ctx.restore();
}
function impactFrame(cx, cy, col = '#fff') {       // the anime hit: inverted flash, radial spikes
  ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.save(); ctx.fillStyle = col;
  for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283 + rnd(i) * 0.2, l = 900 + rnd(i * 2) * 700; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a - 0.03) * l, cy + Math.sin(a - 0.03) * l); ctx.lineTo(cx + Math.cos(a + 0.03) * l, cy + Math.sin(a + 0.03) * l); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function tint(col, a, mode = 'soft-light') { ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); }
function vignette(a = 0.55) { const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function letterbox(a) { if (a <= 0) return; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 150 * a); ctx.fillRect(0, H - 150 * a, W, 150 * a); }
function grain(t) { ctx.save(); ctx.globalAlpha = 0.05; for (let i = 0; i < 120; i++) { ctx.fillStyle = rnd(i + Math.floor(t * 30) * 0.37) > 0.5 ? '#fff' : '#000'; ctx.fillRect(rnd(i * 2 + t) * W, rnd(i * 3 + t) * H, 3, 3); } ctx.restore(); }
function shakeCam(t, amt) { ctx.translate(Math.sin(t * 61) * amt, Math.cos(t * 47) * amt); }
