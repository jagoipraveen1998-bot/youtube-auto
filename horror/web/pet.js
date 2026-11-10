// ---------- the pet: a cartoon dog drawn in the same ink style as our people ----------
// pet({x, y, s, pose, expr, look, tilt, wag, walk, sil, glow, name, fur, alpha})
//   pose: sit | stand | walk | run | up (on two legs) | tall (stretched, wrong) | back (walking away)
//   expr: happy | calm | stare | grin | sad | sniff
//   sil:  true = black silhouette with glowing eyes (moonlight, doorway)
const PET = { fur: '#7b4a2b', fur2: '#5e3720', light: '#c99566', nose: '#1a1016', collar: '#c8323a', tag: '#e9c246' };

function petEye(x, y, r, o, sd) {
  const e = o.expr || 'calm';
  if (o.sil) {                                            // glowing eyes in the dark
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    light(ctx, x, y, r * 3.2, o.glow || '#fff3c4', 0.85); ctx.restore();
    sf(ell(x, y, r * 0.55, r * 0.42), '#fffbe8', 0); return;
  }
  if (e === 'happy') {                                    // closed happy arcs
    ctx.strokeStyle = INK; ctx.lineWidth = L(7); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y + r * 0.35, r * 0.75, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); return;
  }
  const big = e === 'stare' || e === 'grin' ? 1.25 : 1;
  sf(ell(x, y, r * big, r * big * 1.08), '#fbf6ee', 5.5);
  const pr = e === 'stare' || e === 'grin' ? r * 0.28 : r * 0.62;
  const lx = (o.look || 0) * r * 0.35, ly = e === 'sad' ? r * 0.25 : 0;
  sf(ell(x + lx, y + ly, pr, pr * 1.05), '#140c12', 0);
  if (e !== 'stare' && e !== 'grin') sf(ell(x + lx - pr * 0.35, y + ly - pr * 0.4, pr * 0.3, pr * 0.3), '#ffffff', 0);
  if (e === 'sad') line(x - r * sd * 0.9, y - r * 1.25, x + r * sd * 0.6, y - r * 1.05, INK, 6);
  if (e === 'stare' || e === 'grin') line(x - r * sd * 1.0, y - r * 1.05, x + r * sd * 0.7, y - r * 1.45, INK, 6);   // brows down: something is wrong
}

// the head, centred on (0,0), about 300 units wide
function petHead(o, front = true) {
  const sil = o.sil, F1 = sil ? '#07050a' : (o.fur || PET.fur), F2 = sil ? '#07050a' : PET.fur2, LI = sil ? '#07050a' : PET.light;
  const lw = sil ? 0 : 6.5, flap = Math.sin(F * 0.18) * 0.04 * (o.walk ? 2 : 1);
  if (front) {
    for (const sd of [-1, 1]) {                           // floppy ears hang beside the face
      ctx.save(); ctx.translate(sd * 128, -40); ctx.rotate(sd * (0.18 + flap));
      sf(ell(0, 70, 62, 128), F2, lw); ctx.restore();
    }
    sf(ell(0, 0, 150, 140), F1, lw);                      // skull
    sf(ell(-6, -70, 60, 34, -0.2), F1, 0);                 // scruffy tuft
    if (!sil) { ctx.strokeStyle = INK; ctx.lineWidth = L(5); ctx.beginPath(); ctx.moveTo(-50, -128); ctx.lineTo(-30, -150); ctx.lineTo(-12, -128); ctx.lineTo(8, -152); ctx.lineTo(24, -126); ctx.stroke(); }
    sf(ell(0, 62, 92, 70), LI, lw);                        // muzzle
    petEye(-58, -22, 30, o, -1); petEye(58, -22, 30, o, 1);
    if (!sil) {
      sf(ell(0, 26, 34, 24), PET.nose, 5);
      sf(ell(-10, 18, 10, 6), '#5a4a58', 0);
      const e = o.expr || 'calm';
      ctx.strokeStyle = INK; ctx.lineWidth = L(6); ctx.lineCap = 'round'; ctx.beginPath();
      if (e === 'grin') {                                 // far too wide, far too many teeth
        const p = new Path2D(); p.moveTo(-96, 70); p.quadraticCurveTo(0, 150, 96, 70); p.quadraticCurveTo(0, 100, -96, 70);
        sf(p, '#2a0d14', 5.5);
        ctx.fillStyle = '#fbf6ee'; for (let i = -4; i <= 4; i++) { const tx = i * 20; ctx.beginPath(); ctx.moveTo(tx - 9, 78 + Math.abs(i) * -1); ctx.lineTo(tx + 9, 78); ctx.lineTo(tx, 96 - Math.abs(i) * 2); ctx.fill(); }
      } else if (e === 'sniff' || o.talk && Math.sin(F * 0.9) > 0) {
        ctx.moveTo(0, 50); ctx.lineTo(0, 66); ctx.stroke(); sf(ell(0, 84, 22, 16), '#2a0d14', 5);
      } else {
        ctx.moveTo(0, 50); ctx.lineTo(0, 68); ctx.moveTo(-34, 74); ctx.quadraticCurveTo(-16, 92, 0, 68); ctx.quadraticCurveTo(16, 92, 34, 74); ctx.stroke();
        if (e === 'happy') { const p = new Path2D(); p.moveTo(-10, 82); p.quadraticCurveTo(0, 128, 12, 84); sf(p, '#e2687a', 5); }
      }
    }
  } else {                                                // side head (facing +x)
    sf(ell(-20, 0, 120, 110), F1, lw);
    sf(ell(85, 30, 80, 52), LI, lw);
    sf(ell(150, 18, 22, 18), sil ? '#07050a' : PET.nose, sil ? 0 : 5);
    ctx.save(); ctx.translate(-60, -30); ctx.rotate(0.25 + flap * 2); sf(ell(0, 70, 48, 110), F2, lw); ctx.restore();
    petEye(40, -24, 24, o, 1);
    if (!sil) { ctx.strokeStyle = INK; ctx.lineWidth = L(6); ctx.beginPath(); ctx.moveTo(90, 66); ctx.quadraticCurveTo(110, 74, 140, 58); ctx.stroke(); }
  }
}

function petCollar(y, w, o) {
  if (o.sil) return;
  sf(rr(-w, y - 20, 2 * w, 40, 18), PET.collar, 5.5);
  sf(ell(0, y + 46, 30, 30), PET.tag, 5);
  if (o.name) { ctx.fillStyle = '#6a4a14'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(o.name.toUpperCase().slice(0, 6), 0, y + 52); }
}

function pet(o) {
  const pose = o.pose || 'sit', sil = o.sil;
  const F1 = sil ? '#07050a' : (o.fur || PET.fur), F2 = sil ? '#07050a' : PET.fur2, LI = sil ? '#07050a' : PET.light, lw = sil ? 0 : 6.5;
  ctx.save();
  if (o.alpha != null) ctx.globalAlpha = clamp(o.alpha);
  ctx.translate(o.x, o.y); ctx.scale(o.s * (o.flip ? -1 : 1), o.s);
  const br = 1 + 0.015 * Math.sin(F * 0.15);
  const wag = (o.wag ?? (o.expr === 'happy' ? 1 : 0.3)) * Math.sin(F * 0.7);

  if (pose === 'sit') {                                   // front, sitting: the "good boy" pose
    ctx.scale(1, br);
    ctx.save(); ctx.translate(120, -90); ctx.rotate(-0.6 + wag * 0.5); sf(rr(-18, -130, 36, 140, 18), F2, lw); ctx.restore();   // tail
    for (const sd of [-1, 1]) sf(ell(sd * 110, -60, 70, 66), F1, lw);                     // haunches
    sf(ell(0, -170, 125, 170), F1, lw);                                                   // body
    if (!sil) sf(ell(0, -150, 62, 110), LI, 0);                                           // chest
    for (const sd of [-1, 1]) { sf(rr(sd * 48 - 24, -170, 48, 165, 22), F1, lw); sf(ell(sd * 48, -8, 40, 22), LI, lw); }   // front legs
    petCollar(-268, 92, o);
    ctx.save(); ctx.translate(0, -420); ctx.rotate(o.tilt || 0); petHead(o, true); ctx.restore();
  } else if (pose === 'up' || pose === 'tall') {          // standing on two legs, like a person. wrong.
    const tall = pose === 'tall', k = tall ? 1.9 : 1;
    if (tall) ctx.scale(0.82, 1);
    const sway = Math.sin(F * 0.05) * 0.03;
    ctx.rotate(sway);
    for (const sd of [-1, 1]) { sf(rr(sd * 50 - 30, -260 * k, 60, 255 * k, 28), F1, lw); sf(ell(sd * 58, -10, 52, 24), LI, lw); }   // hind legs
    ctx.save(); ctx.translate(90, -250 * k); ctx.rotate(0.9 + wag * 0.25); sf(rr(-16, -120, 32, 130, 16), F2, lw); ctx.restore();
    sf(ell(0, -360 * k, 110, 150 * k), F1, lw);                                             // long body
    if (!sil) sf(ell(0, -350 * k, 52, 100 * k), LI, 0);
    for (const sd of [-1, 1]) {                                                            // front legs hang like arms
      const len = tall ? 420 : 210, sw = Math.sin(F * 0.07 + sd) * 0.05;
      ctx.save(); ctx.translate(sd * 92, -470 * k); ctx.rotate(sd * 0.12 + sw);
      sf(rr(-22, 0, 44, len, 20), F1, lw); sf(ell(0, len, 32, 22), LI, lw); ctx.restore();
    }
    petCollar(-500 * k + 30, 84, o);
    ctx.save(); ctx.translate(0, -500 * k - 120); ctx.rotate(o.tilt || 0); petHead(o, true); ctx.restore();
  } else {                                                // side view on four legs: stand / walk / run / back
    const run = pose === 'run', moving = pose === 'walk' || run || pose === 'back';
    const ph = moving ? F * (run ? 0.75 : 0.35) : 0, amp = run ? 0.75 : moving ? 0.38 : 0;
    const bob = moving ? -Math.abs(Math.sin(ph)) * (run ? 34 : 10) : 0;
    ctx.translate(0, bob);
    if (run) ctx.rotate(Math.sin(ph) * 0.06);
    const leg = (x, p, back) => {                         // one leg swinging about its hip
      ctx.save(); ctx.translate(x, -200); ctx.rotate(Math.sin(p) * amp);
      sf(rr(-24, 0, 48, 190, 22), back ? F2 : F1, lw); sf(ell(10, 192, 36, 20), back ? F2 : LI, lw); ctx.restore();
    };
    leg(-150, ph + Math.PI, true); leg(130, ph, true);                                    // far legs
    ctx.save(); ctx.translate(-215, -270); ctx.rotate(-0.9 + wag * 0.45 - (run ? 0.5 : 0)); sf(rr(-16, -130, 32, 140, 16), F2, lw); ctx.restore();   // tail
    sf(ell(0, -260, 230, 105), F1, lw);                                                   // body
    if (!sil) sf(ell(40, -220, 140, 50), LI, 0);
    leg(-120, ph, false); leg(160, ph + Math.PI, false);                                  // near legs
    if (pose === 'back') {                                // walking away: we see his back and tail, head turned off
      ctx.save(); ctx.translate(200, -380); petHead(Object.assign({}, o, { sil: true, glow: 'rgba(0,0,0,0)' }), false); ctx.restore();
    } else {
      if (!sil) { ctx.save(); ctx.translate(170, -330); ctx.rotate(0.5); sf(rr(-70, -18, 140, 36, 16), PET.collar, 5); ctx.restore(); }
      ctx.save(); ctx.translate(250, -400); ctx.rotate((o.tilt || 0) + (run ? 0.15 : 0)); petHead(o, false); ctx.restore();
    }
  }
  ctx.restore();
}

// ---------- inserts: one object filling the frame, exactly what the line names ----------
function insertTag(name, f) {                             // the collar tag, close: "same collar"
  fillR(-200, -200, W + 400, H + 400, '#3b2416');
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 6;
  for (let i = 0; i < 160; i++) { const x = rnd(i) * W, y = rnd(i + 99) * H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y + 60); ctx.stroke(); }
  sf(rr(-40, H * 0.36, W + 80, 120, 50), PET.collar, 8);
  sf(ell(W / 2, H * 0.36 + 60, 28, 28), '#b8b8c0', 7);
  const sw = Math.sin(f * 0.06) * 0.06;
  ctx.save(); ctx.translate(W / 2, H * 0.36 + 80); ctx.rotate(sw);
  sf(ell(0, 190, 170, 170), PET.tag, 9); sf(ell(0, 190, 140, 140), '#f3d468', 0);
  ctx.fillStyle = '#6a4a14'; ctx.font = 'bold 76px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText((name || 'BUDDY').toUpperCase(), 0, 196); ctx.restore();
}
function insertBowl(name, f, full) {                      // his food bowl, untouched
  fillR(-200, -200, W + 400, H + 400, '#2a2f44');
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 4;
  for (let x = 0; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 120) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  sf(ell(W / 2, H * 0.6, 400, 170), '#b0353c', 9);
  sf(ell(W / 2, H * 0.58, 330, 120), '#6e1e24', 7);
  if (full !== false) { sf(ell(W / 2, H * 0.58, 290, 96), '#7a4a26', 0); for (let i = 0; i < 26; i++) sf(ell(W / 2 - 230 + rnd(i) * 460, H * 0.58 - 60 + rnd(i + 7) * 120, 28, 18), '#9a6234', 4); }
  ctx.fillStyle = '#f2e6d8'; ctx.font = 'bold 60px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText((name || 'BUDDY').toUpperCase(), W / 2, H * 0.6 + 120);
}
function insertPoster(name, f) {                          // MISSING poster with his photo
  fillR(-200, -200, W + 400, H + 400, '#1d1d24');
  ctx.save(); ctx.translate(W / 2, H * 0.47); ctx.rotate(-0.03 + Math.sin(f * 0.02) * 0.01);
  sf(rr(-380, -520, 760, 1040, 10), '#eeeae2', 8);
  ctx.fillStyle = '#1a1416'; ctx.textAlign = 'center'; ctx.font = 'bold 120px sans-serif'; ctx.fillText('MISSING', 0, -380);
  sf(rr(-280, -320, 560, 520, 6), '#9a9aa2', 6);
  ctx.save(); ctx.beginPath(); ctx.rect(-280, -320, 560, 520); ctx.clip();
  ctx.filter = 'grayscale(1)'; pet({ x: 0, y: 260, s: 0.62, pose: 'sit', expr: 'happy', wag: 0 }); ctx.filter = 'none'; ctx.restore();
  ctx.fillStyle = '#1a1416'; ctx.font = 'bold 80px sans-serif'; ctx.fillText((name || 'BUDDY').toUpperCase(), 0, 290);
  ctx.font = 'bold 40px sans-serif'; ctx.fillText('BROWN. RED COLLAR.', 0, 360); ctx.fillText('PLEASE CALL', 0, 420);
  sf(ell(0, -490, 16, 16), '#c8323a', 4); ctx.restore();
}
function insertScratches(f, a = 1) {                      // claw marks on a door
  fillR(-200, -200, W + 400, H + 400, '#3a3f58');
  sf(rr(140, 160, W - 280, H - 200, 10), '#4a5070', 10);
  for (const [x, y, w, h] of [[220, 330, 640, 560], [220, 1060, 640, 700]]) sf(rr(x, y, w, h, 8), '#424866', 7);
  sf(ell(W - 250, H * 0.52, 40, 40), '#c9c9d4', 7);
  const n = Math.floor(clamp(a) * 5);
  ctx.strokeStyle = '#d8dcf0'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  for (let s = 0; s < 3; s++) for (let i = 0; i < n; i++) {
    const x = 300 + s * 200 + i * 26, y = 1250 + s * 40;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40, y + 300); ctx.stroke();
  }
}

// ---------- pet shots: the dog is the actor of the line ----------
// sh.pet = {pose, expr, frame: 'full'|'face'|'duo', sil, tilt, wag, enter, name}
//   full: the dog alone in the room;  face: his face fills the frame;  duo: him with the hero
function petShot(sh, f) {
  const p = sh.pet || {}, t = clamp((f - sh.a) / Math.max(1, sh.b - sh.a));
  const o = Object.assign({ name: p.name || (P.petName || '') }, p);
  if (p.frame === 'face') return Object.assign(o, { x: 540, y: 2350, s: 3.5, pose: 'sit', tilt: (p.tilt || 0) + (p.expr === 'grin' ? Math.sin(f * 0.04) * 0.05 : 0) });
  let x = p.frame === 'duo' ? 760 : 540, s = p.frame === 'duo' ? 1.05 : 1.45, y = 1830;
  if (o.pose === 'up') s *= 0.95;
  if (o.pose === 'tall') { s = p.frame === 'duo' ? 0.95 : 1.0; y = 1860; }
  if (o.pose === 'stand') { x = 430; s = 1.1; }              // side view: keep nose and tail inside the frame
  if (o.pose === 'walk' || o.pose === 'run' || o.pose === 'back') {   // he crosses the frame
    const dir = p.dir === 'left' ? -1 : 1, span = o.pose === 'run' ? 700 : 380;
    x = 540 + dir * lerp(-span / 2, span / 2, t) - 110 * dir; o.flip = dir < 0; s = 1.05;
    if (o.pose === 'back') { o.flip = true; x = 540 - lerp(-80, 300, t); s = lerp(1.2, 0.8, t); y = lerp(1830, 1600, t); }
  }
  if (p.enter && o.pose !== 'walk' && o.pose !== 'run') o.alpha = seg(f, sh.a, sh.a + 18);
  return Object.assign(o, { x, y, s });
}
Object.assign(SCENES, {
  petshot: {
    frames: { wide: [540, 960, 1.0], hero: [540, 1150, 1.12], pet: [540, 1150, 1.12] },
    ambient: '#8a90b4',
    draw(f, sh) {
      drawPlate(sh.plate, f);
      const g = ctx.createLinearGradient(0, 1500, 0, 1920);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = g; ctx.fillRect(-200, 1500, W + 400, 600);
      const o = petShot(sh, f), p = sh.pet || {};
      if (p.frame === 'duo' && sh.hero) {
        const h = heroObj(sh, f, { x: p.pose === 'tall' ? 540 : 330, y: 1860, s: 0.72, look: p.pose === 'tall' ? 0 : 1, lookY: 0 });
        if (p.pose === 'tall') { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(540, 1852, 120, 22, 0, 0, 7); ctx.fill(); ctx.restore(); }
        if (p.pose === 'tall') { o.x = 560; pet(o); if (h) guy(h); return; }       // it looms right behind him
        if (h) guy(h);
      }
      if (p.frame !== 'face') { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(o.x, o.y - 6, 150 * o.s, 24 * o.s, 0, 0, 7); ctx.fill(); ctx.restore(); }
      pet(o);
    },
    lights(l, f) { light(l, 540, 1350, 760, '#fff4e6', 0.9); light(l, 540, 700, 900, '#dfe6ff', 0.5); },
    glow: [540, 900, 300, '#ffd9a0', 0.12],
  },
  insert: {
    frames: { wide: [540, 960, 1.0], hero: [540, 1000, 1.15], pet: [540, 1000, 1.15] },
    ambient: '#b8bcd8',
    draw(f, sh) {
      const k = sh.insert || 'tag', name = (sh.pet || {}).name || P.petName;
      if (k === 'tag') insertTag(name, f);
      else if (k === 'bowl') insertBowl(name, f, true);
      else if (k === 'poster') insertPoster(name, f);
      else if (k === 'scratch') insertScratches(f, seg(f, sh.a + 4, sh.a + 40));
    },
    lights(l, f) { light(l, 540, 900, 1100, '#ffffff', 0.9); },
  },
});
