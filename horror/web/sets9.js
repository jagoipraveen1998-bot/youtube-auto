// ---------- finished endings: the last beats of each queued story (the story closes; the A/B question lives in the description) ----------
function twoHeroes(f, y, s, a2 = 1, gap = 250) {                    // "there are two of you"
  const base = Object.assign({}, LOOK(HERO), { seed: 1, eyeW: 1.15, pupil: 11, brow: 'fear', mouth: 'o', mo: 0.25, noLegs: true });
  guy(Object.assign({}, base, { x: 540 - gap, y, s }));
  guy(Object.assign({}, base, { x: 540 + gap, y, s, alpha: a2, brow: 'flat', mouth: 'smile', eyeW: 1, pupil: 19 }));
}
Object.assign(STORY, {
  ending(f, sh) {
    const v = sh.v || 'shut', p = sP(f, sh), bt = sh.beat ?? sh.a + 30, on = f >= bt;
    // ----- video call -----
    if (v === 'shut') {                                              // the laptop slammed shut; an empty room
      kidRoom(f, false);
      sf(rr(520, 1180, 520, 40, 8), '#6b472e', 7); for (const lx of [560, 1000]) sf(rr(lx, 1220, 30, 290, 4), '#5a3d2a', 6);   // desk
      const k = ss(seg(f, sh.a + 2, sh.a + 12));
      ctx.save(); ctx.translate(780, 1180); sf(rr(-170, -18, 340, 18, 6), '#2c3146', 6);                                        // base
      ctx.rotate(lerp(-1.5, 0, k)); sf(rr(-170, -30, 340, 16, 6), '#3a4060', 6); ctx.restore();                                  // lid coming down
      if (k < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; light(ctx, 780, 1080, 420 * (1 - k), '#9fc4ff', 0.5 * (1 - k)); ctx.restore(); }
      if (f >= sh.a + 12 && f < sh.a + 30) { ctx.save(); ctx.globalAlpha = 1 - seg(f, sh.a + 12, sh.a + 30); sTxt('SLAM!', 780, 980, 110, '#ffd23f'); ctx.restore(); }
      const h = heroObj(sh, f, { x: 250, y: 1960, s: 0.84, look: 0.7, lookY: 0 }); if (h) { h.sweat = true; h.tremble = 3; guy(h); }
      vignette7(0.5); return;
    }
    if (v === 'reflect') {                                           // the dark screen: two of you in the reflection
      fillR(-300, -300, W + 600, H + 600, '#1a1d2c');
      sf(rr(60, 330, 960, 1180, 36), '#05060c', 14);
      ctx.save(); ctx.beginPath(); ctx.roundRect(60, 330, 960, 1180, 36); ctx.clip();
      ctx.globalAlpha = 0.6; twoHeroes(f, 1760, 0.8, ss(seg(f, bt - 14, bt + 6)));
      ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(20,30,60,0.35)'; ctx.fillRect(60, 330, 960, 1180);
      ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(60, 330); ctx.lineTo(520, 330); ctx.lineTo(160, 1510); ctx.lineTo(60, 1510); ctx.fill();   // glass shine
      ctx.restore();
      sf(rr(20, 1510, 1040, 60, 14), '#2c3146', 8);
      vignette7(0.6); return;
    }
    // ----- cassette -----
    if (v === 'hide' || v === 'recorded') {
      wallpaper(-300, -300, W + 600, 1600, '#b8566a', 'rgba(255,255,255,0.08)', f); skirting(1500, '#e6dccb'); floorBoards(1500, '#7a5234', 'rgba(40,20,10,0.4)');
      lampGlow(900, 700, '#ffd98a', 0.4, 700);
      if (v === 'hide') {
        const g = Object.assign({}, GRAN, SMILE, { x: 300, y: 1960, s: 0.86, look: 0.6, eyeW: 1, pupil: 19, mouth: f > bt ? 'grin' : 'smile' }); guy(g);
        const h = heroObj(sh, f, { x: 800, y: 1960, s: 0.8, look: -0.7, lookY: 0 }); if (h) { h.armR = -0.6; h.sweat = true; guy(h); }
        ctx.save(); ctx.translate(905, 1560); ctx.rotate(0.3); sf(rr(-52, -34, 104, 68, 8), '#2a2430', 6); sf(rr(-36, -14, 72, 26, 4), '#f4efe4', 0); ctx.restore();   // the tape behind his back
      } else {                                                       // close on Grandma: she holds up the first tape
        const g = Object.assign({}, GRAN, { x: 540, y: 2500, s: 1.5, look: 0, eyeW: 1, pupil: 16, brow: 'happy', mouth: 'grin', noLegs: true, armR: 2.2 }); guy(g);
        ctx.save(); ctx.translate(850, 1120 + Math.sin(f * 0.1) * 6); ctx.rotate(-0.12); sf(rr(-150, -95, 300, 190, 16), '#2a2430', 9); sf(rr(-110, -62, 220, 70, 8), '#f4efe4', 0);
        sTxt('TAPE 1', 0, -22, 44, '#c8323a', false); for (const cx of [-60, 60]) sf(ell(cx, 46, 26, 26), '#f4efe4', 6); ctx.restore();
      }
      vignette7(0.45); return;
    }
    // ----- missing poster -----
    if (v === 'mumlook' || v === 'which') {
      fillR(-300, -300, W + 600, 1300, '#8fd3ff'); fillR(-300, 1000, W + 600, 1200, '#b9b3a6'); line2(-300, 1000, W + 300, 1000, INK, 6);
      for (let i = 0; i < 4; i++) sf(rr(-80 + i * 320, 380 + (i % 2) * 90, 260, 620 - (i % 2) * 90, 6), ['#d9c9a8', '#c9b0a0', '#b8c4d0', '#d0c0b0'][i], 7);
      const m = fam('mum', { x: 540, y: 1900, s: 0.82, look: v === 'which' ? Math.sin(f * 0.12) * 0.8 : 0.5, pale: 0.6, brow: 'fear', mouth: 'o', mo: 0.2, eyeW: 1.15, pupil: 11, armL: 1.0 });
      guy(m);
      ctx.save(); ctx.translate(410, 1420); ctx.rotate(-0.1); sf(rr(-80, -110, 160, 220, 4), '#f6f0de', 6); sTxt('MISSING', 0, -74, 30, '#c8323a', false); sf(ell(0, 10, 44, 50), HERO.skin, 4); ctx.restore();
      if (v === 'mumlook') { const h = heroObj(sh, f, { x: 900, y: 1960, s: 0.8, look: -0.7, lookY: 0 }); if (h) guy(h); }
      else {                                                         // which one came home?
        const base = Object.assign({}, LOOK(HERO), { seed: 1, y: 1980, s: 0.76, eyeW: 1.1, pupil: 13, brow: 'fear', mouth: 'flat' });
        guy(Object.assign({}, base, { x: 150, look: 0.7 })); guy(Object.assign({}, base, { x: 930, look: -0.7, mouth: f > bt ? 'smile' : 'flat', brow: f > bt ? 'flat' : 'fear' }));
        if (on) { ctx.save(); ctx.globalAlpha = ss(seg(f, bt, bt + 10)); sTxt('?', 150, 1130, 150, '#ffd23f'); sTxt('?', 930, 1130, 150, '#ffd23f'); ctx.restore(); }
      }
      vignette7(0.3); return;
    }
    // ----- the dog -----
    if (v === 'shh') {                                               // the real Bruno barks downstairs; the thing says shh
      kidRoom(f, true);
      for (let i = 0; i < 3; i++) { const t = ((f - sh.a) * 0.05 + i * 0.33) % 1; ctx.save(); ctx.globalAlpha = 1 - t; sTxt('WOOF!', 820 + i * 30, 1420 - t * 160, 60 + t * 30, '#ffd23f'); ctx.restore(); }
      pet({ x: 560, y: 1680, s: 0.8, pose: 'sit', expr: 'grin', wag: 0, look: -0.4 });
      ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 46; ctx.beginPath(); ctx.moveTo(600, 1560); ctx.quadraticCurveTo(700, 1380, 590, 1300); ctx.stroke();      // one paw up to its lips
      ctx.strokeStyle = PET.fur; ctx.lineWidth = 32; ctx.stroke();
      const h = heroObj(sh, f, { x: 200, y: 1560, s: 0.62, look: 0.9, lookY: 0.1, noLegs: true }); if (h) { h.sweat = true; h.tremble = 3; guy(h); }
      vignette7(0.5); return;
    }
    if (v === 'under') {                                             // under the bed. It stayed there.
      fillR(-300, -300, W + 600, H + 600, '#262a52'); floorBoards(1500, '#4a3426', 'rgba(20,10,5,0.5)');
      sf(rr(-60, 560, 1200, 330, 30), '#3d6fb0', 9); sf(rr(-60, 480, 1200, 120, 40), '#d9dcf0', 7);                    // mattress and sheet
      fillR(-60, 890, 1200, 620, '#04040a'); for (const lx of [-20, 1040]) sf(rr(lx, 890, 60, 620, 6), '#5a3d2a', 7);    // the dark underneath
      const a = ss(seg(f, sh.a + 10, sh.a + 34)), bl = (f % 70) < 4 ? 0.1 : 1;
      ctx.save(); ctx.globalAlpha = a;
      for (const ex of [460, 620]) { sf(ell(ex, 1220, 34, 34 * bl), '#ffe14a', 0); sf(ell(ex, 1220, 10, 22 * bl), '#04040a', 0); }
      ctx.strokeStyle = '#f4efe4'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(540, 1300, 120, 0.25, Math.PI - 0.25); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; light(ctx, 540, 1230, 300, '#ffe14a', 0.25); ctx.restore();
      vignette7(0.6); return;
    }
  },
});
Object.assign(SET_LIGHT, { ending: { lx: 0.5, ly: 0.4, key: '#ffe9c0', shade: '20,20,50', lum: 0.45 } });
