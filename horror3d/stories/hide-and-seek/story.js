// "My Cousin's Friend Was Hiding Since Morning": the kid's bedroom set (sets.js) with a tall two-door
// cupboard built against the back wall. You babysit, he hides under the bed, the cupboard is empty...
// then two voices count from inside it and the doors close by themselves.
import * as SETS from './sets.js';
import { OUTFITS } from './toon.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const B = [-40, 0, 0], W0 = (x, y, z) => [B[0] + x, B[1] + y, B[2] + z];
const COUSIN = { ...OUTFITS.kid, tunic: '#e0a030', hair: '#3a2418' };          // the little cousin: yellow jumper
const GIRL = { ...OUTFITS.marlow, tunic: '#cfd6e6', dress: '#cfd6e6', skin: '#dfe4ee', hair: '#141218' };   // the friend in the cupboard
// spots (bedroom-local numbers, see SETS.bedroom)
const CUP = W0(1.15, 1.05, -1.47), CUPIN = W0(1.15, 1.2, -1.85), YOU = W0(0.35, 0, 0.45), YOUC = W0(0.75, 0, -0.55), KID0 = W0(-0.35, 0, 0.7),
  UNDER = W0(-0.45, 0, -1.02), KIDOUT = W0(-0.15, 0, -0.55);

const IDS = ['babysit', 'count', 'under', 'giggle', 'nobody', 'point', 'open', 'gone', 'counting', 'close', 'end'];
const CAMS = {
  babysit: [{ pos: W0(-0.2, 1.5, 2.15), look: W0(0.0, 0.95, 0.0), fov: 54 }, { pos: W0(-0.1, 1.45, 1.95), look: W0(0.0, 0.95, 0.0), fov: 48 }],
  count: [{ pos: W0(-0.4, 1.3, 1.9), look: W0(0.35, 1.1, 0.45), fov: 40 }, { pos: W0(-0.6, 1.3, 1.7), look: W0(0.1, 0.9, 0.1), fov: 44 }],
  under: [{ pos: W0(-0.25, 0.34, 0.55), look: W0(-0.45, 0.16, -1.4), fov: 44 }, { pos: W0(-0.32, 0.3, 0.2), look: W0(-0.45, 0.16, -1.4), fov: 38 }],
  giggle: [{ pos: W0(-0.36, 0.3, 0.05), look: W0(-0.45, 0.18, -1.2), fov: 38 }, { pos: W0(-0.4, 0.28, -0.1), look: W0(-0.45, 0.18, -1.2), fov: 33 }],
  nobody: [{ pos: W0(-0.6, 1.25, 1.45), look: W0(0.35, 1.1, 0.4), fov: 38 }, { pos: W0(-0.5, 1.25, 1.25), look: W0(0.35, 1.12, 0.4), fov: 34 }],
  point: [{ pos: W0(-1.2, 1.0, 0.8), look: W0(0.6, 1.0, -1.3), fov: 46 }, { pos: W0(-1.0, 1.05, 0.5), look: W0(0.9, 1.1, -1.4), fov: 40 }],
  open: [{ pos: W0(0.1, 1.35, 0.9), look: CUP, fov: 44 }, { pos: W0(0.35, 1.3, 0.5), look: CUPIN, fov: 40 }],
  gone: [{ pos: W0(1.2, 1.35, -1.25), look: W0(0.0, 1.0, 0.9), fov: 50 }, { pos: W0(1.2, 1.35, -1.25), look: W0(-0.5, 0.9, 1.1), fov: 56 }],
  counting: [{ pos: W0(1.0, 1.2, -0.2), look: W0(1.15, 0.85, -1.8), fov: 44 }, { pos: W0(1.08, 1.1, -0.65), look: W0(1.15, 0.8, -1.8), fov: 36 }],
  close: [{ pos: W0(-0.2, 1.4, 1.3), look: CUP, fov: 46 }, { pos: W0(0.0, 1.35, 1.0), look: CUP, fov: 42 }],
  end: [{ pos: W0(1.15, 1.05, 0.1), look: W0(1.15, 0.8, -1.5), fov: 44 }, { pos: W0(1.15, 0.95, -0.3), look: W0(1.15, 0.72, -1.5), fov: 38 }],
};
const LIGHTS = {
  warm: { ...MOODS.night, hemi: 0.85, sky: '#a8a0c0', ground: '#2c2630', fog: '#1a1820', fogNear: 9, fogFar: 32, gain: '#fff2e6', lift: '#050405', vig: 0.32 },
  cold: { ...MOODS.dread, hemi: 0.6, fogNear: 7, fogFar: 26, vig: 0.58 },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.i >= 7 ? 'cold' : 'warm'),
  tweak: (L, S) => { if (S.id === 'end') L.vig = 0.75; },
  kicks: ['counting', 'close'],
  focus: (S) => ({ babysit: YOU, count: W0(0.35, 1.1, 0.45), under: UNDER, giggle: W0(-0.45, 0.2, -1.05), nobody: W0(0.35, 1.12, 0.45), point: W0(-0.15, 0.9, -0.55),
    open: CUPIN, gone: W0(0.75, 1.1, -0.55), counting: CUPIN, close: CUP, end: CUP }[S.id]),
  shadowAt: () => W0(0.3, 0.8, -0.4),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, camAt, dofAt } = K;
export { LIGHTS };

// ---------- the set: bedroom + a two-door cupboard on the back wall ----------
export const build = (ctx) => {
  const { THREE, add, box, toon } = ctx;
  SETS.houseLightsOff(ctx);
  const br = SETS.bedroom(ctx, { at: B });
  const G = new THREE.Group(); G.position.set(...B); ctx.world.add(G);
  const wood = toon({ color: '#7a4a2e' }), dark = new THREE.MeshBasicMaterial({ color: '#06050a' });
  const X0 = 0.6, X1 = 1.7, Z0 = -2.09, Z1 = -1.48, H = 2.15;
  add(box(0.05, H, Z1 - Z0), wood, X0, H / 2, (Z0 + Z1) / 2, G); add(box(0.05, H, Z1 - Z0), wood, X1, H / 2, (Z0 + Z1) / 2, G);
  add(box(X1 - X0 + 0.05, 0.06, Z1 - Z0), wood, (X0 + X1) / 2, H, (Z0 + Z1) / 2, G); add(box(X1 - X0, 0.08, Z1 - Z0), wood, (X0 + X1) / 2, 0.04, (Z0 + Z1) / 2, G);
  add(box(X1 - X0, H, 0.02), dark, (X0 + X1) / 2, H / 2, Z0 + 0.02, G, { cast: false }).userData.ndSkip = true;    // the dark inside
  add(new THREE.CylinderGeometry(0.012, 0.012, X1 - X0, 6), toon({ color: '#8a8a90' }), (X0 + X1) / 2, 1.85, -1.8, G).rotation.z = Math.PI / 2;
  const coats = [];
  for (const [x, c, l] of [[0.78, '#3a4a6a', 0.95], [0.97, '#7a2a2a', 1.05], [1.18, '#3a5a3a', 0.9], [1.4, '#5a4a3a', 1.0], [1.58, '#2a2a34', 0.95]]) {
    const g = new THREE.Group(); g.position.set(x, 1.84, -1.8); G.add(g);
    add(box(0.08, l, 0.34), toon({ color: c }), 0, -l / 2, 0, g); add(box(0.16, 0.05, 0.34), toon({ color: c }), 0, -0.03, 0, g);
    coats.push(g);
  }
  const door = (hx, w, sgn) => {
    const h = new THREE.Group(); h.position.set(hx, 0.05, Z1 + 0.02); G.add(h);
    add(box(w, H - 0.1, 0.04), wood, sgn * w / 2, (H - 0.1) / 2, 0, h);
    for (const y of [0.5, 1.4]) add(box(w * 0.7, 0.62, 0.012), toon({ color: '#8c5a3a' }), sgn * w / 2, y, 0.026, h);
    add(box(0.03, 0.14, 0.04), toon({ color: '#d9a845' }), sgn * (w - 0.06), 1.0, 0.04, h);
    return h;
  };
  const dL = door(X0 + 0.02, (X1 - X0) / 2 - 0.02, 1), dR = door(X1 - 0.02, (X1 - X0) / 2 - 0.02, -1);
  const glow = new THREE.PointLight('#8fa4ff', 0, 3.2, 1.4); glow.position.set(1.15, 1.4, -1.25); G.add(glow);
  return { br, dL, dR, coats, glow };
};
export const update = (W, f, P) => {
  if (!P.br) return;
  P.br.state(W, f);
  P.dL.rotation.y = -W.cup; P.dR.rotation.y = W.cup * (W.rightLag ?? 1);
  P.glow.intensity = W.glow ?? 0;
  P.coats.forEach((c, i) => { c.rotation.x = Math.sin(f * 0.07 + i * 1.3) * 0.05 * (W.sway ?? 0); });
};
export const worldAt = (f) => {
  const S = shotAt(f), i = S.i, id = S.id;
  const W = { door: 0, beep: -1, unlocked: false, lamp: 1.1, moon: 0.6, street: 1.0, headlights: 0, car: false, cup: 0, sway: 0, motes: false, gap: false, feet: false, wind: 0 };
  if (id === 'open') W.cup = lerp(0, 1.25, smooth(ramp(f, S.a + 6, S.beat)));
  if (i >= 7) { W.cup = 1.25; W.lamp = 0.75; W.moon = 0.5; W.glow = 0.9; }
  if (id === 'counting') { W.sway = smooth(ramp(f, S.beat - 10, S.beat + 10)); W.lamp = f >= S.beat && (f % 9 < 2) ? 0.2 : 0.7; W.glow = 1.6; }
  if (id === 'close') { const t = smooth(ramp(f, S.beat - 3, S.beat + 5)); W.cup = lerp(1.25, 0, t); W.rightLag = 1; W.lamp = 0.45; }
  if (id === 'end') { W.cup = f >= S.beat ? lerp(0, 0.42, smooth(ramp(f, S.beat, S.beat + 12))) : 0; W.rightLag = 1; W.lamp = 0.55; W.moon = 0.45; W.glow = 1.2; }
  return W;
};

// ---------- the cast ----------
const YS = 0.84, CS = 0.58;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const you = (expr, o = {}, pos = YOU) => out.push(actor(T, 'sitter', { seed: 14, expr, blink: blinkAt(f, 14), ...o }, pos, { s: YS }));
  const kid = (expr, o = {}, pos = KID0, extra = {}) => out.push(actor(T, COUSIN, { seed: 23, expr, blink: blinkAt(f, 23), ...o, who: 'cousin' }, pos, { s: CS, ...extra }));
  if (id === 'babysit') { you('smile', { look: -0.3 }); kid('grin', { look: 0.4, R: 'wave' }); }
  if (id === 'count') {
    you('sleep', { L: 'cheek', R: 'cheek' });                                    // eyes shut, counting
    const t = smooth(ramp(f, S.a + 6, S.b - 6)); kid('grin', { step: q((f * 0.06) % 1, 2), look: -0.6 }, lerp3(KID0, UNDER, t), { s: CS * lerp(1, 0.9, t) });
  }
  if (id === 'under' || id === 'giggle') {                                      // only his head peeks out from under the bed
    const peek = id === 'under' ? smooth(ramp(f, S.a + 4, S.beat)) : 1;
    kid(id === 'giggle' ? (f < S.beat ? 'laugh' : 'grin') : 'grin', { look: 0.1, headTilt: id === 'giggle' ? Math.round(5 * Math.sin(f * 0.5)) : 0 }, [UNDER[0], -0.86 + 0.06 * peek, UNDER[2] + 0.02], { blob: false, shadow: false });
  }
  if (id === 'nobody') { you(f < S.beat ? 'smile' : 'neutral', { look: -0.4, R: 'hip' }); kid('neutral', { look: 0.4 }, KIDOUT); }
  if (id === 'point') { kid(f < S.beat ? 'neutral' : 'creepy', { look: 0.8, R: 'point', blink: f >= S.beat ? 0 : blinkAt(f, 23) }, KIDOUT); you('wary', { look: 0.6 }, YOUC); }
  if (id === 'open') { you(f < S.beat ? 'wary' : 'neutral', { look: 0.5, R: 'reach' }, W0(0.25, 0, -0.75)); kid('creepy', { look: 0.7, blink: 0 }, KIDOUT); }
  if (id === 'gone') you(f < S.beat ? 'laugh' : 'scared', { look: -0.5, blink: f >= S.beat ? 0 : blinkAt(f, 14) }, W0(0.35, 0, -0.2));
  if (id === 'close') you('scared', { look: 0.6, blink: 0 }, W0(-0.15, 0, -0.2), { s: YS });
  return out;
};
const eyes = (open, col = 'rgba(255,240,200,') => (p) => { const g = p.g; g.save(); g.globalCompositeOperation = 'lighter';
  for (const x of [262, 338]) { const gr = g.createRadialGradient(x, 470, 0, x, 470, 42); gr.addColorStop(0, col + '0.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - 42, 428, 84, 84); g.fillStyle = '#fffbe8'; g.beginPath(); g.ellipse(x, 470, 11, 11 * open, 0, 0, 7); g.fill(); } g.restore(); };
export const fxAt = (f) => {
  const S = shotAt(f), out = [];
  if (S.id === 'counting' && f >= S.beat - 4) {                                // two pairs of eyes between the coats: one low (him), one taller (her)
    const o = q(Math.min(1, (f - S.beat + 4) / 10), 1);
    out.push(fx('e1' + o, eyes(o), W0(0.98, 0.2, -1.7), 0.42)); out.push(fx('e2' + o, eyes(o, 'rgba(200,220,255,'), W0(1.2, 0.36, -1.6), 0.46));
    const d = f - S.beat; if (d >= 0 && d < 40) { const n = d < 14 ? 'ONE' : d < 27 ? 'TWO' : 'THREE', t = q(((d < 14 ? d : d < 27 ? d - 14 : d - 27)) / 13); out.push(fx('cnt' + n + t, word(n, t, '#dfe6ff'), W0(1.15, 1.75, -1.4), 0.42)); }
  }
  if (S.id === 'close') { const d = f - S.beat - 4; if (d >= 0 && d < 18) { const t = q(d / 18); out.push(fx('slam' + t, word('SLAM', t, '#ffd23f'), W0(1.15, 1.8, -1.3), 0.5)); } }
  if (S.id === 'end' && f >= S.beat + 6) {                                    // through the crack: the same two pairs of eyes
    const o = q(Math.min(1, (f - S.beat - 6) / 8), 1);
    out.push(fx('x1' + o, eyes(o), W0(1.15, 0.12, -1.62), 0.34)); out.push(fx('x2' + o, eyes(o, 'rgba(200,220,255,'), W0(1.15, 0.42, -1.62), 0.36));
  }
  return out;
};
