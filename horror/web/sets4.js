// ---------- THE MUMMY DOWNSTAIRS: kitchen with the basement door, and the basement with the chained sarcophagus ----------
// shot keys: door (0..1 open | 'slam' | 'open'), lightOn (basement bulb), crew {kim, dad} with x, hero.x / hero.step / hero.aisle / hero.point,
//            chainTwitch (react 'chain'), lid ('shift')

const KF = 1180;                                   // kitchen floor
function kitchenSet(f, sh, people) {
  // wall + skirting + floor
  const wg = ctx.createLinearGradient(0, 0, 0, KF); wg.addColorStop(0, '#6f5d58'); wg.addColorStop(1, '#8a7464');
  ctx.fillStyle = wg; ctx.fillRect(-900, -400, 3900, KF + 400);
  ctx.save(); ctx.globalAlpha = 0.08; for (let x = -900; x < 3000; x += 80) fillR(x, -400, 30, KF + 400, '#2a1d1a'); ctx.restore();
  fillR(-900, KF - 30, 3900, 30, '#4a3a33');
  fillR(-900, KF, 3900, 700, '#5d4a3c');
  for (let x = -900; x < 3000; x += 160) line(x, KF, x - 70, KF + 700, 'rgba(0,0,0,0.18)', 4);
  // basement door, its frame, light switch, key in the lock
  const p = sh._door || 0;
  sf(rr(230, 610, 260, 580, 6), '#3d2c22', 6);
  sf(rr(250, 630, 220, KF - 630, 4), '#120d12', 4);
  if (p > 0.02) {                                  // stairwell glow when open and the bulb is on
    if (sh.lightOn) { const g = ctx.createLinearGradient(0, 640, 0, KF); g.addColorStop(0, 'rgba(255,214,140,0.55)'); g.addColorStop(1, 'rgba(255,190,110,0.1)'); ctx.fillStyle = g; ctx.fillRect(250, 630, 220, KF - 630); }
    for (let k = 0; k < 4; k++) fillR(250 + k * 30, 1050 + k * 32, 220 - k * 30, 10, 'rgba(60,40,28,0.9)');
  }
  const dw = 220 * (1 - p * 0.86);                 // the door swings in toward us, hinged on the left
  sf(poly([[250, 630], [250 + dw, 630 - 28 * p], [250 + dw, KF + 28 * p], [250, KF]]), '#7b5636', 5);
  if (dw > 60) {
    sf(rr(250 + dw * 0.14, 680, dw * 0.72, 200, 6), '#6a4a2e', 4); sf(rr(250 + dw * 0.14, 920, dw * 0.72, 220, 6), '#6a4a2e', 4);
    sf(ell(250 + dw - 26, 930, 15, 15), '#d2b24c', 4);
    sf(rr(250 + dw - 33, 960, 14, 22, 4), '#1b1410', 0);
    if (!sh.noKey) { sf(rr(250 + dw - 30, 958, 8, 40, 3), '#e2c25c', 3); sf(ell(250 + dw - 26, 1004, 15, 11), '#e2c25c', 3); }
  }
  sf(rr(525, 800, 46, 70, 6), '#e6dcc8', 4); sf(rr(541, sh.lightOn ? 818 : 834, 14, 18, 3), '#b8ab94', 0);
  // counters, sink window, fridge, pendant
  sf(rr(700, 930, 700, 250, 6), '#3f5a5a'); fillR(700, 920, 700, 26, '#d8d0c0');
  for (let i = 0; i < 4; i++) sf(rr(715 + i * 172, 960, 158, 200, 6), '#486767', 4);
  sf(rr(760, 520, 360, 300, 10), '#3a2c36');
  ctx.save(); ctx.beginPath(); ctx.rect(775, 535, 330, 270); ctx.clip();
  const sky = ctx.createLinearGradient(0, 535, 0, 805); sky.addColorStop(0, '#2a2457'); sky.addColorStop(0.6, '#7d4a6a'); sky.addColorStop(1, '#e09166');
  ctx.fillStyle = sky; ctx.fillRect(775, 535, 330, 270);
  sf(poly([[775, 805], [775, 730], [860, 700], [930, 735], [1020, 690], [1105, 720], [1105, 805]]), '#1d1630', 0);
  ctx.restore(); line(940, 535, 940, 805, INK, 6); line(775, 670, 1105, 670, INK, 6);
  sf(rr(1450, 520, 230, 660, 18), '#cfd5d8'); line(1450, 760, 1680, 760, INK, 5); sf(rr(1470, 600, 16, 110, 6), '#9aa1a6', 3); sf(rr(1470, 800, 16, 150, 6), '#9aa1a6', 3);
  line(1050, -400, 1050, 330, '#2a2026', 6); sf(poly([[990, 330], [1110, 330], [1140, 400], [960, 400]]), '#2f3d3a');
  // dining table on the right, with Dad and his laptop
  people.filter(q => q && q._back).forEach(q => guy(q));
  sf(rr(1760, 930, 520, 40, 8), '#6b4a30'); sf(rr(1790, 970, 26, 210, 6), '#5a3e28'); sf(rr(2220, 970, 26, 210, 6), '#5a3e28');
  sf(poly([[1900, 930], [1990, 930], [2010, 860], [1930, 860]]), '#2a2d34', 4);
  people.filter(q => q && !q._back).forEach(q => guy(q));
}
function kitchenLights(c, f, sh) {
  light(c, 1050, 420, 1100, '#ffd9a0', 0.9);
  light(c, 940, 680, 500, '#f0a070', 0.45);
  light(c, 1950, 860, 420, '#a8c8ff', 0.4);
  if ((sh._door || 0) > 0.05 && sh.lightOn) light(c, 360, 900, 380, '#ffcf8a', 0.5);
}

// ---------- basement ----------
const BF = 1250, BS = { x0: 300, y0: 520, n: 9, rise: 81, run: 80 };
const bStep = k => [BS.x0 + (k - 0.5) * BS.run, BS.y0 + k * BS.rise];        // foot point on step k (0 = top landing)
const CASE = { x: 1750, top: 470 };
function chainLinks(x0, y0, x1, y1, f, tw) {
  const n = 16;
  for (let i = 0; i <= n; i++) {
    const t = i / n, sag = Math.sin(Math.PI * t) * 26;
    const jig = tw ? Math.sin(f * 2.1 + i * 1.7) * tw * 9 * Math.sin(Math.PI * t) : 0;
    const x = lerp(x0, x1, t) + jig * 0.5, y = lerp(y0, y1, t) + sag + jig;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(y1 - y0, x1 - x0) + (i % 2 ? 0 : 0));
    ctx.strokeStyle = INK; ctx.lineWidth = L(14); ctx.beginPath(); ctx.ellipse(0, 0, 17, i % 2 ? 6 : 11, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#4a4850'; ctx.lineWidth = L(8); ctx.stroke(); ctx.restore();
  }
}
function sarcophagus(f, sh) {
  const tw = sh._tw || 0, shift = sh._lid || 0;
  const x = CASE.x, top = CASE.top, h = BF - 40 - top;
  // transport cradle
  sf(rr(x - 200, BF - 70, 400, 70, 8), '#5a4632'); sf(rr(x - 210, top + 120, 30, h - 80, 6), '#5a4632'); sf(rr(x + 180, top + 120, 30, h - 80, 6), '#5a4632');
  // case body (behind the lid)
  sf(rr(x - 170, top, 340, h, [160, 160, 40, 40]), '#6e5528');
  if (sh.lidOff) {                                // the open case: a dark hollow
    sf(rr(x - 140, top + 30, 280, h - 60, [140, 140, 30, 30]), '#07050a', 4);
    return;
  }
  // the lid, nudged outward when it shifts
  ctx.save(); ctx.translate(-shift * 26, shift * 6);
  if (shift > 0.02) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x + 150, top + 60, 18 * shift + 6, h - 120); }
  sf(rr(x - 160, top + 6, 320, h - 12, [150, 150, 36, 36]), '#b8913e');
  for (const yy of [top + 330, top + 420, top + 560, top + 640]) fillR(x - 150, yy, 300, 22, '#2d4d7c');
  // painted face and headdress
  sf(poly([[x - 120, top + 70], [x + 120, top + 70], [x + 135, top + 300], [x - 135, top + 300]]), '#2d4d7c', 5);
  for (let i = 0; i < 6; i++) fillR(x - 128 + i * 46, top + 110, 22, 190, '#c9a24a');
  sf(rr(x - 78, top + 80, 156, 210, [70, 70, 60, 60]), '#d8b25a', 5);
  for (const sd of [-1, 1]) {
    sf(ell(x + sd * 34, top + 165, 24, 11), '#f2ead6', 4);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + sd * 34, top + 165, 7, 0, 7); ctx.fill();
    line(x + sd * 10, top + 165, x + sd * 70, top + 170, INK, 6);
  }
  line(x - 22, top + 245, x + 22, top + 245, '#7a3a2a', 7);
  sf(rr(x - 26, top + 290, 52, 40, 8), '#2d4d7c', 4);
  ctx.restore();
  // two iron chains across the lid (gone once removed)
  if (!sh.chainsOff) { chainLinks(x - 190, top + 380, x + 190, top + 380, f, tw); chainLinks(x - 190, top + 700, x + 190, top + 700, f, tw * 0.7); }
}
function basementSet(f, sh, people) {
  fillR(-900, -400, 3900, 2400, '#2b2a33');
  ctx.save(); ctx.globalAlpha = 0.25; for (let y = -400; y < BF; y += 70) for (let x = -900 + ((y / 70) % 2) * 60; x < 3000; x += 120) sf(rr(x, y, 112, 62, 4), '#34323d', 0); ctx.restore();
  fillR(-900, BF, 3900, 700, '#3b3a40');
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(1300, BF + 120, 220, 30, 0, 0, 7); ctx.fill();
  // high window with faint blue light
  sf(rr(1420, 230, 220, 90, 6), '#1b2340'); ctx.save(); ctx.globalAlpha = 0.6; fillR(1430, 240, 200, 70, '#5f7fc4'); ctx.restore(); line(1530, 230, 1530, 320, INK, 6);
  // the door at the top of the stairs and its landing
  const p = sh._door || 0;
  sf(rr(60, 110, 230, 420, 6), '#1a1418');
  if (p > 0.02) { const g = ctx.createLinearGradient(0, 110, 0, 530); g.addColorStop(0, 'rgba(255,214,150,0.85)'); g.addColorStop(1, 'rgba(255,200,130,0.5)'); ctx.fillStyle = g; ctx.fillRect(75, 125, 200 * p, 400); }
  sf(rr(75 + 200 * p, 125, 200 * (1 - p) + 2, 400, 4), '#5d4129', 4);
  if (p < 0.5) sf(ell(255 - 180 * p, 340, 12, 12), '#d2b24c', 3);
  sf(rr(40, BS.y0, 270, 30, 4), '#4b3a2a');
  // shelves with boxes, between the stairs and the case
  for (const sx of [1100, 1330]) {
    sf(rr(sx, 560, 22, BF - 560, 4), '#4d4033'); sf(rr(sx + 190, 560, 22, BF - 560, 4), '#4d4033');
    for (const sy of [700, 920, 1140]) { fillR(sx, sy, 212, 18, '#5e4e3e'); sf(rr(sx + 20, sy - 120, 90, 120, 6), '#8a6f4e', 4); sf(rr(sx + 120, sy - 90, 70, 90, 6), '#6f6a7a', 4); }
  }
  sarcophagus(f, sh);
  // stairs (side view), railing
  for (let k = 1; k <= BS.n; k++) { const x0 = BS.x0 + (k - 1) * BS.run, y0 = BS.y0 + (k - 1) * BS.rise + BS.rise; sf(rr(x0, y0 - 14, BS.run + 14, 26, 3), '#6b4f36', 4); }
  line(BS.x0 + 10, BS.y0 + 40, BS.x0 + BS.n * BS.run + 30, BF - 10, '#3c2c20', 18);
  line(BS.x0 - 20, BS.y0 - 230, BS.x0 + BS.n * BS.run, BF - 300, '#5a4230', 16);      // railing sits behind Jeff
  for (let k = 1; k <= BS.n; k += 2) { const [x, y] = bStep(k); line(x, y - 4, x, y - 236, '#4a3626', 8); }
  people.forEach(q => q && guy(q));
  // bare bulb (sways a little)
  const sw = Math.sin(f * 0.05) * 0.04 + (sh._tw || 0) * Math.sin(f * 0.9) * 0.05;
  ctx.save(); ctx.translate(1250, -400); ctx.rotate(sw); line(0, 0, 0, 640, '#1a1a1a', 4); sf(ell(0, 665, 24, 30), sh.lightOn === false ? '#555' : '#fff3c4', 4); sf(rr(-14, 628, 28, 22, 4), '#777', 3); ctx.restore();
}
function basementLights(c, f, sh) {
  const sw = Math.sin(f * 0.05) * 0.04;
  if (sh.lightOn !== false) { light(c, 1250 + Math.sin(sw) * 640, 270, 1400, '#ffe0a8', 1.1); light(c, 1200, 900, 1200, '#ffd8a0', 0.45); }
  light(c, 1530, 300, 520, '#6f8fd8', 0.35);
  if ((sh._door || 0) > 0.05) light(c, 180, 320, 520, '#ffd28c', 0.7 * sh._door);
}

function doorState(f, sh) {
  if (sh.door === 'open') return 1;
  if (sh.door === 'opening') return after(f, sh) ? eo(bT(f, sh, 22)) : 0;
  if (sh.door === 'slam') return after(f, sh) ? 1 - Math.min(1, (f - sh.beat) / 5) : 1;
  return 0;
}
function placed(sh, f) {                              // hero position in the basement: on the stairs, then along the aisle
  const h = sh.hero || {};
  if (h.aisle) { const t = ss(seg(f, sh.a, (sh.beat ?? sh.b))); return [lerp(h.aisle[0], h.aisle[1], t), BF, t < 1 && f < (sh.beat ?? sh.b)]; }
  if (h.step != null) {
    const st = Array.isArray(h.step) ? lerp(h.step[0], h.step[1], ss(seg(f, sh.a, sh.b - 6))) : h.step;
    if (st >= BS.n + 0.5) return [BS.x0 + BS.n * BS.run + (st - BS.n) * 140, BF, Array.isArray(h.step)];
    const [x, y] = bStep(Math.max(0, st)); return [x, y + (st <= 0 ? 0 : 0), Array.isArray(h.step) && f < sh.b - 6];
  }
  return [h.x ?? 1000, BF, false];
}

Object.assign(SCENES, {
  kitchenB: {
    frames: { wide: [1250, 800, 1.05], door: [370, 880, 1.55], dad: [2020, 780, 1.9] },
    frameFn(sh, name) {
      const c = sh.crew || {}, jx = (sh.hero || {}).x ?? 620, kx = (c.kim || {}).x ?? 900;
      const sJ = 0.48, sK = 0.56;
      if (name === 'hero') return [jx, KF - 775 * sJ * 0.9, 2.5];
      if (name === 'kim') return [kx, KF - 775 * sK * 0.9, 2.3];
      if (name === 'two') return [(jx + kx) / 2, KF - 330, 1.5];
      return null;
    },
    ambient: '#8a80a0',
    draw(f, sh) {
      sh._door = doorState(f, sh);
      const c = sh.crew || {};
      const jeff = heroIn(sh, f, { x: (sh.hero || {}).x ?? 620, y: KF + 20, s: 0.48 });
      const kim = crewObj('kim', sh, f, { x: (c.kim || {}).x ?? 900, y: KF + 30, s: 0.56 });
      const dad = crewObj('dad', sh, f, { x: 2020, y: 1000, s: 0.62, noLegs: true });
      if (dad) dad._back = true;
      if (kim && (c.kim || {}).reachDoor) kim.armL = lerp(0.22, 1.5, ss(seg(f, sh.a, sh.a + 18)));
      kitchenSet(f, sh, [dad, jeff, kim]);
    },
    lights(l, f, sh) { kitchenLights(l, f, sh); },
  },
  basement: {
    frames: { wide: [1000, 760, 0.86], door: [180, 330, 2.0], case: [1750, 840, 1.45], chain: [1750, 880, 2.9], face: [1750, 640, 2.6], stairs: [640, 640, 1.2] },
    frameFn(sh, name) {
      const [x, y] = placed(sh, sh.b - 1);
      if (name === 'hero') return [x, y - 340, 2.4];
      if (name === 'body') return [x + 80, y - 260, 1.5];
      if (name === 'finger') return [(x + CASE.x) / 2, y - 320, 2.0];
      return null;
    },
    ambient: '#8285b4',
    draw(f, sh) {
      sh._door = doorState(f, sh);
      sh._tw = sh.react === 'chain' && after(f, sh) ? Math.max(0, 1 - (f - sh.beat) / 40) : 0;
      sh._lid = sh.lid === 'shift' && after(f, sh) ? Math.sin(Math.PI * clamp((f - sh.beat - 6) / 26)) : 0;
      const [x, y, walking] = placed(sh, f);
      const o = heroIn(sh, f, { x, y: y + 14, s: 0.48 });
      if (o) {
        if (walking) { o.walk = f * 0.3; o.walkAmt = 0.6; }
        if ((sh.hero || {}).point) o.armR = lerp(0.22, 1.45, ss(seg(f, sh.a + 10, sh.a + 50)));
        if (sh._tw > 0.5 && (sh.hero || {}).point) o.armR = 0.4;
      }
      basementSet(f, sh, [o]);
    },
    lights(l, f, sh) { basementLights(l, f, sh); },
  },
});
