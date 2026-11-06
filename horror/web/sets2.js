// ---------- story sets for scripted long videos: car at night, closed gas station, selfie camera, phone screens ----------
// Shots can carry a "crew": { role: {expr, expr2, look, lookY, tilt, x, laugh, grin, fake, lean, reach, phone} } drawn from CAST.

function crewObj(role, sh, f, base) {
  const c = CAST[role], sp = (sh.crew || {})[role];
  if (!c || !sp) return null;
  const seed = 5 + role.length * 3;
  const o = Object.assign({ seed }, LOOK(c), base, ex(sp.expr || 'calm'));
  if (sp.expr2 && after(f, sh)) Object.assign(o, ex(sp.expr2));
  o.talk = sh.speaker === role && !sh.phone && sh.ls != null && f >= sh.ls && f <= sh.le;
  if (o.talk) { o.mouthOpen = mouthAt(sh, f); o.bob = (o.bob || 0) - 6 * (o.mouthOpen || 0); }
  o.blink = blinkAt(f, seed); o.bob = (o.bob || 0) + Math.sin(f * 0.1 + seed) * 2;
  if (sp.look != null) o.look = sp.look;
  if (sp.lookY != null) o.lookY = sp.lookY;
  if (sp.tilt != null) o.tilt = sp.tilt;
  if (sp.turn != null) o.turn = sp.turn;
  if (sp.lean != null) o.lean = sp.lean;
  if (sp.reach) o.armL = lerp(0.22, 1.35, ss(seg(f, sh.a + 4, sh.a + 26)));
  if (sp.grin != null) { o.mouth = 'grin'; o.grin = sp.grin; o.brow = 'flat'; }
  if (sp.laugh) laughAnim(o, f, seed, o.talk ? o.mouthOpen : null);
  if (sp.phone) holdPhone(o, sp.phone, f, sh);
  if (sp.fake) { fakeAnim(o, sh, f); FAKE = o; }
  if (sp.alpha != null) o.alpha = sp.alpha;
  return o;
}
let FAKE = null;
function laughAnim(o, f, seed = 0, open = null) {
  const k = open != null ? open : Math.abs(Math.sin(f * 0.75 + seed));    // synced to the real laugh when there is one
  o.tilt = (o.tilt || 0) + 0.08 * (open != null ? (open - 0.4) : Math.sin(f * 0.75 + seed)); o.bob = (o.bob || 0) - k * 16;
  o.mouth = k > 0.15 ? 'o' : 'smile'; o.mo = 0.45 + 0.6 * k; o.lid = 0.4; o.brow = 'up'; o.talk = false;
}
function fakeAnim(o, sh, f) {      // the thing wearing Malik's face: head tilts, the selfie smile stretches too wide
  const t = (sh.crew.malik || {}).fake === 'full' ? 1 : after(f, sh) ? ss(bT(f, sh, 34)) : 0;
  Object.assign(o, { mouth: t > 0.3 ? 'grin' : 'smile', grin: 0.5 + 0.5 * t, grinW: 1 + 0.95 * t, pupil: lerp(16, 9, t),
    brow: 'flat', lid: 0, blink: 0, tilt: 0.34 * t, talk: false, circles: 0.6 * t });
  // the skin drains to ash grey, the eyes go black with red pinpoints: it is plainly not Malik any more
  const mixc = (a, b, k) => '#' + [0, 2, 4].map(i => Math.round(lerp(parseInt(a.substr(1 + i, 2), 16), parseInt(b.substr(1 + i, 2), 16), k)).toString(16).padStart(2, '0')).join('');
  o.skin = mixc(o.skin || '#6e4630', '#8b8e95', Math.min(1, t * 2.4)); o.eyeW = 1; o.teethCol = mixc('#f2ecdc', '#c9bb8a', t);
  if (t > 0.12) { o.eyeCol = '#120b14'; o.pupilCol = '#ff2a2a'; o.pupil = 9; o.circles = 0; }
  if (sh.speaker === 'villain' && sh.ls != null && f >= sh.ls && f <= sh.le + 20) {   // the laugh shakes it, in time with the sound
    const k = mouthAt(sh, f) || 0;
    o.bob = (o.bob || 0) - k * 26; o.tilt += 0.07 * (k - 0.35); o.grinW = 1.9 + 0.22 * k; o.grin = 1;
  }
}
function holdPhone(o, how, f, sh) {
  if (how === 'ear') { o.armR = 2.55; o.armsFront = true; }
  else if (how === 'up') { o.armR = 2.0; o.armsFront = true; }
  else if (how === 'down') o.armR = 0.5;
  o.holdR = (hx, hy) => {
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(how === 'ear' ? -0.4 : 0.15);
    sf(rr(-46, -150, 92, 170, 16), '#15141c', 6 / (o.s || 1));
    sf(rr(-36, -138, 72, 140, 8), how === 'ear' || how === 'down' ? '#1d2440' : '#8fb4ff', 0);
    ctx.restore();
  };
  if (sh.flashOn && how === 'up') o.flashAt = true;
}
function heroIn(sh, f, base) {
  const o = heroObj(sh, f, base);
  if (!o) return null;
  const h = sh.hero || {};
  if (h.phone) holdPhone(o, h.phone, f, sh);
  if (h.laugh) laughAnim(o, f, 1);
  if (h.look != null) o.look = h.look;
  if (h.lookY != null) o.lookY = h.lookY;
  if (h.tilt != null) o.tilt = h.tilt;
  if (h.turn != null) o.turn = h.turn;
  if (h.glance) {                     // looks at the person beside him, then back
    const g = after(f, sh) ? Math.sin(Math.PI * clamp((f - sh.beat) / 40)) : 0;
    o.look = lerp(o.look || 0, h.glance, g);
  }
  if (h.lookTo != null) o.look = lerp(o.look || 0, h.lookTo, ss(seg(f, sh.a + 6, sh.a + 50)));
  if (h.terror) Object.assign(o, { eyeW: 1.32, pupil: 6, pupilShake: 3, tremble: 6, sweat: true, mouth: 'wobble', brow: 'worry', hairUp: 0.6 });
  if (h.shake) o.tremble = Math.max(o.tremble || 0, h.shake);
  return o;
}

// ---------- car interior, seen from the windshield looking back ----------
function carInterior(f, sh, joe, maya, ben) {
  const moving = sh.parked ? 0 : 1;
  fillR(-1700, -700, 4600, 3300, '#1d1830');
  // rear window: the road running away behind us
  const rw = poly([[170, 540], [910, 540], [960, 820], [120, 820]]);
  ctx.save(); ctx.clip(rw);
  const sky = ctx.createLinearGradient(0, 540, 0, 820); sky.addColorStop(0, '#0d1230'); sky.addColorStop(1, '#27305a');
  ctx.fillStyle = sky; ctx.fillRect(100, 530, 880, 300);
  sf(poly([[120, 735], [300, 700], [460, 715], [640, 695], [820, 712], [960, 700], [960, 735]]), '#0a0d1e', 0);
  sf(poly([[470, 735], [610, 735], [900, 830], [180, 830]]), '#2a2833', 0);
  for (let i = 0; i < 6; i++) {        // lamps sliding away toward the vanishing point
    const t = ((f * 0.012 * moving + i / 6) % 1), e = 1 - t;
    for (const sd of [-1, 1]) {
      const x = 540 + sd * (60 + 420 * e * e), y = 728 - 10 + 90 * e * e;
      ctx.globalAlpha = 0.25 + 0.75 * e; ctx.fillStyle = '#ffd38a'; ctx.beginPath(); ctx.arc(x, y - 60 * e, 4 + 10 * e, 0, 7); ctx.fill();
    }
  }
  ctx.globalAlpha = 1; ctx.restore(); sf(rw, null, 7);
  // side windows: lights streaking past
  for (const sd of [-1, 1]) {
    const p = sd < 0 ? poly([[-460, 540], [70, 560], [60, 880], [-460, 930]]) : poly([[1010, 560], [1540, 540], [1540, 930], [1020, 880]]);
    ctx.save(); ctx.clip(p); fillR(-480, 520, 2050, 430, '#121733');
    for (let i = 0; i < 4; i++) {
      const x = sd < 0 ? 100 - ((f * 26 * moving + i * 190) % 640) : 980 + ((f * 26 * moving + i * 190) % 640);
      const g = ctx.createRadialGradient(x, 640, 0, x, 640, 90); g.addColorStop(0, 'rgba(255,214,150,0.9)'); g.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 90, 550, 180, 180);
    }
    ctx.restore(); sf(p, null, 7);
  }
  // roof, dome light
  sf(poly([[-700, -700], [2800, -700], [1540, 540], [-460, 540]]), '#2b2442', 0);
  sf(rr(490, 440, 100, 36, 12), sh.dome ? '#fff1c8' : '#4a4460', 5);
  // back bench (the seat behind Maya stays in deep shadow)
  sf(rr(60, 800, 960, 470, 50), '#3a3352');
  sf(rr(250, 700, 170, 120, 34), '#433b5c'); sf(rr(660, 700, 170, 120, 34), '#433b5c');
  if (joe) guy(joe);
  ctx.save(); const sg = ctx.createLinearGradient(60, 0, 420, 0); sg.addColorStop(0, 'rgba(6,4,14,0.85)'); sg.addColorStop(1, 'rgba(6,4,14,0)');
  ctx.fillStyle = sg; ctx.fillRect(40, 560, 420, 720); ctx.restore();
  // front seats + front passengers
  for (const x of [260, 820]) { sf(rr(x - 175, 900, 350, 560, 60), '#4a4262'); sf(rr(x - 85, 800, 170, 140, 40), '#544b6e'); }
  if (maya) guy(maya);
  if (ben) guy(ben);
  // rear-view mirror (Maya's eyes in it on the "mirror" shot)
  line(540, 476, 540, 500, INK, 8);
  sf(rr(410, 495, 260, 92, 24), '#2a2636');
  ctx.save(); const mp = rr(426, 508, 228, 66, 16); ctx.clip(mp); fillR(420, 500, 240, 80, '#3d4668');
  if (sh.mirror && CAST.maya) { const m = Object.assign({ seed: 9 }, LOOK(CAST.maya), ex('worried'), { x: 540, y: 535 + 775 * 0.42, s: 0.42, noLegs: true, look: 0.6, blink: blinkAt(f, 9), flip: true }); guy(m); }
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(430, 508, 60, 66); ctx.restore(); sf(mp, null, 5);
  // dashboard, wheel, radio
  sf(poly([[-700, 1330], [1780, 1330], [1780, 2600], [-700, 2600]]), '#17131f', 0);
  sf(rr(-700, 1300, 2480, 70, 30), '#262033', 6);
  ctx.strokeStyle = INK; ctx.lineWidth = L(46); ctx.beginPath(); ctx.ellipse(260, 1420, 230, 120, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  ctx.strokeStyle = '#2c2638'; ctx.lineWidth = L(34); ctx.stroke();
  sf(rr(470, 1320, 160, 56, 10), '#0a0f1c', 5);
  if (sh.radio) { ctx.fillStyle = '#7fe0ff'; ctx.font = 'bold 34px "DejaVu Sans Mono"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FM 98.4', 550, 1349); }
}
function carLights(c, f, sh) {
  light(c, 540, 1380, 760, '#6d86ff', 0.6);
  light(c, 540, 950, 900, '#c8d0ff', 0.45);
  light(c, 540, 640, 620, '#8fa3e0', 0.5);
  if (!sh.parked) { const x = -900 + ((f * 21) % 3000); light(c, x, 860, 620, '#ffc77a', 0.5); }
  if (sh.sweep && sh.beat != null) { const t = seg(f, sh.beat - 18, sh.beat + 8); light(c, lerp(-300, 1500, t), 820, 700, '#ffe2a8', 1.1 * Math.sin(Math.PI * t)); }
  if (sh.dome) light(c, 540, 470, 1000, '#ffe6b0', 0.95);
}

// ---------- the selfie: a photo composition in a 1600 x 1000 box ----------
function selfieComp(f, sh, mode, fr) {     // mode: 'three' (blurred 4th face) | 'four' (all four, at the gas station)
  const four = mode === 'four';
  if (four) {
    const g = ctx.createLinearGradient(0, 0, 0, 1000); g.addColorStop(0, '#20263f'); g.addColorStop(1, '#3a3346');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1600, 1000);
    sf(rr(-50, 60, 1700, 90, 0), '#d9d4c8', 5); fillR(-50, 120, 1700, 18, '#b8323a');
    sf(rr(680, 150, 240, 40, 8), '#fff7da', 4);
  } else {
    fillR(0, 0, 1600, 1000, '#211b33');
    sf(poly([[120, 120], [1480, 120], [1540, 470], [60, 470]]), '#151a38', 6);
    ctx.save(); ctx.globalAlpha = 0.8; for (let i = 0; i < 5; i++) { ctx.fillStyle = '#ffd38a'; ctx.beginPath(); ctx.arc(260 + i * 270, 330 + (i % 2) * 30, 9, 0, 7); ctx.fill(); } ctx.restore();
    sf(rr(30, 520, 1540, 600, 60), '#3a3352', 6);
  }
  const C = k => CAST[k] ? Object.assign({ seed: 5 + k.length * 3 }, LOOK(CAST[k])) : null;
  const put = (o, extra) => o && guy(Object.assign(o, { noLegs: true, blink: four ? 0 : blinkAt(fr, o.seed) }, extra));
  if (four) {
    put(C('maya'), Object.assign({ x: 230, y: 470 + 775 * 0.62, s: 0.62, tilt: 0.12 }, ex('relieved')));
    put(C('ben'), Object.assign({ x: 560, y: 450 + 775 * 0.7, s: 0.7, tilt: -0.08 }, ex('relieved'), { mouth: 'smile' }));
    put(C('malik'), Object.assign({ x: 1270, y: 440 + 775 * 0.72, s: 0.72, tilt: -0.1 }, ex('relieved'), { brow: 'up' }));
    put(heroObj({ hero: { expr: 'relieved' } }, fr, { x: 920, y: 470 + 775 * 0.78, s: 0.78, noLegs: true, look: 0 }), { mouth: 'smile', tilt: 0.05 });
  } else {
    put(C('maya'), Object.assign({ x: 170, y: 430 + 775 * 0.45, s: 0.45, look: 1 }, ex('calm')));
    put(C('ben'), Object.assign({ x: 470, y: 560 + 775 * 0.82, s: 0.82, tilt: -0.14 }, ex('relieved'), { mouth: 'smile' }));
    put(heroObj({ hero: { expr: 'relieved' } }, fr, { x: 880, y: 470 + 775 * 0.92, s: 0.92, noLegs: true, look: 0 }), { mouth: 'smile' });
    // the fourth face: pressed against the far window, smeared by the streetlight and the moving car
    const m = C('malik');
    if (m) {
      ctx.save(); ctx.filter = 'brightness(1.9) saturate(0.2) blur(9px)';
      for (const dx of [-40, 0, 34]) { ctx.globalAlpha = dx ? 0.3 : 0.7; guy(Object.assign({}, m, ex('stare'), { x: 1390 + dx, y: 430 + 775 * 0.8, s: 0.8, noLegs: true, tilt: 0.18, blink: 0, lid: 0.3, acc: {} })); }
      ctx.filter = 'blur(7px)'; ctx.globalAlpha = 0.75; ctx.fillStyle = '#1a1424';      // two eyes and the suggestion of a mouth
      ctx.save(); ctx.translate(1390, 430); ctx.rotate(0.18);
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 66, 0, 26, 36, 0, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.ellipse(0, 120, 60, 18, 0, 0, 7); ctx.fill(); ctx.restore();
      ctx.restore();
      ctx.save(); ctx.strokeStyle = '#f4f4f2'; ctx.lineWidth = L(7); ctx.beginPath(); ctx.moveTo(1520, 480); ctx.quadraticCurveTo(1545, 600, 1505, 700); ctx.stroke(); ctx.restore();
    }
    const glare = ctx.createLinearGradient(1050, 0, 1650, 600); glare.addColorStop(0, 'rgba(255,226,170,0)'); glare.addColorStop(0.6, 'rgba(255,226,170,0.55)'); glare.addColorStop(1, 'rgba(255,240,210,0.2)');
    ctx.fillStyle = glare; ctx.fillRect(0, 0, 1600, 1000);
  }
}
function wobbleCircle(cx, cy, r, f, p = 1) {
  ctx.save(); ctx.strokeStyle = '#ff2b2b'; ctx.lineWidth = L(14); ctx.lineCap = 'round'; ctx.beginPath();
  const n = 60, end = Math.floor(n * 1.12 * p);
  for (let i = 0; i <= end; i++) { const a = -1.9 + (i / n) * Math.PI * 2, rr2 = r * (1 + 0.07 * Math.sin(i * 0.9 + 2) + 0.04 * Math.sin(i * 2.3)); const x = cx + Math.cos(a) * rr2 * 1.08, y = cy + Math.sin(a) * rr2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke(); ctx.restore();
}
function drawPhoto(f, sh, mode, x, y, w, extra = {}) {     // the selfie, scaled into a w-wide box at (x, y)
  const k = w / 1600, z = extra.zoom || 1, cx = extra.cx ?? 800, cy = extra.cy ?? 500;
  const _cz = CZ;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, extra.h || 1000 * k); ctx.clip();
  ctx.translate(x + w / 2, y + (extra.h || 1000 * k) / 2); ctx.scale(k * z, k * z); ctx.translate(-cx, -cy);
  CZ = _cz * k * z;
  selfieComp(f, sh, mode, extra.frozen ?? f);
  if (extra.circle) wobbleCircle(1390, 470, 210, f, extra.circle);
  CZ = _cz; ctx.restore();
  sf(rr(x, y, w, extra.h || 1000 * k, 4), null, 4);
}

// ---------- phone screens ----------
function phoneShell(f, bg) {
  const g = ctx.createRadialGradient(540, 900, 100, 540, 900, 1500);
  g.addColorStop(0, bg === 'station' ? '#3a3448' : '#252040'); g.addColorStop(1, '#07060e');
  ctx.fillStyle = g; ctx.fillRect(-1300, -400, 3700, 2700);
  for (let i = 0; i < 7; i++) {      // soft bokeh behind the phone
    const x = (bg === 'car' ? (rnd(i) * 2600 - 700 + f * 4) % 2600 - 700 : rnd(i) * 2600 - 700), y = 300 + rnd(i + 3) * 1300;
    const b = ctx.createRadialGradient(x, y, 0, x, y, 90 + rnd(i + 7) * 80); b.addColorStop(0, 'rgba(255,205,140,0.18)'); b.addColorStop(1, 'rgba(255,205,140,0)');
    ctx.fillStyle = b; ctx.fillRect(x - 200, y - 200, 400, 400);
  }
  sf(ell(890, 1440, 130, 190, -0.5), SKIN);
  sf(rr(250, 380, 580, 1160, 70), '#1c1b22');
  sf(rr(280, 440, 520, 1040, 30), '#0f1830', 4);
}
function bubble(x, y, w, text, mine, alpha = 1, font = 36) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.font = `bold ${font}px "DejaVu Sans"`;
  const words = text.split(/\s+/), lines = []; let cur = '';
  for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (ctx.measureText(t).width > w - 50) { lines.push(cur); cur = wd; } else cur = t; }
  if (cur) lines.push(cur);
  const h = 34 + lines.length * (font + 12);
  const bx = mine ? x - w : x;
  sf(rr(bx, y, w, h, 28), mine ? '#3b82f6' : '#e9eef8', 3);
  ctx.fillStyle = mine ? '#fff' : '#16131c'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, bx + 24, y + 18 + i * (font + 12)));
  ctx.restore(); return h;
}
function screenHeader(name, sub) {
  fillR(280, 440, 520, 120, '#17223f');
  ctx.fillStyle = '#9fb0d8'; ctx.font = '26px "DejaVu Sans"'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('9:47', 310, 470);
  sf(ell(340, 522, 26, 26), '#6a7fb8', 3);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px "DejaVu Sans"'; ctx.textAlign = 'center'; ctx.fillText(name[0], 340, 523);
  ctx.textAlign = 'left'; ctx.font = 'bold 32px "DejaVu Sans"'; ctx.fillText(name, 384, 512);
  if (sub) { ctx.font = '22px "DejaVu Sans"'; ctx.fillStyle = '#7fe0a0'; ctx.fillText(sub, 384, 544); }
}
function phone2(f, sh) {
  const t = sh.text || {}, mode = sh.mode || 'chat';
  phoneShell(f, sh.bg || 'car');
  ctx.save(); ctx.beginPath(); ctx.rect(280, 440, 520, 1040); ctx.clip();
  const g = ctx.createLinearGradient(0, 440, 0, 1480); g.addColorStop(0, '#1b2a50'); g.addColorStop(1, '#0d1530'); ctx.fillStyle = g; ctx.fillRect(280, 440, 520, 1040);
  const bt = sh.beat != null ? clamp((f - sh.beat) / 8) : 1;
  if (mode === 'photo') {
    screenHeader('Photos', null);
    drawPhoto(f, sh, 'three', 290, 760, 500, { frozen: sh.a });
  } else if (mode === 'chat') {
    screenHeader(t.name || 'Dad', null);
    drawPhoto(f, sh, 'three', 420, 620, 360, { frozen: sh.a });
    const sent = sh.beat == null || f >= sh.beat;
    if (sent) { const yy = lerp(1380, 880, eo(bt)); bubble(780, yy, 340, t.msg || 'On our way home.', true); if (bt >= 1) { ctx.fillStyle = '#9fb0d8'; ctx.font = '22px "DejaVu Sans"'; ctx.textAlign = 'right'; ctx.fillText('Delivered', 780, 990); } }
    sf(rr(300, 1390, 480, 64, 32), '#22305a', 3);
    if (!sent) { ctx.fillStyle = '#dfe8ff'; ctx.font = '30px "DejaVu Sans"'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(t.msg || 'On our way home.', 324, 1422); }
  } else if (mode === 'call') {
    const pulse = (f % 30) / 30;
    ctx.save(); ctx.globalAlpha = 1 - pulse; ctx.strokeStyle = '#7fe0a0'; ctx.lineWidth = L(6); ctx.beginPath(); ctx.arc(540, 760, 110 + pulse * 120, 0, 7); ctx.stroke(); ctx.restore();
    sf(ell(540, 760, 110, 110), '#6a7fb8', 5);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 110px "DejaVu Sans"'; ctx.fillText((t.name || 'DAD')[0], 540, 765);
    ctx.font = `bold ${(t.name || 'DAD').length > 6 ? 64 : 80}px "DejaVu Sans"`; ctx.fillText(t.name || 'DAD', 540, 960);
    ctx.font = '34px "DejaVu Sans"'; ctx.fillStyle = '#9fb0d8'; ctx.fillText(t.sub || 'incoming call', 540, 1040);
    sf(ell(400, 1330, 60, 60), '#e5484d', 4); sf(ell(680, 1330, 60, 60), '#30c46a', 4);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 40px "DejaVu Sans"'; ctx.fillText('✕', 400, 1332); ctx.fillText('✆', 680, 1334);
  } else if (mode === 'circle') {
    screenHeader('Dad', t.sub || 'on speaker  0:41');
    const zt = ss(seg(f, sh.a, sh.b)), z0 = (sh.zoom || [1, 1])[0], z1 = (sh.zoom || [1, 1])[1], z = lerp(z0, z1, zt);
    const p = sh.react === 'circle' ? (after(f, sh) ? clamp((f - sh.beat) / 16) : 0) : 1;
    const focus = clamp((z - 1) / 1.5);
    drawPhoto(f, sh, 'three', 280, 600, 520, { h: 700, zoom: z * 0.7 * 1600 / 520 / 1.35, cx: lerp(1080, 1390, focus), cy: lerp(500, 470, focus), circle: p, frozen: sh.a });
  } else if (mode === 'reply') {
    screenHeader(t.name || 'Dad', null);
    drawPhoto(f, sh, 'four', 420, 600, 360, { frozen: sh.a });
    if (sh.beat == null || f >= sh.beat) { const pop = back(bt); ctx.save(); ctx.translate(310, 900); ctx.scale(pop, pop); bubble(0, 0, 380, t.msg || 'Hi Malik. Sorry.', false, 1); ctx.restore(); }
  }
  ctx.restore();
  sf(rr(470, 455, 140, 26, 13), '#0b0a10', 0);
  if (sh.react === 'buzz' || (mode === 'call' && sh.react === 'ring')) { if (sh.beat != null) rings(540, 700, f, sh.beat, sh.beat + 50, '#cfe0ff', 10, 300, -Math.PI / 2 + 0.0001); }
}

// ---------- a closed gas station, one working light ----------
const ST_GROUND = 1500;
function station(f, sh, people, car) {
  const sky = ctx.createLinearGradient(0, -700, 0, ST_GROUND); sky.addColorStop(0, '#060a20'); sky.addColorStop(1, '#1b2350');
  ctx.fillStyle = sky; ctx.fillRect(-1700, -700, 4800, ST_GROUND + 700);
  ctx.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.3 + 0.5 * noise1(f * 0.05 + i); ctx.fillRect(-1600 + rnd(i) * 4600, -600 + rnd(i + 40) * 1400, 4, 4); } ctx.globalAlpha = 1;
  const tp = [[-1700, ST_GROUND]]; for (let x = -1700; x <= 3100; x += 120) tp.push([x, 1180 + Math.sin(x * 0.013) * 40 + rnd(x) * 60]); tp.push([3100, ST_GROUND]);
  sf(poly(tp), '#0a0d1e', 0);
  // the shop, closed
  sf(rr(-1150, 760, 1200, 740, 6), '#3a3448');
  for (let i = 0; i < 3; i++) sf(rr(-1080 + i * 330, 900, 280, 330, 6), '#141826', 5);
  sf(rr(-700, 640, 500, 100, 12), '#2a2236', 5);
  ctx.save(); ctx.fillStyle = '#ff5050'; ctx.shadowColor = '#ff3030'; ctx.shadowBlur = 18; ctx.font = 'bold 64px "DejaVu Sans"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.55 + 0.25 * (noise1(f * 0.4) > 0.3 ? 1 : 0); ctx.fillText('CLOSED', -450, 692); ctx.restore();
  // ground
  fillR(-1700, ST_GROUND, 4800, 1200, '#2b2a33');
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(-900 + rnd(i) * 3400, 1600 + rnd(i + 5) * 600, 90 + rnd(i + 2) * 80, 20, 0, 0, 7); ctx.fill(); }
  fillR(-1700, 1880, 4800, 14, '#c9b45a');
  // canopy
  sf(rr(230, 440, 50, ST_GROUND - 440, 6), '#bdb8ad'); sf(rr(1560, 440, 50, ST_GROUND - 440, 6), '#bdb8ad');
  sf(rr(120, 330, 1600, 120, 10), '#d9d4c8'); fillR(130, 410, 1580, 24, '#b8323a');
  const on = 0.85 + 0.15 * (noise1(f * 0.7) > 0.15 ? 1 : 0);
  sf(rr(400, 450, 200, 26, 6), '#4a4652', 4); sf(rr(1240, 450, 200, 26, 6), '#4a4652', 4);
  sf(rr(820, 450, 200, 26, 6), `rgba(255,247,218,${on})`, 4);
  // pumps
  for (const x of [330, 1760]) { sf(rr(x - 70, 1120, 140, 380, 14), '#cfcac0'); sf(rr(x - 50, 1150, 100, 80, 8), '#1d2236', 4); sf(rr(x - 85, 1480, 170, 30, 6), '#8a8478'); }
  if (car) carSide(f, sh);
  people.forEach(p => p && guy(p));
}
function carSide(f, sh) {
  const p = sh.doorP || 0, dome = sh.dome && (!sh.domeAt || f >= sh.domeAt);
  ctx.save(); ctx.translate(sh.carX || 0, 0);
  sf(poly([[690, 1230], [800, 1070], [1310, 1070], [1420, 1230]]), '#6a2630');
  const win = dome ? '#d8b26a' : '#141826';
  const fw = poly([[740, 1222], [820, 1090], [995, 1090], [995, 1222]]), rw = poly([[1020, 1222], [1020, 1090], [1290, 1090], [1375, 1222]]);
  sf(fw, win, 5);
  ctx.save(); ctx.clip(rw); fillR(1010, 1080, 380, 160, win);
  if (sh.shiftAt != null && f >= sh.shiftAt) { const t = seg(f, sh.shiftAt, sh.shiftAt + 26); ctx.globalAlpha = 0.85; sf(ell(lerp(1140, 1230, ss(t)), 1205, 110, 120), '#06050b', 0); ctx.globalAlpha = 1; }
  if (sh.beam) { const bx = lerp(1000, 1400, ss(seg(f, sh.a + 6, sh.a + 56))); const g = ctx.createRadialGradient(bx, 1160, 0, bx, 1160, 120); g.addColorStop(0, 'rgba(255,255,240,0.95)'); g.addColorStop(1, 'rgba(255,255,240,0)'); ctx.fillStyle = g; ctx.fillRect(bx - 130, 1030, 260, 260); }
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(1040, 1090); ctx.lineTo(1110, 1090); ctx.lineTo(1040, 1200); ctx.closePath(); ctx.fill();
  ctx.restore(); sf(rw, null, 5);
  sf(rr(560, 1215, 900, 220, 60), '#7a2d35');
  line(1005, 1090, 1005, 1400, INK, 5);
  // rear door: swings open toward us from its front edge
  if (p > 0) {
    sf(poly([[1010, 1090], [1290, 1090], [1290, 1405], [1010, 1405]]), '#0b0910', 4);
    const ex2 = 1290 - 250 * p, dy = 50 * p;
    sf(poly([[1010, 1090], [ex2, 1090 - dy], [ex2, 1405 + dy], [1010, 1405]]), '#8a3640', 6);
    sf(rr(lerp(1240, 1040, p) - 10, 1250, 60, 18, 9), '#c9c4bd', 4);
  } else { line(1290, 1090, 1300, 1400, INK, 5); sf(rr(1220, 1250, 60, 18, 9), '#c9c4bd', 4); }
  sf(rr(940, 1250, 60, 18, 9), '#c9c4bd', 4);
  sf(rr(545, 1260, 40, 50, 12), '#f7e7a8', 4); sf(rr(1440, 1250, 30, 70, 10), '#e5484d', 4);
  for (const x of [740, 1290]) { sf(ell(x, 1420, 86, 86), '#141218'); sf(ell(x, 1420, 40, 40), '#8a8478', 5); }
  if (sh.shoeAt != null && f >= sh.shoeAt) { const t = ss(seg(f, sh.shoeAt, sh.shoeAt + 10)); const y = lerp(1380, ST_GROUND + 30, t);
    sf(rr(1140, y - 60, 70, 60, 20), '#1f1d26'); ctx.save(); ctx.translate(1180, y); sf(rr(-70, -40, 150, 46, 20), '#2a2a34'); sf(rr(-74, -6, 160, 18, 9), '#f3efe6'); ctx.restore(); }
  ctx.restore();
}
function stationLights(c, f, sh) {
  const on = 0.85 + 0.15 * (noise1(f * 0.7) > 0.15 ? 1 : 0);
  light(c, 920, 520, 1300, '#fff1cf', 1.15 * on);
  light(c, 920, 1500, 900, '#ffe2b0', 0.55 * on);
  light(c, 950, 1050, 1500, '#ffeccc', 0.75 * on);
  light(c, -450, 700, 500, '#ff5050', 0.25);
  if (sh.dome && (!sh.domeAt || f >= sh.domeAt)) light(c, 1100, 1150, 500, '#ffd890', 0.7);
  if (sh.beam) { const bx = lerp(1000, 1400, ss(seg(f, sh.a + 6, sh.a + 56))); light(c, bx, 1160, 260, '#ffffff', 0.9); }
  if (sh.fakeGlow && after(f, sh)) light(c, (sh.crew.malik.x || 1260), 1060, 340, '#ff3b3b', 0.45 * ss(bT(f, sh, 30)));
  if (sh.redOn) light(c, ((sh.hero || {}).x || 1700) - 160, 1080, 520, '#ff3030', 0.55);
  if (sh.flicker && after(f, sh)) { /* handled by ambient */ }
}

// positions of people at the station (x along the ground)
const ST_POS = { maya: 150, ben: 470, joe: 1660, malik: 1180 };
function stationPeople(sh, f) {
  FAKE = null;
  const s = 0.62, y = ST_GROUND + 60;
  const out = [];
  const crew = sh.crew || {};
  for (const r of ['maya', 'ben', 'malik']) if (crew[r]) out.push(crewObj(r, sh, f, { x: crew[r].x ?? ST_POS[r], y: y + (crew[r].dy || 0), s }));
  const joe = heroIn(sh, f, { x: (sh.hero || {}).x ?? ST_POS.joe, y, s });
  out.push(joe);
  return out;
}

Object.assign(SCENES, {
  car: {
    frames: { wide: [540, 1020, 1.6], hero: [540, 790, 2.3], maya: [260, 960, 2.1], ben: [820, 960, 2.1], mirror: [540, 541, 5.2], radio: [600, 1320, 2.4], seat: [240, 900, 2.0] },
    ambient: '#6c71aa',
    draw(f, sh) {
      const crew = sh.crew || {};
      const joe = heroIn(sh, f, { x: 540, y: 800 + 775 * 0.5, s: 0.5, noLegs: true });
      const maya = crewObj('maya', sh, f, { x: 260, y: 935 + 775 * 0.6, s: 0.6, noLegs: true });
      const ben = crewObj('ben', sh, f, { x: 820, y: 935 + 775 * 0.6, s: 0.6, noLegs: true });
      carInterior(f, sh, joe, maya, ben);
      if (sh.react === 'buzz' && sh.beat != null) rings(540 + 140, 760, f, sh.beat, sh.beat + 40, '#cfe0ff', 9, 160, -0.6);
    },
    lights(l, f, sh) { carLights(l, f, sh); },
  },
  selfie: {
    frames: { wide: [800, 520, 1.2], hero: [860, 480, 1.7], fourth: [1390, 470, 2.4] },
    ambient: '#6a6f9a',
    draw(f, sh) {
      const frozen = sh.beat != null && f >= sh.beat ? sh.beat : f;
      selfieComp(f, sh, sh.mode || 'three', frozen);
    },
    lights(l, f, sh) { light(l, 800, 500, 1300, '#ffffff', 0.6); light(l, 1280, 480, 520, '#fff4e0', 0.55); light(l, 250, 500, 480, '#fff4e0', 0.4); },
  },
  phone2: {
    frames: { wide: [540, 930, 0.92], prop: [540, 940, 1.05], screen: [540, 820, 1.5], photo: [540, 950, 1.5] },
    ambient: '#5a5f90',
    draw(f, sh) {
      ctx.save(); if ((sh.react === 'buzz' || sh.react === 'ring') && after(f, sh) && f - sh.beat < 40) ctx.translate(Math.sin(f * 2.6) * 7, 0);
      phone2(f, sh); ctx.restore();
    },
    lights(l, f) { light(l, 540, 900, 900, '#dfe6ff', 1.0); light(l, 540, 900, 1500, '#5060a0', 0.6); },
    glow: [540, 900, 420, '#9fb8ff', 0.12],
  },
  station: {
    frames: { wide: [960, 1090, 1.35], hero: [1660, 1110, 2.3], door: [1150, 1250, 1.8], window: [1160, 1160, 3.3], low: [1170, 1440, 2.6],
      maya: [300, 1110, 2.3], ben: [520, 1110, 2.3], malik: [1180, 1110, 2.3] },
    frameFn(sh, name) {
      const c = sh.crew || {}, hx = (sh.hero || {}).x ?? ST_POS.joe;
      const at = r => (c[r] && c[r].x != null) ? c[r].x : ST_POS[r];
      if (name === 'hero') return [hx, 1110, 2.3];
      if (name === 'maya' || name === 'ben' || name === 'malik') return [at(name), 1110, 2.3];
      if (name === 'pair') return [(hx + at('malik')) / 2, 1090, 1.65];
      if (name === 'group') return [1000, 1090, 1.45];
      if (name === 'malikClose') return [at('malik'), 1075, 3.4];
      return null;
    },
    ambient: '#6a70a6',
    draw(f, sh) {
      sh.carX = sh.carIn ? lerp(-1900, 0, eo(seg(f, sh.a, sh.a + 75))) : 0;
      sh.doorP = sh.door === 'open' ? 1 : (sh.react === 'door_open' && after(f, sh)) ? ss(bT(f, sh, 26)) : 0;
      sh.shoeAt = sh.shoe != null && sh.beat != null ? sh.beat + sh.shoe : null;
      sh.shiftAt = sh.react === 'shift' ? sh.beat : null;
      sh.domeAt = sh.react === 'dome' ? sh.beat : null;
      station(f, sh, stationPeople(sh, f), true);
      if (FAKE && FAKE.pupilCol) {      // the eyes catch the light: two small red points
        const o = FAKE, s = o.s, tl = o.tilt || 0, hy = o.y + s * (-775 + (o.bob || 0)), a = 1;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const sd of [-1, 1]) { const ex2 = sd * 84, ey = 14; light(ctx, o.x + s * (Math.cos(tl) * ex2 - Math.sin(tl) * ey), hy + s * (Math.sin(tl) * ex2 + Math.cos(tl) * ey), 70 * s, '#ff2a2a', 0.9 * a); }
        ctx.restore();
      }
    },
    lights(l, f, sh) { stationLights(l, f, sh); },
  },
});
