// ---------- THE MUMMY DOWNSTAIRS, full film: people helpers, hallway delivery, bedroom at night, magic shop,
// ---------- kitchen at night, close-up inserts, Kim's costume, the real mummy's foot and shadow, flashback look

// ---- people: hero (Jeff) or a cast member, with per-shot wardrobe, walking, crouching and costume
function personSpec(role, sh) { return role === 'hero' ? sh.hero : (sh.crew || {})[role]; }
function person(role, sh, f, base) {
  const sp = personSpec(role, sh);
  if (!sp) return null;
  const b = Object.assign({}, base);
  if (sp.walk) {                                   // walk [x0, x1] across the shot (or until the beat)
    const end = sp.walkUntil === 'beat' && sh.beat != null ? sh.beat : sh.b - 4;
    const t = ss(seg(f, sh.a + (sp.walkDelay || 0), end));
    b.x = lerp(sp.walk[0], sp.walk[1], t);
    if (t > 0 && t < 1) { b.walk = f * (sp.shuffle ? 0.18 : 0.3); b.walkAmt = sp.shuffle ? 0.4 : 0.7; }
  }
  if (sp.crouch) { b.noLegs = true; b.y = (b.y || 0) + 120 * (b.s || 0.6); }
  if (sp.sit) { b.noLegs = true; }
  const o = role === 'hero' ? heroIn(sh, f, b) : crewObj(role, sh, f, b);
  if (!o) return null;
  for (const k of ['outfit', 'top', 'pants', 'stripe']) if (sp[k] != null) o[k] = sp[k];
  if (sp.hood === false) o.hood = false;
  if (sp.armL != null) o.armL = sp.armL;
  if (sp.armR != null) o.armR = sp.armR;
  if (sp.reachR) o.armR = lerp(0.22, 1.5, ss(seg(f, sh.a + 4, sh.a + 20)));
  if (sp.cough && after(f, sh)) { const k = Math.abs(Math.sin((f - sh.beat) * 0.5)) * Math.max(0, 1 - (f - sh.beat) / 60); o.lean = (o.lean || 0) + 0.25 * k; o.armL = 2.4; }
  if (sp.flashlight) { o.armR = 1.35; o.holdR = (hx, hy) => { sf(rr(hx - 18, hy - 50, 36, 90, 8), '#2a2a32', 5); }; }
  if (sp.silhouette) Object.assign(o, { skin: '#0b0810', top: '#0b0810', pants: '#0b0810', hair: '#0b0810', blink: 1, mouth: 'flat', acc: {} });
  o._crouch = !!sp.crouch;
  o._costume = sp.unmask && after(f, sh) ? 'faceoff' : (sp.costume || null);
  return o;
}
function drawPerson(o) {
  if (!o) return;
  guy(o);
  if (o._costume) costume(o, o._costume);
}
function costume(o, mode) {                       // loose cream cloth strips wrapped over Kim's clothes
  const s = o.s || 0.56, x = o.x, y = o.y, hy = y + s * (-775 + (o.bob || 0));
  ctx.save();
  const clip = new Path2D();
  clip.rect(x - 200 * s, y - 540 * s, 400 * s, 500 * s);                 // body and legs (shoes stay visible)
  for (const sd of [-1, 1]) clip.rect(x + sd * 150 * s - 60 * s + (sd > 0 ? 0 : -150 * s), y - 520 * s, 210 * s, 300 * s);
  if (mode === 'full') clip.arc(x, hy, 236 * s, 0, 7);
  ctx.clip(clip);
  ctx.globalAlpha = 0.93;
  for (let i = -14; i < 22; i++) {
    const yy = hy - 260 * s + i * 52 * s, tilt = (i % 2 ? 1 : -1) * 18 * s;
    ctx.fillStyle = i % 3 ? '#e7dcc2' : '#d8caa9';
    ctx.beginPath(); ctx.moveTo(x - 260 * s, yy); ctx.lineTo(x + 260 * s, yy + tilt); ctx.lineTo(x + 260 * s, yy + tilt + 42 * s); ctx.lineTo(x - 260 * s, yy + 42 * s); ctx.fill();
    ctx.strokeStyle = 'rgba(80,60,40,0.35)'; ctx.lineWidth = L(3); ctx.stroke();
  }
  ctx.restore();
  if (mode === 'full') {                           // a narrow dark slit where the eyes are, hard to read
    ctx.save(); ctx.fillStyle = 'rgba(20,14,18,0.85)'; ctx.fillRect(x - 120 * s, hy - 10 * s, 240 * s, 46 * s);
    ctx.fillStyle = 'rgba(230,220,200,0.55)'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + sd * 70 * s, hy + 12 * s, 14 * s, 6 * s, 0, 0, 7); ctx.fill(); }
    ctx.restore();
    // a loose strip hanging from the arm
    ctx.save(); ctx.strokeStyle = '#e1d4b6'; ctx.lineWidth = L(18 * s / 0.56 * 0.6); ctx.beginPath();
    ctx.moveTo(x + 170 * s, y - 420 * s); ctx.quadraticCurveTo(x + 230 * s, y - 300 * s + Math.sin(F * 0.2) * 20 * s, x + 200 * s, y - 180 * s); ctx.stroke(); ctx.restore();
  }
}

// ---- sunlit front hallway: the delivery
const HF = 1180;
function hallDay(f, sh, people) {
  const wg = ctx.createLinearGradient(0, 0, 0, HF); wg.addColorStop(0, '#c9b48e'); wg.addColorStop(1, '#b59c74');
  ctx.fillStyle = wg; ctx.fillRect(-900, -400, 3900, HF + 400);
  ctx.save(); ctx.globalAlpha = 0.12; for (let x = -900; x < 3000; x += 110) { ctx.fillStyle = '#7d6346'; ctx.fillRect(x, -400, 6, HF + 400); } ctx.restore();
  fillR(-900, 860, 3900, 22, '#8c6e4a');                       // dado rail
  fillR(-900, HF - 34, 3900, 34, '#6e5236'); fillR(-900, HF, 3900, 700, '#8a6440');
  for (let x = -900; x < 3000; x += 150) line(x, HF, x - 60, HF + 700, 'rgba(0,0,0,0.15)', 4);
  sf(rr(380, HF + 40, 760, 120, 30), '#7a2f35', 5); ctx.save(); ctx.globalAlpha = 0.4; for (let i = 0; i < 8; i++) fillR(410 + i * 90, HF + 60, 30, 80, '#c9a24a'); ctx.restore();
  // stairs going up at the back left, a coat rack, framed pictures
  for (let k = 0; k < 9; k++) sf(rr(-420 + k * 70, HF - 90 - k * 82, 260, 90, 2), '#7a5838', 3);
  line(-400, HF - 400, 260, HF - 1140, '#5a3e28', 16);
  sf(rr(1300, 420, 40, 760, 6), '#5a3e28'); for (const dy of [470, 520]) sf(ell(1320 + (dy % 3) * 10, dy, 36, 16), '#3d4f6a', 3);
  sf(rr(1250, 520, 130, 300, 30), '#3d4f6a', 4);
  for (const [px, py] of [[500, 520], [800, 480]]) { sf(rr(px, py, 180, 140, 6), '#6b4a30'); sf(rr(px + 16, py + 16, 148, 108, 3), '#9ab8c8', 4); }
  // the open front door with afternoon sun pouring in
  sf(rr(1560, 500, 300, HF - 500, 6), '#4a3220');
  const sun = ctx.createLinearGradient(1580, 520, 1840, HF); sun.addColorStop(0, '#fff6d8'); sun.addColorStop(1, '#ffd88a');
  ctx.fillStyle = sun; ctx.fillRect(1580, 520, 260, HF - 520);
  sf(poly([[1580, 520], [1600, 540], [1600, HF - 10], [1580, HF]]), '#7b5636', 4);
  ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#ffe6a8';
  ctx.beginPath(); ctx.moveTo(1580, 520); ctx.lineTo(1840, 520); ctx.lineTo(1500, HF + 400); ctx.lineTo(700, HF + 400); ctx.closePath(); ctx.fill(); ctx.restore();
  // the sarcophagus: carried in lying down, or set down across the hallway
  if (sh.caseLying) {
    const cx = sh._caseX ?? 1100, cy = sh.caseCarried ? 820 : HF - 60;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(sh.caseCarried ? -0.03 : 0);
    sf(rr(-380, -95, 760, 190, [40, 120, 120, 40]), '#b8913e');
    for (const xx of [-180, -80, 60, 140]) fillR(xx, -88, 22, 176, '#2d4d7c');
    sf(rr(200, -80, 160, 160, [20, 80, 80, 20]), '#2d4d7c', 4); sf(rr(220, -60, 120, 120, [20, 60, 60, 20]), '#d8b25a', 4);
    for (const sd of [-1, 1]) { sf(ell(285 + sd * 4, sd * 26, 10, 18), '#f2ead6', 3); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(285, sd * 26, 5, 0, 7); ctx.fill(); }
    for (const xx of [-120, 60]) { ctx.save(); ctx.translate(xx, 0); ctx.rotate(Math.PI / 2); chainLinks(-110, 0, 110, 0, f, 0); ctx.restore(); }
    ctx.restore();
  }
  people.forEach(drawPerson);
}

// ---- Jeff's bedroom at night: lies awake, the hallway light stripe, the shadow, Mom
function bedroomNight(f, sh) {
  const lie = (sh.hero || {}).pose === 'lie';
  const h = person('hero', sh, f, { x: 600, y: lie ? 1640 : 1430, s: 0.62, noLegs: true });
  if (h && lie) { h.tilt = 0.25; if (h.look == null) h.look = (sh.hero || {}).turn === 'wall' ? -1 : 0.6; }
  const door = sh.doorIn != null ? (after(f, sh) ? lerp(0, sh.doorIn, ss(bT(f, sh, 40))) : 0) : (sh.doorOpen || 0);
  const mom = person('mom', sh, f, (sh.crew || {}).mom && (sh.crew.mom.at === 'beside') ? { x: 920, y: 1720, s: 0.78 } : { x: 1060, y: 1110 + 775 * 0.55, s: 0.55 });
  const momDoor = mom && !((sh.crew || {}).mom.at === 'beside') ? mom : null; bedroom.atDoor = null; bedroom.atWindow = null;
  bedroom.beside = mom && (sh.crew || {}).mom.at === 'beside' ? mom : null;
  bedroom(f, h);
  // hallway light through the gap: a warm stripe across the floor, interrupted by a shadow
  ctx.save(); ctx.globalAlpha = 0.5 + 0.3 * door; ctx.fillStyle = '#ffcf8a';
  ctx.beginPath(); ctx.moveTo(1015, 1490); ctx.lineTo(1015 + 40 + 160 * door, 1490); ctx.lineTo(760 + 200 * door, 1950); ctx.lineTo(560, 1950); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.6 + 0.3 * door; ctx.fillStyle = '#ffd89a'; ctx.fillRect(1015, 800, 30 + 150 * door, 690); ctx.restore();
  if (momDoor) { if (momDoor.skin === '#0b0810') { ctx.save(); ctx.fillStyle = 'rgba(255,216,154,0.9)'; ctx.fillRect(940, 800, 240, 690); ctx.restore(); } guy(momDoor); }
  if (sh.gapShadow && after(f, sh)) {
    const t = ss(bT(f, sh, 40)); ctx.save(); ctx.fillStyle = 'rgba(8,5,12,0.85)';
    ctx.beginPath(); ctx.moveTo(1015 + 60 * t, 1490); ctx.lineTo(1015 + 60 * t + 70, 1490); ctx.lineTo(850 + 40 * t, 1950); ctx.lineTo(700 + 40 * t, 1950); ctx.closePath(); ctx.fill(); ctx.restore();
  }
}

// ---- the magic shop: outside, and inside with the owner behind the counter
function shopSet(f, sh, people) {
  if (sh.outside) {
    const sky = ctx.createLinearGradient(0, -400, 0, 1200); sky.addColorStop(0, '#9fb8d8'); sky.addColorStop(1, '#f0d8b0');
    ctx.fillStyle = sky; ctx.fillRect(-900, -400, 3900, 1600);
    for (const [bx, bw, bh, c] of [[-700, 520, 900, '#8a7a6a'], [1500, 600, 1000, '#7a6a5e']]) sf(rr(bx, HF - bh, bw, bh, 4), c);
    sf(rr(-180, 160, 760, HF - 160, 4), '#4a2e3a');                       // the narrow shopfront
    sf(rr(-140, 220, 680, 120, 8), '#1d1418'); ctx.save(); ctx.fillStyle = '#e8c76a'; ctx.font = 'bold 64px "DejaVu Serif"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('ODDITIES & MAGIC', 200, 282); ctx.restore();
    sf(rr(-120, 400, 360, 520, 6), '#2a2230'); sf(rr(-100, 420, 320, 480, 4), '#3f4a62', 4);
    for (const [px, py, t1, c] of [[-80, 450, 'THE GREAT', '#b8323a'], [70, 640, 'VANISHING', '#2d4d7c']]) {
      sf(rr(px, py, 130, 170, 4), '#e8dcc0', 3); ctx.save(); ctx.fillStyle = c; ctx.font = 'bold 18px "DejaVu Sans"'; ctx.textAlign = 'center'; ctx.fillText(t1, px + 65, py + 30); ctx.fillText('ACT', px + 65, py + 52);
      ctx.beginPath(); ctx.arc(px + 65, py + 110, 36, 0, 7); ctx.fill(); ctx.restore();
    }
    sf(rr(290, 420, 230, HF - 420, 6), '#5d3a2a'); sf(ell(480, 820, 12, 12), '#d2b24c', 3);
    fillR(-900, HF, 3900, 700, '#8a8278'); fillR(-900, HF, 3900, 24, '#6e675e');
    people.forEach(drawPerson);
    return;
  }
  const wg = ctx.createLinearGradient(0, 0, 0, HF); wg.addColorStop(0, '#3e2e2a'); wg.addColorStop(1, '#5a4236');
  ctx.fillStyle = wg; ctx.fillRect(-900, -400, 3900, HF + 400);
  for (const sx of [300, 900, 1500]) {                              // crowded shelves
    sf(rr(sx, 120, 520, 600, 6), '#3a2a20');
    for (let r = 0; r < 4; r++) {
      fillR(sx, 250 + r * 150, 520, 14, '#5a4030');
      for (let k = 0; k < 7; k++) { const bw = 40 + (k * 13 + r * 7) % 30, bh = 80 + (k * 17 + r) % 50, cx = sx + 20 + k * 70;
        const kind = (k + r + sx / 300) % 5;
        if (kind < 3) sf(rr(cx, 250 + r * 150 - bh, bw, bh, 3), ['#7a2f35', '#2d4d7c', '#5f7a4a', '#8a6a2a'][(k + r) % 4], 3);
        else if (kind < 4) sf(ell(cx + 20, 250 + r * 150 - 30, 26, 30), 'rgba(170,200,220,0.6)', 3);
        else sf(poly([[cx, 250 + r * 150], [cx + 25, 250 + r * 150 - 70], [cx + 50, 250 + r * 150]]), '#c9a24a', 3); }
    }
  }
  sf(rr(-260, 200, 360, 280, 6), '#e8dcc0', 4); ctx.save(); ctx.fillStyle = '#7a2f35'; ctx.font = 'bold 34px "DejaVu Serif"'; ctx.textAlign = 'center';
  ctx.fillText('CARD TRICKS', -80, 280); ctx.fillText('& CURIOS', -80, 330); ctx.restore();
  // the door with its bell, on the left
  sf(rr(-280, 560, 260, HF - 560, 6), '#4a3220'); sf(rr(-260, 580, 220, 300, 4), '#cfe0e8', 4);
  const ring = sh.react === 'bell' && after(f, sh) ? Math.sin((f - sh.beat) * 0.9) * Math.max(0, 1 - (f - sh.beat) / 30) : 0;
  ctx.save(); ctx.translate(-150, 540); ctx.rotate(ring * 0.5); line(0, -20, 0, 10, INK, 4); sf(poly([[-22, 40], [22, 40], [12, 10], [-12, 10]]), '#d2b24c', 4); ctx.restore();
  // owner behind the counter
  people.filter(q => q && q._behind).forEach(drawPerson);
  sf(rr(700, 880, 900, 300, 8), '#5d3a2a'); fillR(700, 870, 900, 26, '#7a5236');
  sf(rr(740, 920, 820, 200, 6), '#4a2e22', 3);
  if (sh.bag) { sf(poly([[1080, 870], [1170, 870], [1160, 760], [1090, 760]]), '#a07848', 4); sf(rr(1095, 790, 60, 40, 4), '#e8dcc0', 3);
    sf(rr(1200, 846, 120, 26, 4), '#6a3a2a', 3); }
  if (sh.money && after(f, sh)) sf(rr(950, 852, 90, 22, 3), '#8ab28a', 3);
  people.filter(q => q && !q._behind).forEach(drawPerson);
  fillR(-900, HF, 3900, 700, '#4a3428');
}

// ---- close-up inserts
function insertScene(f, sh) {
  const k = sh.insert;
  fillR(-1200, -800, 3600, 3200, '#14101a');
  if (k === 'chainface') {                       // extreme close-up: an iron chain across a painted face
    ctx.save(); ctx.translate(960, 540); ctx.scale(3.2, 3.2); ctx.translate(-CASE.x, -(CASE.top + 180));
    const _cz = CZ; CZ = CZ * 3.2; sarcophagus(f, { _tw: 0, _lid: 0 }); chainLinks(CASE.x - 200, CASE.top + 175, CASE.x + 200, CASE.top + 175, f, sh.react === 'chain' && after(f, sh) ? 0.4 : 0); CZ = _cz; ctx.restore();
  } else if (k === 'research') {                 // an open book and a laptop with search results
    sf(rr(260, 300, 760, 520, 12), '#e9dfc6'); line(640, 300, 640, 820, '#b8a888', 4);
    sf(rr(310, 360, 280, 200, 4), '#3a3048', 3);
    sf(poly([[330, 540], [450, 400], [570, 540]]), '#8a7a5a', 3); sf(rr(430, 470, 40, 70, 4), '#1d1418', 3);
    for (let i = 0; i < 7; i++) fillR(310, 590 + i * 28, 280 - (i % 3) * 40, 8, '#9a8a70');
    ctx.save(); ctx.strokeStyle = '#7a2f35'; ctx.lineWidth = L(8); ctx.beginPath(); ctx.arc(830, 470, 90, 0, 7); ctx.moveTo(830, 380); ctx.lineTo(830, 560); ctx.moveTo(740, 470); ctx.lineTo(920, 470); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 6; i++) fillR(700, 600 + i * 28, 260 - (i % 2) * 50, 8, '#9a8a70');
    sf(rr(1100, 360, 600, 380, 14), '#2a2a32'); sf(rr(1125, 385, 550, 330, 6), '#e8eef4', 3);
    ctx.save(); ctx.fillStyle = '#1d2a6a'; ctx.font = 'bold 30px "DejaVu Sans"'; ctx.fillText('how to stop a mummy', 1150, 430); ctx.restore();
    for (let i = 0; i < 5; i++) { fillR(1150, 470 + i * 46, 300, 14, '#3a5aa8'); fillR(1150, 492 + i * 46, 460, 9, '#9aa4b4'); }
    sf(poly([[1050, 740], [1750, 740], [1800, 790], [1000, 790]]), '#3a3a44', 4);
  } else if (k === 'note') {
    sf(rr(560, 260, 800, 560, 6), '#f4f0e4'); for (let i = 0; i < 9; i++) line(580, 340 + i * 52, 1340, 340 + i * 52, '#b8c8e0', 2);
    ctx.save(); ctx.fillStyle = '#26324a'; ctx.font = 'italic bold 58px "DejaVu Serif"'; ctx.textAlign = 'center';
    const txt = 'How to stop a mummy', n = sh.beat != null ? Math.floor(txt.length * clamp((f - sh.a) / Math.max(1, (sh.beat - sh.a)))) : txt.length;
    ctx.fillText(txt.slice(0, n), 960, 470); ctx.restore();
    sf(rr(1300, 420 + 40 * Math.sin(f * 0.1), 30, 220, 10), '#c9a24a', 4);
  } else if (k === 'bag') {                      // the label: MUMMY DUST
    sf(poly([[700, 900], [1220, 900], [1180, 200], [740, 200]]), '#a07848', 6);
    for (let i = 0; i < 6; i++) line(760 + i * 70, 200, 740 + i * 75, 900, 'rgba(60,40,20,0.25)', 3);
    sf(rr(770, 420, 380, 220, 10), '#ece2c8', 5);
    ctx.save(); ctx.fillStyle = '#3a2418'; ctx.font = 'bold 66px "DejaVu Serif"'; ctx.textAlign = 'center'; ctx.fillText('MUMMY', 960, 510); ctx.fillText('DUST', 960, 590); ctx.restore();
  } else if (k === 'key') {                      // the key turning in the lock
    sf(rr(700, 200, 520, 700, 10), '#7b5636', 6); sf(rr(900, 520, 120, 160, 20), '#c9a24a', 5); sf(rr(946, 560, 28, 60, 8), '#1b1410', 0);
    const t = after(f, sh) ? ss(bT(f, sh, 14)) : 0;
    ctx.save(); ctx.translate(960, 590); ctx.rotate(t * Math.PI / 2); sf(rr(-12, -170, 24, 170, 6), '#e2c25c', 4); sf(ell(0, -200, 44, 34), '#e2c25c', 5); ctx.restore();
  } else if (k === 'thread') {                   // Kim ties dark thread to a chain link
    ctx.save(); ctx.translate(960, 540); ctx.scale(2.6, 2.6); ctx.translate(-(CASE.x - 150), -(CASE.top + 380));
    const _cz = CZ; CZ = CZ * 2.6; sarcophagus(f, { _tw: 0, _lid: 0 });
    ctx.strokeStyle = '#120c10'; ctx.lineWidth = L(3); ctx.beginPath(); ctx.moveTo(CASE.x - 150, CASE.top + 385); ctx.quadraticCurveTo(CASE.x - 400, CASE.top + 500, CASE.x - 700, CASE.top + 420); ctx.stroke();
    const hx = CASE.x - 160 + Math.sin(f * 0.4) * 6;
    sf(ell(hx, CASE.top + 400, 36, 30), '#e6b48f', 4); sf(rr(hx + 20, CASE.top + 390, 160, 50, 20), '#7a2335', 4);
    CZ = _cz; ctx.restore();
  } else if (k === 'pull') {                     // her hand pulling the thread on the stairs
    fillR(-1200, 600, 3600, 900, '#2b2a33'); line(-400, 760, 2400, 600, '#120c10', 6);
    const pull = after(f, sh) ? Math.sin(Math.min(1, (f - sh.beat) / 6) * Math.PI) : 0;
    sf(ell(980 - pull * 80, 690, 60, 50), '#e6b48f', 5); sf(rr(1010 - pull * 80, 660, 600, 90, 40), '#7a2335', 5);
  } else if (k === 'chainfloor') {
    fillR(-1200, 600, 3600, 900, '#3b3a40');
    chainLinks(400, 760, 1500, 820, f, 0); chainLinks(500, 900, 1600, 860, f, 0);
    if (sh.flashlight) { const g = ctx.createRadialGradient(950, 820, 30, 950, 820, 520); g.addColorStop(0, 'rgba(255,250,220,0.55)'); g.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = g; ctx.fillRect(300, 400, 1300, 900); }
  }
}

// ---- kitchen at night (re-uses the kitchen set with night colours and the fridge-display glow)
function kitchenNight(f, sh, people) {
  kitchenSet(f, sh, []);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#6a6ea2'; ctx.fillRect(-900, -400, 3900, 2600); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(775, 535, 330, 270); ctx.clip(); const sky = ctx.createLinearGradient(0, 535, 0, 805);
  sky.addColorStop(0, '#060a20'); sky.addColorStop(1, '#1b2350'); ctx.fillStyle = sky; ctx.fillRect(775, 535, 330, 270);
  ctx.fillStyle = '#e8ecf8'; ctx.beginPath(); ctx.arc(1040, 590, 22, 0, 7); ctx.fill(); ctx.restore(); line(940, 535, 940, 805, INK, 6); line(775, 670, 1105, 670, INK, 6);
  sf(rr(1500, 600, 90, 34, 6), '#0a1a24', 3); ctx.save(); ctx.fillStyle = '#7fe0ff'; ctx.font = 'bold 22px "DejaVu Sans Mono"'; ctx.fillText('4°C', 1514, 624); ctx.restore();
  // the cast, drawn after the room so nothing in the set covers them; seated people sit behind the table
  const seated = people.filter(q => q && q.noLegs && !q._crouch), rest = people.filter(q => q && !(q.noLegs && !q._crouch));
  seated.forEach(drawPerson);
  if (seated.length) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#5c6094';
    sf(rr(1760, 930, 520, 40, 8), '#6b4a30'); ctx.restore(); sf(rr(1760, 930, 520, 40, 8), '#3a2c3c'); }
  rest.forEach(drawPerson);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = sh.lampOn ? '#d8d0e0' : '#a8acd4'; ctx.fillRect(-900, -400, 3900, 2600); ctx.restore();
  if (sh.hand) {                                  // a wrapped hand curls around the edge of the door
    const t = after(f, sh) ? ss(bT(f, sh, 30)) : 0, hx = 250 + 220 * (1 - (sh._door || 0) * 0.86) + 6;
    ctx.save(); ctx.translate(hx, 900); ctx.scale(1, 1);
    for (let i = 0; i < 4; i++) sf(rr(-10 - 30 * t, -40 + i * 26, 46 * t + 10, 22, 10), '#ddd0b2', 3);
    ctx.restore();
  }
  if (sh.powder && after(f, sh)) {               // a pinch of powder thrown, glittering in the light
    const t = (f - sh.beat) / 24;
    for (let i = 0; i < 60; i++) { const r = rnd(i), r2 = rnd(i + 50); const x = lerp(sh.powder[0], sh.powder[1], Math.min(1, t * (0.7 + r * 0.6))) + (r2 - 0.5) * 120 * t;
      const y = 820 + (r - 0.5) * 140 * t + 60 * t * t; ctx.globalAlpha = Math.max(0, 1 - t * 0.6) * 0.8; ctx.fillStyle = '#f2e6c4'; ctx.beginPath(); ctx.arc(x, y, 3 + r * 4, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  if (sh.tray != null) {                         // the metal tray on the table edge, knocked to the floor
    const t = sh.tray === 'fall' && after(f, sh) ? Math.min(1, (f - sh.beat) / 10) : 0;
    ctx.save(); ctx.translate(1800 - 40 * t, 915 + 260 * t * t); ctx.rotate(t * 1.2); sf(rr(-90, -10, 180, 18, 6), '#b8bec6', 4); ctx.restore();
  }
}
function kitchenNightLights(c, f, sh) {
  light(c, 1545, 620, 360, '#7fe0ff', 0.45);
  light(c, 940, 640, 520, '#8fa3e0', 0.45);
  if (sh.lampOn) light(c, 1050, 420, 1100, '#ffd9a0', 0.9);
  if ((sh._door || 0) > 0.05 && sh.lightOn) light(c, 360, 900, 380, '#ffcf8a', 0.5);
  if (sh.torch) light(c, sh.torch[0], sh.torch[1], 420, '#fffbe0', 0.8);
}

// ---- basement extras: Kim and others in the basement, the lid on the floor, chains on the floor, the thread,
// ---- the long shadow and the dry wrapped foot
function basementExtras(f, sh) {
  if (sh.chainsFloor) { chainLinks(CASE.x - 420, BF - 20, CASE.x - 120, BF - 10, f, 0); chainLinks(CASE.x - 380, BF - 36, CASE.x - 60, BF - 30, f, 0); }
  if (sh.lidFloor) {
    const t = sh.react === 'lidfall' && after(f, sh) ? Math.min(1, (f - sh.beat) / 8) : 1;
    ctx.save(); ctx.translate(CASE.x - 250, BF - 40); ctx.rotate(-Math.PI / 2 * (1 - t));
    sf(rr(-420, -36, 760, 72, [30, 120, 120, 30]), '#a0803a'); for (const xx of [-220, -120, 40, 120]) fillR(xx, -30, 20, 60, '#2d4d7c'); ctx.restore();
  }
  if (sh.thread) { ctx.save(); ctx.strokeStyle = '#120c10'; ctx.lineWidth = L(3); ctx.beginPath(); ctx.moveTo(CASE.x - 190, CASE.top + 380);
    ctx.lineTo(1460, 640); ctx.lineTo(1120, 640); ctx.lineTo(BS.x0 + 2 * BS.run, BS.y0 + 2 * BS.rise - 60); ctx.stroke(); ctx.restore(); }
  if (sh.floorShadow && after(f, sh)) {
    const t = ss(bT(f, sh, 50)); ctx.save(); ctx.fillStyle = 'rgba(5,3,8,0.75)';
    ctx.beginPath(); ctx.moveTo(1700 - 500 * t, BF + 10); ctx.lineTo(1500 - 900 * t, BF + 40); ctx.lineTo(1300 - 900 * t, BF + 90); ctx.lineTo(1700 - 400 * t, BF + 50); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  if (sh.foot && after(f, sh)) {                 // a dry, tightly wrapped foot settles on the bottom stair
    const t = ss(bT(f, sh, 26)), [fx, fy] = bStep(BS.n);
    ctx.save(); ctx.translate(fx + 200 * (1 - t), fy - 14 - 30 * Math.sin(Math.PI * t));
    sf(rr(-110, -60, 220, 72, [30, 60, 20, 20]), '#4e4232', 6);
    for (let i = 0; i < 6; i++) line(-100 + i * 36, -58, -80 + i * 36, 10, 'rgba(25,18,12,0.7)', 5);
    sf(rr(-40, -260, 90, 210, 30), '#463a2c', 6); for (let i = 0; i < 6; i++) line(-40, -240 + i * 34, 50, -228 + i * 34, 'rgba(25,18,12,0.7)', 5);
    ctx.restore();
  }
}
function basementPeople(sh, f) {
  const out = [];
  const crew = sh.crew || {};
  for (const r of Object.keys(crew)) {
    const sp = crew[r]; let x = sp.x ?? 1300, y = BF + 10;
    if (sp.step != null) { const st = Array.isArray(sp.step) ? lerp(sp.step[0], sp.step[1], ss(seg(f, sh.a, sh.b - 6))) : sp.step; [x, y] = bStep(st); y += 14; }
    out.push(person(r, sh, f, { x, y, s: sp.s || 0.56 }));
  }
  return out;
}

Object.assign(SCENES, {
  hallDay: {
    frames: { wide: [1000, 760, 0.82], door: [1700, 820, 1.4], case: [1100, 860, 1.6] },
    frameFn(sh, name) {
      const P = hallPos(sh); const p = P[name === 'hero' ? 'hero' : name];
      if (p) return [p[0], HF - 775 * p[1] * 0.92, 1.25 / p[1]];
      if (name === 'family') return [600, 820, 1.3];
      return null;
    },
    ambient: '#b8a890',
    draw(f, sh) {
      const P = hallPos(sh);
      sh._caseX = sh.carry ? lerp(sh.carry[0], sh.carry[1], ss(seg(f, sh.a, sh.b - 10))) : (sh.caseX ?? 1100);
      const ppl = Object.keys(P).map(r => person(r, sh, f, { x: P[r][0], y: HF + 20, s: P[r][1] }));
      if (sh.carry) {                                // the two workers carry the case between them
        for (const [r, dx] of [['worker', -430], ['worker2', 430]]) { const sp = (sh.crew || {})[r]; if (!sp) continue;
          const o = person(r, sh, f, { x: sh._caseX + dx, y: HF + 20, s: 0.62 }); if (o) { o.armL = 1.25; o.armR = 1.25; o.walk = f * 0.25; o.walkAmt = 0.5; ppl.push(o); } }
      }
      hallDay(f, sh, ppl.filter(Boolean));
    },
    lights(l, f, sh) { light(l, 1700, 800, 1300, '#fff0c8', 1.0); light(l, 700, 400, 1200, '#ffe8c0', 0.6); },
  },
  bedroomNight: {
    frames: { wide: [555, 1005, 0.98], hero: [600, 1120, 2.4], door: [1060, 1150, 1.8], gap: [1000, 1520, 3.0], beside: [800, 1150, 1.6] },
    ambient: '#3a4682',
    draw(f, sh) { bedroomNight(f, sh); },
    lights(l, f, sh) { bedroomLights(l, f); light(l, 1060, 1150, 420, '#ffcf8a', 0.6); if (sh.lamp || (sh.react === 'lamp' && after(f, sh))) light(l, 140, 1100, 900, '#ffd9a0', 1.1); },
  },
  shop: {
    frames: { wide: [700, 720, 0.85], door: [-150, 760, 1.6], counter: [1120, 820, 1.7], owner: [1130, 650, 2.2], hero: [620, 900, 2.4], bag: [1130, 820, 3.0] },
    ambient: '#a08a7a',
    draw(f, sh) {
      const ppl = [];
      if (sh.hero) ppl.push(person('hero', sh, f, { x: (sh.hero.x ?? 620), y: HF + 20, s: 0.48 }));
      const own = person('owner', sh, f, { x: 1130, y: 1050, s: 0.6, noLegs: true }); if (own) { own._behind = true; ppl.push(own); }
      shopSet(f, sh, ppl);
    },
    lights(l, f, sh) { if (sh.outside) { light(l, 800, 0, 2400, '#fff4dc', 1.0); return; } light(l, 1100, 300, 1100, '#ffcf8a', 0.85); light(l, -150, 700, 500, '#d8e8ff', 0.5); },
  },
  insert: {
    frames: { wide: [960, 540, 1.0] },
    ambient: '#8a8aa0',
    draw(f, sh) { insertScene(f, sh); },
    lights(l, f, sh) { light(l, 960, 400, 1400, sh.insert === 'chainface' ? '#ffe6b0' : '#ffeeda', 1.0); },
  },
  kitchenN: {
    frames: { wide: [1250, 800, 1.0], door: [370, 880, 1.55], table: [1850, 820, 1.7] },
    frameFn(sh, name) {
      const c = sh.crew || {};
      const pos = { hero: (sh.hero || {}).x ?? 1700 };
      const X = sp => sp ? (sp.walk ? sp.walk[1] : sp.x) : null;
      pos.hero = X(sh.hero) ?? 1700;
      for (const r of Object.keys(c)) pos[r] = X(c[r]);
      const sp = name === 'hero' ? sh.hero : c[name];
      if (pos[name] != null) return [pos[name], sp && sp.sit ? 720 : sp && sp.crouch ? KF - 260 : KF - 360, 2.3];
      if (name === 'two') { const xs = Object.values(pos).filter(v => v != null); return [(Math.min(...xs) + Math.max(...xs)) / 2, KF - 330, Math.min(2.0, 1700 / (Math.max(...xs) - Math.min(...xs) + 600))]; }
      return null;
    },
    ambient: '#a4a4c8',
    draw(f, sh) {
      sh._door = sh.door === 'crack' ? (after(f, sh) ? 0.18 * ss(bT(f, sh, 30)) : 0) : sh.door === 'closing' ? (after(f, sh) ? 1 - ss(bT(f, sh, 14)) : 1) : doorState(f, sh);
      const c = sh.crew || {}, ppl = [];
      if (sh.hero) ppl.push(person('hero', sh, f, { x: sh.hero.x ?? 1700, y: sh.hero.sit ? 1000 : KF + 20, s: 0.48 }));
      for (const r of Object.keys(c)) ppl.push(person(r, sh, f, { x: c[r].x ?? 900, y: KF + 30, s: c[r].s || (r === 'kim' ? 0.56 : 0.64) }));
      kitchenNight(f, sh, ppl.filter(Boolean).map(o => { o._back = false; return o; }));
    },
    lights(l, f, sh) { kitchenNightLights(l, f, sh); },
  },
  black: {
    frames: { wide: [960, 540, 1.0] }, ambient: '#000000',
    draw(f, sh) { fillR(-3000, -3000, 8000, 8000, '#000'); }, lights() {},
  },
});
function hallPos(sh) {
  const c = sh.crew || {}, P = {};
  if (sh.hero) P.hero = [sh.hero.x ?? 420, 0.48];
  for (const r of Object.keys(c)) if (!(sh.carry && (r === 'worker' || r === 'worker2'))) P[r] = [c[r].x ?? 700, c[r].s || (r === 'kim' ? 0.56 : 0.64)];
  return P;
}

// basement: draw the extras and any cast members after the set; kitchen day: let cast use the person() helper
(function () {
  const B = SCENES.basement, drawB = B.draw;
  B.draw = function (f, sh) {
    drawB(f, sh);
    basementExtras(f, sh);
    basementPeople(sh, f).forEach(drawPerson);
  };
  const fnB = B.frameFn;
  B.frameFn = function (sh, name) {
    const sp = (sh.crew || {})[name];
    if (sp) { let x = sp.x ?? 1300, y = BF; if (sp.step != null) { const st = Array.isArray(sp.step) ? sp.step[1] : sp.step; [x, y] = bStep(st); } return [x, y - 360, 2.3]; }
    if (name === 'top') { const sp2 = (sh.crew || {}).kim; const [x, y] = bStep(sp2 && sp2.step != null ? (Array.isArray(sp2.step) ? sp2.step[1] : sp2.step) : 0.3); return [x + 200, y - 250, 2.0]; }
    if (name === 'lid') return [CASE.x - 250, BF - 120, 1.8];
    if (name === 'bottom') { const [x, y] = bStep(BS.n); return [x + 60, y - 120, 2.6]; }
    if (name === 'floor') return [1200, BF - 40, 1.4];
    return fnB(sh, name);
  };
  const L0 = B.lights;
  B.lights = function (l, f, sh) { L0(l, f, sh); if (sh.torchDown) light(l, 240, 560, 600, '#fffbe0', 0.7); };
})();

// kitchen by day: any cast member may stand (Dad on the phone, Mom), using the person() helper
SCENES.kitchenB.draw = function (f, sh) {
  sh._door = sh.door === 'closing' ? (after(f, sh) ? 1 - ss(bT(f, sh, 14)) : 1) : doorState(f, sh);
  const c = sh.crew || {}, ppl = [];
  if (sh.hero) ppl.push(person('hero', sh, f, { x: sh.hero.x ?? 620, y: KF + 20, s: 0.48 }));
  for (const r of Object.keys(c)) {
    const sp = c[r];
    if (r === 'dad' && !sp.stand) { const o = person('dad', sh, f, { x: 2020, y: 1000, s: 0.62, noLegs: true }); if (o) { o._back = true; ppl.push(o); } continue; }
    const o = person(r, sh, f, { x: sp.x ?? 900, y: KF + 30, s: sp.s || (r === 'kim' ? 0.56 : 0.64) });
    if (o && r === 'kim' && sp.reachDoor) o.armL = lerp(0.22, 1.5, ss(seg(f, sh.a, sh.a + 18)));
    ppl.push(o);
  }
  kitchenSet(f, sh, ppl.filter(Boolean));
};
SCENES.kitchenB.frameFn = function (sh, name) {
  const c = sh.crew || {}, pos = { hero: [(sh.hero || {}).x ?? 620, 0.48] };
  for (const r of Object.keys(c)) pos[r] = r === 'dad' && !c[r].stand ? [2020, 0.62] : [c[r].x ?? 900, c[r].s || (r === 'kim' ? 0.56 : 0.64)];
  if (pos[name]) return [pos[name][0], KF - 775 * pos[name][1] * 0.9, 1.2 / pos[name][1]];
  if (name === 'two') { const xs = Object.keys(pos).filter(k => k === 'hero' || c[k]).map(k => pos[k][0]); return [(Math.min(...xs) + Math.max(...xs)) / 2, KF - 330, Math.min(1.6, 1700 / (Math.max(...xs) - Math.min(...xs) + 700))]; }
  return null;
};
