// Reusable 3D sets. Each set is built away from the living-room house so a story can use the house,
// one of these, or cut between several. A story calls them from its build():
//   import * as SETS from './sets.js';
//   export const build = (ctx) => { const gr = SETS.granRoom(ctx); return { gr }; };
//   export const update = (W, f, P) => P.gr.state(W, f);
// Every set returns { at, A (named spots in world space), state(W, f), ...parts }.
// Positions inside a set are local; A[...] are already in world space so cameras can use them directly.
//
//   granRoom  [40, 0, 0]   Grandma's old room: wooden cupboard (doors open), radio-cassette player, bulb, grille window, doorway
//   bedroom   [-40, 0, 0]  a kid's bedroom: bed (space under it), door with a keypad lock, window onto the driveway, photo frame, wall for shadows
//   street    [0, 0, 60]   a morning road to school: footpath, lamppost with a poster, compound walls, houses, trees, a police car

const v3 = (at, p) => [at[0] + p[0], at[1] + p[1], at[2] + p[2]];

/** a flat canvas you can draw on every frame (poster, photo, label, screen) */
export function canvasPlane(ctx, w, h, px = 512, parent, opts = {}) {
  const { THREE } = ctx;
  const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mat = opts.lit ? new THREE.MeshToonMaterial({ map: tex, gradientMap: ctx.grad, transparent: !!opts.alpha }) : new THREE.MeshBasicMaterial({ map: tex, transparent: !!opts.alpha });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); mesh.userData.ndSkip = true; mesh.receiveShadow = true; parent.add(mesh);
  const g = c.getContext('2d'); let key = null;
  return { mesh, g, c, tex, draw(k, fn) { if (k === key) return; key = k; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); fn(g, c.width, c.height); tex.needsUpdate = true; } };
}

/** hide the living-room lights when a story lives entirely in another set (fewer lights = faster render) */
export function houseLightsOff(ctx) { for (const l of Object.values(ctx.lights || {})) l.visible = false; }

// ---------- props anyone can use ----------
export function car(ctx, parent, { color = '#c8ccd6', police = false } = {}) {
  const { THREE, add, box, toon } = ctx; const g = new THREE.Group(); parent.add(g);
  const body = toon({ color }), dark = toon({ color: '#1a1c24' }), glass = toon({ color: '#5a7090' }), tyre = toon({ color: '#14141a' }), rim = toon({ color: '#b8bcc8' });
  add(box(4.0, 0.55, 1.7), body, 0, 0.55, 0, g); add(box(2.2, 0.5, 1.5), body, -0.2, 1.06, 0, g);
  add(box(2.0, 0.4, 1.52), glass, -0.2, 1.06, 0, g);
  for (const s of [-1, 1]) for (const x of [-1.25, 1.25]) { const w = add(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 16), tyre, x, 0.34, s * 0.78, g); w.rotation.x = Math.PI / 2; const r = add(new THREE.CylinderGeometry(0.18, 0.18, 0.25, 12), rim, x, 0.34, s * 0.79, g); r.rotation.x = Math.PI / 2; }
  for (const s of [-1, 1]) { add(box(0.05, 0.14, 0.32), new THREE.MeshBasicMaterial({ color: '#fff4c8' }), 2.0, 0.66, s * 0.6, g); add(box(0.05, 0.12, 0.3), new THREE.MeshBasicMaterial({ color: '#b02a2a' }), -2.0, 0.68, s * 0.6, g); }
  add(box(4.05, 0.12, 1.72), dark, 0, 0.3, 0, g);
  let siren = null;
  if (police) {
    add(box(4.02, 0.16, 1.72), toon({ color: '#2a4a9a' }), 0, 0.62, 0, g);
    const red = new THREE.MeshBasicMaterial({ color: '#ff3030' }), blue = new THREE.MeshBasicMaterial({ color: '#3060ff' });
    const r = add(box(0.3, 0.12, 0.5), red, -0.2, 1.37, -0.32, g, { cast: false }), b = add(box(0.3, 0.12, 0.5), blue, -0.2, 1.37, 0.32, g, { cast: false });
    siren = { r, b, red, blue, off: toon({ color: '#3a3a44' }) };
  }
  return { g, flash(f, on) { if (!siren) return; const k = on ? (f % 12 < 6) : null; siren.r.material = k === true ? siren.red : siren.off; siren.b.material = k === false ? siren.blue : siren.off; if (on && k === false) siren.r.material = siren.off; } };
}
export function tree(ctx, parent, x, z, s = 1) {
  const { THREE, add, toon } = ctx;
  add(new THREE.CylinderGeometry(0.14 * s, 0.2 * s, 2.2 * s, 8), toon({ color: '#5a3d26' }), x, 1.1 * s, z, parent);
  for (const [dx, dy, dz, r] of [[0, 2.7, 0, 1.1], [0.6, 2.4, 0.2, 0.8], [-0.5, 2.5, -0.3, 0.85], [0.1, 3.2, 0.1, 0.75]]) add(new THREE.SphereGeometry(r * s, 10, 8), toon({ color: '#3f7a3a' }), x + dx * s, dy * s, z + dz * s, parent);
}
export function bulb(ctx, parent, x, y, z, color = '#ffd79a') {
  const { THREE, add, toon } = ctx; const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  add(new THREE.CylinderGeometry(0.006, 0.006, 0.55, 4), toon({ color: '#222' }), 0, -0.27, 0, g, { cast: false });
  add(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 10), toon({ color: '#3a3a3a' }), 0, -0.57, 0, g, { cast: false });
  const glassM = new THREE.MeshBasicMaterial({ color }); const gl = add(new THREE.SphereGeometry(0.065, 12, 10), glassM, 0, -0.64, 0, g, { cast: false }); gl.userData.ndSkip = true;
  const light = new THREE.PointLight(color, 0, 8, 1.3); light.position.set(0, -0.72, 0); g.add(light);
  return { g, light, glassM, color };
}
export function cassette(ctx, parent, label = 'YOU') {
  const { THREE, add, box, toon } = ctx; const g = new THREE.Group(); parent.add(g);
  add(box(0.1, 0.064, 0.012), toon({ color: '#2a2a30' }), 0, 0, 0, g);
  const lab = canvasPlane(ctx, 0.086, 0.034, 256, g, { lit: true }); lab.mesh.position.set(0, 0.008, 0.0065);
  lab.draw(label, (c, w, h) => { c.fillStyle = '#f4ead2'; c.fillRect(0, 0, w, h); c.fillStyle = '#d24a3a'; c.fillRect(0, 0, w, 10);
    c.fillStyle = '#2a2a30'; c.beginPath(); c.roundRect(w * 0.28, h * 0.42, w * 0.44, h * 0.36, 12); c.fill();
    c.fillStyle = '#e8e2d2'; for (const x of [0.36, 0.64]) { c.beginPath(); c.arc(w * x, h * 0.6, 9, 0, 7); c.fill(); }
    c.font = '700 30px "Comic Sans MS", cursive'; c.fillStyle = '#3a4ad0'; c.textAlign = 'center'; c.fillText(label, w / 2, h * 0.34); });
  return g;
}

// ---------- Grandma's old room ----------
export function granRoom(ctx, { at = [40, 0, 0], label = 'YOU' } = {}) {
  const { THREE, add, box, tbox, toon, texM, P, world, scene } = ctx;
  const G = new THREE.Group(); G.position.set(...at); world.add(G);
  const RX = 2.6, RZ = 2.3, RH = 2.8;
  const wall = texM(P.plaster(31, 150), 2, 1, '#cfe3cc'), floor = texM(P.stone(32, 8, 40, 38, 128, 128), 3, 3, '#c86a5a');
  add(tbox(RX * 2, 0.2, RZ * 2, 1.2), floor, 0, -0.1, 0, G, { cast: false });
  add(tbox(RX * 2, 0.15, RZ * 2, 2), toon({ color: '#e6e2d6' }), 0, RH + 0.07, 0, G, { cast: false });
  // back wall with a doorway at x = 1.6 (0.9 x 2.1), a dark corridor behind it
  const DX = 1.6, DW = 0.9, DH = 2.1, BZ = -RZ;
  add(tbox(RX + DX - DW / 2, RH, 0.2, 1.4), wall, (-RX + DX - DW / 2) / 2, RH / 2, BZ, G);
  add(tbox(RX - DX - DW / 2, RH, 0.2, 1.4), wall, (RX + DX + DW / 2) / 2, RH / 2, BZ, G);
  add(tbox(DW, RH - DH, 0.2, 1.4), wall, DX, DH + (RH - DH) / 2, BZ, G);
  for (const s of [-1, 1]) add(box(0.1, DH, 0.26), toon({ color: '#8a5a3a' }), DX + s * (DW / 2 + 0.05), DH / 2, BZ, G);
  add(box(DW + 0.2, 0.1, 0.26), toon({ color: '#8a5a3a' }), DX, DH + 0.05, BZ, G);
  add(box(2.4, RH, 0.1), toon({ color: '#07070c' }), DX, RH / 2, BZ - 1.3, G);                           // corridor end: black
  for (const s of [-1, 1]) add(box(0.1, RH, 1.3), toon({ color: '#141420' }), DX + s * 0.7, RH / 2, BZ - 0.65, G);
  add(box(1.5, 0.1, 1.3), toon({ color: '#141420' }), DX, -0.02, BZ - 0.65, G);
  // side walls; window with an iron grille on the left
  const LX = -RX, WZ0 = -0.5, WZ1 = 0.7, WY0 = 1.0, WY1 = 2.05;
  add(tbox(0.2, RH, RZ + WZ0, 1.4), wall, LX, RH / 2, (-RZ + WZ0) / 2, G); add(tbox(0.2, RH, RZ - WZ1, 1.4), wall, LX, RH / 2, (RZ + WZ1) / 2, G);
  add(tbox(0.2, WY0, WZ1 - WZ0, 1.4), wall, LX, WY0 / 2, (WZ0 + WZ1) / 2, G); add(tbox(0.2, RH - WY1, WZ1 - WZ0, 1.4), wall, LX, WY1 + (RH - WY1) / 2, (WZ0 + WZ1) / 2, G);
  const iron = toon({ color: '#2a2c34' });
  for (let z = WZ0 + 0.12; z < WZ1; z += 0.15) add(box(0.025, WY1 - WY0, 0.025), iron, LX, (WY0 + WY1) / 2, z, G);
  for (const y of [WY0 + 0.3, WY1 - 0.3]) add(box(0.025, 0.025, WZ1 - WZ0), iron, LX, y, (WZ0 + WZ1) / 2, G);
  add(box(0.3, 0.06, WZ1 - WZ0 + 0.2), toon({ color: '#e6e2d6' }), LX + 0.1, WY0, (WZ0 + WZ1) / 2, G);
  const night = add(new THREE.PlaneGeometry(2, 1.6), new THREE.MeshBasicMaterial({ color: '#16204a' }), LX - 1.2, 1.5, 0.1, G, { cast: false }); night.rotation.y = Math.PI / 2; night.userData.ndSkip = true;
  add(tbox(0.2, RH, RZ * 2, 1.4), wall, RX, RH / 2, 0, G);
  add(tbox(RX * 2, RH, 0.2, 1.4), wall, 0, RH / 2, RZ, G);
  add(box(RX * 2, 0.12, 0.04), toon({ color: '#9a8a6a' }), 0, 0.06, BZ + 0.12, G);
  // the old wooden cupboard on the back wall, two doors on hinges
  const CX = -0.9, CW = 1.3, CH = 2.05, CD = 0.6, CZ = BZ + 0.1 + CD / 2;
  const wood = toon({ color: '#5a3520' }), woodL = toon({ color: '#74472a' }), inside = toon({ color: '#1c1410' });
  add(box(CW, CH, 0.04), inside, CX, CH / 2 + 0.1, BZ + 0.13, G);
  for (const s of [-1, 1]) add(box(0.05, CH, CD), wood, CX + s * (CW / 2 - 0.025), CH / 2 + 0.1, CZ, G);
  add(box(CW, 0.06, CD), wood, CX, 0.12, CZ, G); add(box(CW + 0.12, 0.1, CD + 0.08), wood, CX, CH + 0.15, CZ, G);
  add(box(CW - 0.1, 0.1, 0.04), wood, CX, 0.05, CZ + CD / 2 - 0.02, G);
  const shelfY = [0.75, 1.3, 1.8];
  for (const y of shelfY) add(box(CW - 0.1, 0.03, CD - 0.06), woodL, CX, y, CZ, G);
  const cloth = ['#b8324a', '#3a6aa8', '#e0a83a', '#4a8a5a', '#8a4aa8', '#e06a3a'];
  for (let i = 0; i < 6; i++) add(box(0.36, 0.07 + (i % 3) * 0.02, 0.4), toon({ color: cloth[i] }), CX - 0.38 + (i % 3) * 0.38, 0.81 + Math.floor(i / 3) * 0.08, CZ, G);
  add(box(0.4, 0.22, 0.3), toon({ color: '#b08a5a' }), CX + 0.3, 1.43, CZ, G);                                  // the shoebox of tapes
  add(box(0.3, 0.32, 0.32), toon({ color: '#6a5a4a' }), CX - 0.35, 1.48, CZ, G);
  // the row of tapes on the top shelf (the ending): all with the same name
  const row = new THREE.Group(); row.position.set(CX - 0.42, 1.86, CZ + 0.08); G.add(row);
  for (let i = 0; i < 9; i++) { const c = cassette(ctx, row, label); c.position.set(i * 0.105, 0.035, 0); }
  const doors = [];
  for (const s of [-1, 1]) {                                                         // s=-1 left door hinged at its left edge
    const h = new THREE.Group(); h.position.set(CX + s * CW / 2, 0.1, CZ + CD / 2 + 0.01); G.add(h);
    add(box(CW / 2, CH, 0.035), woodL, -s * CW / 4, CH / 2, 0, h);
    add(box(CW / 2 - 0.14, CH - 0.3, 0.02), wood, -s * CW / 4, CH / 2, 0.022, h);
    add(new THREE.SphereGeometry(0.03, 10, 8), toon({ color: '#d9a845' }), -s * (CW / 2 - 0.07), 1.05, 0.04, h);
    add(box(0.3, 0.42, 0.012), toon({ color: '#a8b4c8' }), -s * CW / 4, 1.5, 0.03, h);                    // small mirror
    doors.push({ h, s });
  }
  // the found tape (held, on the shelf, in the deck)
  const tape = cassette(ctx, G, label); tape.position.set(CX + 0.3, 1.59, CZ + 0.12);
  // the radio-cassette player on a low table against the front wall: you stand with your back to the cupboard
  const TX = -0.7, TZ = RZ - 0.45;
  add(box(1.0, 0.04, 0.7), wood, TX, 0.62, TZ, G);
  for (const [dx, dz] of [[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]]) add(box(0.04, 0.6, 0.04), wood, TX + dx, 0.3, TZ + dz, G);
  add(box(0.9, 0.012, 0.6), toon({ color: '#e8e0f0' }), TX, 0.646, TZ, G);                              // lace cloth
  const radio = new THREE.Group(); radio.position.set(TX, 0.65, TZ + 0.05); radio.rotation.y = Math.PI; G.add(radio);
  const rb = toon({ color: '#3a3a42' }), silver = toon({ color: '#b4b8c4' }), mesh = toon({ color: '#1a1a20' });
  add(box(0.6, 0.3, 0.16), rb, 0, 0.15, 0, radio); add(box(0.6, 0.04, 0.165), silver, 0, 0.27, 0, radio);
  const cones = [];
  for (const s of [-1, 1]) { const sp = add(new THREE.CylinderGeometry(0.095, 0.095, 0.02, 20), mesh, s * 0.19, 0.14, 0.08, radio); sp.rotation.x = Math.PI / 2;
    const cone = add(new THREE.CylinderGeometry(0.035, 0.06, 0.02, 14), toon({ color: '#4a4a52' }), s * 0.19, 0.14, 0.09, radio); cone.rotation.x = Math.PI / 2; cones.push(cone); }
  add(box(0.15, 0.1, 0.01), toon({ color: '#121216' }), 0, 0.13, 0.081, radio);
  const deck = cassette(ctx, radio, label); deck.position.set(0, 0.13, 0.08); deck.scale.setScalar(1.25);
  const reels = []; for (const x of [-0.022, 0.022]) { const r = add(new THREE.CylinderGeometry(0.008, 0.008, 0.01, 6), toon({ color: '#f4f0e4' }), x, 0.125, 0.09, radio, { cast: false }); r.rotation.x = Math.PI / 2; reels.push(r); }
  const keys = []; for (let i = 0; i < 5; i++) keys.push(add(box(0.045, 0.02, 0.04), silver, -0.12 + i * 0.06, 0.3, 0.03, radio));
  const led = new THREE.MeshBasicMaterial({ color: '#3a1010' }); add(box(0.02, 0.012, 0.005), led, 0.11, 0.22, 0.081, radio, { cast: false });
  add(new THREE.CylinderGeometry(0.004, 0.004, 0.5, 4), silver, 0.25, 0.5, -0.04, radio).rotation.z = -0.25;  // aerial
  // wall things: calendar, a framed old photo, a clock that stopped
  const cal = canvasPlane(ctx, 0.36, 0.5, 256, G, { lit: true }); cal.mesh.position.set(RX - 0.11, 1.65, -1.2); cal.mesh.rotation.y = -Math.PI / 2;
  cal.draw('cal', (c, w, h) => { c.fillStyle = '#f6f0e2'; c.fillRect(0, 0, w, h); c.fillStyle = '#c84a3a'; c.fillRect(0, 0, w, h * 0.42); c.fillStyle = '#ffd36a'; c.beginPath(); c.arc(w / 2, h * 0.2, 40, 0, 7); c.fill();
    c.fillStyle = '#444'; for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) c.fillRect(14 + k * 33, h * 0.5 + r * 30, 22, 18); });
  const ph = canvasPlane(ctx, 0.42, 0.32, 256, G, { lit: true }); ph.mesh.position.set(-0.1 + 1.0, 1.75, BZ + 0.13);
  add(box(0.48, 0.38, 0.03), toon({ color: '#c9a86a' }), 0.9, 1.75, BZ + 0.115, G);
  const bl = bulb(ctx, G, 0.2, RH, 0.1);
  const moon = new THREE.PointLight('#8fa8ff', 0, 7, 1.4); moon.position.set(LX + 0.8, 1.8, 0.1); G.add(moon);
  const S0 = (x) => v3(at, x);
  const A = { cupboard: S0([CX, 1.2, CZ + 0.3]), tape: S0([CX + 0.3, 1.59, CZ + 0.12]), tapeRow: S0([CX, 1.9, CZ + 0.1]), radio: S0([TX, 0.78, TZ - 0.03]),
    doorway: S0([DX, 0, BZ + 0.15]), window: S0([LX, 1.5, 0.1]), kidAtCupboard: S0([CX + 0.15, 0, CZ + 0.85]), kidAtRadio: S0([TX + 0.05, 0, TZ - 0.75]), centre: S0([0, 1.2, 0]) };
  return {
    at, A, G, doors, tape, deck, radio, reels, cones, keys, led, bulb: bl, moon, photo: ph, row,
    state(W, f) {
      const open = W.cupboard ?? 0;                   // 0..1 both doors; or [left, right]
      const o = Array.isArray(open) ? open : [open, open];
      doors.forEach((d, i) => { d.h.rotation.y = -d.s * o[i] * 1.9 + (W.creak ? Math.sin(f * 0.3) * 0.01 : 0); });
      const play = W.play ?? 0;                        // 0 stopped, 1 playing
      reels.forEach((r) => { r.rotation.y = play ? f * 0.4 : 0; });
      cones.forEach((c) => { c.position.z = 0.09 + (W.speak ?? 0) * 0.01 * Math.abs(Math.sin(f * 1.7)); });
      keys[1].position.y = play ? 0.29 : 0.3; led.color.set(play ? '#ff4030' : '#3a1010');
      tape.visible = W.tapeOnShelf ?? true; deck.visible = W.tapeInDeck ?? false;
      const flick = W.flicker ? (Math.sin(f * 2.3) * Math.sin(f * 0.71) > 0.55 ? 0.15 : 1) : 1;
      bl.light.intensity = (W.bulb ?? 1.6) * flick; bl.glassM.color.set((W.bulb ?? 1.6) * flick > 0.4 ? bl.color : '#3a3428');
      bl.g.rotation.z = Math.sin(f * 0.05) * 0.04 * (W.sway ?? 1); bl.g.rotation.x = Math.sin(f * 0.037) * 0.03 * (W.sway ?? 1);
      moon.intensity = W.moon ?? 0.6;
    },
  };
}

// ---------- a kid's bedroom ----------
export function bedroom(ctx, { at = [-40, 0, 0] } = {}) {
  const { THREE, add, box, tbox, toon, texM, P, world } = ctx;
  const G = new THREE.Group(); G.position.set(...at); world.add(G);
  const RX = 2.4, RZ = 2.2, RH = 2.7;
  const wall = texM(P.plaster(41, 215), 2, 1, '#c8d4f0'), floor = texM(P.planks(42), 3, 3, '#d8c0a0');
  add(tbox(RX * 2, 0.2, RZ * 2, 1.2), floor, 0, -0.1, 0, G, { cast: false });
  add(tbox(RX * 2, 0.15, RZ * 2, 2), toon({ color: '#e8eaf2' }), 0, RH + 0.07, 0, G, { cast: false });
  add(tbox(RX * 2, RH, 0.2, 1.4), wall, 0, RH / 2, -RZ, G);                                   // back wall (the bed's wall, photos, shadows)
  add(tbox(RX * 2, RH, 0.2, 1.4), wall, 0, RH / 2, RZ, G);
  // right wall: the door with a keypad lock (door 0.9 x 2.05 at z = 0.6)
  const DZ = 0.6, DW = 0.9, DH = 2.05, RXW = RX;
  add(tbox(0.2, RH, RZ + DZ - DW / 2, 1.4), wall, RXW, RH / 2, (-RZ + DZ - DW / 2) / 2, G);
  add(tbox(0.2, RH, RZ - DZ - DW / 2, 1.4), wall, RXW, RH / 2, (RZ + DZ + DW / 2) / 2, G);
  add(tbox(0.2, RH - DH, DW, 1.4), wall, RXW, DH + (RH - DH) / 2, DZ, G);
  add(box(0.3, 2.4, 2), toon({ color: '#0a0a12' }), RXW + 0.9, 1.2, DZ, G);                       // dark landing
  const doorH = new THREE.Group(); doorH.position.set(RXW - 0.02, 0, DZ - DW / 2); G.add(doorH);
  add(tbox(0.06, DH, DW, 1), toon({ color: '#f0ece2' }), 0, DH / 2, DW / 2, doorH);
  for (const y of [0.55, 1.45]) add(box(0.015, 0.6, DW * 0.68), toon({ color: '#ddd6c8' }), -0.035, y, DW / 2, doorH);
  add(box(0.06, 0.04, 0.16), toon({ color: '#b8bcc8' }), -0.06, 1.0, DW - 0.12, doorH);
  const pad = new THREE.Group(); pad.position.set(-0.04, 1.2, DW - 0.11); doorH.add(pad);
  add(box(0.03, 0.2, 0.11), toon({ color: '#20222a' }), 0, 0, 0, pad);
  const keyM = new THREE.MeshBasicMaterial({ color: '#2a3a4a' }), ledM = new THREE.MeshBasicMaterial({ color: '#802020' });
  for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) add(box(0.01, 0.026, 0.026), keyM, -0.016, 0.06 - r * 0.036, -0.032 + k * 0.032, pad, { cast: false });
  add(box(0.01, 0.014, 0.05), ledM, -0.016, 0.088, 0, pad, { cast: false });
  for (const s of [-1, 1]) add(box(0.24, DH, 0.08), toon({ color: '#f4f1ea' }), RXW - 0.06, DH / 2, DZ + s * (DW / 2 + 0.04), G);
  // left wall: window onto the driveway
  const LX = -RX, WZ0 = -0.9, WZ1 = 0.5, WY0 = 0.9, WY1 = 2.1;
  add(tbox(0.2, RH, RZ + WZ0, 1.4), wall, LX, RH / 2, (-RZ + WZ0) / 2, G); add(tbox(0.2, RH, RZ - WZ1, 1.4), wall, LX, RH / 2, (RZ + WZ1) / 2, G);
  add(tbox(0.2, WY0, WZ1 - WZ0, 1.4), wall, LX, WY0 / 2, (WZ0 + WZ1) / 2, G); add(tbox(0.2, RH - WY1, WZ1 - WZ0, 1.4), wall, LX, WY1 + (RH - WY1) / 2, (WZ0 + WZ1) / 2, G);
  const frameM = toon({ color: '#f4f1ea' });
  add(box(0.08, WY1 - WY0, 0.05), frameM, LX, (WY0 + WY1) / 2, (WZ0 + WZ1) / 2, G); add(box(0.32, 0.06, WZ1 - WZ0 + 0.2), frameM, LX + 0.1, WY0, (WZ0 + WZ1) / 2, G);
  const curt = toon({ color: '#3a5a9a' }); for (const z of [WZ0 - 0.12, WZ1 + 0.12]) add(box(0.06, WY1 - WY0 + 0.5, 0.3), curt, LX + 0.16, (WY0 + WY1) / 2 + 0.1, z, G);
  // outside: driveway, gate, a streetlight, mum's car
  const out = new THREE.Group(); out.position.set(LX - 6, 0, 0); G.add(out);
  add(new THREE.BoxGeometry(10, 0.1, 14), toon({ color: '#3a3c44' }), 0, -0.6, 0, out, { cast: false });
  add(new THREE.BoxGeometry(10, 1.4, 0.2), toon({ color: '#6a6458' }), 0, 0.1, -6, out);
  const sl = new THREE.Group(); sl.position.set(-2, -0.6, -5); out.add(sl);
  add(new THREE.CylinderGeometry(0.06, 0.08, 4.4, 8), toon({ color: '#3a3e52' }), 0, 2.2, 0, sl);
  const streetGlow = new THREE.MeshBasicMaterial({ color: '#ffd28a' }); add(new THREE.SphereGeometry(0.2, 10, 8), streetGlow, 0.3, 4.4, 0, sl, { cast: false });
  const street = new THREE.PointLight('#ffc070', 0, 14, 1.2); street.position.set(-2, 3.4, -5); out.add(street);
  const mumCar = car(ctx, out, { color: '#b03a3a' }); mumCar.g.position.set(1.5, -0.55, -1.5); mumCar.g.rotation.y = Math.PI / 2;
  const headL = new THREE.SpotLight('#fff0c8', 0, 16, 0.5, 0.6, 1.2); headL.position.set(1.5, 0.3, 1); headL.target.position.set(1.5, 0, 6); out.add(headL); out.add(headL.target);
  // the bed against the back wall; space under it stays dark
  const BX = -0.5, BW = 2.0, BD = 1.05, BZ = -RZ + 0.1 + BD / 2;
  const bedW = toon({ color: '#8a5a3a' });
  add(box(BW, 0.08, BD), bedW, BX, 0.32, BZ, G);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(box(0.06, 0.32, 0.06), bedW, BX + dx * (BW / 2 - 0.04), 0.16, BZ + dz * (BD / 2 - 0.04), G);
  add(box(0.08, 0.95, BD), bedW, BX - BW / 2, 0.47, BZ, G); add(box(0.08, 0.6, BD), bedW, BX + BW / 2, 0.3, BZ, G);
  add(box(BW - 0.1, 0.16, BD - 0.06), toon({ color: '#f2f0ea' }), BX, 0.44, BZ, G);
  const blanket = add(box(BW * 0.72, 0.08, BD + 0.04), toon({ color: '#d8584a' }), BX + 0.25, 0.54, BZ, G);
  add(box(0.42, 0.14, 0.7), toon({ color: '#fbfbf6' }), BX - 0.72, 0.58, BZ, G);
  const under = add(box(BW - 0.12, 0.26, BD - 0.1), new THREE.MeshBasicMaterial({ color: '#030306' }), BX, 0.15, BZ, G, { cast: false });
  // bedside table + lamp, a rug, a wardrobe, posters, the photo frame on the back wall
  add(box(0.45, 0.5, 0.4), toon({ color: '#c89a6a' }), BX - BW / 2 - 0.35, 0.25, BZ - 0.1, G);
  add(new THREE.CylinderGeometry(0.06, 0.08, 0.24, 10), toon({ color: '#e0c060' }), BX - BW / 2 - 0.35, 0.62, BZ - 0.1, G);
  const lshade = add(new THREE.CylinderGeometry(0.1, 0.16, 0.18, 14, 1, true), new THREE.MeshBasicMaterial({ color: '#fff0c0', side: THREE.DoubleSide }), BX - BW / 2 - 0.35, 0.82, BZ - 0.1, G, { cast: false });
  const lamp = new THREE.PointLight('#ffcf8a', 0, 6, 1.4); lamp.position.set(BX - BW / 2 - 0.35, 0.95, BZ + 0.1); G.add(lamp);
  const rug = add(new THREE.CylinderGeometry(0.9, 0.9, 0.02, 30), toon({ color: '#4a8a8a' }), 0.4, 0.01, 0.6, G, { cast: false }); rug.scale.z = 0.7;
  add(box(0.6, 1.9, 1.1), toon({ color: '#9a6a46' }), RX - 0.4, 0.95, -1.4, G);
  for (const [x, y, c] of [[0.8, 1.7, '#3a8ad0'], [1.45, 1.55, '#e0a03a']]) add(box(0.45, 0.6, 0.02), toon({ color: c }), x, y, -RZ + 0.11, G);
  const photo = canvasPlane(ctx, 0.36, 0.46, 256, G, { lit: true }); photo.mesh.position.set(BX - 0.1, 1.75, -RZ + 0.13);
  add(box(0.44, 0.54, 0.03), toon({ color: '#3a2a1a' }), BX - 0.1, 1.75, -RZ + 0.115, G);
  const moon = new THREE.PointLight('#8fa8ff', 0, 7, 1.3); moon.position.set(LX + 0.8, 1.7, -0.2); G.add(moon);
  const S0 = (x) => v3(at, x);
  const A = { bed: S0([BX, 0.6, BZ]), pillow: S0([BX - 0.72, 0.7, BZ]), underBed: S0([BX, 0.15, BZ + BD / 2]), door: S0([RXW - 0.05, 1.1, DZ]), keypad: S0([RXW - 0.1, 1.2, DZ + DW / 2 - 0.11]),
    window: S0([LX, 1.5, (WZ0 + WZ1) / 2]), outside: S0([LX - 4.5, 0, -1.5]), photo: S0([BX - 0.1, 1.75, -RZ + 0.13]), wall: S0([0.8, 1.4, -RZ + 0.11]), floor: S0([0.4, 0, 0.6]), centre: S0([0, 1.2, 0]) };
  return {
    at, A, G, doorH, keyM, ledM, blanket, under, photo, mumCar, lamp, moon, street, streetGlow, headL, lshade,
    state(W, f) {
      doorH.rotation.y = (W.door ?? 0) * 1.4;
      const beep = W.beep ?? -1;                       // which key lights up, -1 none
      keyM.color.set(beep >= 0 ? '#9fe0ff' : '#2a3a4a'); ledM.color.set(W.unlocked ? '#30ff60' : beep >= 0 ? '#ffb030' : '#802020');
      lamp.intensity = W.lamp ?? 0; lshade.material.color.set(W.lamp ? '#fff0c0' : '#6a6458');
      moon.intensity = W.moon ?? 0.7; street.intensity = W.street ?? 1.2; streetGlow.color.set(W.street === 0 ? '#3a3a3a' : '#ffd28a');
      headL.intensity = W.headlights ?? 0; mumCar.g.visible = W.car ?? true;
      if (W.carIn !== undefined) mumCar.g.position.z = -1.5 - 8 * (1 - W.carIn);
    },
  };
}

// ---------- a morning road to school ----------
export function street(ctx, { at = [0, 0, 60] } = {}) {
  const { THREE, add, box, tbox, toon, texM, P, world } = ctx;
  const G = new THREE.Group(); G.position.set(...at); world.add(G);
  add(new THREE.BoxGeometry(80, 0.1, 7), toon({ color: '#4a4c54' }), 0, -0.05, 0, G, { cast: false });                     // road along x
  for (let x = -38; x < 40; x += 3) add(box(1.4, 0.012, 0.14), new THREE.MeshBasicMaterial({ color: '#e8e4d0' }), x, 0.006, 0, G, { cast: false });
  const path = texM(P.stone(51, 30, 10, 62, 96, 96), 20, 1, '#d8d0c0');
  add(new THREE.BoxGeometry(80, 0.18, 2.4), path, 0, 0.04, -4.7, G, { cast: false }); add(new THREE.BoxGeometry(80, 0.18, 2.4), path, 0, 0.04, 4.7, G, { cast: false });
  add(box(80, 0.2, 0.18), toon({ color: '#e8e4d8' }), 0, 0.08, -3.5, G); add(box(80, 0.2, 0.18), toon({ color: '#e8e4d8' }), 0, 0.08, 3.5, G);
  // compound walls and houses on the far side, the school wall on the near side
  const cols = ['#e8c87a', '#9ac0e0', '#e8a48a', '#b8d89a', '#f0e0c8', '#c8a8d8'];
  for (let i = 0; i < 9; i++) {
    const x = -32 + i * 8;
    add(box(7.6, 1.5, 0.25), toon({ color: '#ece6da' }), x, 0.75, -6.2, G);
    const h = add(box(6, 4 + (i % 3), 5), toon({ color: cols[i % cols.length] }), x, (4 + (i % 3)) / 2, -9.6, G);
    for (const wx of [-1.6, 1.6]) add(box(0.9, 1.0, 0.05), toon({ color: '#3a4a6a' }), x + wx, 2.6, -7.08, G);
  }
  const schoolWall = add(box(80, 2.0, 0.3), toon({ color: '#d8c49a' }), 0, 1.0, 6.2, G);
  add(box(80, 0.15, 0.4), toon({ color: '#a83a3a' }), 0, 2.05, 6.2, G);
  const gate = new THREE.Group(); gate.position.set(6, 0, 6.2); G.add(gate);
  for (const s of [-1, 1]) add(box(0.5, 2.6, 0.5), toon({ color: '#a83a3a' }), s * 1.8, 1.3, 0, gate);
  const sign = canvasPlane(ctx, 3.4, 0.6, 512, gate, { lit: true }); sign.mesh.position.set(0, 2.85, -0.27); sign.mesh.rotation.y = Math.PI;
  sign.draw('school', (c, w, h) => { c.fillStyle = '#1e3a8a'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffd23f'; c.font = '900 52px Arial Black'; c.textAlign = 'center'; c.fillText('PUBLIC SCHOOL', w / 2, h * 0.68); });
  for (let k = 0; k < 9; k++) add(box(0.04, 1.9, 0.04), toon({ color: '#2a2c34' }), 4.5 + k * 0.38, 0.95, 6.2, G);
  for (const x of [-26, -14, -6, 14, 22, 30]) tree(ctx, G, x, 5.2, 1.1);
  for (const x of [-20, 10, 26]) tree(ctx, G, x, -5.2, 0.95);
  // the lamppost with the poster
  const LPX = -1.5, LPZ = -4.0;
  add(new THREE.CylinderGeometry(0.08, 0.11, 5.5, 10), toon({ color: '#5a6070' }), LPX, 2.75, LPZ, G);
  add(box(1.0, 0.06, 0.12), toon({ color: '#5a6070' }), LPX + 0.45, 5.45, LPZ, G);
  const poster = canvasPlane(ctx, 0.5, 0.7, 512, G, { lit: true }); poster.mesh.position.set(LPX, 1.55, LPZ + 0.16);
  // the police car (drives up along the road)
  const police = car(ctx, G, { color: '#f2f2f2', police: true }); police.g.position.set(-14, 0.0, 1.6);
  const S0 = (x) => v3(at, x);
  const A = { poster: S0([LPX, 1.55, LPZ + 0.16]), lamppost: S0([LPX, 1.6, LPZ]), kid: S0([LPX + 0.9, 0, LPZ + 0.9]), road: S0([0, 0, 0]), gate: S0([6, 1.4, 6.2]), carStop: S0([0.3, 0, 1.6]), centre: S0([0, 1.2, 0]) };
  return {
    at, A, G, poster, police,
    state(W, f) {
      const k = W.policeIn ?? -1;                     // 0..1 drives from far left to its stop beside the kid
      police.g.visible = k >= 0; if (k >= 0) police.g.position.x = -14 + (0.3 + 14) * k;
      police.flash(f, !!W.siren);
    },
  };
}
