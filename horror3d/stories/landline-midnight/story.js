// "My Dad Says Never Answer The Landline After Midnight": the bedroom set (sets.js) as the room with the old
// landline under the window. It rings at 12:01; your own voice says "Don't pick up". You slam it down, and
// your reflection in the dark window is still holding the phone.
import * as SETS from './sets.js';
import { OUTFITS } from './toon.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const B = [-40, 0, 0], W0 = (x, y, z) => [B[0] + x, B[1] + y, B[2] + z];
const YOU = { ...OUTFITS.kid, tunic: '#4a7ac0' };
const PH = W0(-2.05, 0.78, -0.05), KID = W0(-1.55, 0, -0.2), REFL = W0(-3.15, 0.14, -0.2), CLOCK = W0(-2.28, 1.85, 1.05);

const IDS = ['rule', 'never', 'rings', 'away', 'voice', 'dont', 'already', 'inside', 'slam', 'window', 'reflect'];
const CAMS = {
  rule: [{ pos: W0(0.9, 1.35, 1.5), look: W0(-1.2, 1.0, 0.2), fov: 50 }, { pos: W0(0.6, 1.3, 1.25), look: W0(-1.3, 1.0, 0.2), fov: 44 }],
  never: [{ pos: W0(-1.2, 1.25, 0.6), look: PH, fov: 36 }, { pos: W0(-1.45, 1.15, 0.4), look: PH, fov: 30 }],
  rings: [{ pos: W0(-1.2, 1.5, 0.6), look: CLOCK, fov: 34 }, { pos: W0(-1.2, 1.3, 0.6), look: PH, fov: 36 }],
  away: [{ pos: W0(0.4, 1.3, 1.2), look: W0(-1.6, 0.95, -0.1), fov: 46 }, { pos: W0(0.0, 1.25, 0.9), look: W0(-1.6, 0.95, -0.1), fov: 40 }],
  voice: [{ pos: W0(-0.8, 1.0, 0.6), look: W0(-1.55, 0.95, -0.2), fov: 36 }, { pos: W0(-0.95, 0.98, 0.45), look: W0(-1.55, 0.95, -0.2), fov: 32 }],
  dont: [{ pos: W0(-0.9, 1.0, 0.35), look: W0(-1.55, 0.95, -0.2), fov: 32 }, { pos: W0(-1.0, 0.98, 0.25), look: W0(-1.55, 0.95, -0.2), fov: 28 }],
  already: [{ pos: W0(-0.7, 1.05, 0.5), look: W0(-1.55, 0.95, -0.2), fov: 38 }, { pos: W0(-0.85, 1.0, 0.4), look: W0(-1.55, 0.95, -0.2), fov: 34 }],
  inside: [{ pos: W0(-0.95, 0.98, 0.3), look: W0(-1.55, 0.95, -0.2), fov: 30 }, { pos: W0(-1.05, 0.97, 0.2), look: W0(-1.55, 0.95, -0.2), fov: 26 }],
  slam: [{ pos: W0(-1.25, 1.2, 0.55), look: PH, fov: 36 }, { pos: W0(-1.35, 1.15, 0.45), look: PH, fov: 32 }],
  window: [{ pos: W0(-0.3, 1.25, 0.6), look: W0(-2.4, 1.15, -0.2), fov: 46 }, { pos: W0(-0.6, 1.2, 0.4), look: W0(-2.4, 1.15, -0.2), fov: 40 }],
  reflect: [{ pos: W0(-0.85, 1.2, 0.25), look: W0(-2.6, 1.05, -0.2), fov: 40 }, { pos: W0(-1.05, 1.18, 0.12), look: W0(-2.7, 1.05, -0.2), fov: 34 }],
};
const LIGHTS = {
  eve: { ...MOODS.night, hemi: 0.85, sky: '#c8b8b0', ground: '#3a2c28', gain: '#fff0dc', vig: 0.34 },
  night: { ...MOODS.night, hemi: 0.4, fog: '#05060c', fogNear: 5, fogFar: 20, vig: 0.6 },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.i === 0 ? 'eve' : 'night'),
  tweak: (L, S) => { if (S.id === 'reflect') L.vig = 0.75; },
  kicks: ['inside', 'reflect'],
  focus: (S) => ({ rule: W0(-1.2, 1.0, 0.2), never: PH, rings: PH, away: KID, voice: W0(-1.55, 0.95, -0.2), dont: W0(-1.55, 0.95, -0.2), already: W0(-1.55, 0.95, -0.2),
    inside: W0(-1.55, 0.95, -0.2), slam: PH, window: W0(-2.4, 1.15, -0.2), reflect: W0(-3.1, 1.05, -0.2) }[S.id]),
  shadowAt: () => W0(-1.5, 0.8, 0),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor, camAt, dofAt } = K;
export { LIGHTS };

const clockFace = (m) => (g, w, h) => { g.fillStyle = '#10140e'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff3a2a'; g.shadowColor = '#ff3a2a'; g.shadowBlur = 18;
  g.font = '700 ' + Math.floor(h * 0.62) + 'px "Courier New", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(m < 0 ? '11:' + String(60 + m).padStart(2, '0') : '12:' + String(m).padStart(2, '0'), w / 2, h / 2); };

// ---------- the set ----------
export const build = (ctx) => {
  const { THREE, add, box, toon } = ctx;
  SETS.houseLightsOff(ctx);
  const br = SETS.bedroom(ctx, { at: B });
  const G = new THREE.Group(); ctx.world.add(G);
  const tb = add(box(0.5, 0.06, 0.55), toon({ color: '#8a5a3a' }), 0, 0, 0, G); tb.position.set(...W0(-2.05, 0.72, -0.05));
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = add(box(0.04, 0.72, 0.04), toon({ color: '#6a4228' }), 0, 0, 0, G); l.position.set(...W0(-2.05 + dx * 0.2, 0.36, -0.05 + dz * 0.23)); }
  const phone = new THREE.Group(); phone.position.set(...PH); G.add(phone);
  const red = toon({ color: '#9a1e22' });
  add(box(0.2, 0.07, 0.17), red, 0, 0.035, 0, phone); add(box(0.1, 0.012, 0.1), toon({ color: '#e8e0d0' }), 0, 0.072, 0.02, phone);
  const hand = add(box(0.05, 0.04, 0.2), red, 0.0, 0.1, 0, phone);
  const clock = SETS.canvasPlane(ctx, 0.36, 0.16, 256, G, { lit: false }); clock.mesh.position.set(...CLOCK); clock.mesh.rotation.y = Math.PI / 2;
  return { br, phone, hand, clock };
};
export const update = (W, f, P) => {
  if (!P.br) return;
  P.br.state(W, f);
  P.phone.position.set(PH[0] + (W.ring ? Math.sin(f * 2.3) * 0.006 : 0), PH[1] + (W.ring && f % 4 < 2 ? 0.006 : 0), PH[2]);
  P.hand.visible = !W.lifted; P.hand.position.y = 0.1 + (W.ring && f % 3 === 0 ? 0.012 : 0);
  P.clock.draw('c' + W.min, clockFace(W.min));
};
export const worldAt = (f) => {
  const S = shotAt(f), i = S.i, id = S.id;
  const W = { door: 0, beep: -1, lamp: 0.25, moon: 0.35, street: 0.5, headlights: 0, car: false, ring: false, lifted: false, min: 1 };
  if (id === 'rule') { W.lamp = 1.0; W.min = -45; }
  if (id === 'never') W.min = f < S.beat ? -1 : 0;
  if (id === 'rings' || (id === 'away' && f < S.beat)) W.ring = true;
  if (id === 'away' && f >= S.beat) W.lifted = true;
  if (i >= 4 && i <= 7) W.lifted = true;
  if (id === 'slam') W.lifted = f < S.beat - 2;
  if (id === 'inside' && f >= S.beat) W.lamp = f % 7 < 3 ? 0 : 0.25;
  if (i >= 9) { W.lamp = 0.12; W.min = 4; }
  return W;
};

// ---------- the cast ----------
const KS = 0.62;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const you = (expr, o = {}, pos = KID, extra = {}) => out.push(actor(T, YOU, { seed: 31, expr, blink: blinkAt(f, 31), ...o, who: 'you' }, pos, { s: KS, ...extra }));
  const onPhone = { R: 'phone' };
  if (id === 'rule') { out.push(actor(T, 'dad', { seed: 12, expr: 'stern', blink: blinkAt(f, 12), look: -0.5, R: 'point' }, W0(-0.7, 0, 0.5), { s: 0.86 })); you('nervous', { look: 0.4 }, W0(-1.75, 0, 0.35)); }
  if (id === 'away') you(f < S.beat ? 'nervous' : 'wary', { look: -0.4, ...(f >= S.beat ? onPhone : { R: 'reach' }) });
  if (id === 'voice') you('wary', { look: -0.3, ...onPhone, blink: 0 });
  if (id === 'dont') you('scared', { look: -0.3, ...onPhone, blink: 0 });
  if (id === 'already') you('nervous', { look: -0.3, ...onPhone });
  if (id === 'inside') you('shock', { look: -0.3, ...onPhone, blink: 0 });
  if (id === 'window') you(f < S.beat ? 'scared' : 'wary', { look: -0.9, R: 'hang' });
  if (id === 'reflect') {
    you('scared', { look: -0.9, R: 'hang', blink: 0 }, KID, { order: 3 });
    out.push(actor(T, YOU, { seed: 32, expr: f < S.beat ? 'neutral' : 'creepy', blink: 0, look: 0.5, R: 'phone', who: 'reflection' }, REFL, { s: KS, tint: '#7a8ab8', alpha: 0.85, blob: false, shadow: false, flip: true }));
  }
  if (id === 'window') out.push(actor(T, YOU, { seed: 32, expr: 'neutral', blink: 0, look: 0.5, R: 'phone', who: 'reflection' }, REFL, { s: KS, tint: '#7a8ab8', alpha: 0.8, blob: false, shadow: false, flip: true }));
  return out;
};
const whisper = (txt, t) => (p) => { const g = p.g; g.save(); g.font = 'italic 700 92px Georgia'; g.textAlign = 'center'; g.globalAlpha = Math.max(0, Math.min(1, t * 4, (1 - t) * 3));
  g.fillStyle = '#c8d4ff'; g.shadowColor = '#000'; g.shadowBlur = 20; g.fillText(txt, 300, 500); g.restore(); };
export const fxAt = (f) => {
  const S = shotAt(f), id = S.id, out = [];
  if (id === 'rings' || (id === 'away' && f < S.beat)) { const d = f % 20; if (d < 12) { const t = q(d / 12); out.push(fx('rg' + t, word('RING', t, '#ffd23f'), [PH[0] + 0.1, PH[1] + 0.12, PH[2] + 0.1], 0.18)); } }
  if (id === 'dont') { const t = q(ramp(f, S.a + 6, S.b - 4), 1); out.push(fx('wd' + t, whisper("don't pick up...", t), W0(-1.2, 0.5, 0.05), 0.3)); }
  if (id === 'inside') { const t = q(ramp(f, S.beat, S.b), 1); out.push(fx('hh' + t, whisper('heh heh heh', t), W0(-1.2, 0.5, 0.05), 0.3)); }
  if (id === 'slam') { const d = f - S.beat; if (d >= 0 && d < 14) { const t = q(d / 14); out.push(fx('sl' + t, word('SLAM', t, '#ff5a3a'), [PH[0] + 0.15, PH[1] + 0.1, PH[2] + 0.2], 0.2)); } }
  return out;
};
