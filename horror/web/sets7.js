// ---------- movie-grade drawn sets: real opening doors, curtains that breathe, lit rooms ----------
// Scene "drawn" with sh.set = school | backrooms | home | bednight | call | cassette | street (+ sh.v variant)

// ---- shared props ----
function hatch(x0, y0, w, h, col, step = 46, ang = 0.0) {        // fine texture lines (wood grain, wallpaper)
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip(); ctx.strokeStyle = col; ctx.lineWidth = 4;
  for (let x = x0 - h; x < x0 + w + h; x += step) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + h * ang, y0 + h); ctx.stroke(); }
  ctx.restore();
}
function wallpaper(x0, y0, w, h, base, motif, f) {
  fillR(x0, y0, w, h, base);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip(); ctx.fillStyle = motif;
  for (let y = y0 + 40; y < y0 + h; y += 120) for (let x = x0 + ((y / 120) % 2) * 60; x < x0 + w; x += 120) {
    ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x + 16, y); ctx.lineTo(x, y + 22); ctx.lineTo(x - 16, y); ctx.fill();
  }
  ctx.restore();
}
function floorBoards(y0, base, line, f) {
  fillR(-300, y0, W + 600, H - y0 + 300, base);
  ctx.strokeStyle = line; ctx.lineWidth = 5;
  for (let x = -600; x < W + 600; x += 150) { ctx.beginPath(); ctx.moveTo(540 + (x - 540) * 0.45, y0); ctx.lineTo(x, H + 100); ctx.stroke(); }
  for (let k = 1; k < 6; k++) { const y = y0 + (H - y0) * Math.pow(k / 6, 1.6); line2(-300, y, W + 300, y, line, 3); }
}
function line2(a, b, c, d, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
function skirting(y, col) { fillR(-300, y - 34, W + 600, 34, col); line2(-300, y - 34, W + 300, y - 34, INK, 6); line2(-300, y, W + 300, y, INK, 6); }

// a real door: frame with depth, panels, knob; swings open on its left hinge toward us (p 0..1)
function door3d(x, y, w, h, p, o = {}) {
  const col = o.col || '#8a5a3a', dark = shade(col, -0.35);
  sf(rr(x - 34, y - 34, w + 68, h + 34, 6), o.frame || shade(col, -0.15), 8);       // architrave
  fillR(x - 8, y - 8, w + 16, h + 8, '#1a1016');                                     // the jamb's shadow
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  fillR(x, y, w, h, o.beyond || '#07060b');                                          // what is through the door
  if (o.inside) o.inside(x, y, w, h, p);
  ctx.restore();
  if (p > 0.01 && o.spill) {                                                         // its light falls across the floor toward us
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.22 * Math.min(1, p * 1.6);
    const g = ctx.createLinearGradient(0, y + h, 0, y + h + 520); g.addColorStop(0, o.spill); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + w * (1 - Math.min(1, p * 1.2)) * 0.1, y + h); ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w * 1.9, y + h + 520); ctx.lineTo(x - w * 0.2, y + h + 520); ctx.fill(); ctx.restore();
  }
  const ang = p * Math.PI * 0.5 * 0.92, dw = w * Math.cos(ang), bulge = w * Math.sin(ang) * 0.13;
  const panel = poly([[x, y], [x + dw, y - bulge], [x + dw, y + h + bulge], [x, y + h]]);
  sf(panel, p > 0.55 ? dark : col, 8);
  if (dw > 30) {
    const k = dw / w;
    ctx.save(); ctx.clip(panel);
    const g = ctx.createLinearGradient(x, 0, x + dw, 0); g.addColorStop(0, 'rgba(255,255,255,0.08)'); g.addColorStop(1, `rgba(0,0,0,${0.12 + 0.4 * p})`);
    ctx.fillStyle = g; ctx.fillRect(x, y - bulge, dw, h + 2 * bulge);
    hatch(x, y - bulge, dw, h + 2 * bulge, 'rgba(0,0,0,0.08)', 22, 0.02);
    for (const [py, ph] of [[0.07, 0.38], [0.52, 0.41]]) sf(rr(x + 0.14 * w * k, y + py * h, 0.72 * w * k, ph * h, 10), shade(col, -0.1), 6);
    ctx.restore();
    const kx = x + 0.86 * w * k, ky = y + 0.54 * h;
    sf(rr(kx - 12 * k - 6, ky - 46, 24 * k + 12, 92, 8), '#b9a272', 5);
    sf(ell(kx, ky, Math.max(8, 20 * k), 20), '#e3cf94', 5);
  }
}

// curtains: soft folds that sway from the bottom, shaded fold by fold (wind 0..1)
function curtains(x, y, w, h, f, wind, col, gap = 0.18) {
  sf(rr(x - 40, y - 26, w + 80, 22, 10), '#5a4130', 5);                                 // rod
  for (const sd of [-1, 1]) {
    const cw = w * (0.5 - gap / 2), cx = sd < 0 ? x : x + w - cw, n = 7, fw = cw / n;
    for (let i = 0; i < n; i++) {
      const fx = cx + i * fw, ph = f * 0.05 + i * 0.9 + sd;
      const sway = (yy) => Math.sin(ph + yy * 0.003) * 26 * wind * Math.pow(yy / h, 1.6) + sd * Math.sin(f * 0.02) * 10 * wind * (yy / h);
      const pts = [];
      for (let k = 0; k <= 10; k++) { const yy = h * k / 10; pts.push([fx + sway(yy), y + yy]); }
      for (let k = 10; k >= 0; k--) { const yy = h * k / 10; pts.push([fx + fw + sway(yy) + 2, y + yy]); }
      const p = poly(pts);
      const g = ctx.createLinearGradient(fx, 0, fx + fw, 0);
      g.addColorStop(0, shade(col, -0.32)); g.addColorStop(0.45, shade(col, 0.12)); g.addColorStop(1, shade(col, -0.22));
      ctx.fillStyle = g; ctx.fill(p);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3; ctx.stroke(p);
    }
    sf(rr(cx - 4, y - 32, 14, 14, 7), '#c9a86a', 3);
    line2(cx, y + h, cx + cw, y + h, INK, 6);
  }
}
function nightWindow(x, y, w, h, f, o = {}) {
  sf(rr(x - 24, y - 24, w + 48, h + 48, 10), o.frame || '#e6dccb', 8);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, o.day ? '#8fd3ff' : '#141d4a'); g.addColorStop(1, o.day ? '#ffe9b0' : '#3a2f6e');
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  if (!o.day) {
    for (let i = 0; i < 22; i++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.5 * rnd(i + Math.floor(f / 25))})`; ctx.beginPath(); ctx.arc(x + rnd(i) * w, y + rnd(i + 40) * h * 0.7, 3, 0, 7); ctx.fill(); }
    sf(ell(x + w * 0.7, y + h * 0.28, 52, 52), '#f4f1dc', 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, x + w * 0.7, y + h * 0.28, 200, '#c9d4ff', 0.35); ctx.restore();
  } else { sf(ell(x + w * 0.75, y + h * 0.25, 64, 64), '#fff3b0', 0); }
  const sw = Math.sin(f * 0.03) * 0.06;                                              // a branch moving outside
  ctx.save(); ctx.translate(x - 20, y + h * 0.75); ctx.rotate(-0.35 + sw); ctx.strokeStyle = o.day ? '#3a5a3a' : '#07060d'; ctx.lineCap = 'round';
  for (const [l, a, wd] of [[w * 0.9, 0, 18], [w * 0.35, -0.6, 9], [w * 0.3, 0.5, 8]]) { ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(l * 0.3 * (a ? 1 : 0), 0); ctx.lineTo(l * Math.cos(a), l * Math.sin(a)); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
  line2(x + w / 2, y, x + w / 2, y + h, o.frame || '#e6dccb', 16); line2(x, y + h / 2, x + w, y + h / 2, o.frame || '#e6dccb', 16);
  ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x + 30, y); ctx.lineTo(x + 110, y); ctx.lineTo(x + 20, y + h * 0.6); ctx.lineTo(x, y + h * 0.6); ctx.lineTo(x, y + 40); ctx.fill(); ctx.restore();
}
function lampGlow(x, y, col = '#ffd98a', a = 0.45, r = 520) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, x, y, r, col, a); ctx.restore(); }
function vignette7(a = 0.55) { const g = ctx.createRadialGradient(540, 960, 380, 540, 960, 1150); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600); }
const GRAN = { skin: '#c98d62', hair: '#d9d4cc', hairStyle: 'bun', outfit: 'cardigan', top: '#7a3a5a', stripe: '#8e4a6c', acc: { glasses: true }, seed: 8 };
const COP = { skin: '#a8663a', hair: '#1d1420', hairStyle: 'spiky', outfit: 'uniform', top: '#c9a86a', pants: '#8a6e44', acc: { cap: '#2a3a6a', mustache: true }, seed: 9 };
const FRIENDS = [
  { skin: '#e3b48e', hair: '#3a2416', hairStyle: 'mop', outfit: 'hoodie', top: '#3aa6a0', seed: 11 },
  { skin: '#a8663a', hair: '#1d1420', hairStyle: 'braids', outfit: 'tee', top: '#e85a7a', seed: 12 },
  { skin: '#c98d62', hair: '#2a1a1a', hairStyle: 'spiky', outfit: 'tee', top: '#f0b43a', seed: 13 },
];

Object.assign(STORY, {
  // ================= THE WALL AT SCHOOL (Backrooms) =================
  school(f, sh) {
    const v = sh.v || 'lean', p = sP(f, sh), bt = sh.beat ?? sh.a + 30;
    fillR(-300, -300, W + 600, H + 600, '#bfe3e0');
    fillR(-300, 1180, W + 600, 900, '#7fb7c2');                                       // painted lower wall
    line2(-300, 1180, W + 300, 1180, INK, 7);
    for (let i = 0; i < 4; i++) {                                                       // lockers, bright
      const x = 40 + i * 190, c = ['#ff7a59', '#ffb347', '#4cc3a0', '#6aa8ff'][i];
      sf(rr(x, 560, 170, 1000, 8), c, 8);
      for (let k = 0; k < 5; k++) line2(x + 40, 620 + k * 26, x + 130, 620 + k * 26, shade(c, -0.3), 6);
      sf(rr(x + 128, 1000, 18, 70, 6), '#e9e6ef', 4);
    }
    sf(rr(110, 200, 520, 300, 10), '#c98a4a', 8); sf(rr(130, 220, 480, 260, 6), '#e8c48a', 0);    // notice board
    [['#fff3b0', 160, 240], ['#ffc0cb', 330, 260], ['#c9f2ff', 470, 236]].forEach(([c, x, y]) => { sf(rr(x, y, 120, 150, 4), c, 4); sf(ell(x + 60, y + 8, 10, 10), '#e8453c', 3); });
    floorBoards(1560, '#d9c7a4', 'rgba(120,90,50,0.35)');
    const wx = 860, k = v === 'fall' ? ss(seg(f, bt - 8, bt + 26)) : 0;
    if (v === 'fall') {                                                                 // the wall turns to yellow and swallows him
      ctx.save(); ctx.globalAlpha = k; const g = ctx.createRadialGradient(wx, 1100, 20, wx, 1100, 520);
      g.addColorStop(0, '#f5e27a'); g.addColorStop(1, 'rgba(245,226,122,0)'); ctx.fillStyle = g; ctx.fillRect(wx - 600, 500, 1200, 1200); ctx.restore();
      for (let i = 0; i < 4; i++) { const r = ((f - bt) * 9 + i * 80) % 420; if (r > 0) { ctx.save(); ctx.globalAlpha = (1 - r / 420) * k; ctx.strokeStyle = '#e8c53a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(wx, 1100, r, r * 1.3, 0, 0, 7); ctx.stroke(); ctx.restore(); } }
    }
    const h = heroObj(sh, f, { x: wx - (v === 'fall' ? 140 * k : 0), y: 1880, s: 0.78, look: -0.7, lookY: 0 });
    if (h) {
      h.lean = v === 'fall' ? 0.25 + 0.9 * k : 0.22; h.armR = 0.4;
      if (v === 'fall') { h.alpha = 1 - k * 0.85; h.armL = 2.6 * k; h.armR = 2.4 * k; }
      guy(h);
    }
  },
  backrooms(f, sh) {
    const v = sh.v || 'room', p = sP(f, sh), bt = sh.beat ?? sh.a + 30;
    const flick = rnd(Math.floor(f / 4)) > 0.93 ? 0.75 : 1;
    const Y = '#e8d26a', Y2 = '#d6bd52', CARPET = '#b8a35a';
    if (v === 'note' || v === 'backpack') {                                             // inserts on the damp carpet
      fillR(-300, -300, W + 600, H + 600, CARPET); hatch(-300, -300, W + 600, H + 600, 'rgba(90,70,20,0.12)', 18, 0.3);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(110,85,30,0.25)'; ctx.beginPath(); ctx.ellipse(rnd(i) * W, rnd(i + 9) * H, 140, 80, rnd(i), 0, 7); ctx.fill(); }
      if (v === 'backpack') {
        ctx.save(); ctx.translate(540, 1000); ctx.rotate(-0.08);
        sf(rr(-260, -330, 520, 640, 120), '#3d6fb5', 10); sf(rr(-200, 40, 400, 230, 50), '#345f9c', 8);
        sf(rr(-150, -380, 300, 90, 45), 'rgba(0,0,0,0)', 14); line2(-240, -150, 240, -150, '#2a4a7a', 10);
        sf(rr(-110, -100, 220, 120, 12), '#f4efe4', 6); sTxt('YOU', 0, -38, 70, '#2a2440', false);
        ctx.fillStyle = 'rgba(200,190,160,0.55)'; for (let i = 0; i < 160; i++) { ctx.beginPath(); ctx.arc(-250 + rnd(i) * 500, -320 + rnd(i + 7) * 620, 4 + rnd(i + 3) * 6, 0, 7); ctx.fill(); }
        ctx.restore();
      } else {
        ctx.save(); ctx.translate(540, 960); ctx.rotate(0.05 + Math.sin(f * 0.03) * 0.01);
        sf(rr(-380, -480, 760, 960, 6), '#f6f0de', 8);
        for (let k = 0; k < 12; k++) line2(-340, -400 + k * 74, 340, -400 + k * 74, '#c9d8ef', 3);
        const txt = ["Don't follow", 'the', 'footsteps.'], shown = Math.floor(seg(f, sh.a + 6, sh.b - 20) * 30);
        let n = 0; txt.forEach((t, i) => { const s = t.slice(0, Math.max(0, shown - n)); n += t.length; ctx.font = 'italic 900 96px "DejaVu Serif", serif'; ctx.fillStyle = '#7a1a22'; ctx.textAlign = 'center'; ctx.fillText(s, 0, -170 + i * 150); });
        ctx.restore();
      }
      vignette7(0.5); return;
    }
    // the yellow rooms: one-point perspective, doorways inside doorways
    fillR(-300, -300, W + 600, H + 600, Y);
    const depth = v === 'endless' ? 6 : 3, drift = v === 'endless' ? (f - sh.a) * 0.004 : 0;
    // each room is seen through the doorway of the one before it
    const cx = 540, floorY = 1500;
    for (let i = 0; i <= depth; i++) {
      const kk = Math.pow(0.55, i + drift * 3), w = 1500 * kk, h = 1900 * kk;
      const x0 = cx - w / 2, y0 = floorY - h * 0.86 * (i === 0 ? 1.4 : 1) + (i ? 120 * (1 - kk) : 0);
      const fy = i === 0 ? floorY : y0 + h * 0.86;
      ctx.save();
      if (i > 0) { ctx.beginPath(); ctx.rect(x0, y0, w, fy - y0 + h * 0.14); ctx.clip(); }
      wallpaper(x0 - 300, y0 - 300, w + 600, fy - y0 + 300, i % 2 ? Y2 : Y, 'rgba(160,130,40,0.25)', f);
      ctx.fillStyle = shade(CARPET, -0.06 * i); ctx.fillRect(x0 - 300, fy, w + 600, h);
      for (let k = 0; k < 3; k++) {                                                    // ceiling fluorescent panels
        const lx = x0 + w * (0.2 + k * 0.3), ly = y0 + 30 * kk;
        sf(rr(lx - w * 0.07, ly, w * 0.14, 26 * kk + 6, 4), `rgba(255,255,235,${flick})`, Math.max(2, 6 * kk));
      }
      ctx.restore();
      if (i > 0) {                                                                     // the doorway's thick edge and its shadow
        ctx.strokeStyle = 'rgba(70,55,15,0.85)'; ctx.lineWidth = Math.max(4, 22 * kk * 1.8); ctx.strokeRect(x0, y0, w, fy - y0);
        ctx.fillStyle = `rgba(40,30,5,${0.12 + 0.08 * i})`; ctx.fillRect(x0, y0, w, fy - y0);
      }
      line2(x0 - (i ? 0 : 300), fy, x0 + w + (i ? 0 : 300), fy, 'rgba(60,45,10,0.6)', Math.max(2, 8 * kk));
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 * flick; ctx.fillStyle = '#fffbe0'; ctx.fillRect(-300, -300, W + 600, 700); ctx.restore();
    if (v === 'steps') {                                                                // something far behind walks exactly in step with him
      const ph = f * 0.33;
      guy({ x: 540, y: 1290, s: 0.3, kind: 'shadow', mouth: 'grin', walk: ph, walkAmt: 0.9, alpha: ss(seg(f, bt - 10, bt + 10)), stretch: true });
      const h = heroObj(sh, f, { x: 790, y: 1990, s: 0.84, look: 0, lookY: 0 }); if (h) { h.walk = ph; h.walkAmt = 0.9; h.sweat = true; guy(h); }
      for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(90,70,20,0.35)'; ctx.beginPath(); ctx.ellipse(500 + (k % 2) * 80, 1220 + k * 60, 20, 10, 0, 0, 7); ctx.fill(); }
    } else {
      const walking = v === 'endless' || v === 'walk';
      const h = heroObj(sh, f, { x: 540, y: 1900, s: v === 'endless' ? 0.55 : 0.8, look: Math.sin(f * 0.05) * 0.8, lookY: 0 });
      if (h) { if (walking) { h.walk = f * 0.3; h.walkAmt = 0.8; } guy(h); }
    }
    vignette7(0.4);
  },

  // ================= MUM IS HOME EARLY =================
  home(f, sh) {
    const v = sh.v || 'sofa', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt;
    if (v === 'shoes') {                                                                // the doormat: her shoes on the wrong feet
      fillR(-300, -300, W + 600, H + 600, '#a8794e'); hatch(-300, -300, W + 600, H + 600, 'rgba(70,40,20,0.2)', 40, 0);
      sf(rr(150, 760, 780, 520, 30), '#b5463c', 9); hatch(150, 760, 780, 520, 'rgba(0,0,0,0.12)', 16, 0.4); sTxt('WELCOME', 540, 1020, 90, '#f0d9a8', false);
      for (const [x, flip] of [[400, -1], [680, 1]]) {                                 // left shoe on the right, toes pointing apart
        ctx.save(); ctx.translate(x, 960); ctx.scale(flip, 1); ctx.rotate(0.25);
        sf(poly([[-60, -170], [60, -170], [90, 120], [40, 190], [-80, 170], [-90, 60]]), '#c94a6a', 8);
        sf(ell(20, 150, 70, 40), '#a83a58', 6); sf(rr(-40, -160, 80, 30, 10), '#e7c9a0', 4); ctx.restore();
      }
      const a = on ? ss(seg(f, bt, bt + 10)) : 0;
      if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#e8453c'; ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(540, 960, 330, 260, 0, 0, 7); ctx.stroke(); sTxt('L', 680, 700, 80, '#fff'); sTxt('R', 400, 700, 80, '#fff'); ctx.restore(); }
      vignette7(0.4); return;
    }
    // the hall: warm wallpaper, the front door on the left, the kitchen door on the right, a window with curtains
    wallpaper(-300, -300, W + 600, 1900, '#5f6fb0', 'rgba(255,255,255,0.08)', f);
    skirting(1580, '#e6dccb'); floorBoards(1580, '#8a5a3a', 'rgba(50,25,10,0.35)');
    nightWindow(420, 300, 280, 380, f, { day: true });
    curtains(400, 300, 320, 560, f, 0.35, '#e8a23a', 0.55);
    sf(rr(450, 1180, 220, 30, 8), '#6b472e', 6); line2(560, 1210, 560, 1580, '#6b472e', 16);   // console table
    sf(poly([[505, 1120], [615, 1120], [600, 1180], [520, 1180]]), '#f0c95a', 6); lampGlow(560, 1140, '#ffd98a', 0.3, 420);
    const front = v === 'door' ? ss(seg(f, sh.a + 6, sh.a + 34)) : 0;
    door3d(60, 640, 300, 940, front, { col: '#b5463c', spill: '#fff3c8', beyond: '#ffe9b0',
      inside: (x, y, w, h, pp) => { if (v === 'door') guy(Object.assign(fam('mum', { x: x + w / 2, y: y + h + 40, s: 0.62, look: 0.5 }), { kind: pp < 0.6 ? 'shadow' : undefined, alpha: Math.min(1, pp * 1.5) }, pp > 0.6 ? SMILE : {})); } });
    const kit = v === 'kitchen' ? 0.22 : v === 'calls' ? 0.3 : v === 'silent' ? lerp(0.3, 0.75, ss(seg(f, sh.a + 6, sh.b - 6))) : v === 'peek' ? 0.45 : v === 'tokitchen' ? 0.35 : 0.04;
    door3d(780, 640, 280, 940, kit, { col: '#e6dccb', spill: v === 'silent' || v === 'peek' ? '#8a90c4' : '#ffcf7a', beyond: v === 'silent' || v === 'peek' ? '#0b0a14' : '#ffcf7a',
      inside: (x, y, w, h) => { if (!['silent', 'peek'].includes(v)) { fillR(x, y + h * 0.55, w, h * 0.45, '#d9a55a'); sf(rr(x + w * 0.5, y + h * 0.35, w * 0.6, h * 0.2, 6), '#c9c2b0', 5); } } });
    if (v === 'kitchen' || v === 'calls') {                                            // humming drifts out as notes; her shadow on the wall
      for (let i = 0; i < 4; i++) { const t = ((f * 0.012 + i / 4) % 1); ctx.save(); ctx.globalAlpha = 1 - t; sTxt(i % 2 ? '♪' : '♫', 760 - t * 260, 900 - t * 260 + Math.sin(t * 9) * 30, 80, '#ffd23f'); ctx.restore(); }
      ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#1a0f24'; ctx.translate(700, 1560); ctx.scale(1, -0.3);
      ctx.beginPath(); ctx.ellipse(0, 0, 60, 30, 0, 0, 7); ctx.fill();
      if (v === 'calls') { ctx.lineWidth = 40; ctx.strokeStyle = '#1a0f24'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-300, 200, -620 - Math.sin(f * 0.15) * 40, 120); ctx.stroke(); }
      ctx.restore();
    }
    if (v === 'peek') {                                                                 // her face round the door frame: smiling far too wide
      const k = ss(seg(f, sh.a + 4, sh.a + 26));
      ctx.save(); ctx.beginPath(); ctx.rect(760, 0, 400, H); ctx.clip();
      const m = Object.assign(fam('mum', { x: lerp(1040, 900, k), y: 1700, s: 0.9, look: -1, noLegs: true }), { mouth: 'grin', grin: 1, brow: 'sly', eyeW: 1.15, pupil: 8, tilt: -0.25 });
      m.holdR = (hx, hy) => { sf(rr(hx - 30, hy - 60, 60, 110, 10), '#1c1f2e', 5); sf(rr(hx - 22, hy - 50, 44, 80, 6), '#7fe3ff', 0); };
      m.armR = 1.3; guy(m); ctx.restore();
    }
    if (v === 'tokitchen') { const m = fam('mum', Object.assign({ x: lerp(500, 900, ss(p)), y: 1900, s: 0.74, look: 1, walk: f * 0.3, walkAmt: 0.8 }, SMILE)); guy(m); }
    if (['sofa', 'door', 'kitchen', 'calls', 'silent', 'tokitchen'].includes(v)) {
      const h = heroObj(sh, f, { x: v === 'door' ? 760 : 420, y: 1960, s: 0.82, look: v === 'door' ? -0.9 : 0.8, lookY: 0 }); if (h) guy(h);
    }
    vignette7(0.35);
  },

  // ================= SOMEONE AT THE END OF THE BED =================
  bednight(f, sh) {
    const v = sh.v || 'awake', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt, day = v === 'morning';
    wallpaper(-300, -300, W + 600, 1500, day ? '#9ad0c2' : '#2c2f5a', day ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', f);
    nightWindow(330, 160, 420, 440, f, { day });
    curtains(300, 160, 480, 640, f, day ? 0.15 : 0.9, day ? '#f0a0b0' : '#6a3a8a', day ? 0.7 : 0.38);
    if (!day) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18; ctx.fillStyle = '#b9c4ff'; ctx.beginPath(); ctx.moveTo(330, 600); ctx.lineTo(750, 600); ctx.lineTo(980, 1700); ctx.lineTo(100, 1700); ctx.fill(); ctx.restore(); }
    fillR(-300, 1400, W + 600, 700, day ? '#c9a27a' : '#1f1a2e');
    // the bed, seen from its foot: headboard, pillow, him under the blanket up to his chin
    sf(rr(110, 700, 860, 420, 60), day ? '#a8794e' : '#4a3426', 9);
    sf(rr(240, 880, 600, 200, 80), day ? '#ffffff' : '#c9cbe0', 8);
    const h = heroObj(sh, f, { x: 540, y: 1520, s: 0.62, look: v === 'turn' || v === 'figure' ? 0 : Math.sin(f * 0.05) * 0.5, lookY: 0.4, noLegs: true });
    if (h) { if (!day) { h.tremble = v === 'awake' || v === 'figure' || v === 'turn' ? 3 : 0; h.sweat = !day; } guy(h); }
    const dip = v === 'sink' ? ss(seg(f, bt - 4, bt + 18)) : (['turn', 'figure', 'dent'].includes(v) ? 1 : 0);
    const blanket = new Path2D(); blanket.moveTo(60, 1180);
    blanket.bezierCurveTo(300, 1120, 780, 1120, 1020, 1180); blanket.lineTo(1080, 1900);
    blanket.lineTo(720, 1900 - 0 * dip); blanket.quadraticCurveTo(540, 1900 - 160 * dip, 360, 1900); blanket.lineTo(0, 1900); blanket.closePath();
    sf(blanket, day ? '#5fb8a0' : '#3d4f8f', 9);
    ctx.save(); ctx.clip(blanket); for (let x = 60; x < 1080; x += 120) line2(x, 1150, x + 40, 1900, day ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)', 10); ctx.restore();
    if (v === 'figure' || v === 'turn' || (v === 'sink' && on)) {                      // it sits at the foot of the bed, back to us
      const a = v === 'sink' ? ss(seg(f, bt, bt + 20)) : 1, tn = v === 'turn' ? ss(seg(f, sh.a + 10, sh.b - 6)) : 0;
      guy({ x: 560, y: 2250, s: 0.95, kind: 'shadow', turn: tn * 0.6, noLegs: true, alpha: a, mouth: tn > 0.5 ? 'grin' : 'flat', look: -tn });
      if (tn > 0.45) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, 470 - tn * 40, 1420, 70, '#fff2c0', tn); ctx.restore(); }
    }
    if (day) {                                                                          // the alarm, ringing and shaking
      const sx = Math.sin(f * 2.4) * 8;
      ctx.save(); ctx.translate(900 + sx, 980); sf(ell(0, 0, 80, 80), '#e8453c', 8); sf(ell(0, 0, 60, 60), '#fffbe8', 5);
      line2(0, 0, 0, -40, INK, 7); line2(0, 0, 28, 10, INK, 7); for (const sd of [-1, 1]) sf(ell(sd * 55, -70, 30, 26), '#e8453c', 6); ctx.restore();
      for (let i = 0; i < 3; i++) { const r = 100 + ((f * 6 + i * 40) % 120); ctx.save(); ctx.globalAlpha = 1 - (r - 100) / 120; ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(900, 980, r, -0.8, 0.8); ctx.stroke(); ctx.restore(); }
    }
    if (v === 'dent') { const a = ss(seg(f, sh.a + 8, sh.a + 26)); ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(540, 1700, 260, 90, 0, 0, 7); ctx.stroke(); ctx.restore(); }
    vignette7(day ? 0.2 : 0.55);
  },

  // ================= THE EXTRA FACE ON THE CALL =================
  call(f, sh) {
    const v = sh.v || 'four', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt;
    fillR(-300, -300, W + 600, H + 600, '#141626');
    sf(rr(40, 200, 1000, 1360, 40), '#262a3e', 8);                                     // the laptop screen
    sTxt('● LIVE  Late-night call', 540, 270, 44, '#ff6b6b', false);
    const five = ['fifth', 'mic', 'chat', 'reply', 'count', 'hand'].includes(v);
    const tiles = five ? [[70, 330], [550, 330], [70, 770], [550, 770], [310, 1210]] : [[70, 330], [550, 330], [70, 770], [550, 770]];
    tiles.forEach(([x, y], i) => {
      const w = 460, hh = 420, me = i === 3, ghost = i === 4;
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, hh, 24); ctx.clip();
      fillR(x, y, w, hh, ghost ? '#05050a' : ['#3a4a7a', '#5a3a6a', '#3a6a5a', '#4a4a6a'][i]);
      if (!ghost) {
        const o = me ? Object.assign({}, LOOK(HERO), { seed: 1 }) : FRIENDS[i];
        const laugh = (v === 'laugh' || v === 'four') && !me;
        const g = Object.assign({ x: x + w / 2, y: y + hh + 260, s: 0.42, noLegs: true, eyeW: 1, pupil: 19, brow: 'flat', mouth: 'flat', blink: blinkAt(f, o.seed || 1) }, o, laugh ? LAUGH : {});
        if (me && (v === 'count' || v === 'hand')) { g.turn = 0; }                     // his own tile shows the back of his head
        if (me && !['count', 'hand'].includes(v) && five) Object.assign(g, { brow: 'fear', eyeW: 1.2, pupil: 10, sweat: true });
        guy(g);
        if (me && v === 'hand') { const k = ss(seg(f, sh.a + 6, sh.b - 8)); ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 52; ctx.beginPath(); ctx.moveTo(x + w + 40, y + hh * 0.2); ctx.quadraticCurveTo(x + w * 0.9, y + hh * 0.5, x + w * (1 - 0.35 * k), y + hh * (0.62)); ctx.stroke(); ctx.strokeStyle = '#dfe8f2'; ctx.lineWidth = 40; ctx.stroke(); }
      } else {
        const a = v === 'fifth' ? back(clamp((f - bt) / 10)) : 1;
        ctx.globalAlpha = Math.max(0, a); sTxt('?', x + w / 2, y + hh / 2, 160, '#3a3d50', false);
        if (['mic', 'chat', 'reply', 'count', 'hand'].includes(v)) {                   // its microphone is on: something breathing
          ctx.strokeStyle = '#3ccf72'; ctx.lineWidth = 8; ctx.beginPath();
          for (let k = 0; k < 18; k++) { const a2 = 10 + 40 * Math.abs(Math.sin(f * 0.12 + k * 0.6)) * (0.5 + 0.5 * Math.sin(f * 0.05)); ctx.moveTo(x + 90 + k * 16, y + hh - 70 - a2); ctx.lineTo(x + 90 + k * 16, y + hh - 70 + a2); }
          ctx.stroke();
        }
      }
      ctx.restore();
      ctx.lineWidth = 8; ctx.strokeStyle = ghost && ['mic', 'chat', 'reply'].includes(v) ? '#3ccf72' : INK; ctx.beginPath(); ctx.roundRect(x, y, w, hh, 24); ctx.stroke();
      sf(rr(x + 14, y + hh - 54, ghost ? 160 : 140, 40, 12), 'rgba(0,0,0,0.55)', 0);
      sTxt(ghost ? '(no name)' : me ? 'You' : ['Kavya', 'Rahul', 'Sam'][i], x + 84, y + hh - 34, 28, '#ffffff', false);
      if (v === 'count' && !ghost) { const a = seg(f, sh.a + 6 + i * 8, sh.a + 12 + i * 8); if (a > 0) { ctx.save(); ctx.globalAlpha = a; sTxt(String(i + 1), x + w - 50, y + 60, 80, '#ffd23f'); ctx.restore(); } }
    });
    if (v === 'chat' || v === 'reply') {                                              // the chat panel
      sf(rr(120, 1560 - 360, 840, 330, 24), '#f4efe4', 8);
      sTxt('You: Who added this?', 160, 1260, 46, '#2a2440', false, 'left');
      if (v === 'reply') { const a = ss(seg(f, sh.a + 10, sh.a + 24)); ctx.save(); ctx.globalAlpha = a; sTxt('Kavya: Added who?', 160, 1350, 46, '#b5463c', false, 'left'); sTxt("It's just the three of us.", 160, 1430, 46, '#b5463c', false, 'left'); ctx.restore(); }
    }
    if (v === 'fifth' && on && f < bt + 10) { ctx.save(); ctx.globalAlpha = 1 - (f - bt) / 10; ctx.fillStyle = '#fff'; ctx.fillRect(310, 1210, 460, 420); ctx.restore(); }
    lampGlow(540, 900, '#9fb4ff', 0.18, 900);
  },

  // ================= THE CASSETTE WITH MY NAME =================
  cassette(f, sh) {
    const v = sh.v || 'cupboard', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt;
    if (v === 'tape' || v === 'whisper') {                                              // the tape: spinning reels, your name on the label
      fillR(-300, -300, W + 600, H + 600, v === 'whisper' ? '#1a1220' : '#6b472e');
      hatch(-300, -300, W + 600, H + 600, 'rgba(0,0,0,0.15)', 30, 0.05);
      ctx.save(); ctx.translate(540, 960); ctx.rotate(-0.06);
      sf(rr(-420, -270, 840, 540, 30), '#2a2d3e', 10); sf(rr(-360, -230, 720, 230, 14), '#f4e2a8', 6);
      ctx.font = 'italic 900 70px "DejaVu Serif", serif'; ctx.fillStyle = '#2a4aa0'; ctx.textAlign = 'center'; ctx.fillText('for YOU ♥', 0, -110);
      for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 190, 120); ctx.rotate(f * (v === 'whisper' ? 0.04 : 0.15)); sf(ell(0, 0, 90, 90), '#e9e6ef', 6); for (let k = 0; k < 6; k++) { ctx.rotate(Math.PI / 3); sf(rr(-10, 20, 20, 50, 6), '#2a2d3e', 0); } sf(ell(0, 0, 24, 24), '#2a2d3e', 4); ctx.restore(); }
      ctx.restore();
      if (v === 'whisper') { const a = ss(seg(f, sh.a + 10, sh.a + 30)); ctx.save(); ctx.globalAlpha = a; sTxt('"don\'t let her see this"', 540, 1420, 64, '#ff8a8a'); ctx.restore(); }
      vignette7(0.5); return;
    }
    if (v === 'kid') {                                                                   // the little voice on the tape: you, at five
      fillR(-300, -300, W + 600, H + 600, '#2a1d3a');
      ctx.save(); ctx.translate(540, 900); ctx.rotate(-0.04);
      sf(rr(-360, -440, 720, 860, 12), '#f4efe4', 8);
      ctx.save(); ctx.beginPath(); ctx.rect(-320, -400, 640, 640); ctx.clip(); fillR(-320, -400, 640, 640, '#9ad0c2');
      guy(Object.assign({}, LOOK(HERO), { x: 0, y: 560, s: 0.62, seed: 1, eyeW: 1.08, pupil: 21, brow: 'happy', mouth: 'smile', squint: 0.25, talk: true, mouthOpen: 0.5 + 0.5 * Math.sin(f * 0.8), outfit: 'tee', top: '#f0b43a' }));
      ctx.restore(); sTxt('age 5', 0, 330, 56, '#2a2440', false); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.5 + 0.2 * Math.sin(f * 0.2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; for (let y = 0; y < H; y += 6) { ctx.globalAlpha = 0.04; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } ctx.restore();
      return;
    }
    // grandma's room: wardrobe, a radio on the dresser, the door behind you
    wallpaper(-300, -300, W + 600, 1600, '#7a4a5a', 'rgba(255,230,200,0.08)', f);
    skirting(1600, '#4a3426'); floorBoards(1600, '#6b472e', 'rgba(30,15,5,0.35)');
    const wo = v === 'cupboard' ? ss(seg(f, sh.a + 4, sh.a + 26)) : 0.85;
    door3d(80, 520, 300, 1080, wo, { col: '#8a5a3a', beyond: '#2a1d16', inside: (x, y, w, h) => { [['#5f8a6a', 30], ['#b5463c', 120], ['#c9a86a', 200]].forEach(([c, dx]) => sf(poly([[x + dx, y + 160], [x + dx + 70, y + 160], [x + dx + 80, y + 620], [x + dx - 10, y + 620]]), c, 5)); sf(rr(x + 40, y + h - 180, 160, 100, 8), '#2a2d3e', 5); } });
    sf(rr(560, 1180, 440, 420, 12), '#8a5a3a', 8); sf(rr(600, 1060, 360, 130, 20), '#c9a86a', 8);      // dresser + radio
    for (const sd of [-1, 1]) sf(ell(780 + sd * 100, 1125, 44, 44), '#2a2d3e', 5);
    line2(700, 1060, 760, 980, INK, 8);
    if (v === 'radio' || v === 'play') lampGlow(780, 1120, '#ffcf7a', 0.35, 320);
    const gOpen = v === 'grandma' ? ss(seg(f, sh.a + 4, sh.a + 30)) : 0;
    door3d(640, 340, 300, 660, gOpen, { col: '#b5a48a', beyond: '#f2c27a', spill: '#ffcf7a',
      inside: (x, y, w, h, pp) => { if (pp > 0.05) { const gm = Object.assign(fam('mum', { x: x + w / 2, y: y + h + 60, s: 0.5, look: -0.6 }), GRAN, SMILE, { eyeCol: '#141018', pupil: 6, squint: 0.1 }); guy(gm); } } });
    const h = heroObj(sh, f, { x: 400, y: 1960, s: 0.85, look: v === 'grandma' ? 0.9 : -0.6, lookY: 0 }); if (h) guy(h);
    vignette7(0.45);
  },

  // ================= MISSING: YOU =================
  street(f, sh) {
    const v = sh.v || 'walk', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt;
    if (v === 'poster') {                                                                // the poster, close: your face
      fillR(-300, -300, W + 600, H + 600, '#7a8a9a'); sf(rr(330, -300, 420, H + 600, 10), '#5a6474', 8);
      ctx.save(); ctx.translate(540, 940); ctx.rotate(0.03);
      sf(rr(-400, -560, 800, 1120, 8), '#f6f0de', 8); sTxt('MISSING', 0, -450, 140, '#c8323a', false);
      ctx.save(); ctx.beginPath(); ctx.rect(-300, -360, 600, 560); ctx.clip(); fillR(-300, -360, 600, 560, '#bfc4cc');
      guy(Object.assign({}, LOOK(HERO), { x: 0, y: 470, s: 0.5, seed: 1, eyeW: 1, pupil: 19, brow: 'flat', mouth: 'flat', outfit: 'shirt' })); ctx.restore();
      sTxt('SINCE LAST NIGHT', 0, 300, 64, '#2a2440', false); sTxt('If seen, call:', 0, 400, 48, '#2a2440', false);
      ctx.restore(); vignette7(0.35); return;
    }
    // a bright morning street: sky, houses, a lamppost with the poster
    const g = ctx.createLinearGradient(0, 0, 0, 1200); g.addColorStop(0, '#7fd0ff'); g.addColorStop(1, '#ffe9b0'); ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, 1600);
    [['#f2a65a', -80], ['#5fb8a0', 300], ['#e8737a', 680]].forEach(([c, x]) => { sf(rr(x, 620, 360, 700, 8), c, 8); sf(poly([[x - 20, 640], [x + 180, 440], [x + 380, 640]]), shade(c, -0.3), 8); sf(rr(x + 60, 760, 100, 120, 6), '#c9ecff', 6); sf(rr(x + 200, 760, 100, 120, 6), '#c9ecff', 6); });
    fillR(-300, 1300, W + 600, 300, '#9aa3b4'); fillR(-300, 1560, W + 600, 600, '#4a5068'); for (let x = -200; x < W + 200; x += 240) fillR(x + ((f * 0) % 240), 1740, 120, 16, '#e9e6ef');
    line2(860, 520, 860, 1560, '#3a3d50', 26); sf(rr(800, 480, 120, 60, 20), '#3a3d50', 6); lampGlow(860, 560, '#fff3c8', 0.15, 200);
    sf(rr(790, 900, 140, 190, 4), '#f6f0de', 5); sTxt('MISSING', 860, 930, 30, '#c8323a', false); sf(rr(815, 950, 90, 90, 2), '#bfc4cc', 3);
    if (v === 'police') {                                                               // the police car rolls up, lights going
      const k = ss(seg(f, sh.a, sh.a + 40)), cx = lerp(-500, 330, k);
      sf(rr(cx - 330, 1440, 660, 200, 50), '#f4f4f8', 9); sf(rr(cx - 200, 1340, 400, 130, 40), '#f4f4f8', 9); sf(rr(cx - 170, 1360, 340, 90, 20), '#7fb7e8', 6);
      fillR(cx - 330, 1530, 660, 40, '#2a4aa0'); sTxt('POLICE', cx, 1550, 44, '#ffffff', false);
      for (const sd of [-1, 1]) sf(ell(cx + sd * 210, 1640, 70, 70), '#1c1f2e', 8);
      const blink = Math.floor(f / 6) % 2;
      sf(rr(cx - 80, 1310, 70, 36, 10), blink ? '#ff3b3b' : '#7a1a1a', 5); sf(rr(cx + 10, 1310, 70, 36, 10), blink ? '#3a5aff' : '#1a2a7a', 5);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, cx + (blink ? -45 : 45), 1328, 380, blink ? '#ff3b3b' : '#3a5aff', 0.45); ctx.restore();
      if (k > 0.95) { const c = Object.assign({}, COP, { x: cx + 60, y: 1560, s: 0.5, noLegs: true, look: 1, eyeW: 1, pupil: 19, brow: 'raise', mouth: 'flat', talk: true, mouthOpen: 0.4 + 0.4 * Math.sin(f * 0.7) }); guy(c); }
    }
    const h = heroObj(sh, f, { x: v === 'walk' ? lerp(200, 640, ss(p)) : v === 'police' ? 850 : 640, y: 1960, s: 0.86, look: v === 'police' ? -0.9 : 0.6, lookY: 0 });
    if (h) { if (v === 'walk') { h.walk = f * 0.3; h.walkAmt = 0.8; h.outfit = 'shirt'; } guy(h); }
    vignette7(0.25);
  },
});

// light and depth for drawn sets: the cast is lit by each room's own lamp/window (cine.js)
const SET_LIGHT = {
  school: { lx: 0.2, ly: 0.2, key: '#fff6e0', shade: '40,70,80', lum: 0.8 },
  backrooms: { lx: 0.5, ly: 0.05, key: '#fffbe0', shade: '90,70,20', lum: 0.8 },
  home: { lx: 0.52, ly: 0.6, key: '#ffd98a', shade: '30,30,70', lum: 0.5 },
  bednight: { lx: 0.55, ly: 0.2, key: '#b9c4ff', shade: '15,12,40', lum: 0.3 },
  cassette: { lx: 0.72, ly: 0.58, key: '#ffcf7a', shade: '40,20,30', lum: 0.4 },
  street: { lx: 0.8, ly: 0.1, key: '#fff3c8', shade: '40,50,80', lum: 0.8 },
  lift: { lx: 0.5, ly: 0.1, key: '#fff3d0', shade: '30,30,50', lum: 0.6 },
  dinner: { lx: 0.65, ly: 0.2, key: '#ffd98a', shade: '40,25,20', lum: 0.5 },
  bus: { lx: 0.5, ly: 0.2, key: '#ffe9a8', shade: '20,25,45', lum: 0.4 },
  cupboard: { lx: 0.74, ly: 0.2, key: '#ffd98a', shade: '30,30,60', lum: 0.5 },
  room: { lx: 0.74, ly: 0.2, key: '#ffd98a', shade: '30,30,60', lum: 0.5 },
};
(function () {
  const S = SCENES.drawn, d = S.draw;
  S.draw = function (f, sh) {
    const L = SET_LIGHT[sh.set];
    if (typeof CINE !== 'undefined' && L && !['call', 'phone', 'face'].includes(sh.set) && !['tape', 'whisper', 'kid', 'poster', 'shoes', 'note', 'backpack'].includes(sh.v))
      CINE.info = Object.assign({}, L, { lx: L.lx, ly: L.ly });
    try { d.call(S, f, sh); } finally { if (typeof CINE !== 'undefined') CINE.info = null; }
  };
})();
