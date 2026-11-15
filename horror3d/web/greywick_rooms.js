// Greywick interiors for Season 1. Each is a closed room built far from the street; cameras work inside it.
//   cottage(ctx)  the lamplighter's cottage: fire, table and lamp, Hollis's chair, ladders, calendar
//   loft(ctx)     Tom's loft: bed, the cupboard at its foot, a window onto the last lamp on the quay
//   bakery(ctx)   Pell's Bakery: ovens, rows of bread, the apron on its hook, the shawl, the tea, footprints in the flour
//   gallery(ctx)  Ashcombe Manor's long gallery: old portraits, moonlit windows, and the new portraits at the far end
// Every room returns { at, A (named spots, world space), state(W, f) }.
import * as TT from './toon.js';
import { canvasPlane } from './sets.js';

const shell = (ctx, at, RX, RZ, RH, wallCol, floorMat, seed) => {
  const { THREE, add, tbox, toon, texM, P, world } = ctx;
  const G = new THREE.Group(); G.position.set(...at); world.add(G);
  const wall = texM(P.plaster(seed, 60), 2, 1, wallCol);
  add(tbox(RX * 2, 0.2, RZ * 2, 1.2), floorMat, 0, -0.1, 0, G, { cast: false });
  add(tbox(RX * 2, 0.15, RZ * 2, 2), toon({ color: '#2c2824' }), 0, RH + 0.07, 0, G, { cast: false });
  add(tbox(RX * 2, RH, 0.2, 1.4), wall, 0, RH / 2, -RZ, G); add(tbox(RX * 2, RH, 0.2, 1.4), wall, 0, RH / 2, RZ, G);
  add(tbox(0.2, RH, RZ * 2, 1.4), wall, -RX, RH / 2, 0, G); add(tbox(0.2, RH, RZ * 2, 1.4), wall, RX, RH / 2, 0, G);
  return { G, wp: (x, y, z) => [at[0] + x, at[1] + y, at[2] + z] };
};
const glow = (THREE, c) => new THREE.MeshBasicMaterial({ color: c });
const oilLamp = (ctx, G, x, y, z) => { const { THREE, add, toon } = ctx;
  add(new THREE.CylinderGeometry(0.07, 0.09, 0.08, 10), toon({ color: '#8a6a2a' }), x, y + 0.04, z, G);
  const m = glow(THREE, '#ffd48a'), gl = add(new THREE.CylinderGeometry(0.045, 0.06, 0.2, 8), m, x, y + 0.18, z, G, { cast: false }); gl.userData.ndSkip = true;
  const l = new THREE.PointLight('#ffb866', 0, 7, 1.4); l.position.set(x, y + 0.35, z); G.add(l); return { m, l }; };

export function cottage(ctx, { at = [80, 0, -200] } = {}) {
  const { THREE, add, box, toon, texM, P } = ctx, RX = 2.6, RZ = 2.2, RH = 2.5;
  const { G, wp } = shell(ctx, at, RX, RZ, RH, '#b9a98c', texM(P.planks(61), 3, 3, '#8a6a4a'), 61);
  const stone = toon({ color: '#6c6a70' }), wood = toon({ color: '#5a3d26' }), woodL = toon({ color: '#7a5636' });
  add(box(1.8, 1.7, 0.5), stone, -0.9, 0.85, -RZ + 0.3, G); add(box(1.1, 0.9, 0.3), toon({ color: '#141216' }), -0.9, 0.5, -RZ + 0.45, G);          // fireplace
  const fireM = glow(THREE, '#ff9a3a'); const fire = add(new THREE.ConeGeometry(0.28, 0.5, 7), fireM, -0.9, 0.32, -RZ + 0.5, G, { cast: false }); fire.userData.ndSkip = true;
  const fireL = new THREE.PointLight('#ff8a3a', 0, 7, 1.3); fireL.position.set(-0.9, 0.7, -RZ + 1.0); G.add(fireL);
  add(box(2.1, 0.1, 0.36), wood, -0.9, 1.75, -RZ + 0.32, G);                                                                                   // mantel + clock
  add(box(0.22, 0.3, 0.12), toon({ color: '#3a2a1e' }), -0.5, 1.95, -RZ + 0.3, G); add(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 14), glow(THREE, '#e8dcc0'), -0.5, 1.98, -RZ + 0.37, G).rotation.x = Math.PI / 2;
  add(new THREE.CylinderGeometry(0.1, 0.13, 0.2, 10), toon({ color: '#2a2a30' }), -1.35, 0.3, -RZ + 0.75, G);                                   // kettle
  add(box(1.3, 0.06, 0.8), woodL, 0.6, 0.74, 0.2, G); for (const [dx, dz] of [[-0.58, -0.33], [0.58, -0.33], [-0.58, 0.33], [0.58, 0.33]]) add(box(0.06, 0.74, 0.06), wood, 0.6 + dx, 0.37, 0.2 + dz, G);
  const lamp = oilLamp(ctx, G, 0.6, 0.77, 0.2);
  const note = canvasPlane(ctx, 0.3, 0.2, 256, G, { lit: true }); note.mesh.rotation.x = -Math.PI / 2; note.mesh.position.set(0.25, 0.775, 0.3); note.mesh.visible = false;
  const chair = new THREE.Group(); chair.position.set(-0.9, 0, -0.6); G.add(chair);                                                             // Hollis's chair by the fire
  add(box(0.7, 0.4, 0.7), toon({ color: '#5a3a34' }), 0, 0.3, 0, chair); add(box(0.7, 0.7, 0.14), toon({ color: '#5a3a34' }), 0, 0.8, 0.3, chair);
  for (const s of [-1, 1]) add(box(0.12, 0.3, 0.7), toon({ color: '#4a2e2a' }), s * 0.35, 0.6, 0, chair);
  add(box(0.4, 0.42, 0.4), woodL, 1.3, 0.21, 0.3, G);                                                                                           // Tom's stool
  for (let i = 0; i < 2; i++) { const ld = new THREE.Group(); ld.position.set(-RX + 0.25, 0, 0.6 + i * 0.5); ld.rotation.z = -0.14; G.add(ld);   // ladders
    for (const s of [-1, 1]) add(box(0.05, 2.3, 0.05), woodL, 0, 1.15, s * 0.2, ld); for (let k = 0; k < 7; k++) add(box(0.04, 0.04, 0.4), woodL, 0, 0.3 + k * 0.3, 0, ld); }
  for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 10), toon({ color: '#6a7a6a' }), -RX + 0.4 + i * 0.3, 0.15, 1.7, G);  // oil cans
  const cal = canvasPlane(ctx, 0.4, 0.55, 256, G, { lit: true }); cal.mesh.position.set(0.9, 1.55, -RZ + 0.11);
  cal.draw('cal', (g, w, h) => { g.fillStyle = '#efe6cf'; g.fillRect(0, 0, w, h); g.fillStyle = '#6a2a22'; g.fillRect(0, 0, w, h * 0.2); g.fillStyle = '#f4ead2'; g.font = '700 34px Georgia'; g.textAlign = 'center'; g.fillText('DECEMBER', w / 2, h * 0.14);
    g.fillStyle = '#3a2e26'; g.font = '700 150px Georgia'; g.fillText('1888', w / 2, h * 0.62); g.font = '600 30px Georgia'; g.fillText('Greywick Almanack', w / 2, h * 0.86); });
  const door = add(box(0.1, 2.0, 0.9), wood, RX - 0.1, 1.0, 1.0, G);
  const A = { tomStand: wp(1.0, 0, 0.95), hollisStand: wp(-0.2, 0, -0.2), chair: wp(-0.9, 0.9, -0.6), table: wp(0.6, 0.8, 0.2), fire: wp(-0.9, 0.6, -RZ + 0.5), door: wp(RX - 0.2, 1.0, 1.0), calendar: wp(0.9, 1.55, -RZ + 0.12), centre: wp(0, 1.2, 0) };
  return { at, A, G, note, state(W = {}, f = 0) { const fl = 0.9 + 0.1 * Math.sin(f * 0.5) * Math.sin(f * 0.13);
    fireL.intensity = (W.fire ?? 2.2) * fl; fire.visible = (W.fire ?? 2.2) > 0; fire.scale.y = 0.9 + 0.2 * Math.sin(f * 0.6);
    lamp.l.intensity = W.lamp ?? 1.6; lamp.m.color.set((W.lamp ?? 1.6) > 0 ? '#ffd48a' : '#4a4438');
    note.mesh.visible = !!W.note; if (W.note) note.draw(W.note, (g, w, h) => { g.fillStyle = '#efe6cf'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2420'; g.font = 'italic 26px Georgia'; g.fillText('Tom. It is in the clock.', 14, 60); g.fillText('Look for the th', 14, 104);
      g.strokeStyle = '#2a2420'; g.lineWidth = 3; g.beginPath(); g.moveTo(196, 100); g.quadraticCurveTo(230, 104, w, 150); g.stroke(); }); } };
}

export function loft(ctx, { at = [80, 0, -170] } = {}) {
  const { THREE, add, box, toon, texM, P } = ctx, RX = 1.9, RZ = 1.6, RH = 2.05;
  const { G, wp } = shell(ctx, at, RX, RZ, RH, '#a89a84', texM(P.planks(62), 2, 2, '#7a5c40'), 62);
  const wood = toon({ color: '#5a3d26' }), woodL = toon({ color: '#74502f' });
  for (const x of [-1.2, 0, 1.2]) add(box(0.14, 0.14, RZ * 2), wood, x, RH - 0.07, 0, G);                                                         // beams
  const BX = -0.5, BZ = -RZ + 0.55;                                                                                                              // the bed along the back wall, head to the left
  add(box(1.9, 0.3, 0.85), wood, BX, 0.25, BZ, G); add(box(1.8, 0.14, 0.8), toon({ color: '#e6e0d2' }), BX, 0.46, BZ, G);
  add(box(1.25, 0.1, 0.84), toon({ color: '#5a6a8a' }), BX + 0.3, 0.55, BZ, G); add(box(0.4, 0.12, 0.6), toon({ color: '#f1ede2' }), BX - 0.7, 0.58, BZ, G);
  add(box(0.08, 0.8, 0.85), wood, BX - 0.95, 0.5, BZ, G);
  const CX = RX - 0.42, CZ = BZ + 0.1;                                                                                                           // the cupboard at the foot of the bed
  add(box(0.7, 1.75, 0.95), wood, CX, 0.875, CZ, G); add(box(0.76, 0.08, 1.0), wood, CX, 1.79, CZ, G);
  const cdoors = [-1, 1].map((s) => { const h = new THREE.Group(); h.position.set(CX - 0.36, 0, CZ + s * 0.46); G.add(h);
    add(box(0.04, 1.6, 0.45), woodL, 0, 0.85, -s * 0.225, h); add(new THREE.SphereGeometry(0.03, 8, 6), toon({ color: '#c8a23a' }), -0.04, 0.9, -s * 0.4, h); return { h, s }; });
  const gap = add(box(0.02, 1.6, 0.03), glow(THREE, '#050508'), CX - 0.385, 0.85, CZ, G, { cast: false });
  const WZ = 0.5;                                                                                                                                // window on the left wall: the last lamp on the quay
  add(box(0.06, 0.9, 0.9), toon({ color: '#d8d2c4' }), -RX + 0.11, 1.2, WZ, G);
  const nightM = glow(THREE, '#0e1630'); const pane = add(box(0.04, 0.78, 0.78), nightM, -RX + 0.13, 1.2, WZ, G, { cast: false }); pane.userData.ndSkip = true;
  add(box(0.05, 0.78, 0.04), toon({ color: '#d8d2c4' }), -RX + 0.15, 1.2, WZ, G); add(box(0.05, 0.04, 0.78), toon({ color: '#d8d2c4' }), -RX + 0.15, 1.2, WZ, G);
  const lampM = glow(THREE, '#ffd48a'); const outLamp = add(new THREE.SphereGeometry(0.06, 10, 8), lampM, -RX + 0.165, 1.32, WZ + 0.2, G, { cast: false }); outLamp.userData.ndSkip = true;
  const winL = new THREE.PointLight('#ffb866', 0, 5, 1.3); winL.position.set(-RX + 0.6, 1.3, WZ); G.add(winL);
  const moon = new THREE.PointLight('#8fa8ff', 0, 6, 1.3); moon.position.set(-RX + 0.7, 1.5, WZ); G.add(moon);
  add(box(0.5, 0.45, 0.4), woodL, BX - 0.6, 0.22, BZ + 0.9, G);
  const A = { bed: wp(BX, 0.6, BZ), pillow: wp(BX - 0.7, 0.7, BZ), cupboard: wp(CX - 0.36, 0.9, CZ), window: wp(-RX + 0.15, 1.2, WZ), tomSit: wp(CX - 0.75, 0, CZ + 0.05), centre: wp(0, 1.0, 0.3) };
  return { at, A, G, state(W = {}, f = 0) { const on = W.outLamp ?? true; lampM.color.set(on ? '#ffd48a' : '#2a2c34'); winL.intensity = on ? 1.3 : 0; moon.intensity = W.moon ?? 0.9;
    const o = W.cupboard ?? 0; cdoors.forEach((d) => { d.h.rotation.y = d.s * o * 1.2; }); gap.visible = o < 0.02;
    cdoors.forEach((d) => { d.h.position.x = CX - 0.36 - (W.knock ? Math.max(0, Math.sin(f * 1.3)) * 0.008 : 0); }); } };
}

export function bakery(ctx, { at = [110, 0, -200] } = {}) {
  const { THREE, add, box, toon, texM, P } = ctx, RX = 2.6, RZ = 2.1, RH = 2.6;
  const { G, wp } = shell(ctx, at, RX, RZ, RH, '#d8c8a8', texM(P.stone(63, 30, 12, 58, 128, 128), 3, 3, '#b8a890'), 63);
  const brick = texM(P.stone(64, 14, 40, 42, 64, 32), 3, 3, '#a8604a'), wood = toon({ color: '#6a4628' }), woodL = toon({ color: '#8a6238' });
  add(box(3.0, RH, 0.7), brick, -0.8, RH / 2, -RZ + 0.4, G);                                                                                    // the oven wall
  const ovenM = glow(THREE, '#ff8a2a'); for (const x of [-1.5, -0.1]) { const o = add(box(0.9, 0.5, 0.1), ovenM, x, 0.95, -RZ + 0.76, G, { cast: false }); o.userData.ndSkip = true; add(box(1.0, 0.08, 0.14), toon({ color: '#2a2a2e' }), x, 1.24, -RZ + 0.76, G); }
  const ovenL = new THREE.PointLight('#ff8a3a', 0, 8, 1.3); ovenL.position.set(-0.8, 1.0, -RZ + 1.3); G.add(ovenL);
  add(box(3.2, 0.9, 0.7), wood, -0.3, 0.45, 0.5, G); add(box(3.3, 0.06, 0.8), woodL, -0.3, 0.93, 0.5, G);                                        // the counter, bread in rows
  const loaf = toon({ color: '#c8873e' }), loafD = toon({ color: '#a8672e' });
  for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) { const l = add(new THREE.SphereGeometry(0.14, 10, 8), (i + r) % 2 ? loaf : loafD, -1.6 + i * 0.36, 1.02, 0.34 + r * 0.32, G); l.scale.set(1.15, 0.6, 0.85); }
  add(box(1.6, 0.05, 0.3), woodL, 1.5, 1.6, -RZ + 0.26, G); for (let i = 0; i < 4; i++) { const l = add(new THREE.SphereGeometry(0.13, 10, 8), loaf, 0.95 + i * 0.36, 1.71, -RZ + 0.26, G); l.scale.set(1.1, 0.6, 0.8); }
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6), toon({ color: '#2a2a2e' }), RX - 0.14, 1.75, -0.6, G).rotation.z = Math.PI / 2;            // the hook and her apron
  add(box(0.05, 0.85, 0.5), toon({ color: '#f1ece0' }), RX - 0.16, 1.3, -0.6, G);
  const ch = new THREE.Group(); ch.position.set(1.5, 0, -0.9); ch.rotation.y = -0.5; G.add(ch);                                                  // the chair and her shawl
  add(box(0.45, 0.05, 0.45), woodL, 0, 0.46, 0, ch); add(box(0.45, 0.55, 0.05), woodL, 0, 0.76, -0.2, ch); for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) add(box(0.04, 0.46, 0.04), wood, dx, 0.23, dz, ch);
  add(box(0.5, 0.4, 0.09), toon({ color: '#7a4a6a' }), 0, 0.86, -0.2, ch);
  add(new THREE.CylinderGeometry(0.05, 0.04, 0.08, 10), toon({ color: '#e8e4da' }), 1.05, 1.0, 0.5, G);                                          // her cup of tea
  const steam = add(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false }), 1.05, 1.16, 0.5, G, { cast: false }); steam.userData.ndSkip = true;
  const fl = canvasPlane(ctx, 4.4, 1.8, 1024, G, { lit: true, alpha: true }); fl.mesh.rotation.x = -Math.PI / 2; fl.mesh.position.set(0.2, 0.012, 1.25);   // flour on the floor, her footprints to the door
  fl.draw('flour', (g, w, h) => { g.fillStyle = 'rgba(244,240,230,0.82)'; g.beginPath(); g.ellipse(w * 0.5, h * 0.5, w * 0.47, h * 0.42, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(150,130,110,0.9)'; for (let i = 0; i < 9; i++) { g.save(); g.translate(w * 0.14 + i * w * 0.083, h * (0.4 + (i % 2) * 0.1)); g.rotate(Math.PI / 2 + 0.08); g.beginPath(); g.ellipse(0, 0, 13, 30, 0, 0, 7); g.fill(); g.restore(); }
    g.fillStyle = 'rgba(184,168,144,0.95)'; g.fillRect(w * 0.1, h * 0.62, w * 0.8, h * 0.13); });                                              // beside them: a strip swept clean
  const DX = 1.3; add(box(1.0, 2.1, 0.12), glow(THREE, '#1a2438'), DX, 1.05, RZ - 0.06, G, { cast: false });                                     // the open door: night and fog outside
  add(box(0.1, 2.1, 0.9), wood, DX + 0.55, 1.05, RZ - 0.5, G);
  const cold = new THREE.PointLight('#8fa8ff', 0, 6, 1.4); cold.position.set(DX, 1.4, RZ - 0.6); G.add(cold);
  const A = { counter: wp(-0.3, 1.0, 0.5), oven: wp(-0.8, 1.0, -RZ + 0.8), apron: wp(RX - 0.2, 1.3, -0.6), chair: wp(1.5, 0.8, -0.9), tea: wp(1.05, 1.05, 0.5), floor: wp(0.2, 0, 1.25), door: wp(DX, 1.0, RZ - 0.1), tomDoor: wp(DX - 0.1, 0, RZ - 0.7), centre: wp(0, 1.2, 0) };
  return { at, A, G, state(W = {}, f = 0) { ovenL.intensity = (W.oven ?? 2.4) * (0.92 + 0.08 * Math.sin(f * 0.4)); cold.intensity = W.cold ?? 1.2;
    steam.visible = W.steam ?? true; steam.position.y = 1.14 + ((f * 0.004) % 0.14); steam.material.opacity = 0.35 * (1 - ((f * 0.004) % 0.14) / 0.14); } };
}

/** a painted portrait: who = cast name; half = only the face is finished; date = text in the corner */
export const paintPortrait = (g, w, h, who, { half = false, date = '', seed = 5, expr = 'neutral', holding = null } = {}) => {
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#4a3a2c'); bg.addColorStop(1, '#1e1814'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.save(); const s = w * 1.15 / 600; g.translate(w / 2 - 300 * s, h * 0.08); g.scale(s, s); TT.romanFront(new TT.Pen(g), who, { seed, expr, blink: 0, look: 0 }); g.restore();
  if (holding === 'loaf') { g.fillStyle = '#c8873e'; g.strokeStyle = '#241726'; g.lineWidth = 5; g.beginPath(); g.ellipse(w / 2, h * 0.9, w * 0.2, h * 0.07, 0, 0, 7); g.fill(); g.stroke(); }
  if (half) { g.fillStyle = '#d9cfb8'; g.fillRect(0, h * 0.5, w, h * 0.5); g.strokeStyle = '#8a8478'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(w * 0.3, h * 0.5); g.quadraticCurveTo(w * 0.2, h * 0.8, w * 0.24, h); g.moveTo(w * 0.7, h * 0.5); g.quadraticCurveTo(w * 0.8, h * 0.8, w * 0.76, h); g.moveTo(w * 0.5, h * 0.52); g.lineTo(w * 0.5, h * 0.7); g.stroke(); }
  g.fillStyle = 'rgba(255,240,210,0.07)'; g.fillRect(0, 0, w, h);
  if (date) { g.fillStyle = '#e8d9a8'; g.font = `italic ${Math.round(w * 0.075)}px Georgia`; g.textAlign = 'right'; g.fillText(date, w * 0.95, h * 0.96); }
};

export function gallery(ctx, { at = [140, 0, -200] } = {}) {
  const { THREE, add, box, toon, texM, P } = ctx, RX = 2.2, RZ = 11, RH = 4.2;
  const { G, wp } = shell(ctx, at, RX, RZ, RH, '#5a3a3a', texM(P.planks(65), 2, 10, '#5a4030'), 65);
  add(box(1.4, 0.02, RZ * 2 - 1), toon({ color: '#6a1e24' }), 0, 0.012, 0, G, { cast: false });                                                  // carpet runner
  const gilt = toon({ color: '#b8923a' }), frameW = toon({ color: '#d8d2c4' });
  const moonM = new THREE.MeshBasicMaterial({ color: '#8fa8e8', transparent: true, opacity: 0.16, depthWrite: false }), paneM = glow(THREE, '#2a3a6a');
  const moons = [];
  for (let i = 0; i < 5; i++) { const z = -8 + i * 4;                                                                                           // tall windows on the left, moonlight in stripes
    add(box(0.08, 2.9, 1.3), frameW, -RX + 0.12, 2.0, z, G); const pn = add(box(0.06, 2.7, 1.1), paneM, -RX + 0.14, 2.0, z, G, { cast: false }); pn.userData.ndSkip = true;
    add(box(0.07, 2.7, 0.05), frameW, -RX + 0.16, 2.0, z, G); for (const y of [1.4, 2.6]) add(box(0.07, 0.05, 1.1), frameW, -RX + 0.16, y, z, G);
    const st = add(new THREE.PlaneGeometry(3.4, 1.1), moonM, -0.4, 0.02, z + 0.5, G, { cast: false }); st.rotation.x = -Math.PI / 2; st.rotation.z = 0.25; st.userData.ndSkip = true;
    if (i % 2 === 0) { const l = new THREE.PointLight('#8fa8ff', 0, 9, 1.3); l.position.set(-RX + 0.9, 2.2, z); G.add(l); moons.push(l); } }
  const OLD = ['mabry', 'gran', 'grandpa', 'milk', 'lady', 'hollis', 'ned', 'granNight', 'mum'];
  OLD.forEach((who, i) => { const z = -9 + i * 2.25, cp = canvasPlane(ctx, 1.0, 1.3, 256, G, { lit: true }); cp.mesh.position.set(RX - 0.17, 2.0, z); cp.mesh.rotation.y = -Math.PI / 2;
    add(box(0.05, 1.5, 1.2), gilt, RX - 0.13, 2.0, z, G); cp.draw('old' + i, (g, w, h) => paintPortrait(g, w, h, who, { seed: 100 + i * 7, expr: i % 3 ? 'neutral' : 'stern' })); });
  const news = [-1.25, 0, 1.25].map((x, i) => { const cp = canvasPlane(ctx, 1.0, 1.3, 512, G, { lit: true }); cp.mesh.position.set(x, 2.0, -RZ + 0.15);                 // the far wall: the new portraits
    cp.mesh.material = new THREE.MeshBasicMaterial({ map: cp.tex, color: '#a6a0aa' });                 // readable in the dark gallery
    const fr = add(box(1.2, 1.5, 0.05), gilt, x, 2.0, -RZ + 0.11, G); cp.mesh.visible = fr.visible = false; return { cp, fr, x }; });
  const brush = new THREE.Group(); brush.position.set(1.25, 0.03, -RZ + 0.7); brush.rotation.y = 0.6; G.add(brush);
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), toon({ color: '#7a5636' }), 0, 0, 0, brush).rotation.z = Math.PI / 2; add(box(0.05, 0.02, 0.03), toon({ color: '#3a3a40' }), 0.17, 0, 0, brush);
  const candles = [-6, 0, 6].map((z) => { add(box(0.3, 1.0, 0.3), toon({ color: '#3a2a22' }), RX - 0.5, 0.5, z + 1.1, G); add(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 6), toon({ color: '#eee6d0' }), RX - 0.5, 1.11, z + 1.1, G);
    const fm = glow(THREE, '#ffd48a'), fl = add(new THREE.SphereGeometry(0.035, 8, 6), fm, RX - 0.5, 1.26, z + 1.1, G, { cast: false }); fl.userData.ndSkip = true; fl.scale.y = 1.6;
    const l = new THREE.PointLight('#ffb866', 0, 6, 1.5); l.position.set(RX - 0.7, 1.4, z + 1.1); G.add(l); return { fm, fl, l }; });
  const door = add(box(1.1, 2.3, 0.1), toon({ color: '#3a2a22' }), -1.2, 1.15, RZ - 0.1, G);
  const A = { far: wp(0, 2.0, -RZ + 0.13), slot: news.map((n) => wp(n.x, 2.0, -RZ + 0.13)), brush: wp(1.25, 0.05, -RZ + 0.7), tomFar: wp(0, 0, -RZ + 2.2), rose: wp(-1.3, 0, -RZ + 4.2), entry: wp(0, 0, RZ - 1.5), mid: wp(0, 1.5, 0), door: wp(-1.2, 1.1, RZ - 0.15) };
  return { at, A, G, news, state(W = {}, f = 0) {
    moons.forEach((l) => { l.intensity = W.moon ?? 1.4; }); candles.forEach((c, i) => { const on = (W.candles ?? 0) > 0; c.fl.visible = on; c.l.intensity = on ? W.candles * (0.9 + 0.1 * Math.sin(f * 0.45 + i)) : 0; });
    const ps = W.portraits || [];                              // e.g. [{ who: 'pell', date: '9 Dec 1888', holding: 'loaf' }, { who: 'hollis', half: true }]
    news.forEach((n, i) => { const p = ps[i]; n.cp.mesh.visible = n.fr.visible = !!p; if (p) n.cp.draw(JSON.stringify(p), (g, w, h) => paintPortrait(g, w, h, p.who, { seed: 9, ...p })); });
    brush.visible = !!W.brush; } };
}
