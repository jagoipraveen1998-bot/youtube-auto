// Shared helpers for 3D stories: a story only lists its shot ids, cameras, lights and actors.
//   import { makeStory } from './kit.js';
//   const K = makeStory({ ids: [...], cams: { id: [from, to] }, lights: {...}, light: (S, f) => 'night', focus: (S, C) => [x, y, z] });
//   export const { FPS, TOTAL, SHOTS, shotAt, camAt, dofAt, LIGHTS, lightFor } = K;
import * as TM from './timing.js';
const TIMING = TM.TIMING, T_TOTAL = TM.TOTAL, WORDS = TM.WORDS || [];

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
export const ramp = (f, a, b) => clamp((f - a) / (b - a));
export const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const add3 = (a, b) => a.map((v, i) => v + b[i]);
export const INK = '#241726';
/** motion with wind-up, strike, overshoot and settle (t = 0..1 over the move): fast in the middle, soft at the ends */
export const windUp = (t) => { t = clamp(t); const a = 1.7; return t < 0.22 ? -0.08 * Math.sin((t / 0.22) * Math.PI) : (() => { const u = (t - 0.22) / 0.78; return 1 + (a + 1) * Math.pow(u - 1, 3) + a * Math.pow(u - 1, 2); })(); };
export const settle = (t) => { t = clamp(t); return 1 - Math.exp(-6 * t) * Math.cos(9 * t); };
export const snap = (t) => { t = clamp(t); return 1 - Math.pow(1 - t, 4); };
// a natural blink: lid comes down, stays shut a frame, opens a touch slower; every 2-4 s, now and then a double blink
export const blinkAt = (f, seed) => { const per = 62 + (seed * 17) % 50, n = Math.floor((f + seed * 13) / per), ph = (f + seed * 13) % per;
  const one = (x) => [0.45, 1, 1, 0.6, 0.25][x] || 0; let v = one(ph); if ((n + seed) % 4 === 1) v = Math.max(v, one(ph - 7)); return v; };
// lip sync: how open a speaking mouth is on frame f (0..1) and its shape, read from the real voice (timing.js VOICE)
export const talkAt = (f, gain = 1) => { const V = TM.VOICE; if (!V || f < 0 || 2 * f + 1 >= V.length) return null;
  const lv = +V[2 * f], prev = +V[2 * Math.max(0, f - 1)], open = Math.min(1, (0.6 * lv + 0.4 * prev) / 9 * gain);
  return open < 0.12 ? { open: 0, shape: 'M' } : { open, shape: V[2 * f + 1] }; };

/** a cast card (romanFront) placed in the world */
export const actor = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
/** a 2D effect card (words, dust) that never casts a shadow */
export const fx = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
/** a big comic word that pops and fades (t = 0..1) */
export const word = (txt, t, col = '#ffd23f') => (p) => { const g = p.g; g.save(); g.font = '900 150px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round';
  g.globalAlpha = Math.max(0, 1 - t * 1.1); g.translate(300, 500); g.scale(1 + t * 0.35, 1 + t * 0.35); g.rotate(-0.08);
  g.lineWidth = 22; g.strokeStyle = INK; g.strokeText(txt, 0, 0); g.fillStyle = col; g.fillText(txt, 0, 0); g.restore(); };

export function makeStory({ ids, cams, lights, light = () => Object.keys(lights)[0], tweak, focus, kicks = [], shadowAt, cinf = 6, fly = {} }) {
  if (TIMING.length !== ids.length) console.warn(`story has ${ids.length} shots, timing has ${TIMING.length}`);
  const SHOTS = ids.map((id, i) => ({ id, i, a: TIMING[i].a, b: TIMING[i].b, beat: TIMING[i].beat, words: WORDS[i] || [] }));
  // the frame a word is spoken in a shot (first word starting with w; falls back to the shot's beat)
  const wordF = (S, w, nth = 0) => { const hits = S.words.filter((x) => x[0].toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(w.toLowerCase())); return hits.length ? hits[Math.min(nth, hits.length - 1)][1] : S.beat; };
  const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
  const sh = (id) => SHOTS[ids.indexOf(id)];
  const lightFor = (S, f) => { const L = { ...lights[light(S, f)] }; if (tweak) tweak(L, S, f); return L; };
  const mixK = (a, b, t) => ({ pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll || 0, b.roll || 0, t) });
  // the camera within one shot. Keys with  at: 'word'  are ON-THE-WORD moves: the camera rests (a slow drift) until
  // that word is spoken, then pushes to the key in  dur  frames (default 12, under half a second) and rests again.
  const baseCam = (f, S) => {
    const K = cams[S.id];
    if (!K.some((k) => k.at)) { const t = smooth(ramp(f, S.a, S.b)); return mixK(K[0], K[1] || K[0], t); }
    let c = { ...K[0], roll: K[0].roll || 0 };
    for (let i = 1; i < K.length; i++) {
      const k = K[i], t0 = typeof k.at === 'number' ? k.at : wordF(S, k.at, k.nth || 0), d = k.dur || 12;
      if (f < t0) { const nx = K[i]; c = mixK(c, mixK(c, nx, 0.08), ramp(f, S.a, t0)); break; }
      c = mixK(c, k, k.ease === 'smooth' ? smooth(ramp(f, t0, t0 + d)) : snap(ramp(f, t0, t0 + d)));
    }
    return c;
  };
  const camAt = (f) => {
    const S = shotAt(f);
    let c = baseCam(f, S);
    // FLY-THROUGH: instead of a cut, the camera flies from the last shot, through a point (a window, a dial, a hole), into this one
    const F = fly[S.id];
    if (F && S.i > 0) { const n = F.frames || 16, t = ramp(f, S.a, S.a + n);
      if (t < 1) { const P = SHOTS[S.i - 1], from = baseCam(P.b, P), thr = F.through;
        // first half: push from the last shot INTO the bright thing; a white flash covers the jump;
        // second half: glide forward into the new place from a little behind its first camera
        if (t < 0.5) { const e = smooth(t * 2); c = { pos: lerp3(from.pos, thr, e * 0.85), look: lerp3(from.look, thr, Math.min(1, e * 1.6)), fov: from.fov - 16 * e, roll: (from.roll || 0) + (F.spin || 0) * e }; }
        else { const e = smooth(t * 2 - 1), dir = c.pos.map((v, j) => v - c.look[j]), L = Math.hypot(...dir) || 1;
          const back = c.pos.map((v, j) => v + dir[j] / L * (F.back || 2.5));
          c = { ...c, pos: lerp3(back, c.pos, e), fov: c.fov + 12 * (1 - e), roll: (c.roll || 0) - (F.spin || 0) * (1 - e) }; }
        if (F.whiteout) c.flash = Math.max(0, 1 - Math.abs(t - 0.5) * 3.2) * F.whiteout; } }
    c.flash = c.flash || 0;
    for (const id of kicks) { const k = sh(id).beat, d = f - k; if (d >= 0 && d < 7) { const s = (d % 2 ? -1 : 1) * 0.03 * (1 - d / 7); c.look = [c.look[0], c.look[1] + s * 2, c.look[2] + s]; c.roll += s * 18; } }
    c.shadowAt = shadowAt ? shadowAt(S) : c.look;
    return c;
  };
  const dofAt = (f) => { const S = shotAt(f), C = camAt(f), p = focus ? focus(S, C, f) : C.look; return Array.isArray(p) ? { focus: dist(C.pos, p), cinf } : p; };
  return { FPS: 30, TOTAL: T_TOTAL, DECK: 0, SHOTS, shotAt, sh, camAt, dofAt, LIGHTS: lights, lightFor, wordF };
}

/** stock lighting moods any set can use */
export const MOODS = {
  night: { az: 180, el: 26, sky: '#6f80c0', ground: '#22223e', hemi: 0.8, sun: '#b8ccff', sunI: 2.0, fog: '#141c3c', fogNear: 7, fogFar: 34,
    skyTop: '#060a22', skyHor: '#1e2a58', sat: 1.08, vig: 0.4, shadowExt: 7, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#e6ecff', lift: '#03040c' },
  evening: { az: 200, el: 14, sky: '#ffc89a', ground: '#4a3a3a', hemi: 0.95, sun: '#ffb070', sunI: 2.4, fog: '#6a5a6a', fogNear: 12, fogFar: 60,
    skyTop: '#3a4a8a', skyHor: '#ff9a6a', sunDisc: '#ffcf8a', sunSize: 0.02, sat: 1.12, vig: 0.28, shadowExt: 7, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#fff1e2', lift: '#060406' },
  morning: { az: 60, el: 34, sky: '#bfe0ff', ground: '#7a7466', hemi: 1.15, sun: '#fff1d0', sunI: 2.6, fog: '#cfe2f2', fogNear: 25, fogFar: 140,
    skyTop: '#5f9fe0', skyHor: '#dceefa', sunDisc: '#fff6d8', sunSize: 0.02, sat: 1.1, vig: 0.2, shadowExt: 12, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#ffffff', lift: '#000000' },
  // ---- skies and weather (use these instead of a flat colour) ----
  // a bright day with a detailed sun and white drifting clouds
  sunClouds: { az: 70, el: 38, sky: '#bcd8f4', ground: '#7a7262', hemi: 1.1, sun: '#fff0d4', sunI: 2.6, fog: '#cadcec', fogNear: 25, fogFar: 150,
    skyTop: '#3f7fd0', skyHor: '#cfe3f4', sunDisc: '#fff4d6', sunSize: 0.012, clouds: 0.55, cloudCol: '#ffffff', cloudDark: '#a9b6c8',
    sat: 1.08, vig: 0.22, shadowExt: 12, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#ffffff', lift: '#000000' },
  // clear deep-blue sky, a few thin clouds
  blueSky: { az: 110, el: 50, sky: '#a8ccf4', ground: '#6e6a5c', hemi: 1.15, sun: '#fff6e0', sunI: 2.8, fog: '#d4e6f6', fogNear: 30, fogFar: 180,
    skyTop: '#1f63c8', skyHor: '#b8d8f4', sunDisc: '#fffbe8', sunSize: 0.01, clouds: 0.18, cloudCol: '#ffffff', cloudDark: '#c4d0de',
    sat: 1.12, vig: 0.18, shadowExt: 12, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#ffffff', lift: '#000000' },
  // grey overcast day, flat light (good before rain)
  overcast: { az: 90, el: 50, sky: '#9aa4b2', ground: '#4a4a4a', hemi: 1.0, sun: '#d8dde4', sunI: 0.9, fog: '#9aa2ac', fogNear: 12, fogFar: 80,
    skyTop: '#6e7888', skyHor: '#a6aeb8', clouds: 0.92, cloudCol: '#c4c8ce', cloudDark: '#6a707a', sat: 0.82, vig: 0.32, shadowExt: 10, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#eef2f6', lift: '#04060a' },
  // night with a big moon, moonlit clouds and stars
  moonNight: { az: 200, el: 30, sky: '#5a74b8', ground: '#141a30', hemi: 0.7, sun: '#b8ccff', sunI: 1.6, fog: '#121a36', fogNear: 7, fogFar: 40,
    skyTop: '#040820', skyHor: '#1a2654', moonAz: 200, moonEl: 28, moonSize: 0.0016, moonCol: '#e6ecff', stars: 1, clouds: 0.38, cloudCol: '#5a6a96', cloudDark: '#141a34',
    sat: 1.0, vig: 0.45, shadowExt: 7, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#e0e8ff', lift: '#03040c' },
  // rain at night: heavy low cloud, streaks and splashes, cold desaturated
  rainNight: { az: 200, el: 40, sky: '#4a5a7a', ground: '#0e1220', hemi: 0.65, sun: '#a8b8d8', sunI: 0.9, fog: '#1a2234', fogNear: 3, fogFar: 22,
    skyTop: '#080c18', skyHor: '#222c40', clouds: 0.95, cloudCol: '#3a4458', cloudDark: '#0c1018', rain: 1, rainCol: '#b8c6dc', rainWind: 0.15,
    sat: 0.78, vig: 0.5, shadowExt: 7, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#d8e2f0', lift: '#04060c' },
  // rain by day
  rainDay: { az: 90, el: 45, sky: '#8a96a8', ground: '#3a3c40', hemi: 0.95, sun: '#c8d0dc', sunI: 0.7, fog: '#7c8694', fogNear: 6, fogFar: 45,
    skyTop: '#4e5866', skyHor: '#8c96a2', clouds: 0.98, cloudCol: '#9aa2ae', cloudDark: '#4a505a', rain: 0.8, rainCol: '#d4dce8', rainWind: 0.12,
    sat: 0.75, vig: 0.35, shadowExt: 10, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#eef2f6', lift: '#05070a' },
  dread: { az: 180, el: 22, sky: '#58608a', ground: '#1a1a2a', hemi: 0.6, sun: '#9aa8e0', sunI: 1.4, fog: '#0c1028', fogNear: 5, fogFar: 26,
    skyTop: '#04061a', skyHor: '#141a3c', sat: 0.92, vig: 0.55, shadowExt: 7, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#dfe6ff', lift: '#02030a' },
};

/** Cinematic camera moves in the style of a Christopher Nolan scene (use for key shots):
 *  wideHero  - very wide, low and far: tiny figure under a huge sky / building (scale and dread)
 *  lowAngle  - camera near the ground looking up at a person or tower (power, threat)
 *  pushIn    - slow, steady push straight at a face or object over the whole shot (tension)
 *  overShoulder - over one character's shoulder at what they see
 *  symmetric - dead-centre one-point view down a corridor / doorway (unease)
 *  Each returns [start, end] camera keys for makeStory's cams. `at` = subject point, `dir` = unit vector from the subject toward the camera (x, z). */
export const SHOT = {
  wideHero: (at, dir, d = 14) => [{ pos: [at[0] + dir[0] * d, 0.6, at[2] + dir[1] * d], look: [at[0], at[1] + 2.2, at[2]], fov: 30 },
    { pos: [at[0] + dir[0] * d * 0.9, 0.62, at[2] + dir[1] * d * 0.9], look: [at[0], at[1] + 2.3, at[2]], fov: 29 }],
  lowAngle: (at, dir, d = 2.4) => [{ pos: [at[0] + dir[0] * d, 0.35, at[2] + dir[1] * d], look: [at[0], at[1] + 1.4, at[2]], fov: 46 },
    { pos: [at[0] + dir[0] * d * 0.85, 0.32, at[2] + dir[1] * d * 0.85], look: [at[0], at[1] + 1.5, at[2]], fov: 44 }],
  pushIn: (at, dir, d = 3.2) => [{ pos: [at[0] + dir[0] * d, at[1] + 0.1, at[2] + dir[1] * d], look: at, fov: 38 },
    { pos: [at[0] + dir[0] * d * 0.55, at[1] + 0.05, at[2] + dir[1] * d * 0.55], look: at, fov: 34 }],
  overShoulder: (eye, at) => [{ pos: [eye[0], eye[1] + 0.15, eye[2]], look: at, fov: 40 }, { pos: [eye[0] + (at[0] - eye[0]) * 0.08, eye[1] + 0.12, eye[2] + (at[2] - eye[2]) * 0.08], look: at, fov: 38 }],
  symmetric: (at, dir, d = 5) => [{ pos: [at[0] + dir[0] * d, at[1], at[2] + dir[1] * d], look: at, fov: 40 }, { pos: [at[0] + dir[0] * d * 0.8, at[1], at[2] + dir[1] * d * 0.8], look: at, fov: 38 }],
};
