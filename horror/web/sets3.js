// ---------- THE 14TH STAIR: a dark staircase seen from the side (vertical Shorts) ----------
// shot keys: hero.step (number or [from, to]), hero.dir ('up'|'down'), countRun [from, to], creaks, extra ('top'|'bottom'),
//            eyes (0..1 under the stairs), soft (the extra step breathes), place (corner label)

const SF0 = 1640, SR0 = 104, ST0 = 66, SX0 = 230;      // floor y, rise, run, first step x
const stepTop = k => [SX0 + (k - 0.5) * ST0, SF0 - k * SR0];   // where a foot stands on step k (0 = floor)
const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14 };

function spokenCount(sh, f) {             // the last number word said so far in this shot
  let n = null;
  for (const [a, , w] of sh.caps || []) { const k = NUMW[w.toLowerCase().replace(/[^a-z]/g, '')]; if (k && f >= a) n = k; }
  return n;
}
function heroStep(sh, f) {
  const h = sh.hero || {};
  if (h.step == null) return null;
  if (Array.isArray(h.step)) {
    const sp = sh.countRun ? null : spokenCount(sh, f);
    if (sp != null) return sp;
    const end = sh.beat != null && sh.countRun ? sh.beat : sh.b;
    return lerp(h.step[0], h.step[1], ss(seg(f, sh.a, end)));
  }
  return h.step;
}

function stairsSet(f, sh) {
  const extraTop = sh.extra === 'top', extraBot = sh.extra === 'bottom';
  const top = extraTop ? 14 : 13;
  // wall + wallpaper
  fillR(-900, -1600, 2900, 3800, '#2a2638');
  ctx.save(); ctx.globalAlpha = 0.18; for (let x = -900; x < 2000; x += 90) fillR(x, -1600, 34, 3800, '#47405c'); ctx.restore();
  // landing, upstairs door, window with moon
  const [lx, ly] = [SX0 + top * ST0, SF0 - top * SR0];
  sf(rr(lx + 120, ly - 520, 220, 470, 10), '#1c1826');
  sf(rr(lx + 135, ly - 505, 190, 455, 8), '#120f1a', 5);
  sf(rr(-300, 420, 230, 300, 12), '#0f1430');
  ctx.save(); ctx.beginPath(); ctx.rect(-292, 428, 214, 284); ctx.clip();
  const mg = ctx.createRadialGradient(-180, 520, 10, -180, 520, 140); mg.addColorStop(0, '#e9eefc'); mg.addColorStop(0.25, '#9fb0e0'); mg.addColorStop(1, '#0f1430');
  ctx.fillStyle = mg; ctx.fillRect(-300, 420, 230, 300); ctx.restore();
  line(-185, 420, -185, 720, INK, 6); line(-300, 570, -70, 570, INK, 6);
  // a picture frame on the wall that tilts as things go wrong
  ctx.save(); ctx.translate(560, 760); ctx.rotate(sh.extra ? 0.12 : 0.02); sf(rr(-90, -70, 180, 140, 6), '#5a4632'); sf(rr(-70, -50, 140, 100, 4), '#3d4a5c', 4); ctx.restore();
  // floor (or nothing, once the extra step is under you)
  if (!extraBot) { fillR(-900, SF0, 2900, 700, '#3a2c22'); for (let x = -900; x < 2000; x += 170) line(x, SF0, x - 60, 2300, 'rgba(0,0,0,0.25)', 4); }
  else {
    const g = ctx.createLinearGradient(0, SF0 - 60, 0, SF0 + 420); g.addColorStop(0, '#120e18'); g.addColorStop(1, '#000');
    ctx.fillStyle = g; ctx.fillRect(-900, SF0 - 60, 2900, 900);
  }
  // under the stairs: the dark triangle and a small cupboard door, left ajar
  const under = poly([[SX0, SF0], [SX0 + top * ST0, SF0 - top * SR0 + SR0], [SX0 + top * ST0, SF0]]);
  sf(under, '#1a1522', 0);
  const dx = SX0 + 6 * ST0, dw = 170, dh = 420;
  sf(rr(dx, SF0 - dh, dw, dh, 6), '#0a080e', 5);
  const EY = sh.eyesIn ? (after(f, sh) ? ss(bT(f, sh, 30)) : 0) : (sh.eyes || 0); sh._eyes = EY;
  const ajar = 0.25 + 0.55 * EY;
  sf(poly([[dx, SF0 - dh], [dx + dw * (1 - ajar), SF0 - dh - 14 * ajar], [dx + dw * (1 - ajar), SF0 + 14 * ajar], [dx, SF0]]), '#3b2f3e', 5);
  if (EY) {                         // two eyes in the gap
    const a = EY * (0.75 + 0.25 * Math.sin(f * 0.21)), ex0 = dx + dw * (1 - ajar) + 40, ey = SF0 - 260;
    const bl = blinkAt(f, 77) > 0.5;
    for (const sd of [-1, 1]) {
      const g = ctx.createRadialGradient(ex0 + sd * 26, ey, 0, ex0 + sd * 26, ey, 40); g.addColorStop(0, `rgba(255,236,170,${a})`); g.addColorStop(1, 'rgba(255,236,170,0)');
      ctx.fillStyle = g; ctx.fillRect(ex0 + sd * 26 - 40, ey - 40, 80, 80);
      if (!bl) { ctx.fillStyle = `rgba(255,248,214,${a})`; ctx.beginPath(); ctx.ellipse(ex0 + sd * 26, ey, 13, 8, 0, 0, 7); ctx.fill();
        ctx.fillStyle = `rgba(20,8,8,${a})`; ctx.beginPath(); ctx.ellipse(ex0 + sd * 26, ey, 3, 7, 0, 0, 7); ctx.fill(); }
    }
  }
  // the steps
  for (let k = 1; k <= top; k++) {
    const x0 = SX0 + (k - 1) * ST0, y0 = SF0 - k * SR0;
    const odd = extraTop && k === 14;
    sf(rr(x0, y0, ST0 + 14, SR0, 3), odd ? '#2c1d22' : '#6b4a33', 4);
    fillR(x0, y0, ST0 + 14, 12, odd ? '#3b252b' : '#8a6446');
  }
  if (extraBot) {                         // a fourteenth step where the floor should be: soft, and breathing
    const br = sh.soft ? 1 + 0.06 * Math.sin(f * 0.16) : 1;
    ctx.save(); ctx.translate(SX0 - ST0 * 0.5, SF0 + SR0 * 0.5); ctx.scale(1, br);
    sf(rr(-ST0 / 2 - 7, -SR0 / 2, ST0 + 14, SR0, 14), '#2c1d22', 4); fillR(-ST0 / 2 - 7, -SR0 / 2, ST0 + 14, 12, '#3b252b');
    if (sh.soft) { ctx.fillStyle = 'rgba(160,120,140,0.25)'; ctx.beginPath(); ctx.ellipse(0, -SR0 / 2 + 6, 26, 5, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  // banister
  line(SX0 + 20, SF0 - 300, SX0 + top * ST0 + 20, SF0 - top * SR0 - 300, '#4a3526', 22);
  for (let k = 1; k <= top; k += 1) { const [x, y] = [SX0 + (k - 0.5) * ST0, SF0 - k * SR0]; line(x, y, x, y - 300 + 4, '#3a2a1f', 9); }
  line(SX0 + 20, SF0 - 300, SX0 + top * ST0 + 20, SF0 - top * SR0 - 300, INK, 4);
  // floating counted numbers (they fade, the last one stays)
  const upTo = sh.countRun ? Math.floor(lerp(sh.countRun[0], sh.countRun[1] + 0.999, clamp((f - sh.a) / Math.max(1, (sh.beat ?? sh.b) - sh.a)))) : spokenCount(sh, f);
  if (upTo != null && sh.numbers !== false) {
    const from = sh.countRun ? sh.countRun[0] : Math.max(1, upTo - 3);
    for (let k = from; k <= upTo; k++) {
      const [x, y] = stepTop(Math.min(k, 14)), last = k === upTo;
      ctx.save(); ctx.globalAlpha = last ? 1 : 0.35; ctx.font = `bold ${last ? 64 : 44}px "DejaVu Sans"`; ctx.textAlign = 'center';
      ctx.fillStyle = k === 14 ? '#ff4a4a' : '#e8e2d8'; ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 10;
      ctx.fillText(String(k), x + 90, y - 30); ctx.restore();
    }
  }
}

function stairsHero(sh, f) {
  const k = heroStep(sh, f);
  if (k == null) return null;
  const kk = Math.max(sh.extra === 'bottom' ? -1 : 0, k);
  const x = SX0 + (kk - 0.5) * ST0 + 10, y = kk < 0 ? SF0 + SR0 : SF0 - Math.max(0, kk) * SR0;
  const moving = Array.isArray((sh.hero || {}).step) && f < (sh.beat ?? sh.b);
  const o = heroIn(sh, f, { x, y, s: 0.5 });
  if (!o) return null;
  if (moving) { o.walk = f * 0.32; o.walkAmt = 0.7; o.bob = (o.bob || 0) + Math.abs(Math.sin(f * 0.32)) * -10; }
  if ((sh.hero || {}).look == null) { o.look = (sh.hero || {}).dir === 'down' ? -0.7 : 0.6; o.lookY = (sh.hero || {}).dir === 'down' ? 0.6 : -0.3; }
  return o;
}

Object.assign(SCENES, {
  stairs: {
    frames: { wide: [580, 980, 1.0], under: [SX0 + 6 * ST0 + 120, SF0 - 200, 2.2], bottom: [SX0, SF0 - 160, 1.7], top: [SX0 + 13 * ST0, SF0 - 13 * SR0 - 200, 1.4] },
    frameFn(sh, name) {
      const k = heroStep(sh, sh.b - 1);
      if (k == null) return null;
      const kk = Math.max(sh.extra === 'bottom' ? -1 : 0, k), x = SX0 + (kk - 0.5) * ST0 + 10, y = kk < 0 ? SF0 + SR0 : SF0 - Math.max(0, kk) * SR0;
      if (name === 'hero' || name === 'face') return [x, y - 390, 2.7];
      if (name === 'body') return [x + 60, y - 300, 1.5];
      if (name === 'feet') return [x + 40, y - 60, 2.4];
      return null;
    },
    ambient: '#6a70a8',
    draw(f, sh) {
      stairsSet(f, sh);
      const o = stairsHero(sh, f);
      if (o) guy(o);
    },
    lights(l, f, sh) {
      light(l, -185, 560, 900, '#9fb0e8', 0.85);                        // moonlight from the window
      light(l, SX0 + 13 * ST0 + 230, SF0 - 13 * SR0 - 300, 520, '#ffcf8a', 0.35);   // a night-light upstairs
      if (sh._eyes) light(l, SX0 + 7 * ST0 + 60, SF0 - 260, 300, '#ffe9a8', 0.5 * sh._eyes);
      if (sh.extra === 'bottom') light(l, SX0, SF0, 300, '#5a2d3a', 0.4);
    },
  },
});
