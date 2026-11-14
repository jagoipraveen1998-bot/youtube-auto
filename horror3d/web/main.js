import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';
import * as ST from './story.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });

// extra materials for the house
const wallTex = (seed, hue, light = 70) => { const c = P.plaster(seed, hue); const g = c.getContext('2d');
  g.globalAlpha = 0.16; g.fillStyle = '#6a4a3a'; for (let x = 0; x < c.width; x += 64) g.fillRect(x, 0, 18, c.height);       // wallpaper stripes
  g.globalAlpha = 0.12; g.fillStyle = '#fff3d8'; for (let x = 32; x < c.width; x += 64) for (let y = 16; y < c.height; y += 48) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
  return c; };
const M = {
  wall: texM(wallTex(8, 30), 3, 1.5), wall2: texM(wallTex(18, 200), 3, 1.5, '#dfe6ff'),
  floor: texM(P.planks(1), 3, 3), skirt: toon({ color: '#efe6d6' }), ceil: toon({ color: '#e9e2d4' }),
  door: toon({ color: '#7a3b2a' }), doorFrame: toon({ color: '#f1e9da' }), brass: toon({ color: '#d9a845' }), glass: new THREE.MeshBasicMaterial({ color: '#9fb4d8' }),
  chair: toon({ color: '#a8463c' }), chairDark: toon({ color: '#7a2f2a' }), wood: toon({ color: '#6a4528' }), tv: toon({ color: '#1c1d24' }),
  rug: toon({ color: '#5a6fa0' }), rug2: toon({ color: '#d9a845' }), frame: toon({ color: '#c9a86a' }), shade: new THREE.MeshBasicMaterial({ color: '#ffe6b0' }),
  porch: texM(P.planks(5), 2, 2, '#8a8aa0'), fence: toon({ color: '#3a3e52' }), bush: toon({ color: '#24402e' }), clock: toon({ color: '#f4efe4' }),
  curtain: new THREE.MeshToonMaterial({ gradientMap: grad, color: '#c24a5a', side: THREE.DoubleSide }), sill: toon({ color: '#f1e9da' }),
  plant: toon({ color: '#4d8a46' }), pot: toon({ color: '#b8643a' }),
};

// ---------- ink / normal-depth contract ----------
const NOINK = 'noink'; // userData flag: never outlined (cards, fx, water handled specially)
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});
const waterNd = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,1.,.5,vD); }`,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};
// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);
// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);
const lamp = new THREE.PointLight('#ffcf8a', 0, 9, 1.4); scene.add(lamp);
const tvLight = new THREE.PointLight('#7fb8ff', 0, 7, 1.6); scene.add(tvLight);
const porchLight = new THREE.PointLight('#9fb8ff', 0, 8, 1.6); scene.add(porchLight);
const fillLight = new THREE.PointLight('#8fa8ff', 0, 9, 1.2); fillLight.position.set(0.6, 2.3, -1.2); scene.add(fillLight);


// ---------- the house: a hallway-living room, front door on the back wall, window on the left ----------
const DECK = 0, RX = 4.2, RZ = 3.2, RH = 2.9;
const world = new THREE.Group(); scene.add(world);
const floor = add(tbox(RX * 2, 0.2, RZ * 2 + 10, 1.2), M.floor, 0, -0.1, 3, world, { cast: false });
// back wall with the door hole (door 1.0 x 2.15 at x = 0)
const DW = 1.0, DH = 2.15, BZ = -RZ;
add(tbox(RX - DW / 2, RH, 0.2, 1.4), M.wall, -(RX + DW / 2) / 2, RH / 2, BZ, world);
add(tbox(RX - DW / 2, RH, 0.2, 1.4), M.wall, (RX + DW / 2) / 2, RH / 2, BZ, world);
add(tbox(DW, RH - DH, 0.2, 1.4), M.wall, 0, DH + (RH - DH) / 2, BZ, world);
for (const s of [-1, 1]) add(box(0.12, DH + 0.1, 0.3), M.doorFrame, s * (DW / 2 + 0.06), (DH + 0.1) / 2, BZ, world);
add(box(DW + 0.24, 0.12, 0.3), M.doorFrame, 0, DH + 0.06, BZ, world);
// the door, hinged on its left edge; opens into the room
const doorG = new THREE.Group(); doorG.position.set(-DW / 2, 0, BZ + 0.02); world.add(doorG);
add(tbox(DW, DH, 0.07, 1), M.door, DW / 2, DH / 2, 0, doorG);
for (const [y, h] of [[0.55, 0.7], [1.5, 0.6]]) add(box(DW * 0.7, h, 0.02), toon({ color: '#6a3222' }), DW / 2, y, 0.045, doorG);
add(box(0.32, 0.36, 0.02), M.glass, DW / 2, 1.9, 0.045, doorG);
add(new THREE.SphereGeometry(0.045, 12, 8), M.brass, DW - 0.12, 1.02, 0.07, doorG);
add(new THREE.SphereGeometry(0.045, 12, 8), M.brass, DW - 0.12, 1.02, -0.07, doorG);
// left wall with the window (z -1.0..1.0, y 0.9..2.15)
const LX = -RX, WZ0 = -1.0, WZ1 = 1.0, WY0 = 0.9, WY1 = 2.15;
add(tbox(0.2, RH, RZ + WZ0, 1.4), M.wall, LX, RH / 2, (-RZ + WZ0) / 2, world);
add(tbox(0.2, RH, RZ - WZ1, 1.4), M.wall, LX, RH / 2, (RZ + WZ1) / 2, world);
add(tbox(0.2, WY0, WZ1 - WZ0, 1.4), M.wall, LX, WY0 / 2, 0, world);
add(tbox(0.2, RH - WY1, WZ1 - WZ0, 1.4), M.wall, LX, WY1 + (RH - WY1) / 2, 0, world);
add(box(0.32, 0.08, WZ1 - WZ0 + 0.3), M.sill, LX + 0.08, WY0, 0, world);
add(box(0.06, WY1 - WY0, 0.06), M.sill, LX, (WY0 + WY1) / 2, 0, world); add(box(0.06, 0.06, WZ1 - WZ0), M.sill, LX, (WY0 + WY1) / 2, 0, world);
// right wall + ceiling + front wall (behind most cameras)
add(tbox(0.2, RH, RZ * 2, 1.4), M.wall, RX, RH / 2, 0, world);
add(tbox(RX * 2, 0.15, RZ * 2, 2), M.ceil, 0, RH + 0.07, 0, world, { cast: false });
const frontWall = add(tbox(RX * 2, RH, 0.2, 1.4), M.wall, 0, RH / 2, RZ, world);
// skirting boards
for (const sd of [-1, 1]) add(box(RX - DW / 2 - 0.12, 0.14, 0.04), M.skirt, sd * (RX + DW / 2 + 0.12) / 2, 0.07, BZ + 0.12, world); add(box(0.04, 0.14, RZ * 2), M.skirt, RX - 0.12, 0.07, 0, world);
// curtains: two cloth panels that move with the draught from the window
const curtains = [];
for (const s of [-1, 1]) {
  const g = new THREE.PlaneGeometry(0.75, WY1 - WY0 + 0.6, 10, 16); const m = add(g, M.curtain, LX + 0.16, (WY0 + WY1) / 2 + 0.15, s * 0.68, world, { cast: true });
  m.rotation.y = Math.PI / 2; m.userData.base = g.attributes.position.array.slice(); m.userData.side = s; curtains.push(m);
}
add(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8), M.brass, LX + 0.18, WY1 + 0.45, 0, world).rotation.x = Math.PI / 2;
// outside: porch, fence, bushes, a far streetlamp
add(tbox(3, 0.15, 4, 1.2), M.porch, 0, -0.05, BZ - 2.1, world, { cast: false });
const yard = add(new THREE.PlaneGeometry(60, 40), toon({ color: '#1d2a26' }), 0, -0.12, BZ - 20, world, { cast: false }); yard.rotation.x = -Math.PI / 2;
for (let x = -8; x <= 8; x += 0.5) add(box(0.08, 1.0, 0.06), M.fence, x, 0.5, BZ - 5, world);
add(box(16, 0.08, 0.05), M.fence, 0, 0.85, BZ - 5.02, world);
for (const [x, z, r] of [[-3, -7.5, 1.1], [3.2, -7, 1.3], [-6, -8, 1.5], [6.5, -9, 1.6]]) add(new THREE.SphereGeometry(r, 10, 8), M.bush, x, r * 0.6, BZ + z + 3, world);
const outsideLamp = add(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 8), M.fence, 3.5, 1.6, BZ - 9, world);
const bulb = add(new THREE.SphereGeometry(0.18, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffe9b0' }), 3.5, 3.25, BZ - 9, world);
// living room: armchair, side table + floor lamp, TV, rug, pictures, clock, plant
const chair = new THREE.Group(); chair.position.set(2.2, 0, -1.2); chair.rotation.y = -0.55; world.add(chair);
add(box(1.0, 0.45, 0.9), M.chair, 0, 0.23, 0, chair); add(box(1.0, 0.9, 0.2), M.chair, 0, 0.9, -0.38, chair);
for (const s of [-1, 1]) add(box(0.18, 0.62, 0.9), M.chairDark, s * 0.48, 0.42, 0, chair);
const chairFront = add(box(0.84, 0.2, 0.1), M.chair, 0, 0.5, 0.42, chair);
add(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 20), M.wood, 3.2, 0.62, -2.3, world);
add(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), M.wood, 3.2, 0.31, -2.3, world);
add(new THREE.CylinderGeometry(0.025, 0.03, 1.6, 8), M.brass, 3.45, 0.8, -2.55, world);
const shade = add(new THREE.CylinderGeometry(0.18, 0.3, 0.32, 18, 1, true), M.shade, 3.45, 1.72, -2.55, world, { cast: false }); shade.material.side = THREE.DoubleSide;
lamp.position.set(3.45, 1.6, -2.55);
const tvG = new THREE.Group(); tvG.position.set(-0.2, 0, 2.4); tvG.rotation.y = Math.PI * 0.85; world.add(tvG);
add(box(1.4, 0.5, 0.45), M.wood, 0, 0.25, 0, tvG); add(box(1.1, 0.7, 0.08), M.tv, 0, 0.9, 0, tvG);
const screenMat = new THREE.MeshBasicMaterial({ color: '#8fc4ff' }); const screen = add(box(1.0, 0.6, 0.01), screenMat, 0, 0.9, 0.045, tvG, { cast: false });
tvLight.position.set(0.4, 1.0, 1.8);
const rug = add(new THREE.CylinderGeometry(1.4, 1.4, 0.02, 40), M.rug, 1.4, 0.01, -0.4, world, { cast: false }); rug.scale.z = 0.7;
add(new THREE.CylinderGeometry(1.1, 1.1, 0.025, 40), M.rug2, 1.4, 0.012, -0.4, world, { cast: false }).scale.z = 0.7;
for (const [x, y, w, h, col] of [[-2.4, 1.7, 0.7, 0.5, '#7a9ac4'], [-1.4, 1.95, 0.4, 0.55, '#c47a6a'], [2.2, 1.85, 0.9, 0.6, '#8ab07a']]) {
  add(box(w + 0.08, h + 0.08, 0.04), M.frame, x, y, BZ + 0.12, world); add(box(w, h, 0.05), toon({ color: col }), x, y, BZ + 0.13, world);
}
const clockG = new THREE.Group(); clockG.position.set(RX - 0.12, 2.2, -1.6); clockG.rotation.y = -Math.PI / 2; world.add(clockG);
add(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 24), M.clock, 0, 0, 0, clockG).rotation.x = Math.PI / 2;
const hourH = add(box(0.025, 0.12, 0.01), toon({ color: '#241726' }), 0, 0.05, 0.03, clockG), minH = add(box(0.018, 0.19, 0.01), toon({ color: '#241726' }), 0, 0.08, 0.035, clockG);
add(new THREE.CylinderGeometry(0.18, 0.13, 0.35, 12), M.pot, -3.3, 0.18, 2.4, world);
for (let i = 0; i < 6; i++) { const lf = add(new THREE.SphereGeometry(0.22, 8, 6), M.plant, -3.3 + Math.cos(i) * 0.18, 0.6 + (i % 3) * 0.12, 2.4 + Math.sin(i) * 0.18, world); lf.scale.set(0.6, 1.4, 0.6); }
// light under the door and the two feet standing outside it
const gap = add(box(DW - 0.04, 0.034, 0.02), new THREE.MeshBasicMaterial({ color: '#cfe0ff' }), 0, 0.016, BZ + 0.065, world, { cast: false }); gap.userData.ndSkip = true;
const feet = [-0.18, 0.16].map((x) => add(box(0.17, 0.036, 0.022), new THREE.MeshBasicMaterial({ color: '#05040a' }), x, 0.017, BZ + 0.07, world, { cast: false }));
feet.forEach((m) => { m.userData.ndSkip = true; m.renderOrder = 3; });
// dust motes drifting in the moonlight
const motes = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 360 }, (_, i) => [(-4 + P.rng(i + 1)() * 3.5), P.rng(i + 7)() * 2.6, P.rng(i + 13)() * 4 - 2][i % 3]), 3)),
  new THREE.PointsMaterial({ color: '#cfe0ff', size: 0.012, transparent: true, opacity: 0.5 }));
motes.userData.ndSkip = true; scene.add(motes);

// a story can add its own props (a laptop, a cassette, a dog bed…) and hide house pieces it doesn't need
const STORY_PROPS = ST.build ? ST.build({ THREE, world, scene, camera, add, box, tbox, toon, texM, M, P, grad, chair, tvG, rug, clockG }) || {} : {};
// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());
// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.006, .02, (ds - d)/d));                           // depth jump, near side only
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.012,.01,.014), e);
    if (flash < -0.5) c = vec3(e);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
    gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
// final copy with sRGB handled by the renderer output (we render to screen with linear->sRGB in the shader chunk)
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
  lamp.intensity = L.lamp ?? 0; tvLight.intensity = (L.tv ?? 0) * (0.85 + 0.15 * Math.sin(f * 0.9) * Math.sin(f * 0.37)); porchLight.intensity = L.porch ?? 0; fillLight.intensity = L.fill ?? 0;
  shade.material.color.set(L.lamp ? '#ffe6b0' : '#8a7d68'); screenMat.color.set(L.tv ? (f % 40 < 20 ? '#8fc4ff' : '#a8d4ff') : '#0c0d12');
}
function placeSun(L, focus) {
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 40); sun.target.position.copy(focus);
  const ext = L.shadowExt || 8, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 120; sc.updateProjectionMatrix();
}
function worldState(S, f) {
  doorG.rotation.y = -(S.door || 0);
  doorG.position.x = -DW / 2 + (S.doorShake || 0) * 0.004; doorG.position.z = BZ + 0.02 + Math.abs(S.doorShake || 0) * 0.006;
  for (const m of curtains) {
    const pa = m.geometry.attributes.position, b = m.userData.base, s = m.userData.side, wind = S.wind ?? 0.4;
    for (let i = 0; i < pa.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], hang = (0.95 - (y + 1.5) / 3); pa.setZ(i, Math.sin(f * 0.11 + x * 4 + y * 1.7 + s) * 0.07 * wind * (0.3 + hang) + Math.sin(f * 0.043 + s) * 0.12 * wind * hang); }
    pa.needsUpdate = true; m.geometry.computeVertexNormals();
  }
  const mins = (f / 30) * 6; minH.rotation.z = -rx(mins * 6); hourH.rotation.z = -rx(mins * 0.5 + 75);
  minH.position.set(Math.sin(minH.rotation.z) * -0.08, Math.cos(minH.rotation.z) * 0.08, 0.035); hourH.position.set(Math.sin(hourH.rotation.z) * -0.05, Math.cos(hourH.rotation.z) * 0.05, 0.03);
  const pa = motes.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setY(i, (P.rng(i + 7)() * 2.6 + f * 0.0015 * (1 + (i % 5) * 0.2)) % 2.6); pa.needsUpdate = true;
  if (ST.update) ST.update(S, f, STORY_PROPS);
  motes.visible = !!S.motes; gap.visible = !!S.gap; feet.forEach((m) => { m.visible = !!S.feet; }); porchLight.position.set(0, 2.3, BZ - 1.2);
}
function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < DECK + 0.5 && a.y > -0.05) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};
window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position);

  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;