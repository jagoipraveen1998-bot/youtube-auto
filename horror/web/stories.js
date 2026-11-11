// ---------- drawn story sets: everything a script names is DRAWN and acts (scene "drawn", sh.set + sh.v) ----------
// lift (mirror, floor display, doors) · dinner (table, chairs, family) · bus (seats, foggy window, driver's mirror)
// phone (call, photo) · behind (something behind you) · cupboard (doors, coats, eyes) · room (sofa, bed, counting)
const sP = (f, sh) => clamp((f - sh.a) / Math.max(1, sh.b - sh.a));
function sTxt(s, x, y, size, col = '#fff', stroke = true, align = 'center') {
  ctx.save(); ctx.font = `900 ${size}px "DejaVu Sans", sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (stroke) { ctx.lineWidth = size * 0.18; ctx.strokeStyle = INK; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.restore();
}
const FAM = {
  mum: { skin: '#b9733f', hair: '#2a1a1a', hairStyle: 'bun', outfit: 'tee', top: '#b5486a', seed: 3 },
  dad: { skin: '#a8663a', hair: '#1d1420', hairStyle: 'spiky', outfit: 'shirt', acc: { mustache: true }, seed: 4 },
  sis: { skin: '#c98d62', hair: '#2a1a1a', hairStyle: 'braids', outfit: 'tee', top: '#e8a23a', seed: 5 },
  kid: { skin: '#c98d62', hair: '#3a2416', hairStyle: 'mop', outfit: 'tee', top: '#5fb86a', seed: 6 },
  driver: { skin: '#a8663a', hair: '#1d1420', hairStyle: 'spiky', outfit: 'shirt', top: '#5a6f9a', acc: { cap: '#2a3a6a', mustache: true }, seed: 7 },
};
const fam = (who, o) => Object.assign({ eyeW: 1, pupil: 19, brow: 'flat', mouth: 'flat', blink: blinkAt(F, FAM[who].seed) }, FAM[who], o);
const SMILE = { brow: 'happy', mouth: 'smile', squint: 0.28 }, LAUGH = { brow: 'happy', mouth: 'laugh', squint: 0.55, lid: 0.2 };

const STORY = {
  // ---------------- the lift ----------------
  lift(f, sh) {
    const v = sh.v || 'fix', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt;
    fillR(-300, -300, W + 600, H + 600, '#565b78');
    sf(poly([[-300, -300], [150, 200], [150, 1500], [-300, 2100]]), '#454a66', 7); sf(poly([[W + 300, -300], [930, 200], [930, 1500], [W + 300, 2100]]), '#454a66', 7);
    fillR(-300, 1500, W + 600, 700, '#33364a'); line(150, 1500, 930, 1500, INK, 7);
    line(150, 1020, 930, 1020, '#8a90ac', 14);                                   // handrail
    const floors = sh.floors || [sh.floor ?? 5], fl = floors[Math.min(floors.length - 1, Math.floor(p * floors.length))];
    const drawDisplay = (x, y, w, h, n) => {
      sf(rr(x, y, w, h, 14), '#0c0c12', 7);
      const flick = n === 13 ? (rnd(Math.floor(f / 3)) > 0.3 ? 1 : 0.25) : 1;
      ctx.save(); ctx.globalAlpha = flick; sTxt(String(n), x + w / 2, y + h / 2 + 4, h * 0.72, n === 13 ? '#ff3b3b' : '#ffb347', false); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, x + w / 2, y + h / 2, w * 0.9, n === 13 ? '#ff2020' : '#ff9a30', 0.25 * flick); ctx.restore();
    };
    if (v === 'display') {                                                       // the number that should not exist
      drawDisplay(170, 520, 740, 460, fl);
      sf(rr(250, 1090, 580, 170, 12), '#c9b98a', 7); sTxt('FLOORS 1 – 12', 540, 1175, 74, '#3a2f1a', false);
      for (const sx of [280, 800]) sf(ell(sx, 1120, 10, 10), '#6a5a3a', 3);
      return;
    }
    if (v === 'face') { const h = heroObj(sh, f, { x: 540, y: 2420, s: 1.3, look: 0, lookY: 0 }); if (h) guy(h); return; }
    if (v === 'doors_close') {                                                   // from outside: the doors shut on him
      const h = heroObj(sh, f, { x: 540, y: 1780, s: 0.75, look: 0, lookY: 0 }); if (h) guy(h);
      const k = ss(seg(f, sh.a + 20, sh.b - 12)), dw = 420 * k;
      sf(rr(120, 260, dw, 1260, 4), '#8a90ac', 8); sf(rr(960 - dw, 260, dw, 1260, 4), '#8a90ac', 8);
      sf(rr(60, 200, 960, 60, 6), '#3a3d50', 7); sf(rr(60, 200, 60, 1340, 6), '#3a3d50', 7); sf(rr(960, 200, 60, 1340, 6), '#3a3d50', 7);
      drawDisplay(440, 60, 200, 120, fl);
      return;
    }
    drawDisplay(430, 240, 220, 120, fl);
    sf(rr(950, 820, 90, 320, 10), '#2c2f42', 6); for (let i = 0; i < 6; i++) sf(ell(995, 860 + i * 48, 14, 14), (v === 'smile' && on && i === 0) ? '#ff3b3b' : '#c8cbd8', 3);
    // the mirror, and the one inside it
    const mx = 235, my = 420, mw = 610, mh = 880;
    sf(rr(mx - 16, my - 16, mw + 32, mh + 32, 10), '#b8a26a', 7);
    ctx.save(); ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip();
    fillR(mx, my, mw, mh, v === 'dark' && on ? '#0c0d16' : '#7c84a6');
    sf(rr(mx + 60, my + 60, 240, mh, 4), v === 'dark' && on ? '#11121c' : '#9aa0bc', 6); sf(rr(mx + 310, my + 60, 240, mh, 4), v === 'dark' && on ? '#11121c' : '#9aa0bc', 6);   // the doors behind the reflection: shut
    if (v === 'smile') { sf(rr(mx + 20, my + 420, 70, 260, 8), '#2c2f42', 5); for (let i = 0; i < 5; i++) sf(ell(mx + 55, my + 455 + i * 46, 11, 11), on && i === 0 ? '#ff3b3b' : '#c8cbd8', 3); }
    const r = Object.assign({ x: 540, y: 1420, s: 0.66, seed: 1, eyeW: 1, pupil: 19, brow: 'flat', mouth: 'flat', blink: blinkAt(f, 9) }, LOOK(HERO));
    if (v === 'fix') r.armR = lerp(0.22, 2.75, ss(seg(f, sh.a + 8, sh.a + 26)));
    if (v === 'yawn' && on) { const k = ss(seg(f, bt, bt + 14)); Object.assign(r, { mouth: 'o', mo: 0.4 + 1.2 * k, lid: 0.85 * k, brow: 'up', armL: lerp(0.22, 2.55, k), armsFront: true, tilt: -0.08 * k }); }
    if (v === 'hand' && on) r.armL = lerp(0.22, 2.75, ss(seg(f, bt, bt + 12)));     // ITS right hand: the wrong side for a mirror
    if (v === 'doors') Object.assign(r, { brow: 'sly', mouth: 'smile' });
    if (v === 'smile') { const k = ss(seg(f, bt - 14, bt)); Object.assign(r, { mouth: 'grin', grin: k, brow: 'sly', eyeW: 1.1, pupil: 10, armL: lerp(0.22, 1.5, k) }); }
    if (v === 'dark' && on) Object.assign(r, { kind: 'shadow', mouth: 'grin', glow: '#ffffff' });
    guy(r);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(mx + 60, my); ctx.lineTo(mx + 200, my); ctx.lineTo(mx + 40, my + mh); ctx.lineTo(mx, my + mh); ctx.lineTo(mx, my + 300); ctx.fill(); ctx.restore();
    if (v === 'doors') {                                                         // behind HIM the doors are open: light pours in
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * ss(seg(f, sh.a, sh.a + 20));
      const g = ctx.createLinearGradient(0, 1920, 0, 1200); g.addColorStop(0, '#fff3c8'); g.addColorStop(1, 'rgba(255,243,200,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(140, 1920); ctx.lineTo(940, 1920); ctx.lineTo(760, 1200); ctx.lineTo(320, 1200); ctx.fill(); ctx.restore();
    }
    // him, seen from behind, facing the mirror
    const h = Object.assign({ x: 540, y: 2230, s: 0.92, seed: 1, turn: 0 }, LOOK(HERO));   // low in the frame: we look over his shoulder at the mirror
    if (v === 'fix') h.armR = lerp(0.22, 2.75, ss(seg(f, sh.a + 8, sh.a + 26)));
    if (v === 'hand') h.armR = lerp(0.22, 2.75, ss(seg(f, sh.a + 6, sh.a + 20)));
    if (['yawn', 'hand', 'smile', 'dark', 'doors'].includes(v) && on) { h.tremble = 5; h.hairUp = 0.6; h.sweat = true; }
    guy(h);
    if (v === 'dark' && on) { flash(0.72 * ss(seg(f, bt, bt + 6)), '#04040a'); }
  },

  // ---------------- family dinner ----------------
  dinner(f, sh) {
    const v = sh.v || 'four', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt, five = !['four', 'smile'].includes(v);
    fillR(-300, -300, W + 600, H + 600, '#6e4f44'); fillR(-300, 1560, W + 600, 700, '#3e2b26');
    sf(rr(120, 250, 300, 380, 8), '#1b2444', 8); sf(ell(330, 360, 44, 44), '#e8ecff', 0); line(270, 250, 270, 630, INK, 7); line(120, 440, 420, 440, INK, 7);
    line(700, -300, 700, 330, INK, 8); sf(poly([[600, 420], [800, 420], [760, 320], [640, 320]]), '#f0c95a', 7);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, 700, 520, 620, '#ffd98a', 0.4); ctx.restore();
    const xs = five ? [140, 335, 540, 745, 940] : [170, 410, 670, 910], who = five ? ['mum', 'dad', null, 'sis', 'hero'] : ['mum', 'dad', 'sis', 'hero'];
    xs.forEach((x, i) => {                                                       // chairs, then whoever sits in them
      const empty = who[i] === null, turn = empty && v === 'turn' ? ss(seg(f, bt, bt + 26)) : 0;
      ctx.save(); ctx.translate(x, 0);
      if (turn) ctx.transform(1 - 0.55 * turn, 0, 0, 1, 60 * turn, 0);
      sf(rr(-80, 930, 160, 420, 26), '#8a5a3a', 8); for (const dx of [-40, 0, 40]) line(dx, 960, dx, 1240, '#6e452a', 10);
      ctx.restore();
      if (empty && v === 'turn' && on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const sd of [-1, 1]) light(ctx, x + 60 + sd * 34, 1010, 46, '#dff0ff', 0.8 * ss(seg(f, bt + 10, bt + 30))); ctx.restore(); }
      if (!who[i]) return;
      if (who[i] === 'hero') { const h = heroObj(sh, f, { x, y: 1420, s: 0.5, noLegs: true, look: five ? -0.9 : -0.3, lookY: 0 }); if (h) guy(h); return; }
      const o = fam(who[i], { x, y: 1420, s: 0.5, noLegs: true, look: 0.2 });
      if (v === 'smile' || v === 'four') Object.assign(o, SMILE);
      if (five) Object.assign(o, SMILE, { look: who[i] === 'sis' ? 0.8 : 0 });
      if (v === 'pass' && who[i] === 'dad') { o.armR = lerp(0.3, 1.5, ss(seg(f, sh.a + 6, sh.a + 26))); o.armsFront = true; o.holdR = (hx, hy) => { sf(ell(hx + 20, hy + 10, 90, 44), '#f4efe4', 6); sf(ell(hx + 20, hy - 6, 70, 26), '#fbfbf2', 4); }; }
      if (v === 'sister' && who[i] === 'sis') Object.assign(o, LAUGH, { talk: true, look: 0.8, bob: Math.sin(f * 0.5) * 6 });
      guy(o);
    });
    sf(rr(40, 1290, 1000, 110, 20), '#a4683c', 9); sf(rr(40, 1380, 1000, 60, 10), '#8a5530', 8);
    for (const lx of [110, 930]) sf(rr(lx - 30, 1440, 60, 480, 8), '#7a4a28', 8);
    xs.forEach((x, i) => {                                                       // plates
      sf(ell(x, 1310, 82, 30), '#f4efe4', 6);
      const full = who[i] === null || true;
      if (full) sf(ell(x, 1298, 56, 18), who[i] === null ? '#fbfbf2' : '#fbfbf2', 4);
      if (who[i] === null && ['steam', 'spoon', 'sister', 'turn', 'pass', 'count'].includes(v)) steam(x, 1280, f, 190, 0.6);
      if (who[i] === null && (v === 'spoon' || v === 'sister' || v === 'turn')) {
        const k = v === 'spoon' ? ss(seg(f, bt - 6, bt + 22)) : 1, sy = 1300 - 190 * k + Math.sin(f * 0.2) * 8;
        ctx.save(); ctx.translate(x + 30, sy); ctx.rotate(-0.5 + Math.sin(f * 0.1) * 0.1); sf(ell(0, 0, 30, 22), '#d8dbe6', 5); sf(rr(-8, 16, 16, 120, 8), '#d8dbe6', 5); ctx.restore();
      }
    });
    if (v === 'count' && on) xs.forEach((x, i) => { const a = seg(f, bt + i * 7, bt + i * 7 + 6); if (a > 0) { ctx.save(); ctx.globalAlpha = a; sTxt(String(i + 1), x, 740, 110, i === 2 ? '#ff5a5a' : '#ffd23f'); ctx.restore(); } });
  },

  // ---------------- the last bus ----------------
  bus(f, sh) {
    const v = sh.v || 'ride', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt;
    fillR(-300, -300, W + 600, H + 600, '#3a4462');
    if (v === 'doors') {                                                         // the stop: doors fold open on nobody
      fillR(160, 300, 760, 1260, '#0e1326'); sf(ell(760, 520, 30, 30), '#ffe9a8', 0); ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, 760, 520, 360, '#ffd98a', 0.5); ctx.restore();
      line(760, 550, 760, 1500, '#4a5270', 14); sf(rr(300, 900, 180, 120, 10), '#2f6f4f', 6); sTxt('BUS', 390, 960, 60, '#f4efe4', false); line(390, 1020, 390, 1500, '#4a5270', 12);
      fillR(160, 1500, 760, 80, '#22273a');
      const k = ss(seg(f, sh.a + 6, sh.a + 30)), dw = 380 * (1 - 0.86 * k);
      sf(rr(160, 300, dw, 1260, 4), '#59648c', 8); sf(rr(920 - dw, 300, dw, 1260, 4), '#59648c', 8);
      sf(rr(100, 240, 880, 70, 8), '#262c44', 7); fillR(-300, 1560, W + 600, 700, '#262c44');
      return;
    }
    if (v === 'mirror') {                                                        // the driver's mirror: the back seat is not empty
      fillR(-300, -300, W + 600, H + 600, '#1c2236');
      sf(rr(110, 520, 860, 520, 40), '#0e1120', 12);
      ctx.save(); ctx.beginPath(); ctx.roundRect(140, 550, 800, 460, 26); ctx.clip();
      fillR(140, 550, 800, 460, '#46507a');
      for (let r = 0; r < 4; r++) { const y = 640 + r * 70, w = 520 - r * 90; sf(rr(540 - w / 2 - 40, y, w / 2 - 10, 130, 14), '#59648c', 5); sf(rr(540 + 50, y, w / 2 - 10, 130, 14), '#59648c', 5); }
      sf(rr(330, 600, 420, 150, 14), '#66709a', 5);
      const a = on && !sh.nofig ? ss(seg(f, bt, bt + 12)) : 0;
      if (a > 0) guy({ x: 540, y: 1010, s: 0.33, kind: 'shadow', mouth: 'grin', alpha: a, armR: 2.6 + Math.sin(f * 0.5) * 0.5, noLegs: true });
      ctx.restore();
      line(540, 380, 540, 520, '#0e1120', 22);
      const h = heroObj(sh, f, { x: 540, y: 2560, s: 1.2, look: 0, lookY: -0.9 }); if (h) guy(h);
      return;
    }
    if (v === 'driver') {
      fillR(120, 300, 840, 520, '#0e1326'); for (let i = 0; i < 4; i++) { const x = 900 - ((f * 9 + i * 260) % 1000); sf(ell(x, 420 + (i % 2) * 60, 16, 16), '#ffe9a8', 0); }
      sf(rr(90, 270, 900, 580, 20), 'rgba(0,0,0,0)', 12);
      const d = fam('driver', { x: 420, y: 1900, s: 0.95, look: 0.9, talk: true, mouthOpen: 0.5 + 0.5 * Math.sin(f * 0.8), brow: 'raise', armR: 1.5 });
      guy(d);
      ctx.save(); ctx.translate(800, 1320); ctx.rotate(f * 0.01); ctx.strokeStyle = INK; ctx.lineWidth = 40; ctx.beginPath(); ctx.arc(0, 0, 190, 0, 7); ctx.stroke(); ctx.strokeStyle = '#2a2d3e'; ctx.lineWidth = 26; ctx.stroke(); line(-190, 0, 190, 0, '#2a2d3e', 22); ctx.restore();
      return;
    }
    if (v === 'front') {
      fillR(120, 260, 840, 480, '#0e1326'); for (let i = 0; i < 4; i++) { const x = 900 - ((f * 9 + i * 260) % 1000); sf(ell(x, 380 + (i % 2) * 60, 16, 16), '#ffe9a8', 0); }
      const h = heroObj(sh, f, { x: 540, y: 2380, s: 1.25, look: 0, lookY: 0 }); if (h) { h.tremble = 6; guy(h); }
      const k = 1 + 0.25 * Math.max(0, Math.sin(f * 0.55)); ctx.save(); ctx.translate(820, 1560); ctx.scale(k, k);
      const hp = new Path2D(); hp.moveTo(0, 50); hp.bezierCurveTo(-110, -30, -50, -110, 0, -40); hp.bezierCurveTo(50, -110, 110, -30, 0, 50); sf(hp, '#ff4d6a', 7); ctx.restore();
      return;
    }
    // side view: the back bench, two seats, the window above them
    sf(rr(70, 360, 940, 470, 30), '#0e1326', 10);
    ctx.save(); ctx.beginPath(); ctx.rect(80, 370, 920, 450); ctx.clip();
    for (let i = 0; i < 5; i++) { const x = 1000 - ((f * 10 + i * 230) % 1150); sf(ell(x, 470 + (i % 3) * 50, 18, 18), '#ffe9a8', 0); ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, x, 470 + (i % 3) * 50, 120, '#ffd98a', 0.35); ctx.restore(); }
    const fog = v === 'fog' ? ss(seg(f, sh.a + 8, sh.b - 20)) : v === 'smiley' ? 1 : 0;
    if (fog > 0) {
      ctx.save(); ctx.globalAlpha = 0.6 * fog; ctx.fillStyle = '#cfd8ea'; ctx.beginPath(); ctx.ellipse(750, 600, 240, 190, 0, 0, 7); ctx.fill(); ctx.restore();
      if (v === 'smiley') {                                                      // a finger nobody can see draws it
        const k = ss(seg(f, sh.a + 10, sh.b - 24)); ctx.strokeStyle = '#141a30'; ctx.lineWidth = 16; ctx.lineCap = 'round';
        const arc = (cx, cy, r, a0, a1, t) => { if (t <= 0) return; ctx.beginPath(); ctx.arc(cx, cy, r, a0, a0 + (a1 - a0) * clamp(t)); ctx.stroke(); };
        arc(700, 560, 14, 0, 6.3, k * 5); arc(800, 560, 14, 0, 6.3, k * 5 - 1); arc(750, 600, 110, 0.35, Math.PI - 0.35, k * 5 - 2); arc(750, 600, 160, 0, 6.3, (k * 5 - 3) / 2);
      }
    }
    ctx.restore();
    line(540, 360, 540, 830, '#262c44', 16);
    for (const [x, dent] of [[150, 0], [570, (v === 'sink' && on) || ['fog', 'smiley'].includes(v) ? (v === 'sink' ? ss(seg(f, bt, bt + 14)) : 1) : 0]]) {
      sf(rr(x, 960, 360, 560, 40), '#5a6f9a', 9); sf(rr(x + 30, 1000, 300, 200, 26), '#66709a', 5);
      if (x === 150) { const h = heroObj(sh, f, { x: 330, y: 1650, s: 0.62, noLegs: true, look: (v === 'ride') ? 0 : 0.9, lookY: 0 }); if (h) { h.acc = Object.assign({}, h.acc || {}, { earbud: true }); guy(h); } }
      const c = new Path2D(); c.moveTo(x - 10, 1470); c.quadraticCurveTo(x + 180, 1440 + 70 * dent, x + 370, 1470); c.lineTo(x + 370, 1600); c.lineTo(x - 10, 1600); c.closePath(); sf(c, '#4a5d86', 9);
      if (dent > 0 && v === 'sink') for (const sd of [-1, 1]) { ctx.save(); ctx.globalAlpha = 1 - seg(f, bt + 6, bt + 30); line(x + 180 + sd * 150, 1400, x + 180 + sd * 190, 1360, '#f4efe4', 8); ctx.restore(); }
    }
    fillR(-300, 1600, W + 600, 700, '#262c44');
  },

  // ---------------- the phone ----------------
  phone(f, sh) {
    const v = sh.v || 'call', bt = sh.beat ?? sh.a + 30, on = f >= bt;
    fillR(-300, -300, W + 600, H + 600, '#0d0f1a');
    const sx = 170, sy = 230, sw = 740, sh2 = 1460, buzz = v !== 'photo' || f < sh.a + 14 ? Math.sin(f * 2.2) * 6 : 0;
    ctx.save(); ctx.translate(buzz, 0);
    sf(rr(sx - 26, sy - 26, sw + 52, sh2 + 52, 80), '#1c1f2e', 10);
    ctx.save(); ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh2, 56); ctx.clip();
    if (v === 'photo') {                                                         // the photo: him at the window, from INSIDE the room
      fillR(sx, sy, sw, sh2, '#2a2f48'); fillR(sx, sy + 1100, sw, 400, '#1c2034');
      sf(rr(sx + 170, sy + 180, 400, 620, 8), '#1b2a55', 8); sf(ell(sx + 450, sy + 320, 50, 50), '#e8ecff', 0);
      for (const cx of [sx + 110, sx + 510]) sf(rr(cx, sy + 130, 130, 760, 20), '#7a3a48', 7);
      guy(Object.assign({ x: sx + 370, y: sy + 1330, s: 0.62, turn: 0, seed: 1 }, LOOK(HERO)));
      const g = ctx.createRadialGradient(540, 960, 200, 540, 960, 900); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.7)'); ctx.fillStyle = g; ctx.fillRect(sx, sy, sw, sh2);
      sTxt('just now', sx + sw / 2, sy + 70, 44, '#e8ecff', false);
    } else {
      fillR(sx, sy, sw, sh2, '#141a30');
      sTxt('3:00', 540, sy + 150, 120, '#e8ecff', false);
      sf(ell(540, sy + 520, 130, 130), '#39406a', 0); sTxt('?', 540, sy + 528, 170, '#aab2d8', false);
      sTxt('Unknown number', 540, sy + 760, 62, '#ffffff', false);
      if (v === 'call') { for (let i = 0; i < 3; i++) { const r = 150 + ((f * 4 + i * 60) % 180); ctx.save(); ctx.globalAlpha = 1 - (r - 150) / 180; ctx.strokeStyle = '#7fe3ff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(540, sy + 520, r, 0, 7); ctx.stroke(); ctx.restore(); }
        sf(ell(350, sy + 1200, 86, 86), '#e8453c', 0); sf(ell(730, sy + 1200, 86, 86), '#3ccf72', 0); }
      else { ctx.strokeStyle = '#7fe3ff'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); for (let x = 250; x <= 830; x += 20) { const a = 20 + 110 * noise1(x * 0.07 + f * 0.35) * (on || v === 'voice' ? 1 : 0.2); ctx.moveTo(x, sy + 1050 - a); ctx.lineTo(x, sy + 1050 + a); } ctx.stroke();
        sTxt('00:0' + (1 + Math.floor((f - sh.a) / 30)), 540, sy + 880, 54, '#aab2d8', false); }
    }
    ctx.restore(); ctx.restore();
  },

  // ---------------- just his face, wherever he is ----------------
  face(f, sh) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, sh.bg || '#39406a'); g.addColorStop(1, '#14172a');
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
    const h = heroObj(sh, f, { x: 540, y: 2440, s: 1.32, look: 0, lookY: sh.down ? 1 : 0 }); if (h) guy(h);
  },

  // ---------------- something behind you ----------------
  behind(f, sh) {
    const bt = sh.beat ?? sh.a + 20, a = ss(seg(f, bt - 10, bt + 16));
    fillR(-300, -300, W + 600, H + 600, '#1a1d30'); sf(rr(330, 260, 420, 900, 6), '#0a0b14', 8);
    guy({ x: 600, y: 2100, s: 1.5, kind: 'shadow', mouth: 'grin', alpha: a, lean: Math.sin(f * 0.05) * 0.03 });
    for (let i = 0; i < 3; i++) { const t = ((f * 0.02 + i / 3) % 1); ctx.save(); ctx.globalAlpha = 0.25 * (1 - t) * a; ctx.fillStyle = '#dfe8ff'; ctx.beginPath(); ctx.ellipse(470 - t * 160, 1210 - t * 60, 40 + t * 70, 26 + t * 40, 0, 0, 7); ctx.fill(); ctx.restore(); }   // its breath
    const h = heroObj(sh, f, { x: 430, y: 2520, s: 1.2, look: 0, lookY: 0 }); if (h) guy(h);
  },

  // ---------------- the cupboard / hide and seek ----------------
  cupboard(f, sh) {
    const v = sh.v || 'closed', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt;
    fillR(-300, -300, W + 600, H + 600, '#4a5173'); fillR(-300, 1560, W + 600, 700, '#2c3048'); fillR(-300, 1548, W + 600, 24, '#1f2236');
    let open = v === 'open' ? ss(seg(f, sh.a + 6, sh.a + 26)) : v === 'close' ? 1 - ss(seg(f, bt - 4, bt + 14)) : 0;
    const x0 = 250, y0 = 360, w = 580, h = 1190;
    sf(rr(x0 - 24, y0 - 40, w + 48, h + 40, 12), '#5a3d2a', 9);
    fillR(x0, y0, w, h, '#0c0a10');
    if (open > 0.05) {                                                           // inside: just coats
      line(x0 + 10, y0 + 90, x0 + w - 10, y0 + 90, '#8a8fa8', 10);
      [['#7a3a48', 60], ['#3d5a8f', 190], ['#5f8a5a', 320], ['#b89a4a', 450]].forEach(([c, dx], i) => { const sw = Math.sin(f * 0.05 + i) * 0.03; ctx.save(); ctx.translate(x0 + dx + 40, y0 + 90); ctx.rotate(sw); sf(poly([[-60, 40], [60, 40], [80, 620], [-80, 620]]), c, 6); line(0, 0, 0, 40, '#8a8fa8', 6); ctx.restore(); });
    }
    if (v === 'count' && on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const [ey, s] of [[720, 1], [980, 0.8]]) for (const sd of [-1, 1]) light(ctx, x0 + w / 2 + sd * 28 * s, ey, 30 * s, '#fff2c0', 1); ctx.restore(); }
    const gap = v === 'count' ? 0.24 : open, dw = (w / 2) * (1 - 0.82 * gap);
    sf(rr(x0, y0, dw, h, 4), '#7a5236', 8); sf(rr(x0 + w - dw, y0, dw, h, 4), '#7a5236', 8);
    if (dw > 120) { for (const dx of [x0 + 26, x0 + w - dw + 26]) sf(rr(dx, y0 + 40, dw - 52, h - 80, 8), '#6b472e', 5); sf(ell(x0 + dw - 34, y0 + h / 2, 16, 16), '#d8c27a', 5); sf(ell(x0 + w - dw + 34, y0 + h / 2, 16, 16), '#d8c27a', 5); }
    if (v === 'close' && open > 0.05 && open < 0.98) { for (let i = 0; i < 4; i++) sf(rr(x0 + w - dw - 14, y0 + 520 + i * 34, 60, 24, 12), '#dfe8f2', 5); }   // pale fingers pulling it shut
    if (v === 'count' && on) ['ONE.', 'TWO.', 'THREE.'].forEach((t, i) => { const k0 = bt + i * 22; if (f >= k0) { const a = seg(f, k0, k0 + 6); ctx.save(); ctx.globalAlpha = a; sTxt(t, 210 + i * 330, 240, 84, '#ffd23f'); ctx.restore(); } });
    if (v === 'point') { const k = fam('kid', { x: 190, y: 1880, s: 0.5, look: 0.9, armR: 1.55, brow: 'happy', mouth: 'smile' }); guy(k); }
    if (v !== 'count' || true) { const hh = heroObj(sh, f, { x: v === 'point' ? 920 : v === 'gone' ? 540 : 900, y: 1900, s: v === 'gone' ? 0.8 : 0.66, look: v === 'gone' ? Math.sin(f * 0.12) : -0.8, lookY: 0, turn: v === 'open' ? 0 : 1 }); if (hh && v !== 'close') guy(hh); }
    if (v === 'gone') { sf(ell(250, 1840, 50, 50), '#e8453c', 6); sf(rr(700, 1800, 120, 80, 12), '#5fb86a', 6); }      // his toys, left on the floor
  },
  room(f, sh) {
    const v = sh.v || 'babysit', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt;
    fillR(-300, -300, W + 600, H + 600, '#4a5173'); fillR(-300, 1560, W + 600, 700, '#2c3048'); fillR(-300, 1548, W + 600, 24, '#1f2236');
    sf(rr(650, 300, 300, 240, 8), '#f0c95a', 7); ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, 800, 420, 480, '#ffd98a', 0.3); ctx.restore();
    if (v === 'underbed') {
      fillR(150, 1290, 780, 270, '#07060b');
      ctx.save(); ctx.beginPath(); ctx.rect(150, 1290, 780, 270); ctx.clip();
      guy(fam('kid', Object.assign({ x: 540, y: 1770, s: 0.43, noLegs: true, bob: Math.sin(f * 0.6) * 5 }, LAUGH))); ctx.restore();
      sf(rr(110, 1030, 860, 270, 40), '#c7ccdf', 9); sf(rr(110, 1150, 860, 150, 30), '#5a6f9a', 8); sf(rr(140, 960, 260, 130, 40), '#f4efe4', 7);
      for (const lx of [130, 900]) sf(rr(lx, 1300, 50, 260, 8), '#5a3d2a', 7);
      return;
    }
    sf(rr(90, 1150, 620, 300, 60), '#7a3a48', 9); sf(rr(60, 1300, 680, 260, 50), '#8a4656', 9);     // sofa
    if (v === 'babysit') { guy(fam('kid', Object.assign({ x: 330, y: 1860 - Math.abs(Math.sin(f * 0.3)) * 60, s: 0.48, armL: 2.6, armR: 2.6 }, LAUGH))); const h = heroObj(sh, f, { x: 780, y: 1900, s: 0.72, look: -0.8, lookY: 0.3 }); if (h) guy(h); }
    if (v === 'count') {
      const h = heroObj(sh, f, { x: 540, y: 1900, s: 0.85, look: 0, lookY: 0 }); if (h) { h.armL = 2.85; h.armR = 2.85; h.armsFront = true; h.lid = 1; guy(h); }
      const n = Math.min(10, 1 + Math.floor(p * 10.5)); sTxt(String(n), 540, 520, 300, '#ffd23f');
    }
    if (v === 'empty') { const h = heroObj(sh, f, { x: 540, y: 1900, s: 0.8, look: Math.sin(f * 0.12), lookY: 0 }); if (h) guy(h); }
  },
};

Object.assign(SCENES, {
  drawn: {
    frames: { wide: [540, 960, 1.0], hero: [540, 1000, 1.1] },
    ambient: '#dcdff0',
    draw(f, sh) { (STORY[sh.set] || STORY.room)(f, sh); },
    lights(l, f, sh) { light(l, 540, 900, 1300, '#ffffff', 0.85); },
  },
});
