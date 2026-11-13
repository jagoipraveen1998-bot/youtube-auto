// ===== anime footballer: cel-shaded, outlined, with a run cycle, a kick, and front/back views =====
let LIGHT = 1;            // which side the key light comes from (+1 right, -1 left)
let RIM = null;           // rim light colour for the current shot

function capPath(x1, y1, x2, y2, r1, r2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath(); ctx.arc(x1, y1, r1, a + Math.PI / 2, a + Math.PI * 1.5); ctx.arc(x2, y2, r2, a - Math.PI / 2, a + Math.PI / 2); ctx.closePath();
}
function limb(x1, y1, x2, y2, r1, r2, col, ow) {
  capPath(x1, y1, x2, y2, r1 + ow, r2 + ow); ctx.fillStyle = INK; ctx.fill();
  capPath(x1, y1, x2, y2, r1, r2); ctx.fillStyle = shadeHex(col, -0.32); ctx.fill();      // shade everywhere…
  ctx.save(); capPath(x1, y1, x2, y2, r1, r2); ctx.clip();                                // …then the lit side on top
  const o = (r1 + r2) * 0.42 * LIGHT; capPath(x1 + o, y1 - (r1 + r2) * 0.1, x2 + o, y2 - (r1 + r2) * 0.1, r1, r2); ctx.fillStyle = col; ctx.fill();
  if (RIM) { ctx.globalCompositeOperation = 'lighter'; const o2 = (r1 + r2) * 0.9 * LIGHT; capPath(x1 + o2 * 1.05, y1, x2 + o2 * 1.05, y2, r1, r2); ctx.lineWidth = Math.max(2, r1 * 0.5); ctx.strokeStyle = RIM; ctx.stroke(); }
  ctx.restore();
}
// two-bone chain: from a joint, angle from vertical (positive = towards dir)
function bone(x, y, ang, len, dir) { return [x + Math.sin(ang) * len * dir, y + Math.cos(ang) * len]; }

function runPose(ph, run) {
  const legs = [], arms = [];
  for (const side of [0, 1]) {
    const p = ph + side * Math.PI;
    const th = run * 0.78 * Math.sin(p) + 0.03;
    const kn = 0.08 + run * (0.35 + 0.95 * Math.max(0, Math.sin(p + 1.9)));
    legs.push([th, kn]);
    arms.push([-run * 0.85 * Math.sin(p) + 0.05, 0.35 + run * 1.15]);
  }
  return { legs, arms, bob: -Math.abs(Math.sin(ph)) * run, lean: run * 0.22 };
}
function kickPose(k) {       // near leg (index 0) kicks; far leg plants
  let th, kn, lean;
  if (k < 0.45) { const q = ss(k / 0.45); th = lerp(0.1, -0.75, q); kn = lerp(0.3, 1.75, q); lean = lerp(0.15, 0.05, q); }
  else if (k < 0.6) { const q = eout((k - 0.45) / 0.15); th = lerp(-0.75, 1.0, q); kn = lerp(1.75, 0.05, q); lean = lerp(0.05, -0.18, q); }
  else { const q = ss((k - 0.6) / 0.4); th = lerp(1.0, 1.45, q); kn = lerp(0.05, 0.35, q); lean = lerp(-0.18, -0.1, q); }
  return { legs: [[th, kn], [0.22, 0.28]], arms: [[-0.9, 0.5], [1.1, 0.8]], bob: 0, lean };
}

// o: {x, y (ground), h (px height), dir, ph, run, kick, c (palette), expr, view: 'side'|'front'|'back', hideNum, alpha}
function player(o) {
  const c = o.c, u = o.h / 7.4 * (o.c.build > 1.1 ? 1.03 : 1), dir = o.dir || 1, ow = Math.max(2, u * 0.09);
  ctx.save(); ctx.globalAlpha = o.alpha ?? 1;
  // ground shadow
  ctx.save(); ctx.globalAlpha *= 0.35; ellipse(o.x, o.y + u * 0.05, u * 1.5, u * 0.28, '#000'); ctx.restore();
  if (o.view === 'front' || o.view === 'back') { frontBack(o, u, ow); ctx.restore(); return; }
  const pose = o.kick != null ? kickPose(o.kick) : runPose(o.ph || 0, o.run ?? 0);
  const lean = pose.lean + (o.lean || 0);
  const hipX = o.x, hipY = o.y - 3.55 * u + pose.bob * u * 0.3;
  const shX = hipX + Math.sin(lean) * 2.45 * u * dir, shY = hipY - Math.cos(lean) * 2.45 * u;
  const bw = c.build;
  const leg = (i, near) => {
    const [th, kn] = pose.legs[i];
    const [kx, ky] = bone(hipX + (near ? 0.15 : -0.15) * u * dir, hipY, th, 1.85 * u, dir);
    const [ax, ay] = bone(kx, ky, th - kn, 1.75 * u, dir);
    const tone = near ? 0 : -0.18;
    limb(hipX, hipY, kx, ky, 0.5 * u * bw, 0.36 * u * bw, shadeHex(c.skin, tone), ow);
    const [mx, my] = [lerp(hipX, kx, 0.55), lerp(hipY, ky, 0.55)];
    limb(hipX, hipY, mx, my, 0.56 * u * bw, 0.5 * u * bw, shadeHex(c.shorts, tone), ow);       // shorts
    limb(kx, ky, ax, ay, 0.33 * u * bw, 0.2 * u, shadeHex(c.skin, tone), ow);
    const [sx, sy] = [lerp(kx, ax, 0.3), lerp(ky, ay, 0.3)];
    limb(sx, sy, ax, ay, 0.33 * u * bw, 0.22 * u, shadeHex(c.socks, tone), ow);                 // socks
    const fa = th - kn + Math.PI / 2 * 0.95;                                                  // boot points forward
    const [tx, ty] = bone(ax, ay, fa, 0.85 * u, dir);
    limb(ax - 0.05 * u * dir, ay, tx, ty + 0.05 * u, 0.24 * u, 0.17 * u, shadeHex(c.boots, tone), ow);
    if (near) o._foot = [tx, ty];
  };
  const arm = (i, near) => {
    const [a, e] = pose.arms[i];
    const sx0 = shX + (near ? 0.1 : -0.25) * u * dir, sy0 = shY + 0.2 * u;
    const [ex, ey] = bone(sx0, sy0, a, 1.3 * u, dir);
    const [hx, hy] = bone(ex, ey, a + e, 1.2 * u, dir);
    const tone = near ? 0 : -0.18;
    limb(sx0, sy0, ex, ey, 0.32 * u * bw, 0.25 * u * bw, shadeHex(c.skin, tone), ow);
    limb(sx0, sy0, lerp(sx0, ex, 0.55), lerp(sy0, ey, 0.55), 0.4 * u * bw, 0.36 * u * bw, shadeHex(c.shirt, tone), ow);   // sleeve
    limb(ex, ey, hx, hy, 0.25 * u * bw, 0.22 * u, shadeHex(c.gloves || c.skin, tone), ow);
  };
  arm(1, false); leg(1, false);
  // torso
  const pts = [[hipX - 0.75 * u * bw, hipY + 0.1 * u], [hipX + 0.75 * u * bw, hipY + 0.1 * u], [shX + 0.95 * u * bw, shY], [shX - 0.95 * u * bw, shY]];
  poly(pts, INK, ow * 2.2); poly(pts, shadeHex(c.shirt, -0.3));
  ctx.save(); poly(pts); ctx.clip();
  poly(pts.map(([x, y]) => [x + 0.45 * u * LIGHT, y - 0.1 * u]), c.shirt);
  ctx.strokeStyle = c.shirt2; ctx.lineWidth = 0.22 * u; ctx.beginPath(); ctx.moveTo(lerp(pts[0][0], pts[3][0], 0.5) + 0.2 * u * dir, hipY); ctx.lineTo(lerp(pts[1][0], pts[2][0], 0.5) - 0.2 * u * dir, shY); ctx.stroke();
  if (!o.hideNum) bigText(String(c.num || ''), lerp(hipX, shX, 0.55) - 0.25 * u * dir, lerp(hipY, shY, 0.55), 1.0 * u, '#fff', { sw: 0.12 });
  if (RIM) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = RIM; ctx.lineWidth = 0.25 * u; poly(pts.map(([x, y]) => [x + 0.5 * u * LIGHT, y])); ctx.stroke(); }
  ctx.restore();
  leg(0, true);
  // neck + head
  const hx = shX + Math.sin(lean) * 0.8 * u * dir, hy = shY - 0.95 * u;
  limb(shX, shY + 0.1 * u, hx - 0.05 * u * dir, hy + 0.45 * u, 0.3 * u, 0.28 * u, c.skin, ow);
  headSide(hx, hy, u, dir, c, o.expr || 'focus', ow);
  arm(0, true);
  ctx.restore();
}

function hairSide(x, y, u, dir, c, ow) {
  const r = 0.72 * u, H = c.hair;
  let pts;
  if (c.style === 'spike') pts = [[-1.0, 0.1], [-1.35, -0.35], [-0.95, -0.45], [-1.15, -1.05], [-0.55, -0.8], [-0.45, -1.45], [0.0, -0.95], [0.35, -1.55], [0.5, -0.85], [1.05, -1.2], [0.95, -0.55], [1.2, -0.25], [0.8, -0.15], [0.55, -0.35], [-0.4, -0.3], [-0.85, 0.35]];
  else if (c.style === 'swept') pts = [[-1.05, 0.55], [-1.15, -0.2], [-0.8, -0.85], [-0.1, -1.1], [0.6, -0.95], [1.1, -0.45], [1.25, 0.05], [0.85, -0.15], [0.95, 0.25], [0.45, -0.25], [-0.2, -0.35], [-0.65, 0.05], [-0.8, 0.7]];
  else if (c.style === 'neat') pts = [[-1.0, 0.05], [-0.95, -0.7], [-0.4, -1.0], [0.4, -1.02], [0.95, -0.7], [1.0, -0.3], [0.5, -0.45], [-0.3, -0.4], [-0.75, 0.15]];
  else pts = [[-0.98, 0.0], [-0.9, -0.75], [-0.2, -1.0], [0.6, -0.9], [0.98, -0.45], [0.6, -0.5], [-0.6, -0.35]];
  const P = pts.map(([px, py]) => [x + px * r * dir, y + py * r]);
  poly(P, H, ow * 2); poly(P, H);
  if (c.hairTip !== c.hair) {                                     // coloured tips: fire orange or water blue
    ctx.save(); poly(P); ctx.clip();
    const g = ctx.createLinearGradient(x, y - 1.6 * r, x, y); g.addColorStop(0, c.hairTip); g.addColorStop(0.55, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 2 * r, y - 2 * r, 4 * r, 2.2 * r); ctx.restore();
  }
  ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#fff'; ctx.lineWidth = u * 0.08;     // anime hair shine
  ctx.beginPath(); ctx.arc(x + 0.1 * r * dir, y - 0.2 * r, r * 0.75, -2.3, -1.4); ctx.stroke(); ctx.restore();
}
function headSide(x, y, u, dir, c, expr, ow) {
  const r = 0.72 * u;
  // skull + jaw in three-quarter profile
  const face = [[-0.9, -0.2], [-0.85, -0.75], [0, -1.0], [0.85, -0.7], [1.0, -0.1], [0.95, 0.35], [0.55, 0.85], [0.1, 1.0], [-0.55, 0.75], [-0.9, 0.3]].map(([px, py]) => [x + px * r * dir, y + py * r]);
  poly(face, INK, ow * 2); poly(face, shadeHex(c.skin, -0.2));
  ctx.save(); poly(face); ctx.clip(); poly(face.map(([px, py]) => [px + 0.3 * r * dir, py]), c.skin); ctx.restore();
  ellipse(x - 0.55 * r * dir, y + 0.05 * r, 0.18 * r, 0.26 * r, shadeHex(c.skin, -0.15), ow * 0.8);     // ear
  // the big anime eye on the near side
  const ex = x + 0.5 * r * dir, ey = y - 0.05 * r;
  const narrow = expr === 'calm' ? 0.55 : expr === 'shout' ? 0.85 : expr === 'deadpan' ? 0.45 : 0.75;
  ellipse(ex, ey, 0.26 * r, 0.32 * r * narrow + 0.02 * r, '#fff', ow * 0.7);
  ellipse(ex + 0.06 * r * dir, ey + 0.02 * r, 0.17 * r, 0.27 * r * narrow, c.eye);
  ellipse(ex + 0.07 * r * dir, ey + 0.04 * r, 0.09 * r, 0.15 * r * narrow, INK);
  ellipse(ex + 0.02 * r * dir, ey - 0.08 * r * narrow, 0.06 * r, 0.06 * r, '#fff');
  ctx.strokeStyle = INK; ctx.lineWidth = ow * 1.3; ctx.lineCap = 'round';             // brow
  ctx.beginPath(); ctx.moveTo(ex - 0.28 * r * dir, ey - 0.45 * r + (expr === 'shout' ? -0.05 * r : 0)); ctx.lineTo(ex + 0.3 * r * dir, ey - (expr === 'focus' || expr === 'shout' ? 0.32 : 0.45) * r); ctx.stroke();
  // mouth
  if (expr === 'shout') { poly([[x + 0.35 * r * dir, y + 0.45 * r], [x + 0.85 * r * dir, y + 0.4 * r], [x + 0.7 * r * dir, y + 0.75 * r]], '#5a1018', ow); }
  else if (expr === 'smile') { ctx.beginPath(); ctx.arc(x + 0.6 * r * dir, y + 0.42 * r, 0.2 * r, 0.2, 1.6); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(x + 0.45 * r * dir, y + 0.55 * r); ctx.lineTo(x + 0.78 * r * dir, y + 0.52 * r); ctx.stroke(); }
  hairSide(x, y, u, dir, c, ow);
}

// walking toward the camera ('front') or away from it ('back'): the tunnel walk-out and the reveal
function frontBack(o, u, ow) {
  const c = o.c, bw = c.build, back = o.view === 'back', step = Math.sin(o.ph || 0) * (o.run ?? 0.5);
  const hipY = o.y - 3.55 * u - Math.abs(step) * 0.12 * u, x = o.x;
  for (const s of [-1, 1]) {                                     // legs: the stepping leg lifts
    const lift = Math.max(0, s * step) * 0.5 * u, kx = x + s * 0.45 * u * bw, ky = hipY + 1.85 * u - lift;
    limb(x + s * 0.4 * u * bw, hipY, kx, ky, 0.5 * u * bw, 0.38 * u * bw, c.skin, ow);
    limb(x + s * 0.4 * u * bw, hipY, kx, lerp(hipY, ky, 0.55), 0.56 * u * bw, 0.5 * u * bw, c.shorts, ow);
    limb(kx, ky, kx + s * 0.05 * u, o.y - 0.25 * u - lift * 0.4, 0.34 * u * bw, 0.24 * u, c.socks, ow);
    limb(kx, o.y - 0.25 * u - lift * 0.4, kx + s * 0.08 * u, o.y - 0.08 * u - lift * 0.4, 0.3 * u, 0.28 * u, c.boots, ow);
  }
  const shY = hipY - 2.45 * u;
  const tor = [[x - 0.85 * u * bw, hipY + 0.15 * u], [x + 0.85 * u * bw, hipY + 0.15 * u], [x + 1.15 * u * bw, shY], [x - 1.15 * u * bw, shY]];
  for (const s of [-1, 1]) {                                     // arms swing against the legs
    const sw = -s * step * 0.35, ex = x + s * 1.25 * u * bw + Math.sin(sw) * 0.3 * u, ey = shY + 1.3 * u;
    limb(x + s * 1.05 * u * bw, shY + 0.2 * u, ex, ey, 0.32 * u * bw, 0.26 * u * bw, c.skin, ow);
    limb(x + s * 1.05 * u * bw, shY + 0.2 * u, lerp(x + s * 1.05 * u * bw, ex, 0.5), lerp(shY, ey, 0.5), 0.42 * u * bw, 0.38 * u * bw, c.shirt, ow);
    limb(ex, ey, ex + s * 0.05 * u + Math.sin(sw) * 0.4 * u, ey + 1.15 * u, 0.26 * u * bw, 0.23 * u, c.gloves || c.skin, ow);
  }
  poly(tor, INK, ow * 2.2); poly(tor, shadeHex(c.shirt, -0.3));
  ctx.save(); poly(tor); ctx.clip(); poly(tor.map(([px, py]) => [px + 0.5 * u * LIGHT, py]), c.shirt);
  if (back && !o.hideNum) { bigText(c.name, x, shY + 0.6 * u, 0.55 * u, '#fff', { sw: 0.1 }); bigText(String(c.num), x, shY + 1.55 * u, 1.35 * u, '#fff', { sw: 0.1 }); }
  if (!back) { ctx.strokeStyle = c.shirt2; ctx.lineWidth = 0.2 * u; ctx.beginPath(); ctx.moveTo(x - 0.3 * u, shY); ctx.lineTo(x, shY + 0.5 * u); ctx.lineTo(x + 0.3 * u, shY); ctx.stroke(); }
  ctx.restore();
  const hy = shY - 0.95 * u;
  limb(x, shY + 0.1 * u, x, hy + 0.4 * u, 0.32 * u * bw, 0.3 * u, c.skin, ow);
  if (back) {
    ellipse(x, hy, 0.74 * u, 0.82 * u, INK); ellipse(x, hy, 0.7 * u, 0.78 * u, c.hair);
    if (c.style === 'spike') for (let i = -2; i <= 2; i++) poly([[x + i * 0.3 * u - 0.15 * u, hy - 0.5 * u], [x + i * 0.32 * u, hy - 1.15 * u - Math.abs(i) * -0.1 * u], [x + i * 0.3 * u + 0.15 * u, hy - 0.5 * u]], c.hair, ow);
  } else faceFront(x, hy, 0.72 * u, c, o.expr || 'focus', ow);
}

// front-facing anime face: used small (walk-outs) and huge (close-ups)
function faceFront(x, y, r, c, expr, ow, opts = {}) {
  const jaw = c.build > 1.1 ? 0.95 : 0.78;
  const face = [[-0.95, -0.35], [-0.92, 0.25], [-0.6, 0.8], [0, 1.08 * jaw + 0.2], [0.6, 0.8], [0.92, 0.25], [0.95, -0.35], [0.7, -0.95], [0, -1.1], [-0.7, -0.95]].map(([px, py]) => [x + px * r, y + py * r]);
  for (const s of [-1, 1]) ellipse(x + s * 0.97 * r, y + 0.05 * r, 0.16 * r, 0.27 * r, c.skin, ow * 0.8);
  poly(face, INK, ow * 2); poly(face, shadeHex(c.skin, -0.18));
  ctx.save(); poly(face); ctx.clip(); poly(face.map(([px, py]) => [px + 0.28 * r * LIGHT, py - 0.05 * r]), c.skin);
  if (opts.stubble) { ctx.globalAlpha = 0.18; poly([[x - 0.75 * r, y + 0.35 * r], [x + 0.75 * r, y + 0.35 * r], [x + 0.55 * r, y + 1.05 * r], [x - 0.55 * r, y + 1.05 * r]], '#5a3a20'); ctx.globalAlpha = 1; }
  ctx.restore();
  const narrow = { calm: 0.6, shout: 1.0, focus: 0.8, deadpan: 0.42, smile: 0.5, fierce: 0.72 }[expr] ?? 0.8;
  for (const s of [-1, 1]) {
    const ex = x + s * 0.4 * r, ey = y + 0.05 * r;
    ellipse(ex, ey, 0.25 * r, 0.3 * r * narrow + 0.01 * r, '#fff', ow * 0.7);
    const ig = ctx.createLinearGradient(ex, ey - 0.3 * r, ex, ey + 0.3 * r); ig.addColorStop(0, shadeHex(c.eye, -0.5)); ig.addColorStop(1, shadeHex(c.eye, 0.25));
    ellipse(ex + s * -0.02 * r, ey + 0.02 * r, 0.16 * r, 0.27 * r * narrow, ig);
    ellipse(ex, ey + 0.04 * r, 0.08 * r, 0.14 * r * narrow, INK);
    if (expr !== 'deadpan') { ellipse(ex - 0.06 * r, ey - 0.09 * r * narrow, 0.06 * r, 0.06 * r, '#fff'); ellipse(ex + 0.07 * r, ey + 0.1 * r * narrow, 0.03 * r, 0.03 * r, '#fff'); }
    else ellipse(ex - 0.06 * r, ey - 0.05 * r * narrow, 0.035 * r, 0.035 * r, '#fff');
    if (opts.eyeGlow) glow(ex, ey, 0.5 * r, opts.eyeGlow, 0.7);
    ctx.lineWidth = ow * (expr === 'deadpan' ? 2.2 : 1.6); ctx.strokeStyle = INK; ctx.lineCap = 'round';   // eyelid line
    ctx.beginPath(); ctx.moveTo(ex - 0.28 * r, ey - 0.26 * r * narrow); ctx.quadraticCurveTo(ex, ey - 0.36 * r * narrow, ex + 0.28 * r, ey - 0.24 * r * narrow); ctx.stroke();
    const bIn = { shout: 0.28, focus: 0.36, fierce: 0.3, calm: 0.48, deadpan: 0.34, smile: 0.5 }[expr] ?? 0.45;
    ctx.lineWidth = ow * (c.build > 1.1 ? 2.6 : 1.7);
    ctx.beginPath(); ctx.moveTo(ex - s * 0.3 * r, y - (expr === 'deadpan' ? 0.38 : 0.5) * r); ctx.lineTo(ex + s * 0.28 * r, y - bIn * r); ctx.stroke();
  }
  ctx.lineWidth = ow * 1.2; ctx.beginPath(); ctx.moveTo(x + 0.03 * r, y + 0.3 * r); ctx.lineTo(x - 0.05 * r, y + 0.45 * r); ctx.lineTo(x + 0.05 * r, y + 0.47 * r); ctx.stroke();   // nose
  if (expr === 'shout') { poly([[x - 0.3 * r, y + 0.62 * r], [x + 0.3 * r, y + 0.62 * r], [x + 0.18 * r, y + 0.92 * r], [x - 0.18 * r, y + 0.92 * r]], '#5a1018', ow); poly([[x - 0.26 * r, y + 0.63 * r], [x + 0.26 * r, y + 0.63 * r], [x + 0.22 * r, y + 0.7 * r], [x - 0.22 * r, y + 0.7 * r]], '#fff'); }
  else if (expr === 'smile') { ctx.lineWidth = ow * 1.4; ctx.beginPath(); ctx.arc(x, y + 0.52 * r, 0.24 * r, 0.35, Math.PI - 0.35); ctx.stroke(); }
  else { ctx.lineWidth = ow * (expr === 'deadpan' ? 1.8 : 1.3); ctx.beginPath(); ctx.moveTo(x - (expr === 'deadpan' ? 0.26 : 0.18) * r, y + 0.7 * r); ctx.lineTo(x + (expr === 'deadpan' ? 0.26 : 0.18) * r, y + 0.7 * r); ctx.stroke(); }
  hairFront(x, y, r, c, ow);
}
function hairFront(x, y, r, c, ow) {
  let pts;
  if (c.style === 'spike') pts = [[-1.05, 0.0], [-1.3, -0.5], [-1.0, -0.6], [-1.15, -1.2], [-0.6, -0.95], [-0.55, -1.65], [-0.15, -1.1], [0.1, -1.8], [0.35, -1.1], [0.7, -1.6], [0.7, -0.95], [1.2, -1.15], [1.0, -0.55], [1.3, -0.45], [1.0, 0.0], [0.75, -0.45], [0.45, -0.25], [0.3, -0.55], [0.0, -0.3], [-0.25, -0.55], [-0.45, -0.25], [-0.75, -0.45]];
  else if (c.style === 'swept') pts = [[-1.05, 0.5], [-1.15, -0.4], [-0.75, -1.05], [0.0, -1.25], [0.8, -1.05], [1.15, -0.4], [1.05, 0.45], [0.85, -0.1], [0.6, -0.35], [0.75, 0.15], [0.3, -0.35], [-0.05, -0.2], [-0.2, -0.45], [-0.55, -0.25], [-0.85, 0.0]];
  else if (c.style === 'neat') pts = [[-1.0, -0.15], [-1.0, -0.75], [-0.6, -1.1], [0.1, -1.18], [0.75, -1.05], [1.02, -0.7], [1.0, -0.15], [0.85, -0.5], [0.2, -0.62], [-0.15, -0.5], [-0.25, -0.75], [-0.8, -0.5]];
  else pts = [[-0.98, -0.2], [-0.95, -0.8], [-0.3, -1.12], [0.4, -1.1], [0.97, -0.75], [0.98, -0.2], [0.7, -0.6], [-0.7, -0.6]];
  const P = pts.map(([px, py]) => [x + px * r, y + py * r]);
  poly(P, INK, ow * 2); poly(P, c.hair);
  ctx.save(); poly(P); ctx.clip();
  if (c.hairTip !== c.hair) { const g = ctx.createLinearGradient(x, y - 1.8 * r, x, y - 0.3 * r); g.addColorStop(0, c.hairTip); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - 2 * r, y - 2 * r, 4 * r, 2 * r); }
  ctx.globalAlpha = 0.45; ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.07;
  ctx.beginPath(); ctx.arc(x - 0.1 * r, y - 0.35 * r, r * 0.68, -2.5, -1.6); ctx.stroke(); ctx.beginPath(); ctx.arc(x - 0.1 * r, y - 0.35 * r, r * 0.6, -1.45, -1.1); ctx.stroke();
  ctx.restore();
}

// the ball: white panels, spin, and a motion trail
function ball(x, y, r, spin = 0, trail = null) {
  if (trail) for (let i = 1; i <= 6; i++) { ctx.save(); ctx.globalAlpha = 0.35 * (1 - i / 7); ellipse(x - trail[0] * i, y - trail[1] * i, r * (1 - i * 0.06), r * (1 - i * 0.06), trail[2] || '#fff'); ctx.restore(); }
  ellipse(x, y, r + Math.max(1.5, r * 0.12), r + Math.max(1.5, r * 0.12), INK); ellipse(x, y, r, r, '#f7f7f7');
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
  ellipse(x + r * 0.25, y + r * 0.25, r, r, '#cfd3dc');
  for (let i = 0; i < 5; i++) { const a = spin + i * 1.2566, px = x + Math.cos(a) * r * 0.62, py = y + Math.sin(a) * r * 0.62; poly([0, 1, 2, 3, 4].map(k => [px + Math.cos(k * 1.2566 + a) * r * 0.24, py + Math.sin(k * 1.2566 + a) * r * 0.24]), '#1b1b26'); }
  poly([0, 1, 2, 3, 4].map(k => [x + Math.cos(k * 1.2566 + spin) * r * 0.26, y + Math.sin(k * 1.2566 + spin) * r * 0.26]), '#1b1b26');
  ellipse(x - r * 0.35, y - r * 0.4, r * 0.25, r * 0.16, 'rgba(255,255,255,0.9)', 0, -0.6);
  ctx.restore();
}
