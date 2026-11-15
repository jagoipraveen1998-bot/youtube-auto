// "I Saw A MISSING Poster With My Own Face": the street set (sets.js), a sunny school morning.
import * as TT from './toon.js';
import * as SETS from './sets.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor } from './kit.js';

const AT = [0, 0, 60], W0 = (x, y, z) => [AT[0] + x, AT[1] + y, AT[2] + z];
const PATH = 0.13;                                         // footpath top
const POSTER = W0(-1.5, 1.55, -3.84), KID = W0(-0.7, PATH, -3.25), COP = W0(0.75, 0, -2.85), MUM = W0(-2.55, PATH, -3.7);
const CAR_Z = -1.75, CAR_X = 3.4, WIN = W0(CAR_X - 0.75, 1.1, CAR_Z + 0.79);    // the police car's rear side window

const IDS = ['walk', 'stop', 'photo', 'name', 'since', 'call', 'mumcry', 'police', 'officer', 'twist', 'mumlook', 'which'];
const CAMS = {
  walk: [{ pos: W0(-2.6, 1.25, 0.2), look: W0(-4.2, 1.0, -3.4), fov: 46 }, { pos: W0(0.6, 1.3, 0.0), look: W0(-1.2, 1.05, -3.4), fov: 44 }],
  stop: [{ pos: W0(1.0, 1.35, -0.6), look: W0(-1.2, 1.25, -3.7), fov: 44 }, { pos: W0(0.6, 1.4, -1.0), look: W0(-1.3, 1.35, -3.7), fov: 38 }],
  photo: [{ pos: W0(-1.3, 1.62, -2.5), look: W0(-1.5, 1.6, -3.84), fov: 34 }, { pos: W0(-1.38, 1.61, -2.8), look: W0(-1.5, 1.6, -3.84), fov: 30 }],
  name: [{ pos: W0(-1.38, 1.45, -2.85), look: W0(-1.5, 1.4, -3.84), fov: 30 }, { pos: W0(-1.42, 1.43, -3.05), look: W0(-1.5, 1.39, -3.84), fov: 28 }],
  since: [{ pos: W0(-1.42, 1.32, -3.0), look: W0(-1.5, 1.28, -3.84), fov: 26 }, { pos: W0(-1.45, 1.3, -3.2), look: W0(-1.5, 1.27, -3.84), fov: 24 }],
  call: [{ pos: W0(0.1, 1.45, -1.5), look: W0(-0.7, 1.32, -3.25), fov: 36 }, { pos: W0(-0.05, 1.42, -1.75), look: W0(-0.7, 1.32, -3.25), fov: 32 }],
  mumcry: [{ pos: W0(-0.2, 1.42, -2.0), look: W0(-0.7, 1.35, -3.25), fov: 30 }, { pos: W0(-0.35, 1.4, -2.3), look: W0(-0.7, 1.36, -3.25), fov: 24 }],
  police: [{ pos: W0(4.8, 1.9, 2.8), look: W0(0.4, 0.8, -2.5), fov: 46 }, { pos: W0(4.2, 1.8, 2.3), look: W0(0.6, 0.85, -2.6), fov: 42 }],
  officer: [{ pos: W0(1.65, 1.5, -0.3), look: W0(-0.05, 1.25, -3.0), fov: 46 }, { pos: W0(1.55, 1.5, -0.55), look: W0(0.15, 1.3, -2.95), fov: 40 }],
  twist: [{ pos: W0(1.05, 1.52, -1.6), look: W0(0.75, 1.45, -2.85), fov: 32 }, { pos: W0(1.0, 1.5, -1.85), look: W0(0.75, 1.48, -2.85), fov: 28 }],
  mumlook: [{ pos: W0(-0.2, 1.45, -1.9), look: W0(-2.45, 1.35, -3.7), fov: 36 }, { pos: W0(-0.6, 1.45, -2.25), look: W0(-2.5, 1.4, -3.7), fov: 30 }],
  which: [{ pos: W0(2.2, 1.6, 0.9), look: W0(-0.9, 1.1, -3.0), fov: 54 }, { pos: W0(1.7, 1.55, 0.4), look: W0(-0.9, 1.15, -3.0), fov: 48 }],
};
const WINCAM = [{ pos: [WIN[0] + 0.35, WIN[1] + 0.05, WIN[2] + 1.15], look: WIN, fov: 30 }, { pos: [WIN[0] + 0.15, WIN[1] + 0.03, WIN[2] + 0.85], look: WIN, fov: 26 }];

const LIGHTS = { day: { ...MOODS.morning }, chill: { ...MOODS.morning, sat: 0.95, hemi: 1.0, sunI: 2.2, vig: 0.38, gain: '#eef4ff' } };
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.i >= 6 ? 'chill' : 'day'),
  kicks: ['photo', 'twist'],
  focus: (S) => ({ walk: KID, stop: POSTER, photo: POSTER, name: POSTER, since: POSTER, call: W0(-0.7, 1.32, -3.25), mumcry: W0(-0.7, 1.36, -3.25),
    police: W0(CAR_X, 0.9, CAR_Z), officer: W0(0.75, 1.4, -2.85), twist: W0(0.75, 1.48, -2.85), mumlook: W0(-2.5, 1.4, -3.7), which: W0(-0.6, 1.2, -3.0) }[S.id]),
  shadowAt: () => W0(-0.6, 0.6, -2.6),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor } = K;
const inWindow = (f) => { const S = shotAt(f); return (S.id === 'twist' || S.id === 'which') && f >= S.beat; };
export { LIGHTS };
export const camAt = (f) => {
  const S = shotAt(f);
  if (inWindow(f)) {     // the back window of the police car: the other you
    const t = smooth(ramp(f, S.beat, S.b)), a = WINCAM[0], b = WINCAM[1];
    return { pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: 0, flash: 0, shadowAt: WIN };
  }
  return K.camAt(f);
};

export const dofAt = (f) => { if (inWindow(f)) { const C = camAt(f); return { focus: Math.hypot(C.pos[0] - WIN[0], C.pos[1] - WIN[1], C.pos[2] - WIN[2]), cinf: 6 }; } return K.dofAt(f); };

// ---------- the set ----------
const kidHead = (g, w, h, expr, look) => {                  // the face on the poster / in the car window: our kid, head and shoulders
  g.save(); const s = w / 300; g.translate(w / 2 - 300 * s, -0.08 * h); g.scale(s, s);
  TT.romanFront(new TT.Pen(g), 'kid', { seed: 9, expr, blink: 0, look }); g.restore();
};
export const build = (ctx) => {
  SETS.houseLightsOff(ctx);
  const st = SETS.street(ctx, { at: AT });
  st.poster.draw('missing', (g, w, h) => {
    g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c0302a'; g.font = '900 104px Arial Black, Arial'; g.textAlign = 'center'; g.fillText('MISSING', w / 2, 112);
    g.save(); g.beginPath(); g.rect(w * 0.16, 140, w * 0.68, h * 0.5); g.clip(); g.fillStyle = '#bcd8f0'; g.fillRect(w * 0.16, 140, w * 0.68, h * 0.5);
    g.translate(w * 0.16, 140); kidHead(g, w * 0.68, h * 0.5 * 1.9, 'smile', 0); g.restore();
    g.strokeStyle = '#241726'; g.lineWidth = 5; g.strokeRect(w * 0.16, 140, w * 0.68, h * 0.5);
    g.fillStyle = '#241726'; g.font = '700 30px Arial'; g.fillText('NAME:', w * 0.3, h * 0.5 + 200);
    g.fillStyle = '#3a3a44'; g.beginPath(); g.roundRect(w * 0.42, h * 0.5 + 176, w * 0.42, 32, 10); g.fill();      // your name, smudged by the rain
    g.fillStyle = '#241726'; g.font = '700 28px Arial'; g.fillText('Age 12 · in school uniform', w / 2, h * 0.5 + 250);
    g.fillStyle = '#c0302a'; g.font = '900 40px Arial Black, Arial'; g.fillText('SINCE LAST NIGHT', w / 2, h * 0.5 + 305);
  });
  st.poster.mesh.userData.ndSkip = false;                  // the poster hides the pole's ink lines behind it
  st.police.g.position.z = CAR_Z;
  const win = SETS.canvasPlane(ctx, 0.62, 0.36, 512, st.police.g); win.mesh.position.set(-0.75, 1.1, 0.79); win.mesh.userData.ndSkip = false;
  return { st, win };
};
export const update = (W, f, P) => {
  if (!P.st) return;
  P.st.state(W, f); P.st.police.g.position.z = CAR_Z; if (W.policeIn >= 0) P.st.police.g.position.x = lerp(-14, CAR_X, W.policeIn);
  const other = W.otherKid;                                // null | 'stare' | 'creepy'
  P.win.draw('win' + other, (g, w, h) => {
    g.fillStyle = '#4a6a90'; g.fillRect(0, 0, w, h);
    if (other) { g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip(); const s = h / 430; g.translate(w / 2 - 300 * s, -92 * s); g.scale(s, s); TT.romanFront(new TT.Pen(g), 'kid', { seed: 9, expr: other === 'creepy' ? 'creepy' : 'neutral', blink: 0, look: -0.2 }); g.restore();
      g.fillStyle = 'rgba(120,160,210,0.28)'; g.fillRect(0, 0, w, h); }
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(w * 0.05, 0); g.lineTo(w * 0.3, 0); g.lineTo(w * 0.12, h); g.lineTo(0, h); g.fill();   // glare
  });
};
export const worldAt = (f) => {
  const S = shotAt(f), i = S.i;
  const W = { policeIn: -1, siren: false, otherKid: null, motes: false, gap: false, feet: false, wind: 0 };
  if (S.id === 'police') { W.policeIn = smooth(ramp(f, S.a, S.b - 10)); W.siren = true; }
  if (i > 7) { W.policeIn = 1; W.siren = true; }
  if (i >= 9) W.otherKid = 'stare';
  if (S.id === 'which' && f >= S.beat + 18) W.otherKid = 'creepy';
  return W;
};

// ---------- the cast ----------
const KS = 0.72, AS = 0.86;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const kid = (expr, o = {}, pos = KID) => out.push(actor(T, 'kid', { seed: 9, expr, blink: blinkAt(f, 9), ...o }, pos, { s: KS }));
  if (id === 'walk') { const t = ramp(f, S.a, S.b); kid('smile', { step: q((f * 0.045) % 1, 2), look: -0.6 }, W0(lerp(-5.2, -0.7, t), PATH, -3.3)); }
  if (id === 'stop') kid(f < S.beat ? 'neutral' : 'wary', { look: -0.7 });
  if (id === 'photo' || id === 'name' || id === 'since') kid('shock', { look: -0.7 });
  if (id === 'call') kid(f < S.beat ? 'laugh' : 'grin', { R: 'phone', look: 0.2, headTilt: f < S.beat ? Math.round(3 * Math.sin(f * 0.4)) : 0 });
  if (id === 'mumcry') kid(f < S.beat ? 'nervous' : 'shock', { R: 'phone', blink: 0 });
  if (id === 'police') kid('wary', { look: 0.6 });
  if (id === 'officer' || id === 'twist') {
    kid('scared', { look: 0.6, blink: 0 });
    const look = id === 'officer' ? (f < S.beat ? -0.8 : 0.7) : -0.7;
    out.push(actor(T, 'police', { seed: 23, expr: id === 'twist' ? 'wary' : 'stern', blink: blinkAt(f, 23), look }, COP, { s: AS }));
  }
  if (id === 'mumlook' || id === 'which') {
    kid('scared', { look: -0.7, blink: 0 });
    out.push(actor(T, 'mum', { seed: 41, expr: 'wary', blink: id === 'which' ? 0 : blinkAt(f, 41), look: 0.6, L: 'posters', R: 'posters' }, MUM, { s: 0.82 }));
    if (id === 'which') out.push(actor(T, 'police', { seed: 23, expr: 'wary', blink: 0, look: -0.6 }, COP, { s: AS }));
  }
  return out;
};
export const fxAt = () => [];
