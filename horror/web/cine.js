// ---------- cinematic pass: the cast is LIT BY the painted place they stand in ----------
// Reference: Ricks Clips. Flat characters stop looking pasted-on when the room's light falls on them:
//   * the place's key light (window, lamp, doorway) rims the side of the actor that faces it
//   * the far side falls into the room's own shadow colour, and the feet sink into the floor's darkness
//   * a long soft shadow is cast away from the light
//   * bright things bloom; the background goes softly out of focus in close shots (depth)
//   * the background drifts against the actor as the camera moves (parallax)
const CINE = { info: null, name: null };
const AC = document.createElement('canvas'); AC.width = W; AC.height = H; const actx = AC.getContext('2d');
const RC = document.createElement('canvas'); RC.width = W; RC.height = H; const rctx = RC.getContext('2d');
const BL = document.createElement('canvas'); BL.width = Math.round(W / 6); BL.height = Math.round(H / 6); const bctx = BL.getContext('2d');
const PLATE_INFO = {}, PLATE_SOFT = {};

function plateInfo(name) {                               // where the light is in this painting, and what colour
  if (PLATE_INFO[name] !== undefined) return PLATE_INFO[name];
  const im = PLATES[name];
  if (!im) return (PLATE_INFO[name] = null);
  const w = 36, h = 64, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(im, 0, 0, w, h);
  let d;
  try { d = g.getImageData(0, 0, w, h).data; } catch (e) { return (PLATE_INFO[name] = null); }
  const px = [];
  let ar = 0, ag = 0, ab = 0;
  for (let i = 0; i < w * h; i++) {
    const r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2], l = 0.3 * r + 0.59 * gg + 0.11 * b;
    px.push([l, i % w, Math.floor(i / w), r, gg, b]); ar += r; ag += gg; ab += b;
  }
  px.sort((a, b) => b[0] - a[0]);
  const top = px.slice(0, Math.round(w * h * 0.06));
  let sx = 0, sy = 0, sw = 0, kr = 0, kg = 0, kb = 0;
  for (const [l, x, y, r, gg, b] of top) { sx += x * l; sy += y * l; sw += l; kr += r; kg += gg; kb += b; }
  const n = top.length, N = w * h;
  const boost = v => Math.round(Math.min(255, v * 1.15 + 20));
  return (PLATE_INFO[name] = {
    lx: sx / sw / w, ly: sy / sw / h,                    // 0..1 position of the key light
    key: `rgb(${boost(kr / n)},${boost(kg / n)},${boost(kb / n)})`,
    shade: `${Math.round(ar / N * 0.25)},${Math.round(ag / N * 0.25)},${Math.round(ab / N * 0.4 + 14)}`,
    lum: (ar + ag + ab) / (3 * N) / 255,
  });
}

// --- the painting itself: parallax + depth of field
const _drawPlate = drawPlate;
drawPlate = function (name, f) {
  const im = PLATES[name];
  if (!im) return _drawPlate(name, f);
  const k = Math.max((W + 220) / im.width, (H + 220) / im.height);
  const T = ctx.getTransform();
  // the room is "further away" than the actor: it slides less than the camera does
  const camX = (W / 2 - T.e) / T.a, camY = (H / 2 - T.f) / T.d;
  const px = (camX - W / 2) * 0.22 + Math.sin(f / 90) * 12, py = (camY - H / 2) * 0.12 + Math.cos(f / 110) * 8;
  let src = im;
  if (CZ > 1.22) {                                         // close shot: the background softens behind him
    if (!PLATE_SOFT[name]) {
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const g = c.getContext('2d'); g.filter = `blur(${Math.max(3, Math.round(im.width / 260))}px)`; g.drawImage(im, 0, 0); PLATE_SOFT[name] = c;
    }
    src = PLATE_SOFT[name];
  }
  ctx.drawImage(src, W / 2 - im.width * k / 2 + px, H / 2 - im.height * k / 2 + py, im.width * k, im.height * k);
};

// --- an actor drawn through the room's light
function litActor(draw, o) {
  const I = CINE.info;
  if (!I || o.kind === 'shadow' || o.kind === 'ghost' || o.sil || (o.alpha != null && o.alpha <= 0)) return draw(o);
  const main = ctx, T = main.getTransform();
  const sx = T.a * o.x + T.c * o.y + T.e, sy = T.b * o.x + T.d * o.y + T.f, k = Math.abs(T.a) * (o.s || 1);
  const dir = I.lx * W >= sx ? 1 : -1;                    // which side of him the light is on
  // 1. a long soft shadow thrown away from the light
  main.save(); main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 0.42; main.fillStyle = `rgb(${I.shade})`;
  main.beginPath(); main.ellipse(sx - dir * 120 * k, sy - 4 * k, 300 * k, 34 * k, 0, 0, 7); main.fill(); main.restore();
  // 2. the actor alone, on his own layer
  actx.setTransform(1, 0, 0, 1, 0, 0); actx.globalCompositeOperation = 'source-over'; actx.globalAlpha = 1; actx.filter = 'none';
  actx.clearRect(0, 0, W, H); actx.setTransform(T);
  ctx = actx; try { draw(o); } finally { ctx = main; }
  actx.setTransform(1, 0, 0, 1, 0, 0); actx.globalAlpha = 1; actx.globalCompositeOperation = 'source-atop';
  // 3. the side away from the light falls into the room's shadow colour
  const half = 330 * k, g = actx.createLinearGradient(sx - dir * half, 0, sx + dir * half * 0.5, 0);
  g.addColorStop(0, `rgba(${I.shade},0.62)`); g.addColorStop(0.55, `rgba(${I.shade},0.2)`); g.addColorStop(1, `rgba(${I.shade},0)`);
  actx.fillStyle = g; actx.fillRect(0, 0, W, H);
  // 4. his legs sink into the floor's darkness; the light's colour washes over him a little
  const v = actx.createLinearGradient(0, sy - 560 * k, 0, sy + 10);
  v.addColorStop(0, `rgba(${I.shade},0)`); v.addColorStop(1, `rgba(${I.shade},0.5)`);
  actx.fillStyle = v; actx.fillRect(0, 0, W, H);
  actx.globalAlpha = 0.1; actx.fillStyle = I.key; actx.fillRect(0, 0, W, H); actx.globalAlpha = 1;
  // 5. rim light: the thin edge of him that faces the lamp/window glows in its colour
  rctx.setTransform(1, 0, 0, 1, 0, 0); rctx.globalCompositeOperation = 'source-over'; rctx.clearRect(0, 0, W, H);
  rctx.drawImage(AC, 0, 0);
  rctx.globalCompositeOperation = 'destination-out'; rctx.drawImage(AC, -dir * Math.max(7, 13 * k), 5 * k);
  rctx.globalCompositeOperation = 'source-in'; rctx.fillStyle = I.key; rctx.fillRect(0, 0, W, H);
  actx.globalCompositeOperation = 'lighter'; actx.globalAlpha = 0.85; actx.drawImage(RC, 0, 0);
  actx.globalAlpha = 1; actx.globalCompositeOperation = 'source-over';
  main.save(); main.setTransform(1, 0, 0, 1, 0, 0); main.drawImage(AC, 0, 0); main.restore();
}
const _guy = guy; guy = function (o) { return litActor(_guy, o); };
if (typeof pet === 'function') { const _pet = pet; pet = function (o) { return litActor(_pet, o); }; }

// --- bloom: windows, lamps and moons glow into the air around them
function bloom(a = 0.5) {
  bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.globalCompositeOperation = 'source-over';
  bctx.filter = 'brightness(0.75) contrast(2.6) blur(5px)'; bctx.drawImage(cv, 0, 0, BL.width, BL.height); bctx.filter = 'none';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
  ctx.imageSmoothingEnabled = true; ctx.drawImage(BL, 0, 0, W, H); ctx.restore();
}

// --- light shafts from the key light: slow, faint beams with dust in them
function shafts(f) {
  const I = CINE.info; if (!I || I.ly > 0.6) return;
  const x = I.lx * W, y = I.ly * H;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 2 + (i - 1.5) * 0.3 + Math.sin(f * 0.006 + i) * 0.05, len = H * 0.9, wd = 0.13;
    const g = ctx.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.addColorStop(0, 'rgba(255,255,255,0.035)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.globalAlpha = 0.5 + 0.5 * noise1(f * 0.02 + i * 9);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a - wd) * len, y + Math.sin(a - wd) * len);
    ctx.lineTo(x + Math.cos(a + wd) * len, y + Math.sin(a + wd) * len); ctx.fill();
  }
  ctx.restore();
}

// --- switch the pass on for every scene that stands the cast in a painting
for (const name of ['plate', 'petshot']) {
  const S = SCENES[name]; if (!S) continue;
  const d = S.draw;
  S.draw = function (f, sh) {
    CINE.info = sh.plate ? plateInfo(sh.plate) : null; CINE.name = sh.plate;
    try { d.call(S, f, sh); } finally { CINE.on = !!CINE.info; }
  };
}
function cinePost(f, sh) {                                // after the light map: beams, glow
  if (!sh.plate || !CINE.info) { CINE.info = null; return; }
  shafts(f); bloom(0.42);
  CINE.info = null;
}
