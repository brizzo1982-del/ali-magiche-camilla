'use strict';
/* ============ Il volo: motore di gioco e missioni ============ */
function riderInfo(id) {
  if (id === 'mio' || !Store.data.rescued.includes(+id)) return { mine: true, name: Store.data.unicorn.name, look: Store.data.unicorn, power: 'amica', icon: MY_POWER.icon };
  const r = RIDERS[+id]; return { name: r.name, look: r.look, power: r.power, icon: r.icon };
}

Screens.play = {
  enter(el, { w, l }) {
    this.el = el; this.w = w; this.l = l; this.WD = WORLDS[w]; this.L = this.WD.levels[l];
    el.innerHTML = `<canvas class="full"></canvas>
      <div class="hud">
        <button class="pause-btn" aria-label="Pausa">⏸</button>
        <div class="hearts"></div>
        <div class="mission"></div>
        <div class="gems">💎 <b class="gem-count">${Store.data.gems}</b></div>
      </div>
      <button class="magic-btn hidden" aria-label="Magia della fatina"><span class="me"></span></button>`;
    this.cv = $('canvas', el); this.ctx = this.cv.getContext('2d');
    this.resize = () => {
      this.W = el.clientWidth; this.H = el.clientHeight;
      this.dpr = Math.min(2, devicePixelRatio || 1);
      this.cv.width = this.W * this.dpr; this.cv.height = this.H * this.dpr;
      this.k = clamp(Math.min(this.W, this.H) / 600, 0.62, 1.4);
    };
    this.resize(); addEventListener('resize', this.resize);
    this.rider = riderInfo(Store.data.ride);
    const f = Store.data.fairy;
    this.fairy = f !== null && Store.data.fairies.includes(f) ? FAIRIES[f] : null;
    const look = this.rider.look;
    this.imgs = [-14, 16].map(a => { const i = new Image(); i.src = svgUrl(unicornSVG(look, { wings: true, flap: a })); return i; });
    if (this.L.type === 'boss') { this.cageImg = new Image(); this.cageImg.src = svgUrl(unicornSVG(RIDERS[w].look, { wings: true })); }
    const setT = e => { const r = this.cv.getBoundingClientRect(); this.p.ty = clamp(e.clientY - r.top, 50, this.H - 30); this.p.tx = clamp(e.clientX - r.left, this.W * 0.08, this.W * 0.62); };
    this.cv.addEventListener('pointerdown', e => { this.cv.setPointerCapture(e.pointerId); setT(e); this.touched = true; });
    this.cv.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'mouse') setT(e); });
    $('.pause-btn', el).onclick = () => this.pause();
    $('.magic-btn', el).onclick = () => this.magic();
    this.reset();
    Music.play(this.L.type === 'boss' ? 'boss' : this.WD.theme === 'castello' ? 'notte' : 'volo');
    this.last = performance.now();
    this.loop = t => {
      const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
      if (!this.paused) this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(this.loop);
    };
    this.raf = requestAnimationFrame(this.loop);
  },
  exit() { cancelAnimationFrame(this.raf); clearTimeout(this.endT); removeEventListener('resize', this.resize); this.el.innerHTML = ''; },

  reset() {
    const W = this.W, H = this.H, w = this.w, pw = this.rider.power;
    this.state = 'play'; this.t = 0; this.off = 0; this.paused = false; this.touched = false;
    this.maxHearts = 3 + (pw === 'cuore' || pw === 'tutto' ? 1 : 0); this.hearts = this.maxHearts; this.lost = 0;
    this.p = { x: W * 0.22, y: H * 0.5, tx: W * 0.22, ty: H * 0.5, inv: 0, bubble: pw === 'bolla', spin: 0 };
    this.items = []; this.obs = []; this.texts = []; this.trail = []; this.followers = [];
    this.spawnT = 1.2; this.obsT = 3; this.gemT = 2; this.heartT = 10;
    this.speed = (185 + 22 * w) * this.k;
    this.obsEvery = w === 0 && this.l === 0 ? 4.2 : clamp(2.9 - 0.3 * w, 1.15, 3);
    this.fx = { magnete: 0, scudo: 0, lento: 0 };
    this.cdMax = pw === 'amica' ? 13 : 20; this.cd = 0;
    this.gemsGot = 0; this.saidT = 0;
    const L = this.L;
    this.m = { got: 0 };
    if (L.type === 'rings') { this.m.ci = 0; this.m.target = L.colors[0]; }
    if (L.type === 'numbers') { this.m.round = 0; this.m.target = randi(1, L.max); }
    if (L.type === 'letters') { this.m.idx = 0; }
    if (L.type === 'deliver') { this.m.carry = false; }
    if (L.type === 'boss') {
      this.boss = { x: W * 0.8, y: H * 0.45, r: 92 * this.k, hp: L.hits, max: L.hits, mood: 0, flash: 0, throwT: 2, calm: false, king: this.w === 5 };
      this.m.charged = false;
    } else this.boss = null;
    $('.magic-btn', this.el).classList.toggle('hidden', !this.fairy);
    if (this.fairy) { $('.magic-btn .me', this.el).textContent = this.fairy.e; $('.magic-btn', this.el).style.setProperty('--c', this.fairy.color); }
    this.hud();
    Voice.say(this.startLine());
  },
  startLine() {
    const L = this.L, W = this.WD;
    switch (L.type) {
      case 'collect': return `Via! Raccogli ${NUM_WORDS[L.n]} ${W.item.many}!`;
      case 'rescue': return 'Via! Libera le fatine nelle bolle!';
      case 'rings': return `Via! Passa negli anelli ${RING_COLORS[this.m.target].pl}!`;
      case 'numbers': return `Via! Prendi il numero ${NUM_WORDS[this.m.target]}!`;
      case 'letters': return `Via! Prendi la lettera ${LETTER_SAY[L.word[0]]}!`;
      case 'deliver': return 'Via! Prendi la lettera d\'amore!';
      case 'boss': return `Ecco il ${W.boss}! Prendi un arcobaleno!`;
    }
  },

  /* ---------- HUD ---------- */
  hud() {
    const h = $('.hearts', this.el);
    h.innerHTML = Array.from({ length: this.maxHearts }, (_, i) => `<span class="${i < this.hearts ? '' : 'off'}">${i < this.hearts ? '❤️' : '🤍'}</span>`).join('');
    const L = this.L, m = this.m, box = $('.mission', this.el);
    const dots = (n, got) => '<i class="dots">' + Array.from({ length: n }, (_, i) => `<b class="${i < got ? 'on' : ''}"></b>`).join('') + '</i>';
    switch (L.type) {
      case 'collect': box.innerHTML = `<span class="mi">${this.WD.item.e}</span><span class="mn">${m.got}/${L.n}</span>`; break;
      case 'rescue': box.innerHTML = `<span class="mi">🧚</span>${dots(L.n, m.got)}`; break;
      case 'rings': box.innerHTML = `<span class="ring-ico" style="--rc:${RING_COLORS[m.target].c}"></span>${dots(L.n, m.got)}`; break;
      case 'numbers': box.innerHTML = `<span class="num-big">${m.target}</span><span class="num-dots">${'●'.repeat(m.target)}</span>${dots(L.rounds, m.round)}`; break;
      case 'letters': box.innerHTML = `<span class="word">${[...L.word].map((c, i) => `<b class="${i < m.idx ? 'on' : i === m.idx ? 'next' : ''}">${c}</b>`).join('')}</span>`; break;
      case 'deliver': box.innerHTML = `<span class="mi ${m.carry ? 'carry' : ''}">${m.carry ? '💌➡️' : '💌'}</span>${dots(L.n, m.got)}`; break;
      case 'boss': {
        const b = this.boss;
        box.innerHTML = `<span class="mi">${b.calm ? '😊' : '⛈️'}</span>${dots(b.max, b.max - b.hp)}<span class="mi charge ${m.charged ? 'on' : ''}">🌈</span>`;
      }
    }
  },
  say(t, gap = 0) { if (this.t - this.saidT < gap) return; this.saidT = this.t; Voice.say(t); },
  text(x, y, txt, col = '#d6336c') { this.texts.push({ x, y, txt, life: 1.1, col }); },
  screen(x, y) { const r = this.cv.getBoundingClientRect(); return [r.left + x, r.top + y]; },

  /* ---------- Magia della fatina ---------- */
  magic() {
    if (!this.fairy || this.cd > 0 || this.state !== 'play' || this.paused) { Sound.softPop(); return; }
    const f = this.fairy, [sx, sy] = this.screen(this.p.x, this.p.y);
    Sound.magic(); FX.burst(sx, sy, { n: 30, colors: [f.color, '#fff', '#ffe066'] });
    this.cd = this.cdMax;
    switch (f.power) {
      case 'magnete': this.fx.magnete = f.dur; this.say('Magia dei fiori! Tutto vola da te!'); break;
      case 'scudo': this.fx.scudo = f.dur; this.say('Scudo arcobaleno!'); break;
      case 'lento': this.fx.lento = f.dur; this.say('Soffio del vento! Tutto va piano piano!'); break;
      case 'onda':
        for (const o of this.obs) { o.dead = true; this.items.push({ kind: 'gem', e: '💎', x: o.x, y0: o.y, y: o.y, r: 20 * this.k, ph: 0 }); }
        this.say("Onda magica! Le nuvole sono diventate diamanti!"); break;
      case 'pioggia':
        for (let i = 0; i < 8; i++) this.spawnBonus(this.W + 40 + i * 70 * this.k, rand(this.H * 0.15, this.H * 0.85));
        this.say('Pioggia di dolcezza!'); break;
      case 'cuore':
        if (this.hearts < this.maxHearts) { this.hearts++; this.hud(); this.say('Un cuoricino nuovo!'); FX.hearts(sx, sy, 8); }
        this.fx.scudo = 2; break;
    }
  },
  spawnBonus(x, y) {
    const t = this.L.type, k = this.k;
    if (t === 'collect') this.items.push({ kind: 'target', e: this.WD.item.e, x, y0: y, y, r: 26 * k, ph: rand(0, 6) });
    else this.items.push({ kind: 'gem', e: '💎', x, y0: y, y, r: 20 * k, ph: rand(0, 6) });
  },

  /* ---------- Generazione degli oggetti ---------- */
  spawn() {
    const L = this.L, m = this.m, W = this.W, H = this.H, k = this.k;
    const y = () => rand(H * 0.16, H * 0.86), X = W + 60 * k;
    const has = kind => this.items.some(i => i.kind === kind);
    switch (L.type) {
      case 'collect':
        this.items.push({ kind: 'target', e: this.WD.item.e, x: X, y0: y(), r: 27 * k, ph: rand(0, 6) });
        return rand(0.55, 0.9);
      case 'rescue':
        if (this.items.filter(i => i.kind === 'fairy').length < 2) this.items.push({ kind: 'fairy', x: X, y0: y(), r: 40 * k, ph: rand(0, 6), col: pick(['#ff8cc6', '#b197fc', '#74c0fc', '#63e6be']) });
        return rand(2.4, 3.4);
      case 'rings': {
        const col = Math.random() < 0.55 ? m.target : pick(L.colors.filter(c => c !== m.target));
        this.items.push({ kind: 'ring', color: col, x: X, y0: rand(H * 0.22, H * 0.8), rx: 30 * k, ry: 62 * k, ph: rand(0, 6) });
        return rand(1.4, 1.9);
      }
      case 'numbers': {
        const others = shuffle([...Array(L.max).keys()].map(i => i + 1).filter(n => n !== m.target)).slice(0, 2);
        const nums = shuffle([m.target, ...others]);
        nums.forEach((n, i) => this.items.push({ kind: 'num', n, x: X + i * 30 * k, y0: H * (0.24 + i * 0.27), r: 40 * k, ph: rand(0, 6), col: pick(['#ff6b9d', '#4dabf7', '#ffa94d', '#9775fa', '#51cf66']) }));
        return 2.8;
      }
      case 'letters': {
        const need = L.word[m.idx];
        const onScreen = this.items.some(i => i.kind === 'letter' && i.c === need);
        const c = !onScreen && Math.random() < 0.6 ? need : pick([...'ABCEILMORST'].filter(x => x !== need));
        this.items.push({ kind: 'letter', c, x: X, y0: y(), r: 38 * k, ph: rand(0, 6), col: pick(['#ff6b9d', '#4dabf7', '#ffa94d', '#9775fa', '#51cf66']) });
        return rand(1.1, 1.5);
      }
      case 'deliver':
        if (!m.carry && !has('mail')) this.items.push({ kind: 'mail', e: '💌', x: X, y0: y(), r: 30 * k, ph: rand(0, 6) });
        if (m.carry && !has('friend')) this.items.push({ kind: 'friend', e: pick(this.WD.friends), x: X, y0: rand(H * 0.25, H * 0.75), r: 44 * k, ph: rand(0, 6), sp: 0.65 });
        return 1.2;
      case 'boss':
        if (!m.charged && !has('rainbow') && !this.boss.calm) this.items.push({ kind: 'rainbow', e: '🌈', x: X, y0: y(), r: 32 * k, ph: rand(0, 6) });
        return 2.2;
    }
  },
  spawnObstacle() {
    const k = this.k, H = this.H;
    if (this.w === 5 && Math.random() < 0.4) this.obs.push({ kind: 'bat', x: this.W + 50, y0: rand(H * 0.15, H * 0.85), r: 24 * k, ph: rand(0, 6), sp: 1.25 });
    else this.obs.push({ kind: 'storm', x: this.W + 70, y0: rand(H * 0.15, H * 0.85), r: (36 + rand(0, 10)) * k, ph: rand(0, 6), zig: this.w >= 2, sp: 0.85 });
  },

  /* ---------- Aggiornamento ---------- */
  update(dt) {
    this.t += dt;
    const p = this.p, k = this.k, W = this.W, H = this.H, pw = this.rider.power;
    for (const key in this.fx) this.fx[key] = Math.max(0, this.fx[key] - dt);
    if (this.cd > 0) { this.cd = Math.max(0, this.cd - dt); }
    const mb = $('.magic-btn', this.el); if (mb) { mb.style.setProperty('--p', (1 - this.cd / this.cdMax) * 360 + 'deg'); mb.classList.toggle('ready', this.cd <= 0); }
    const slow = this.fx.lento > 0 ? 0.5 : 1;
    const obsSlow = slow * (pw === 'piano' ? 0.72 : 1);
    const sp = this.speed * slow * (this.state === 'win' ? 1.8 : 1);
    this.off += sp * dt;
    // unicorno
    if (this.state === 'win') { p.tx = W * 0.5 + Math.cos(this.t * 2) * W * 0.2; p.ty = H * 0.45 + Math.sin(this.t * 2) * H * 0.2; }
    p.x += (p.tx - p.x) * Math.min(1, dt * 4.5);
    p.y += (p.ty - p.y) * Math.min(1, dt * 5.5);
    if (p.inv > 0) p.inv -= dt;
    p.spin *= 0.9;
    const size = Math.max(110, 140 * k), py = p.y + Math.sin(this.t * 5) * 4 * k;
    for (const q of this.trail) q.x -= sp * dt;
    this.trail.push({ x: p.x - size * 0.36, y: py + size * 0.08 });
    while (this.trail.length > 40) this.trail.shift();
    // generazione
    if (this.state === 'play') {
      this.spawnT -= dt * slow; if (this.spawnT <= 0) this.spawnT = this.spawn();
      this.obsT -= dt * obsSlow;
      if (this.obsT <= 0) { this.obsT = rand(this.obsEvery * 0.7, this.obsEvery * 1.2); if (!(this.boss && this.boss.calm)) this.spawnObstacle(); }
      this.gemT -= dt; if (this.gemT <= 0) { this.gemT = rand(1.8, 3); this.items.push({ kind: 'gem', e: '💎', x: W + 40, y0: rand(H * 0.15, H * 0.85), r: 20 * k, ph: rand(0, 6) }); }
      this.heartT -= dt; if (this.heartT <= 0) { this.heartT = this.boss ? 8 : 14; if (this.hearts < this.maxHearts) this.items.push({ kind: 'heart', e: '💖', x: W + 40, y0: rand(H * 0.2, H * 0.8), r: 24 * k, ph: 0 }); }
    }
    // calamita
    const magR = this.fx.magnete > 0 ? 520 * k : pw === 'calamita' || pw === 'tutto' ? 170 * k : 0;
    // oggetti
    for (const it of this.items) {
      it.x -= sp * (it.sp || 1) * dt;
      it.y = it.y0 + Math.sin(this.t * 2.5 + it.ph) * 12 * k;
      if (magR && it.kind !== 'ring' && it.kind !== 'friend' && it.kind !== 'num' && it.kind !== 'letter' && it.kind !== 'cage') {
        const dx = p.x - it.x, dy = py - it.y, d = Math.hypot(dx, dy);
        if (d < magR && d > 1) { const v = 560 * k * dt; it.x += dx / d * v; it.y0 += dy / d * v; }
      }
      if (it.kind === 'cage') { it.x += (W * 0.5 - it.x) * dt * 0.5; }
      if (this.state !== 'play') continue;
      if (it.kind === 'ring') {
        if (!it.done && it.x <= p.x && it.x + sp * dt * 2 + 4 > p.x) {
          it.done = true;
          if (Math.abs(py - it.y) < it.ry * 0.85) this.ringPass(it);
        }
        continue;
      }
      if (Math.hypot(it.x - p.x, it.y - py) < size * 0.36 + it.r) this.touch(it);
    }
    this.items = this.items.filter(it => !it.dead && it.x > -100);
    // ostacoli
    for (const o of this.obs) {
      o.x -= (this.speed * obsSlow * (o.sp || 1)) * dt;
      o.y = o.y0 + (o.zig ? Math.sin(this.t * 1.6 + o.ph) * 70 * k : Math.sin(this.t * 2 + o.ph) * 10 * k) + (o.kind === 'bat' ? Math.sin(this.t * 6 + o.ph) * 30 * k : 0);
      if (o.vx) { o.x += o.vx * obsSlow * dt; o.y0 += (o.vy || 0) * dt; }
      if (this.state === 'play' && Math.hypot(o.x - p.x, o.y - py) < size * 0.3 + o.r * 0.8) this.hit(o);
    }
    this.obs = this.obs.filter(o => !o.dead && o.x > -120);
    // boss
    if (this.boss) this.updateBoss(dt, py, size, obsSlow);
    // fatine liberate che seguono l'unicorno
    this.followers.forEach((f, i) => {
      const q = this.trail[Math.max(0, this.trail.length - 8 - i * 7)] || { x: p.x - 60, y: p.y };
      f.x += (q.x - 30 * k - f.x) * dt * 5; f.y += (q.y - 30 * k + Math.sin(this.t * 4 + i) * 10 * k - f.y) * dt * 5;
    });
    for (const tx of this.texts) { tx.life -= dt; tx.y -= 50 * dt; }
    this.texts = this.texts.filter(t => t.life > 0);
  },

  touch(it) {
    const k = this.k, m = this.m, L = this.L, [sx, sy] = this.screen(it.x, it.y);
    switch (it.kind) {
      case 'gem': {
        it.dead = true; const n = this.rider.power === 'doppio' ? 2 : 1; addGems(n); this.gemsGot += n;
        Sound.star(randi(4, 9)); FX.sparkle(sx, sy, 8); this.text(it.x, it.y, '💎+' + n, '#1c7ed6'); return;
      }
      case 'heart':
        it.dead = true; if (this.hearts < this.maxHearts) { this.hearts++; this.hud(); }
        Sound.chime(); FX.hearts(sx, sy, 5); return;
      case 'target':
        it.dead = true; m.got++;
        Sound.star(m.got); FX.sparkle(sx, sy, 12); this.text(it.x, it.y, String(m.got));
        Voice.say(NUM_WORDS[m.got] + '!');
        this.hud(); if (m.got >= L.n) this.win(); return;
      case 'fairy':
        it.dead = true; m.got++;
        Sound.pop(); Sound.chime(); FX.burst(sx, sy, { colors: [it.col, '#fff', '#ffe066'], n: 24 });
        this.followers.push({ x: it.x, y: it.y, col: it.col });
        Voice.say(pick(['Grazie Camilla!', 'Sono libera! Evviva!', 'Grazie! Vengo con te!']), { pitch: 1.7 });
        this.hud(); if (m.got >= L.n) this.win(); return;
      case 'num':
        if (it.n === m.target) {
          it.dead = true; m.round++;
          Sound.pop(); Sound.chime(); FX.burst(sx, sy, { colors: [it.col, '#fff'], n: 20 });
          this.items.forEach(o => { if (o.kind === 'num') { o.dead = true; } });
          if (m.round >= L.rounds) { this.hud(); this.win(); return; }
          let nt; do { nt = randi(1, L.max); } while (nt === m.target && L.max > 1);
          m.target = nt; this.spawnT = 1.2;
          Voice.say(`${pick(PRAISE)} Ora prendi il ${NUM_WORDS[nt]}!`);
          this.hud();
        } else {
          it.dead = true; Sound.softPop(); FX.burst(sx, sy, { colors: [it.col], n: 8, speed: 140 });
          this.say(`Questo è il ${NUM_WORDS[it.n]}. Cerca il ${NUM_WORDS[m.target]}!`, 2.5);
        }
        return;
      case 'letter': {
        const need = L.word[m.idx];
        it.dead = true;
        if (it.c === need) {
          m.idx++; Sound.pop(); Sound.star(m.idx + 2); FX.burst(sx, sy, { colors: [it.col, '#fff'], n: 18 });
          this.hud();
          if (m.idx >= L.word.length) { this.win(); return; }
          Voice.say(`${LETTER_SAY[it.c]}! Ora la ${LETTER_SAY[L.word[m.idx]]}!`);
        } else {
          Sound.softPop(); FX.burst(sx, sy, { colors: [it.col], n: 8, speed: 140 });
          this.say(`Questa è la ${LETTER_SAY[it.c]}. Cerca la ${LETTER_SAY[need]}!`, 2.5);
        }
        return;
      }
      case 'mail':
        it.dead = true; m.carry = true; Sound.chime(); FX.hearts(sx, sy, 4);
        Voice.say("Hai preso la lettera d'amore! Portala all'amico che ti aspetta sulla nuvoletta!");
        this.spawnT = 1.5; this.hud(); return;
      case 'friend':
        if (!m.carry) return;
        it.dead = true; m.carry = false; m.got++;
        Sound.win(); FX.hearts(sx, sy, 10);
        this.text(it.x, it.y - 40 * k, '💌✔');
        this.hud();
        if (m.got >= L.n) { this.win(); return; }
        Voice.say(pick(['Grazie! Che bella lettera!', 'Evviva, una lettera per me! Grazie!', 'Che bello! Grazie Camilla!']));
        this.spawnT = 1.5; return;
      case 'rainbow':
        it.dead = true; m.charged = true; Sound.magic(); FX.burst(sx, sy, { n: 26 });
        Voice.say(`Hai l'arcobaleno! Ora vola contro il ${this.WD.boss}!`);
        this.hud(); return;
      case 'cage':
        it.dead = true; this.newRider = true;
        Sound.win(); FX.burst(sx, sy, { n: 40 });
        this.win(); return;
    }
  },
  ringPass(it) {
    const L = this.L, m = this.m, [sx, sy] = this.screen(it.x, it.y);
    if (it.color === m.target) {
      it.hit = true; m.got++;
      Sound.star(m.got + 2); FX.burst(sx, sy, { colors: [RING_COLORS[it.color].c, '#fff'], n: 20 });
      if (m.got >= L.n) { this.hud(); this.win(); return; }
      if (m.got % 3 === 0) {
        m.ci = (m.ci + 1) % L.colors.length; m.target = L.colors[m.ci];
        Voice.say(`${pick(PRAISE)} Ora gli anelli ${RING_COLORS[m.target].pl}!`);
      } else Voice.say(it.color + '!');
      this.hud();
    } else {
      Sound.softPop();
      this.say(`Questo era ${it.color}! Cerca gli anelli ${RING_COLORS[m.target].pl}!`, 2.5);
    }
  },
  hit(o) {
    const p = this.p;
    if (p.inv > 0 || this.fx.scudo > 0) return;
    const [sx, sy] = this.screen(p.x, p.y);
    o.dead = true;
    if (p.bubble) { p.bubble = false; p.inv = 1.2; Sound.pop(); FX.burst(sx, sy, { colors: ['#a5d8ff', '#fff'], n: 20 }); this.say('La bolla magica ti ha protetta!', 3); return; }
    this.hearts--; this.lost++; p.inv = 1.6; p.spin = 6;
    Sound.boing(); FX.burst(sx, sy, { colors: ['#adb5bd', '#74c0fc'], n: 14 });
    this.hud();
    if (this.hearts <= 0) { this.fail(); return; }
    this.say(pick(['Ahi! Attenta alle nuvole grigie!', 'Ops! Evita le nuvole cattive!', 'Brrr! Stai lontana dalle nuvole grigie!']), 6);
  },

  /* ---------- Nuvolone ---------- */
  updateBoss(dt, py, size, obsSlow) {
    const b = this.boss, p = this.p, k = this.k;
    b.flash = Math.max(0, b.flash - dt);
    const targetMood = b.calm ? 1 : (b.max - b.hp) / b.max * 0.75;
    b.mood += (targetMood - b.mood) * dt * 2;
    b.y = this.H * 0.45 + Math.sin(this.t * (0.8 + this.w * 0.08)) * this.H * 0.26;
    if (b.calm) return;
    b.throwT -= dt * obsSlow;
    if (b.throwT <= 0 && this.state === 'play') {
      b.throwT = clamp(2.3 - this.w * 0.2, 1.1, 2.3) * rand(0.85, 1.2);
      const n = this.w >= 3 ? 3 : this.w >= 1 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const ang = (i - (n - 1) / 2) * 0.25;
        this.obs.push({ kind: 'drop', x: b.x - b.r * 0.7, y0: b.y + b.r * 0.2, r: 15 * k, sp: 0.2, vx: -(200 + this.w * 25) * k * Math.cos(ang), vy: (200 + this.w * 25) * k * Math.sin(ang), ph: 0 });
      }
    }
    if (this.state !== 'play') return;
    if (Math.hypot(b.x - p.x, b.y - py) < b.r * 0.85 + size * 0.3) {
      p.tx = this.W * 0.22; p.x -= 60 * k; // rimbalzo
      if (this.m.charged) {
        this.m.charged = false; b.hp--; b.flash = 0.35;
        const [sx, sy] = this.screen(b.x - b.r * 0.6, b.y);
        Sound.win(); FX.burst(sx, sy, { n: 40, colors: RAINBOW });
        if (b.hp <= 0) this.calmBoss();
        else Voice.say(pick(['Ohhh! Mi sento già un po\' più colorato!', 'Ehi! Che solletico questo arcobaleno!', 'Uffa! Sto diventando meno grigio!']), { pitch: 0.8 });
        this.hud();
      } else {
        Sound.softPop();
        this.say('Prima prendi un arcobaleno!', 4);
      }
    }
  },
  calmBoss() {
    const b = this.boss; b.calm = true;
    this.obs.forEach(o => o.dead = true);
    Music.play('mappa');
    const k = this.k;
    Voice.say(`Grazie Camilla! Ero tanto triste perché nessuno giocava con me. Scusa! Ti ridò il tuo amico unicorno ${RIDERS[this.w].name}!`, { pitch: 0.9 });
    this.items.push({ kind: 'cage', x: b.x - b.r, y0: b.y, r: 56 * k, ph: 0, sp: 0.001 });
  },

  /* ---------- Vittoria e sconfitta ---------- */
  win() {
    if (this.state !== 'play') return;
    this.state = 'win';
    this.obs.forEach(o => o.dead = true);
    Sound.win(); FX.confetti();
    const stars = this.lost === 0 ? 3 : this.lost === 1 ? 2 : 1;
    const key = levelKey(this.w, this.l);
    const before = Store.data.stars[key] || 0;
    Store.data.stars[key] = Math.max(before, stars);
    const bonus = stars * 3; addGems(bonus);
    let newFairy = null, newRider = null;
    if (this.l === 1 && !Store.data.fairies.includes(this.w)) {
      Store.data.fairies.push(this.w); newFairy = this.w;
      if (Store.data.fairy === null) Store.data.fairy = this.w;
    }
    if (this.L.type === 'boss' && !Store.data.rescued.includes(this.w)) { Store.data.rescued.push(this.w); newRider = this.w; }
    const finale = this.L.type === 'boss' && this.w === 5 && !Store.data.finale;
    if (finale) Store.data.finale = true;
    Store.save();
    Voice.say(this.winLine() + ' Missione compiuta!' + Famiglia.line(0.45));
    this.endT = setTimeout(() => go('result', { w: this.w, l: this.l, stars, gems: this.gemsGot + bonus, newFairy, newRider, finale, first: before === 0 }), 3200);
  },
  winLine() {
    switch (this.L.type) {
      case 'letters': return `Hai scritto ${this.L.word === 'CAMILLA' ? 'il tuo nome, Camilla' : this.L.word.toLowerCase()}! ${pick(PRAISE)}`;
      case 'numbers': return 'Conosci benissimo i numeri!';
      case 'rings': return 'Conosci tutti i colori!';
      case 'boss': return 'Il Nuvolone è tornato buono!';
      default: return pick(PRAISE);
    }
  },
  fail() {
    this.state = 'fail';
    Sound.softPop();
    Voice.say(`Oh no! ${this.rider.name} è stanca e deve riposare. Riproviamo insieme? Puoi farcela!`);
    this.endT = setTimeout(() => {
      Modal.show(`<div class="big-emoji">😴</div><div class="modal-actions">
        <button class="round-btn" id="f-retry" aria-label="Riprova">🔁</button><button class="round-btn" id="f-map" aria-label="Mappa">🗺️</button></div>`, 'fail');
      $('#f-retry').onclick = () => { Sound.click(); Modal.hide(); this.reset(); };
      $('#f-map').onclick = () => { Sound.click(); go('world', this.w); };
    }, 1300);
  },
  pause() {
    if (this.state !== 'play') return;
    Sound.click(); this.paused = true;
    Modal.show(`<div class="big-emoji">⏸</div><div class="modal-actions">
      <button class="round-btn" id="p-go" aria-label="Continua">▶</button>
      <button class="round-btn" id="p-retry" aria-label="Ricomincia">🔁</button>
      <button class="round-btn" id="p-map" aria-label="Mappa">🗺️</button></div>`, 'pause');
    $('#p-go').onclick = () => { Sound.click(); Modal.hide(); this.paused = false; this.last = performance.now(); };
    $('#p-retry').onclick = () => { Sound.click(); Modal.hide(); this.reset(); };
    $('#p-map').onclick = () => { Sound.click(); go('world', this.w); };
  },

  /* ---------- Disegno ---------- */
  draw() {
    const c = this.ctx, W = this.W, H = this.H, k = this.k, t = this.t, p = this.p;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    SCENERY[this.WD.theme](c, W, H, t, this.off, k);
    // anelli
    for (const it of this.items) if (it.kind === 'ring') {
      const col = RING_COLORS[it.color].c;
      c.save(); c.globalAlpha = it.done && !it.hit ? 0.35 : 1;
      c.lineWidth = 13 * k; c.strokeStyle = '#ffffff'; c.beginPath(); c.ellipse(it.x, it.y, it.rx, it.ry, 0, 0, 7); c.stroke();
      c.lineWidth = 9 * k; c.strokeStyle = col; c.stroke();
      if (it.hit) { c.globalAlpha = 0.5; c.fillStyle = col; c.fill(); }
      c.restore();
    }
    // oggetti
    for (const it of this.items) {
      if (it.kind === 'ring') continue;
      const bob = Math.sin(t * 3 + it.ph) * 0.15;
      if (it.kind === 'fairy') { drawBubble(c, it.x, it.y, it.r, it.col, t, it.ph); emoji(c, '🧚', it.x, it.y, it.r * 1.1, bob); }
      else if (it.kind === 'num' || it.kind === 'letter') {
        drawBubble(c, it.x, it.y, it.r, it.col, t, it.ph);
        c.font = `700 ${it.r * 1.05}px Fredoka, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineWidth = 6; c.strokeStyle = '#fff'; const s = it.kind === 'num' ? String(it.n) : it.c;
        c.strokeText(s, it.x, it.y + 2); c.fillStyle = it.col; c.fillText(s, it.x, it.y + 2);
      } else if (it.kind === 'friend') {
        c.fillStyle = 'rgba(255,255,255,.95)'; puff(c, it.x, it.y + it.r * 0.75, it.r * 0.95);
        emoji(c, it.e, it.x, it.y, it.r * 1.3);
        if (this.m.carry) { c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); emoji(c, '💭', it.x + it.r * 0.8, it.y - it.r * 0.9, it.r * 0.9); emoji(c, '💌', it.x + it.r * 0.85, it.y - it.r * 0.95, it.r * 0.45); c.globalAlpha = 1; }
      } else if (it.kind === 'cage') {
        drawBubble(c, it.x, it.y, it.r * 1.5, '#ffd43b', t);
        if (this.cageImg.complete) c.drawImage(this.cageImg, it.x - it.r * 1.25, it.y - it.r * 1.25, it.r * 2.5, it.r * 2.5);
      } else {
        glow(c, it.x, it.y, it.r * 1.5, it.kind === 'target' ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.45)');
        emoji(c, it.e, it.x, it.y, it.r * 1.75, bob);
      }
    }
    // ostacoli
    for (const o of this.obs) {
      if (o.kind === 'storm') drawStorm(c, o.x, o.y, o.r, t, k);
      else if (o.kind === 'bat') emoji(c, '🦇', o.x, o.y, o.r * 2, Math.sin(t * 8) * 0.2);
      else if (o.kind === 'drop') {
        c.fillStyle = '#748ffc'; c.beginPath(); c.moveTo(o.x - o.r * 1.6, o.y);
        c.quadraticCurveTo(o.x, o.y - o.r * 1.1, o.x + o.r, o.y); c.arc(o.x, o.y, o.r, 0, Math.PI); c.fill();
        c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(o.x + o.r * 0.3, o.y - o.r * 0.2, o.r * 0.3, 0, 7); c.fill();
      }
    }
    if (this.boss) drawBoss(c, this.boss.x, this.boss.y, this.boss.r, this.boss.mood, t, this.boss.flash, this.boss.king);
    // scia arcobaleno
    if (this.trail.length > 2) {
      c.lineCap = 'round'; c.lineJoin = 'round';
      RAINBOW.forEach((col, b) => {
        c.strokeStyle = col; c.lineWidth = 6 * k; c.globalAlpha = 0.85;
        c.beginPath();
        this.trail.forEach((q, i) => { const y = q.y + (b - 2.5) * 5.5 * k + Math.sin(i * 0.4 + t * 6) * 2; i ? c.lineTo(q.x, y) : c.moveTo(q.x, y); });
        c.stroke();
      });
      c.globalAlpha = 1;
    }
    for (const f of this.followers) { glow(c, f.x, f.y, 26 * k, f.col + 'aa'); emoji(c, '🧚', f.x, f.y, 30 * k, Math.sin(t * 6) * 0.15); }
    // unicorno
    const size = Math.max(110, 140 * k), py = p.y + Math.sin(t * 5) * 4 * k;
    if (this.fx.magnete > 0 || this.rider.power === 'calamita' || this.rider.power === 'tutto') glow(c, p.x, py, size * (this.fx.magnete > 0 ? 0.9 : 0.6), this.fx.magnete > 0 ? 'rgba(255,140,198,.45)' : 'rgba(255,255,255,.3)');
    if (this.m.charged) glow(c, p.x, py, size * 0.8, `hsla(${(t * 300) % 360},95%,65%,.55)`);
    c.save(); c.translate(p.x, py);
    c.rotate(clamp((p.ty - p.y) * 0.002, -0.35, 0.35) + Math.sin(p.spin) * 0.3);
    if (p.inv > 0 && Math.floor(p.inv * 12) % 2) c.globalAlpha = 0.45;
    const img = this.imgs[Math.floor(t * 7) % 2];
    if (img.complete) c.drawImage(img, -size / 2, -size / 2, size, size);
    c.restore(); c.globalAlpha = 1;
    if (this.m.carry) emoji(c, '💌', p.x + size * 0.12, py - size * 0.42, 30 * k, Math.sin(t * 5) * 0.2);
    if (p.bubble) drawBubble(c, p.x, py, size * 0.55, '#74c0fc', t);
    if (this.fx.scudo > 0) {
      c.save(); c.lineWidth = 6 * k; c.globalAlpha = 0.8;
      RAINBOW.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(p.x, py, size * 0.55 + i * 5 * k, t * 3 + i, t * 3 + i + 4); c.stroke(); });
      c.restore();
    }
    // testi
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const tx of this.texts) {
      c.globalAlpha = Math.min(1, tx.life * 2);
      c.font = `700 ${28 * k}px Fredoka, sans-serif`; c.lineWidth = 6; c.strokeStyle = '#fff'; c.strokeText(tx.txt, tx.x, tx.y);
      c.fillStyle = tx.col; c.fillText(tx.txt, tx.x, tx.y);
    }
    c.globalAlpha = 1;
    if (!this.touched && this.t < 6) {
      c.globalAlpha = 0.9; emoji(c, '👆', p.x + 90 * k, p.y + 40 * k + Math.sin(t * 6) * 26 * k, 56 * k); c.globalAlpha = 1;
    }
  }
};
