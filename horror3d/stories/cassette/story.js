// "I Found A Cassette With My Name In Grandma's Cupboard": built on the reusable granRoom set (sets.js).
import * as TT from './toon.js';
import * as SETS from './sets.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor, fx, word } from './kit.js';

const AT = [40, 0, 0], W0 = (x, y, z) => [AT[0] + x, AT[1] + y, AT[2] + z];
// spots (world space, same numbers as granRoom's A)
const KID_C = W0(-0.72, 0, -0.98), KID_R = W0(-0.65, 0, 0.55), RADIO = W0(-0.7, 0.78, 1.82), TAPE = W0(-0.6, 1.59, -1.78),
  ROW = W0(-0.9, 1.9, -1.8), DOORWAY = W0(1.6, 0, -2.05), GRAN_IN = W0(0.75, 0, -0.35), CUP = W0(-0.9, 1.2, -1.6);

const IDS = ['clean', 'find', 'play', 'voice', 'warn', 'laugh', 'notgran', 'creak', 'gran', 'whisper', 'hide', 'end'];
const CAMS = {
  clean: [{ pos: W0(1.6, 1.75, 1.7), look: W0(-0.8, 1.05, -1.4), fov: 52 }, { pos: W0(1.2, 1.65, 1.3), look: W0(-0.8, 1.1, -1.5), fov: 48 }],
  find: [{ pos: W0(-0.35, 1.62, -0.95), look: TAPE, fov: 30 }, { pos: W0(-0.45, 1.61, -1.25), look: TAPE, fov: 22 }],
  play: [{ pos: W0(-0.35, 1.08, 1.05), look: RADIO, fov: 36 }, { pos: W0(-0.5, 1.0, 1.25), look: RADIO, fov: 30 }],
  voice: [{ pos: W0(0.5, 1.3, 2.05), look: W0(-0.65, 1.1, 0.55), fov: 46 }, { pos: W0(0.35, 1.3, 1.9), look: W0(-0.65, 1.15, 0.55), fov: 40 }],
  warn: [{ pos: W0(-0.7, 0.92, 1.2), look: RADIO, fov: 30 }, { pos: W0(-0.7, 0.86, 1.45), look: RADIO, fov: 26 }],
  laugh: [{ pos: W0(-1.6, 1.3, 2.05), look: W0(-0.65, 1.15, 0.55), fov: 44 }, { pos: W0(-1.45, 1.3, 1.9), look: W0(-0.65, 1.18, 0.55), fov: 39 }],
  notgran: [{ pos: W0(-0.7, 0.95, 1.05), look: RADIO, fov: 34 }, { pos: W0(-0.7, 0.85, 1.5), look: RADIO, fov: 20, roll: -2 }],
  creak: [{ pos: W0(-1.5, 1.3, 2.05), look: W0(-0.85, 1.05, -1.5), fov: 46 }, { pos: W0(-1.4, 1.25, 1.95), look: W0(-0.9, 1.15, -1.55), fov: 38 }],
  gran: [{ pos: W0(-0.4, 1.35, 0.9), look: W0(1.55, 1.3, -2.0), fov: 40 }, { pos: W0(-0.1, 1.38, 0.5), look: W0(1.55, 1.4, -2.0), fov: 32 }],
  whisper: [{ pos: W0(-0.62, 0.84, 1.42), look: RADIO, fov: 22 }, { pos: W0(-0.66, 0.82, 1.55), look: RADIO, fov: 18, roll: 2 }],
  hide: [{ pos: W0(-1.9, 1.3, 1.6), look: W0(-0.1, 1.15, 0.4), fov: 46 }, { pos: W0(-1.7, 1.3, 1.4), look: W0(0.0, 1.2, 0.3), fov: 42 }],
  end: [{ pos: W0(-0.2, 1.4, 1.05), look: W0(0.55, 1.45, 0.0), fov: 36 }, { pos: W0(-0.05, 1.42, 0.8), look: W0(0.55, 1.5, 0.0), fov: 30 }],
};
const ENDROW = [{ pos: W0(-0.85, 1.85, -0.6), look: ROW, fov: 40 }, { pos: W0(-0.88, 1.9, -0.95), look: ROW, fov: 33 }];

const LIGHTS = {
  warm: { ...MOODS.night, hemi: 0.75, sky: '#9a8aa8', ground: '#2a2228', fog: '#1a1418', fogNear: 8, fogFar: 30, gain: '#fff0e0', lift: '#050304', vig: 0.34 },
  cold: { ...MOODS.dread, hemi: 0.55, fogNear: 6, fogFar: 24 },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.i >= 6 ? 'cold' : 'warm'),
  tweak: (L, S) => { if (['gran', 'hide', 'end'].includes(S.id)) L.vig = 0.6; },
  kicks: ['creak', 'gran', 'end'],
  focus: (S) => ({ clean: CUP, find: TAPE, play: RADIO, voice: W0(-0.65, 1.15, 0.55), warn: RADIO, laugh: W0(-0.65, 1.15, 0.55), notgran: RADIO,
    creak: CUP, gran: W0(1.6, 1.4, -2.0), whisper: RADIO, hide: W0(0.2, 1.2, 0.2), end: W0(0.55, 1.5, 0.0) }[S.id]),
  shadowAt: () => W0(0, 0.8, 0),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, LIGHTS: _L, lightFor, dofAt } = K;
export { LIGHTS };
const sh = K.sh;
export const camAt = (f) => {
  const S = shotAt(f);
  if (S.id === 'end' && f >= S.beat) {                      // "I recorded over the first one too": the top shelf, every tape has your name
    const t = smooth(ramp(f, S.beat, S.b)), a = ENDROW[0], b = ENDROW[1];
    return { pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: 0, flash: 0, shadowAt: ROW };
  }
  return K.camAt(f);
};

// ---------- the set ----------
export const build = (ctx) => { SETS.houseLightsOff(ctx); return { gr: SETS.granRoom(ctx, { at: AT, label: 'YOU' }) }; };
export const update = (W, f, P) => P.gr && P.gr.state(W, f);
export const worldAt = (f) => {
  const S = shotAt(f), i = S.i;
  const W = { cupboard: 1, play: 0, speak: 0, tapeOnShelf: true, tapeInDeck: false, bulb: 1.7, moon: 0.5, sway: 1, flicker: false, motes: false, gap: false, feet: false, wind: 0 };
  if (i >= 1) W.tapeOnShelf = S.id === 'find';
  if (i >= 2) { W.cupboard = 0.12; W.tapeInDeck = S.id !== 'play' || f >= S.beat; W.play = S.id === 'play' ? (f >= S.beat + 6 ? 1 : 0) : 1; }
  if (['voice', 'warn', 'notgran', 'whisper'].includes(S.id)) W.speak = 1;
  if (i >= 6) { W.flicker = ['notgran', 'gran', 'end'].includes(S.id); W.bulb = 1.2; W.sway = 2.2; }
  if (S.id === 'creak') W.cupboard = lerp(0.12, 0.85, smooth(ramp(f, S.beat - 4, S.beat + 26)));
  if (i > 7) W.cupboard = 0.85;
  if (S.id === 'creak') W.creak = true;
  if (S.id === 'hide' || S.id === 'end') { W.play = 0; }
  if (S.id === 'end' && f >= S.beat) { W.bulb = 1.4; W.flicker = false; W.cupboard = 1; }
  return W;
};

// ---------- the cast ----------
const KS = 0.72, GS = 0.86;
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], id = S.id;
  const kid = (expr, o = {}, pos = KID_R, extra = {}) => out.push(actor(T, 'kid', { seed: 9, expr, blink: blinkAt(f, 9), ...o }, pos, { s: KS, ...extra }));
  if (id === 'clean') kid(f < S.beat ? 'neutral' : 'wary', { look: -0.5 }, KID_C);
  if (id === 'find') kid('wary', { look: -0.4 }, KID_C);
  if (id === 'voice') kid(f < S.beat ? 'wary' : 'nervous', { look: 0.1 });
  if (id === 'laugh') kid(f < S.beat ? 'laugh' : 'nervous', { look: 0.1, headTilt: f < S.beat ? Math.round(4 * Math.sin(f * 0.4)) : 0 });
  if (id === 'creak') kid(f < S.beat ? 'nervous' : 'scared', { look: q(lerp(0, -0.8, smooth(ramp(f, S.beat, S.beat + 10))), 1), blink: 0 }, W0(-1.9, 0, 1.05), { tint: '#c8c4d8' });
  if (id === 'gran' || id === 'end') {
    const g = id === 'gran' ? DOORWAY : GRAN_IN, expr = id === 'gran' ? 'smile' : 'creepy';
    out.push(actor(T, 'granNight', { seed: 31, expr, blink: id === 'end' ? 0 : blinkAt(f, 31), look: -0.3, headTilt: id === 'end' ? 6 : 3 }, g, { s: GS, tint: '#d8d0e0' }));
  }
  if (id === 'hide') {
    const k = smooth(ramp(f, S.a, S.b)), wide = f >= S.beat;
    kid('scared', { look: 0.6, L: 'behind', R: 'behind', blink: 0 }, W0(-0.7, 0, 1.0));
    out.push(actor(T, 'granNight', { seed: 31, expr: wide ? 'creepy' : 'smile', blink: 0, look: -0.5, headTilt: wide ? 6 : 2 }, lerp3(W0(1.3, 0, -1.4), GRAN_IN, k), { s: GS, tint: '#d8d0e0' }));
  }
  return out;
};
export const fxAt = (f) => {
  const S = shotAt(f), out = [];
  if (S.id === 'creak') { const d = f - S.beat; if (d >= 0 && d < 20) { const t = q(d / 20); out.push(fx('creak' + t, word('CREAK', t, '#c8d0ff'), W0(-0.9, 1.6, -1.2), 0.5)); } }
  if (S.id === 'play') { const d = f - S.beat - 6; if (d >= 0 && d < 14) { const t = q(d / 14); out.push(fx('click' + t, word('CLICK', t), W0(-0.45, 1.05, 1.75), 0.32)); } }
  return out;
};
