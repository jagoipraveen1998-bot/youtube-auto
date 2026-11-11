// ---------- "How I make a horror cartoon every day": landscape explainer scenes (1920x1080) ----------
// scenes: tDesk (the creator's desk), tBelt (the video factory conveyor belt), tStation (one station up close)
const TUT = { wall: '#3d4670', wall2: '#353d63', desk: '#6b4a32', desk2: '#573a26', paper: '#f4efe4', glow: '#ffe7a6',
  box: '#3c4670', on: '#ffd34d', off: '#59628c', text: '#f4efe4' };
const STATIONS = ['SCRIPT', 'VOICE', 'CARTOON', 'SOUND', 'UPLOAD', 'CHECK'];

function tText(s, x, y, size, col = TUT.text, align = 'center', stroke = true) {
  ctx.save(); ctx.font = `bold ${size}px sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineWidth = size * 0.16; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.restore();
}
const tP = (f, sh) => clamp((f - sh.a) / Math.max(1, sh.b - sh.a));

function tRoom() {
  fillR(-300, -300, W + 600, H + 600, TUT.wall);
  ctx.fillStyle = TUT.wall2; for (let x = -60; x < W + 60; x += 170) ctx.fillRect(x, 0, 7, 820);
  fillR(-300, 820, W + 600, 600, '#22273d');
  fillR(-300, 808, W + 600, 22, '#1a1e30');
}
function tClock(x, y, r, f, spin) {
  sf(ell(x, y, r, r), '#f4efe4', 7);
  const a1 = f * (spin ? 0.35 : 0.002), a2 = f * (spin ? 0.03 : 0.0002);
  line(x, y, x + Math.sin(a1) * r * 0.78, y - Math.cos(a1) * r * 0.78, INK, 6);
  line(x, y, x + Math.sin(a2) * r * 0.5, y - Math.cos(a2) * r * 0.5, INK, 9);
  sf(ell(x, y, 8, 8), INK, 0);
}
function tCup(x, y, k) {
  sf(rr(x - 34, y - 70, 68, 70, 10), k % 2 ? '#e9e3d6' : '#c94a4a', 6);
  ctx.strokeStyle = INK; ctx.lineWidth = L(6); ctx.beginPath(); ctx.arc(x + 40, y - 38, 18, -1.3, 1.3); ctx.stroke();
}
function tRobot(x, y, s, f, nod) {                       // the friendly AI helper
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(f * 0.08) * 0.04);
  line(0, -330, 0, -390, INK, 7); sf(ell(0, -398, 16, 16), '#ff6b6b', 5);
  sf(rr(-120, -330, 240, 190, 40), '#b9c3e6', 8);
  sf(rr(-90, -295, 180, 120, 26), '#20263f', 6);
  const bl = (Math.floor(f / 70) % 9 === 0 && f % 70 < 6) ? 0.15 : 1;
  sf(ell(-40, -240, 18, 22 * bl), '#7fe3ff', 0); sf(ell(40, -240, 18, 22 * bl), '#7fe3ff', 0);
  ctx.strokeStyle = '#7fe3ff'; ctx.lineWidth = L(6); ctx.beginPath(); ctx.arc(0, -212, 26, 0.3, Math.PI - 0.3); ctx.stroke();
  sf(rr(-100, -130, 200, 140, 30), '#a3aed6', 8);
  for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 104, -110); ctx.rotate(sd * (0.4 + (nod ? Math.sin(f * 0.2) * 0.25 : 0))); sf(rr(-18, 0, 36, 110, 18), '#b9c3e6', 6); ctx.restore(); }
  ctx.restore();
}
function tMic(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  sf(rr(-60, -240, 120, 220, 60), '#9aa3c4', 8);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 5;
  for (let i = -200; i < -40; i += 26) { ctx.beginPath(); ctx.moveTo(-50, i); ctx.lineTo(50, i); ctx.stroke(); }
  line(0, -20, 0, 120, INK, 14); sf(rr(-90, 110, 180, 30, 12), '#59628c', 6);
  ctx.restore();
}
function tPlay(x, y, r, col = '#e8453c') {               // a generic "video" play button
  sf(rr(x - r * 1.35, y - r, r * 2.7, r * 2, r * 0.45), col, 7);
  sf(poly([[x - r * 0.35, y - r * 0.5], [x + r * 0.55, y], [x - r * 0.35, y + r * 0.5]]), '#ffffff', 0);
}
function tPhone(x, y, s, f) {                            // a phone with a reel playing and hearts floating up
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  sf(rr(-110, -200, 220, 400, 34), '#1d2236', 8); sf(rr(-92, -170, 184, 330, 14), '#3a4470', 0);
  tPlay(0, -10, 34, '#c252d6');
  for (let i = 0; i < 3; i++) { const k = ((f * 0.02 + i / 3) % 1); ctx.save(); ctx.globalAlpha = 1 - k; heart(120, 80 - k * 260, 22); ctx.restore(); }
  ctx.restore();
}
function heart(x, y, r) {
  const p = new Path2D(); p.moveTo(x, y + r); p.bezierCurveTo(x - r * 2, y - r * 0.4, x - r * 0.8, y - r * 1.8, x, y - r * 0.6);
  p.bezierCurveTo(x + r * 0.8, y - r * 1.8, x + r * 2, y - r * 0.4, x, y + r); sf(p, '#ff5d73', 5);
}
function tTick(x, y, s, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(a); ctx.translate(x, y); ctx.scale(s * (0.6 + 0.4 * back(clamp(a))), s * (0.6 + 0.4 * back(clamp(a))));
  sf(ell(0, 0, 38, 38), '#3ccf72', 6); line(-16, 2, -4, 16, '#ffffff', 9); line(-4, 16, 20, -14, '#ffffff', 9); ctx.restore();
}

// ---- the conveyor belt: six stations; sh.station lights one (or 'all' lights them in turn)
function tBelt(f, sh) {
  tRoom();
  const y = 720, x0 = 170, x1 = 1750, p = tP(f, sh);
  sf(rr(x0 - 60, y, x1 - x0 + 120, 70, 35), '#3a3f58', 8);
  for (let x = x0; x <= x1; x += 80) { ctx.save(); ctx.translate(x, y + 35); ctx.rotate(f * 0.15); sf(ell(0, 0, 24, 24), '#8a90b4', 5); line(-18, 0, 18, 0, INK, 4); ctx.restore(); }
  const n = STATIONS.length, gap = (x1 - x0) / (n - 1);
  let lit = sh.station;
  if (sh.station === 'all') lit = Math.floor(p * (n + 0.5));
  for (let i = 0; i < n; i++) {
    const x = x0 + i * gap, on = sh.station === 'all' ? i <= lit : i === lit;
    const pop = on && sh.station !== 'all' ? 1 + 0.06 * Math.sin(f * 0.2) : 1;
    ctx.save(); ctx.translate(x, y - 190); ctx.scale(pop, pop);
    if (on) light(ctx, 0, 0, 230, '#ffd34d', 0.35);
    sf(rr(-115, -120, 230, 200, 26), on ? '#4a5590' : TUT.box, 8);
    sf(rr(-95, -100, 190, 34, 12), on ? TUT.on : TUT.off, 0);
    tText(STATIONS[i], 0, -83, 30, on ? INK : '#c8cde4', 'center', false);
    stationIcon(i, 0, 0, 0.42, f, on);
    ctx.restore();
    line(x, y - 110, x, y, '#59628c', 10);
  }
  // the video travelling down the belt: a little film box that grows a play button at the end
  const t = sh.station === 'all' ? p : clamp((lit + 0.5) / n);
  const bx = lerp(x0 - 40, x1 + 40, sh.station === 'all' ? p : t) + (sh.station === 'all' ? 0 : Math.sin(f * 0.1) * 10);
  sf(rr(bx - 60, y - 70, 120, 72, 12), '#e9e3d6', 7);
  if ((sh.station === 'all' && p > 0.8) || lit >= 4) tPlay(bx, y - 34, 18); else { line(bx - 34, y - 48, bx + 34, y - 48, INK, 5); line(bx - 34, y - 24, bx + 14, y - 24, INK, 5); }
  if (sh.label) tText(sh.label, W / 2, 140, 74, TUT.on);
}
function stationIcon(i, x, y, s, f, on) {
  ctx.save(); ctx.translate(x, y + 10); ctx.scale(s, s);
  if (i === 0) { sf(rr(-90, -90, 180, 180, 10), TUT.paper, 6); for (let k = 0; k < 4; k++) line(-60, -50 + k * 34, 50 - (k % 2) * 40, -50 + k * 34, '#8a90b4', 8); }
  else if (i === 1) { tMic(0, 90, 0.75); }
  else if (i === 2) { sf(ell(0, -10, 80, 80), SKIN, 7); sf(ell(-28, -20, 14, 16), '#fff', 4); sf(ell(28, -20, 14, 16), '#fff', 4); line(-24, 30, 24, 30, INK, 7); }
  else if (i === 3) { ctx.strokeStyle = INK; ctx.lineWidth = L(9); for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-40, 0, 40 + k * 34, -0.7, 0.7); ctx.stroke(); } sf(rr(-110, -40, 60, 80, 10), '#9aa3c4', 6); }
  else if (i === 4) { tPlay(0, 0, 70); }
  else { sf(ell(-20, -20, 70, 70), 'rgba(200,230,255,0.4)', 9); line(30, 30, 95, 95, INK, 18); }
  ctx.restore();
}

// ---- the desk: hook and outro
function tDesk(f, sh) {
  tRoom();
  sf(rr(1340, 160, 330, 400, 10), '#141a33', 9);                         // window, moon
  sf(ell(1505, 300, 70, 70), '#e8ecff', 0); line(1505, 160, 1505, 560, INK, 9); line(1340, 360, 1670, 360, INK, 9);
  tClock(330, 250, 90, f, sh.spin);
  const tidy = sh.tidy;
  const h = heroObj(sh, f, { x: 760, y: 1010, s: 0.62, look: tidy ? 0 : 0.6, lookY: 0.25 });
  if (h) {
    if (tidy) { h.expr = 'tired'; h.lid = 1; h.lean = 0.25 + Math.sin(f * 0.05) * 0.02; }
    else { h.sweat = true; h.tremble = 2; }
    guy(h);
  }
  sf(rr(380, 720, 1150, 50, 10), TUT.desk, 8); sf(rr(420, 770, 1070, 330, 6), TUT.desk2, 8);
  sf(poly([[1000, 720], [1040, 540], [1330, 540], [1290, 720]]), '#20263f', 8);   // laptop, turned toward him
  light(ctx, 1160, 630, 260, '#bfe0ff', 0.3);
  sf(poly([[1022, 705], [1052, 558], [1312, 558], [1282, 705]]), tidy ? '#2c6b4c' : '#3a4470', 0);
  if (tidy) tText('✓ POSTED', 1166, 632, 34, '#9ff2c1', 'center', false);
  if (!tidy) for (let k = 0; k < 6; k++) tCup(450 + k * 72 + (k > 2 ? 940 : 0), 720, k);
  else tCup(500, 720, 1);
  if (tidy) {                                                           // the factory keeps running in a little window on the wall
    sf(rr(150, 420, 380, 220, 14), '#20263f', 8);
    for (let k = 0; k < 4; k++) { const bx = 170 + ((f * 2 + k * 100) % 360); sf(rr(bx - 26, 560, 52, 34, 8), '#e9e3d6', 5); }
    line(160, 600, 520, 600, '#8a90b4', 10);
    if (Math.floor(f / 30) % 2) tText('Z z z', 900, 330, 54, '#c8cde4', 'center', false);
  }
}

// ---- one station up close (sh.station 0..5)
function tStation(f, sh) {
  tRoom();
  const i = sh.station, p = tP(f, sh), dur = sh.b - sh.a;
  tText(`STATION ${i + 1} · ${STATIONS[i]}`, W / 2, 110, 64, TUT.on);
  if (i === 0) {                                                        // the script: typed, then APPROVED
    ctx.save(); ctx.translate(820, 560); ctx.rotate(-0.02);
    sf(rr(-380, -340, 760, 680, 12), TUT.paper, 8);
    const lines = ['"Imagine your dog', 'comes home...', 'wrong."', '', 'What would you do?'];
    const shown = Math.floor(p * 70);
    let n = 0;
    lines.forEach((t, k) => { const s = t.slice(0, Math.max(0, shown - n)); n += t.length; tText(s, -330, -230 + k * 84, 50, '#2a2440', 'left', false); });
    if (p > 0.72) {
      const k = seg(f, sh.a + dur * 0.72, sh.a + dur * 0.72 + 8);
      ctx.save(); ctx.translate(150, 230); ctx.rotate(-0.25); ctx.scale(2 - k, 2 - k); ctx.globalAlpha = k;
      ctx.strokeStyle = '#2fa35d'; ctx.lineWidth = 12; ctx.strokeRect(-200, -58, 400, 116); tText('APPROVED', 0, 2, 70, '#2fa35d', 'center', false); ctx.restore();
    }
    ctx.restore();
    tRobot(1460, 960, 1.1, f, p < 0.7);
    const h = heroObj(sh, f, { x: 300, y: 1080, s: 0.55, look: 1, lookY: 0 });
    if (h) guy(h);
  } else if (i === 1) {                                                 // the voice: one take, cut at the pauses
    tMic(560, 760, 1.6);
    for (let k = 0; k < 3; k++) { const r = 120 + ((f * 3 + k * 90) % 270); ctx.save(); ctx.globalAlpha = 1 - r / 390; ctx.strokeStyle = TUT.on; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(560, 440, r, -0.9, 0.9); ctx.stroke(); ctx.restore(); }
    const wy = 820, wx0 = 900, wx1 = 1800;                                // the waveform, with scissors at every pause
    ctx.strokeStyle = '#7fe3ff'; ctx.lineWidth = 5; ctx.beginPath();
    for (let x = wx0; x < wx1; x += 6) { const gapK = (x - wx0) % 220 < 34 ? 0.05 : 1; const a = gapK * (30 + 60 * noise1(x * 0.05 + f * 0.1)); ctx.moveTo(x, wy - a); ctx.lineTo(x, wy + a); }
    ctx.stroke();
    const cuts = Math.floor(p * 6);
    for (let k = 0; k < cuts; k++) { const x = wx0 + k * 220 + 17; line(x, wy - 120, x, wy + 120, '#ff6b6b', 6); tText('✂', x, wy - 150, 48, '#ff6b6b', 'center', false); }
    const bubbles = ['whisper...', '(pause)', 'THE TWIST!'];
    bubbles.forEach((b, k) => { const a = seg(f, sh.a + dur * (0.15 + k * 0.22), sh.a + dur * (0.15 + k * 0.22) + 10); if (a > 0) { ctx.save(); ctx.globalAlpha = a; sf(rr(980 + k * 270, 300 + (k % 2) * 90, 250, 100, 40), '#f4efe4', 7); tText(b, 1105 + k * 270, 350 + (k % 2) * 90, 36, INK, 'center', false); ctx.restore(); } });
  } else if (i === 2) {                                                 // the cartoon: empty set, then the actors pop in and act
    fillR(140, 230, 1640, 720, '#3e4466'); fillR(140, 760, 1640, 190, '#2b3050');
    sf(rr(260, 300, 300, 420, 8), '#4b5578', 8);                         // a door on the set
    const pIn = seg(f, sh.a + dur * 0.25, sh.a + dur * 0.25 + 14);
    const h = heroObj(sh, f, { x: 1050, y: 930, s: 0.5 * Math.max(0.01, back(pIn)), look: 1, lookY: 0 });
    if (h && pIn > 0) { const ph = f * 0.35; h.walk = p > 0.5 ? ph : 0; h.walkAmt = p > 0.5 ? 0.8 : 0; h.x = 1050 - (p > 0.5 ? (p - 0.5) * 300 : 0); guy(h); }
    const pDog = seg(f, sh.a + dur * 0.4, sh.a + dur * 0.4 + 14);
    if (pDog > 0) pet({ x: 1450, y: 930, s: 0.55 * back(pDog), pose: p > 0.7 ? 'up' : 'sit', expr: p > 0.7 ? 'stare' : 'happy', tilt: p > 0.55 && p < 0.7 ? 0.3 : 0, name: 'Bruno' });
    sf(rr(120, 210, 1680, 760, 14), 'rgba(0,0,0,0)', 12);
    tText(p > 0.7 ? 'IF THE LINE SAYS IT, YOU SEE IT' : 'DRAWN WITH CODE', W / 2, 1010, 46, TUT.on);
  } else if (i === 3) {                                                 // sound + captions
    const icons = [['♪', 380], ['👣', 700], ['🚪', 1020]];
    icons.forEach(([s, x], k) => { const a = seg(f, sh.a + k * 14, sh.a + k * 14 + 10); ctx.save(); ctx.globalAlpha = a; sf(ell(x, 380, 120, 120), '#3c4670', 8); ctx.font = '120px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f4efe4'; ctx.fillText(s, x, 390); ctx.restore(); });
    ctx.strokeStyle = TUT.on; ctx.lineWidth = 10; ctx.beginPath();     // the music bed rising into a hit
    for (let x = 1260; x < 1800; x += 8) { const k = (x - 1260) / 540; ctx.lineTo(x, 470 - k * k * 200 + Math.sin(x * 0.2 + f) * 12 * (1 - k)); } ctx.stroke();
    if ((f - sh.a) % 60 < 10) sparkle(1800, 270, 80, 1);
    const words = ['THE', 'DOOR', 'OPENS'];
    const shown = Math.min(3, 1 + Math.floor(p * 4));
    let x = W / 2 - 330;
    words.slice(0, shown).forEach((w, k) => { tText(w, x + k * 330, 820, 120, w === 'DOOR' ? '#ffd34d' : '#ffffff'); });
  } else if (i === 4) {                                                 // the schedule: three alarms a day, then the rocket
    sf(rr(170, 260, 520, 560, 20), TUT.paper, 8); fillR(170, 260, 520, 110, '#c94a4a'); tText('EVERY DAY', 430, 315, 50, '#ffffff', 'center', false);
    for (let k = 0; k < 3; k++) { const ring = Math.floor(p * 3) === k ? Math.sin(f * 1.2) * 0.12 : 0; ctx.save(); ctx.translate(290 + k * 140, 560); ctx.rotate(ring); tClock(0, 0, 52, f, false); ctx.restore(); }
    tText('3x', 430, 720, 70, '#2a2440', 'center', false);
    const rp = seg(f, sh.a + dur * 0.3, sh.b - 10);
    const rx = lerp(780, 1450, ss(rp)), ry = lerp(760, 380, ss(rp));
    ctx.save(); ctx.translate(rx, ry); ctx.rotate(-0.5);
    sf(poly([[0, -90], [40, -20], [40, 70], [-40, 70], [-40, -20]]), '#e9e3d6', 7); sf(ell(0, -10, 20, 20), '#7fe3ff', 5);
    if (rp < 1) { sf(poly([[-30, 72], [30, 72], [0, 150 + Math.sin(f) * 20]]), '#ffb347', 0); }
    ctx.restore();
    tPlay(1600, 340, 70); tText('YOUTUBE', 1600, 470, 40, '#f4efe4', 'center', true);
    tPhone(1600, 760, 0.8, f); tText('INSTAGRAM', 1600, 960, 40, '#f4efe4', 'center', true);
    const z = seg(f, sh.b - 40, sh.b - 30); if (z > 0) tText('while I sleep...', 980, 960, 46, '#c8cde4');
  } else {                                                              // check the work
    sf(rr(240, 240, 760, 470, 14), '#20263f', 9);
    pet({ x: 760, y: 680, s: 0.42, pose: 'sit', expr: 'happy', name: 'Bruno', alpha: seg(f, sh.a + dur * 0.55, sh.a + dur * 0.6) });
    const h = heroObj(sh, f, { x: 420, y: 690, s: 0.36, look: 1, lookY: 0 }); if (h) guy(h);
    const mx = 620 + Math.sin(f * 0.04) * 160, my = 470 + Math.cos(f * 0.05) * 60;
    sf(ell(mx, my, 110, 110), 'rgba(200,230,255,0.25)', 12); line(mx + 80, my + 80, mx + 190, my + 190, INK, 26);
    const items = ['VOICE', 'TIMING', 'SOUND', 'HOOK'];
    items.forEach((t, k) => { const a = seg(f, sh.a + dur * (0.12 + k * 0.12), sh.a + dur * (0.12 + k * 0.12) + 8); tText(t, 1260, 330 + k * 130, 64, '#f4efe4', 'left'); tTick(1190, 330 + k * 130, 1.1, a); });
  }
}

Object.assign(SCENES, {
  tDesk: { frames: { wide: [960, 540, 1.0], hero: [900, 520, 1.3], face: [900, 420, 1.7] }, ambient: '#c4c8e4', draw(f, sh) { tDesk(f, sh); }, lights(l) { light(l, 900, 640, 900, '#ffe8c4', 0.9); } },
  tBelt: { frames: { wide: [960, 540, 1.0], hero: [960, 560, 1.1] }, ambient: '#c4c8e4', draw(f, sh) { tBelt(f, sh); }, lights(l) { light(l, 960, 500, 1200, '#ffffff', 0.85); } },
  tStation: { frames: { wide: [960, 540, 1.0], hero: [960, 560, 1.08] }, ambient: '#c4c8e4', draw(f, sh) { tStation(f, sh); }, lights(l) { light(l, 960, 540, 1200, '#ffffff', 0.9); } },
});
