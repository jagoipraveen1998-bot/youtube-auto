// "In My Town, You Get Your Shadow at 13. Mine Came Early": the street set (evening) for the town's rule,
// then the bedroom set at night. The kid never casts a shadow; the borrowed one lives on the bedroom wall.
import * as TT from './toon.js';
import * as SETS from './sets.js';
import { makeStory, MOODS, smooth, ramp, lerp, lerp3, q, blinkAt, actor } from './kit.js';

const B = [-40, 0, 0], ST = [0, 0, 60];
const W0 = (x, y, z) => [B[0] + x, B[1] + y, B[2] + z], S0 = (x, y, z) => [ST[0] + x, ST[1] + y, ST[2] + z];
const PATH = 0.13;
const KID = W0(0.1, 0, 0.55), SHADOW = W0(1.1, 0, 2.02), MUM = W0(1.75, 0, 0.75), PHOTO = W0(-0.6, 1.75, -2.07);
const NOSH = { shadow: false, blob: false };                 // kids have no shadow in this town

const IDS = ['town', 'kids', 'twelve', 'wall', 'moved', 'mum', 'borrowed', 'who', 'point', 'photo', 'wave', 'call', 'voice'];
const CAMS = {
  town: [{ pos: S0(3.6, 1.45, -0.6), look: S0(0.5, 0.9, -3.6), fov: 54 }, { pos: S0(3.3, 1.4, -0.9), look: S0(0.9, 0.95, -3.6), fov: 50 }],
  kids: [{ pos: S0(1.6, 1.6, -0.6), look: S0(-0.4, 0.5, -3.3), fov: 46 }, { pos: S0(1.2, 1.7, -1.0), look: S0(-0.3, 0.35, -3.3), fov: 42 }],
  twelve: [{ pos: S0(0.9, 1.3, -1.6), look: S0(0.2, 1.12, -3.3), fov: 38 }, { pos: S0(0.75, 1.3, -1.9), look: S0(0.2, 1.15, -3.3), fov: 32 }],
  wall: [{ pos: W0(-0.9, 1.35, -1.3), look: W0(0.7, 1.1, 2.05), fov: 46 }, { pos: W0(-0.7, 1.3, -1.0), look: W0(0.8, 1.1, 2.05), fov: 42 }],
  moved: [{ pos: W0(-0.6, 1.3, -0.9), look: W0(0.7, 1.15, 2.05), fov: 44 }, { pos: W0(-0.45, 1.3, -0.7), look: W0(0.75, 1.15, 2.05), fov: 40 }],
  mum: [{ pos: W0(0.5, 1.4, -0.6), look: W0(1.75, 1.3, 0.75), fov: 40 }, { pos: W0(0.7, 1.4, -0.4), look: W0(1.75, 1.35, 0.75), fov: 34 }],
  borrowed: [{ pos: W0(0.7, 1.42, -0.5), look: W0(1.75, 1.36, 0.75), fov: 34 }, { pos: W0(0.8, 1.42, -0.35), look: W0(1.75, 1.38, 0.75), fov: 30 }],
  who: [{ pos: W0(1.2, 1.3, -0.7), look: W0(0.1, 1.15, 0.55), fov: 38 }, { pos: W0(1.05, 1.3, -0.55), look: W0(0.1, 1.17, 0.55), fov: 33 }],
  point: [{ pos: W0(1.9, 1.5, 1.7), look: W0(0.4, 1.35, -1.2), fov: 48 }, { pos: W0(1.2, 1.55, 0.9), look: W0(-0.4, 1.6, -2.0), fov: 40 }],
  photo: [{ pos: W0(-0.5, 1.74, -0.9), look: PHOTO, fov: 40 }, { pos: W0(-0.56, 1.75, -1.1), look: PHOTO, fov: 40 }],
  wave: [{ pos: W0(-0.7, 1.3, -1.0), look: W0(0.9, 1.15, 2.05), fov: 44 }, { pos: W0(-0.5, 1.3, -0.75), look: W0(1.0, 1.2, 2.05), fov: 40 }],
  call: [{ pos: W0(1.3, 1.3, -0.9), look: W0(0.1, 1.15, 0.55), fov: 40 }, { pos: W0(1.1, 1.3, -0.65), look: W0(0.1, 1.17, 0.55), fov: 34 }],
  voice: [{ pos: W0(1.0, 1.3, -0.5), look: W0(0.1, 1.17, 0.55), fov: 32 }, { pos: W0(0.9, 1.3, -0.4), look: W0(0.1, 1.18, 0.55), fov: 28 }],
};
const SHCAM = [{ pos: W0(0.4, 1.3, -0.1), look: W0(1.1, 1.3, 2.05), fov: 42 }, { pos: W0(0.7, 1.3, 0.3), look: W0(1.1, 1.35, 2.05), fov: 38 }];

const LIGHTS = {
  evening: { ...MOODS.evening, az: 150, el: 16, shadowExt: 9 },
  night: { ...MOODS.night, hemi: 1.0, fogNear: 9, fogFar: 40 },
  dread: { ...MOODS.dread, hemi: 0.85, fogNear: 8, fogFar: 36 },
};
const K = makeStory({
  ids: IDS, cams: CAMS, lights: LIGHTS,
  light: (S) => (S.i < 3 ? 'evening' : S.i >= 10 ? 'dread' : 'night'),
  kicks: ['wave'],
  focus: (S) => ({ town: S0(-1.2, 1.0, -3.3), kids: S0(-0.3, 0.8, -3.3), twelve: S0(0.2, 1.15, -3.3), wall: W0(0.1, 1.15, 0.55), moved: W0(0.1, 1.15, 0.55), mum: W0(1.75, 1.35, 0.75),
    borrowed: W0(1.75, 1.4, 0.75), who: W0(0.1, 1.17, 0.55), point: W0(0.9, 1.3, -0.3), photo: PHOTO, wave: W0(0.1, 1.15, 0.55), call: W0(0.1, 1.17, 0.55), voice: W0(0.1, 1.18, 0.55) }[S.id]),
  shadowAt: (S) => (S.i < 3 ? S0(-0.5, 0.5, -3.0) : W0(0.3, 0.6, 0.3)),
});
export const { FPS, TOTAL, DECK, SHOTS, shotAt, lightFor } = K;
export { LIGHTS };
const onShadow = (f) => { const S = shotAt(f); return S.id === 'voice' && f >= S.beat; };
export const camAt = (f) => {
  if (onShadow(f)) { const S = shotAt(f), t = smooth(ramp(f, S.beat, S.b)), a = SHCAM[0], b = SHCAM[1];   // "I want it back": the shadow, waiting
    return { pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: 0, flash: 0, shadowAt: W0(0.3, 0.6, 0.3) }; }
  return K.camAt(f);
};
export const dofAt = (f) => (onShadow(f) ? { focus: 2.0, cinf: 6 } : K.dofAt(f));

// ---------- the sets ----------
export const build = (ctx) => {
  SETS.houseLightsOff(ctx);
  const br = SETS.bedroom(ctx, { at: B }), st = SETS.street(ctx, { at: ST });
  st.poster.mesh.visible = false;
  br.photo.mesh.material = new ctx.THREE.MeshBasicMaterial({ map: br.photo.tex, color: '#b4b4c4' }); br.photo.mesh.receiveShadow = false;   // readable in the dark room
  return { br, st };
};
const drawPhoto = (g, w, h, hasShadow) => {                  // Grandpa in the sun beside a fence post
  g.fillStyle = '#bfe0f4'; g.fillRect(0, 0, w, h); g.fillStyle = '#d8c690'; g.fillRect(0, h * 0.68, w, h * 0.32);
  g.fillStyle = 'rgba(40,30,50,0.45)';
  g.beginPath(); g.ellipse(w * 0.3, h * 0.86, w * 0.16, h * 0.022, -0.1, 0, 7); g.fill();                    // the post's shadow
  if (hasShadow) { g.beginPath(); g.ellipse(w * 0.72, h * 0.89, w * 0.2, h * 0.03, -0.1, 0, 7); g.fill(); }
  g.fillStyle = '#7a5a3a'; g.fillRect(w * 0.16, h * 0.5, w * 0.05, h * 0.36);
  g.save(); const s = w * 0.62 / 600; g.translate(w * 0.27, h * 0.9 - 975 * s); g.scale(s, s);
  TT.romanFront(new TT.Pen(g), 'grandpa', { seed: 77, expr: 'smile', blink: 0, look: 0 }); g.restore();
  g.fillStyle = 'rgba(255,240,200,0.12)'; g.fillRect(0, 0, w, h);
};
export const update = (W, f, P) => {
  if (!P.br) return;
  P.br.state(W, f); P.st.state({ policeIn: -1 }, f);
  P.br.photo.draw('gp' + W.photoShadow, (g, w, h) => drawPhoto(g, w, h, W.photoShadow));
};
export const worldAt = (f) => {
  const S = shotAt(f);
  return { door: S.i >= 5 ? 0.5 : 0, beep: -1, unlocked: false, lamp: S.i >= 10 ? 1.0 : 1.5, moon: 0.9, street: 1.0, headlights: 0, car: false,
    photoShadow: false, motes: false, gap: false, feet: false, wind: 0 };
};

// ---------- the cast ----------
const KS = 0.72, AS = 0.84;
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  const kid = (expr, o = {}, pos = KID) => out.push(actor(T, 'kid', { seed: 9, expr, blink: blinkAt(f, 9), ...o }, pos, { s: KS, ...NOSH }));
  const shadow = (o = {}, alpha = 0.62) => out.push(actor(T, 'kid', { seed: 9, expr: 'neutral', blink: 0, ...o }, SHADOW, { s: 1.0, tint: '#05050c', alpha, ...NOSH, order: 1 }));
  if (id === 'town') {                                       // grown-ups walk home with long evening shadows
    const t = ramp(f, S.a, S.b), st = q((f * 0.04) % 1, 2);
    out.push(actor(T, 'milk', { seed: 51, expr: 'smile', blink: blinkAt(f, 51), step: st, look: 0.5 }, S0(lerp(-0.4, 1.0, t), PATH, -3.2), { s: AS }));
    out.push(actor(T, 'mum', { seed: 41, expr: 'smile', blink: blinkAt(f, 41), step: q((f * 0.04 + 0.5) % 1, 2), look: -0.5 }, S0(lerp(2.6, 1.9, t), PATH, -4.0), { s: AS }));
  }
  if (id === 'kids') {
    out.push(actor(T, 'mum', { seed: 41, expr: 'smile', blink: blinkAt(f, 41), look: 0.4 }, S0(-1.1, PATH, -3.5), { s: AS }));
    kid('smile', { look: -0.4 }, S0(0.2, PATH, -3.3));
  }
  if (id === 'twelve') kid(f < S.beat ? 'smile' : 'grin', { R: f >= S.beat ? 'thumb' : undefined }, S0(0.2, PATH, -3.3));
  if (id === 'wall') { kid(f < S.beat ? 'neutral' : 'wary', { look: 0.3 }); if (f >= S.beat - 8) shadow({}, 0.62 * smooth(ramp(f, S.beat - 8, S.beat + 10))); }
  if (id === 'moved') { const up = f >= S.beat - 6; kid('nervous', { R: up ? 'wave' : undefined }); shadow({ L: up ? 'wave' : undefined }); }
  if (id === 'mum' || id === 'borrowed') out.push(actor(T, 'mumNight', { seed: 41, expr: id === 'mum' ? 'shock' : 'nervous', blink: id === 'mum' ? 0 : blinkAt(f, 41), look: -0.6, L: id === 'borrowed' ? 'hush' : undefined }, MUM, { s: AS }));
  if (id === 'who') kid('wary', { look: 0.6 });
  if (id === 'point') { out.push(actor(T, 'mumNight', { seed: 41, expr: 'nervous', blink: blinkAt(f, 41), look: -0.7, R: 'point' }, W0(0.9, 0, -0.3), { s: AS })); }
  if (id === 'wave') { kid('scared', { blink: 0, look: 0.3 }); shadow({ L: 'wave', headTilt: f >= S.beat ? Math.round(5 * Math.sin(f * 0.35)) : 0, bob: 0 }, 0.7); }
  if (id === 'call') kid(f < S.beat ? 'wary' : 'nervous', { R: 'phone' });
  if (id === 'voice') { if (f < S.beat) kid('scared', { R: 'phone', blink: 0 }); else shadow({ headTilt: 6 }, 0.75); }
  return out;
};
export const fxAt = () => [];
