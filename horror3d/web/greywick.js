// Greywick, 1888: the town set for Season 1, "The Thirteenth Bell". Built once; every episode films in it.
//   import { greywick, hY } from './greywick.js';
//   export const build = (ctx) => ({ gw: greywick(ctx) });      export const update = (W, f, P) => P.gw.state(W, f);
// Layout (local, metres): High Street runs along z, from the quay (z = +30, y = 0) up to the church (z = -30, y = 7.2).
//   +x is the east side (bakery, studio), -x the west side (inn, cottage lane). The harbour lies beyond z = +30, the church beyond z = -30.
// state(W, f):  W.lamps = how many of the 24 lamps are lit, counted from the harbour up (default 24)   W.lampsOff = [indexes] forced dark
//               W.windows = 0..1 share of house windows lit      W.fog = z of the fog front climbing the hill (null = none)
//               W.focus = [x, y, z] in world space: the four real lights move to the lamps nearest to it
import { canvasPlane } from './sets.js';

export const SLOPE = 0.12, Z0 = 30, Z1 = -30, SW = 2.6;      // street half-width
export const hY = (z) => (Z0 - Math.max(Z1, Math.min(Z0, z))) * SLOPE;
export const LAMPS = Array.from({ length: 24 }, (_, i) => ({ i, x: (i % 2 ? 1 : -1) * (SW - 0.25), z: 27.5 - Math.floor(i / 2) * 5 - (i % 2 ? 2.5 : 0) }));

const HOUSES = [  // side, z centre, width along z, height, depth, wall, name
  [1, 25, 6, 5.2, 5, '#8d8a84', 'chandler'], [1, 18.5, 6, 6.0, 5, '#9a958c', 'bakery'], [1, 12, 6, 5.4, 5, '#84807a', 'apothecary'], [1, 5.5, 6, 6.4, 5, '#a09a90', 'studio'],
  [1, -1, 6, 5.6, 5, '#8a867e', null], [1, -7.5, 6, 6.2, 5, '#96918a', null], [1, -14, 6, 5.2, 5, '#88847c', null], [1, -20.5, 6, 5.8, 5, '#9c978e', null], [1, -27, 6, 5.4, 5, '#8e8a82', null],
  [-1, 25, 6, 5.6, 5, '#948f86', 'cottage'], [-1, 18.5, 6, 6.6, 5, '#86827a', 'inn'], [-1, 12, 6, 5.2, 5, '#9e998f', null], [-1, 5.5, 6, 5.8, 5, '#8a867f', null],
  [-1, -1, 6, 6.2, 5, '#98938a', null], [-1, -7.5, 6, 5.4, 5, '#847f78', null], [-1, -14, 6, 6.0, 5, '#9a958c', null], [-1, -20.5, 6, 5.4, 5, '#8c8880', null], [-1, -27, 6, 6.0, 5, '#96918a', null],
];
const SIGNS = { bakery: ["PELL'S", 'BAKERY', '#7a4a2a'], inn: ['THE', 'ANCHOR', '#2a3a5a'], studio: ['E. CRANE', 'PHOTOGRAPHS', '#2a2a2e'], apothecary: ['APOTHECARY', '', '#2f5a44'], chandler: ['SHIP', 'CHANDLER', '#5a3a3a'] };

export function greywick(ctx, { at = [0, 0, -200] } = {}) {
  const { THREE, add, box, toon, texM, P, world } = ctx;
  const G = new THREE.Group(); G.position.set(...at); world.add(G);
  const wp = (x, y, z) => [at[0] + x, at[1] + y, at[2] + z];
  const ang = Math.atan(SLOPE), LEN = (Z0 - Z1) / Math.cos(ang);

  // ---- the hill: cobbled street and a raised pavement each side ----
  const cobble = texM(P.stone(71, 240, 6, 52, 64, 48), 3, 30, '#8a8890'), flag = texM(P.stone(72, 40, 6, 62, 128, 64), 1, 24, '#a09c96');
  const slope = new THREE.Group(); slope.position.set(0, hY(0), 0); slope.rotation.x = ang; G.add(slope);
  add(new THREE.BoxGeometry(SW * 2 - 1.4, 0.3, LEN), cobble, 0, -0.15, 0, slope, { cast: false });
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(0.75, 0.42, LEN), flag, s * (SW - 0.35), -0.15, 0, slope, { cast: false }); }
  add(new THREE.BoxGeometry(60, 0.3, LEN + 20), toon({ color: '#3c3a40' }), 0, -0.5, 0, slope, { cast: false });           // ground under the houses

  // ---- houses: grey stone, slate roofs, chimneys, windows that can glow ----
  const slate = toon({ color: '#3d4350' }), dark = toon({ color: '#16161c' }), frame = toon({ color: '#d8d2c4' }), woodD = toon({ color: '#4a3526' });
  const winOn = new THREE.MeshBasicMaterial({ color: '#ffc46a' }), winOff = toon({ color: '#20242e' });
  const windows = [], doors = {};
  HOUSES.forEach(([s, z, w, h, d, col, name], hi) => {
    const y0 = hY(z + w / 2) - 0.4, top = hY(z) + h, x = s * (SW + d / 2), H = top - y0;
    const wall = texM(P.plaster(80 + hi, 140), 1, 1, col);
    add(box(d, H, w - 0.15), wall, x, y0 + H / 2, z, G);
    const roof = add(new THREE.ConeGeometry(1, 1, 4), slate, x, top + 0.9, z, G); roof.rotation.y = Math.PI / 4; roof.scale.set(d * 0.78, 1.8, w * 0.74);
    add(box(0.6, 1.5, 0.6), toon({ color: '#6a5a52' }), x + s * 0.8, top + 1.3, z - w * 0.28, G);
    const fx = s * (SW + 0.02), base = hY(z);
    const dz = z + w * 0.26;                                                               // door, downhill side of the front
    add(box(0.12, 2.1, 1.05), name === 'bakery' ? toon({ color: '#7a4a2a' }) : woodD, fx, hY(dz) + 1.05, dz, G);
    add(box(0.2, 0.14, 1.4), toon({ color: '#5c5a60' }), fx - s * 0.1, hY(dz) + 0.05, dz, G);
    doors[name || 'h' + hi] = wp(fx - s * 0.5, hY(dz), dz);
    const shop = name && name !== 'cottage';
    for (const [wz, wy, ww, wh] of shop ? [[-w * 0.2, 1.45, 2.2, 1.5], [-w * 0.25, 3.9, 0.9, 1.1], [w * 0.2, 3.9, 0.9, 1.1]] : [[-w * 0.22, 1.5, 0.95, 1.2], [-w * 0.22, 3.9, 0.9, 1.1], [w * 0.2, 3.9, 0.9, 1.1]]) {
      if (base + wy + wh / 2 > top - 0.3) continue;
      add(box(0.1, wh + 0.16, ww + 0.16), frame, fx, base + wy, z + wz, G);
      const m = add(box(0.12, wh, ww), winOff, fx - s * 0.01, base + wy, z + wz, G, { cast: false }); m.userData.ndSkip = true; windows.push(m);
      add(box(0.14, wh, 0.05), frame, fx - s * 0.02, base + wy, z + wz, G, { cast: false }); add(box(0.14, 0.05, ww), frame, fx - s * 0.02, base + wy, z + wz, G, { cast: false });
    }
    if (SIGNS[name]) {                                                                     // a hanging wooden sign
      const [l1, l2, bg] = SIGNS[name], sy = base + 3.0, sz = z + w * 0.05;
      add(box(1.0, 0.06, 0.06), dark, fx - s * 0.5, sy + 0.42, sz, G);
      const brd = add(box(0.06, 0.62, 1.3), toon({ color: bg }), fx - s * 0.75, sy, sz, G);
      for (const k of [-1, 1]) { const cp = canvasPlane(ctx, 1.22, 0.56, 512, G, { lit: true }); cp.mesh.position.set(fx - s * 0.75 + k * 0.035, sy, sz); cp.mesh.rotation.y = k * Math.PI / 2;
        cp.draw(name, (g, cw, ch) => { g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.strokeStyle = '#e8d9a8'; g.lineWidth = 8; g.strokeRect(10, 10, cw - 20, ch - 20);
          g.fillStyle = '#f0e2b6'; g.textAlign = 'center'; g.font = `700 ${l2 ? 76 : 70}px Georgia, serif`; g.fillText(l1, cw / 2, l2 ? ch * 0.44 : ch * 0.6); if (l2) { g.font = '700 62px Georgia, serif'; g.fillText(l2, cw / 2, ch * 0.82); } }); }
    }
  });

  // ---- the 24 gas lamps ----
  const iron = toon({ color: '#1e2026' }), glassOn = new THREE.MeshBasicMaterial({ color: '#ffd48a' }), glassOff = toon({ color: '#3a3c44' });
  const haloTex = P.tex(P.radial('255,196,110', 0.9));
  const lamps = LAMPS.map((L) => {
    const y = hY(L.z), g = new THREE.Group(); g.position.set(L.x, y, L.z); G.add(g);
    add(new THREE.CylinderGeometry(0.05, 0.08, 3.0, 8), iron, 0, 1.5, 0, g); add(new THREE.CylinderGeometry(0.13, 0.16, 0.3, 8), iron, 0, 0.15, 0, g);
    add(box(0.5, 0.04, 0.04), iron, 0, 2.75, 0, g);                                         // the ladder bar
    const gl = add(new THREE.CylinderGeometry(0.17, 0.11, 0.42, 6), glassOn, 0, 3.22, 0, g, { cast: false }); gl.userData.ndSkip = true;
    const cap = add(new THREE.ConeGeometry(0.24, 0.22, 6), iron, 0, 3.54, 0, g);
    const halo = add(new THREE.SphereGeometry(0.42, 14, 10), new THREE.MeshBasicMaterial({ color: '#ffb860', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }), 0, 3.22, 0, g, { cast: false });
    halo.userData.ndSkip = true;                                                            // a small soft glow round the glass
    const pool = add(new THREE.CircleGeometry(2.4, 24), new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending }), 0, 0.06, 0, g, { cast: false });
    pool.rotation.x = -Math.PI / 2 + ang * 0; pool.userData.ndSkip = true;
    return { ...L, g, gl, halo, pool, top: wp(L.x, y + 3.22, L.z), foot: wp(L.x, y, L.z) };
  });
  const real = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight('#ffb866', 0, 11, 1.5); G.add(l); return l; });

  // ---- St Brannoc's at the top of the hill ----
  const ch = new THREE.Group(); ch.position.set(0, hY(Z1), Z1 - 9); G.add(ch);
  const stone = texM(P.plaster(95, 120), 2, 2, '#7c7a80');
  add(box(26, 0.4, 22), toon({ color: '#4a4c50' }), 0, -0.2, 2, ch, { cast: false });
  add(box(9, 7, 14), stone, 3.5, 3.5, -3, ch); const nr = add(new THREE.ConeGeometry(1, 1, 4), slate, 3.5, 8.6, -3, ch); nr.rotation.y = Math.PI / 4; nr.scale.set(7.4, 3.4, 11);
  add(box(5, 17, 5), stone, -3, 8.5, 2, ch);
  const spire = add(new THREE.ConeGeometry(1, 1, 4), slate, -3, 19.6, 2, ch); spire.rotation.y = Math.PI / 4; spire.scale.set(3.9, 5.2, 3.9);
  add(box(1.5, 2.6, 0.2), woodD, -3, 1.3, 4.55, ch);                                         // the tower door
  for (const y of [13.6]) add(box(1.3, 2.0, 0.2), dark, -3, y, 4.55, ch);                    // louvres of the bell chamber
  const clock = canvasPlane(ctx, 2.6, 2.6, 512, ch); clock.mesh.position.set(-3, 10.2, 4.56);
  const drawClock = (hr, mn, lit) => clock.draw(`${hr}:${mn}:${lit}`, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = lit ? '#f4e6bc' : '#b8b09a'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.47, 0, 7); g.fill();
    g.strokeStyle = '#201a16'; g.lineWidth = 16; g.stroke(); g.fillStyle = '#201a16'; g.font = '700 50px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['XII', 'III', 'VI', 'IX'].forEach((t, i) => g.fillText(t, w / 2 + Math.sin(i * Math.PI / 2) * w * 0.36, h / 2 - Math.cos(i * Math.PI / 2) * h * 0.36));
    const hand = (a, len, lw) => { g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + Math.sin(a) * len, h / 2 - Math.cos(a) * len); g.stroke(); };
    hand((hr % 12 + mn / 60) * Math.PI / 6, w * 0.24, 18); hand(mn * Math.PI / 30, w * 0.36, 11); });
  clock.mesh.material.transparent = true;
  for (let i = 0; i < 7; i++) add(box(0.7, 1.0, 0.16), toon({ color: '#6c6e74' }), 8 + (i % 4) * 1.5, 0.5, 7 + Math.floor(i / 4) * 1.8, ch);   // the churchyard: seven stones
  const yew = add(new THREE.ConeGeometry(1.8, 5, 8), toon({ color: '#1e3324' }), 12.5, 2.5, 6, ch);

  // ---- the harbour at the bottom ----
  const hb = new THREE.Group(); hb.position.set(0, 0, Z0); G.add(hb);
  add(box(40, 0.5, 9), texM(P.stone(73, 240, 5, 55, 128, 64), 10, 3, '#8c8a90'), 0, -0.25, 4.5, hb, { cast: false });       // the quay
  add(new THREE.BoxGeometry(120, 0.1, 80), new THREE.MeshBasicMaterial({ color: '#0e1622' }), 0, -1.6, 50, hb, { cast: false }); // dark water / low-tide mud
  add(box(34, 0.1, 14), toon({ color: '#3a3830' }), 0, -1.5, 16, hb, { cast: false });
  add(box(1.6, 2.2, 26), stone, -17, -0.5, 20, hb); add(box(22, 2.2, 1.6), stone, -7, -0.5, 33, hb);                          // the curved harbour wall, squared off
  const boats = [[-6, 14, 0.3, '#5a4030'], [3, 17, -0.2, '#30485a'], [9, 12, 0.5, '#5a3a3a']].map(([x, z, r, c]) => { const b = new THREE.Group(); b.position.set(x, -1.45, z); b.rotation.set(0, r, 0.12); hb.add(b);
    add(box(1.5, 0.7, 4.4), toon({ color: c }), 0, 0.35, 0, b); add(box(1.1, 0.5, 1.2), toon({ color: '#d8d0c0' }), 0, 0.95, -1.0, b); add(new THREE.CylinderGeometry(0.05, 0.06, 3.4, 6), woodD, 0, 2.2, 0.4, b);
    const lan = add(new THREE.SphereGeometry(0.11, 8, 6), glassOn, 0, 2.0, 0.75, b, { cast: false }); lan.userData.ndSkip = true; return { b, lan, at: wp(x, -1.0, Z0 + z) }; });
  add(new THREE.CylinderGeometry(1.1, 1.6, 9, 12), toon({ color: '#c8c2b6' }), -17, 4, 34, hb); add(new THREE.ConeGeometry(1.4, 1.4, 12), toon({ color: '#5a2e2a' }), -17, 9.2, 34, hb);   // the old lighthouse
  for (let i = 0; i < 5; i++) add(new THREE.CylinderGeometry(0.16, 0.2, 0.9, 8), iron, -8 + i * 4, 0.45, 8.2, hb);                // mooring posts

  // ---- the fog bank that climbs the hill ----
  const puffs = [], puffGeo = new THREE.SphereGeometry(1, 18, 12);
  for (let i = 0; i < 30; i++) { const sp = new THREE.Mesh(puffGeo, new THREE.MeshBasicMaterial({ color: '#c9d2e4', transparent: true, opacity: 0, depthWrite: false }));
    sp.userData.ndSkip = true; sp.renderOrder = 3; sp.userData.o = [(i * 37 % 11) / 11, (i * 53 % 7) / 7, (i * 29 % 13) / 13]; G.add(sp); puffs.push(sp); }

  const A = { quay: wp(0, 0, Z0 + 3), bottom: wp(0, hY(26), 26), top: wp(0, hY(-28), -28), church: wp(-3, hY(Z1) + 10, Z1 - 4.4), towerDoor: wp(-3, hY(Z1), Z1 - 4.2), churchyard: wp(10, hY(Z1), Z1 - 1),
    bakery: doors.bakery, inn: doors.inn, studio: doors.studio, cottage: doors.cottage, apothecary: doors.apothecary, lastLamp: lamps[23].foot, firstLamp: lamps[0].foot };
  return {
    at, A, G, lamps, boats, hY: (z) => at[1] + hY(z - at[2]), wp,
    state(W = {}, f = 0) {
      const lit = W.lamps ?? 24, off = W.lampsOff || [];
      lamps.forEach((L) => { const on = L.i < lit && !off.includes(L.i), fl = on ? 0.92 + 0.08 * Math.sin(f * 0.21 + L.i * 1.7) : 0;
        L.gl.material = on ? glassOn : glassOff; L.halo.material.opacity = 0.22 * fl; L.pool.material.opacity = 0.28 * fl; L.on = on; });
      const fc = W.focus ? [W.focus[0] - at[0], W.focus[1] - at[1], W.focus[2] - at[2]] : [0, 3, 0];
      const near = lamps.filter((L) => L.on).sort((a, b) => Math.hypot(a.x - fc[0], a.z - fc[2]) - Math.hypot(b.x - fc[0], b.z - fc[2])).slice(0, 4);
      real.forEach((l, i) => { const L = near[i]; l.intensity = L ? (W.lampPower ?? 2.2) : 0; if (L) l.position.set(L.x * 0.8, hY(L.z) + 3.0, L.z); });
      const wl = W.windows ?? 0.4; windows.forEach((m, i) => { m.material = ((i * 7919) % 100) / 100 < wl ? winOn : winOff; });
      const t = W.clock ?? [11, 40]; drawClock(t[0], t[1], true);
      boats.forEach((b) => { b.lan.material = (W.boatLamps ?? true) ? glassOn : glassOff; });
      const fz = W.fog;                                                                    // everything downhill of fz is under the fog
      puffs.forEach((sp, i) => { const [a, b, c] = sp.userData.o; if (fz == null) { sp.visible = false; return; }
        const z = fz + a * 16 + Math.sin(f * 0.01 + i) * 0.6, x = (b - 0.5) * 9 + Math.sin(f * 0.013 + i * 2) * 0.5;
        sp.position.set(x, hY(z) + 0.5 + c * 1.2, z); const s = 2.2 + c * 1.8; sp.scale.set(s * 1.6, s * 0.6, s * 1.3); sp.visible = true; sp.material.opacity = (W.fogDensity ?? 0.16) * (0.6 + 0.4 * c); });
    },
  };
}
