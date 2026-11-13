// ---------- sets for the researched batch: Bruno Part 3, the borrowed shadow, Grandma's second knock ----------
const GRANDPA = { skin: '#b97a50', hair: '#e8e4dc', hairStyle: 'bald', outfit: 'shirt', top: '#4a6a8a', acc: { glasses: true, mustache: true }, seed: 14 };
const MILK = { skin: '#c98d62', hair: '#1d1420', hairStyle: 'spiky', outfit: 'tee', top: '#f4f1e8', acc: { cap: '#3a7a5a' }, seed: 15 };

function knockText(x, y, f, a0, txt = 'KNOCK') {                     // the word shakes in, then fades
  if (f < a0) return;
  const a = 1 - seg(f, a0 + 14, a0 + 34), j = Math.sin(f * 3) * 6 * (1 - seg(f, a0, a0 + 10));
  ctx.save(); ctx.globalAlpha = Math.max(0, a); sTxt(txt, x + j, y, 96, '#ffd23f'); ctx.restore();
}
function shake(f, a0, amt = 10) { return f >= a0 && f < a0 + 12 ? Math.sin(f * 4) * amt * (1 - (f - a0) / 12) : 0; }

// a kid's bedroom at night: the room every dog shot lives in
function kidRoom(f, warm = true) {
  wallpaper(-300, -300, W + 600, 1600, warm ? '#3b4a8a' : '#262a52', 'rgba(255,255,255,0.06)', f);
  skirting(1500, '#d9cfbf'); floorBoards(1500, '#6b472e', 'rgba(30,15,5,0.4)');
  sf(rr(-40, 1150, 520, 330, 30), '#5a3d2a', 9); sf(rr(-20, 1110, 480, 120, 40), '#d9dcf0', 7);   // the bed's foot at the left
  sf(rr(-40, 1220, 520, 280, 20), '#3d6fb0', 8);
  if (warm) { sf(rr(560, 1200, 120, 300, 10), '#7a5a3a', 6); sf(poly([[575, 1110], [665, 1110], [690, 1200], [550, 1200]]), '#f0c95a', 6); lampGlow(620, 1150, '#ffd98a', 0.35, 480); }
}

Object.assign(STORY, {
  // ================= MY DOG CAME HOME… WRONG (PART 3) =================
  dognight(f, sh) {
    const v = sh.v || 'lock', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt;
    if (v === 'keypad') {                                                       // close on the door lock: the digits light up one by one
      fillR(-300, -300, W + 600, H + 600, '#5a3d2a'); hatch(-300, -300, W + 600, H + 600, 'rgba(0,0,0,0.12)', 30, 0.05);
      sf(rr(270, 420, 540, 1080, 50), '#1c1f2e', 10); sf(rr(330, 500, 420, 150, 20), '#0b2a2a', 6);
      const code = sh.code || '', n = Math.min(code.length, Math.floor(seg(f, sh.a + 6, sh.b - 10) * (code.length + 0.99)));
      sTxt(code.slice(0, n).split('').join(' ') || '_ _ _ _', 540, 600, 84, '#7fffd0', false);
      const keys = '123456789*0#';
      for (let i = 0; i < 12; i++) {
        const kx = 380 + (i % 3) * 160, ky = 760 + Math.floor(i / 3) * 170, lit = code.slice(0, n).slice(-1) === keys[i] && (f % 18) < 12;
        sf(ell(kx, ky, 62, 62), lit ? '#7fffd0' : '#2c3146', 6); sTxt(keys[i], kx, ky + 24, 60, lit ? '#0b2a2a' : '#c8cbd8', false);
        if (lit) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, kx, ky, 130, '#7fffd0', 0.5); ctx.restore(); }
      }
      if (n > 0 && f % 18 < 4) { ctx.save(); ctx.globalAlpha = 0.6; sTxt('beep', 860, 470, 54, '#7fffd0'); ctx.restore(); }
      vignette7(0.5); return;
    }
    if (v === 'outside' || v === 'outside2') {                                  // through the window: Mum on the drive, holding the leash
      fillR(-300, -300, W + 600, H + 600, '#141d4a');
      fillR(-300, 1250, W + 600, 900, '#2a2a3a'); line2(-300, 1250, W + 300, 1250, INK, 6);
      sf(rr(80, 980, 520, 300, 60), '#c8323a', 8); sf(rr(160, 900, 340, 150, 40), '#9ad0ff', 6);    // the car
      for (const wx of [200, 480]) sf(ell(wx, 1290, 70, 70), '#141018', 6);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, 600, 1120, 380, '#fff3c8', 0.45); ctx.restore();
      const m = fam('mum', { x: 700, y: 1820, s: 0.7, look: -0.4, armL: 0.9 }); guy(m);
      line2(640, 1520, 470, 1700, '#c8323a', 8);                                // the leash
      if (v === 'outside2') pet({ x: 430, y: 1820, s: 0.55, pose: 'stand', expr: 'happy', wag: f * 0.6, name: 'BRUNO' });
      curtains(-60, 60, 1200, 1900, f, 0.4, '#6a3a8a', 0.82);                  // our curtains frame the view
      sf(rr(-40, 40, 1160, 1880, 0), 'rgba(0,0,0,0)', 26);
      vignette7(0.45); return;
    }
    kidRoom(f, true);
    const open = v === 'open' ? ss(seg(f, sh.a + 6, sh.b - 6)) : ['enter', 'sit', 'calm', 'look', 'smile', 'window'].includes(v) ? 0.92 : 0;
    door3d(700, 560, 300, 940, open, { col: '#b5463c', spill: '#8a90c4', beyond: '#07060b',
      inside: (x, y, w, h, pp) => { if (v === 'open' && pp > 0.4) pet({ x: x + w / 2, y: y + h - 40, s: 0.45, pose: 'stand', sil: true }); } });
    sf(rr(1010, 1000, 40, 90, 8), '#1c1f2e', 4); sf(rr(1016, 1010, 28, 20, 4), v === 'lock' ? '#ff5a5a' : '#7fffd0', 0);   // the lock on the door
    if (v === 'window') {                                                       // headlights sweep across the wall
      const k = seg(f, sh.a, sh.b); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#fff3c8'; ctx.beginPath(); ctx.ellipse(lerp(-200, 1200, k), 700, 260, 140, 0, 0, 7); ctx.fill(); ctx.restore();
    }
    let dogX = 760;
    if (v === 'enter') { const k = ss(seg(f, sh.a + 4, sh.b - 4)); dogX = lerp(850, 600, k); pet({ x: dogX, y: 1640, s: 0.55, pose: 'walk', expr: 'calm', walk: f * 0.3 }); }
    if (['sit', 'calm', 'look'].includes(v)) pet({ x: 600, y: 1660, s: 0.55, pose: 'sit', expr: 'happy', wag: f * 0.7, look: -0.6 });
    if (v === 'smile') {                                                        // it stops wagging; the smile spreads
      const k = ss(seg(f, bt - 6, bt + 16));
      pet({ x: 600, y: 1700, s: 0.75, pose: 'sit', expr: k > 0.4 ? 'grin' : 'stare', wag: f * 0.7 * (1 - k), look: -0.3 });
    }
    const scared = { lock: 0.2, open: 1, enter: 1, sit: 0.6, calm: 0.2, window: 0.5, look: 0.7, smile: 1 }[v] ?? 0.5;
    const h = heroObj(sh, f, { x: v === 'lock' ? 860 : 250, y: v === 'lock' ? 1900 : 1560, s: v === 'lock' ? 0.8 : 0.62, look: v === 'lock' ? 0.4 : v === 'window' ? -0.8 : 0.9, lookY: 0.1, noLegs: v !== 'lock' });
    if (h) { if (v === 'lock') { h.armR = lerp(0.3, 1.9, ss(seg(f, sh.a + 6, sh.a + 20))); h.turn = 1; } h.tremble = scared > 0.6 ? 3 : 0; h.sweat = scared > 0.6; guy(h); }
    vignette7(0.45);
  },

  // ================= THE BORROWED SHADOW =================
  shadowtown(f, sh) {
    const v = sh.v || 'wall', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt;
    if (v === 'cake' || v === 'twelve') {                                       // a birthday: the number of candles is the point
      wallpaper(-300, -300, W + 600, 1500, '#f0a0b0', 'rgba(255,255,255,0.18)', f);
      fillR(-300, 1300, W + 600, 900, '#c9a27a');
      sf(rr(140, 1200, 800, 60, 20), '#7a5a3a', 6);
      sf(rr(290, 940, 500, 270, 30), '#fff3e0', 8); sf(rr(290, 940, 500, 70, 30), '#e85a7a', 6);
      const n = v === 'cake' ? 13 : 12;
      sTxt(String(n), 540, 1140, 150, '#e85a7a');
      for (let i = 0; i < 6; i++) { const cx = 330 + i * 84; sf(rr(cx - 8, 860, 16, 80, 4), ['#7fd0ff', '#ffd23f', '#9be08a'][i % 3], 3); sf(ell(cx, 845 + Math.sin(f * 0.4 + i) * 3, 10, 18), '#ffb23f', 0); }
      if (v === 'cake') {                                                       // the teenager's shadow pours out behind them
        const a = ss(seg(f, bt - 10, bt + 20)); const k = fam('kid', Object.assign({ x: 860, y: 1900, s: 0.62, look: -0.6 }, SMILE)); k.s = 0.62; guy(k);
        ctx.save(); ctx.globalAlpha = 0.55 * a; ctx.fillStyle = '#1a0f24'; ctx.beginPath(); ctx.ellipse(980, 1300, 120, 360 * a, 0.25, 0, 7); ctx.fill(); ctx.restore();
      } else { const h = heroObj(sh, f, { x: 860, y: 1900, s: 0.66, look: -0.6, lookY: 0 }); if (h) guy(h); }
      vignette7(0.2); return;
    }
    if (v === 'kids') {                                                         // a sunny street: grown-ups cast shadows, kids cast none
      fillR(-300, -300, W + 600, 1300, '#8fd3ff'); sf(ell(880, 220, 110, 110), '#fff3b0', 0);
      fillR(-300, 1000, W + 600, 1200, '#d8c8a0'); line2(-300, 1000, W + 300, 1000, INK, 6);
      for (const [x, adult] of [[200, true], [480, false], [700, false], [930, true]]) {
        if (adult) { ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = '#1a0f24'; ctx.beginPath(); ctx.ellipse(x - 120, 1720, 200, 46, -0.15, 0, 7); ctx.fill(); ctx.restore(); }
        guy(adult ? fam(x < 500 ? 'dad' : 'mum', Object.assign({ x, y: 1720, s: 0.66, look: 0.3 }, SMILE)) : Object.assign({}, FRIENDS[x > 600 ? 1 : 0], LAUGH, { x, y: 1760, s: 0.48, bob: Math.abs(Math.sin(f * 0.3 + x)) * -40, eyeW: 1, pupil: 19 }));
      }
      vignette7(0.15); return;
    }
    if (v === 'photo') {                                                        // Grandpa's photo: his shadow is there… then it isn't
      wallpaper(-300, -300, W + 600, H + 600, '#3b4a8a', 'rgba(255,255,255,0.06)', f);
      sf(rr(220, 420, 640, 860, 20), '#c9a86a', 12); sf(rr(270, 470, 540, 760, 6), '#e9dfc8', 6);
      ctx.save(); ctx.beginPath(); ctx.rect(270, 470, 540, 760); ctx.clip();
      fillR(270, 1050, 540, 180, '#b9a582');
      const gone = sh.gone ? ss(seg(f, bt - 8, bt + 14)) : 0;
      ctx.save(); ctx.globalAlpha = 0.45 * (1 - gone); ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.ellipse(680, 1090, 150, 34, -0.2, 0, 7); ctx.fill(); ctx.restore();
      guy(Object.assign({}, GRANDPA, SMILE, { x: 540, y: 1100, s: 0.55, eyeW: 1, pupil: 19 }));
      ctx.fillStyle = 'rgba(120,90,40,0.18)'; ctx.fillRect(270, 470, 540, 760);   // old sepia print
      ctx.restore();
      if (sh.gone && on) { const a = ss(seg(f, bt + 6, bt + 18)); ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(660, 1090, 190, 70, 0, 0, 7); ctx.stroke(); ctx.restore(); }
      if (sh.point) { const m = fam('mum', { x: 980, y: 2050, s: 0.8, look: -0.8, armL: 1.6, noLegs: true, pale: 0.6 }); guy(m); }
      vignette7(0.45); return;
    }
    // the bedroom wall with one lamp: the shadow lives here
    wallpaper(-300, -300, W + 600, 1600, '#e8d9b0', 'rgba(120,90,40,0.12)', f);
    skirting(1500, '#c9b892'); floorBoards(1500, '#8a5a3a', 'rgba(50,25,10,0.35)');
    sf(rr(80, 1250, 140, 250, 10), '#7a5a3a', 6); sf(poly([[90, 1150], [210, 1150], [240, 1250], [60, 1250]]), '#f0c95a', 6); lampGlow(150, 1200, '#ffd98a', 0.55, 700);
    const sway = Math.sin(f * 0.09) * 0.25;
    const heroMoves = v === 'moves' ? sway : 0;
    const showShadow = ['wall', 'moves', 'wave', 'mum', 'ask'].includes(v);
    if (showShadow) {                                                           // a kid-sized shadow on the wall, too sharp, too dark
      const a = v === 'wall' ? ss(seg(f, sh.a + 6, sh.a + 30)) : 1;
      const waving = v === 'wave' ? ss(seg(f, bt - 6, bt + 6)) : 0;
      ctx.save(); ctx.translate(Math.sin(heroMoves) * 60, 0);
      guy({ x: 720, y: 1460, s: 0.95, kind: 'shadow', alpha: 0.85 * a, tilt: heroMoves * 0.6, armR: waving ? 2.4 + Math.sin(f * 0.5) * 0.4 : 0.25, mouth: 'flat', look: 0, noFace: true });
      ctx.restore();
    }
    if (v === 'mum') { const m = Object.assign(fam('mum', { x: 300, y: 1960, s: 0.8, look: 0.8 }), { pale: 1, mouth: 'o', mo: 0.3, brow: 'up', eyeW: 1.15, pupil: 10, talk: true }); guy(m); }
    const h = heroObj(sh, f, { x: v === 'mum' ? 860 : 420, y: 1960, s: 0.8, look: v === 'mum' ? -0.8 : 0.85, lookY: 0 });
    if (h) { h.tilt = (h.tilt || 0) + heroMoves * 0.6; if (v === 'wave' || v === 'moves') { h.tremble = 3; h.sweat = true; } guy(h); }
    if (v === 'wave' && on) knockText(720, 520, f, bt + 4, 'NOT ME');
    vignette7(0.35);
  },

  // ================= GRANDMA'S SECOND KNOCK =================
  knock(f, sh) {
    const v = sh.v || 'rule', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt;
    const night = ['night', 'knock1', 'nobody', 'knock2', 'voice', 'turn', 'behind', 'door'].includes(v);
    wallpaper(-300, -300, W + 600, 1900, night ? '#2c2f5a' : '#5fa08a', night ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', f);
    skirting(1580, '#e6dccb'); floorBoards(1580, night ? '#4a3426' : '#8a5a3a', 'rgba(30,15,5,0.4)');
    // the front door in the middle of the hall, with a little window of frosted glass
    const dx = shake(f, ['knock1', 'knock2'].includes(v) ? bt : 1e9, 12) + shake(f, ['knock1', 'knock2'].includes(v) ? bt + 16 : 1e9, 12);
    const open = v === 'first' ? ss(seg(f, sh.a + 10, sh.a + 34)) : v === 'nobody' ? ss(seg(f, sh.a + 4, sh.a + 24)) : 0;
    ctx.save(); ctx.translate(dx, 0);
    door3d(400, 640, 300, 940, open, { col: '#2f6a8a', spill: night ? '#8a90c4' : '#fff3c8', beyond: night ? '#0b0d1f' : '#bfe6ff',
      inside: (x, y, w, h) => {
        if (night) { for (let i = 0; i < 18; i++) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x + rnd(i) * w, y + rnd(i + 9) * h * 0.5, 3, 3); } }
        if (v === 'first') guy(Object.assign({}, MILK, SMILE, { x: x + w / 2, y: y + h + 40, s: 0.6, look: 0.2, eyeW: 1, pupil: 19, armR: 1.4, holdR: (hx, hy) => sf(rr(hx - 18, hy - 70, 36, 90, 10), '#ffffff', 5) }));
      } });
    if (!open) { sf(rr(500, 760, 100, 140, 8), night ? '#3a4a7a' : '#d9eef8', 5); }
    ctx.restore();
    if (night && v !== 'nobody') {                                              // light under the door… broken by two feet
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35; ctx.fillStyle = '#c9d4ff'; ctx.fillRect(400, 1570, 300, 10); ctx.restore();
      if (['knock2', 'voice', 'behind', 'door'].includes(v)) for (const fx of [480, 590]) fillR(fx, 1568, 40, 12, '#05040a');
    }
    if (v === 'knock1' || v === 'knock2') { knockText(550, 500, f, bt); knockText(550, 500, f, bt + 16); }
    if (v === 'voice') {                                                       // her voice, through the wood
      for (let i = 0; i < 3; i++) { const r = 60 + ((f * 3 + i * 40) % 120); ctx.save(); ctx.globalAlpha = 1 - (r - 60) / 120; ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(550, 1000, r, -0.9, 0.9); ctx.stroke(); ctx.restore(); }
    }
    // daytime: Grandma in her armchair with the TV
    if (!night) {
      sf(rr(780, 1120, 280, 200, 20), '#1c1f2e', 8);
      const tvOn = v !== 'still' || !on; sf(rr(800, 1140, 240, 160, 10), tvOn ? '#7fd0ff' : '#05060a', 0);
      if (tvOn) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, 920, 1220, 360, '#7fd0ff', 0.25); ctx.restore(); }
      sf(rr(-20, 1300, 360, 380, 60), '#a8463c', 9);
      const g = Object.assign({}, GRAN, v === 'still' && on ? { brow: 'flat', mouth: 'flat' } : SMILE, { x: 170, y: 1760, s: 0.62, look: 0.6, eyeW: 1, pupil: 19, noLegs: true });
      if (v === 'rule') { g.armR = 2.5; g.brow = 'angry'; g.mouth = 'flat'; g.talk = true; }
      if (v === 'still' && on) { g.tremble = 1; g.look = 0.2; }
      guy(g);
      if (v === 'rule' && sh.card) { ctx.save(); ctx.globalAlpha = ss(seg(f, sh.a + 6, sh.a + 18)); sf(rr(170, 230, 740, 260, 30), '#fff3e0', 8); sTxt('NEVER OPEN', 540, 340, 84, '#c8323a'); sTxt('ON THE 2nd KNOCK', 540, 440, 64, '#1c1f2e', false); ctx.restore(); }
      if (v === 'still' && on) knockText(550, 520, f, bt, 'KNOCK KNOCK');
    }
    if (v === 'behind' || v === 'turn') {                                      // Grandma in her nightgown, behind him, finger on her lips
      const k = v === 'behind' ? ss(seg(f, sh.a + 2, sh.a + 18)) : 0;
      if (k > 0) {
        const g = Object.assign({}, GRAN, { outfit: 'gown', top: '#e8e4f0', x: 900, y: 2000, s: 0.85, look: -0.3, eyeW: 1.1, pupil: 13, brow: 'up', mouth: 'flat', armR: 1.75, armsFront: true, alpha: k });
        guy(g); sf(rr(860, 1430, 14, 70, 6), g.skin, 3);                            // the finger across her lips
      }
    }
    const heroAt = { rule: [820, 1960, 0.7, -0.9], first: [880, 1960, 0.7, -0.9], still: [880, 1960, 0.7, -0.9], habit: [860, 1960, 0.75, -0.6], night: [860, 1960, 0.75, -0.8],
      knock1: [860, 1960, 0.75, -0.8], nobody: [860, 1960, 0.75, -0.8], knock2: [860, 1960, 0.75, -0.8], voice: [860, 1960, 0.75, -0.8], turn: [300, 1980, 0.85, 0.9], behind: [300, 1980, 0.85, 0.9], door: [300, 2100, 1.0, 0.6] }[v];
    if (heroAt) {
      const h = heroObj(sh, f, { x: heroAt[0], y: heroAt[1], s: heroAt[2], look: heroAt[3], lookY: 0, turn: ['knock1', 'knock2', 'voice', 'nobody', 'night'].includes(v) ? 0.6 : 0 });
      if (h) { if (night) { h.sweat = true; h.tremble = ['voice', 'behind', 'knock2'].includes(v) ? 3 : 0; } if (v === 'habit') { h.armL = 1.2; h.armR = 1.2; } guy(h); }
    }
    vignette7(night ? 0.55 : 0.25);
  },
});
Object.assign(SET_LIGHT, {
  dognight: { lx: 0.58, ly: 0.6, key: '#ffd98a', shade: '20,20,50', lum: 0.4 },
  shadowtown: { lx: 0.14, ly: 0.62, key: '#ffd98a', shade: '40,30,20', lum: 0.6 },
  knock: { lx: 0.5, ly: 0.3, key: '#ffe9c0', shade: '20,25,50', lum: 0.5 },
});
