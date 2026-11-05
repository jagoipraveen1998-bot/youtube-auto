// ---------- world: painted sets (world units = px at zoom 1, frame 1080x1920) ----------
function planks(x, y, w, h, c1, c2, step = 70) {
  fillR(x, y, w, h, c1);
  ctx.strokeStyle = c2; ctx.lineWidth = L(4);
  for (let yy = y + step; yy < y + h; yy += step) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
  let i = 0; for (let yy = y; yy < y + h; yy += step, i++) for (let xx = x + ((i * 173) % 300); xx < x + w; xx += 300) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + step); ctx.stroke(); }
}
function curtain(x, y, w, h, f, side) {
  const sw = Math.sin(f * 0.05 + side) * 10;
  const p = new Path2D(); p.moveTo(x, y); p.lineTo(x + w, y);
  p.bezierCurveTo(x + w + sw, y + h * 0.4, x + w - 20 + sw * 1.6, y + h * 0.7, x + w + 10 + sw * 2, y + h);
  p.lineTo(x, y + h); p.closePath();
  sf(p, '#8e3d52');
  ctx.strokeStyle = '#6d2a3e'; ctx.lineWidth = L(5);
  for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + w * k / 3, y + 10); ctx.quadraticCurveTo(x + w * k / 3 + sw, y + h * 0.6, x + w * k / 3 + sw * 1.5, y + h - 10); ctx.stroke(); }
}

function bedroom(f, hero) {
  fillR(-700, -500, 2500, 2000, '#7383bd');
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let x = -700; x < 1800; x += 96) ctx.fillRect(x, -500, 44, 2000);
  planks(-700, 1500, 2500, 900, '#7d5c48', '#5d4234');
  sf(rr(-700, 1462, 2500, 40, 0), '#5a4436', 4);
  // window
  sf(rr(70, 320, 350, 490, 12), '#e9e2d0');
  const sky = ctx.createLinearGradient(0, 345, 0, 790); sky.addColorStop(0, '#141c45'); sky.addColorStop(1, '#2d3c78');
  sf(rr(92, 342, 306, 446, 4), sky, 4);
  ctx.fillStyle = '#f4f0d6'; ctx.beginPath(); ctx.arc(300, 450, 46, 0, 7); ctx.fill();
  ctx.fillStyle = '#2d3c78'; ctx.beginPath(); ctx.arc(320, 438, 40, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; for (let i = 0; i < 9; i++) { const a = 0.4 + 0.6 * noise1(f * 0.1 + i * 3); ctx.globalAlpha = a; ctx.fillRect(110 + rnd(i) * 270, 370 + rnd(i + 9) * 380, 5, 5); } ctx.globalAlpha = 1;
  line(245, 342, 245, 788, '#e9e2d0', 0); fillR(237, 342, 16, 446, '#e9e2d0'); fillR(92, 560, 306, 16, '#e9e2d0');
  curtain(40, 300, 120, 560, f, 0); curtain(330, 300, 120, 560, f, 2);
  sf(rr(20, 290, 450, 22, 10), '#6b4a36');
  // picture
  sf(rr(640, 420, 230, 180, 6), '#8a5a3a'); sf(rr(662, 442, 186, 136, 2), '#7aa08a', 4);
  sf(poly([[662, 578], [720, 500], [770, 548], [810, 505], [848, 578]]), '#4f7a64', 4);
  // door (right, ajar)
  sf(rr(940, 800, 240, 690, 4), '#120c18');
  sf(poly([[940, 800], [1015, 830], [1015, 1470], [940, 1490]]), '#a07554');
  // nightstand + lamp + glass (no clock!)
  sf(rr(60, 1200, 190, 290, 10), '#8a5a3a'); sf(rr(48, 1182, 214, 26, 8), '#9c6a46');
  line(80, 1320, 230, 1320, INK, 5); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(155, 1290, 8, 0, 7); ctx.fill();
  sf(rr(118, 1130, 34, 54, 8), '#d8cdb8'); sf(poly([[92, 1140], [178, 1140], [160, 1050], [110, 1050]]), '#e7d7a8');
  sf(rr(196, 1128, 36, 56, 6), 'rgba(190,226,242,0.75)');
  // bed
  sf(rr(300, 930, 640, 340, 40), '#9a6a46');
  sf(rr(340, 970, 560, 120, 30), '#87593a', 4);
  sf(rr(300, 1400, 30, 90, 6), '#6b4630'); sf(rr(910, 1400, 30, 90, 6), '#6b4630');
  sf(rr(280, 1250, 680, 170, 30), '#e9e4dc');
  sf(rr(440, 1170, 290, 96, 46), '#f6f3ee');
  if (bedroom.atDoor) guy(bedroom.atDoor);
  if (bedroom.atWindow) { ctx.save(); ctx.beginPath(); ctx.rect(92, 342, 306, 446); ctx.clip(); guy(bedroom.atWindow); ctx.restore(); line(245,342,245,788,'#e9e2d0',0); fillR(237, 342, 16, 446, '#e9e2d0'); fillR(92, 560, 306, 16, '#e9e2d0'); }
  if (bedroom.beside) guy(bedroom.beside);
  if (hero) guy(hero);
  // blanket
  const bl = new Path2D(); bl.moveTo(268, 1300);
  for (let i = 0; i <= 10; i++) bl.lineTo(268 + i * 70.4, 1290 + Math.sin(i * 1.7 + f * 0.04) * 8);
  bl.lineTo(975, 1450); bl.quadraticCurveTo(620, 1475, 262, 1450); bl.closePath();
  sf(bl, '#c4566a');
  ctx.save(); ctx.clip(bl); ctx.fillStyle = '#d97e8c'; for (let x = 300; x < 980; x += 70) for (let y = 1320; y < 1460; y += 60) { ctx.beginPath(); ctx.arc(x + ((y / 60) % 2) * 35, y, 9, 0, 7); ctx.fill(); } ctx.restore();
  sf(rr(262, 1288, 715, 34, 16), '#e9e4dc');
}
function bedroomLights(c, f) {
  light(c, 245, 560, 520, '#9fb3ff', 0.9);
  c.save(); c.globalAlpha = 0.35; const g = c.createLinearGradient(250, 560, 700, 1400); g.addColorStop(0, '#b8c8ff'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.moveTo(92, 342); c.lineTo(398, 342); c.lineTo(900, 1450); c.lineTo(380, 1500); c.closePath(); c.fill(); c.restore();
  light(c, 600, 950, 420, '#8ea2e8', 0.6);
  light(c, 1060, 1200, 380, '#ffb070', 0.35 + 0.1 * Math.sin(f * 0.3));
}

function calendarScene(f, top = 'MONDAY', big = '13') {
  fillR(-400, -300, 1900, 2500, '#6c7cb4');
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let x = -400; x < 1500; x += 96) ctx.fillRect(x, -300, 44, 2500);
  ctx.fillStyle = '#3a2f3c'; ctx.beginPath(); ctx.arc(540, 470, 12, 0, 7); ctx.fill();
  line(540, 470, 400, 560, INK, 4); line(540, 470, 680, 560, INK, 4);
  ctx.save(); ctx.translate(540, 560); ctx.rotate(Math.sin(f * 0.04) * 0.012);
  sf(rr(-240, 0, 480, 660, 14), '#efe9dc');
  sf(rr(-240, 0, 480, 170, [14, 14, 0, 0]), '#b8323a');
  for (let i = 0; i < 8; i++) { ctx.fillStyle = '#efe9dc'; ctx.beginPath(); ctx.arc(-210 + i * 60, 6, 9, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#fff'; ctx.font = 'bold 96px "DejaVu Sans"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${top.length > 7 ? Math.floor(96 * 7 / top.length) : 96}px "DejaVu Sans"`; ctx.fillText(top, 0, 95);
  ctx.fillStyle = '#2a1d2e'; ctx.font = `bold ${big.length > 2 ? Math.floor(330 * 2 / big.length) : 330}px "DejaVu Serif"`; ctx.fillText(big, 0, 420);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 3; for (let y = 600; y < 650; y += 12) { ctx.beginPath(); ctx.moveTo(-230, y); ctx.lineTo(230, y); ctx.stroke(); }
  ctx.restore();
}

function hallway(f, peek) {
  fillR(-1600, -800, 2020, 3600, '#7a7fae'); fillR(660, -800, 2200, 3600, '#6f74a3');   // walls run on past the edges in 16:9
  sf(poly([[-300, -300], [1380, -300], [660, 640], [420, 640]]), '#5b5f86', 0);
  sf(poly([[-300, 2300], [1380, 2300], [660, 1080], [420, 1080]]), '#6e5447', 0);
  // floor boards converging
  ctx.strokeStyle = '#4f3a31'; ctx.lineWidth = L(4);
  for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(540 + i * 20, 1080); ctx.lineTo(540 + i * 260, 2300); ctx.stroke(); }
  sf(poly([[-300, -300], [420, 640], [420, 1080], [-300, 2300]]), '#7a7fae', 0);
  sf(poly([[1380, -300], [660, 640], [660, 1080], [1380, 2300]]), '#6f74a3', 0);
  // runner rug
  sf(poly([[470, 1100], [610, 1100], [820, 2300], [260, 2300]]), '#7b2f3c', 0);
  // picture frames on walls
  sf(poly([[150, 520], [300, 600], [300, 820], [150, 820]]), '#8a5a3a', 4);
  sf(poly([[930, 560], [800, 620], [800, 800], [930, 830]]), '#8a5a3a', 4);
  // end wall + door glow
  fillR(420, 640, 240, 440, '#4c4f73');
  const g = ctx.createLinearGradient(0, 760, 0, 1080); g.addColorStop(0, '#ffdf9a'); g.addColorStop(1, '#ffc46a');
  sf(rr(470, 760, 140, 320, 2), g, 4);
  sf(poly([[470, 760], [440, 740], [440, 1100], [470, 1080]]), '#6a4a38', 4);
  // edges
  line(420, 640, 420, 1080, INK, 4); line(660, 640, 660, 1080, INK, 4); line(420, 1080, 660, 1080, INK, 4);
  line(420, 640, -300, -300, INK, 4); line(660, 640, 1380, -300, INK, 4); line(420, 1080, -300, 2300, INK, 4); line(660, 1080, 1380, 2300, INK, 4);
  if (hallway.figure) guy(hallway.figure);
  if (peek) guy(peek);
  // foreground door frame (left) — hero peeks around it
  sf(rr(-300, -400, 400, 2800, 0), '#3e2f3e');
  sf(rr(60, -400, 70, 2800, 0), '#58435a');
}
function hallLights(c, f) {
  c.save(); c.globalAlpha = 0.85; const g = c.createLinearGradient(0, 1080, 0, 2300); g.addColorStop(0, '#ffd48a'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.moveTo(470, 1080); c.lineTo(610, 1080); c.lineTo(980, 2300); c.lineTo(100, 2300); c.closePath(); c.fill(); c.restore();
  light(c, 540, 920, 380, '#ffcf80', 1.0);
  light(c, 260, 980, 420, '#ffbb70', 0.45);
}

const K_FLOOR = 1700;
function kitchen(f, opt = {}) {
  fillR(-600, -500, 2300, 2300, '#cdb991');
  // backsplash tiles
  fillR(-600, 1000, 2300, 260, '#e5ddcf');
  ctx.strokeStyle = '#b9ad98'; ctx.lineWidth = L(3);
  for (let y = 1000; y <= 1260; y += 52) { ctx.beginPath(); ctx.moveTo(-600, y); ctx.lineTo(1700, y); ctx.stroke(); }
  for (let x = -600; x < 1700; x += 52) { ctx.beginPath(); ctx.moveTo(x, 1000); ctx.lineTo(x, 1260); ctx.stroke(); }
  // window
  sf(rr(350, 540, 300, 400, 8), '#efe8da');
  const sky = ctx.createLinearGradient(0, 560, 0, 920); sky.addColorStop(0, '#1a2352'); sky.addColorStop(1, '#3d4e8c');
  sf(rr(370, 560, 260, 360, 2), sky, 4); fillR(492, 560, 16, 360, '#efe8da'); fillR(370, 732, 260, 16, '#efe8da');
  // upper cabinets
  sf(rr(690, 380, 520, 380, 8), '#6e8f7a');
  for (let x = 700; x < 1200; x += 170) { sf(rr(x + 10, 395, 150, 350, 6), '#7a9c86', 4); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + 140, 700, 8, 0, 7); ctx.fill(); }
  // fridge
  sf(rr(-40, 500, 320, 1210, 26), '#e8e6e0'); line(-40, 900, 280, 900, INK, 5);
  sf(rr(240, 640, 18, 200, 9), '#b7b4ab', 4); sf(rr(240, 960, 18, 240, 9), '#b7b4ab', 4);
  sf(rr(40, 600, 90, 110, 4), '#f2d25c', 4); // note on fridge
  // switch
  sf(rr(320, 880, 40, 64, 6), '#f3efe6', 4); fillR(334, 896 + (opt.lightOn > 0.5 ? 0 : 18), 12, 14, '#8b8578');
  // counter
  sf(rr(300, 1290, 930, 420, 6), '#6e8f7a');
  for (let x = 320; x < 1200; x += 220) { sf(rr(x, 1320, 200, 360, 6), '#7a9c86', 4); sf(rr(x + 80, 1340, 40, 14, 7), '#d8d2c8', 4); }
  sf(rr(290, 1250, 950, 46, 8), '#d8d2c8');
  // floor
  fillR(-600, K_FLOOR, 2300, 700, '#b8ab99');
  ctx.fillStyle = '#9d907f'; for (let y = K_FLOOR; y < 2400; y += 110) for (let x = -600 + ((y / 110) % 2) * 110; x < 1700; x += 220) ctx.fillRect(x, y, 110, 110);
  line(-600, K_FLOOR, 1700, K_FLOOR, INK, 5);
  // coffee maker
  sf(rr(780, 1010, 170, 242, 18), '#3a3340'); sf(rr(800, 1030, 130, 40, 8), '#55495c', 4);
  sf(rr(805, 1110, 120, 135, 20), 'rgba(200,220,235,0.55)'); fillR(812, 1180, 106, 58, '#4a2a1c');
  ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(920, 1090, 7, 0, 7); ctx.fill();
  // pendant lamp
  line(540, -500, 540, 250, INK, 5);
  sf(poly([[470, 330], [610, 330], [575, 250], [505, 250]]), '#2f4a3e');
  ctx.fillStyle = opt.lightOn > 0.5 ? '#fff6d6' : '#9a9486'; ctx.beginPath(); ctx.arc(540, 338, 20, 0, 7); ctx.fill();
  if (opt.mug) {
    sf(rr(530, 1160, 92, 92, 14), '#c94f4f');
    ctx.lineWidth = L(6.5); ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(628, 1205, 24, -1.2, 1.2); ctx.stroke();
    if (opt.steam) steam(576, 1150, f, 170, 0.6);
  }
}
function kitchenLights(c, f, opt) {
  light(c, 500, 760, 620, '#8ea4ea', opt.dawn ?? 0.9);
  light(c, 576, 1150, 220, '#ffd8a8', opt.mugGlow || 0);
  if (opt.lightOn > 0) { light(c, 540, 380, 1400, '#fff2d0', opt.lightOn); light(c, 540, 1200, 900, '#ffe6b8', opt.lightOn * 0.6); }
}

function frontDoor(f) {
  fillR(-500, -400, 2100, 2000, '#7d6a8a');
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = -500; x < 1600; x += 110) ctx.fillRect(x, -400, 50, 2000);
  planks(-500, 1520, 2100, 900, '#7a5a46', '#5a4033');
  sf(rr(270, 300, 540, 1230, 10), '#5d3e2c');
  sf(rr(300, 330, 480, 1200, 6), '#8a5a3c');
  sf(rr(350, 390, 380, 420, 10), '#7c5034', 4); sf(rr(350, 880, 380, 560, 10), '#7c5034', 4);
  sf(ell(720, 940, 22, 22), '#d8b45a'); sf(ell(540, 470, 12, 12), '#2a1f2a', 4);
  sf(rr(330, 1560, 420, 110, 16), '#6b6f45');
  ctx.strokeStyle = '#575a37'; ctx.lineWidth = L(4); for (let x = 350; x < 740; x += 24) { ctx.beginPath(); ctx.moveTo(x, 1570); ctx.lineTo(x, 1660); ctx.stroke(); }
}
function shoe(x, y, flip) {
  ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -1 : 1, 1);
  const p = new Path2D(); p.moveTo(-95, 0); p.lineTo(-95, -50); p.quadraticCurveTo(-95, -95, -50, -95); p.lineTo(-10, -95); p.quadraticCurveTo(30, -60, 95, -40); p.quadraticCurveTo(115, -30, 110, 0); p.closePath();
  sf(p, '#d0453c');
  sf(rr(-102, -12, 216, 26, 12), '#f3efe6');
  ctx.strokeStyle = '#f7f3ea'; ctx.lineWidth = 7;
  for (let i = 0; i < 4; i++) { const xx = -40 + i * 22; ctx.beginPath(); ctx.moveTo(xx, -86 + i * 10); ctx.lineTo(xx + 22, -74 + i * 10); ctx.stroke(); ctx.beginPath(); ctx.moveTo(xx + 22, -86 + i * 10); ctx.lineTo(xx, -74 + i * 10); ctx.stroke(); }
  // bow
  sf(ell(-48, -112, 26, 15, -0.5), '#f7f3ea', 4); sf(ell(-6, -112, 26, 15, 0.5), '#f7f3ea', 4); sf(ell(-27, -104, 9, 9), '#f7f3ea', 4);
  ctx.restore();
}
function frontLights(c, f) { light(c, 200, 200, 900, '#ffcf90', 0.75); light(c, 540, 1500, 600, '#b0b8ff', 0.45); }

function wardrobe(f, shirtSpark, showShirt = true, ajar = 0) {
  fillR(-500, -400, 2100, 2000, '#5f6a9a');
  planks(-500, 1600, 2100, 800, '#6e5242', '#4f392e');
  sf(rr(160, 280, 780, 1340, 14), '#7a4f36');
  sf(rr(190, 310, 350, 1280, 8), '#8d5d40', 4); sf(rr(560, 310, 350, 1280, 8), '#8d5d40', 4);
  sf(rr(500, 820, 16, 140, 8), '#d8b45a', 4); sf(rr(584, 820, 16, 140, 8), '#d8b45a', 4);
  if (ajar > 0) { sf(poly([[540, 310], [540 + 60 * ajar, 320], [540 + 60 * ajar, 1580], [540, 1590]]), '#07040c', 0); }
  if (!showShirt) return;
  // hanger on top edge
  ctx.save(); ctx.translate(730, 300); ctx.rotate(Math.sin(f * 0.05) * 0.015);
  ctx.strokeStyle = INK; ctx.lineWidth = L(7); ctx.beginPath(); ctx.arc(0, -10, 22, Math.PI, 2.2 * Math.PI); ctx.stroke();
  line(0, 12, 0, 40, INK, 7); sf(poly([[-190, 120], [0, 40], [190, 120]]), '#c9a46a', 6);
  // pressed shirt
  const s = new Path2D(); s.moveTo(-70, 62); s.lineTo(-200, 120); s.lineTo(-250, 360); s.lineTo(-175, 380); s.lineTo(-160, 230); s.lineTo(-160, 820); s.lineTo(160, 820); s.lineTo(160, 230); s.lineTo(175, 380); s.lineTo(250, 360); s.lineTo(200, 120); s.lineTo(70, 62); s.closePath();
  sf(s, '#9cc4e8');
  sf(poly([[-70, 62], [0, 150], [-30, 70]]), '#e8f2fb'); sf(poly([[70, 62], [0, 150], [30, 70]]), '#e8f2fb');
  ctx.strokeStyle = '#7ea7cf'; ctx.lineWidth = L(4); [-90, 90].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 180); ctx.lineTo(x, 800); ctx.stroke(); });
  line(0, 150, 0, 820, INK, 4); ctx.fillStyle = INK; for (let y = 210; y < 800; y += 85) { ctx.beginPath(); ctx.arc(0, y, 8, 0, 7); ctx.fill(); }
  sf(rr(-110, 260, 80, 70, 6), '#9cc4e8', 4);
  const sp = [[-120, 200], [140, 420], [-60, 600], [110, 720], [-170, 330], [40, 300]];
  sp.forEach((p, i) => sparkle(p[0], p[1], 34 * (0.6 + 0.4 * Math.sin(f * 0.25 + i * 1.7)), shirtSpark * (0.5 + 0.5 * Math.sin(f * 0.25 + i * 1.7))));
  ctx.restore();
}
function wardrobeLights(c, f) { light(c, 730, 700, 700, '#d8e6ff', 0.8); light(c, 250, 1000, 700, '#9aa8e0', 0.5); }

function secCam(f) {
  sf(poly([[-400, -400], [540, 300], [540, 2400], [-400, 2400]]), '#bfae8a', 0);
  sf(poly([[1500, -400], [540, 300], [540, 2400], [1500, 2400]]), '#a99a79', 0);
  line(540, 300, 540, 2400, INK, 4);
  sf(rr(500, 420, 80, 120, 10), '#d9d6cf');
  line(540, 480, 640, 600, '#5a5a62', 34); line(540, 480, 640, 600, '#d9d6cf', 22);
  ctx.save(); ctx.translate(680, 650); ctx.rotate(0.35);
  sf(rr(-140, -80, 300, 160, 50), '#f1efe9');
  sf(rr(120, -70, 50, 140, 20), '#e1ded6');
  sf(ell(170, 0, 56, 56), '#2b2833'); sf(ell(178, 0, 30, 30), '#0d0b12', 4);
  ctx.fillStyle = 'rgba(160,190,255,0.7)'; ctx.beginPath(); ctx.arc(168, -10, 10, 0, 7); ctx.fill();
  const on = Math.floor(f / 12) % 2 === 0;
  ctx.fillStyle = on ? '#ff2e2e' : '#5a1a1a'; ctx.beginPath(); ctx.arc(-90, -30, 14, 0, 7); ctx.fill();
  ctx.restore();
}
function secLights(c, f) { light(c, 600, 600, 700, '#9fb0e6', 0.9); const on = Math.floor(f / 12) % 2 === 0; if (on) light(c, 600, 610, 160, '#ff4040', 0.9); }

function desk(f, hero) {
  fillR(-500, -400, 2100, 2400, '#3c4370');
  sf(rr(700, 520, 300, 220, 8), '#2a2f52', 4);
  if (desk.behind) guy(desk.behind);
  if (hero) guy(hero);
  sf(rr(-200, 1360, 1500, 50, 10), '#7a5238');
  fillR(-200, 1410, 1500, 800, '#5d3e2c'); line(-200, 1410, 1300, 1410, INK, 5);
  // laptop (back of lid facing us)
  sf(poly([[230, 1365], [610, 1365], [640, 1385], [200, 1385]]), '#9a9aa6');
  sf(poly([[250, 1365], [590, 1365], [560, 1060], [280, 1060]]), '#b4b4bf');
  sf(rr(860, 1270, 90, 92, 14), '#c94f4f', 6);
}
function deskLights(c, f) {
  const fl = 0.9 + 0.1 * noise1(f * 0.5);
  light(c, 520, 1150, 620, '#d6e4ff', fl); light(c, 700, 1050, 420, '#bcd0ff', 0.8 * fl);
}

// ---------- new sets ----------
function phoneScene(f, t) { // t: {from, msg, time}
  fillR(-400, -300, 1900, 2600, '#1a1830');
  // hand + phone
  sf(rr(250, 380, 580, 1160, 70), '#1c1b22');
  sf(rr(280, 440, 520, 1040, 30), '#0f1830', 4);
  ctx.save(); ctx.beginPath(); ctx.rect(280, 440, 520, 1040); ctx.clip();
  const g = ctx.createLinearGradient(0, 440, 0, 1480); g.addColorStop(0, '#20325e'); g.addColorStop(1, '#101a36'); ctx.fillStyle = g; ctx.fillRect(280, 440, 520, 1040);
  ctx.fillStyle = '#dfe8ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 120px "DejaVu Sans"'; ctx.fillText(t.time || '3:00', 540, 580);
  ctx.font = '34px "DejaVu Sans"'; ctx.fillStyle = '#9fb0d8'; ctx.fillText('Messages', 540, 690);
  // bubble
  const msg = t.msg || '';
  ctx.font = 'bold 40px "DejaVu Sans"'; ctx.textAlign = 'left';
  const words = msg.split(/\s+/), lines = []; let cur = '';
  for (const w of words) { const tryL = cur ? cur + ' ' + w : w; if (ctx.measureText(tryL).width > 400) { lines.push(cur); cur = w; } else cur = tryL; }
  if (cur) lines.push(cur);
  const bh = 70 + lines.length * 54;
  sf(rr(310, 760, 460, bh + 50, 30), '#e9eef8', 3);
  ctx.fillStyle = '#5a6684'; ctx.font = 'bold 30px "DejaVu Sans"'; ctx.fillText(t.from || 'Unknown', 340, 800);
  ctx.fillStyle = '#16131c'; ctx.font = 'bold 40px "DejaVu Sans"';
  lines.forEach((l, i) => ctx.fillText(l, 340, 860 + i * 54));
  ctx.restore();
  sf(rr(470, 455, 140, 26, 13), '#0b0a10', 0);
  // thumb
  sf(ell(830, 1420, 120, 170, -0.5), SKIN);
}
function phoneLights(c, f) { light(c, 540, 900, 700, '#bcd0ff', 1.0); light(c, 540, 900, 1200, '#5060a0', 0.6); }

function bathroom(f, hero, reflection) {
  fillR(-500, -400, 2100, 2600, '#7d9a9a');
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = L(3);
  for (let y = -400; y < 2200; y += 90) { ctx.beginPath(); ctx.moveTo(-500, y); ctx.lineTo(1600, y); ctx.stroke(); }
  for (let x = -500; x < 1600; x += 90) { ctx.beginPath(); ctx.moveTo(x, -400); ctx.lineTo(x, 2200); ctx.stroke(); }
  // mirror
  sf(rr(200, 260, 680, 900, 30), '#a8a59a');
  ctx.save(); const mp = rr(230, 290, 620, 840, 18); ctx.clip(mp);
  const g = ctx.createLinearGradient(0, 290, 0, 1130); g.addColorStop(0, '#4f6a72'); g.addColorStop(1, '#2e4148'); ctx.fillStyle = g; ctx.fillRect(230, 290, 620, 840);
  if (reflection) guy(reflection);
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(260, 290); ctx.lineTo(420, 290); ctx.lineTo(260, 620); ctx.closePath(); ctx.fill();
  ctx.restore(); sf(rr(230, 290, 620, 840, 18), null, 6);
  // sink
  sf(rr(160, 1180, 760, 90, 30), '#eef0ec'); sf(rr(400, 1270, 280, 600, 20), '#e3e6e1');
  sf(rr(520, 1110, 40, 80, 10), '#c9ccd0', 5);
  if (hero) guy(hero);
}
function bathLights(c, f) { light(c, 540, 200, 1200, '#e8f4f0', 0.85); light(c, 540, 700, 600, '#c8e0ff', 0.6); }

function windowScene(f, figure, rain) {
  fillR(-500, -400, 2100, 2600, '#6c7cb4');
  sf(rr(140, 260, 800, 1140, 14), '#e9e2d0');
  ctx.save(); ctx.beginPath(); ctx.rect(170, 290, 740, 1080); ctx.clip();
  const sky = ctx.createLinearGradient(0, 290, 0, 1370); sky.addColorStop(0, '#0e1433'); sky.addColorStop(1, '#25305e');
  ctx.fillStyle = sky; ctx.fillRect(170, 290, 740, 1080);
  sf(poly([[170, 1370], [300, 1100], [420, 1180], [560, 1050], [700, 1150], [910, 1060], [910, 1370]]), '#0d1226', 0);
  if (figure) guy(figure);
  if (rain) { ctx.strokeStyle = 'rgba(200,215,255,0.35)'; ctx.lineWidth = L(3); for (let i = 0; i < 70; i++) { const x = 170 + rnd(i) * 740, y = ((rnd(i + 99) * 1080 + f * 38) % 1080) + 290; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 40); ctx.stroke(); } }
  ctx.restore();
  fillR(532, 290, 16, 1080, '#e9e2d0'); fillR(170, 820, 740, 16, '#e9e2d0');
  sf(rr(170, 290, 740, 1080, 2), null, 5);
  sf(rr(100, 1390, 880, 50, 10), '#d8cfba');
  curtain(60, 220, 160, 1260, f, 0); curtain(860, 220, 160, 1260, f, 2);
}
function windowLights(c, f) { light(c, 540, 800, 800, '#9fb3ff', 0.9); light(c, 540, 1600, 700, '#ffb070', 0.25); }

function closeupScene(f, hero, tint) {
  const g = ctx.createRadialGradient(540, 900, 100, 540, 900, 1300); g.addColorStop(0, tint || '#3a3f6e'); g.addColorStop(1, '#0d0b1a');
  ctx.fillStyle = g; ctx.fillRect(-600, -600, 2300, 3200);
  if (hero) guy(hero);
}
function closeupLights(c, f, tint) { light(c, 540, 900, 900, '#c8d2ff', 0.9); light(c, 900, 700, 700, tint || '#8090ff', 0.5); }
