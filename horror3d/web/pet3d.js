// Bruno and other dogs for the 3D Shorts: the drawn Shorts' pet() (horror/web/pet.js), unchanged, on a 3D card.
// usage in a story: fx/actor draw = (p) => petCard(p, { pose: 'sit', expr: 'calm', wag: 1 }, f)
//   pose: sit | stand | walk | run | up | tall | back      expr: happy | calm | stare | grin | sad | sniff
const INK = '#22112a';
let ctx = null, F = 0, CZ = 1;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
function rr(x, y, w, h, r) { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; }
function ell(x, y, rx, ry, rot = 0) { const p = new Path2D(); p.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); return p; }
function L(px) { return px / CZ; }
function sf(p, fill, lwPx = 6.5) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
  if (lwPx) { ctx.lineWidth = L(lwPx); ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(p); }
}
function line(x1, y1, x2, y2, c = INK, px = 6.5) { ctx.strokeStyle = c; ctx.lineWidth = L(px); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function light(c, x, y, r, col, a = 1) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.globalAlpha = 1;
}

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
    if (o.shh) { ctx.save(); ctx.translate(28, -170); ctx.rotate(-0.12); sf(rr(-22, -175, 44, 180, 20), F1, lw); sf(ell(0, -178, 38, 26), LI, lw); ctx.restore(); }   // one paw raised to its lips
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


/** draw the dog on a 600 x 1000 card, feet on the card's floor line (y = 975). k = size on the card */
export function petCard(p, o, f = 0, k = 0.82) {
  ctx = p.g; F = f; CZ = 1;
  pet({ ...o, x: 300, y: 975, s: k });
}
