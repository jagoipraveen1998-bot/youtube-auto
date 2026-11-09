// ---------- THE GIRL ON HIS SHOULDER: landscape short film ----------
// Sets: rented-house stairs, bedroom (top-down at night, side view by day), office (day / Diwali / night / meeting),
// hospital exam room, phone photo, laptop page, phone call, car at night, navigation, street sign, hospital room.
// Mira (the girl) sits on Arjun's right shoulder (screen-left): drawn behind him, her legs and hand in front.

// ---- people helpers -------------------------------------------------------------------------------------------
const handPt = (o, sd) => {            // world position of a hand (sd -1 = screen-left arm 'armL', +1 = 'armR')
  const a = (sd < 0 ? o.armL : o.armR) ?? 0.22, s = o.s, ln = o.lean || 0;
  const lx = sd * 150 + sd * Math.sin(a) * 245, ly = -455 + Math.cos(a) * 245;
  return [o.x + (lx * Math.cos(ln) - ly * Math.sin(ln)) * s, o.y + (lx * Math.sin(ln) + ly * Math.cos(ln)) * s];
};
const localPt = (o, lx, ly) => { const s = o.s, ln = o.lean || 0; return [o.x + (lx * Math.cos(ln) - ly * Math.sin(ln)) * s, o.y + (lx * Math.sin(ln) + ly * Math.cos(ln)) * s]; };
const anim = (v, f, sh) => Array.isArray(v) ? lerp(v[0], v[1], ss(seg(f, sh.a + (v[2] || 0), v[3] != null ? sh.a + v[3] : sh.b - 4))) : v;

function gPerson(role, sh, f, base) {
  const sp = (sh.crew || {})[role];
  if (!sp) return null;
  const b = Object.assign({}, base);
  if (sp.x != null && !sp.walk) b.x = sp.x;
  if (sp.y != null) b.y = sp.y;
  if (sp.s != null) b.s = sp.s;
  if (sp.noLegs) b.noLegs = true;
  const o = person(role, sh, f, b);
  if (!o) return null;
  o._sp = sp; o._role = role;
  for (const k of ['lean', 'tilt', 'armL', 'armR', 'look', 'lookY', 'lid']) if (Array.isArray(o[k])) o[k] = k === 'armL' || k === 'armR' ? 0.22 : 0;
  if (sp.tiltR != null) { const k = anim(sp.tiltR, f, sh); o.lean = (o.lean || 0) - 0.06 * k; o.tilt = (o.tilt || 0) + 0.17 * k; o.armL = (o.armL ?? 0.22) - 0.12 * k; }
  if (sp.lean != null) o.lean = (o.lean || 0) + anim(sp.lean, f, sh);
  if (sp.headRoll) o.tilt = (o.tilt || 0) + anim(sp.headRoll, f, sh);
  if (sp.lid != null) o.lid = anim(sp.lid, f, sh);
  if (sp.armL != null) o.armL = anim(sp.armL, f, sh);
  if (sp.armR != null) o.armR = anim(sp.armR, f, sh);
  if (sp.front) o.armsFront = true;
  if (sp.raise) {                                    // both arms up; on the beat the right arm (screen-left) drops first
    const up = ss(seg(f, sh.a + 4, sh.a + 26));
    let l = lerp(0.22, 2.95, up), r = l;
    if (after(f, sh)) { l = lerp(2.95, 0.3, ss(bT(f, sh, 10))); r = lerp(2.95, 0.3, ss(seg(f, sh.beat + 12, sh.beat + 26))); }
    o.armL = l; o.armR = r; o.armsFront = false;
  }
  if (sp.pushGlasses && after(f, sh)) {               // one finger to the bridge of the glasses, then down
    const k = Math.sin(Math.PI * clamp((f - sh.beat) / 22));
    o.armR = lerp(o.armR ?? 0.22, 2.75, k); o.armsFront = k > 0.2;
  }
  if (sp.wave) { o.armR = 2.5 + 0.35 * Math.sin(f * 0.45); o.armsFront = false; }
  if (sp.rub) { const r = Array.isArray(sp.rub) ? sp.rub : [6, 1e9]; const k = ss(seg(f, sh.a + r[0], sh.a + r[0] + 12)) * (1 - ss(seg(f, sh.a + r[1] - 10, sh.a + r[1])));
    o.armR = lerp(0.22, -1.5, k); o.armsFront = k > 0.3; o.tilt = (o.tilt || 0) + 0.04 * Math.sin(f * 0.3) * k; }
  if (sp.catchArm && after(f, sh)) o.armL = lerp(0.22, 1.45, ss(bT(f, sh, 5)));
  if (sp.cupHold) o.armL = 1.45;
  if (sp.toEar) { o.armR = 2.85; o.armsFront = true; }
  if (sp.nod) {                                     // nodding off: eyes droop, the head dips and jerks up
    const c = (f - sh.a) % 70, d = c < 52 ? ss(c / 52) : 1 - ss(clamp((c - 52) / 6));
    o.lid = 0.35 + 0.6 * d; o.bob = (o.bob || 0) + 30 * d; o.tilt = (o.tilt || 0) + 0.08 * d;
  }
  if (sp.freeze) { o.bob = 0; o.tremble = 0; o.sweat = false; }
  if (sp.dart) {                                    // only the eyes move: they jump between two points
    const seq = sp.dart, i = Math.floor((f - sh.a) / 11) % seq.length; o.look = seq[i][0]; o.lookY = seq[i][1];
  }
  if (sp.lookTo != null && sp.lookAt != null) o.look = lerp(sp.look ?? 0, sp.lookTo, ss(seg(f, sh.a + sp.lookAt, sh.a + sp.lookAt + 8)));
  if (sp.mouthO) { o.mouth = 'o'; o.mo = sp.mouthO + 0.12 * Math.sin(f * 0.3); o.talk = false; }
  if (sp.flinch && after(f, sh)) { const k = 1 - clamp((f - sh.beat) / 14); if (k > 0) { o.lid = Math.max(o.lid || 0, 0.9 * k); o.tremble = 8 * k; o.brow = 'worry'; } }
  if (sp.smileAt != null && f >= sh.a + sp.smileAt) { o.mouth = 'smile'; o.brow = 'flat'; o.lid = 0.12; }
  if (sp.glare != null) { o.acc = Object.assign({}, o.acc, { glare: anim(sp.glare, f, sh) }); }
  if (sp.headGlare && after(f, sh)) o.acc = Object.assign({}, o.acc, { glare: 0.15 + 0.75 * ss(bT(f, sh, 40)) });
  if (sp.blinkOff) o.blink = 0;
  if (sp.noGlasses) o.acc = Object.assign({}, o.acc, { rectGlasses: false, glasses: false });
  return o;
}

// ---- Mira ------------------------------------------------------------------------------------------------------
const MIRA = { skin: '#eadfd5', hair: '#120e16', hairStyle: 'bob', outfit: 'dress', top: '#8e9fb4', pants: '#8e9fb4' };
function miraObj(x, y, s, f, opt = {}) {
  const o = Object.assign({ x, y, s, seed: 21, noLegs: true }, MIRA, {
    acc: { starClip: true, creaseL: opt.creaseL || 0, creaseR: opt.creaseR || 0 },
    eyeW: 1.0, pupil: 25, brow: 'flat', mouth: 'flat', blink: 0, look: opt.look ?? 0, lookY: opt.lookY ?? 0, lean: opt.lean || 0 });
  if (opt.alive) { o.skin = '#e2b48c'; o.pupil = 20; }
  if (opt.smile) { o.mouth = 'smile'; o.lid = 0; o.eyeW = 1.08; o.pupil = 15; }
  if (opt.laugh) { const k = opt.laugh; o.mouth = 'smile'; o.lid = 0.18 * k; o.eyeW = 1.06; o.pupil = 15; o.bob = -10 * k; o.tilt = 0.05 * Math.sin(f * 0.5) * k + 0.08; o.acc.creaseL = 1; o.acc.creaseR = 1; o._giggle = k; }
  if (opt.tilt) o.tilt = (o.tilt || 0) + opt.tilt;
  if (opt.alpha != null) o.alpha = opt.alpha;
  return o;
}
function miraOpt(sp, f, sh) {                       // smile/laugh timing on the shoulder, from the shot
  const m = typeof sp.mira === 'object' ? sp.mira : {};
  const o = { look: m.look ?? 0, lookY: m.lookY ?? 0, alpha: m.alpha };
  if (m.creaseAt != null) {                         // one cheek creases, then the other
    o.creaseL = ss(seg(f, sh.a + m.creaseAt, sh.a + m.creaseAt + 10));
    o.creaseR = ss(seg(f, sh.a + m.creaseAt + 26, sh.a + m.creaseAt + 36));
    o.smile = f >= sh.a + m.creaseAt + 26;
  }
  if (m.smile) { o.smile = true; o.creaseL = 1; o.creaseR = 1; }
  if (m.laugh) {                                    // breathy laugh, synced to the voice when she has the line
    const env = sh.env && sh.ls != null && f >= sh.ls && f < sh.ls + sh.env.length ? sh.env[f - sh.ls] : null;
    o.laugh = env != null ? Math.min(1, env * 1.3) : (f >= sh.a + (m.laughAt || 0) ? Math.abs(Math.sin(f * 0.6)) * (m.laugh === 'hard' ? 1 : 0.5) : 0);
    if (o.laugh < 0.08) { o.smile = true; o.creaseL = 1; o.creaseR = 1; o.laugh = 0; }
  }
  return o;
}
function miraMouth(m) {                            // her stretched smile drawn over the face
  if (m.mouth !== 'smile') return;
  const s = m.s, hx = m.x + Math.sin(m.lean || 0) * 775 * s, hy = m.y - Math.cos(m.lean || 0) * 775 * s;
  ctx.save(); ctx.translate(hx, hy); ctx.rotate((m.lean || 0) + (m.tilt || 0)); ctx.scale(s, s);
  const g = m._giggle || 0, w = 92;
  ctx.fillStyle = m.skin; ctx.beginPath(); ctx.ellipse(0, 150 + (m.bob || 0), 70, 34, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-w, 128 + (m.bob || 0)); ctx.quadraticCurveTo(0, 176 + 10 * g + (m.bob || 0), w, 128 + (m.bob || 0)); ctx.stroke();
  if (g > 0.15) { ctx.fillStyle = '#2a1020'; ctx.beginPath(); ctx.moveTo(-w * 0.6, 138 + (m.bob || 0)); ctx.quadraticCurveTo(0, 150 + 26 * g + (m.bob || 0), w * 0.6, 138 + (m.bob || 0)); ctx.quadraticCurveTo(0, 148 + (m.bob || 0), -w * 0.6, 138 + (m.bob || 0)); ctx.fill(); }
  ctx.restore();
}
function miraSeat(a) { return localPt(a, -205, -515); }
function miraBack(a, f, opt) {                     // her body and head, leaning out from behind his head
  const ms = a.s * 0.46, [sx, sy] = miraSeat(a);
  const m = miraObj(sx, sy + 175 * ms, ms, f, Object.assign({}, opt, { lean: -0.32 + (a.lean || 0) * 0.5 }));
  const mouth = m.mouth; if (mouth === 'smile') m.mouth = 'none';
  guy(m); m.mouth = mouth; miraMouth(m);
}
function miraFront(a, f, opt) {                    // legs hanging over his chest (bare heels against him), hand on his collar
  const ms = a.s * 0.46, [sx, sy] = miraSeat(a);
  ctx.save(); if (opt.alpha != null) ctx.globalAlpha = clamp(opt.alpha);
  const sway = Math.sin(f * 0.05) * 4 * ms;
  for (const [dx, hx, hy] of [[-22, -150, -330], [26, -96, -322]]) {
    const [kx, ky] = [sx + dx * ms * 1.4, sy + 20 * ms];            // knee over the shoulder edge
    const [fx, fy] = localPt(a, hx, hy);
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 44 * ms + L(6); ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx + sway, fy); ctx.stroke();
    ctx.strokeStyle = MIRA.skin; ctx.lineWidth = 44 * ms; ctx.stroke();
    sf(ell(fx + sway, fy + 12 * ms, 40 * ms, 30 * ms), MIRA.skin, 4);                 // bare heel
  }
  sf(ell(sx, sy + 6 * ms, 92 * ms, 48 * ms), MIRA.top, 5);                            // the hem of her frock over her knees
  const [cx, cy] = localPt(a, -45, -500);                                                 // her hand gripping his collar
  ctx.strokeStyle = INK; ctx.lineWidth = 52 * ms + L(6); ctx.beginPath(); ctx.moveTo(sx + 60 * ms, sy - 120 * ms); ctx.lineTo(cx, cy); ctx.stroke();
  ctx.strokeStyle = MIRA.top; ctx.lineWidth = 52 * ms; ctx.stroke();
  sf(ell(cx, cy, 30 * ms, 26 * ms), MIRA.skin, 4);
  ctx.restore();
}
function drawG(o, f, sh) {                         // draw a person with props; Arjun with Mira when she is shown
  if (!o) return;
  const sp = o._sp || {};
  const mira = sp.mira ? miraOpt(sp, f, sh) : null;
  if (mira) miraBack(o, f, mira);
  if (sp.cup === 'both') { o.armL = -0.55; o.armR = -0.55; o.armsFront = true; }
  if (sp.box) { o.armL = 0.16; if (!o._reach) o.armR = 0.16; o.armsFront = true; }
  guy(o);
  if (sp.box) {                                    // a moving box held against him
    const [bx, by] = localPt(o, o._reach ? -70 : 0, -330);
    sf(rr(bx - 160 * o.s, by - 125 * o.s, 320 * o.s, 240 * o.s, 8 * o.s), '#b58d5a', 5);
    fillR(bx - 160 * o.s, by - 20 * o.s, 320 * o.s, 18 * o.s, '#d8c69a');
    for (const sd of o._reach ? [-1] : [-1, 1]) { const [hx, hy] = handPt(o, sd); sf(ell(hx, hy, 42 * o.s, 42 * o.s), o.skin || SKIN, 5); }
  }
  if (sp.bag && sp.bag !== 'floor') {              // a work bag on the right shoulder (screen-left)
    const off = sp.bag === 'off' && after(f, sh) ? ss(bT(f, sh, 16)) : 0;
    const [bx, by] = localPt(o, -150 - 90 * off, -260 + 260 * off);
    if (off < 1) { const [s1x, s1y] = localPt(o, -120, -505); line(s1x, s1y, bx + 20 * o.s, by - 40 * o.s, '#2a2420', 14 * o.s / 0.55); }
    sf(rr(bx - 110 * o.s, by - 60 * o.s, 220 * o.s, 170 * o.s, 18 * o.s), '#3a3330', 5);
  }
  if (sp.bag === 'floor') { const [bx] = localPt(o, -260, 0); sf(rr(bx - 110 * o.s, o.y - 170 * o.s, 220 * o.s, 170 * o.s, 18 * o.s), '#3a3330', 5); }
  if (sp.cup === 'both') { const [hx, hy] = localPt(o, 0, -250); mug(hx, hy, o.s); }
  if (sp.cupHold) { const [hx, hy] = handPt(o, -1); mug(hx, hy - 30 * o.s, o.s * 0.9, 0.12); }
  if (sp.toEar) { const [hx, hy] = handPt(o, 1); sf(rr(hx - 26 * o.s, hy - 150 * o.s, 60 * o.s, 130 * o.s, 12 * o.s), '#15151a', 4); }
  if (sp.neckBrace) { const [nx, ny] = localPt(o, 0, -530); sf(rr(nx - 120 * o.s, ny - 40 * o.s, 240 * o.s, 90 * o.s, 40 * o.s), '#f1efe9', 5); }
  if (sp.glassesBag) { const [hx, hy] = handPt(o, 1); sf(rr(hx - 70 * o.s, hy - 20 * o.s, 140 * o.s, 120 * o.s, 10 * o.s), 'rgba(220,235,245,0.55)', 4);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 7 * o.s / 0.55; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.roundRect(hx + sd * 30 * o.s - 26 * o.s, hy + 30 * o.s, 52 * o.s, 36 * o.s, 6); ctx.stroke(); } ctx.restore();
    line(hx - 10 * o.s, hy + 34 * o.s, hx + 20 * o.s, hy + 60 * o.s, '#f4f4ff', 3); }
  if (mira) miraFront(o, f, mira);
}
function mug(x, y, s, tilt = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  sf(rr(-46 * s, -60 * s, 92 * s, 110 * s, 14 * s), '#f2ede4', 5);
  ctx.strokeStyle = INK; ctx.lineWidth = L(6); ctx.beginPath(); ctx.arc(52 * s, -6 * s, 24 * s, -1.2, 1.2); ctx.stroke();
  fillR(-40 * s, -54 * s, 80 * s, 14 * s, '#5a3a24');
  ctx.restore();
}

// ---- 1. the rented house stairs (also the office stairs) --------------------------------------------------------
const GST = { x0: 420, fl: 990, rise: 58, run: 92, n: 11, gap: [5.5, 7.4] };
const gStep = k => [GST.x0 + (k - 0.5) * GST.run, GST.fl - clamp(k, 0, GST.n) * GST.rise];
const railY = x => GST.fl - ((x - GST.x0) / GST.run) * GST.rise - 235;
function gStairsSet(f, sh, ppl) {
  const off = sh.office, day = sh.day;
  const wallC = off ? '#7f858c' : day ? '#b9a787' : '#2a2a3a';
  fillR(-800, -400, 3600, 1900, wallC);
  ctx.save(); ctx.globalAlpha = off ? 0.1 : 0.16;
  if (off) for (let y = -400; y < 1100; y += 160) line(-800, y, 2800, y, '#3a3e44', 3);
  else for (let x = -800; x < 2800; x += 70) fillR(x, -400, 26, 1500, day ? '#8a7a5c' : '#46405c');
  ctx.restore();
  const top = GST.fl - GST.n * GST.rise, tx = GST.x0 + GST.n * GST.run;
  if (!off) {                                       // upstairs: a door to the bedroom, a framed photo on the wall
    sf(rr(tx + 160, top - 470, 230, 470, 8), day ? '#7a5a40' : '#1e1a26'); sf(rr(tx + 180, top - 450, 190, 440, 6), day ? '#8d6a4c' : '#161320', 4);
    sf(rr(tx + 330, top - 250, 22, 22, 11), '#c9a24a', 3);
    sf(rr(980, 330, 150, 120, 4), '#5a4030', 4); sf(rr(992, 342, 126, 96, 2), day ? '#c8b8a0' : '#3a3648', 3);
  } else { sf(rr(tx + 200, top - 420, 260, 420, 6), '#5d636b'); sf(rr(tx + 230, top - 380, 90, 120, 4), '#9fc3d8', 4); }
  fillR(tx - 10, top, 2000, 26, off ? '#5c6168' : '#5a3e2a'); fillR(tx - 10, top + 26, 2000, 1200, off ? '#6b7178' : '#3c2a20');
  fillR(-800, GST.fl, 3600, 700, off ? '#5d6066' : day ? '#7a5a3e' : '#3a2a20');
  const pts = [[GST.x0, GST.fl]];                   // the staircase, side on
  for (let k = 0; k < GST.n; k++) { pts.push([GST.x0 + k * GST.run, GST.fl - (k + 1) * GST.rise]); pts.push([GST.x0 + (k + 1) * GST.run, GST.fl - (k + 1) * GST.rise]); }
  pts.push([tx, GST.fl]);
  sf(poly(pts), off ? '#8a8e94' : day ? '#8a6444' : '#4a3426', 6);
  for (let k = 1; k <= GST.n; k++) fillR(GST.x0 + (k - 1) * GST.run, GST.fl - k * GST.rise, GST.run, 10, off ? '#a8acb2' : day ? '#a07850' : '#5c4230');
  ppl.forEach(o => drawG(o, f, sh));
  // the banister, in front of whoever is on the stairs; a section is missing on the house stairs
  const gap = off || sh.fixed ? null : [GST.x0 + GST.gap[0] * GST.run, GST.x0 + GST.gap[1] * GST.run];
  const railC = off ? '#9aa0a8' : '#3a2416';
  const seg2 = (x1, x2) => { line(x1, railY(x1), x2, railY(x2), INK, 26); line(x1, railY(x1), x2, railY(x2), railC, 16); };
  if (gap) { seg2(GST.x0 - 40, gap[0]); seg2(gap[1], tx + 30);
    for (const gx of gap) { const d = gx === gap[0] ? 1 : -1; sf(poly([[gx, railY(gx) - 12], [gx + d * 22, railY(gx) - 4], [gx + d * 8, railY(gx) + 10]]), '#c8a070', 3); } }
  else seg2(GST.x0 - 40, tx + 30);
  for (let k = 0; k <= GST.n * 2; k++) {
    const x = GST.x0 + k * GST.run / 2 + 10; if (gap && x > gap[0] - 6 && x < gap[1] + 6) continue;
    const yb = GST.fl - Math.ceil(k / 2 + 0.01) * GST.rise; line(x, yb, x, railY(x), off ? '#7a8088' : '#2e1c12', off ? 7 : 11);
  }
  if (gap) { const gx = (gap[0] + gap[1]) / 2; for (const dx of [-30, 30]) line(gx + dx, GST.fl - ((gx + dx - GST.x0) / GST.run) * GST.rise - 8, gx + dx, GST.fl - ((gx + dx - GST.x0) / GST.run) * GST.rise - 70, '#2e1c12', 11); }
  sf(rr(GST.x0 - 70, GST.fl - 330, 46, 330, 6), off ? '#7a8088' : '#3a2416'); sf(ell(GST.x0 - 47, GST.fl - 336, 30, 16), off ? '#7a8088' : '#4a2e1c');
}
function gStairsPeople(sh, f) {
  const out = [], c = sh.crew || {};
  for (const r of Object.keys(c)) {
    const sp = c[r]; let k = sp.step ?? 0;
    if (Array.isArray(k)) {
      const t = seg(f, sh.a + (sp.stepDelay || 0), sp.stepEnd != null ? sh.a + sp.stepEnd : sh.b - 6);
      if (sp.stepHold) { const n = Math.abs(k[1] - k[0]), u = t * n, i = Math.floor(u), fr = u - i; k = lerp(k[0], k[1], (i + ss(clamp(fr / 0.35))) / n); }
      else k = lerp(k[0], k[1], ss(t));
    }
    const [x, y] = gStep(k);
    const o = gPerson(r, sh, f, { x: x + (sp.dx || 0), y: y + 6, s: sp.s || 0.5 });
    if (!o) continue;
    const moving = Array.isArray(sp.step) && f < sh.b - 6;
    if (moving && !sp.stepHold) { o.walk = f * 0.32; o.walkAmt = 0.6; }
    if (sp.reach === 'gap') {                         // the right hand (screen-left) goes for the rail where it is missing
      const r0 = ss(seg(f, sh.a + 4, sh.beat ?? sh.a + 30));
      o.armR = lerp(0.22, 2.05, r0); o._reach = true;
      if (after(f, sh)) { const k2 = bT(f, sh, 10); o.lean = (o.lean || 0) + 0.18 * Math.sin(Math.PI * k2) * (1 - 0.3 * k2) - 0.05 * ss(seg(f, sh.beat + 10, sh.beat + 24)); o.tremble = 3; o.armR = lerp(2.05, 1.2, ss(clamp(k2 * 1.4))); }
    }
    out.push(o);
  }
  return out;
}

// ---- 2. bedroom: from above at night (Arjun lying in his clothes), side view by day -----------------------------------
function fanBlades(f, cx, cy, R, spin) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(f * spin);
  for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.globalAlpha = 0.42; sf(rr(40, -30, R, 60, 30), '#17131c', 0); ctx.globalAlpha = 0.14; ctx.save(); ctx.rotate(-0.12); sf(rr(40, -30, R, 60, 30), '#17131c', 0); ctx.restore(); }
  ctx.globalAlpha = 1; sf(ell(0, 0, 54, 54), '#211b28', 0); ctx.restore();
}
function gBedTopSet(f, sh, a) {
  fillR(-800, -400, 3600, 1900, '#4b3628');
  for (let x = -800; x < 2800; x += 120) line(x, -400, x, 1500, 'rgba(0,0,0,0.25)', 3);
  sf(rr(330, 40, 1260, 1040, 20), '#2d2838', 0);                                   // rug
  sf(rr(560, 100, 800, 980, 18), '#3c2a20');                                       // bed frame
  sf(rr(588, 128, 744, 924, 40), '#cfc9bc', 5);                                     // mattress (no sheet yet: just moved in)
  for (let y = 210; y < 1040; y += 150) line(600, y, 1320, y, 'rgba(120,110,95,0.25)', 3);
  sf(rr(330, 150, 210, 210, 10), '#4e3424');                                       // nightstand with the new keys
  ctx.save(); ctx.strokeStyle = '#c9b25c'; ctx.lineWidth = L(5); ctx.beginPath(); ctx.arc(420, 230, 18, 0, 7); ctx.stroke();
  for (const [dx, dy, r] of [[34, 6, 0.4], [26, 30, 1.1]]) { ctx.save(); ctx.translate(420 + dx, 230 + dy); ctx.rotate(r); sf(rr(-6, -4, 60, 14, 4), '#d6c27a', 3); ctx.restore(); }
  ctx.restore();
  if (sh.phoneGlow) {                              // his phone lighting up on silent
    const on = sh.phoneGlow === 'on' || (Math.floor((f - sh.a) / 40) % 2 === 0);
    sf(rr(440, 270, 70, 130, 12), '#111', 4); if (on) sf(rr(446, 278, 58, 114, 8), '#cfe3ff', 0);
  }
  for (const [bx, by, bw, bh] of [[120, 640, 280, 220], [160, 870, 240, 190]]) { sf(rr(bx, by, bw, bh, 6), '#a9824f'); fillR(bx + bw / 2 - 12, by, 24, bh, '#d4c59c'); }
  const d = sh.react === 'dip' ? (after(f, sh) ? ss(bT(f, sh, 26)) : 0) : sh.dip ? 1 : 0;
  if (d > 0 && a) {                                 // the mattress sinks beside his right shoulder: something sat down
    const [dx, dy] = localPt(a, -330, -470);
    const g = ctx.createRadialGradient(dx - 10, dy + 10, 6, dx, dy, 150); g.addColorStop(0, `rgba(20,14,24,${0.85 * d})`); g.addColorStop(0.6, `rgba(40,30,44,${0.45 * d})`); g.addColorStop(1, 'rgba(40,30,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(dx, dy, 120 + 20 * d, 150 + 25 * d, -0.15, 0, 7); ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.9 * d; ctx.strokeStyle = 'rgba(255,250,235,0.55)'; ctx.lineWidth = L(5);              // the lit rim of the hollow
    ctx.beginPath(); ctx.ellipse(dx + 6, dy - 8, 118 + 20 * d, 148 + 25 * d, -0.15, Math.PI * 1.05, Math.PI * 1.75); ctx.stroke();
    for (let i = 0; i < 9; i++) { const an = i / 9 * Math.PI * 2 + 0.3; line(dx + Math.cos(an) * 90, dy + Math.sin(an) * 115, dx + Math.cos(an) * (175 + 40 * d), dy + Math.sin(an) * (215 + 40 * d), 'rgba(60,50,60,0.8)', 4); }
    ctx.restore();
  }
  if (sh.ghostSmile && a) {                       // her face, there in the dip for a breath, smiling, then gone
    const t = (f - sh.a) / Math.max(1, sh.b - sh.a), al = 0.75 * ss(clamp((t - 0.42) / 0.12)) * (1 - ss(clamp((t - 0.78) / 0.1)));
    if (al > 0.01) { const [dx, dy] = localPt(a, -330, -470);
      const m = miraObj(dx, dy + 775 * 0.36, 0.36, f, { smile: true, creaseL: 1, creaseR: 1, alpha: al, look: 0, lookY: -0.2 });
      m.mouth = 'none'; guy(m); m.mouth = 'smile'; ctx.save(); ctx.globalAlpha = al; miraMouth(m); ctx.restore(); }
  }
  sf(rr(690, 150, 540, 180, 60), '#ece6da');                                        // pillow
  if (a) { guy(a); }
}
function gBedSideSet(f, sh, a) {                    // morning, from the side: the bed across the room
  const wg = ctx.createLinearGradient(0, 0, 0, 1000); wg.addColorStop(0, '#c7b49a'); wg.addColorStop(1, '#ad977a');
  ctx.fillStyle = wg; ctx.fillRect(-800, -400, 3600, 1500);
  sf(rr(1380, 180, 360, 420, 8), '#6e5440'); sf(rr(1400, 200, 320, 380, 4), '#f6e6c4', 4); line(1560, 200, 1560, 580, INK, 6); line(1400, 390, 1720, 390, INK, 6);
  ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff2cc'; ctx.beginPath(); ctx.moveTo(1400, 200); ctx.lineTo(1720, 200); ctx.lineTo(1300, 1000); ctx.lineTo(700, 1000); ctx.closePath(); ctx.fill(); ctx.restore();
  fillR(-800, 1000, 3600, 600, '#6b4c34');
  for (const [bx, by, bw, bh] of [[-60, 760, 280, 240], [160, 820, 220, 180]]) { sf(rr(bx, by, bw, bh, 6), '#b08a56'); fillR(bx + bw / 2 - 12, by, 24, bh, '#d8c8a0'); }
  sf(rr(300, 760, 1000, 200, 14), '#4a3428');                                       // bed frame
  sf(rr(320, 690, 960, 110, 40), '#d6cfc1');                                        // mattress
  sf(rr(330, 640, 260, 100, 44), '#efe9de');                                        // pillow (left)
  if (a) guy(a);
  sf(poly([[700, 700], [1290, 690], [1300, 800], [690, 810]]), '#5d6b8a');          // his legs under the crumpled blanket
  ctx.save(); ctx.globalAlpha = 0.35; for (let i = 0; i < 5; i++) line(760 + i * 110, 705, 720 + i * 120, 800, '#3a4560', 4); ctx.restore();
}

// ---- 3. the office: day, Diwali evening, night, the meeting room ------------------------------------------------------
function cityWindows(f, mode) {
  const sky = ctx.createLinearGradient(0, 160, 0, 560);
  const cols = { day: ['#9cc2e2', '#d6e6f0'], diwali: ['#2b2350', '#c46a4a'], night: ['#070a1c', '#18203e'], meeting: ['#a6c6e0', '#dce8f0'] }[mode] || ['#9cc2e2', '#d6e6f0'];
  sky.addColorStop(0, cols[0]); sky.addColorStop(1, cols[1]);
  ctx.fillStyle = sky; ctx.fillRect(140, 160, 1640, 400);
  for (let i = 0; i < 16; i++) {                    // skyline
    const bx = 140 + i * 104, bh = 120 + (i * 53) % 180, c = mode === 'day' || mode === 'meeting' ? '#7d8fa3' : '#141a30';
    fillR(bx, 560 - bh, 96, bh, c);
    if (mode !== 'day' && mode !== 'meeting') for (let w = 0; w < 10; w++) if (rnd(i * 13 + w) > 0.45) fillR(bx + 10 + (w % 4) * 20, 570 - bh + 14 + Math.floor(w / 4) * 30, 10, 14, mode === 'diwali' && rnd(w + i) > 0.6 ? '#ffb347' : '#ffe8a8');
  }
  for (let x = 140; x <= 1780; x += 410) line(x, 160, x, 560, '#4a4f58', 14);
  line(140, 160, 1780, 160, '#4a4f58', 14); line(140, 560, 1780, 560, '#4a4f58', 14);
}
function stringLights(f, y0, sag, cols) {
  const pts = []; for (let x = -100; x <= 2020; x += 20) { const u = ((x + 100) % 420) / 420; pts.push([x, y0 + sag * Math.sin(Math.PI * u)]); }
  ctx.save(); ctx.strokeStyle = '#2a2a1a'; ctx.lineWidth = L(3); ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
  pts.forEach(([x, y], i) => { if (i % 3) return; const c = cols[(i / 3) % cols.length]; const tw = 0.6 + 0.4 * noise1(f * 0.15 + i);
    ctx.save(); ctx.globalAlpha = tw; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y + 8, 7, 0, 7); ctx.fill(); ctx.restore(); });
}
function gOfficeSet(f, sh, ppl) {
  const mode = sh.mode || 'day';
  const wallC = { day: '#cfcbc2', diwali: '#8e7c78', night: '#2c3040', meeting: '#d5d2ca' }[mode];
  fillR(-800, -400, 3600, 1600, wallC);
  fillR(-800, -400, 3600, 120, mode === 'night' ? '#1c1f2a' : '#b9b5ac');           // ceiling band with light panels
  for (let x = 100; x < 1900; x += 420) sf(rr(x, -380, 240, 60, 4), mode === 'night' ? '#3a3e4a' : '#f4f2ea', 3);
  cityWindows(f, mode);
  if (mode === 'meeting') {                         // meeting room: a screen with a chart, a long table
    sf(rr(700, 200, 520, 300, 8), '#22252c'); sf(rr(716, 216, 488, 268, 4), '#e8eef4', 3);
    for (let i = 0; i < 6; i++) fillR(760 + i * 72, 440 - (40 + (i * 37) % 160), 44, 40 + (i * 37) % 160, ['#3a7ab8', '#e0864a'][i % 2]);
  }
  fillR(-800, 1000, 3600, 600, mode === 'night' ? '#20232c' : '#7d8088');
  if (mode !== 'meeting') {                         // cubicle partitions with monitors
    for (let x = -200; x < 2100; x += 380) {
      sf(rr(x, 600, 360, 190, 6), mode === 'night' ? '#2a3240' : '#6d7b8b', 5);
      sf(rr(x + 120, 520, 140, 92, 6), '#1c1f26', 4); fillR(x + 130, 530, 120, 70, mode === 'night' ? '#9fc0ff' : '#cfe0ee');
      line(x + 190, 612, x + 190, 600, INK, 8);
    }
  }
  if (mode === 'diwali') {
    stringLights(f, -60, 70, ['#ffb347', '#ff5a7a', '#ffe066', '#7ad8ff', '#a8ff7a']);
    stringLights(f, 40, 50, ['#ffe066', '#ff7a3a', '#ff5a7a']);
    for (const [lx, c] of [[300, '#e8642a'], [960, '#d84a6a'], [1620, '#e8a02a']]) {   // paper lanterns
      line(lx, -400, lx, 70, '#3a2a1a', 3); sf(ell(lx, 130, 52, 66), c, 5); fillR(lx - 30, 64, 60, 12, '#3a2a1a'); fillR(lx - 30, 192, 60, 12, '#3a2a1a');
    }
    for (let x = -200; x < 2100; x += 32) sf(ell(x, 600 + 10 * Math.sin(x * 0.02), 15, 15), ['#ff9a1a', '#ffc21a'][(x / 32) & 1], 2);   // marigold garland
    sf(rr(80, 560, 330, 24, 4), '#5a4030');                                         // the shelf with the propped phone
    const ph = sh.phoneShelf !== false;
    if (ph) { sf(rr(200, 420, 90, 140, 12), '#141418', 4); fillR(208, 430, 74, 120, '#2a3c5a');
      if (sh.timer && after(f, sh) === false) { const blink = Math.floor((f - sh.a) / 10) % 2; ctx.save(); ctx.fillStyle = blink ? '#ff4a4a' : '#5a1a1a'; ctx.beginPath(); ctx.arc(245, 448, 9, 0, 7); ctx.fill(); ctx.restore(); } }
  }
  if (mode === 'meeting') {
    ppl.filter(o => o && o.noLegs).forEach(o => drawG(o, f, sh));
    sf(rr(160, 780, 1600, 60, 10), '#6a5040'); fillR(200, 840, 1520, 160, '#4a3830');
    for (const [cx, w] of [[420, 1], [900, 1], [1450, 1]]) { sf(rr(cx, 744, 120, 40, 6), '#e8e4dc', 3); }
    ppl.filter(o => o && !o.noLegs).forEach(o => drawG(o, f, sh));
    return;
  }
  ppl.forEach(o => drawG(o, f, sh));
  if (sh.cupFx) cupFx(f, sh, ppl);
}
function cupFx(f, sh, ppl) {                       // the cup slips from Arjun's hand; Rohan catches it
  const ar = ppl.find(o => o && o._role === 'arjun'), ro = ppl.find(o => o && o._role === 'rohan');
  if (!ar || !ro) return;
  const [hx, hy] = handPt(ar, 1);
  if (!after(f, sh)) { mug(hx, hy - 30 * ar.s, ar.s * 0.9); return; }
  const t = f - sh.beat, fall = Math.min(t, 7), [cx, cy] = handPt(ro, -1);
  const fx = lerp(hx, cx, clamp(t / 7)), fy = hy - 30 * ar.s + 40 * fall * fall * 0.35 * ar.s;
  if (t < 7) mug(fx, fy, ar.s * 0.9, 0.5 * t / 7); else mug(cx, cy - 30 * ro.s, ro.s * 0.9, 0.12);
  if (t >= 6 && t < 12) { ctx.save(); ctx.fillStyle = '#6a4024'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(cx + (rnd(i) - 0.5) * 60, cy - 70 - (t - 6) * 6 + rnd(i + 3) * 20, 5, 0, 7); ctx.fill(); } ctx.restore(); }
}

// ---- 4. hospital exam room -----------------------------------------------------------------------------------------
function gExamSet(f, sh, ppl) {
  fillR(-800, -400, 3600, 1500, '#b9cbc0'); fillR(-800, 640, 3600, 360, '#a7bbb0');
  line(-800, 640, 2800, 640, '#8fa398', 8);
  fillR(-800, 1000, 3600, 600, '#8f9a96');
  for (let x = -800; x < 2800; x += 140) line(x, 1000, x - 80, 1600, 'rgba(0,0,0,0.12)', 3);
  sf(rr(1340, 260, 300, 200, 6), '#f4f6f2', 5);                                     // eye chart
  ctx.save(); ctx.fillStyle = INK; ctx.textAlign = 'center'; [['E', 70], ['F P', 44], ['T O Z', 30], ['L P E D', 22]].forEach(([t, s], i) => { ctx.font = `bold ${s}px "DejaVu Sans"`; ctx.fillText(t, 1490, 320 + i * 40); }); ctx.restore();
  sf(rr(160, 300, 90, 160, 10), '#e4e8ea', 4); sf(ell(205, 340, 30, 30), '#f8f8f8', 3); line(205, 460, 205, 560, '#5a6670', 5);   // BP gauge
  sf(rr(1060, 690, 520, 70, 16), '#7aa0b8'); sf(rr(1080, 760, 480, 240, 10), '#d8dee2');                   // exam couch
  fillR(1090, 676, 500, 18, '#f4f4ee');
  sf(rr(120, 720, 420, 30, 6), '#8a7a6a'); fillR(140, 750, 20, 250, '#5a4a40'); fillR(500, 750, 20, 250, '#5a4a40');           // desk
  sf(rr(230, 580, 200, 140, 8), '#2a2e36'); fillR(244, 594, 172, 110, '#dfe9f2');
  for (let i = 0; i < 5; i++) fillR(258, 608 + i * 18, 130 - (i % 2) * 40, 8, '#7a8aa0');
  // the stool Arjun sits on; scrapes back when he grabs it
  const sc = sh.scrape && after(f, sh) ? ss(bT(f, sh, 12)) * 60 : 0;
  ppl.filter(o => o && o._role === 'arjun' && o.noLegs).forEach(o => drawG(o, f, sh));
  sf(rr(820 + sc, 860, 220, 40, 10), '#2e3a48'); for (const dx of [20, 180]) fillR(820 + sc + dx, 900, 20, 100, '#4a5562');
  ppl.filter(o => o && !(o._role === 'arjun' && o.noLegs)).forEach(o => drawG(o, f, sh));
}

// ---- 5. the photo on Rohan's phone ----------------------------------------------------------------------------------
const GROUP = { cw1: 470, cw2: 720, rohan: 960, arjun: 1200, cw3: 1440 };
function groupCrew(miraOn, smileArjun = true) {
  const C = (x, e, extra) => Object.assign({ x, expr: e, look: 0 }, extra || {});
  return { cw1: C(GROUP.cw1, 'relieved'), cw2: C(GROUP.cw2, 'relieved', { armR: 0.5 }), rohan: C(GROUP.rohan, 'relieved', { armR: 0.4 }),
           arjun: C(GROUP.arjun, smileArjun ? 'relieved' : 'tired', Object.assign({ tiltR: 0.8 }, miraOn ? { mira: { look: 0 } } : {})), cw3: C(GROUP.cw3, 'relieved') };
}
function drawGroupPhoto(f0, sh, miraOn) {          // the timer photo, frozen at the flash
  const fake = { a: sh.a, b: sh.b, beat: null, crew: groupCrew(miraOn), mode: 'diwali', phoneShelf: false, env: null };
  const ppl = Object.keys(fake.crew).map(r => gPerson(r, fake, f0, { x: GROUP[r], y: 1000, s: 0.52 }));
  ppl.forEach(o => { if (o) { o.blink = 0; o.bob = 0; o.tremble = 0; o.talk = false; } });
  gOfficeSet(f0, fake, ppl);
}
function gPhotoSet(f, sh) {
  fillR(-800, -400, 3600, 1900, '#15161c');
  for (let i = 0; i < 9; i++) { ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = ['#ffb347', '#7ad8ff', '#ff5a7a'][i % 3]; ctx.beginPath(); ctx.arc(rnd(i) * 1920, rnd(i + 9) * 1080, 60 + rnd(i + 4) * 80, 0, 7); ctx.fill(); ctx.restore(); }
  sf(rr(300, 150, 1320, 760, 70), '#0c0c10', 8);                                   // phone, held sideways
  const S = { x: 350, y: 195, w: 1220, h: 670 };
  const z = anim(sh.zoom || 1, f, sh), zc = sh.zc ? [anim(sh.zc[0], f, sh), anim(sh.zc[1], f, sh)] : [960, 560];
  ctx.save(); ctx.beginPath(); ctx.roundRect(S.x, S.y, S.w, S.h, 30); ctx.clip();
  ctx.fillStyle = '#000'; ctx.fillRect(S.x, S.y, S.w, S.h);
  const k = S.w / 1920 * z, _cz = CZ; CZ = CZ * k;
  ctx.translate(S.x + S.w / 2, S.y + S.h / 2); ctx.scale(k, k); ctx.translate(-zc[0], -zc[1]);
  drawGroupPhoto(sh.photoFrame || 90, sh, true);
  CZ = _cz; ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.roundRect(S.x, S.y, S.w, S.h, 30); ctx.clip();     // flash-lit look: hard light, a little blown out
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,248,235,0.13)'; ctx.fillRect(S.x, S.y, S.w, S.h); ctx.restore();
  if (sh.pinch) {                                   // two fingers spreading on the glass
    const p = after(f, sh) ? 1 : ss(seg(f, sh.a, sh.a + 30)), cx = 960, cy = 560, d = lerp(60, 220, p);
    for (const sd of [-1, 1]) sf(ell(cx + sd * d, cy + sd * d * 0.4 + 160, 60, 90, sd * 0.5), '#c98d62', 6);
  }
  for (const sd of [-1, 1]) sf(rr(sd < 0 ? 210 : 1590, 600, 120, 260, 50), '#c98d62', 6);   // his hands on the sides
}

// ---- 6. the laptop: the listing, the search, the old news clipping ---------------------------------------------------
function houseDrawing(x, y, s, night) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  fillR(-400, -300, 800, 600, night ? '#1a2240' : '#9fb8d0');
  sf(rr(-260, -60, 520, 300, 4), '#cdbb9c'); sf(poly([[-300, -60], [0, -250], [300, -60]]), '#7a3a2a');
  for (const [wx, wy] of [[-180, 0], [80, 0], [-180, 130]]) { sf(rr(wx, wy, 100, 80, 4), night ? '#ffd68a' : '#3a4a5a', 4); }
  sf(rr(80, 120, 90, 120, 4), '#5a3a2a', 4); fillR(-400, 240, 800, 60, '#4a5a3a');
  ctx.restore();
}
function gScreenSet(f, sh) {
  fillR(-800, -400, 3600, 1900, '#0e1018');
  sf(rr(180, 60, 1560, 960, 30), '#22252e', 8); sf(rr(210, 90, 1500, 900, 12), '#f3f3f0', 0);
  fillR(210, 90, 1500, 70, '#dfe1e6'); sf(rr(400, 106, 1000, 40, 20), '#ffffff', 3);
  ctx.save(); ctx.font = '26px "DejaVu Sans"'; ctx.fillStyle = '#4a4f5a'; ctx.textBaseline = 'middle';
  const page = sh.page || 'listing';
  ctx.fillText(page === 'news' ? 'archive.cityexpress.in/2009/03/14' : page === 'search' ? 'search' : 'homes4rent.in/listing/7-lakeview-lane', 430, 126);
  ctx.restore();
  ctx.save(); ctx.fillStyle = '#1d2230'; ctx.textBaseline = 'alphabetic';
  if (page === 'listing') {
    houseDrawing(620, 560, 1.0, false);
    ctx.font = 'bold 54px "DejaVu Sans"'; ctx.fillText('House for rent', 1080, 300);
    ctx.font = '34px "DejaVu Sans"'; ctx.fillStyle = '#4a5060'; ctx.fillText('No. 7, Lakeview Lane', 1080, 360);
    ctx.fillText('2 bedrooms · furnished', 1080, 420); ctx.fillStyle = '#1f7a4a'; ctx.font = 'bold 40px "DejaVu Sans"'; ctx.fillText('Available immediately', 1080, 500);
    ctx.fillStyle = '#7a8090'; ctx.font = '28px "DejaVu Sans"'; ctx.fillText('Shared by Arjun', 1080, 580);
  } else if (page === 'search') {
    const q = '7 Lakeview Lane', n = Math.floor(q.length * clamp((f - sh.a) / Math.max(1, (sh.b - sh.a) * 0.55)));
    sf(rr(460, 260, 1000, 90, 45), '#fff', 3); ctx.font = '40px "DejaVu Sans"'; ctx.fillText(q.slice(0, n) + (Math.floor(f / 8) % 2 ? '|' : ''), 510, 320);
    if (n >= q.length) for (let i = 0; i < 4; i++) { ctx.fillStyle = '#1a4ab0'; ctx.font = '32px "DejaVu Sans"'; ctx.fillText(['House for rent · No. 7, Lakeview Lane', 'Lakeview Lane – local area guide', 'City Express archive · March 2009', 'Lakeview Lane map'][i], 470, 430 + i * 110);
      ctx.fillStyle = '#5a6070'; ctx.font = '24px "DejaVu Sans"'; ctx.fillText('…', 470, 466 + i * 110); }
  } else {                                          // the clipping
    sf(rr(330, 190, 1260, 760, 4), '#e9dfc4', 4);
    ctx.fillStyle = '#2a241c'; ctx.font = 'bold 40px "DejaVu Serif"'; ctx.textAlign = 'center'; ctx.fillText('THE CITY EXPRESS', 960, 250);
    line(360, 270, 1560, 270, '#2a241c', 3); ctx.font = 'bold 50px "DejaVu Serif"'; ctx.fillText('Girl, 12, dies after fall on staircase at home', 960, 340);
    ctx.textAlign = 'left'; ctx.font = '22px "DejaVu Serif"'; ctx.fillStyle = '#4a4232';
    for (let i = 0; i < 12; i++) fillR(380, 420 + i * 36, 520 - (i % 4) * 30, 10, '#9a8e72');
    ctx.restore(); ctx.save();
    ctx.save(); ctx.beginPath(); ctx.rect(960, 400, 300, 230); ctx.clip(); houseDrawing(1110, 515, 0.4, false); ctx.restore(); sf(rr(960, 400, 300, 230, 2), null, 4);
    sf(rr(1290, 400, 260, 320, 2), '#d8ccb0', 4);   // her school portrait, grinning
    ctx.save(); ctx.beginPath(); ctx.rect(1290, 400, 260, 320); ctx.clip(); fillR(1290, 400, 260, 320, '#a8b4c0');
    const _cz = CZ; guy(miraObj(1420, 760, 0.42, f, { alive: true, smile: true, creaseL: 1, creaseR: 1, look: 0 })); CZ = _cz; ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#d8c8a0'; ctx.fillRect(960, 400, 590, 320); ctx.restore();
    ctx.fillStyle = '#2a241c'; ctx.font = 'italic 24px "DejaVu Serif"'; ctx.fillText('Mira Sen, 12', 1330, 752);
  }
  ctx.restore();
}

// ---- 7. calling Arjun -------------------------------------------------------------------------------------------------
function gCallSet(f, sh) {
  fillR(-800, -400, 3600, 1900, '#0d0f16');
  for (let i = 0; i < 7; i++) { ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#ffe8b0'; ctx.beginPath(); ctx.arc(200 + i * 260, 300 + (i % 3) * 200, 90, 0, 7); ctx.fill(); ctx.restore(); }
  sf(rr(740, 110, 440, 860, 60), '#0a0a0e', 8); sf(rr(764, 140, 392, 800, 40), '#1a2236', 0);
  ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = '#e8eef8';
  sf(ell(960, 380, 90, 90), '#5a6a8a', 4); ctx.font = 'bold 90px "DejaVu Sans"'; ctx.textBaseline = 'middle'; ctx.fillText('A', 960, 384);
  ctx.font = '54px "DejaVu Sans"'; ctx.fillText('Arjun', 960, 540);
  const vm = sh.call === 'voicemail' && (sh.beat == null || after(f, sh));
  ctx.font = '32px "DejaVu Sans"'; ctx.fillStyle = vm ? '#ff8a7a' : '#aab4c8'; ctx.fillText(vm ? 'Voicemail' : 'Calling' + '...'.slice(0, 1 + Math.floor(f / 12) % 3), 960, 600);
  ctx.restore();
  if (!vm) rings(960, 380, f, sh.a, sh.b, '#9fb8ff', 16, 160, -Math.PI / 2 + 0.0001);
  sf(ell(960, 840, 56, 56), '#e0443a', 4); line(930, 840, 990, 840, '#fff', 10);
  sf(rr(690, 520, 90, 300, 40), '#c98d62', 6); sf(rr(1140, 480, 80, 260, 36), '#c98d62', 6);   // his hand
}

// ---- 8. the drive: Rohan behind the wheel at night; the navigation; the street sign ---------------------------------------
function gDriveSet(f, sh, ro) {
  fillR(-800, -400, 3600, 1900, '#07080d');
  sf(rr(380, 120, 1160, 520, 30), '#0d1018', 0);                                   // the rear window behind him: the road he left
  for (let i = 0; i < 8; i++) { const x = 400 + ((f * 9 + i * 160) % 1160); ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = i % 2 ? '#ffcf7a' : '#ff6a5a';
    ctx.beginPath(); ctx.arc(x, 360 + (i % 3) * 30, 8, 0, 7); ctx.fill(); ctx.restore(); }
  sf(rr(440, 520, 1040, 300, 40), '#1a1c26', 0);                                    // seat back
  sf(rr(560, 300, 300, 520, 60), '#22242e', 5);                                     // his headrest + seat
  if (ro) drawG(ro, f, sh);
  const ga = sh.grip != null ? anim(sh.grip, f, sh) : 0;
  ctx.save(); ctx.translate(820, 830); ctx.rotate(-0.05 + 0.02 * Math.sin(f * 0.03));    // steering wheel
  ctx.strokeStyle = INK; ctx.lineWidth = L(54); ctx.beginPath(); ctx.ellipse(0, 0, 250, 150, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  ctx.strokeStyle = '#4a4e5e'; ctx.lineWidth = L(40); ctx.stroke(); ctx.strokeStyle = 'rgba(200,210,255,0.25)'; ctx.lineWidth = L(8); ctx.stroke(); ctx.restore();
  for (const sd of [-1, 1]) sf(ell(820 + sd * 200, 742 + ga * 10, 52, 40 - ga * 6), '#e2a882', 6);     // his hands on the wheel
  fillR(-800, 860, 3600, 800, '#101219'); fillR(-800, 860, 3600, 16, '#2a2d38');      // dashboard
  sf(rr(1240, 690, 150, 180, 16), '#0a0a0e', 5); fillR(1252, 702, 126, 156, '#1a3a6a');   // phone in the mount (screen toward him)
  for (const sd of [-1, 1]) sf(poly([[sd < 0 ? -200 : 2120, -400], [sd < 0 ? 140 : 1780, -400], [sd < 0 ? 300 : 1620, 1100], [sd < 0 ? -40 : 1960, 1100]]), '#050508', 0);   // pillars
  ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = '#ffffff'; const rx = ((f * 6) % 2400) - 400;
  ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx + 140, 0); ctx.lineTo(rx - 160, 1080); ctx.lineTo(rx - 300, 1080); ctx.closePath(); ctx.fill(); ctx.restore();
}
function gNavSet(f, sh) {
  fillR(-800, -400, 3600, 1900, '#06070a');
  sf(rr(260, 90, 1400, 900, 60), '#0a0a0e', 8); fillR(300, 130, 1320, 820, '#1c2433');
  ctx.save(); ctx.beginPath(); ctx.rect(300, 130, 1320, 820); ctx.clip();
  for (let i = 0; i < 9; i++) { line(300 + i * 170 - (f % 40), 130, 200 + i * 170 - (f % 40), 950, '#2c374a', 18); line(300, 200 + i * 100, 1620, 160 + i * 100, '#2c374a', 12); }
  ctx.strokeStyle = '#4a9aff'; ctx.lineWidth = L(26); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(960, 960); ctx.lineTo(960, 520); ctx.lineTo(640, 520); ctx.lineTo(640, 330); ctx.stroke();
  sf(poly([[960, 700], [930, 760], [990, 760]]), '#ffffff', 4);
  sf(ell(640, 300, 34, 34), '#ff4a4a', 4);
  ctx.restore();
  sf(rr(300, 130, 1320, 170, 0), '#1f6a4a', 0);
  ctx.save(); ctx.fillStyle = '#fff'; ctx.font = 'bold 64px "DejaVu Sans"'; ctx.textBaseline = 'middle';
  ctx.fillText('↰  200 m', 340, 215); ctx.font = '40px "DejaVu Sans"'; ctx.fillText('Lakeview Lane', 760, 215);
  fillR(300, 870, 1320, 80, '#11151e'); ctx.font = '34px "DejaVu Sans"'; ctx.fillStyle = '#9fe0b0'; ctx.fillText('2 min · 0.6 km · No. 7, Lakeview Lane', 340, 910);
  ctx.restore();
}
function gSignSet(f, sh) {
  fillR(-800, -400, 3600, 1900, '#05060a');
  fillR(-800, 700, 3600, 900, '#121318');
  for (let i = 0; i < 6; i++) fillR(((i * 420 - f * 26) % 2600 + 2600) % 2600 - 400, 880, 200, 14, '#6a6a5a');
  const x = 1500 - (f - sh.a) * 9;
  fillR(x - 8, 250, 16, 500, '#3a3e44'); sf(rr(x - 230, 200, 460, 120, 10), '#1e6a3e', 5);
  ctx.save(); ctx.fillStyle = '#f0f4f0'; ctx.font = 'bold 54px "DejaVu Sans"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('LAKEVIEW LANE', x, 262); ctx.restore();
}

// ---- 9. the hospital room: from Rohan's bed, and Rohan in the bed --------------------------------------------------------
function gHospPovSet(f, sh, ppl) {
  fillR(-800, -400, 3600, 1900, '#9fb1aa');
  fillR(-800, -400, 3600, 560, '#c9d2cc'); sf(rr(560, -20, 800, 110, 6), '#f4f6ee', 4);     // the strip of ceiling with its light
  line(-800, 160, 2800, 160, '#7f918a', 8);
  sf(rr(1440, 300, 280, 640, 6), '#c4b49a'); sf(rr(1520, 380, 120, 160, 4), '#a8c8d8', 4); sf(ell(1460, 640, 12, 12), '#8a8a8a', 3);   // door
  line(320, 260, 320, 940, '#8a9096', 10); sf(rr(270, 270, 110, 150, 20), 'rgba(220,240,250,0.6)', 4);   // drip stand
  fillR(-800, 940, 3600, 600, '#7f8a86');
  ppl.forEach(o => drawG(o, f, sh));
  sf(poly([[-200, 1100], [-100, 960], [700, 930], [1300, 930], [2100, 960], [2200, 1100]]), '#c8d8e4', 6);   // his blanket, the end of the bed
  for (const dx of [-140, 140]) sf(ell(960 + dx, 960, 120, 60), '#c0d0dc', 5);
  sf(rr(-200, 1010, 2400, 40, 10), '#9aa4ac', 5);
}
function gHospBedSet(f, sh, ro) {                   // close on Rohan: head on the pillow, neck brace, only the eyes move
  fillR(-800, -400, 3600, 1900, '#8fa29a');
  sf(rr(560, 180, 800, 360, 120), '#eef0ea', 6);                                    // pillow
  if (ro) drawG(ro, f, sh);
  sf(poly([[260, 1100], [380, 820], [1540, 820], [1660, 1100]]), '#c8d8e4', 6);      // blanket up to his chest
  sf(rr(1500, 300, 300, 200, 12), '#1a1e24', 5); fillR(1520, 320, 260, 160, '#0a1410');   // monitor at the edge
  const live = sh.flat ? 0 : 1;
  ctx.save(); ctx.strokeStyle = '#4aff8a'; ctx.lineWidth = L(4); ctx.beginPath();
  for (let i = 0; i <= 52; i++) { const x = 1530 + i * 5, ph = (i + f * 2) % 52, y = 410 - live * (ph > 20 && ph < 24 ? (ph === 22 ? 60 : 20) : 0); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke(); ctx.restore();
}

function crewList(sh, f, base, scale) {
  const c = sh.crew || {}, out = [];
  for (const r of Object.keys(c)) out.push(gPerson(r, sh, f, Object.assign({}, base, { x: c[r].x ?? base.x, s: c[r].s || scale })));
  return out.filter(Boolean);
}
function posOf(sh, role, f) { const sp = (sh.crew || {})[role]; if (!sp) return null; return sp.walk ? sp.walk[1] : sp.x; }

Object.assign(SCENES, {
  gStairs: {
    frames: { wide: [930, 640, 1.0], gap: [GST.x0 + 5.6 * GST.run, GST.fl - 5.6 * GST.rise - 250, 1.9], top: [GST.x0 + 9 * GST.run, GST.fl - 9 * GST.rise - 230, 1.8] },
    frameFn(sh, name) {
      const sp = (sh.crew || {})[name === 'hero' ? 'arjun' : name]; if (!sp) return null;
      const k = Array.isArray(sp.step) ? (sp.step[0] + sp.step[1]) / 2 : (sp.step ?? 0), [x, y] = gStep(k);
      return [x + 30, y - 300, name === 'arjun' && sh.cam === 'close' ? 2.3 : 2.0];
    },
    ambient: '#5a5f8c',
    draw(f, sh) { gStairsSet(f, sh, gStairsPeople(sh, f)); },
    lights(l, f, sh) {
      if (sh.office) { light(l, 900, 100, 1400, '#e8f0ff', 1.0); return; }
      if (sh.day) { light(l, 1500, 200, 1600, '#fff0d0', 1.0); light(l, 400, 800, 900, '#ffe0b0', 0.6); return; }
      light(l, 1500, 320, 700, '#ffcf8a', 0.75); light(l, 300, 700, 800, '#7a8cd0', 0.55);
    },
  },
  gBedTop: {
    frames: { wide: [960, 560, 0.95], hero: [960, 420, 1.7], face: [1000, 400, 2.1], dip: [820, 500, 1.7], phone: [720, 390, 1.5] },
    ambient: '#424a80',
    draw(f, sh) {
      const sp = (sh.crew || {}).arjun || {};
      const a = gPerson('arjun', sh, f, { x: 960, y: 920, s: 0.68 });
      if (a) { a.look = sp.look ?? 0; if (sp.sleep) { a.lid = 1; a.blink = 0; a.mouth = 'flat'; a.brow = 'flat'; a.tremble = 0; a.sweat = false; a.bob = 0; } }
      gBedTopSet(f, sh, a);
      if (sh.fan !== false) fanBlades(f, 1130, 760, 300, sh.fanSpin ?? 0.07);
    },
    lights(l, f, sh) {
      light(l, 1500, 300, 1000, '#8fa3e8', 0.8);
      if (sh.phoneGlow) light(l, 475, 335, 260, '#cfe3ff', sh.phoneGlow === 'on' || Math.floor((f - sh.a) / 40) % 2 === 0 ? 0.9 : 0.15);
    },
  },
  gBedSide: {
    frames: { wide: [900, 600, 1.0], hero: [560, 560, 2.0] },
    ambient: '#a89a88',
    draw(f, sh) {
      const sp = (sh.crew || {}).arjun || {};
      const a = gPerson('arjun', sh, f, { x: 820, y: 740, s: 0.55, noLegs: true });
      if (a && sp.rise) {                             // sitting up from the pillow: the right shoulder lags, he rubs it, tries again
        const r = sp.rise, t1 = ss(seg(f, sh.a + 8, sh.a + 34)), t2 = ss(seg(f, sh.a + (r.again || 70), sh.a + (r.again || 70) + 24));
        a.lean = lerp(-1.45, -0.42, t1) + lerp(0, 0.34, t2) + (sp.tiltR ? -0.05 : 0);
      }
      gBedSideSet(f, sh, a);
    },
    lights(l, f, sh) { light(l, 1560, 380, 1400, '#fff2d0', 1.0); light(l, 500, 600, 900, '#ffe6c0', 0.5); },
  },
  gOffice: {
    frames: { wide: [960, 600, 1.0], two: [960, 640, 1.45] },
    frameFn(sh, name) {
      const x = posOf(sh, name, 0); if (x == null) return null;
      const sp = sh.crew[name]; const s = sp.s || (sh.mode === 'meeting' && sp.noLegs ? 0.5 : 0.52);
      const y = sp.noLegs ? (sp.y ?? 1000) : 1000;
      return [x + (sp.fx || 0), y - 775 * s + 10, sh.cam === 'close' ? 2.1 : 1.7];
    },
    ambient: '#9a98a0',
    draw(f, sh) {
      const ppl = crewList(sh, f, { x: 960, y: 1000 }, 0.52);
      gOfficeSet(f, sh, ppl);
    },
    lights(l, f, sh) {
      const m = sh.mode || 'day';
      if (m === 'night') { light(l, 960, 560, 900, '#7a8ac8', 0.6); light(l, 960, 600, 500, '#bcd0ff', 0.5); return; }
      if (m === 'diwali') { for (let x = 0; x <= 1920; x += 160) light(l, x, 60, 380, ['#ffb347', '#ff7a8a', '#ffe066'][(x / 160) % 3], 0.55); light(l, 960, 700, 1300, '#ffd9a8', 0.75);
        if (sh.flashAt != null && f >= sh.a + sh.flashAt && f < sh.a + sh.flashAt + 6) light(l, 245, 480, 3000, '#ffffff', 3); return; }
      light(l, 960, 300, 1700, '#f8f6f0', 1.05);
    },
  },
  gExam: {
    frames: { wide: [960, 620, 1.0] },
    frameFn(sh, name) { const x = posOf(sh, name, 0); if (x == null) return null; const sp = sh.crew[name]; const y = sp.y ?? 1000, s = sp.s || 0.52;
      return [x, y - 775 * s + 10, sh.cam === 'close' ? 2.1 : 1.7]; },
    ambient: '#b8c4c0',
    draw(f, sh) { gExamSet(f, sh, crewList(sh, f, { x: 960, y: 1000 }, 0.52)); },
    lights(l) { light(l, 960, 100, 1800, '#f6fbff', 1.05); light(l, 330, 650, 300, '#dfefff', 0.4); },
  },
  gPhoto: {
    frames: { wide: [960, 540, 1.0] },
    ambient: '#4a4a5a',
    draw(f, sh) { gPhotoSet(f, sh); },
    lights(l) { l.fillStyle = '#ffffff'; l.fillRect(350, 195, 1220, 670); light(l, 960, 540, 1100, '#c8d0ff', 0.6); },
  },
  gScreen: {
    frames: { wide: [960, 540, 1.0], portrait: [1420, 570, 2.6], headline: [960, 340, 1.6] },
    ambient: '#5a5f78',
    draw(f, sh) { gScreenSet(f, sh); },
    lights(l) { l.fillStyle = '#ffffff'; l.fillRect(210, 90, 1500, 900); },
  },
  gCall: {
    frames: { wide: [960, 540, 1.0], screen: [960, 520, 1.5] },
    ambient: '#3a3f58',
    draw(f, sh) { gCallSet(f, sh); },
    lights(l) { l.fillStyle = '#ffffff'; l.fillRect(764, 140, 392, 800); light(l, 960, 540, 900, '#9fb8ff', 0.5); },
  },
  gDrive: {
    frames: { wide: [960, 560, 1.0], hero: [820, 430, 1.9] },
    ambient: '#4a5078',
    draw(f, sh) { gDriveSet(f, sh, gPerson('rohan', sh, f, { x: 820, y: 900, s: 0.66, noLegs: true })); },
    lights(l, f, sh) {
      light(l, 1310, 760, 520, '#4a8aff', 0.9); light(l, 820, 430, 600, '#6a7ac0', 0.5);                    // the phone screen on his face
      const p = ((f - sh.a) % 75) / 75;                            // streetlights sliding across him
      light(l, 1900 - p * 2400, 300, 520, '#ffb05a', 0.85 * Math.sin(Math.PI * p));
      if (sh.headlights && (after(f, sh) || sh.headlights === 'full')) { const k = sh.headlights === 'full' ? 0.6 + 0.4 * ss(bT(f, sh, 20)) : ss(bT(f, sh, 40)); light(l, 1800 - 300 * k, 520, 600 + 2600 * k, '#fffaf0', 0.6 + 2.4 * k); }
    },
  },
  gNav: { frames: { wide: [960, 540, 1.0], banner: [800, 220, 1.6] }, ambient: '#4a4f66', draw(f, sh) { gNavSet(f, sh); },
    lights(l) { l.fillStyle = '#ffffff'; l.fillRect(300, 130, 1320, 820); } },
  gSign: { frames: { wide: [960, 540, 1.0] }, ambient: '#20232e', draw(f, sh) { gSignSet(f, sh); },
    lights(l, f, sh) { light(l, 1500 - (f - sh.a) * 9, 400, 700, '#fff6dc', 1.4); light(l, 960, 900, 900, '#fff6dc', 0.5); } },
  gHospPov: {
    frames: { wide: [960, 560, 1.0] },
    frameFn(sh, name) {
      const sp = (sh.crew || {}).arjun; if (!sp) return null;
      const x = sp.walk ? sp.walk[1] : sp.x ?? 960, s = sp.s || 1.05, y = sp.y ?? 1290;
      if (name === 'face') return [x + 40, y - 775 * s, 1.75];
      if (name === 'mira') return [x - 300, y - 775 * s - 30, 2.2];
      if (name === 'both') return [x - 150, y - 775 * s + 20, 1.35];
      return null;
    },
    ambient: '#a8b2b0',
    draw(f, sh) {
      const c = sh.crew || {}, ppl = [];
      if (c.arjun) {
        const sp = c.arjun;
        if (sp.walk) {                                // from the door toward the bed, growing as he comes closer
          const t = ss(seg(f, sh.a + 4, sh.b - 6));
          const o = gPerson('arjun', sh, f, { x: lerp(1580, 980, t), y: lerp(930, 1290, t), s: lerp(0.42, 0.95, t) });
          if (o) { o.x = lerp(1580, 980, t); o.walk = t < 1 ? f * 0.3 : 0; o.walkAmt = t < 1 ? 0.5 : 0; ppl.push(o); }
        } else ppl.push(gPerson('arjun', sh, f, { x: sp.x ?? 960, y: sp.y ?? 1290, s: sp.s || 1.05, noLegs: true }));
      }
      gHospPovSet(f, sh, ppl.filter(Boolean));
    },
    lights(l, f, sh) {
      light(l, 960, 40, 1500, '#f0f8f4', 0.95); light(l, 1580, 460, 400, '#dfe8ff', 0.4);
      const m = ((sh.crew || {}).arjun || {}).mira; if (m) light(l, 640, 420, 420, '#9fc6ff', 0.35);
    },
  },
  gHospBed: {
    frames: { wide: [960, 520, 1.0], face: [960, 430, 2.0] },
    ambient: '#8a9a96',
    draw(f, sh) { gHospBedSet(f, sh, gPerson('rohan', sh, f, { x: 960, y: 900, s: 0.62, noLegs: true })); },
    lights(l, f, sh) { light(l, 960, 100, 1400, '#e8f4ee', 0.85); light(l, 1650, 400, 500, '#5aff9a', sh.flat ? 0.1 : 0.35); },
  },
});
