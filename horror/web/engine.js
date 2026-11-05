// ---------- core ----------
const FORMAT = ((window.PLAN || {}).format) || 'vertical';
const W = FORMAT === 'landscape' ? 1920 : 1080, H = FORMAT === 'landscape' ? 1080 : 1920;
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
let ctx = cv.getContext('2d');
const MAIN = ctx;
const INK = '#22112a';
let F = 0;       // current frame
let CZ = 1;      // current camera zoom (keeps ink width constant on screen)

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (f, a, b) => clamp((f - a) / (b - a));
const ss = t => t * t * t * (t * (t * 6 - 15) + 10);
const eo = t => 1 - Math.pow(1 - t, 3);
const ei = t => t * t * t;
const back = t => { const c = 2.2; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const spring = t => 1 - Math.exp(-6 * t) * Math.cos(11 * t);
function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function noise1(x) { const i = Math.floor(x), fr = x - i; const a = rnd(i), b = rnd(i + 1); const u = fr * fr * (3 - 2 * fr); return a + (b - a) * u; }

function rr(x, y, w, h, r) { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; }
function ell(x, y, rx, ry, rot = 0) { const p = new Path2D(); p.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); return p; }
function poly(pts) { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); return p; }
function L(px) { return px / CZ; }
function sf(p, fill, lwPx = 6.5) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
  if (lwPx) { ctx.lineWidth = L(lwPx); ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(p); }
}
function fillR(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function line(x1, y1, x2, y2, c = INK, px = 6.5) { ctx.strokeStyle = c; ctx.lineWidth = L(px); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }

// ---------- camera ----------
function keys(K, f) {
  const P = k => ({ x: k[1], y: k[2], z: k[3], r: k[4] || 0 });
  if (f <= K[0][0]) return P(K[0]);
  for (let i = 0; i < K.length - 1; i++) {
    const a = K[i], b = K[i + 1];
    if (f <= b[0]) {
      const e = (b[5] || ss)(seg(f, a[0], b[0]));
      return { x: lerp(a[1], b[1], e), y: lerp(a[2], b[2], e), z: lerp(a[3], b[3], e), r: lerp(a[4] || 0, b[4] || 0, e) };
    }
  }
  return P(K[K.length - 1]);
}
function creep(c, t, amt = 1) {
  c.x += (noise1(t * 0.031) - 0.5) * 16 * amt / c.z;
  c.y += (noise1(t * 0.027 + 50) - 0.5) * 16 * amt / c.z;
  c.z *= 1 + t * 0.0007 * amt;
  c.r += (noise1(t * 0.02 + 9) - 0.5) * 0.7 * amt;
  return c;
}
function kick(c, f, f0, amp = 16, dur = 7) {
  const t = f - f0;
  if (t >= 0 && t < dur) { const k = 1 - t / dur; const s = t % 2 ? 1 : -1; c.x += s * amp * k / c.z; c.y -= s * amp * 0.6 * k / c.z; c.r += s * 1.4 * k; }
  return c;
}
function camT(c, cam) {
  c.translate(W / 2, H / 2); c.rotate((cam.r || 0) * Math.PI / 180); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
}
function withCam(cam, fn) { CZ = cam.z; ctx.save(); camT(ctx, cam); fn(); ctx.restore(); }

// ---------- lighting (multiply light map) ----------
const LM = document.createElement('canvas'); LM.width = W / 2; LM.height = H / 2; const lctx = LM.getContext('2d');
function lightPass(cam, ambient, lightsFn) {
  lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalCompositeOperation = 'source-over'; lctx.globalAlpha = 1;
  lctx.fillStyle = ambient; lctx.fillRect(0, 0, W / 2, H / 2);
  lctx.setTransform(0.5, 0, 0, 0.5, 0, 0); camT(lctx, cam);
  lctx.globalCompositeOperation = 'lighter'; lightsFn(lctx);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(LM, 0, 0, W, H); ctx.restore();
}
function light(c, x, y, r, col, a = 1) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.globalAlpha = 1;
}
function glowAdd(cam, x, y, r, col, a) { // emissive bloom after lighting
  withCam(cam, () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, x, y, r, col, a); ctx.restore(); });
}

// ---------- characters (bean-head cards) ----------
let SKIN = '#c98d62';
let HAIR = '#1d1420';
const OUT = {
  pj: { top: '#3d4f8f', stripe: '#7086c6', pants: '#34437a' },
  shirt: { top: '#9cc4e8', pants: '#4a4a5c', collar: true },
  hoodie: { top: '#8a2f3a', pants: '#2f3346', hood: true },
  tee: { top: '#d8a23a', pants: '#3a4a6a' },
  nightie: { top: '#b98bc9', stripe: '#d6b4e2', pants: '#b98bc9' },
  shadow: { top: '#0b0710', pants: '#0b0710' },
  ghost: { top: '#cfd9e6', pants: '#b7c3d3' },
  cardigan: { top: '#8a6a44', stripe: '#9c7b52', pants: '#4a4038', collar: true },
  dress: { top: '#e7a3b8', pants: '#e7a3b8', lace: true },
  suit: { top: '#24222e', pants: '#1c1a24', collar: true },
  uniform: { top: '#7a5a34', pants: '#5a4430', badge: true },
  apron: { top: '#5f8a6a', pants: '#3e3a48', apron: true },
};
// villain designs: palette + accessories, merged over the per-story look
const KINDS = {
  doll: { skin: '#f6ede6', hair: '#e8c46a', hairStyle: 'curly', outfit: 'dress', acc: { bow: '#d24a6a', cheeks: true, cracks: true }, eyeCol: '#141018', pupil: 0.1 },
  neighbour: { skin: '#e3b48e', hair: '#c9c4bd', hairStyle: 'bald', outfit: 'cardigan', acc: { glasses: true, mustache: true } },
  tall: { skin: '#e9e6ef', hair: '#151320', hairStyle: 'mop', outfit: 'suit', stretch: true, eyeCol: '#ffffff', pupil: 0.1 },
  delivery: { skin: '#d9a07a', hair: '#2a1d16', hairStyle: 'spiky', outfit: 'uniform', acc: { cap: '#7a5a34' } },
};
function guy(o) {
  const s = o.s;
  const _skin = SKIN, _hair = HAIR;
  if (KINDS[o.kind]) { const k = KINDS[o.kind]; o = Object.assign({}, o, k, { acc: Object.assign({}, o.acc || {}, k.acc || {}) }); }
  if (o.kind === 'shadow') { SKIN = '#0b0710'; HAIR = '#05030a'; o = Object.assign({}, o, { outfit: 'shadow', eyeCol: '#ffffff', pupil: 0.1, mouth: o.mouth === 'grin' ? 'grin' : 'none', acc: {} }); }
  else if (o.kind === 'ghost') { SKIN = '#dfe8f2'; HAIR = o.hair || '#9aa6b8'; o = Object.assign({}, o, { outfit: 'ghost', eyeCol: '#1a1424', pupil: 0.1 }); }
  else { if (o.skin) SKIN = o.skin; if (o.hair) HAIR = o.hair; }
  if (o.talk && ['flat', 'smile', 'wobble', 'droop', 'none', undefined].includes(o.mouth) && o.kind !== 'shadow') {
    const open = noise1(F * 0.9 + (o.seed || 0) * 7) ;
    if (open > 0.45) { o = Object.assign({}, o, { mouth: 'o', mo: 0.35 + 0.5 * (open - 0.45) * 2 }); }
  }
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha = clamp(o.alpha);
  const tr = o.tremble ? (rnd(F * 7.31 + o.x) - 0.5) * o.tremble : 0;
  ctx.translate(o.x + tr, o.y);
  ctx.scale(s * (o.flip ? -1 : 1), s);
  ctx.rotate(o.lean || 0);
  if (o.stretch) ctx.scale(0.84, 1.3);
  const br = 1 + 0.012 * Math.sin(F * 0.13 + (o.seed || 0)) + (o.sq || 0);
  ctx.scale(1 / Math.sqrt(br), br);
  const out = Object.assign({}, OUT[o.outfit || 'pj'] || OUT.pj, o.top ? { top: o.top } : {}, o.stripe ? { stripe: o.stripe } : {});
  const lw = 6.5 / s;
  const SF = (p, fill) => { ctx.fillStyle = fill; ctx.fill(p); ctx.lineWidth = L(lw); ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke(p); };
  if (!o.noLegs) {
    const ph = o.walk || 0;
    for (const sd of [-1, 1]) {
      const pp = ph + (sd > 0 ? Math.PI : 0);
      const lift = Math.max(0, Math.sin(pp)) * 45 * (o.walkAmt ?? (o.walk ? 1 : 0));
      const lx = sd * 62 + Math.cos(pp) * 34 * (o.walkAmt ?? (o.walk ? 1 : 0));
      SF(rr(lx - 46, -215 - lift, 92, 205, 40), out.pants);
      SF(ell(lx + sd * 12, -14 - lift, 74, 32), '#2c2232');
    }
  }
  const arms = () => {
    for (const sd of [-1, 1]) {
      const a = (sd < 0 ? o.armL : o.armR) ?? 0.22;
      const sx = sd * 150, sy = -455;
      const hx = sx + sd * Math.sin(a) * 245, hy = sy + Math.cos(a) * 245;
      ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 76 + 2 * L(lw);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.strokeStyle = out.top; ctx.lineWidth = 76; ctx.stroke();
      SF(ell(hx, hy, 42, 42), SKIN);
      if (sd > 0 && o.holdR) o.holdR(hx, hy);
      if (sd < 0 && o.holdL) o.holdL(hx, hy);
    }
  };
  const front = o.armsFront || (o.armL || 0) > 1.2 || (o.armR || 0) > 1.2;
  if (!front) arms();
  SF(rr(-42, -560, 84, 70, 20), SKIN); // neck
  const tp = rr(-152, -515, 304, 340, 110);
  SF(tp, out.top);
  if (out.stripe) {
    ctx.save(); ctx.clip(tp); ctx.strokeStyle = out.stripe; ctx.lineWidth = 18;
    for (let x = -150; x <= 150; x += 58) { ctx.beginPath(); ctx.moveTo(x, -520); ctx.lineTo(x, -170); ctx.stroke(); }
    ctx.restore(); ctx.lineWidth = L(lw); ctx.strokeStyle = INK; ctx.stroke(tp);
  }
  if (out.collar && (o.turn ?? 1) > 0.5) {
    SF(poly([[-70, -515], [0, -450], [-10, -520]]), '#e8f2fb');
    SF(poly([[70, -515], [0, -450], [10, -520]]), '#e8f2fb');
    ctx.fillStyle = INK; for (let y = -420; y < -200; y += 60) { ctx.beginPath(); ctx.arc(0, y, 9, 0, 7); ctx.fill(); }
  }
  if (out.collar && (o.turn ?? 1) <= 0.5) SF(rr(-80, -530, 160, 40, 16), '#e8f2fb');
  if (out.lace && (o.turn ?? 1) > 0.5) { SF(rr(-120, -520, 240, 50, 25), '#fbf3f6'); for (let x = -100; x <= 100; x += 40) SF(ell(x, -180, 22, 16), '#fbf3f6'); }
  if (out.badge && (o.turn ?? 1) > 0.5) SF(rr(50, -440, 60, 44, 8), '#e9d8a8');
  if (out.apron && (o.turn ?? 1) > 0.5) SF(rr(-110, -420, 220, 250, 30), '#f1ece2');
  if (out.hood) SF(ell(0, -700, 250, 210), out.top);
  if (o.acc && o.acc.ponytail && (o.turn ?? 1) < 0.6) SF(ell(0, -560, 70, 150), HAIR);
  head(o, lw, SF);
  if (front) arms();
  if (o.sweat) {
    const t = (F * 0.06) % 1;
    ctx.save(); ctx.translate(250, -900 + t * 140); ctx.globalAlpha = 1 - t * 0.6;
    const p = new Path2D(); p.moveTo(0, -40); p.quadraticCurveTo(26, 0, 0, 20); p.quadraticCurveTo(-26, 0, 0, -40);
    SF(p, '#bfe6ff'); ctx.restore();
  }
  ctx.restore();
  if (o.kind === 'shadow' && (o.turn ?? 1) > 0.4) { // glowing eyes on top
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const hy = o.y - (775 - (o.bob || 0)) * s;
    for (const sd of [-1, 1]) light(ctx, o.x + sd * 84 * s, hy + 6 * s, 90 * s, o.glow || '#ff3b3b', 0.55);
    ctx.restore();
  }
  SKIN = _skin; HAIR = _hair;
}
function bobPath(fy) {
  const p = new Path2D();
  p.moveTo(-250, 170);
  p.bezierCurveTo(-280, -60, -250, -250, 0, -268);
  p.bezierCurveTo(250, -250, 280, -60, 250, 170);
  p.lineTo(170, 170); p.bezierCurveTo(190, 40, 170, -40, 150, Math.min(fy + 40, 140));
  p.bezierCurveTo(60, fy + 10, -60, fy + 10, -150, Math.min(fy + 40, 140));
  p.bezierCurveTo(-170, -40, -190, 40, -170, 170);
  p.closePath();
  return p;
}
function hairPath(fy, spike) {
  const p = new Path2D();
  p.moveTo(-224, fy + 25);
  p.bezierCurveTo(-246, -110, -215, -205, -150, -240);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const x0 = -150 + i * 50, x1 = x0 + 50, mx = (x0 + x1) / 2;
    const topY = -250 - (i === 2 || i === 3 ? 12 : 0);
    p.lineTo(mx + (i % 2 ? 6 : -6), topY - 34 - spike * (0.7 + 0.3 * (i % 2)));
    p.lineTo(x1, topY + (i === n - 1 ? 10 : 0));
  }
  p.bezierCurveTo(215, -205, 246, -110, 224, fy + 25);
  p.bezierCurveTo(160, fy - 35, 110, fy + 25, 50, fy - 15);
  p.bezierCurveTo(10, fy + 30, -50, fy - 30, -100, fy + 12);
  p.bezierCurveTo(-150, fy - 25, -190, fy + 20, -224, fy + 25);
  return p;
}
function head(o, lw, SF) {
  const t = o.turn ?? 1;
  ctx.save();
  ctx.translate(0, -775 + (o.bob || 0));
  ctx.rotate(o.tilt || 0);
  if (t > 0.3) for (const sd of [-1, 1]) SF(ell(sd * 207 - (1 - t) * 120, 12, 38, 54), SKIN);
  if (t <= 0.3) for (const sd of [-1, 1]) SF(ell(sd * 207, 12, 38, 54), SKIN);
  const hp = ell(0, 0, 216, 248);
  SF(hp, SKIN);
  ctx.save(); ctx.clip(hp);
  if (t > 0.2) { ctx.translate((1 - t) * 330, 0); face(o, lw, SF); }
  ctx.restore();
  ctx.lineWidth = L(lw); ctx.strokeStyle = INK; ctx.stroke(hp);
  const fy = lerp(150, -118, ss(clamp((t - 0.15) / 0.7)));
  const st = o.hairStyle || 'spiky', acc = o.acc || {};
  if (st === 'braids') for (const sd of [-1, 1]) { SF(ell(sd * 215, 150, 46, 120), HAIR); SF(ell(sd * 215, 290, 30, 22), acc.tie || '#d24a6a'); }
  if (st === 'ponytail' && t > 0.5) SF(ell(205, -160, 60, 130, -0.5), HAIR);
  if (st === 'bob') SF(bobPath(fy), HAIR);
  else if (st === 'curly') SF(curlyPath(fy), HAIR);
  else if (st === 'mop') SF(mopPath(fy), HAIR);
  else if (st === 'bald') { if (t > 0.3) for (const sd of [-1, 1]) SF(ell(sd * 200, -60, 40, 70), HAIR); }
  else if (st === 'ponytail' || st === 'braids') SF(slickPath(fy), HAIR);
  else SF(hairPath(fy, (o.hairUp || 0) * 80), HAIR);
  if (acc.bow && t > 0.3) { SF(ell(-150, -210, 60, 36, -0.4), acc.bow); SF(ell(-60, -235, 60, 36, 0.4), acc.bow); SF(ell(-105, -222, 22, 22), acc.bow); }
  if (acc.cap && t > 0.3) { SF(rr(-225, -275, 450, 130, [120, 120, 10, 10]), acc.cap); SF(rr(-40, -160, 300, 34, 17), acc.cap); }
  ctx.restore();
}
function curlyPath(fy) {
  const p = new Path2D(); const n = 11;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI, x = Math.cos(a) * 235, y = Math.sin(a) * 255 + 20;
    i ? p.quadraticCurveTo(Math.cos(a - 0.15) * 300, Math.sin(a - 0.15) * 310 + 20, x, y) : p.moveTo(x, Math.max(y, fy + 120));
  }
  p.lineTo(235, fy + 120);
  for (let x = 235; x >= -235; x -= 47) p.quadraticCurveTo(x - 23, fy + 60, x - 47, fy + 100);
  p.closePath(); return p;
}
function mopPath(fy) {
  const p = new Path2D();
  p.moveTo(-235, 60); p.bezierCurveTo(-260, -230, -120, -275, 0, -272); p.bezierCurveTo(120, -275, 260, -230, 235, 60);
  for (let x = 235; x >= -235; x -= 39) p.lineTo(x - 19, Math.max(fy - 20, -140) + ((x / 39) % 2 ? 30 : 0));
  p.closePath(); return p;
}
function slickPath(fy) {
  const p = new Path2D();
  p.moveTo(-228, 40); p.bezierCurveTo(-250, -200, -110, -268, 0, -268); p.bezierCurveTo(110, -268, 250, -200, 228, 40);
  p.bezierCurveTo(180, fy - 20, 60, fy - 40, 0, fy - 10); p.bezierCurveTo(-60, fy - 40, -180, fy - 20, -228, 40);
  p.closePath(); return p;
}
function face(o, lw, SF) {
  const ew = o.eyeW || 1, lk = o.look || 0, lkY = o.lookY || 0;
  for (const sd of [-1, 1]) {
    const ex = sd * 84, ey = 6;
    if (o.circles) {
      ctx.save(); ctx.globalAlpha = clamp(o.circles); ctx.strokeStyle = '#5b2e66'; ctx.lineCap = 'round';
      ctx.lineWidth = 16; ctx.beginPath(); ctx.ellipse(ex, ey + 34, 54 * ew, 42, 0, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke();
      ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(ex, ey + 58, 46, 34, 0, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
      ctx.restore();
    }
    const ep = ell(ex, ey, 48 * ew, 60 * ew);
    ctx.fillStyle = o.eyeCol || '#fbf7ef'; ctx.fill(ep);
    ctx.save(); ctx.clip(ep);
    const pr = o.pupil || 22;
    const jx = o.pupilShake ? (rnd(F * 3.1 + sd) - 0.5) * o.pupilShake : 0;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + lk * 24 + jx, ey + 8 + lkY * 22, pr, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + lk * 24 + jx - pr * 0.35, ey + 8 + lkY * 22 - pr * 0.4, pr * 0.28, 0, 7); ctx.fill();
    const lid = Math.max(o.lid || 0, o.blink || 0);
    if (lid > 0.01) {
      const top = ey - 62 * ew, ly = top + lid * 124 * ew;
      ctx.fillStyle = SKIN; ctx.fillRect(ex - 60 * ew, top - 5, 120 * ew, ly - top + 5);
      ctx.strokeStyle = INK; ctx.lineWidth = L(lw); ctx.beginPath(); ctx.moveTo(ex - 52 * ew, ly); ctx.quadraticCurveTo(ex, ly + 10, ex + 52 * ew, ly); ctx.stroke();
    }
    ctx.restore();
    ctx.lineWidth = L(lw); ctx.strokeStyle = INK; ctx.stroke(ep);
    // brows
    const b = o.brow || 'flat';
    let y1 = -84, y2 = -84;
    if (b === 'worry') { y1 = -108; y2 = -74; } else if (b === 'up') { y1 = -122; y2 = -116; }
    else if (b === 'sly') { y1 = -70; y2 = -100; } else if (b === 'tired') { y1 = -90; y2 = -58; }
    ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.moveTo(sd * 40, y1 - (ew - 1) * 60); ctx.lineTo(sd * 124, y2 - (ew - 1) * 60); ctx.stroke();
  }
  const acc = o.acc || {};
  if (acc.cheeks) for (const sd of [-1, 1]) { ctx.fillStyle = 'rgba(232,96,120,0.55)'; ctx.beginPath(); ctx.ellipse(sd * 120, 100, 44, 28, 0, 0, 7); ctx.fill(); }
  if (acc.freckles) { ctx.fillStyle = 'rgba(120,60,30,0.55)'; for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(sd * (70 + (i % 3) * 24), 82 + Math.floor(i / 3) * 20 + (i % 2) * 6, 6, 0, 7); ctx.fill(); } }
  if (acc.cracks) { ctx.strokeStyle = 'rgba(60,40,50,0.7)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(60, -240); ctx.lineTo(90, -150); ctx.lineTo(70, -110); ctx.lineTo(110, -40); ctx.moveTo(90, -150); ctx.lineTo(130, -130); ctx.stroke(); }
  if (acc.glasses) {
    ctx.strokeStyle = INK; ctx.lineWidth = 12;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 84, 6, 70, 66, 0, 0, 7); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -12, 14, 0); ctx.stroke();
  }
  ctx.lineWidth = L(lw); ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.arc(0, 66, 16, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  if (acc.beard) SF((() => { const p = new Path2D(); p.moveTo(-200, 40); p.bezierCurveTo(-190, 230, -80, 260, 0, 262); p.bezierCurveTo(80, 260, 190, 230, 200, 40); p.bezierCurveTo(140, 140, 60, 110, 0, 112); p.bezierCurveTo(-60, 110, -140, 140, -200, 40); return p; })(), HAIR);
  if (acc.mustache) SF((() => { const p = new Path2D(); p.moveTo(-95, 120); p.quadraticCurveTo(-50, 80, 0, 104); p.quadraticCurveTo(50, 80, 95, 120); p.quadraticCurveTo(50, 112, 0, 118); p.quadraticCurveTo(-50, 112, -95, 120); return p; })(), HAIR);
  const m = o.mouth || 'flat', my = 142;
  const MOUTH = '#3a1830';
  if (m === 'none') { }
  else if (m === 'flat') { line(-40, my, 40, my, INK, lw * CZ / CZ); }
  else if (m === 'o') { const k = o.mo || 1; SF(ell(0, my + 8, 26 * k, 34 * k), MOUTH); }
  else if (m === 'wobble') {
    ctx.beginPath(); ctx.moveTo(-55, my); for (let i = 1; i <= 6; i++) ctx.lineTo(-55 + i * 18.3, my + (i % 2 ? -10 : 8)); ctx.stroke();
  } else if (m === 'grin') {
    const g = clamp(o.grin ?? 1), w = 50 + 110 * g;
    const p = new Path2D(); p.moveTo(-w, my - 20 * g); p.quadraticCurveTo(0, my + 5, w, my - 20 * g);
    p.quadraticCurveTo(0, my + 20 + 120 * g, -w, my - 20 * g);
    ctx.fillStyle = MOUTH; ctx.fill(p);
    ctx.save(); ctx.clip(p); ctx.fillStyle = '#f7f3e6'; ctx.fillRect(-w, my - 30, 2 * w, 18 + 30 * g);
    ctx.strokeStyle = '#b9ad98'; ctx.lineWidth = 4; for (let x = -w; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, my - 30); ctx.lineTo(x, my - 12 + 30 * g); ctx.stroke(); }
    ctx.restore(); ctx.lineWidth = L(lw); ctx.strokeStyle = INK; ctx.stroke(p);
  } else if (m === 'droop') { ctx.beginPath(); ctx.moveTo(-48, my + 18); ctx.quadraticCurveTo(0, my - 14, 48, my + 18); ctx.stroke(); }
  else if (m === 'smile') { ctx.beginPath(); ctx.moveTo(-48, my - 6); ctx.quadraticCurveTo(0, my + 30, 48, my - 6); ctx.stroke(); }
}

// ---------- effects ----------
function rings(x, y, f, f0, f1, col = '#ffe9a8', every = 10, maxR = 260, side = 0) {
  if (f < f0 || f > f1 + 30) return;
  ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'round';
  for (let k = f0; k <= f1; k += every) {
    const t = (f - k) / 28; if (t < 0 || t > 1) continue;
    ctx.globalAlpha = (1 - t) * 0.9; ctx.lineWidth = L(10) * (1 - t * 0.5);
    ctx.beginPath(); ctx.arc(x, y, 40 + t * maxR, side - 0.55, side + 0.55); ctx.stroke();
  }
  ctx.restore();
}
function steam(x, y, f, h = 180, a = 0.55, wsc = 1) {
  ctx.save(); ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const ph = f * 0.08 + k * 2.1;
    ctx.strokeStyle = `rgba(255,255,255,${a * (0.6 + 0.4 * Math.sin(ph))})`; ctx.lineWidth = 12 * wsc;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) { const t = i / 12; const xx = x + (k - 1) * 22 * wsc + Math.sin(t * 6 + ph) * 16 * wsc * t; const yy = y - t * h - ((f * 1.5 + k * 20) % 20); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
  }
  ctx.restore();
}
function sparkle(x, y, r, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fffbe0';
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
  ctx.restore();
}

// ---------- post ----------
const GR = []; for (let i = 0; i < 6; i++) { const c = document.createElement('canvas'); c.width = 360; c.height = 640; const g = c.getContext('2d'); const d = g.createImageData(360, 640); for (let j = 0; j < d.data.length; j += 4) { const v = Math.random() * 255; d.data[j] = d.data[j + 1] = d.data[j + 2] = v; d.data[j + 3] = 255; } g.putImageData(d, 0, 0); GR.push(c); }
const T1 = document.createElement('canvas'); T1.width = W; T1.height = H; const t1 = T1.getContext('2d');
function grain(a = 0.07) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = a; ctx.drawImage(GR[F % GR.length], 0, 0, W, H); ctx.restore(); }
function vignette(a = 0.65, inner = 0.35) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createRadialGradient(W / 2, H / 2, H * inner * 0.5, W / 2, H / 2, H * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(5,0,12,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function grade(sat = 1.0, con = 1.05, bri = 1.0) {
  t1.filter = `saturate(${sat}) contrast(${con}) brightness(${bri})`; t1.clearRect(0, 0, W, H); t1.drawImage(cv, 0, 0); t1.filter = 'none';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(T1, 0, 0); ctx.restore();
}
function flash(a, col = '#fff') { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); }
function staticNoise(a) {
  if (a <= 0) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = clamp(a);
  ctx.drawImage(GR[(F * 7) % GR.length], (F % 3) * -40, 0, W + 120, H);
  ctx.restore();
}
function glitch(amt) {
  if (amt <= 0) return;
  t1.clearRect(0, 0, W, H); t1.drawImage(cv, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const n = 10;
  for (let i = 0; i < n; i++) {
    const y = Math.floor(rnd(F * 13 + i) * H), h = 20 + rnd(F * 7 + i) * 140;
    const dx = (rnd(F * 3 + i * 5) - 0.5) * 160 * amt;
    ctx.drawImage(T1, 0, y, W, h, dx, y, W, h);
  }
  ctx.restore();
}
function cctv(f) {
  t1.filter = 'grayscale(1) contrast(1.3) brightness(1.08) blur(1.3px)'; t1.clearRect(0, 0, W, H); t1.drawImage(cv, 0, 0); t1.filter = 'none';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(T1, 0, 0);
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#a6ecb6'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let y = (f * 2) % 6; y < H; y += 6) ctx.fillRect(0, y, W, 2);
  const by = ((f * 11) % (H + 400)) - 200; const g = ctx.createLinearGradient(0, by - 90, 0, by + 90);
  g.addColorStop(0, 'rgba(200,255,210,0)'); g.addColorStop(0.5, 'rgba(200,255,210,0.08)'); g.addColorStop(1, 'rgba(200,255,210,0)');
  ctx.fillStyle = g; ctx.fillRect(0, by - 90, W, 180);
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.22; ctx.drawImage(GR[(F * 5) % GR.length], 0, 0, W, H);
  ctx.restore();
  vignette(0.85, 0.2);
}
