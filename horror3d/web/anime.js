// Anime-style character cards (our own designs, drawn in code). Same card space as toon.js: 600 x 1000, feet at y 975.
// Taller proportions, big shining eyes, spiky hair with flowing strands, bold clean outlines and two-tone cel shading.
// Use: import { animeActor, ANIME } from './anime.js';  out.push(animeActor('bro', { expr: 'scared', R: 'hang' }, pos, { s: 0.5 }))
const INK = '#1a1220';

// ---- our cast designs (colours and hair style per character) ----
export const ANIME = {
  bro: { skin: '#ffe0c8', shade: '#f0b49a', hair: '#8a5a32', hairD: '#5a3418', hairHi: '#c8905a', eye: '#3a8ad0', top: '#e8c44a', topD: '#b8902a', legs: '#3a4a6a', shoes: '#2a2228', style: 'spiky', h: 0.86, kid: true },
  sis: { skin: '#ffe2cc', shade: '#f2b8a0', hair: '#3a2418', hairD: '#1e120c', hairHi: '#7a4a30', eye: '#3ab07a', top: '#3f8a5a', topD: '#2a6040', legs: '#2a2a3a', shoes: '#1e1a20', style: 'twin', ribbon: '#f2c84a', h: 0.95 },
  mum: { skin: '#fcd8c0', shade: '#e8a890', hair: '#1e1418', hairD: '#0c080a', hairHi: '#4a3440', eye: '#8a3a6a', top: '#6a4a8a', topD: '#48306a', legs: '#4a3a5a', shoes: '#1e1a20', style: 'long', h: 1.0 },
};

const P = (g, pts) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) g.quadraticCurveTo(p[0], p[1], p[2], p[3]); else g.lineTo(p[0], p[1]); } g.closePath(); };
const fillLine = (g, fill, lw = 5) => { if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); } };

/** draw one anime character into a card pen. o: expr, blink (0..1), look (-1..1), R (hang | up | reach | lift), mouthOpen, wet */
export function animeFront(p, key, o = {}) {
  const g = p.g, D = typeof key === 'string' ? ANIME[key] : key;
  const { expr = 'neutral', blink = 0, look = 0, R = 'hang' } = o;
  g.save();
  const H = D.h || 1, sole = 975, top = sole - 900 * H;            // the figure is 900*H tall
  const head = (D.kid ? 270 : 230) * H, cx = 300, hy = top + head * 0.55;          // head centre
  const shoulderY = top + head * 1.08, hipY = top + head * (D.kid ? 2.15 : 2.5), kneeY = top + head * 3.2;
  // ---- long hair behind the body ----
  if (D.style === 'long') { P(g, [[cx - 125, hy - 40], [cx - 150, hy + 160, cx - 140, hipY - 20], [cx - 60, hipY + 10], [cx + 60, hipY + 10], [cx + 140, hipY - 20], [cx + 150, hy + 160, cx + 125, hy - 40]]); fillLine(g, D.hairD, 5); }
  if (D.style === 'twin') for (const s of [-1, 1]) { P(g, [[cx + s * 95, hy - 30], [cx + s * 175, hy + 60, cx + s * 150, hy + 230], [cx + s * 120, hy + 260], [cx + s * 110, hy + 120, cx + s * 80, hy - 10]]); fillLine(g, D.hair, 5);
    g.fillStyle = D.ribbon; g.beginPath(); g.ellipse(cx + s * 98, hy - 22, 22, 14, s * 0.5, 0, 7); g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); }
  // ---- legs and shoes ----
  for (const s of [-1, 1]) {
    P(g, [[cx + s * 10, hipY - 10], [cx + s * 62, hipY - 10], [cx + s * 58, sole - 40], [cx + s * 20, sole - 40]]); fillLine(g, D.legs, 5);
    P(g, [[cx + s * 14, sole - 44], [cx + s * 66, sole - 44], [cx + s * 78, sole - 18, cx + s * 70, sole], [cx + s * 10, sole], [cx + s * 10, sole - 20]]); fillLine(g, D.shoes, 5);
  }
  // ---- arms (behind or beside the torso) ----
  const arm = (s) => {
    const sx = cx + s * 88, sy = shoulderY + 22;
    let hx = cx + s * 112, hy2 = hipY + 10;                                        // hang
    if (R === 'up' && s > 0) { hx = cx + s * 150; hy2 = hy - 40; }
    if (R === 'reach' && s > 0) { hx = cx + s * 210; hy2 = shoulderY + 60; }
    if (R === 'lift' && s > 0) { hx = cx + s * 140; hy2 = top + 30; }
    const mx = (sx + hx) / 2 + s * 18, my = (sy + hy2) / 2;
    g.lineCap = 'round'; g.lineWidth = 50; g.strokeStyle = INK; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(mx, my, hx, hy2); g.stroke();
    g.lineWidth = 40; g.strokeStyle = D.top; g.stroke();
    g.lineWidth = 14; g.strokeStyle = D.topD; g.beginPath(); g.moveTo(sx + s * 10, sy + 10); g.quadraticCurveTo(mx + s * 10, my, hx + s * 6, hy2 - 10); g.stroke();   // cel shade on the sleeve
    g.fillStyle = D.skin; g.beginPath(); g.ellipse(hx, hy2 + (hy2 < sy ? -12 : 12), 18, 20, 0, 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    return [hx, hy2];
  };
  const handR = arm(1), handL = arm(-1);
  // ---- torso: top with folds and a collar, cel shadow down one side ----
  const torso = [[cx - 84, shoulderY + 14], [cx - 64, shoulderY - 4, cx - 30, shoulderY - 12], [cx + 30, shoulderY - 12], [cx + 64, shoulderY - 4, cx + 84, shoulderY + 14], [cx + 96, shoulderY + 70, cx + 78, hipY - 50], [cx + 84, hipY + 14], [cx, hipY + 24, cx - 84, hipY + 14], [cx - 78, hipY - 50], [cx - 96, shoulderY + 70, cx - 90, shoulderY + 8]];
  P(g, torso); fillLine(g, D.top, 6);
  g.save(); P(g, torso); g.clip(); g.fillStyle = D.topD; g.fillRect(cx - 100, hipY - 16, 200, 50); g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 100, hipY - 16); g.quadraticCurveTo(cx, hipY - 4, cx + 100, hipY - 16); g.stroke(); g.restore();
  P(g, torso);
  g.save(); g.clip(); g.fillStyle = D.topD; P(g, [[cx + 30, shoulderY - 20], [cx + 110, shoulderY], [cx + 110, hipY + 20], [cx + 50, hipY + 20], [cx + 62, hipY - 120, cx + 40, shoulderY + 40]]); g.fill();
  g.strokeStyle = D.topD; g.lineWidth = 5; for (const [x0, y0, x1, y1] of [[cx - 50, hipY - 90, cx - 30, hipY - 10], [cx - 10, hipY - 60, cx + 4, hipY + 6], [cx - 70, shoulderY + 60, cx - 40, shoulderY + 120]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + 18, (y0 + y1) / 2, x1, y1); g.stroke(); }
  g.restore();
  P(g, [[cx - 36, shoulderY - 12], [cx, shoulderY + 34], [cx + 36, shoulderY - 12], [cx + 18, shoulderY - 18], [cx, shoulderY + 8], [cx - 18, shoulderY - 18]]); fillLine(g, '#f4f0e8', 4);   // collar
  // ---- neck ----
  P(g, [[cx - 22, hy + head * 0.38], [cx + 22, hy + head * 0.38], [cx + 24, shoulderY - 6], [cx - 24, shoulderY - 6]]); fillLine(g, D.shade, 4);
  // ---- hair back mass ----
  P(g, [[cx - 122, hy + 10], [cx - 130, hy - 120, cx - 20, hy - 150], [cx + 110, hy - 150, cx + 128, hy], [cx + 120, hy + 70], [cx - 118, hy + 70]]); fillLine(g, D.hairD, 5);
  // ---- face: rounded top, tapered anime chin; cel shadow under the fringe and down the right side ----
  const face = [[cx - 98, hy - 30], [cx - 104, hy + 40, cx - 70, hy + 90], [cx - 10, hy + 128], [cx + 10, hy + 128], [cx + 70, hy + 90], [cx + 104, hy + 40, cx + 98, hy - 30], [cx + 96, hy - 110, cx, hy - 118], [cx - 96, hy - 110, cx - 98, hy - 30]];
  P(g, face); fillLine(g, D.skin, 6);
  g.save(); P(g, face); g.clip();
  g.fillStyle = D.shade; P(g, [[cx + 60, hy - 120], [cx + 120, hy - 60], [cx + 110, hy + 120], [cx + 30, hy + 140], [cx + 78, hy + 40, cx + 64, hy - 40]]); g.fill();
  g.fillStyle = D.shade; g.globalAlpha = 0.85; P(g, [[cx - 110, hy - 60], [cx + 110, hy - 60], [cx + 110, hy - 34], [cx + 40, hy - 22, cx, hy - 30], [cx - 50, hy - 20, cx - 110, hy - 34]]); g.fill(); g.globalAlpha = 1;
  g.restore();
  // ---- eyes: tall shining anime eyes ----
  const shut = Math.min(1, Math.max(blink, expr === 'pained' || expr === 'cry' ? 0.55 : expr === 'creepy' ? 0.35 : 0));
  const big = expr === 'scared' || expr === 'shock' ? 1.08 : 1;
  const pupil = expr === 'scared' || expr === 'shock' ? 0.45 : expr === 'creepy' ? 0.7 : 1;
  for (const s of [-1, 1]) {
    const ex = cx + s * 46, ey = hy + 22, ew = 30 * big, eh = 40 * big;
    if (shut > 0.92) { g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.moveTo(ex - ew, ey + 6); g.quadraticCurveTo(ex, ey + (expr === 'pained' ? -6 : 14), ex + ew, ey + 6); g.stroke(); continue; }
    g.save(); g.beginPath(); g.ellipse(ex, ey, ew, eh, 0, 0, 7); g.clip();
    g.fillStyle = '#ffffff'; g.fillRect(ex - ew, ey - eh, ew * 2, eh * 2);
    const ix = ex + look * 10 * s * 0 + look * 10, iy = ey + 4;
    const ig = g.createLinearGradient(ix, iy - eh, ix, iy + eh); ig.addColorStop(0, '#10101a'); ig.addColorStop(0.45, D.eye); ig.addColorStop(1, '#e8f4ff');
    g.fillStyle = ig; g.beginPath(); g.ellipse(ix, iy, ew * 0.78 * (expr === 'scared' ? 0.8 : 1), eh * 0.86 * (expr === 'scared' ? 0.8 : 1), 0, 0, 7); g.fill();
    g.fillStyle = '#0a0a12'; g.beginPath(); g.ellipse(ix, iy + 2, ew * 0.34 * pupil, eh * 0.4 * pupil, 0, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ix - ew * 0.32, iy - eh * 0.36, ew * 0.26, eh * 0.2, -0.4, 0, 7); g.fill();      // shine
    g.beginPath(); g.ellipse(ix + ew * 0.3, iy + eh * 0.34, ew * 0.11, eh * 0.09, 0, 0, 7); g.fill();
    if (shut > 0) { g.fillStyle = D.skin; g.fillRect(ex - ew, ey - eh, ew * 2, eh * 2 * shut); }
    g.restore();
    g.lineCap = 'round'; g.strokeStyle = INK;
    const lidY = ey - eh + eh * 2 * shut;
    g.lineWidth = 9; g.beginPath(); g.moveTo(ex - ew - 6, lidY + 10); g.quadraticCurveTo(ex, lidY - 8, ex + ew + 4, lidY + 6); g.stroke();   // upper lash line
    g.lineWidth = 6; g.beginPath(); g.moveTo(ex + s * (ew + 2), lidY + 6); g.lineTo(ex + s * (ew + 14), lidY - 2); g.stroke();                   // lash flick
    g.lineWidth = 3; g.beginPath(); g.moveTo(ex - ew * 0.6, ey + eh - 2); g.quadraticCurveTo(ex, ey + eh + 4, ex + ew * 0.6, ey + eh - 2); g.stroke();
    // brows
    const by = ey - eh - 18, tilt = expr === 'scared' || expr === 'pained' || expr === 'cry' || expr === 'shock' ? -12 : expr === 'stern' || expr === 'stubborn' ? 12 : expr === 'creepy' ? 6 : 0;
    const inner = ex - s * 26, outer = ex + s * 26, innerY = by - tilt * -1 * (tilt < 0 ? -1 : -1) - (tilt < 0 ? 10 : tilt > 0 ? -10 : 0), outerY = by;
    g.lineWidth = 6; g.beginPath(); g.moveTo(inner, innerY); g.quadraticCurveTo(ex, Math.min(innerY, outerY) - 8, outer, outerY); g.stroke();
  }
  // nose and mouth
  g.lineWidth = 3.5; g.strokeStyle = D.shade === '#e8a890' ? '#b07060' : '#c08070'; g.beginPath(); g.moveTo(cx + 4, hy + 62); g.lineTo(cx - 2, hy + 72); g.stroke();
  g.strokeStyle = INK; g.fillStyle = '#7a2030'; g.lineWidth = 5;
  const my = hy + 98;
  if (expr === 'shock' || expr === 'scared') { g.beginPath(); g.ellipse(cx, my + 4, expr === 'shock' ? 16 : 11, expr === 'shock' ? 20 : 12, 0, 0, 7); g.fill(); g.stroke(); }
  else if (expr === 'creepy') { g.beginPath(); g.moveTo(cx - 34, my - 6); g.quadraticCurveTo(cx, my + 22, cx + 34, my - 6); g.quadraticCurveTo(cx, my + 8, cx - 34, my - 6); g.fillStyle = '#fff8f0'; g.fill(); g.stroke(); }
  else if (expr === 'pained' || expr === 'cry') { g.beginPath(); g.moveTo(cx - 18, my + 4); g.quadraticCurveTo(cx, my - 8, cx + 18, my + 4); g.stroke(); }
  else if (expr === 'stern' || expr === 'stubborn' || expr === 'wary') { g.beginPath(); g.moveTo(cx - 14, my); g.lineTo(cx + 14, my - 2); g.stroke(); }
  else { g.beginPath(); g.moveTo(cx - 12, my); g.quadraticCurveTo(cx, my + 6, cx + 12, my); g.stroke(); }
  if (expr === 'scared' || expr === 'shock' || expr === 'pained') { g.strokeStyle = '#e88a8a'; g.lineWidth = 3; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(cx + s * (54 + k * 9), hy + 66); g.lineTo(cx + s * (48 + k * 9), hy + 76); g.stroke(); } }
  if (o.tears || expr === 'cry') { const t = (o.tearT || 0) % 1; for (const s of [-1, 1]) { const x = cx + s * 46, y0 = hy + 58;
      g.fillStyle = 'rgba(150,205,245,0.9)'; g.beginPath(); g.moveTo(x - 7, y0); g.quadraticCurveTo(x - 9, y0 + 40, x, y0 + 46 + 20 * t); g.quadraticCurveTo(x + 9, y0 + 40, x + 7, y0); g.fill();
      g.beginPath(); g.ellipse(x, y0 + 60 + 50 * t, 6, 9, 0, 0, 7); g.fill(); } }
  if (expr === 'nervous') { g.fillStyle = 'rgba(170,215,245,0.95)'; g.beginPath(); g.moveTo(cx + 104, hy - 30); g.quadraticCurveTo(cx + 92, hy, cx + 104, hy + 6); g.quadraticCurveTo(cx + 116, hy, cx + 104, hy - 30); g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); }
  // ---- front hair: pointed fringe strands, side locks, a highlight band ----
  // hair: a tufted silhouette over the head (pointed locks swept to one side), then the fringe
  const tufts = D.style === 'spiky' ? 11 : 9, R0 = 132, sw = D.style === 'spiky' ? 0.18 : 0.08;
  g.beginPath(); g.moveTo(cx - 128, hy + 14);
  for (let k = 0; k <= tufts; k++) {
    const a = Math.PI * (1.02 + 0.96 * k / tufts), r = R0 + (k % 2 ? 0 : (D.style === 'spiky' ? 34 : 14)) * (0.6 + 0.4 * Math.sin(k * 1.7) ** 2);
    const x = cx + Math.cos(a + (k % 2 ? 0 : sw)) * r, y = hy - 20 + Math.sin(a + (k % 2 ? 0 : sw)) * r * 1.08;
    g.quadraticCurveTo(cx + Math.cos(a - 0.12) * (R0 + 8), hy - 20 + Math.sin(a - 0.12) * (R0 + 8) * 1.08, x, y);
  }
  g.lineTo(cx + 128, hy + 14);
  const fr = D.style === 'long' ? [[110, 30], [70, 66], [26, 46], [-14, 70], [-58, 50], [-100, 66]] : [[112, 22], [80, 74], [44, 52], [8, 84], [-28, 58], [-66, 80], [-106, 34]];
  for (let k = 0; k < fr.length; k++) { const [x, d] = fr[k], nx = k + 1 < fr.length ? fr[k + 1][0] : -128; g.quadraticCurveTo(cx + x + 6, hy - 70 + d * 0.5, cx + x - 8, hy - 66 + d); g.quadraticCurveTo(cx + (x + nx) / 2, hy - 60, cx + (x + nx) / 2 - 2, hy - 74); }
  g.closePath(); g.fillStyle = D.hair; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke();
  g.save(); g.clip(); g.fillStyle = D.hairD; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(cx + 70, hy - 40, 90, 120, 0.3, 0, 7); g.fill(); g.restore();   // cel shade on the hair
  for (const [x0, d] of [[-60, 40], [20, 50], [76, 36]]) { g.strokeStyle = D.hairD; g.lineWidth = 3.5; g.beginPath(); g.moveTo(cx + x0, hy - 120); g.quadraticCurveTo(cx + x0 - 8, hy - 90, cx + x0 - 4, hy - 66 + d * 0.4); g.stroke(); }   // strand lines
  if (D.style === 'long' || D.style === 'twin') for (const s of [-1, 1]) { P(g, [[cx + s * 108, hy - 40], [cx + s * 126, hy + 60, cx + s * 112, hy + 150], [cx + s * 92, hy + 120], [cx + s * 96, hy + 40]]); fillLine(g, D.hair, 5); }
  if (D.style === 'long') { g.fillStyle = D.hair; g.beginPath(); g.ellipse(cx, hy - 158, 46, 32, 0, 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); }
  g.strokeStyle = D.hairHi; g.lineWidth = 7; g.lineCap = 'round';
  for (const [x0, x1] of [[-80, -40], [-10, 30], [50, 86]]) { g.beginPath(); g.moveTo(cx + x0, hy - 112); g.quadraticCurveTo(cx + (x0 + x1) / 2, hy - 124, cx + x1, hy - 108); g.stroke(); }
  // ---- wet: drops on face and hair ----
  if (o.wet) { g.fillStyle = 'rgba(170,215,245,0.95)'; for (const [x, y] of [[-60, -40], [70, -20], [-20, 60], [40, 110], [-80, 120]]) { g.beginPath(); g.ellipse(cx + x, hy + y, 6, 9, 0, 0, 7); g.fill(); } }
  g.restore();
}
/** a card for the 3D scene (same shape as kit.actor) */
export const animeActor = (who, o, pos, extra = {}) => ({ key: 'an' + who + JSON.stringify(o), draw: (p) => animeFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
