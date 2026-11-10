// ---------- action shots: the incident in the line, drawn and animated as it happens ----------
// sh.act = {kind, who, reveal, dir}
//   kind: door_open | door_slam | knock | fight | chase | grab | fall | hide | lights_out
//   who:  'pet' | 'shadow' | 'double' | 'ghost'   (the other one in the fight / chase / behind the door)
//   reveal (door_open): 'pet_up' | 'pet_tall' | 'pet' | 'shadow' | 'eyes' | 'empty'
const STAGE = { wall: '#3a4160', wall2: '#2e3450', floor: '#262a40', trim: '#1c2034', door: '#4b5578', door2: '#404a6a', dark: '#07060b' };

function stageRoom(f) {                                   // flat drawn hallway wall, like the reference channel
  fillR(-200, -200, W + 400, H + 400, STAGE.wall);
  ctx.fillStyle = STAGE.wall2; for (let x = -40; x < W + 40; x += 150) ctx.fillRect(x, 0, 6, 1500);
  fillR(-200, 1500, W + 400, 700, STAGE.floor);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 5;
  for (let x = -400; x < W + 400; x += 160) { ctx.beginPath(); ctx.moveTo(540 + (x - 540) * 0.35, 1500); ctx.lineTo(x, 1920); ctx.stroke(); }
  fillR(-200, 1488, W + 400, 26, STAGE.trim);
}
function stageActor(o) { if (o.who === 'pet') pet(o); else guy(o); }
function otherActor(sh, f, base) {                        // the villain in the action, from the story cast
  const who = (sh.act || {}).who || 'shadow';
  if (who === 'pet') return Object.assign({ who, pose: 'up', expr: 'grin', name: P.petName }, base, { s: base.s * 1.45 });
  const k = who === 'double' ? Object.assign(LOOK(HERO), { outfit: OTHER.outfit }) : { kind: who === 'ghost' ? 'ghost' : 'shadow' };
  return Object.assign({ who, seed: 5, mouth: 'grin', eyeW: 1.2 }, k, base);
}

// a door seen head-on, hinged on its left edge; p = 0 shut .. 1 wide open (swinging toward us)
function bigDoor(x, y, w, h, p, behind) {
  sf(rr(x - 26, y - 26, w + 52, h + 26, 6), STAGE.trim, 8);       // frame
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  fillR(x, y, w, h, STAGE.dark);
  if (behind) behind(x, y, w, h, p);
  ctx.restore();
  if (p > 0.001) {                                         // light spilling out over the floor
    ctx.save(); ctx.globalAlpha = 0.18 * p; ctx.fillStyle = '#e8ecff';
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w * 1.6, 1920); ctx.lineTo(x - w * 0.3, 1920); ctx.fill(); ctx.restore();
  }
  const ang = p * Math.PI * 0.46, dw = w * Math.cos(ang), bulge = w * Math.sin(ang) * 0.16;
  const pts = [[x, y], [x + dw, y - bulge], [x + dw, y + h + bulge], [x, y + h]];
  sf(poly(pts), p > 0.5 ? STAGE.door2 : STAGE.door, 8);
  if (dw > 40) {                                           // panels and handle squash with the swing
    const k = dw / w;
    for (const [py, ph] of [[0.08, 0.36], [0.52, 0.4]]) sf(rr(x + 0.14 * w * k, y + py * h, 0.72 * w * k, ph * h, 6), STAGE.door2, 5);
    sf(ell(x + 0.86 * w * k, y + 0.55 * h, 16 * Math.max(0.4, k), 16), '#c8cbd8', 5);
  }
}

function actShot(sh, f) {
  const a = sh.act || {}, kind = a.kind, t = f - sh.a, dur = Math.max(1, sh.b - sh.a);
  const bt = sh.beat != null ? sh.beat : sh.a + Math.floor(dur * 0.35);
  stageRoom(f);
  if (kind === 'door_open' || kind === 'door_slam' || kind === 'knock') {
    let p;
    if (kind === 'door_open') p = f < bt ? 0.03 * Math.max(0, Math.sin(f * 0.5)) * (f > bt - 12 ? 1 : 0) : ss(clamp((f - bt) / 30));   // a creak, then it swings
    else if (kind === 'door_slam') p = f < bt ? lerp(0.85, 0.75, seg(f, sh.a, bt)) : Math.max(0, 0.75 * (1 - ei(clamp((f - bt) / 5)))) + (f - bt < 14 && f >= bt + 5 ? 0.03 * Math.sin((f - bt) * 2.4) : 0);
    else p = 0;
    const kn = kind === 'knock' && f >= bt - 6 ? (f - bt + 6) % 18 : 99;
    const shake = kn < 6 ? (rnd(f) - 0.5) * 26 : 0;
    ctx.save(); ctx.translate(shake, 0);
    bigDoor(300, 520, 480, 980, p, (x, y, w, h, pp) => {
      const rv = a.reveal || 'empty', show = clamp((pp - 0.25) / 0.5);
      if (rv === 'eyes' || rv === 'shadow') {
        if (rv === 'shadow') guy({ x: x + w / 2, y: y + h + 40, s: 0.95, kind: 'shadow', mouth: 'grin', alpha: show });
        else { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const sd of [-1, 1]) light(ctx, x + w / 2 + sd * 46, y + h * 0.45, 70, '#fff2c0', 0.9 * show); ctx.restore(); }
      } else if (rv.startsWith('pet')) {
        const pose = rv === 'pet_tall' ? 'tall' : rv === 'pet_up' ? 'up' : 'sit';
        pet({ x: x + w / 2, y: y + h - 6, s: pose === 'tall' ? 0.95 : pose === 'up' ? 1.25 : 1.3, pose, expr: pose === 'sit' ? 'stare' : 'grin', name: P.petName, alpha: show });
      }
    });
    ctx.restore();
    if (kn < 10) {                                          // KNOCK pops off the door with each hit
      ctx.save(); ctx.translate(560 + (rnd(Math.floor((f - bt + 6) / 18)) - 0.5) * 200, 900); ctx.scale(1 + kn * 0.03, 1 + kn * 0.03);
      ctx.globalAlpha = 1 - kn / 10; ctx.font = 'bold 110px sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.strokeText('KNOCK', 0, 0); ctx.fillStyle = '#ffe9a8'; ctx.fillText('KNOCK', 0, 0); ctx.restore();
    }
    if (kind === 'door_slam' && f >= bt && f < bt + 10) {    // dust puffs from the slam
      ctx.save(); ctx.globalAlpha = 1 - (f - bt) / 10; ctx.fillStyle = '#cfd3e6';
      for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(300 + rnd(i) * 480, 1500 - rnd(i + 3) * 40, 20 + (f - bt) * 4, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    const h = heroObj(sh, f, { x: 840, y: 1880, s: 0.62, look: -1, lookY: 0 });   // he watches it happen from the side
    if (h) { if (kind !== 'knock' && f > bt + 6) { h.tremble = 6; h.eyeW = 1.3; } guy(h); }
    return;
  }
  if (kind === 'fight') {                                  // a cartoon scuffle: a dust ball with arms and legs flying out
    const h = heroObj(sh, f, { x: 0, y: 0, s: 0.6 }) || {};
    const o = otherActor(sh, f, { x: 0, y: 0, s: 0.6 });
    const start = sh.a + 10, inFight = f >= start && f < sh.b - 18;
    if (!inFight) {                                        // before: they face off; after: he stumbles out
      const k = f < start ? 1 - seg(f, sh.a, start) : seg(f, sh.b - 18, sh.b);
      h.x = 380 - 160 * k; h.y = 1860; h.look = 1; if (f >= sh.b - 18) { h.tremble = 8; h.lean = -0.15; }
      o.x = 720 + 140 * k; o.y = 1860; o.look = -1; o.flip = true;
      stageActor(o); guy(h); return;
    }
    const cx = 540 + Math.sin(f * 0.21) * 60, cy = 1520 + Math.sin(f * 0.33) * 30;
    // limbs and faces popping out of the cloud, alternating
    const pop = Math.floor(f / 5) % 4;
    if (pop === 0) { h.x = cx - 230; h.y = cy + 360; h.lean = -0.4; h.armL = 2.6; h.armR = 1.8; guy(h); }
    if (pop === 2) { o.x = cx + 230; o.y = cy + 360; o.lean = 0.4; stageActor(o); }
    ctx.save();
    for (let i = 0; i < 9; i++) {                           // the dust ball
      const ang = i / 9 * 7 + f * 0.25, r = 150 + 40 * Math.sin(f * 0.7 + i);
      sf(ell(cx + Math.cos(ang) * r * 0.8, cy + Math.sin(ang) * r * 0.6, 150 + 30 * rnd(i + Math.floor(f / 3)), 120), '#d9dbe8', 7);
    }
    ctx.restore();
    for (let i = 0; i < 4; i++) {                           // arms and legs sticking out
      const ang = f * 0.4 + i * 1.6, len = 210 + 40 * Math.sin(f + i);
      ctx.save(); ctx.translate(cx + Math.cos(ang) * 200, cy + Math.sin(ang) * 150); ctx.rotate(ang);
      sf(rr(0, -26, len, 52, 26), i % 2 ? '#3d4f8f' : (o.who === 'pet' ? PET.fur : '#0b0710'), 6);
      sf(ell(len, 0, 40, 40), i % 2 ? SKIN : (o.who === 'pet' ? PET.light : '#0b0710'), 6); ctx.restore();
    }
    for (let i = 0; i < 3; i++) {                           // impact stars
      if ((f + i * 4) % 12 < 4) { const sx = cx - 250 + rnd(Math.floor(f / 12) + i) * 500, sy = cy - 250 + rnd(i + Math.floor(f / 12) * 3) * 300; sparkle(sx, sy, 60, 1); }
    }
    return;
  }
  if (kind === 'chase') {                                  // he runs, it runs after him: both cross the frame
    const p = clamp(t / dur), dir = a.dir === 'left' ? -1 : 1;
    const hx = 540 + dir * lerp(-180, 300, p), ox = hx - dir * lerp(460, 300, p);
    const h = heroObj(sh, f, { x: hx, y: 1860, s: 0.62, look: dir, lookY: 0 });
    const o = otherActor(sh, f, { x: ox, y: 1860, s: 0.62 });
    if (o.who === 'pet') { o.pose = a.reveal === 'pet_tall' ? 'tall' : 'run'; o.expr = 'grin'; o.s = o.pose === 'run' ? 0.95 : 0.85; o.flip = dir < 0; }
    else { const ph = f * 0.95; o.walk = ph; o.walkAmt = 1.35; o.lean = dir * 0.2; o.flip = dir < 0; }
    stageActor(o);
    if (h) {
      const ph = f * 0.95; h.walk = ph; h.walkAmt = 1.35; h.look = dir; h.lean = dir * 0.17; h.sweat = true;
      h.armL = 0.25 + 0.95 * Math.max(0, Math.sin(ph)); h.armR = 0.25 + 0.95 * Math.max(0, -Math.sin(ph));
      h.bob = (h.bob || 0) - Math.abs(Math.sin(ph)) * 26; h.eyeW = 1.3; guy(h);
    }
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.globalAlpha = 0.5; line(hx - dir * (160 + i * 50), 1400 + i * 70, hx - dir * (300 + i * 60), 1400 + i * 70, '#cfd3e6', 8); ctx.restore(); }   // speed lines
    return;
  }
  if (kind === 'grab') {                                   // a hand reaches out of the dark and takes his shoulder
    fillR(-200, -200, 360, H + 400, STAGE.dark);
    const h = heroObj(sh, f, { x: 640, y: 1860, s: 0.7, look: -1, lookY: 0 });
    const reach = f < bt ? ss(seg(f, sh.a, bt)) : 1;
    if (h) { if (f >= bt) { h.tremble = 10; h.eyeW = 1.4; h.hairUp = 0.9; } guy(h); }
    const hx = lerp(80, 470, reach), hy = 1860 - 520 * 0.7;
    const furry = (sh.act || {}).who === 'pet';
    ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 70;
    ctx.beginPath(); ctx.moveTo(-60, hy + 60); ctx.quadraticCurveTo(hx * 0.5, hy - 80, hx, hy); ctx.stroke();
    ctx.strokeStyle = furry ? PET.fur : '#0b0710'; ctx.lineWidth = 58; ctx.stroke();
    for (let i = 0; i < 4; i++) line(hx, hy, hx + 70 + i * 6, hy - 40 + i * 30, furry ? PET.fur : '#0b0710', 22);
    return;
  }
  if (kind === 'fall') {                                   // he trips: anticipation, the fall, the thud
    const h = heroObj(sh, f, { x: 540, y: 1860, s: 0.7, look: 1, lookY: 0 });
    if (!h) return;
    const k = f < bt ? 0 : ei(clamp((f - bt) / 10));
    if (f < bt) { h.lean = 0.1 * Math.sin(f * 0.6); h.armL = 1.4; h.armR = 1.2; }
    else { h.lean = lerp(0, 1.35, k); h.x = 480 + 90 * k; h.y = 1860 - 40 * k; h.armL = 2.4; h.armR = 2.1; h.eyeW = 1.3; }
    guy(h);
    if (f >= bt + 10 && f < bt + 22) { ctx.save(); ctx.globalAlpha = 1 - (f - bt - 10) / 12; ctx.fillStyle = '#cfd3e6'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(600 + rnd(i) * 400, 1860 - rnd(i + 5) * 60, 22 + (f - bt) * 3, 0, 7); ctx.fill(); } ctx.restore(); }
    return;
  }
  if (kind === 'hide') {                                   // he ducks behind something, peeking out, shaking
    const h = heroObj(sh, f, { x: 620, y: 1860 + 40, s: 0.7, look: -1, lookY: 0 });
    if (h) { h.tremble = 7; h.eyeW = 1.25; guy(h); }
    sf(rr(240, 1500, 760, 420, 30), '#5a4632', 9); sf(rr(240, 1500, 760, 60, 20), '#6e5640', 7);
    return;
  }
}

Object.assign(SCENES, {
  action: {
    frames: { wide: [540, 1170, 1.17], hero: [540, 1250, 1.25], pet: [540, 1250, 1.25] },
    ambient: '#9aa0c4',
    draw(f, sh) { actShot(sh, f); },
    lights(l, f, sh) { light(l, 540, 1100, 1100, '#ffffff', 0.85); if ((sh.act || {}).kind === 'door_open') light(l, 540, 1200, 500, '#dfe6ff', 0.5); },
  },
});
