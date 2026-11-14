// Shared helpers for 3D stories: a story only lists its shot ids, cameras, lights and actors.
//   import { makeStory } from './kit.js';
//   const K = makeStory({ ids: [...], cams: { id: [from, to] }, lights: {...}, light: (S, f) => 'night', focus: (S, C) => [x, y, z] });
//   export const { FPS, TOTAL, SHOTS, shotAt, camAt, dofAt, LIGHTS, lightFor } = K;
import { TIMING, TOTAL as T_TOTAL } from './timing.js';

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
export const ramp = (f, a, b) => clamp((f - a) / (b - a));
export const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const add3 = (a, b) => a.map((v, i) => v + b[i]);
export const INK = '#241726';
export const blinkAt = (f, seed) => { const per = 38 + (seed * 17) % 31, ph = (f + seed * 13) % per; return ph < 2 ? 0.5 : ph < 4 ? 1 : 0; };

/** a cast card (romanFront) placed in the world */
export const actor = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
/** a 2D effect card (words, dust) that never casts a shadow */
export const fx = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
/** a big comic word that pops and fades (t = 0..1) */
export const word = (txt, t, col = '#ffd23f') => (p) => { const g = p.g; g.save(); g.font = '900 150px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round';
  g.globalAlpha = Math.max(0, 1 - t * 1.1); g.translate(300, 500); g.scale(1 + t * 0.35, 1 + t * 0.35); g.rotate(-0.08);
  g.lineWidth = 22; g.strokeStyle = INK; g.strokeText(txt, 0, 0); g.fillStyle = col; g.fillText(txt, 0, 0); g.restore(); };

export function makeStory({ ids, cams, lights, light = () => Object.keys(lights)[0], tweak, focus, kicks = [], shadowAt, cinf = 6 }) {
  if (TIMING.length !== ids.length) console.warn(`story has ${ids.length} shots, timing has ${TIMING.length}`);
  const SHOTS = ids.map((id, i) => ({ id, i, a: TIMING[i].a, b: TIMING[i].b, beat: TIMING[i].beat }));
  const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
  const sh = (id) => SHOTS[ids.indexOf(id)];
  const lightFor = (S, f) => { const L = { ...lights[light(S, f)] }; if (tweak) tweak(L, S, f); return L; };
  const camAt = (f) => {
    const S = shotAt(f), K = cams[S.id], t = smooth(ramp(f, S.a, S.b)), a = K[0], b = K[1] || K[0];
    const c = { pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll || 0, b.roll || 0, t) };
    for (const id of kicks) { const k = sh(id).beat, d = f - k; if (d >= 0 && d < 7) { const s = (d % 2 ? -1 : 1) * 0.03 * (1 - d / 7); c.look = [c.look[0], c.look[1] + s * 2, c.look[2] + s]; c.roll += s * 18; } }
    c.flash = 0; c.shadowAt = shadowAt ? shadowAt(S) : c.look;
    return c;
  };
  const dofAt = (f) => { const S = shotAt(f), C = camAt(f), p = focus ? focus(S, C, f) : C.look; return Array.isArray(p) ? { focus: dist(C.pos, p), cinf } : p; };
  return { FPS: 30, TOTAL: T_TOTAL, DECK: 0, SHOTS, shotAt, sh, camAt, dofAt, LIGHTS: lights, lightFor };
}

/** stock lighting moods any set can use */
export const MOODS = {
  night: { az: 180, el: 26, sky: '#6f80c0', ground: '#22223e', hemi: 0.8, sun: '#b8ccff', sunI: 2.0, fog: '#141c3c', fogNear: 7, fogFar: 34,
    skyTop: '#060a22', skyHor: '#1e2a58', sat: 1.08, vig: 0.4, shadowExt: 7, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#e6ecff', lift: '#03040c' },
  evening: { az: 200, el: 14, sky: '#ffc89a', ground: '#4a3a3a', hemi: 0.95, sun: '#ffb070', sunI: 2.4, fog: '#6a5a6a', fogNear: 12, fogFar: 60,
    skyTop: '#3a4a8a', skyHor: '#ff9a6a', sunDisc: '#ffcf8a', sunSize: 0.02, sat: 1.12, vig: 0.28, shadowExt: 7, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#fff1e2', lift: '#060406' },
  morning: { az: 60, el: 34, sky: '#bfe0ff', ground: '#7a7466', hemi: 1.15, sun: '#fff1d0', sunI: 2.6, fog: '#cfe2f2', fogNear: 25, fogFar: 140,
    skyTop: '#5f9fe0', skyHor: '#dceefa', sunDisc: '#fff6d8', sunSize: 0.02, sat: 1.1, vig: 0.2, shadowExt: 12, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#ffffff', lift: '#000000' },
  dread: { az: 180, el: 22, sky: '#58608a', ground: '#1a1a2a', hemi: 0.6, sun: '#9aa8e0', sunI: 1.4, fog: '#0c1028', fogNear: 5, fogFar: 26,
    skyTop: '#04061a', skyHor: '#141a3c', sat: 0.92, vig: 0.55, shadowExt: 7, lamp: 0, tv: 0, porch: 0, fill: 0, gain: '#dfe6ff', lift: '#02030a' },
};
