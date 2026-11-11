// ---------- data-driven shot player: window.PLAN -> frames ----------
// PLAN = { frames, hero:{outfit,skin,hair,hairStyle}, other:{kind,outfit}, shots:[{a,b,scene,cam,focus,focus2,
//          hero:{pose,expr,expr2,look}, other:{state,where}, react, beat, jump, twist, light, fx:[], text:{...}}] }
const P = window.PLAN || { frames: 90, shots: [] };
const N = P.frames;
const HERO = Object.assign({ outfit: 'pj', skin: '#c98d62', hair: '#1d1420', hairStyle: 'spiky' }, P.hero || {});
const OTHER = Object.assign({ kind: 'double', outfit: 'shirt' }, P.other || {});
const blinkAt = (f, seed = 0) => { const p = (f + seed * 37) % 97; return p < 2 ? 1 : p < 4 ? 0.5 : 0; };

const EXPR = {
  calm: { eyeW: 1, pupil: 20, brow: 'flat', mouth: 'flat' },
  sleepy: { eyeW: 1, pupil: 20, brow: 'flat', mouth: 'flat', lid: 0.55 },
  asleep: { eyeW: 1, pupil: 20, brow: 'flat', mouth: 'flat', lid: 1 },
  curious: { eyeW: 1.05, pupil: 18, brow: 'up', mouth: 'flat' },
  worried: { eyeW: 1.08, pupil: 17, brow: 'worry', mouth: 'wobble', sweat: true, tremble: 2 },
  shock: { eyeW: 1.25, pupil: 14, brow: 'up', mouth: 'o', mo: 0.8, hairUp: 0.5, pupilShake: 5, tremble: 4 },
  scream: { eyeW: 1.32, pupil: 11, brow: 'up', mouth: 'o', mo: 1.45, hairUp: 1.1, pupilShake: 8, tremble: 9, sweat: true },
  relieved: { eyeW: 1, pupil: 20, brow: 'flat', mouth: 'smile' },
  tired: { eyeW: 1, pupil: 18, brow: 'tired', mouth: 'droop', lid: 0.45, circles: 0.9 },
  grin: { eyeW: 1, pupil: 16, brow: 'sly', mouth: 'grin', grin: 1 },
  stare: { eyeW: 1.12, pupil: 11, brow: 'flat', mouth: 'flat' },
  doubt: { eyeW: 0.95, pupil: 18, brow: 'raise', mouth: 'flat', lid: 0.2, look: 0.7 },
  realize: { eyeW: 1.22, pupil: 8, brow: 'worry', mouth: 'flat', sweat: true, tremble: 2 },
  dread: { eyeW: 1.18, pupil: 7, brow: 'worry', mouth: 'wobble', sweat: true, tremble: 5, pupilShake: 3, hairUp: 0.3 },
};
const ex = n => Object.assign({}, EXPR[n] || EXPR.calm);
const bT = (f, sh, len = 8) => sh.beat == null ? 0 : clamp((f - sh.beat) / len);
const after = (f, sh) => sh.beat != null && f >= sh.beat;

const CAST = P.cast || {};          // side characters: { mum: {look...}, dad: {...} }
const talking = (sh, f, who) => sh.talk === who && sh.ls != null && f >= sh.ls && f <= sh.le;
const mouthAt = (sh, f) => { if (!sh.env || sh.ls == null) return null; const i = f - sh.ls; return i < 0 || i >= sh.env.length ? 0 : sh.env[i]; };
const LOOK = l => ({ skin: l.skin, hair: l.hair, hairStyle: l.hairStyle, outfit: l.outfit, top: l.top, stripe: l.stripe, acc: l.acc, pants: l.pants, shoes: l.shoes, hood: l.hood });

function heroObj(sh, f, base) {
  if (!sh.hero) return null;
  const h = sh.hero;
  const o = Object.assign({ seed: 1 }, LOOK(HERO), base, ex(h.expr || 'worried'));
  o.talk = talking(sh, f, 'hero');
  if (o.talk) { o.mouthOpen = mouthAt(sh, f); o.bob = (o.bob || 0) - 7 * (o.mouthOpen || 0); }
  if (h.look != null) o.look = h.look;
  if (h.pose === 'sleep') Object.assign(o, ex('asleep'), { tilt: 0.25 });
  if (sh.react === 'jolt' && after(f, sh)) {
    const t = bT(f, sh, 9);
    Object.assign(o, ex(h.expr2 || 'shock'));
    o.hairUp = (o.hairUp || 0) + 0.8 * back(t); o.eyeW = (o.eyeW || 1) * (1 + 0.1 * back(t)); o.tremble = Math.max(o.tremble || 0, 8);
    if (h.pose !== 'sleep' && !base.noLegs) { o.armL = lerp(0.22, 2.7, back(t)); o.armR = o.armL; }
  } else if (sh.react === 'gag' && after(f, sh)) {
    const t = bT(f, sh, 10), pop = back(t) * (1 - 0.6 * ss(seg(f, sh.beat + 14, sh.beat + 30)));
    Object.assign(o, ex(h.expr2 || 'shock'));
    o.eyeW = 1 + 0.55 * pop; o.pupil = 9; o.hairUp = 2.2 * pop; o.mouth = 'o'; o.mo = 1 + 0.8 * pop;
    o.bob = (o.bob || 0) - 90 * Math.sin(Math.PI * clamp(t * 1.4));     // a little jump
    o.lean = (o.lean || 0) + 0.12 * Math.sin(f * 1.3) * pop;
    if (!base.noLegs) { o.armL = 2.9 * pop; o.armR = 2.9 * pop; o.armsFront = true; }
  } else if (h.expr2 && after(f, sh)) Object.assign(o, ex(h.expr2));
  if (h.pose === 'cheeks') { o.armL = 2.85; o.armR = 2.85; o.armsFront = true; }
  if (h.pose === 'reach') o.armR = lerp(0.22, 1.75, ss(seg(f, sh.a + 6, sh.a + 24)));
  o.blink = Math.max(o.blink || 0, (o.lid || 0) > 0.9 ? 0 : blinkAt(f, 2));
  o.bob = (o.bob || 0) + Math.sin(f * 0.15) * 3;
  const face = (after(f, sh) && h.expr2) || h.expr;
  if (h.sweat || h.pose === 'run' || ['worried', 'shock', 'scream', 'tired'].includes(face)) o.sweat = true;   // nervous sweat
  return o;
}

function otherObj(sh, f, base) {
  if (sh.side && CAST[sh.side]) {   // a side character (mum, roommate...) stands where the villain would
    const c = CAST[sh.side];
    const o = Object.assign({ seed: 9 }, LOOK(c), base, ex(sh.sideExpr || 'calm'));
    o.talk = talking(sh, f, 'side'); o.blink = blinkAt(f, 9); o.bob = Math.sin(f * 0.1) * 2;
    if (o.talk) o.mouthOpen = mouthAt(sh, f);
    if (sh.react === 'vanish') o.alpha = after(f, sh) ? 1 - ss(bT(f, sh, 5)) : 1;
    return o;
  }
  const st = (sh.other && sh.other.state) || 'hidden';
  if (st === 'hidden') return null;
  const isDouble = OTHER.kind === 'double';
  const o = Object.assign({ kind: OTHER.kind, seed: 3 }, isDouble ? Object.assign(LOOK(HERO), { outfit: OTHER.outfit, top: undefined }) : {},
    OTHER.look ? LOOK(OTHER.look) : {}, base);
  if (OTHER.glow) o.glow = OTHER.glow;
  if (OTHER.kind === 'delivery') o.holdR = (hx, hy) => { sf(rr(hx - 90, hy - 160, 180, 150, 10), '#c9a46a', 6 / (base.s || 1)); line(hx - 90, hy - 110, hx + 90, hy - 110, '#8a6a3a', 4); };
  const map = { back: 'stare', front: 'stare', stare: 'stare', grin: 'grin', tired: 'tired', lurk: 'stare' };
  Object.assign(o, ex(map[st] || 'stare'));
  o.turn = st === 'back' ? 0 : 1;
  const r = sh.react;
  if (r === 'turn') { o.turn = ss(bT(f, sh, 12)); if (after(f, sh) && st !== 'tired') Object.assign(o, ex('grin'), { grin: ss(seg(f, sh.beat + 10, sh.beat + 22)) }); }
  if (r === 'grin') { Object.assign(o, ex('grin')); o.grin = ss(bT(f, sh, 12)); if (!after(f, sh)) Object.assign(o, ex('stare')); }
  if (r === 'droop') { const d = ss(bT(f, sh, 14)); o.lid = 0.5 * d; o.circles = d; o.brow = d > 0.4 ? 'tired' : o.brow; o.mouth = d > 0.4 ? 'droop' : o.mouth; o.tilt = 0.1 * back(bT(f, sh, 10)); }
  if (r === 'gag' && after(f, sh) && (sh.focus === 'other' || !sh.hero)) {
    const pop = back(bT(f, sh, 10)) * (1 - 0.5 * ss(seg(f, sh.beat + 14, sh.beat + 30)));
    o.mouth = 'o'; o.mo = 1 + 0.9 * pop; o.eyeW = 1 + 0.45 * pop; o.tremble = 7; o.hairUp = 1.5 * pop; o.brow = 'up';
  }
  if (r === 'appear') o.alpha = after(f, sh) ? ss(bT(f, sh, 6)) : 0;
  if (r === 'vanish') o.alpha = after(f, sh) ? 1 - ss(bT(f, sh, 5)) : 1;
  if (st === 'lurk') o.alpha = Math.min(o.alpha ?? 1, 0.9);
  if (o.kind === 'ghost') o.alpha = (o.alpha ?? 1) * (0.78 + 0.08 * Math.sin(f * 0.2));
  o.blink = o.kind === 'double' || o.kind === 'neighbour' || o.kind === 'delivery' ? blinkAt(f, 5) : 0;
  o.bob = Math.sin(f * 0.07) * 2;
  o.talk = talking(sh, f, 'other');
  if (o.talk) o.mouthOpen = mouthAt(sh, f);
  return o;
}

// ---------- scenes: draw, light, camera framings ----------
function kitchenLight(sh, f) {
  const base = { dark: 0, dawn: 0, on: 1, flicker: 1 }[sh.light || 'dawn'] ?? 0;
  let v = base;
  if (sh.react === 'lights_on') v = after(f, sh) ? (f - sh.beat < 2 || (f - sh.beat > 3 && f - sh.beat < 5) ? 1 : (f - sh.beat < 6 ? 0.2 : 1)) : 0;
  if (sh.react === 'lights_off') v = after(f, sh) ? 0 : 1;
  if (sh.light === 'flicker' || sh.react === 'flicker') v = noise1(f * 0.9) > 0.35 ? 1 : 0.1;
  return v;
}
function ambientScale(sh, f) {
  if (sh.react === 'lights_off') return after(f, sh) ? 0.35 : 1;
  if (sh.react === 'lights_on') return after(f, sh) ? 1 : 0.4;
  if (sh.react === 'flicker' || sh.light === 'flicker') return noise1(f * 0.9) > 0.35 ? 1 : 0.35;
  return 1;
}

const PLATES = {};              // painted 3D-look background plates (data URLs in the plan), drawn behind our 2D cast
function drawPlate(name, f) {
  const im = PLATES[name];
  if (!im) { ctx.fillStyle = '#10121c'; ctx.fillRect(-200, -200, W + 400, H + 400); return; }
  const k = Math.max((W + 120) / im.width, (H + 120) / im.height);      // cover the frame with a little room to drift
  const dx = Math.sin(f / 90) * 18, dy = Math.cos(f / 110) * 10;        // the plate breathes slightly: never a frozen still
  ctx.drawImage(im, W / 2 - im.width * k / 2 + dx, H / 2 - im.height * k / 2 + dy, im.width * k, im.height * k);
}
const PROPS_IMG = {};           // painted objects and animals (transparent cut-outs), placed beside the hero
function drawProp(name, x, y, h, f, i, tall) {
  const im = PROPS_IMG[name]; if (!im) return;
  const info = (P.propInfo || {})[name] || {};
  let k = h / im.height, dy = 0, sq = 1;
  if (tall) { k *= 0.85; sq = 1.55; }
  if (info.kind === 'animal' && !tall) { sq = 1 + 0.02 * Math.sin(f / 7 + i * 2); dy = 0; if (name === 'crow' || name === 'owl') dy = -Math.abs(Math.sin(f / 23 + i)) * 6; }
  if (name === 'red_balloon') dy = Math.sin(f / 20 + i) * 18;
  const w = im.width * k, hh = im.height * k * sq;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.42, Math.max(10, w * 0.06), 0, 0, 7); ctx.fill(); ctx.restore();
  ctx.drawImage(im, x - w / 2, y - hh + dy, w, hh);
}
// where the hero is on a painted place: walking or running carries him across the frame
function plateHeroX(sh, f) {
  const pose = (sh.hero || {}).pose, dir = (sh.hero || {}).dir === 'left' ? -1 : 1;
  const t = clamp((f - sh.a) / Math.max(1, sh.b - sh.a));
  if (pose === 'run') return 540 + dir * lerp(-420, 420, t);
  if (pose === 'walk') return 540 + dir * lerp(-170, 170, t);
  return 540;
}
function drawThings(sh, f, front) {
  const things = sh.things || [];
  things.forEach((t, i) => {
    const info = (P.propInfo || {})[t] || {}, big = info.kind === 'vehicle';
    if (big === front) return;                                  // vehicles stand behind the hero, the rest beside him
    // cartoon scale: small things read bigger than life, vehicles stay big behind him
    const h = big ? info.h * 1.05 : t === 'red_balloon' ? 460 : Math.max(210, (info.h || 200) * 1.7);
    const x = big ? (i % 2 ? 250 : 820) : t === 'red_balloon' ? (i % 2 ? 190 : 900) : (i % 2 ? 270 : 800), y = big ? 1760 : 1862;
    const star = i === 0 && sh.focus === 'thing', tall = star && sh.thing_tall;
    // the thing the line is about is the co-star of the shot: bigger, and standing as tall as him when it stands up
    drawProp(t, star ? x + 30 : x, star ? y + 8 : y, star ? h * (tall ? 1.9 : 1.35) : h, f, i, tall);
  });
}
const SCENES = {
  plate: {
    frames: { wide: [540, 960, 1.0], hero: [540, 1380, 1.6], prop: [540, 900, 1.5], thing: [690, 1320, 1.3] },  // thing: the hero AND the animal/object the line names
    otherFrame() { return [540, 1000, 1.6]; },
    ambient: '#8a90b4',
    draw(f, sh) {
      drawPlate(sh.plate, f);
      const g = ctx.createLinearGradient(0, 1500, 0, 1920);           // ground the actor: a soft floor shadow
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = g; ctx.fillRect(-200, 1500, W + 400, 600);
      drawThings(sh, f, false);
      const hx = plateHeroX(sh, f), pose = (sh.hero || {}).pose, dir = (sh.hero || {}).dir === 'left' ? -1 : 1;
      const h = heroObj(sh, f, { x: hx, y: 1860, s: 0.8, look: 0, lookY: 0 });
      if (h && (pose === 'walk' || pose === 'run')) {
        const run = pose === 'run', ph = f * (run ? 0.95 : 0.45);
        h.walk = ph; h.walkAmt = run ? 1.35 : 1; h.look = dir;
        h.lean = dir * (run ? 0.17 : 0.04);
        h.armL = 0.25 + (run ? 0.95 : 0.35) * Math.max(0, Math.sin(ph)); h.armR = 0.25 + (run ? 0.95 : 0.35) * Math.max(0, -Math.sin(ph));
        h.bob = (h.bob || 0) - Math.abs(Math.sin(ph)) * (run ? 26 : 9);
        if (run) { h.sweat = true; h.eyeW = (h.eyeW || 1) * 1.15; }
      }
      if (h) { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(hx, 1852, 140, 26, 0, 0, 7); ctx.fill(); ctx.restore(); guy(h); }
      drawThings(sh, f, true);
    },
    lights(l, f) { light(l, 540, 1350, 760, '#fff4e6', 0.9); light(l, 540, 700, 900, '#dfe6ff', 0.5); },
    glow: [540, 900, 300, '#ffd9a0', 0.12],
  },
  bedroom: {
    frames: { wide: [555, 1005, 0.98], hero: [600, 950, 2.3], prop: [170, 1180, 2.1], window: [245, 560, 1.9], door: [1060, 1150, 1.8] },
    otherFrame(sh) { const w = (sh.other || {}).where || 'door'; return w === 'window' ? [245, 520, 2.2] : w === 'beside' ? [900, 1080, 1.7] : [1060, 1110, 2.2]; },
    ambient: '#3a4682',
    draw(f, sh) {
      const h = heroObj(sh, f, { x: 600, y: (sh.hero || {}).pose === 'sleep' ? 1640 : 1430, s: 0.62, noLegs: true });
      const w = (sh.other || {}).where || 'door';
      const ob = w === 'window' ? { x: 245, y: 520 + 775 * 0.5, s: 0.5 } : w === 'beside' ? { x: 900, y: 1700, s: 0.78 } : { x: 1060, y: 1110 + 775 * 0.5, s: 0.5 };
      const o = otherObj(sh, f, ob);
      bedroom.atDoor = w === 'door' ? o : null; bedroom.atWindow = w === 'window' ? o : null; bedroom.beside = w === 'beside' ? o : null;
      bedroom(f, h);
      if (sh.react === 'ring') rings(160, 1110, f, sh.beat, sh.beat + 40, '#ffe9a8', 10, 280, 0);
    },
    lights(l, f, sh) { bedroomLights(l, f); },
  },
  hallway: {
    frames: { wide: [540, 960, 1.0], door: [540, 930, 2.8], hero: [150, 960, 1.5], prop: [540, 930, 2.8] },
    otherFrame() { return [540, 930, 3.2]; },
    ambient: '#3a3a66',
    draw(f, sh) {
      const pk = seg(f, sh.a, sh.a + 16);
      const h = heroObj(sh, f, { x: lerp(-120, 60, back(pk)), y: 2200, s: 1.6, noLegs: true, look: 1, lean: 0.12 });
      hallway.figure = otherObj(sh, f, { x: 540, y: 1080, s: 0.2 });
      hallway(f, h);
      if (sh.react === 'knock' || sh.react === 'ring') rings(540, 900, f, sh.beat, sh.beat + 30, '#ffe9a8', 9, 200, -Math.PI / 2 + 0.0001);
    },
    lights(l, f) { hallLights(l, f); },
    glow: [540, 920, 240, '#ffcf80', 0.25],
  },
  kitchen: {
    frames: { wide: [560, 1180, 0.95], hero: [390, 1130, 1.9], prop: [576, 1200, 2.6] },
    otherFrame(sh) { return sh.hero ? [740, 1120, 2.1] : [620, 1120, 2.1]; },
    ambient: '#4a5486',
    ambientOn: '#bdb29e',
    draw(f, sh) {
      const walk = (sh.hero || {}).pose === 'walk';
      const wk = walk ? seg(f, sh.a, sh.a + 36) : 1;
      const h = heroObj(sh, f, { x: lerp(-150, 380, wk), y: 1780, s: 0.85, walk: wk < 1 ? f * 0.45 : 0, walkAmt: wk < 1 ? 1 : 0, look: 1 });
      const o = otherObj(sh, f, { x: sh.hero ? 740 : 620, y: 1790, s: 0.85 });
      const lit = kitchenLight(sh, f);
      kitchen(f, { mug: !o, steam: (sh.fx || []).includes('steam') || true, lightOn: lit });
      if (o) guy(o);
      if (h) guy(h);
    },
    lights(l, f, sh) { const lit = kitchenLight(sh, f); kitchenLights(l, f, { dawn: lit > 0.5 ? 0.6 : 0.9, mugGlow: 0.4, lightOn: lit }); },
  },
  front_door: {
    frames: { wide: [600, 1250, 1.1], door: [540, 820, 1.5], prop: [545, 1560, 2.6], hero: [930, 1185, 2.0], peephole: [540, 470, 4.0] },
    otherFrame(sh) { return ((sh.other || {}).where === 'peephole') ? [540, 470, 4.0] : [540, 1530, 2.4]; },
    ambient: '#3f3a68',
    draw(f, sh) {
      frontDoor(f);
      const o = sh.other && sh.other.state !== 'hidden';
      const where = (sh.other || {}).where || 'under_door';
      if (o && where === 'under_door') {
        const a = sh.react === 'appear' ? (after(f, sh) ? 1 : 0) : 1;
        fillR(300, 1518, 480, 14, '#ffe2a8');
        ctx.globalAlpha = a; fillR(470, 1516, 50, 18, '#0b0710'); fillR(570, 1516, 50, 18, '#0b0710'); ctx.globalAlpha = 1;
      }
      if (o && where === 'peephole') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, 540, 470, 26, '#ff4040', 0.9); ctx.restore(); }
      if (sh.prop === 'shoes') { shoe(470, 1640, true); shoe(640, 1640, false); }
      const h = heroObj(sh, f, { x: 930, y: 1960, s: 1.0, look: -1, lookY: 0.6 });
      if (h) guy(h);
      if (sh.react === 'knock') for (const k of [0, 9, 18]) rings(540, 900, f, sh.beat + k, sh.beat + k, '#ffd7a0', 10, 300, Math.PI);
    },
    lights(l, f) { frontLights(l, f); },
  },
  wardrobe: {
    frames: { wide: [540, 1060, 1.0], prop: [730, 700, 1.45], gap: [560, 800, 2.4], hero: [220, 1185, 2.0] },
    otherFrame() { return [570, 760, 3.0]; },
    ambient: '#3d4578',
    draw(f, sh) {
      const shirt = sh.prop === 'shirt';
      const o = sh.other && sh.other.state !== 'hidden';
      const aj = o ? (sh.react === 'appear' ? ss(bT(f, sh, 10)) : 1) : 0;
      wardrobe(f, shirt ? seg(f, sh.a + 4, sh.a + 40) : 0, shirt, aj);
      if (o && aj > 0.3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const dx of [-12, 12]) light(ctx, 560 + dx * 1.5 + 20 * aj, 760, 20, OTHER.kind === 'double' ? '#ffffff' : '#ff3b3b', 0.95 * aj); ctx.restore(); }
      const h = heroObj(sh, f, { x: 220, y: 1960, s: 1.0, look: 1, lookY: -0.2 });
      if (h) guy(h);
    },
    lights(l, f) { wardrobeLights(l, f); },
    glow: [730, 700, 400, '#e0ecff', 0.1],
  },
  desk: {
    frames: { wide: [600, 1100, 1.2], hero: [760, 1130, 2.0], prop: [420, 1200, 2.0] },
    otherFrame() { return [420, 1000, 1.5]; },
    ambient: '#272c52',
    draw(f, sh) {
      desk.behind = otherObj(sh, f, { x: 300, y: 1880, s: 1.25 });
      const h = heroObj(sh, f, { x: 760, y: 1900, s: 1.0, look: -1, lookY: 0.4, eyeCol: '#f0f6ff' });
      desk(f, h);
    },
    lights(l, f) { deskLights(l, f); },
    glow: [420, 1080, 260, '#cfe0ff', 0.18],
  },
  cctv: {
    frames: { wide: [560, 1180, 0.92], prop: [560, 1180, 0.92] },
    otherFrame(sh) { const close = sh.cam === 'close' || sh.cam === 'snap'; if (sh.room === 'bedroom') return close ? [880, 1100, 2.6] : [820, 1150, 1.5]; return close ? [620, 1110, 3.2] : [620, 1150, 1.6]; },
    heroFrame() { return [600, 960, 2.0]; },
    ambient: '#2b3452', ambientOn: '#bdb29e',
    draw(f, sh) {
      if ((sh.room || 'kitchen') === 'bedroom') {
        const h = heroObj(Object.assign({}, sh, { hero: Object.assign({ pose: 'sleep', expr: 'asleep' }, sh.hero || {}) }), f, { x: 600, y: 1640, s: 0.62, noLegs: true });
        bedroom.atDoor = null; bedroom.atWindow = null;
        bedroom.beside = otherObj(sh, f, { x: 900, y: 1700, s: 0.78 });
        bedroom(f, h);
      } else {
        const lit = kitchenLight(Object.assign({ light: 'dark' }, sh), f);
        kitchen(f, { lightOn: lit, mug: false });
        const o = otherObj(sh, f, { x: 620, y: 1790, s: 0.85 });
        if (o && (lit > 0.5 || sh.react !== 'lights_on')) guy(o);
      }
    },
    lights(l, f, sh) {
      if ((sh.room || 'kitchen') === 'bedroom') return bedroomLights(l, f);
      const lit = kitchenLight(Object.assign({ light: 'dark' }, sh), f);
      kitchenLights(l, f, { dawn: 0.6, lightOn: lit });
    },
  },
  calendar: { frames: { wide: [540, 900, 1.0], prop: [540, 860, 1.25], hero: [540, 860, 1.25] }, ambient: '#47538c',
    draw(f, sh) { const t = sh.text || {}; const sw = sh.react === 'text_change' && after(f, sh); calendarScene(f, (sw ? t.top2 : t.top) || 'MONDAY', String((sw ? t.big2 : t.big) || '13')); },
    lights(l) { light(l, 540, 820, 520, '#c6d2ff', 0.9); light(l, 1100, 1200, 700, '#ffb070', 0.4); } },
  phone: { frames: { wide: [540, 920, 1.0], prop: [540, 860, 1.35], hero: [540, 860, 1.35] }, ambient: '#22264a',
    draw(f, sh) { const t = Object.assign({}, sh.text || {}); if (sh.react === 'text_change' && after(f, sh)) { t.msg = t.msg2 || t.msg; t.from = t.from2 || t.from; }
      ctx.save(); if (sh.react === 'ring' && after(f, sh) && f - sh.beat < 40) ctx.translate(Math.sin(f * 2.5) * 6, 0); phoneScene(f, t); ctx.restore();
      if (sh.react === 'ring') rings(540, 700, f, sh.beat, sh.beat + 36, '#cfe0ff', 9, 300, -Math.PI / 2 + 0.0001); },
    lights(l, f) { phoneLights(l, f); }, glow: [540, 900, 380, '#9fb8ff', 0.18] },
  bathroom: {
    frames: { wide: [540, 1000, 1.0], hero: [540, 700, 1.55], prop: [540, 700, 1.55] },
    otherFrame() { return [540, 690, 2.4]; },
    ambient: '#4d6670',
    draw(f, sh) {
      const h = heroObj(sh, f, { x: 540, y: 2420, s: 1.35, noLegs: true, turn: 0 });
      // the reflection: the hero, unless the other takes over the mirror
      let refl;
      const st = (sh.other || {}).state;
      if (st && st !== 'hidden') refl = otherObj(sh, f, { x: 540, y: 700 + 775 * 0.75, s: 0.75 });
      else refl = heroObj(sh, f, { x: 540, y: 700 + 775 * 0.75, s: 0.75, noLegs: true });
      if (refl) { refl.kind = refl.kind === 'double' ? undefined : refl.kind; refl.outfit = refl.kind ? refl.outfit : HERO.outfit; refl.flip = true; }
      bathroom(f, h ? Object.assign(h, { turn: 0 }) : null, refl);
    },
    lights(l, f) { bathLights(l, f); },
  },
  window: {
    frames: { wide: [540, 830, 1.0], prop: [540, 830, 1.0] },
    otherFrame() { return [540, 800, 2.0]; },
    ambient: '#3a4682',
    draw(f, sh) { windowScene(f, otherObj(sh, f, { x: 540, y: 820 + 775 * 0.7, s: 0.7 }), (sh.fx || []).includes('rain')); },
    lights(l, f) { windowLights(l, f); },
  },
  closeup: {
    frames: { wide: [540, 980, 1.0], hero: [540, 900, 1.45], prop: [540, 900, 1.45] },
    otherFrame() { return [540, 900, 1.45]; },
    ambient: '#3a3f6e',
    draw(f, sh) {
      const h = heroObj(sh, f, { x: 540, y: 900 + 775 * 1.2, s: 1.2, noLegs: true });
      const o = !h ? otherObj(sh, f, { x: 540, y: 900 + 775 * 1.2, s: 1.2 }) : null;
      closeupScene(f, h || o, sh.tint);
    },
    lights(l, f, sh) { closeupLights(l, f, sh.tint); },
  },
};

// ---------- camera ----------
function framesFor(S, sh, name) {
  if (S.frameFn) { const r = S.frameFn(sh, name); if (r) return r; }
  if (name === 'other' && S.otherFrame) return S.otherFrame(sh);
  if (name === 'hero' && S.heroFrame) return S.heroFrame(sh);
  return S.frames[name] || S.frames.hero || S.frames.wide;
}
const ALT_CAM = { wide: 'medium', medium: 'wide', close: 'medium', push_in: 'medium', pull_out: 'medium', pan: 'medium', snap: 'wide' };
function camFor(S, sh, f) {
  // Shorts cut every 2-3 s: a long line gets a second framing halfway (a hard cut, not a move)
  if (P.cuts && FORMAT !== 'landscape' && !sh._cut && !sh.twist && sh.b - sh.a > 84 && !(sh.scene === 'plate' && ['walk', 'run'].includes((sh.hero || {}).pose))) {
    const cut = sh.a + Math.round((sh.b - sh.a) * 0.5);
    if (f >= cut && !(sh.beat != null && Math.abs(sh.beat - cut) < 10))
      return camFor(S, Object.assign({}, sh, { a: cut, cam: ALT_CAM[sh.cam] || 'close', _cut: true }), f);
  }
  const t = f - sh.a, dur = Math.max(1, sh.b - sh.a);
  const W0 = S.frames.wide;
  const wide = FORMAT === 'landscape' ? [W0[0], W0[1], W0[2] * 0.86] : W0;   // wide shots breathe a little more in 16:9
  const foc = framesFor(S, sh, sh.focus || (sh.hero ? 'hero' : 'other'));
  const mid = [lerp(wide[0], foc[0], 0.5), lerp(wide[1], foc[1], 0.5), lerp(wide[2], foc[2], 0.45)];
  const k = (fr, p, e) => [fr, p[0], p[1], p[2], 0, e];
  const br = sh.beat != null ? clamp(sh.beat - sh.a, 1, dur - 1) : Math.floor(dur * 0.6);
  let K;
  switch (sh.cam) {
    case 'wide': K = [k(0, wide), k(dur, wide)]; break;
    case 'medium': K = [k(0, mid), k(dur, mid)]; break;
    case 'close': K = [k(0, foc), k(dur, foc)]; break;
    case 'pull_out': K = [k(0, foc), k(Math.min(dur, 36), wide, eo), k(dur, wide)]; break;
    case 'pan': { const from = framesFor(S, sh, sh.focus2 || 'wide'); K = [k(0, from), k(Math.min(dur, 40), foc), k(dur, foc)]; break; }
    case 'snap': K = [k(0, mid), k(br, mid), k(br + 7, foc, eo), k(dur, foc)]; break;
    case 'low': { const lo = [foc[0], foc[1] + 130, foc[2] * 0.88]; K = [k(0, lo), k(dur, [lo[0], lo[1] - 30, lo[2] * 0.93])]; break; }   // from the floor up: he looks big
    case 'high': { const hi = [wide[0], wide[1] - 180, wide[2] * 1.12]; K = [k(0, hi), k(dur, [hi[0], hi[1] + 40, hi[2] * 1.05])]; break; }  // looking down: he looks small and alone
    case 'dutch': K = [k(0, mid), k(dur, foc)]; break;
    case 'crash': K = [k(0, wide), k(br, wide), k(br + 5, [foc[0], foc[1], foc[2] * 1.35], eo), k(dur, [foc[0], foc[1], foc[2] * 1.3])]; break;
    case 'track': K = [k(0, mid), k(dur, mid)]; break;
    default: K = [k(0, wide), k(dur, foc)];
  }
  let c = keys(K, t);
  c = creep(c, t, 0.8);
  if (sh.scene === 'plate' && ['walk', 'run'].includes((sh.hero || {}).pose) && sh.cam !== 'wide' && sh.cam !== 'high') {
    c.x = plateHeroX(sh, f);                 // the camera tracks him across the place
    if (sh.hero.pose === 'run') { c.y += Math.abs(Math.sin(f * 0.95)) * 10; c.r += Math.sin(f * 0.47) * 0.8; }   // handheld chase
  }
  if (sh.cam === 'dutch') c.r += 10 * (sh.hero && sh.hero.dir === 'left' ? -1 : 1);
  if (sh.cam === 'low') c.r -= 3;
  if (sh.cam === 'crash' && sh.beat != null) c = kick(c, f, sh.beat + 4, 18, 7);
  if (sh.twist) c.r += 3 * ss(seg(t, 0, dur));
  if (sh.beat != null && ['jolt', 'knock', 'appear', 'ring', 'lights_on', 'slam', 'buzz', 'door_open', 'thump', 'crash', 'pound', 'slam1', 'lidfall'].includes(sh.react)) c = kick(c, f, sh.beat, sh.react === 'buzz' ? 8 : 16, 7);
  if (sh.react === 'slam') { c = kick(c, f, sh.beat + 9, 14, 6); c = kick(c, f, sh.beat + 18, 14, 6); }
  if (sh.react === 'gag' && sh.beat != null && f >= sh.beat) { const t = seg(f, sh.beat, sh.beat + 8); c.z *= 1 + 0.18 * back(t) * (1 - seg(f, sh.beat + 20, sh.beat + 40)); c = kick(c, f, sh.beat, 10, 6); }
  if (sh.roll) c.r += sh.roll * (sh.rollIn ? ss(seg(f, sh.a, sh.b)) : 1);    // dutch angle for unease
  if (sh.shake && sh.env) { const v = mouthAt(sh, f) || 0; c.x += (rnd(f * 3.7) - 0.5) * sh.shake * v / c.z; c.y += (rnd(f * 5.1) - 0.5) * sh.shake * v / c.z; c.r += (rnd(f * 2.3) - 0.5) * 1.6 * v; c.z *= 1 + 0.03 * v; }
  if (sh.react === 'knock') { c = kick(c, f, sh.beat + 9, 12, 6); c = kick(c, f, sh.beat + 18, 12, 6); }
  return c;
}

// ---------- frame ----------
function dust(f, sh) {   // slow motes drifting in the light: something always moves
  if (['phone', 'calendar', 'phone2', 'selfie', 'black', 'gScreen', 'gCall', 'gPhoto'].includes(sh.scene) || sh.nodust) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const x = (rnd(i * 3.1) * W + f * (0.4 + rnd(i) * 0.8) + Math.sin(f * 0.02 + i) * 30) % W;
    const y = (rnd(i * 7.7) * H - f * (0.25 + rnd(i + 5) * 0.5) + H * 4) % H;
    ctx.globalAlpha = 0.08 + 0.12 * noise1(f * 0.05 + i);
    ctx.fillStyle = '#fff4dc'; ctx.beginPath(); ctx.arc(x, y, 2 + rnd(i + 2) * 4, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function cctvOverlay(f, sh) {
  const t = sh.text || {};
  const sw = sh.react === 'text_change' && after(f, sh);
  const g = sh.react === 'text_change' && sh.beat != null && f >= sh.beat - 2 && f < sh.beat + 3;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(235,255,238,0.92)'; ctx.font = 'bold 54px "DejaVu Sans Mono"'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6;
  const top = FORMAT === 'landscape' ? 60 : 150, bottom = H - (FORMAT === 'landscape' ? 120 : 220);
  ctx.fillText(t.label || 'CAM 01', 70, top);
  if (Math.floor(f / 15) % 2 === 0) { ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.arc(W - 260, top + 28, 18, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(235,255,238,0.92)'; ctx.fillText('REC', W - 230, top);
  const sec = String(Math.floor((f - sh.a) / 30) % 60).padStart(2, '0');
  const time = (sw ? t.time2 : t.time) || '03:00';
  ctx.fillStyle = sw ? '#ff7a7a' : 'rgba(235,255,238,0.92)';
  ctx.fillText(`${time}:${sec}`, 70 + (g ? (rnd(f) - 0.5) * 30 : 0), bottom);
  ctx.restore();
  if (g) glitch(1.0);
}

// ---------- cold open hook + A/B choice card ----------
let COLD = false;
function hookCard(f) {                     // over the scariest frame: the story's hook in huge letters
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
  const words = (P.hook || '').split(' '), lines = [];
  let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > 14) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
  if (cur.trim()) lines.push(cur.trim());
  const k = 1 + 0.04 * Math.sin(f * 0.6), y0 = 640 - lines.length * 70;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.font = '900 118px "DejaVu Sans"';
  const fit = Math.min(1, ...lines.map(l => 960 / Math.max(1, ctx.measureText(l).width)));   // never wider than the screen
  lines.forEach((l, i) => { ctx.save(); ctx.translate(W / 2 + (f < 4 ? (rnd(f + i) - 0.5) * 30 : 0), y0 + i * 140); ctx.scale(k * fit, k * fit);
    ctx.lineWidth = 22; ctx.strokeStyle = '#0a0610'; ctx.strokeText(l, 0, 0); ctx.fillStyle = i === lines.length - 1 ? '#ffd23f' : '#ffffff'; ctx.fillText(l, 0, 0); ctx.restore(); });
  ctx.restore();
  if (f < 5) glitch(0.9);
}
function choiceCard(f, sh) {               // "What would you do?"  A) ...  B) ...  comment below
  const t = f - sh.a;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = `rgba(4,3,10,${0.55 * clamp(t / 8)})`; ctx.fillRect(0, 0, W, H);
  sh.choices.slice(0, 2).forEach((c, i) => {
    const p = back(clamp((t - 4 - i * 6) / 10)); if (p <= 0) return;
    ctx.save(); ctx.translate(W / 2, 560 + i * 230); ctx.scale(p, p);
    ctx.fillStyle = '#1c2140'; ctx.strokeStyle = i ? '#ff5a5a' : '#5ad1ff'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.roundRect(-430, -85, 860, 170, 40); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-340, 0, 54, 0, 7); ctx.fillStyle = i ? '#ff5a5a' : '#5ad1ff'; ctx.fill();
    ctx.fillStyle = '#0a0610'; ctx.font = '900 70px "DejaVu Sans"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(i ? 'B' : 'A', -340, 4);
    ctx.fillStyle = '#ffffff'; ctx.font = `800 ${c.length > 20 ? 46 : 56}px "DejaVu Sans"`; ctx.textAlign = 'left'; ctx.fillText(c, -260, 4);
    ctx.restore();
  });
  const q = clamp((t - 18) / 8);
  if (q > 0) { ctx.globalAlpha = q; ctx.font = '800 54px "DejaVu Sans"'; ctx.textAlign = 'center'; ctx.lineWidth = 12; ctx.strokeStyle = '#0a0610';
    ctx.strokeText('COMMENT  A  OR  B  👇', W / 2, 1040); ctx.fillStyle = '#ffd23f'; ctx.fillText('COMMENT  A  OR  B  👇', W / 2, 1040); }
  ctx.restore();
}

// ---------- brand: intro sting + signature outro ----------
const INTRO = P.intro || 0, OUTRO = P.outro || 0, END = N - OUTRO;
function brandTitle(cx, cy, scale, alpha, jitter) {
  ctx.save(); ctx.translate(cx + jitter, cy); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.font = '900 104px "DejaVu Sans"'; ctx.lineWidth = 22; ctx.strokeStyle = '#140a1c';
  ctx.strokeText('CREEPY CARTOON', 0, -70);
  ctx.fillStyle = '#e9f7ec'; ctx.shadowColor = 'rgba(120,255,160,0.6)'; ctx.shadowBlur = 36; ctx.fillText('CREEPY CARTOON', 0, -70);
  ctx.shadowBlur = 0; ctx.font = '900 168px "DejaVu Sans"'; ctx.lineWidth = 28; ctx.strokeText('TALES', 0, 80);
  ctx.fillStyle = '#ff5a5a'; ctx.shadowColor = 'rgba(255,60,60,0.7)'; ctx.shadowBlur = 50; ctx.fillText('TALES', 0, 80);
  ctx.restore();
}
function brandFace(cx, cy, s, f, talk) {
  CZ = 1;
  const o = { x: cx, y: cy + 775 * s, s, kind: 'double', skin: '#c98d62', hair: '#1d1420', hairStyle: 'spiky', outfit: 'shirt',
    mouth: 'grin', grin: 1, brow: 'sly', pupil: 16, circles: 0.55, lid: 0.12, seed: 4 };
  if (talk) { o.grin = 0.75 + 0.25 * Math.abs(Math.sin(f * 0.9)); o.bob = Math.sin(f * 0.9) * 8; o.tilt = Math.sin(f * 0.45) * 0.05; }
  guy(o);
}
function drawIntro(f) {
  const t = f / Math.max(1, INTRO);
  ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, W, H);
  const on = f < 3 ? (f % 2 ? 1 : 0.15) : 1;                      // flicker on
  brandTitle(W / 2, H / 2, (FORMAT === 'landscape' ? 1.25 : 1.0) * (1 + 0.06 * t), on * (1 - ss(seg(t, 0.82, 1))), f < 5 ? (rnd(f) - 0.5) * 40 : 0);
  if (f < 6) glitch(0.9);
  vignette(0.8, 0.3); grain(0.1);
}
function drawOutro(f) {
  const t = f / Math.max(1, OUTRO);
  ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, W, H);
  const land = FORMAT === 'landscape';
  const cx = land ? W * 0.25 : W / 2, cy = land ? H * 0.5 : H * 0.34, R = land ? 320 : 360;
  const zoom = 1 + 0.08 * ss(t);
  ctx.save();                                   // round logo: the grinning face in green night vision
  ctx.beginPath(); ctx.arc(cx, cy, R * zoom, 0, 7); ctx.clip();
  const g = ctx.createRadialGradient(cx, cy - 40, 40, cx, cy, R * 1.3); g.addColorStop(0, '#2f5a45'); g.addColorStop(1, '#0b1612');
  ctx.fillStyle = g; ctx.fillRect(cx - R * 1.5, cy - R * 1.5, R * 3, R * 3);
  brandFace(cx, cy + 30 * R / 360, 1.45 * (R / 360) * zoom, f, f > 6 && t < 0.85);
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#9fe8b0'; ctx.fillRect(cx - R * 1.5, cy - R * 1.5, R * 3, R * 3);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = cy - R * 1.5 + (f * 2) % 7; y < cy + R * 1.5; y += 7) ctx.fillRect(cx - R * 1.5, y, R * 3, 2);
  ctx.restore();
  ctx.save(); ctx.lineWidth = 10; ctx.strokeStyle = '#ff4a4a'; ctx.shadowColor = 'rgba(255,60,60,0.8)'; ctx.shadowBlur = 40;
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(f * 0.4); ctx.beginPath(); ctx.arc(cx, cy, R * zoom + 6, 0, 7); ctx.stroke(); ctx.restore();
  brandTitle(land ? W * 0.69 : W / 2, land ? H * 0.42 : H * 0.69, land ? 0.95 : 0.95, ss(seg(t, 0.05, 0.25)), 0);
  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 46px "DejaVu Sans Mono"'; ctx.fillStyle = '#b9c9bf';
  ctx.globalAlpha = ss(seg(t, 0.25, 0.45));
  ctx.fillText('NEW HORROR EVERY DAY', land ? W * 0.69 : W / 2, land ? H * 0.68 : H * 0.81); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, cx, cy, 520, '#ff3b3b', 0.08 + 0.06 * Math.sin(f * 0.5)); ctx.restore();
  if (f < 5) staticNoise(0.7 * (1 - f / 5));
  if (t > 0.9) { glitch(1.2); staticNoise(seg(t, 0.9, 1)); }
  vignette(0.85, 0.25); grain(0.1);
}

function seriesLabel(f, sh) {       // small corner tag: ● THE 14TH STAIR · PART 1 / YOUR STAIRS
  const S = P.series, k = W / 1080;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.92; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = '#e5333b'; ctx.beginPath(); ctx.arc(46 * k, 82 * k, 9 * k, 0, 7); ctx.fill();
  ctx.font = `bold ${30 * k}px "DejaVu Sans"`; ctx.fillStyle = '#e8e2d8';
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8 * k;
  ctx.fillText(`${S.name}  ·  PART ${S.part}`, 66 * k, 82 * k);
  if (sh.place) { ctx.font = `${24 * k}px "DejaVu Sans"`; ctx.fillStyle = '#aab0c4'; ctx.fillText(sh.place, 46 * k, 120 * k); }
  ctx.restore();
}
function drawOnscreen(f, sh) {     // the hook text for the first seconds: different words from the spoken line
  const t = f - sh.a; if (t > 75) return;
  const a = clamp(t / 4) * (1 - clamp((t - 66) / 9));
  const vert = H > W, size = (vert ? 84 : 64) * (W / (vert ? 1080 : 1920));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
  ctx.font = `900 ${size}px "DejaVu Sans"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const words = sh.onscreen.split(' '), lines = []; let cur = '';
  for (const w of words) { const tt = cur ? cur + ' ' + w : w; if (ctx.measureText(tt).width > W * 0.86) { lines.push(cur); cur = w; } else cur = tt; }
  lines.push(cur);
  const y0 = H * (vert ? 0.17 : 0.14), sc = 1 + 0.12 * (1 - clamp(t / 6));
  ctx.translate(W / 2, y0); ctx.scale(sc, sc);
  lines.forEach((l, i) => { const y = i * size * 1.12; ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#0b0910'; ctx.strokeText(l, 0, y);
    ctx.fillStyle = i === lines.length - 1 ? '#ffd53d' : '#ffffff'; ctx.fillText(l, 0, y); });
  ctx.restore();
}
function drawCaptions(f, sh, cam) {     // big word-by-word captions, key words in yellow
  const caps = sh.caps; if (!caps || !caps.length) return;
  const chunks = []; let cur = [];
  caps.forEach((w, i) => { cur.push(w); const end = /[.,!?…]$/.test(w[2]) || cur.length === 3 || i === caps.length - 1; if (end) { chunks.push(cur); cur = []; } });
  const ch = chunks.find(c => f >= c[0][0] - 1 && f <= c[c.length - 1][1] + 6);
  if (!ch) return;
  const vert = H > W, size = (vert ? 92 : 70) * (W / (vert ? 1080 : 1920));
  const pop = 1 + 0.14 * (1 - clamp((f - ch[0][0]) / 4));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `900 ${size}px "DejaVu Sans"`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
  const words = ch.map(w => w[2].toUpperCase().replace(/^["“]|["”]$/g, ''));
  const gap = size * 0.28, widths = words.map(t => ctx.measureText(t).width);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  // vertical: inside the band phone apps leave clear (168-1330 px of 1920) and left of the like/share rail
  // on painted places the words sit above his head in wide shots, and below his face when the camera is close
  const cy = H * (vert ? (sh.scene === 'plate' ? ((cam && cam.z > 1.25) ? 0.74 : 0.32) : 0.66) : 0.84), fit = Math.min(1, W * (vert ? 0.8 : 0.88) / total);
  ctx.translate(vert ? W * 0.46 : W / 2, cy); ctx.scale(pop * fit, pop * fit);
  let x = -total / 2;
  ch.forEach((w, i) => {
    ctx.globalAlpha = 1;
    ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#0b0910'; ctx.strokeText(words[i], x, 0);
    ctx.fillStyle = w[3] ? '#ffd53d' : '#ffffff'; ctx.fillText(words[i], x, 0);
    x += widths[i] + gap;
  });
  ctx.restore();
}

function selfieUI(f, sh) {         // the phone's camera view around the selfie, gone once the photo is taken
  const live = sh.beat == null || f < sh.beat;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (live) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, 70); ctx.fillRect(0, H - 150, W, 150);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(W / 2, H - 75, 48, 0, 7); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(W / 2, H - 75, 38, 0, 7); ctx.fill();
    ctx.font = 'bold 30px "DejaVu Sans"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffd34a'; ctx.fillText('PHOTO', W / 2 + 200, H - 75);
    ctx.fillStyle = '#fff'; ctx.fillText('1x', W / 2 - 200, H - 75);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    for (const k of [1, 2]) { ctx.beginPath(); ctx.moveTo(W * k / 3, 70); ctx.lineTo(W * k / 3, H - 150); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 70 + (H - 220) * k / 3); ctx.lineTo(W, 70 + (H - 220) * k / 3); ctx.stroke(); }
  } else {
    ctx.strokeStyle = '#f4f1ea'; ctx.lineWidth = 26; ctx.strokeRect(13, 13, W - 26, H - 26);
  }
  ctx.restore();
}

// ---------- film mode: 2.39:1 letterbox, quiet subtitles in the bar, title cards ----------
const BAR = P.film ? Math.round((H - W / 2.39) / 2) : 0;
function filmSubs(f, sh) {
  if (!sh.caps || !sh.caps.length || sh.nosubs) return;
  const a = sh.caps[0][0] - 2, b = sh.caps[sh.caps.length - 1][1] + 8;
  if (f < a || f > b) return;
  const words = sh.caps.map(w => w[2]).join(' ');
  const al = clamp((f - a) / 4) * (1 - clamp((f - b + 4) / 4));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = al;
  ctx.font = `${sh.subItalic ? 'italic ' : ''}38px "DejaVu Sans"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = sh.subCol || '#ecebe6'; ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6;
  const lines = []; let cur = '';
  for (const w of words.split(' ')) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > W * 0.8) { lines.push(cur); cur = w; } else cur = t; }
  lines.push(cur);
  const y0 = H - BAR / 2 - (lines.length - 1) * 23;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * 46));
  ctx.restore();
}
function titleCard(f, sh) {
  const tc = sh.titleCard, t = (f - sh.a) / Math.max(1, sh.b - sh.a);
  const al = ss(clamp(t / 0.25)) * (1 - ss(clamp((t - 0.75) / 0.25)));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = al; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e9e4da'; ctx.font = `${Math.round(W / 26)}px "DejaVu Serif"`;
  const sp = tc.text.split('').join(String.fromCharCode(8202));
  ctx.fillText(sp, W / 2 + (rnd(f) - 0.5) * 2 * (t < 0.3 ? 1 : 0), H / 2 - 10);
  if (tc.sub) { ctx.font = `${Math.round(W / 70)}px "DejaVu Sans"`; ctx.fillStyle = '#9a958c'; ctx.fillText(tc.sub, W / 2, H / 2 + W / 30); }
  ctx.restore();
}
function letterbox() { if (!BAR) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, BAR); ctx.fillRect(0, H - BAR, W, BAR); ctx.restore(); }

window.renderFrame = function (f) {
  F = f; ctx = MAIN;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (f < INTRO) {
    if (P.coldOpen == null) return drawIntro(f);
    COLD = true; window.renderFrame(P.coldOpen); COLD = false; F = f; ctx = MAIN; hookCard(f); return;
  }
  if (OUTRO && f >= END) return drawOutro(f - END);
  const shots = P.shots;
  const sh = shots.find(s => f >= s.a && f < s.b) || shots[shots.length - 1];
  const S = SCENES[sh.scene] || SCENES.closeup;
  const c = camFor(S, sh, f);
  withCam(c, () => S.draw(f, sh));
  let amb = S.ambient;
  if (sh.scene === 'cctv' && sh.room === 'bedroom') amb = '#9aa2c4';   // night vision sees the bedroom
  if (S.ambientOn && (sh.scene === 'kitchen' || sh.scene === 'cctv') && (sh.room || 'kitchen') === 'kitchen') {
    const lit = kitchenLight(sh.scene === 'cctv' ? Object.assign({ light: 'dark' }, sh) : sh, f);
    if (lit > 0.5) amb = S.ambientOn;
  }
  lightPass(c, amb, l => S.lights(l, f, sh));
  const as = ambientScale(sh, f);
  if (as < 1 && sh.scene !== 'kitchen' && sh.scene !== 'cctv') flash(1 - as, '#05030c');
  if (S.glow) glowAdd(c, ...S.glow);
  if (sh.scene === 'cctv') { cctv(f); cctvOverlay(f, sh); }
  else { dust(f, sh); grade(0.92, 1.08, 1.0); vignette(0.7, 0.35); }
  // transitions & accents
  if (sh.jump) flash(1 - seg(f, sh.a, sh.a + 7));
  if (INTRO && sh === shots[0]) flash(1 - seg(f, INTRO, INTRO + 6), '#000');
  if (sh.react === 'appear' && sh.beat != null && f >= sh.beat && f < sh.beat + 5) glitch(0.8);
  if (sh.twist && sh.beat != null && f >= sh.beat && f < sh.beat + 6) { glitch(1.2); flash(0.25 * (1 - bT(f, sh, 6))); }
  if (sh.scene === 'cctv' && f < sh.a + 6 && sh.a > 0 && (shots[shots.indexOf(sh) - 1] || {}).scene !== 'cctv') staticNoise(0.8 * (1 - seg(f, sh.a, sh.a + 6)));
  if (sh.scene === 'selfie') selfieUI(f, sh);
  if (sh.flashback) {                // flashback: drained, sepia, flickering like old film
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,0.85)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#c8a878'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(255,240,210,${0.05 + 0.05 * rnd(f)})`; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (sh.vig) {                      // heavy vignette closing in on dark shots
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${sh.vig})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (sh.fadeIn) flash(1 - ss(seg(f, sh.a, sh.a + sh.fadeIn)), '#000');
  if (sh.fadeOut) flash(ss(seg(f, sh.b - sh.fadeOut, sh.b)), '#000');
  if (sh.titleCard) titleCard(f, sh);
  if (P.film && ['shutter', 'timer'].includes(sh.react) && sh.beat != null && f >= sh.beat && f < sh.beat + 10) flash(1 - (f - sh.beat) / 10);
  if (sh.whiteout && sh.beat != null && f >= sh.beat) flash(0.95 * ss(bT(f, sh, 24)), '#fffaf0');
  if (P.film) { staticNoise(seg(f, END - 14, END - 1) * 0.9); grain(0.09); letterbox(); filmSubs(f, sh); return; }
  if (P.series) seriesLabel(f, sh);
  if (P.captions && !COLD) drawCaptions(f, sh, c);
  if (sh.onscreen) drawOnscreen(f, sh);
  if (sh.choices) choiceCard(f, sh);
  if (sh.react === 'shutter' && sh.beat != null && f >= sh.beat && f < sh.beat + 8) flash(1 - (f - sh.beat) / 8);
  if (sh.blackout && sh.le != null && f >= sh.le - sh.blackout) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore(); return; }
  staticNoise(seg(f, END - 14, END - 1) * 0.9);
  grain(sh.scene === 'cctv' ? 0.05 : 0.08);
};
(function () {                  // ready once every plate image has decoded
  const list = Object.entries(P.plates || {}).map(([k, v]) => [k, v, PLATES]).concat(Object.entries(P.props || {}).map(([k, v]) => [k, v, PROPS_IMG]));
  if (!list.length) { window.ready = true; return; }
  let left = list.length;
  for (const [k, src, into] of list) { const im = new Image(); im.onload = im.onerror = () => { into[k] = im.width ? im : null; if (--left === 0) window.ready = true; }; im.src = src; }
})();
