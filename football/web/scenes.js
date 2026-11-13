// ===== the film: five scenes, cut by absolute time t (seconds) =====
let T = { reveal: 115.2, caps: [], silence: 104 };
function setTiming(o) { T = Object.assign(T, o); }

// ---------- shared shots ----------
function stadium(t, jump = 0, dim = 1) {
  sky(t);
  const standH = clamp(CAM.f * 0.75, 260, 900);
  stands(t, CAM.hz - standH, CAM.hz + 6, CAM.x * 14 + 600, jump);
  floodlights(t, dim);
  pitch(t);
}
function fansClose(t, side, jump = 1, wordSize = 230) {               // the near rows of fans, chanting one name
  const red = side === 'red', base = red ? ['#d8261c', '#ff7a1a', '#ffcf33', '#b81c14'] : ['#2d7fe0', '#9fd8ff', '#1d5fb8', '#13254a'];
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, red ? '#2a0806' : '#04122e'); g.addColorStop(1, red ? '#5a140a' : '#0a2a5a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  stands(t, 0, 700, red ? 200 : 1700, 4);
  red ? fire(W / 2, H + 40, W * 1.4, 900, t, 0.35, 40) : water(W / 2, H + 60, W * 1.2, 900, t, 0.45, 10);
  const beat = Math.abs(Math.sin(t * Math.PI * 1.25));            // the chant: two beats a second
  for (let row = 0; row < 4; row++) {
    const s = 0.8 + row * 0.45, y0 = 820 + row * 330;
    for (let i = 0; i < 5 - (row > 2 ? 1 : 0); i++) {
      const x = (i + 0.5) * W / (5 - (row > 2 ? 1 : 0)) + (row % 2) * 60 - 30, k = row * 7 + i, up = beat * 40 * jump * (0.6 + rnd(k) * 0.6);
      const c = { skin: ['#e9b58d', '#c98d62', '#8a5a3a', '#f0c49c'][k % 4], hair: ['#1a1010', '#3a2010', '#d8b060', '#101018'][(k * 3) % 4], hairTip: null, eye: '#3a2a20', style: ['crop', 'neat', 'swept', 'crop'][k % 4], build: 1 };
      c.hairTip = c.hair;
      const sc = base[k % 4], hr = 70 * s;
      // body + scarf, arms up on the beat
      for (const sd of [-1, 1]) limb(x + sd * hr * 0.9, y0 + hr * 1.6 - up, x + sd * hr * (1.5 + beat * 0.3), y0 - hr * (0.6 + beat * 0.9) - up, hr * 0.22, hr * 0.2, sc, 3);
      poly([[x - hr * 1.2, y0 + hr * 1.2 - up], [x + hr * 1.2, y0 + hr * 1.2 - up], [x + hr * 1.4, y0 + hr * 3 - up], [x - hr * 1.4, y0 + hr * 3 - up]], sc, 5);
      ctx.save(); ctx.strokeStyle = red ? '#ffcf33' : '#e9f6ff'; ctx.lineWidth = hr * 0.25; ctx.beginPath(); ctx.moveTo(x - hr * 0.9, y0 + hr * 1.2 - up); ctx.lineTo(x + hr * 0.9, y0 + hr * 1.2 - up); ctx.stroke(); ctx.restore();
      faceFront(x, y0 - up, hr, c, beat > 0.5 ? 'shout' : 'fierce', 3);
    }
  }
  const word = red ? 'KAITO!' : 'REN!';
  bigText(word, W / 2 + Math.sin(t * 20) * 4, 470, wordSize + beat * wordSize * 0.13, red ? '#ffd23f' : '#bfe9ff', { glow: red ? '#ff5a1a' : '#3fb8ff' });
}
function tunnel(t, col, a = 1) {                       // concrete tunnel with the bright pitch at the end
  ctx.fillStyle = '#0b0b12'; ctx.fillRect(0, 0, W, H);
  const vx = W / 2, vy = 900;
  for (let i = 0; i < 9; i++) {
    const k = Math.pow(0.72, i - ((t * 0.6) % 1)), w = 1500 * k, h = 2400 * k;
    ctx.strokeStyle = `rgba(150,150,170,${0.18 * k})`; ctx.lineWidth = 6 * k; ctx.strokeRect(vx - w / 2, vy - h / 2, w, h);
    glow(vx, vy - h / 2 + 30 * k, 200 * k, col, 0.25 * a);
  }
  const g = ctx.createRadialGradient(vx, vy, 10, vx, vy, 260); g.addColorStop(0, '#fffbe8'); g.addColorStop(1, 'rgba(255,250,230,0)');
  ctx.fillStyle = g; ctx.fillRect(vx - 300, vy - 300, 600, 600);
  ctx.fillStyle = '#e9f0ff'; ctx.fillRect(vx - 90, vy - 140, 180, 280);
}
function faceShot(t, c, expr, col, fx, open = 1, look = 0) {
  const r = 330, x = W / 2 + Math.sin(t * 0.7) * 10, y = 980 + Math.cos(t * 0.5) * 8;
  LIGHT = -1;
  glow(x, y, 900, col, 0.45);
  if (fx === 'fire') fire(x, y + 900, 1100, 1500, t, 0.6, 70); else water(x, y + 700, 900, 1500, t, 0.7, 12);
  // shoulders and collar
  poly([[x - 620, H], [x - 520, y + 520], [x - 170, y + 380], [x + 170, y + 380], [x + 520, y + 520], [x + 620, H]], c.shirt, 10);
  poly([[x - 170, y + 380], [x, y + 520], [x + 170, y + 380]], c.shirt2, 8);
  limb(x, y + 360, x, y + 240, 130, 125, c.skin, 8);
  faceFront(x, y, r, Object.assign({}, c), open < 0.5 ? 'deadpan' : expr, 9, { eyeGlow: open > 0.5 ? col : null });
  if (open < 1) {                                            // eyelids closing over the eyes
    for (const s of [-1, 1]) { ctx.save(); ctx.beginPath(); ctx.ellipse(x + s * 0.4 * r, y + 0.05 * r, 0.3 * r, 0.32 * r, 0, 0, 7); ctx.clip(); ctx.fillStyle = shadeHex(c.skin, -0.1); ctx.fillRect(x + s * 0.4 * r - 0.35 * r, y - 0.35 * r, 0.7 * r, 0.7 * r * (1 - open)); ctx.restore(); }
  }
  tint(col, 0.35);
}

// ---------- SCENE 1: THE GOAT DEBATE (0–20) ----------
function scene1(t) {
  if (t < 3.5) {
    const k = ss(t / 3.5); CAM = { x: lerp(-6, 4, k), z: lerp(-62, -50, k), h: lerp(16, 9, k), f: 780, hz: 700 };
    stadium(t, 3);
    ballAt(0, 0, 0, 0);
    const beat = Math.floor(t * 1.25) % 2;
    bigText(beat ? 'KAITO!' : 'REN!', W / 2 + (beat ? -200 : 200), 1350, 150, beat ? '#ffd23f' : '#bfe9ff', { glow: beat ? '#ff5a1a' : '#3fb8ff' });
    tint('#ff7a1a', 0.12, 'soft-light');
  } else if (t < 6) fansClose(t, 'red');
  else if (t < 8.5) fansClose(t, 'blue');
  else if (t < 11) { tunnel(t, '#ff5a1a'); faceShot(t, KAITO, 'fierce', '#ff5a1a', 'fire', ss(seg(t, 9.1, 9.4))); }
  else if (t < 13.5) { tunnel(t, '#3fb8ff'); faceShot(t, REN, 'calm', '#3fb8ff', 'water', ss(seg(t, 11.7, 12.2))); }
  else if (t < 16) {                                                  // the walk-out, from behind, into the light
    const k = seg(t, 13.5, 16);
    tunnel(t, '#ffffff', 0.5);
    const g = ctx.createRadialGradient(W / 2, 900, 50, W / 2, 900, 900 + k * 600); g.addColorStop(0, 'rgba(255,252,235,1)'); g.addColorStop(1, 'rgba(255,252,235,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    LIGHT = 1; RIM = null;
    const s = lerp(1350, 1000, k), y = lerp(2050, 1850, k);
    fire(260, y, 260, 300, t, 0.9, 40); water(820, y, 260, 300, t, 0.9, 8);
    player({ x: 300, y, h: s, view: 'back', c: KAITO, ph: t * 7, run: 0.6 });
    player({ x: 790, y, h: s * 0.96, view: 'back', c: REN, ph: t * 7 + 1.5, run: 0.6 });
    vignette(0.6);
  } else {                                                            // fire and water meet at the centre circle
    const k = seg(t, 16, 20); CAM = { x: 0, z: lerp(-21, -18, k), h: lerp(6, 5, k), f: 1250, hz: 700 };
    stadium(t, 2);
    LIGHT = 1; RIM = '#ffb27a'; onPitch({ dir: 1, c: KAITO, run: 0, ph: 0, expr: 'fierce' }, -12, 0); RIM = '#9fe0ff'; LIGHT = -1; onPitch({ dir: -1, c: REN, run: 0, ph: 0, expr: 'calm' }, 12, 0); RIM = null;
    const meet = ss(seg(t, 16.2, 17.2)), [cx, cy] = proj(0, 0);
    const [lx] = proj(-12, 0), [rx] = proj(12, 0);
    fire(lerp(lx, cx, meet), cy, 220, 260, t, 1, 60);
    water(lerp(rx, cx, meet), cy, 220, 240, t, 1, 10);
    if (t > 17.2) { const b = seg(t, 17.2, 18.2); glow(cx, cy - 100, 900 * eout(b), 'rgba(255,255,255,1)', 1 - b * 0.6); fire(cx - 120, cy, 300, 600, t, 0.8, 40); water(cx + 120, cy, 300, 600, t, 0.8, 8); }
    if (t > 17.2 && t < 17.3) impactFrame(cx, cy - 100);
    if (t > 17.35) {
      const p = eout(seg(t, 17.35, 17.8)), sc = 1.6 - 0.6 * p;
      ctx.save(); ctx.translate(W / 2, 520); ctx.scale(sc, sc); ctx.globalAlpha = p;
      bigText('WHO IS', 0, -110, 130, '#ffffff', { glow: '#ffffff' });
      const g = ctx.createLinearGradient(-420, 0, 420, 0); g.addColorStop(0, '#ff5a1a'); g.addColorStop(0.5, '#ffe9a0'); g.addColorStop(1, '#3fb8ff');
      bigText('THE GOAT?', 0, 70, 180, g, { glow: '#ffffff' }); ctx.restore();
    }
  }
}

// ---------- SCENE 2: KAITO, SPEED AND POWER (20–47) ----------
function trainingBg(t) { stadium(t, 0, 0.8); ctx.fillStyle = 'rgba(0,0,20,0.35)'; ctx.fillRect(0, 0, W, CAM.hz); }
function scene2(t) {
  LIGHT = 1; RIM = '#ffb27a';
  if (t < 24.5) {                                                   // sprint drills past cones, tracked from the side
    const l = t - 20, X = -20 + l * 8.5;
    CAM = { x: X + 0.35, z: -4.6, h: 1.0, f: 1500, hz: 980 };
    trainingBg(t);
    for (let i = 0; i < 12; i++) { const cxw = -20 + i * 4; if (Math.abs(cxw - X) < 30) { const [x, y, k] = proj(cxw, 0); poly([[x - 0.18 * k, y], [x + 0.18 * k, y], [x, y - 0.45 * k]], '#ff8a1a', 3); } }
    const o = onPitch({ dir: 1, c: KAITO, run: 1, ph: t * 15, expr: 'fierce' }, X, 0);
    if (o) fire(o.x - 120, o.y, 160, 200, t, 0.8, 30);
    hLines(t, 'rgba(255,200,150,0.35)', 1);
  } else if (t < 29) {                                              // finishing practice: strike after strike
    const reps = [24.5, 26.0, 27.5], i = reps.findIndex((s, j) => t >= s && t < (reps[j + 1] ?? 29)), l = t - reps[i];
    CAM = { x: [-4, 4, -1][i] + 0.4, z: 25.0, h: 1.5, f: 1400, hz: 760 };
    trainingBg(t); goal(t, l > 0.9 ? Math.exp(-(l - 0.9) * 4) : 0, [-2.5, 2.6, 0.5][i], [1.6, 0.6, 2.0][i]);
    const k = clamp(l / 0.9);
    const bx = lerp([-4, 4, -1][i] + 0.6, [-2.5, 2.6, 0.5][i], seg(l, 0.48, 0.9)), bz = lerp(30, 54, seg(l, 0.48, 0.9)), by = lerp(0, [1.6, 0.6, 2.0][i], seg(l, 0.48, 0.9));
    ballAt(bx, bz, by, l * 20, l > 0.48 && l < 0.9 ? [ -6, 4, 'rgba(255,170,90,0.9)'] : null);
    onPitch({ dir: 1, c: KAITO, kick: k, expr: 'fierce' }, [-4, 4, -1][i] - 0.6, 29.6);
    bigText(`×${(i + 1) * 100}`, 900, 300, 110, '#ffd23f', { glow: '#ff5a1a' });
  } else if (t < 29.6) {                                            // match cut: the same strike, now in a full stadium
    CAM = { x: -0.2, z: 25.0, h: 1.5, f: 1400, hz: 760 }; stadium(t, 6); goal(t);
    onPitch({ dir: 1, c: KAITO, kick: 0.55 + (t - 29) * 0.4, expr: 'shout' }, -0.6, 29.6);
    if (t < 29.12) impactFrame(W / 2, 1300, '#ffd23f');
  } else if (t < 35.5) {                                            // match: bursting past a defender, pitch-level tracking
    const l = t - 29.6, X = -10 + l * 5.2 + (l > 3 ? (l - 3) * 3 : 0);
    CAM = { x: X + 0.8, z: 24.6, h: 0.8, f: 1300, hz: 1000 };
    stadium(t, 5);
    const dX = 7, beaten = l > 3;
    onPitch({ dir: beaten ? 1 : -1, c: DEF, run: beaten ? 0.4 : 0.6, ph: t * 8, expr: 'shout', lean: beaten ? -0.3 : 0 }, dX + (beaten ? (l - 3) * 1.2 : -l * 0.3), 31);
    const push = l > 2.6 ? Math.min(3.5, (l - 2.6) * 9) : 0.9 + Math.abs(Math.sin(t * 7.5)) * 0.5;
    ballAt(X + push, 29.5, 0, t * 12, l > 2.6 && l < 3.2 ? [-25, 0, 'rgba(255,170,90,0.9)'] : null);
    const o = onPitch({ dir: 1, c: KAITO, run: 1, ph: t * 15, expr: 'fierce' }, X, 29.4);
    if (o) fire(o.x - 160, o.y, 220, 320, t, l > 2.6 ? 1 : 0.5, 40);
    if (l > 2.6) hLines(t, 'rgba(255,220,180,0.55)', 1);
  } else if (t < 40) {                                              // slow motion: the strike, foot to ball
    const k = seg(t, 35.5, 40), kk = k < 0.55 ? k * 0.95 : 0.5225 + (k - 0.55) * 1.05;
    CAM = { x: 0.2, z: 25.5, h: 0.5, f: 1500, hz: 1050 };
    stadium(t, 1, 0.9);
    ctx.fillStyle = 'rgba(30,0,0,0.25)'; ctx.fillRect(0, 0, W, H);
    const o = onPitch({ dir: 1, c: KAITO, kick: kk, expr: 'shout' }, -0.75, 29.5);
    const hitT = 0.52, flying = kk > hitT;
    const bx = flying ? 0.35 + (kk - hitT) * 25 : 0.35, by = flying ? (kk - hitT) * 6 : 0;
    ballAt(bx, 29.5, by, flying ? kk * 40 : 0, flying ? [-14, 6, 'rgba(255,140,40,0.95)'] : null);
    if (o) fire(o.x, o.y, 240, 360 + (flying ? 300 : 0), t, 0.6 + (flying ? 0.4 : 0), 50);
    if (Math.abs(kk - hitT) < 0.012) { const [x, y] = proj(0.35, 29.5, 0.1); impactFrame(x, y, '#ffd23f'); }
    if (kk > hitT && kk < hitT + 0.06) { const [x, y] = proj(0.35, 29.5, 0.1); speedLines(t, x, y, 'rgba(255,220,160,0.8)', 80, 120); glow(x, y, 600, '#ff7a1a', 0.9); }
    letterbox(1);
  } else if (t < 43.5) {                                            // behind the goal: the net snaps back at us
    const l = t - 40;
    CAM = { x: 0.6, z: 50.0, h: 1.4, f: 820, hz: 760 };
    // looking back up the pitch: draw the world mirrored so the goal sits right in front of the lens
    stadium(t, 8);
    const arrive = 0.55, k = clamp(l / arrive);
    const bx = lerp(-4, 2.2, k), bz = lerp(95, 56.2, eout(k)), by = lerp(0.3, 1.6, k);
    onPitch({ dir: -1, c: KEEP, kick: null, run: 0.2, ph: 0, lean: l > 0.3 ? -0.9 : 0, expr: 'shout' }, lerp(0, 1.4, seg(l, 0.3, 0.8)), 57 + 0, lerp(0, 0.8, seg(l, 0.3, 0.6)));
    onPitch({ dir: -1, c: KAITO, run: 0.2, ph: 0, expr: 'fierce' }, -4, 92);
    if (l < arrive + 0.05) ballAt(bx, bz, by, l * 30, [3, -4, 'rgba(255,150,60,0.9)']);
    // the net right in front of us
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 6;
    const bulge = l > arrive ? Math.exp(-(l - arrive) * 3) * Math.sin((l - arrive) * 18) * 0 + Math.exp(-(l - arrive) * 2.2) : 0;
    const hx = W / 2 + 160, hy = 760;
    for (let i = -8; i <= 18; i++) { ctx.beginPath(); for (let j = -2; j <= 30; j++) { const x0 = i * 70, y0 = j * 70; const d = Math.hypot(x0 - hx, y0 - hy), push = bulge * 260 * Math.exp(-d * d / 160000); const px = x0 + (x0 - hx) * push / 900, py = y0 + (y0 - hy) * push / 900 + push * 0.3; j > -2 ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
    for (let j = -2; j <= 30; j++) { ctx.beginPath(); for (let i = -8; i <= 18; i++) { const x0 = i * 70, y0 = j * 70; const d = Math.hypot(x0 - hx, y0 - hy), push = bulge * 260 * Math.exp(-d * d / 160000); const px = x0 + (x0 - hx) * push / 900, py = y0 + (y0 - hy) * push / 900 + push * 0.3; i > -8 ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); }
    ctx.restore();
    if (l > arrive) { ball(hx, hy - 20, 70 + bulge * 40, l * 10); glow(hx, hy, 700 * bulge, '#ff7a1a', 0.8); if (l < arrive + 0.08) impactFrame(hx, hy, '#ffd23f'); bigText('GOAL!', W / 2, 1450, 260 * eout(seg(l, arrive, arrive + 0.3)) + 1, '#ffd23f', { glow: '#ff5a1a' }); }
  } else {                                                          // the celebration: fire everywhere
    const l = t - 43.5;
    sky(t); stands(t, 400, 1180, 400, 14); floodlights(t);
    ctx.fillStyle = '#238a3c'; ctx.fillRect(0, 1180, W, H - 1180);
    fire(W / 2, 1900, 900, 1300, t, 0.85, 90);
    const jumpY = -Math.max(0, Math.sin(seg(l, 0.2, 1.2) * Math.PI)) * 260;
    LIGHT = -1; player({ x: W / 2, y: 1880 + jumpY, h: 1300, view: 'front', c: KAITO, run: 0, ph: 0, expr: 'shout' });
    if (l > 1.7) { const p = eout(seg(l, 1.7, 2.1)); ctx.save(); ctx.globalAlpha = p; bigText('SPEED', W / 2, 330, 190 * (1.4 - 0.4 * p), '#ffd23f', { glow: '#ff5a1a' }); bigText('& POWER', W / 2, 520, 150 * (1.4 - 0.4 * p), '#ffffff', { glow: '#ff5a1a' }); ctx.restore(); }
    tint('#ff5a1a', 0.25);
  }
  RIM = null;
}

// ---------- SCENE 3: REN, CALM AND CONTROL (47–77) ----------
function scene3(t) {
  LIGHT = -1; RIM = '#9fe0ff';
  if (t < 50.5) {                                                   // he glances up
    tunnel(t, '#3fb8ff', 0.2); ctx.fillStyle = 'rgba(5,20,50,0.85)'; ctx.fillRect(0, 0, W, H);
    faceShot(t, REN, 'calm', '#3fb8ff', 'water', 1);
    if (t > 48.6 && t < 48.9) speedLines(t, W / 2, 980, 'rgba(160,220,255,0.5)', 50, 500);
  } else if (t < 53) {                                              // two defenders close in on him
    const l = t - 50.5;
    CAM = { x: 0, z: 20.4, h: 1.0, f: 1400, hz: 930 }; stadium(t, 3); tint('#1a4aa0', 0.35);
    onPitch({ dir: 1, c: DEF, run: 0.8, ph: t * 11, expr: 'shout' }, lerp(-6, -2.2, l / 2.5), 26.5);
    onPitch({ dir: -1, c: DEF2, run: 0.8, ph: t * 11 + 1, expr: 'shout' }, lerp(6, 2.2, l / 2.5), 27.5);
    ballAt(0.5, 25, 0, t);
    onPitch({ dir: 1, c: REN, run: 0.15, ph: t * 4, expr: 'calm' }, 0, 24.6);
    const [x, y] = proj(0, 24.6); water(x, y, 260, 240, t, 0.55, 8);
  } else if (t < 58) {                                              // tiny touch, change of direction, through the gap
    const l = t - 53;
    CAM = { x: lerp(0, 2.5, seg(l, 1.5, 5)), z: lerp(20.6, 23.5, seg(l, 0, 5)), h: 0.5, f: 1400, hz: 1010 }; stadium(t, 3); tint('#1a4aa0', 0.35);
    const slow = l > 1.2 && l < 2.6;
    const rx = l < 1.2 ? -0.4 + l * 0.3 : l < 2.6 ? lerp(-0.05, 1.1, ss((l - 1.2) / 1.4)) : 1.1 + (l - 2.6) * 2.2;
    const rz = l < 1.2 ? 24.6 + l * 0.6 : 25.3 + (l - 1.2) * 1.8;
    const d1 = onPitch({ dir: 1, c: DEF, run: 0.5, ph: t * 9, expr: 'shout', lean: l > 1.6 ? -0.4 : 0 }, lerp(-2.2, -0.2, seg(l, 0, 2)) - (l > 2 ? (l - 2) * 0.8 : 0), 27);
    const d2 = onPitch({ dir: -1, c: DEF2, run: 0.5, ph: t * 9 + 1, expr: 'shout', lean: l > 2 ? 0.35 : 0 }, lerp(2.2, 0.6, seg(l, 0, 2)) + (l > 2.3 ? (l - 2.3) * 1.6 : 0), 28.2);
    const touch = Math.abs(Math.sin(l * 6)) * 0.25;
    ballAt(rx + 0.45 + touch, rz + 0.2, 0, l * 9);
    const o = onPitch({ dir: l > 1.2 && l < 1.6 ? -1 : 1, c: REN, run: slow ? 0.55 : 0.75, ph: t * (slow ? 6 : 12), expr: 'calm' }, rx, rz);
    if (o) water(o.x, o.y, 280, 380, t, 0.8, 10);
    if (slow) { ctx.fillStyle = 'rgba(0,30,80,0.18)'; ctx.fillRect(0, 0, W, H); letterbox(1); }
  } else if (t < 72) {                                              // one long tracking shot all the way to goal
    const l = t - 58, Z = 32 + l * 1.45, X = Math.sin(l * 0.5) * 2.2;
    CAM = { x: X - 1.0, z: Z - 5.2, h: 1.4, f: 1400, hz: 860 };
    stadium(t, 4); goal(t); tint('#1a4aa0', 0.3);
    onPitch({ dir: -1, c: DEF, run: 0.7, ph: t * 10, expr: 'shout', lean: l > 4.2 ? 0.5 : 0 }, 3 - Math.max(0, l - 3) * 0.4, 38.5 + Math.min(l, 4.2) * 0.3);
    const keeperDive = seg(t, 69.3, 70.1);
    onPitch({ dir: -1, c: KEEP, run: 0.25, ph: t * 6, lean: -1.2 * keeperDive, expr: 'shout' }, lerp(0, -2.4, keeperDive), 51.5, keeperDive * 0.6);
    const touch = 0.55 + Math.abs(Math.sin(l * 5.2)) * 0.35;
    ballAt(X + touch * 0.5, Z + touch, 0, l * 8);
    const o = onPitch({ dir: 1, c: REN, run: 0.75, ph: t * 12, expr: 'calm' }, X, Z);
    if (o) water(o.x, o.y, 220, 300, t, 0.7, 9);
    if (l > 11.3) bigText('THE KEEPER COMMITS…', W / 2, 330, 72, '#bfe9ff', { glow: '#3fb8ff' });
  } else {                                                          // he just guides it into the corner
    const l = t - 72;
    CAM = { x: 0.6, z: 46.3, h: 1.2, f: 1300, hz: 820 }; stadium(t, l > 0.9 ? 12 : 3); tint('#1a4aa0', 0.3);
    const k = clamp(l / 0.9);
    const bx = lerp(0.6, 3.2, seg(l, 0.4, 1.1)), bz = lerp(52.2, 54.4, seg(l, 0.4, 1.1));
    goal(t, l > 1.1 ? Math.exp(-(l - 1.1) * 3) : 0, 3.0, 0.3);
    onPitch({ dir: -1, c: KEEP, kick: null, run: 0, ph: 0, lean: -1.5, expr: 'shout' }, -2.6, 51.8, 0.15);
    ballAt(bx, bz, 0, l * 6);
    if (l < 2.2) onPitch({ dir: 1, c: REN, kick: 0.3 + k * 0.45, expr: 'calm' }, -0.1, 51.0);
    else { CAM = { x: 0, z: 0, h: 1, f: 900, hz: 800 }; tunnel(t, '#3fb8ff', 0.1); ctx.fillStyle = 'rgba(5,20,50,0.9)'; ctx.fillRect(0, 0, W, H); faceShot(t, REN, 'smile', '#3fb8ff', 'water', 1); }
    if (l > 1.1 && l < 1.2) { const [x, y] = proj(3.2, 54.4, 0.3); glow(x, y, 700, '#3fb8ff', 0.9); }
    if (l > 2.4) { const p = eout(seg(l, 2.4, 2.8)); ctx.save(); ctx.globalAlpha = p; bigText('CALM', W / 2, 300, 190 * (1.4 - 0.4 * p), '#bfe9ff', { glow: '#3fb8ff' }); bigText('& CONTROL', W / 2, 490, 140 * (1.4 - 0.4 * p), '#ffffff', { glow: '#3fb8ff' }); ctx.restore(); }
  }
  RIM = null;
}

// ---------- SCENE 4: GREAT RIVALS, DIVIDED FANS (77–108) ----------
function scene4(t) {
  if (t < 85) {                                                     // intercut: his strike, his finish, split by a lightning seam
    const l = t - 77, cyc = l % 4, kk = clamp(cyc / 2.2);
    const half = (clipFn, draw) => { ctx.save(); clipFn(); ctx.clip(); draw(); ctx.restore(); };
    const sw = Math.sin(l * 0.8) * 120;
    half(() => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 760 + sw); ctx.lineTo(0, 1160 - sw); ctx.closePath(); }, () => {
      LIGHT = 1; RIM = '#ffb27a'; CAM = { x: 0.2, z: 25.8, h: 0.6, f: 1150, hz: 650 }; stadium(t, 2);
      const o = onPitch({ dir: 1, c: KAITO, kick: kk, expr: 'shout' }, -0.75, 29.5); const fly = kk > 0.52;
      ballAt(fly ? 0.35 + (kk - 0.52) * 25 : 0.35, 29.5, fly ? (kk - 0.52) * 6 : 0, kk * 30, fly ? [-14, 6, 'rgba(255,140,40,0.9)'] : null);
      if (o) fire(o.x, o.y, 240, 400, t, 0.8, 40); tint('#ff5a1a', 0.3); bigText('FIRE', 200, 200, 120, '#ffd23f', { glow: '#ff5a1a' });
    });
    half(() => { ctx.beginPath(); ctx.moveTo(0, 1160 - sw); ctx.lineTo(W, 760 + sw); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); }, () => {
      LIGHT = -1; RIM = '#9fe0ff'; CAM = { x: 0.6, z: 46.3, h: 1.2, f: 1100, hz: 1250 }; stadium(t, 2);
      const q = clamp((cyc - 0.6) / 1.4); goal(t, q > 0.8 ? 1 - (q - 0.8) * 3 : 0, 3, 0.3);
      onPitch({ dir: 1, c: REN, kick: 0.3 + clamp(cyc / 1.2) * 0.45, expr: 'calm' }, -0.1, 51.0);
      ballAt(lerp(0.6, 3.2, q), lerp(52.2, 54.4, q), 0, cyc * 6);
      const [x, y] = proj(0, 51); water(x, y, 260, 380, t, 0.8, 9); tint('#1a4aa0', 0.3); bigText('WATER', 880, 1760, 120, '#bfe9ff', { glow: '#3fb8ff' });
    });
    RIM = null;
    ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 14; ctx.shadowColor = '#fff'; ctx.shadowBlur = 40; ctx.beginPath(); ctx.moveTo(0, 1160 - sw); ctx.lineTo(W, 760 + sw); ctx.stroke(); ctx.restore();
  } else if (t < 92) {                                              // walking off together, a nod of respect
    const l = t - 85;
    sky(t); stands(t, 300, 1100, 900, 2); floodlights(t, 0.9);
    ctx.fillStyle = '#238a3c'; ctx.fillRect(0, 1100, W, H - 1100);
    fire(260, 1880, 400, 600, t, 0.5, 30); water(820, 1880, 400, 600, t, 0.5, 8);
    const nod = l > 2.6 && l < 4 ? Math.sin(seg(l, 2.6, 4) * Math.PI) * 30 : 0;
    const s = 1150 + l * 30;
    LIGHT = 1; player({ x: 290, y: 1900 + nod * 0.2, h: s, view: 'front', c: KAITO, ph: l * 5, run: l < 2.6 ? 0.5 : 0, expr: l > 3 ? 'smile' : 'focus' });
    LIGHT = -1; player({ x: 800, y: 1900 + nod * 0.2, h: s * 0.96, view: 'front', c: REN, ph: l * 5 + 1.5, run: l < 2.6 ? 0.5 : 0, expr: l > 3 ? 'smile' : 'calm' });
    if (l > 3.2) { glow(W / 2, 900, 500, 'rgba(255,255,255,0.8)', 0.4); bigText('RESPECT', W / 2, 300, 150 * eout(seg(l, 3.2, 3.6)) + 1, '#ffffff', { glow: '#ffe9a0' }); }
    vignette(0.4);
  } else if (t < T.silence) {                                       // the stands: both sides louder and louder
    const l = t - 92, build = seg(t, 92, T.silence);
    ctx.save(); shakeCam(t, build * 14);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip(); ctx.translate(-W / 4, 0); fansClose(t, 'red', 1 + build, 120); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip(); ctx.translate(W / 4, 0); fansClose(t + 0.4, 'blue', 1 + build, 120); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.fillRect(W / 2 - 6, 0, 12, H);
    for (let i = 0; i < Math.floor(build * 10); i++) bigText(i % 2 ? 'KAITO!' : 'REN!', rnd(i * 3 + Math.floor(t * 4)) * W, 800 + rnd(i * 7 + Math.floor(t * 4)) * 1000, 90 + build * 60, i % 2 ? '#ffd23f' : '#bfe9ff', { glow: i % 2 ? '#ff5a1a' : '#3fb8ff' });
    ctx.restore();
  } else {                                                          // …and then, nothing
    const l = t - T.silence;
    ctx.save(); ctx.filter = 'grayscale(1) brightness(0.45)';
    ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip(); ctx.translate(-W / 4, 0); fansClose(T.silence - 0.01, 'red', 0, 120); ctx.restore();
    ctx.save(); ctx.filter = 'grayscale(1) brightness(0.45)';
    ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip(); ctx.translate(W / 4, 0); fansClose(T.silence + 0.39, 'blue', 0, 120); ctx.restore();
    ctx.fillStyle = `rgba(0,0,0,${0.3 + seg(l, 0, 3.5) * 0.6})`; ctx.fillRect(0, 0, W, H);
  }
}

// ---------- SCENE 5: THE REVEAL (108–120) ----------
function scene5(t) {
  const R = T.reveal;
  if (t < R) {                                                      // a third player, from behind, in the dark
    const l = t - 108, k = seg(t, 108, R);
    ctx.fillStyle = '#030306'; ctx.fillRect(0, 0, W, H);
    tunnel(t, '#666', 0.08); ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
    LIGHT = 1; RIM = 'rgba(200,200,220,0.6)';
    const s = lerp(1300, 1500, k);
    ctx.save(); ctx.filter = 'brightness(0.32)';
    player({ x: W / 2, y: lerp(2050, 2100, k), h: s, view: 'back', c: BARRY, hideNum: true, ph: 0, run: 0 });
    ctx.restore(); RIM = null;
    for (let i = 0; i < 30; i++) { const y = (rnd(i) * H + t * 20 * (0.5 + rnd(i * 3))) % H; ellipse(rnd(i * 5) * W, y, 2, 2, 'rgba(255,255,255,0.25)'); }
    vignette(0.8);
  } else {                                                          // golden spotlight. Completely serious.
    const l = t - R;
    ctx.fillStyle = '#050403'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(W / 2, 0, W / 2, H); g.addColorStop(0, 'rgba(255,215,120,0.75)'); g.addColorStop(1, 'rgba(255,190,80,0.15)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(W / 2 - 120, 0); ctx.lineTo(W / 2 + 120, 0); ctx.lineTo(W / 2 + 620, H); ctx.lineTo(W / 2 - 620, H); ctx.closePath(); ctx.fill(); ctx.restore();
    for (let i = 0; i < 70; i++) { const y = (rnd(i) * H + l * 140 * (0.4 + rnd(i * 3))) % H; glow(W / 2 + (rnd(i * 5) - 0.5) * 1100 * (y / H + 0.2), y, 10 + rnd(i) * 12, 'rgba(255,220,130,1)', 0.8); }
    if (l < 0.12) { ctx.fillStyle = '#fff4d0'; ctx.fillRect(0, 0, W, H); }
    LIGHT = 1; RIM = '#ffe29a';
    const push = 1 + l * 0.02;
    ctx.save(); ctx.translate(W / 2, 1150); ctx.scale(push, push); ctx.translate(-W / 2, -1150);
    poly([[W / 2 - 700, H + 100], [W / 2 - 560, 1500], [W / 2 - 200, 1360], [W / 2 + 200, 1360], [W / 2 + 560, 1500], [W / 2 + 700, H + 100]], BARRY.shirt, 10);
    bigText('5', W / 2 + 300, 1700, 170, '#ffd76a', { sw: 0.08 });
    limb(W / 2, 1350, W / 2, 1200, 160, 150, BARRY.skin, 8);
    faceFront(W / 2, 960, 360, BARRY, 'deadpan', 9, { stubble: true });
    ctx.restore(); RIM = null;
    tint('#ffcf66', 0.3);
    const p = eout(seg(l, 0, 0.35));
    ctx.save(); ctx.globalAlpha = p; ctx.translate(W / 2, 330); ctx.scale(1.5 - 0.5 * p, 1.5 - 0.5 * p);
    const tg = ctx.createLinearGradient(0, -90, 0, 90); tg.addColorStop(0, '#fff6c8'); tg.addColorStop(0.5, '#ffcf3a'); tg.addColorStop(1, '#c8861a');
    bigText('BARRY BUNCE', 0, 0, 150, tg, { glow: '#ffcf3a' }); ctx.restore();
    vignette(0.5);
  }
}

// ---------- captions (synced to the narration) ----------
function captions(t) {
  const c = T.caps.find(c => t >= c.start && t < c.end); if (!c) return;
  const words = c.text.split(' '), pr = clamp((t - c.start) / Math.max(0.2, c.end - c.start));
  ctx.save(); ctx.font = '900 70px Impact, "Arial Black", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > 900 && cur) { lines.push(cur); cur = w; } else cur = test; }
  lines.push(cur);
  const y0 = 1560 - (lines.length - 1) * 45; let idx = 0, shown = Math.ceil(pr * words.length * 1.15);
  lines.forEach((ln, li) => {
    const ws = ln.split(' '), wid = ctx.measureText(ln).width; let x = W / 2 - wid / 2;
    for (const w of ws) {
      const on = idx < shown; ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.strokeText(w, x, y0 + li * 90);
      ctx.fillStyle = on ? (idx === shown - 1 ? '#ffe14a' : '#ffffff') : 'rgba(255,255,255,0.55)'; ctx.fillText(w, x, y0 + li * 90);
      x += ctx.measureText(w + ' ').width; idx++;
    }
  });
  ctx.restore();
}

function frame(t) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; LIGHT = 1; RIM = null;
  if (t < 20) scene1(t); else if (t < 47) scene2(t); else if (t < 77) scene3(t); else if (t < 108) scene4(t); else scene5(t);
  ctx.restore();
  // a quick white flash on every scene change
  for (const s of [20, 47, 77]) if (t >= s && t < s + 0.12) { ctx.fillStyle = `rgba(255,255,255,${1 - (t - s) / 0.12})`; ctx.fillRect(0, 0, W, H); }
  captions(t); grain(t);
}
window.frame = frame; window.setTiming = setTiming;
