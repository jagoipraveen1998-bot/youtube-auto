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
};
const ex = n => Object.assign({}, EXPR[n] || EXPR.calm);
const bT = (f, sh, len = 8) => sh.beat == null ? 0 : clamp((f - sh.beat) / len);
const after = (f, sh) => sh.beat != null && f >= sh.beat;

function heroObj(sh, f, base) {
  if (!sh.hero) return null;
  const h = sh.hero;
  const o = Object.assign({ skin: HERO.skin, hair: HERO.hair, hairStyle: HERO.hairStyle, outfit: HERO.outfit, seed: 1 }, base, ex(h.expr || 'worried'));
  if (h.look != null) o.look = h.look;
  if (h.pose === 'sleep') Object.assign(o, ex('asleep'), { tilt: 0.25 });
  if (sh.react === 'jolt' && after(f, sh)) {
    const t = bT(f, sh, 9);
    Object.assign(o, ex(h.expr2 || 'shock'));
    o.hairUp = (o.hairUp || 0) + 0.8 * back(t); o.eyeW = (o.eyeW || 1) * (1 + 0.1 * back(t)); o.tremble = Math.max(o.tremble || 0, 8);
    if (h.pose !== 'sleep' && !base.noLegs) { o.armL = lerp(0.22, 2.7, back(t)); o.armR = o.armL; }
  } else if (h.expr2 && after(f, sh)) Object.assign(o, ex(h.expr2));
  if (h.pose === 'cheeks') { o.armL = 2.85; o.armR = 2.85; o.armsFront = true; }
  if (h.pose === 'reach') o.armR = lerp(0.22, 1.75, ss(seg(f, sh.a + 6, sh.a + 24)));
  o.blink = Math.max(o.blink || 0, (o.lid || 0) > 0.9 ? 0 : blinkAt(f, 2));
  o.bob = (o.bob || 0) + Math.sin(f * 0.15) * 3;
  return o;
}

function otherObj(sh, f, base) {
  const st = (sh.other && sh.other.state) || 'hidden';
  if (st === 'hidden') return null;
  const o = Object.assign({ kind: OTHER.kind, outfit: OTHER.kind === 'double' ? OTHER.outfit : undefined, skin: HERO.skin, hair: HERO.hair,
    hairStyle: HERO.hairStyle, seed: 3 }, base);
  const map = { back: 'stare', front: 'stare', stare: 'stare', grin: 'grin', tired: 'tired', lurk: 'stare' };
  Object.assign(o, ex(map[st] || 'stare'));
  o.turn = st === 'back' ? 0 : 1;
  const r = sh.react;
  if (r === 'turn') { o.turn = ss(bT(f, sh, 12)); if (after(f, sh) && st !== 'tired') Object.assign(o, ex('grin'), { grin: ss(seg(f, sh.beat + 10, sh.beat + 22)) }); }
  if (r === 'grin') { Object.assign(o, ex('grin')); o.grin = ss(bT(f, sh, 12)); if (!after(f, sh)) Object.assign(o, ex('stare')); }
  if (r === 'droop') { const d = ss(bT(f, sh, 14)); o.lid = 0.5 * d; o.circles = d; o.brow = d > 0.4 ? 'tired' : o.brow; o.mouth = d > 0.4 ? 'droop' : o.mouth; o.tilt = 0.1 * back(bT(f, sh, 10)); }
  if (r === 'appear') o.alpha = after(f, sh) ? ss(bT(f, sh, 6)) : 0;
  if (r === 'vanish') o.alpha = after(f, sh) ? 1 - ss(bT(f, sh, 5)) : 1;
  if (st === 'lurk') o.alpha = Math.min(o.alpha ?? 1, 0.9);
  if (o.kind === 'ghost') o.alpha = (o.alpha ?? 1) * (0.78 + 0.08 * Math.sin(f * 0.2));
  o.blink = o.kind === 'double' ? blinkAt(f, 5) : 0;
  o.bob = Math.sin(f * 0.07) * 2;
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

const SCENES = {
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
    otherFrame(sh) { return (sh.cam === 'close' || sh.cam === 'snap') ? [620, 1110, 3.2] : [620, 1150, 1.6]; },
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
  if (name === 'other' && S.otherFrame) return S.otherFrame(sh);
  if (name === 'hero' && S.heroFrame) return S.heroFrame(sh);
  return S.frames[name] || S.frames.hero || S.frames.wide;
}
function camFor(S, sh, f) {
  const t = f - sh.a, dur = Math.max(1, sh.b - sh.a);
  const wide = S.frames.wide, foc = framesFor(S, sh, sh.focus || (sh.hero ? 'hero' : 'other'));
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
    default: K = [k(0, wide), k(dur, foc)];
  }
  let c = keys(K, t);
  c = creep(c, t, 0.8);
  if (sh.twist) c.r += 3 * ss(seg(t, 0, dur));
  if (sh.beat != null && ['jolt', 'knock', 'appear', 'ring', 'lights_on'].includes(sh.react)) c = kick(c, f, sh.beat, 16, 7);
  if (sh.react === 'knock') { c = kick(c, f, sh.beat + 9, 12, 6); c = kick(c, f, sh.beat + 18, 12, 6); }
  return c;
}

// ---------- frame ----------
function cctvOverlay(f, sh) {
  const t = sh.text || {};
  const sw = sh.react === 'text_change' && after(f, sh);
  const g = sh.react === 'text_change' && sh.beat != null && f >= sh.beat - 2 && f < sh.beat + 3;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(235,255,238,0.92)'; ctx.font = 'bold 54px "DejaVu Sans Mono"'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6;
  ctx.fillText(t.label || 'CAM 01', 70, 150);
  if (Math.floor(f / 15) % 2 === 0) { ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.arc(820, 178, 18, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(235,255,238,0.92)'; ctx.fillText('REC', 850, 150);
  const sec = String(Math.floor((f - sh.a) / 30) % 60).padStart(2, '0');
  const time = (sw ? t.time2 : t.time) || '03:00';
  ctx.fillStyle = sw ? '#ff7a7a' : 'rgba(235,255,238,0.92)';
  ctx.fillText(`${time}:${sec}`, 70 + (g ? (rnd(f) - 0.5) * 30 : 0), 1700);
  ctx.restore();
  if (g) glitch(1.0);
}

window.renderFrame = function (f) {
  F = f; ctx = MAIN;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const shots = P.shots;
  const sh = shots.find(s => f >= s.a && f < s.b) || shots[shots.length - 1];
  const S = SCENES[sh.scene] || SCENES.closeup;
  const c = camFor(S, sh, f);
  withCam(c, () => S.draw(f, sh));
  let amb = S.ambient;
  if (S.ambientOn && (sh.scene === 'kitchen' || sh.scene === 'cctv') && (sh.room || 'kitchen') === 'kitchen') {
    const lit = kitchenLight(sh.scene === 'cctv' ? Object.assign({ light: 'dark' }, sh) : sh, f);
    if (lit > 0.5) amb = S.ambientOn;
  }
  lightPass(c, amb, l => S.lights(l, f, sh));
  const as = ambientScale(sh, f);
  if (as < 1 && sh.scene !== 'kitchen' && sh.scene !== 'cctv') flash(1 - as, '#05030c');
  if (S.glow) glowAdd(c, ...S.glow);
  if (sh.scene === 'cctv') { cctv(f); cctvOverlay(f, sh); }
  else { grade(0.92, 1.08, 1.0); vignette(0.7, 0.35); }
  // transitions & accents
  if (sh.jump) flash(1 - seg(f, sh.a, sh.a + 7));
  if (sh === shots[0]) flash(1 - seg(f, 0, 6), '#000');
  if (sh.react === 'appear' && sh.beat != null && f >= sh.beat && f < sh.beat + 5) glitch(0.8);
  if (sh.twist && sh.beat != null && f >= sh.beat && f < sh.beat + 6) { glitch(1.2); flash(0.25 * (1 - bT(f, sh, 6))); }
  if (sh.scene === 'cctv' && f < sh.a + 6 && sh.a > 0 && (shots[shots.indexOf(sh) - 1] || {}).scene !== 'cctv') staticNoise(0.8 * (1 - seg(f, sh.a, sh.a + 6)));
  staticNoise(seg(f, N - 14, N - 1) * 0.9);
  grain(sh.scene === 'cctv' ? 0.05 : 0.08);
};
window.ready = true;
