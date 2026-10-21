'use strict';
/* ============ Schermate: inizio, storia, mappa, mondo, risultati, laboratorio, scuderia, fatine ============ */
const say = (t, o) => Voice.say(t, o);
function uniHTML(look, cls = '') { return `<div class="uni ${cls}">${unicornSVG(look, { wings: true })}</div>`; }
function topbar(back) {
  return `<header class="topbar">
    ${back ? `<button class="icon-btn back" aria-label="Indietro">${back}</button>` : ''}
    <span class="pill">💎 <b class="gem-count">${Store.data.gems}</b></span>
    <span class="grow"></span>
    <button class="icon-btn music ${Store.data.music ? '' : 'off'}" aria-label="Musica">🎵</button>
    <button class="icon-btn small parent" aria-label="Area genitori">⚙️</button>
  </header>`;
}
function bindTop(el, onBack) {
  const b = $('.back', el); if (b) b.onclick = () => { Sound.click(); onBack(); };
  $('.music', el).onclick = e => {
    Store.data.music = !Store.data.music; Store.save();
    Store.data.music ? Music.start() : Music.stop();
    e.currentTarget.classList.toggle('off', !Store.data.music); Sound.click();
  };
  $('.parent', el).onclick = () => Parent.open();
}

/* ---------- Schermata iniziale ---------- */
Screens.splash = {
  enter(el) {
    el.innerHTML = `<div class="splash-inner">
      <h1 class="title"><span class="t1">Le Ali</span><span class="t1">Magiche</span><span class="t3">di Camilla</span></h1>
      <div class="splash-scene">${uniHTML(Store.data.unicorn, 'flap big')}<span class="sp-fairy">🧚</span><span class="sp-fairy two">🧚‍♀️</span></div>
      <button class="play-btn" aria-label="Gioca">▶</button></div>`;
    $('.play-btn', el).onclick = () => {
      Sound.init(); Sound.magic(); FX.confetti();
      try { if (matchMedia('(pointer: coarse)').matches && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => { }); } catch (e) { }
      if (!Store.data.introDone) go('intro');
      else if (!Store.data.created) go('lab', { first: true });
      else {
        go('map');
        Famiglia.last = Date.now(); Famiglia.toast();
        say(`Bentornata Camilla! ${Store.data.unicorn.name} ti aspettava! La mamma Martina, il babbo Daniele e la gattina Zsafragy ti mandano un bacione!`);
      }
    };
  }
};

/* ---------- La storia all'inizio ---------- */
const STORY = [
  { art: '<span class="st-big glow">🧚</span>', t: 'Ciao Camilla! Io sono la Fata Lumina, la fata della luce. Che bello conoscerti!' },
  { art: '<span class="st-row">🏰🌈🌳</span><span class="st-row">🦄 🦄 🦄</span>', t: 'Questo è il Regno delle Fate, dove vivono tanti unicorni volanti e tante fatine.' },
  { art: '<span class="st-big shake">⛈️</span><span class="st-row small">🫧🧚 🫧🧚 🫧🦄</span>', t: 'Ma il Nuvolone Brontolone si è arrabbiato! Ha chiuso le fatine nelle bolle e ha portato via gli unicorni!' },
  { art: '<span class="st-big">👧</span><span class="st-row">💖✨💖</span>', t: 'Ci serve una bambina coraggiosa e gentile. Ci serve proprio te, Camilla!' },
  { art: '<span class="st-big glow">🦄</span>', t: 'Prima di partire, creiamo il tuo unicorno magico. Volerete insieme in sei mondi incantati!' }
];
Screens.intro = {
  enter(el) {
    this.el = el; this.i = 0;
    el.innerHTML = `<div class="story"><div class="st-art"></div><div class="st-dots"></div>
      <button class="round-btn st-next" aria-label="Avanti">▶</button><button class="st-skip" aria-label="Salta">⏭</button></div>`;
    $('.st-next', el).onclick = () => { Sound.click(); this.next(); };
    $('.st-skip', el).onclick = () => { Sound.click(); this.done(); };
    Music.play('mappa');
    this.show();
  },
  show() {
    const s = STORY[this.i];
    const art = $('.st-art', this.el); art.innerHTML = s.art; art.classList.remove('in'); void art.offsetWidth; art.classList.add('in');
    $('.st-dots', this.el).innerHTML = STORY.map((_, i) => `<b class="${i <= this.i ? 'on' : ''}"></b>`).join('');
    say(s.t, { onend: () => { if (current === 'intro' && STORY[this.i] === s) $('.st-next', this.el).classList.add('pulse'); } });
    $('.st-next', this.el).classList.remove('pulse');
  },
  next() { if (++this.i >= STORY.length) this.done(); else this.show(); },
  done() { Store.data.introDone = true; Store.save(); go(Store.data.created ? 'map' : 'lab', { first: true }); }
};

/* ---------- Mappa dei mondi ---------- */
Screens.map = {
  enter(el) {
    Music.play('mappa');
    const d = Store.data;
    let cur = 0; WORLDS.forEach((_, w) => { if (worldOpen(w)) cur = w; });
    el.innerHTML = topbar('') + `<div class="map">
      <div class="islands">${WORLDS.map((W, w) => {
        const open = worldOpen(w);
        return `<button class="island ${open ? '' : 'locked'} ${w === cur ? 'current' : ''}" data-w="${w}" style="--c:${W.color};--d:${w * 90}ms">
          <span class="isl-ico">${W.icon}</span>${open ? '' : '<span class="isl-lock">🔒</span>'}
          <span class="isl-stars">⭐ ${worldStars(w)}/15</span>
          ${w === cur ? `<span class="isl-uni">${unicornSVG(d.unicorn, { wings: true })}</span>` : ''}
        </button>`;
      }).join('')}</div>
      <div class="map-menu">
        <button class="menu-btn" data-go="lab" style="--c:#ff8fc8" aria-label="Il tuo unicorno">🎨</button>
        <button class="menu-btn" data-go="stable" style="--c:#b197fc" aria-label="Scuderia">🦄<i>${d.rescued.length + 1}</i></button>
        <button class="menu-btn" data-go="book" style="--c:#63e6be" aria-label="Libro delle fatine">🧚<i>${d.fairies.length}</i></button>
      </div>
      <button class="lumina" aria-label="Fata Lumina">🧚</button>
    </div>`;
    bindTop(el, () => { });
    $$('.island', el).forEach(b => b.onclick = () => {
      const w = +b.dataset.w;
      if (!worldOpen(w)) { Sound.softPop(); say('Questo mondo si apre quando fai tornare buono il Nuvolone del mondo prima!'); return; }
      Sound.chime(); const [x, y] = centerOf(b); FX.sparkle(x, y, 16);
      go('world', w);
    });
    $$('.menu-btn', el).forEach(b => b.onclick = () => { Sound.chime(); go(b.dataset.go); });
    $('.lumina', el).onclick = () => {
      Sound.magic(); const [x, y] = centerOf($('.lumina', el)); FX.sparkle(x, y, 20);
      say(pick([`Tocca il mondo dove c'è ${d.unicorn.name}! Lì ti aspetta la prossima missione.`,
        'Nella scuderia trovi gli unicorni che hai salvato. Ognuno ha un potere magico!',
        'Nel libro delle fatine trovi le fatine che hai liberato. Scegline una e userà la sua magia per te!',
        'Con i diamanti puoi comprare corone e fiocchi per il tuo unicorno!']) + Famiglia.line(0.4));
    };
    if (!this.welcomed) { this.welcomed = true; }
  }
};

/* ---------- Un mondo con i suoi 5 livelli ---------- */
const NODE_POS = [[14, 70], [32, 38], [50, 68], [68, 36], [86, 62]];
const NODE_POS_V = [[30, 86], [70, 70], [30, 53], [70, 37], [50, 18]];
Screens.world = {
  enter(el, w) {
    this.el = el; this.w = w; const W = WORLDS[w];
    Music.play(W.theme === 'castello' ? 'notte' : 'mappa');
    el.innerHTML = `<canvas class="full world-bg"></canvas>` + topbar('🗺️') + `<div class="world-title">${W.icon}</div><div class="nodes"></div>`;
    bindTop(el, () => go('map'));
    this.cv = $('canvas', el); this.ctx = this.cv.getContext('2d');
    this.resize = () => { this.dpr = Math.min(2, devicePixelRatio || 1); this.cv.width = el.clientWidth * this.dpr; this.cv.height = el.clientHeight * this.dpr; this.layout(); };
    addEventListener('resize', this.resize); this.resize();
    const t0 = performance.now();
    const loop = t => {
      const c = this.ctx, Wd = el.clientWidth, H = el.clientHeight;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      SCENERY[W.theme](c, Wd, H, (t - t0) / 1000, (t - t0) / 1000 * 25, clamp(Math.min(Wd, H) / 600, 0.62, 1.4));
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    const k = 'w' + w;
    if (!Store.data[k]) { Store.data[k] = 1; Store.save(); say(W.intro); }
    else say(W.name + '!');
  },
  exit() { cancelAnimationFrame(this.raf); removeEventListener('resize', this.resize); },
  layout() {
    const el = this.el, w = this.w, W = WORLDS[w];
    const vert = el.clientWidth < el.clientHeight;
    const pos = vert ? NODE_POS_V : NODE_POS;
    let next = -1; for (let l = 0; l < 5; l++) if (levelOpen(w, l) && !starsOf(w, l)) { next = l; break; }
    const pts = pos.map(([x, y]) => `${x},${y}`).join(' ');
    $('.nodes', el).innerHTML = `<svg class="path" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts}"/></svg>` +
      W.levels.map((L, l) => {
        const open = levelOpen(w, l), st = starsOf(w, l);
        const ico = L.type === 'collect' ? W.item.e : L.type === 'boss' ? (w === 5 ? '👑' : '⛈️') : MISSION_ICON[L.type];
        return `<button class="node ${open ? '' : 'locked'} ${l === next ? 'next' : ''} ${L.type === 'boss' ? 'boss' : ''}" data-l="${l}" style="left:${pos[l][0]}%;top:${pos[l][1]}%;--c:${W.color}">
          <span class="n-ico">${open ? ico : '🔒'}</span>
          <span class="n-stars">${[0, 1, 2].map(i => i < st ? '⭐' : '<i>☆</i>').join('')}</span></button>`;
      }).join('');
    $$('.node', el).forEach(b => b.onclick = () => {
      const l = +b.dataset.l;
      if (!levelOpen(w, l)) { Sound.softPop(); say('Prima finisci la missione di prima!'); return; }
      Sound.chime(); Prep.open(w, l);
    });
  }
};

/* ---------- Preparazione: scegli unicorno e fatina ---------- */
const Prep = {
  open(w, l) {
    const d = Store.data, W = WORLDS[w], L = W.levels[l];
    const ico = L.type === 'collect' ? W.item.e : L.type === 'boss' ? (w === 5 ? '👑' : '⛈️') : MISSION_ICON[L.type];
    const riders = ['mio', ...d.rescued];
    Modal.show(`<div class="prep">
      <div class="prep-ico">${ico}</div>
      <div class="prep-row riders">${riders.map(r => { const ri = riderInfo(r); return `<button class="pick ${String(d.ride) === String(r) ? 'on' : ''}" data-r="${r}">${unicornSVG(ri.look, { wings: true })}<i>${ri.icon}</i></button>`; }).join('')}</div>
      ${d.fairies.length ? `<div class="prep-row fairies">${d.fairies.map(f => `<button class="pick fairy ${d.fairy === f ? 'on' : ''}" data-f="${f}" style="--c:${FAIRIES[f].color}"><span>🧚</span><i>${FAIRIES[f].e}</i></button>`).join('')}</div>` : ''}
      <div class="modal-actions"><button class="round-btn" id="pr-x" aria-label="Chiudi">✖</button><button class="round-btn go" id="pr-go" aria-label="Parti">▶</button></div></div>`, 'prep-modal');
    say(briefing(w, l));
    $$('#modal .pick[data-r]').forEach(b => b.onclick = () => {
      d.ride = b.dataset.r === 'mio' ? 'mio' : +b.dataset.r; Store.save(); Sound.click();
      $$('#modal .pick[data-r]').forEach(x => x.classList.toggle('on', x === b));
      const ri = riderInfo(d.ride); say(ri.mine ? `${ri.name}! ${MY_POWER.say}` : RIDERS[d.ride].say);
    });
    $$('#modal .pick[data-f]').forEach(b => b.onclick = () => {
      const f = +b.dataset.f; d.fairy = f; Store.save(); Sound.chime();
      $$('#modal .pick[data-f]').forEach(x => x.classList.toggle('on', x === b));
      say(FAIRIES[f].say);
    });
    $('#pr-x').onclick = () => { Sound.click(); Modal.hide(); };
    $('#pr-go').onclick = () => { Sound.whoosh(); Modal.hide(); go('play', { w, l }); };
  }
};

/* ---------- Risultati ---------- */
Screens.result = {
  async enter(el, r) {
    this.el = el; const W = WORLDS[r.w];
    Music.play('mappa');
    el.innerHTML = `<div class="result" style="--c:${W.color}">
      <div class="res-stars">${[0, 1, 2].map(i => `<span class="rs" data-i="${i}">☆</span>`).join('')}</div>
      <div class="res-gems">+${r.gems} 💎</div>
      <div class="res-unlock"></div>
      <div class="modal-actions res-actions hidden">
        <button class="round-btn" data-a="retry" aria-label="Rigioca">🔁</button>
        <button class="round-btn" data-a="world" aria-label="Mondo">🗺️</button>
        ${r.l < 4 || r.w < 5 ? '<button class="round-btn go" data-a="next" aria-label="Prossima missione">▶</button>' : ''}
      </div></div>`;
    for (let i = 0; i < r.stars; i++) {
      await sleep(450); if (current !== 'result') return;
      const s = $(`.rs[data-i="${i}"]`, el); s.textContent = '⭐'; s.classList.add('pop');
      Sound.star(i * 3 + 2); const [x, y] = centerOf(s); FX.sparkle(x, y, 18);
    }
    await sleep(500);
    if (r.stars === 3) say('Tre stelle! Perfetto!'); else say(r.stars === 2 ? 'Due stelle! Bravissima!' : 'Una stella! Ce l\'hai fatta!');
    await sleep(1600);
    if (current !== 'result') return;
    const box = $('.res-unlock', el);
    if (r.newFairy !== null) {
      const f = FAIRIES[r.newFairy];
      box.innerHTML = `<div class="unlock-card" style="--c:${f.color}"><span class="uc-big">🧚</span><span class="uc-badge">${f.e}</span></div>`;
      Sound.magic(); FX.confetti();
      await new Promise(res => say(`Hai liberato una nuova amica: ${f.say} La trovi nel libro delle fatine.`, { onend: res }));
    }
    if (r.newRider !== null) {
      const u = RIDERS[r.newRider];
      box.innerHTML = `<div class="unlock-card rider" style="--c:${W.color}">${unicornSVG(u.look, { wings: true })}<span class="uc-badge">${u.icon}</span></div>`;
      Sound.win(); FX.confetti();
      await new Promise(res => say(`Hai salvato l'unicorno ${u.name}! ${u.say} Adesso vive nella tua scuderia!`, { onend: res }));
    }
    if (r.finale) { if (current === 'result') go('finale'); return; }
    if (current !== 'result') return;
    if (r.l === 4 && r.w < 5 && r.newRider !== null) say(`Si è aperto un nuovo mondo: ${WORLDS[r.w + 1].name}!`);
    $('.res-actions', el).classList.remove('hidden');
    $$('.res-actions button', el).forEach(b => b.onclick = () => {
      Sound.click();
      const a = b.dataset.a;
      if (a === 'retry') go('play', { w: r.w, l: r.l });
      else if (a === 'world') go('world', r.w);
      else if (r.l < 4) { go('world', r.w); Prep.open(r.w, r.l + 1); }
      else { go('world', r.w + 1); }
    });
  }
};

/* ---------- Gran finale ---------- */
Screens.finale = {
  enter(el) {
    Music.play('notte');
    const d = Store.data;
    if (!d.owned.includes('corona')) d.owned.push('corona');
    if (!d.unicorn.acc.includes('corona')) d.unicorn.acc.push('corona');
    Store.save();
    el.innerHTML = `<div class="finale"><div class="fin-crown">👑</div>
      <div class="fin-riders">${uniHTML(d.unicorn, 'flap')}${RIDERS.map(r => uniHTML(r.look, 'flap small')).join('')}</div>
      <div class="fin-fairies">${FAIRIES.map(f => `<span style="--c:${f.color}">🧚</span>`).join('')}</div>
      <button class="round-btn go" aria-label="Mappa">🗺️</button></div>`;
    let n = 0; this.fw = setInterval(() => { FX.burst(rand(60, innerWidth - 60), rand(80, innerHeight * 0.5), { n: 40, speed: 360, gravity: 160, life: 1.6 }); Sound.bell(NF(pick(['C6', 'E6', 'G6', 'C7'])), 0.8, 0.12); if (++n > 40) clearInterval(this.fw); }, 600);
    say('Ce l\'hai fatta Camilla! Il Re Nuvolone ha fatto pace con tutti, e ora nel Regno delle Fate ci sono di nuovo i colori! Tutti gli unicorni e le fatine sono liberi grazie a te. Da oggi sei la Regina degli Unicorni! Ecco la tua corona!', {
      onend: () => say('La mamma Martina, il babbo Daniele e la gattina Zsafragy sono fierissimi di te, e ti vogliono un mondo di bene!', { queue: true })
    });
    $('.go', el).onclick = () => { Sound.click(); go('map'); };
  },
  exit() { clearInterval(this.fw); }
};

/* ---------- Laboratorio: crea il tuo unicorno ---------- */
const LAB_TABS = [
  { id: 'name', icon: '🏷️', say: 'Scegli il nome del tuo unicorno' }, { id: 'body', icon: '🎨', say: 'Il colore' },
  { id: 'mane', icon: '💇', say: 'La criniera' }, { id: 'horn', icon: '🦄', say: 'Il corno magico' },
  { id: 'wing', icon: '🕊️', say: 'Le ali' }, { id: 'mark', icon: '⭐', say: 'Il simbolo magico' },
  { id: 'acc', icon: '👑', say: 'Gli accessori. Alcuni si comprano con i diamanti!' }
];
const ACC_SAY = { corona: 'La corona!', fiocco: 'Il fiocco!', occhiali: 'Gli occhiali a cuore!', collana: 'La collana!', fiore: 'Il fiore!', brillantini: 'I brillantini!' };
Screens.lab = {
  enter(el, arg = {}) {
    this.el = el; this.first = !!arg.first; this.tab = 'name';
    Music.play('mappa');
    el.innerHTML = topbar(this.first ? '' : '🗺️') + `<div class="lab">
      <div class="lab-preview"><div class="lab-uni"></div><div class="lab-name"></div>
        <div class="lab-btns"><button class="round-btn" data-a="rnd" aria-label="A caso">🎲</button><button class="round-btn go" data-a="ok" aria-label="Fatto">✔</button></div></div>
      <div class="lab-panel"><div class="lab-tabs">${LAB_TABS.map(t => `<button class="tab" data-t="${t.id}">${t.icon}</button>`).join('')}</div><div class="lab-opts"></div></div></div>`;
    bindTop(el, () => go('map'));
    $$('.tab', el).forEach(b => b.onclick = () => { Sound.click(); this.tab = b.dataset.t; say(LAB_TABS.find(t => t.id === this.tab).say); this.opts(); });
    $('[data-a=rnd]', el).onclick = () => this.random();
    $('[data-a=ok]', el).onclick = () => this.ok();
    this.render(); this.opts();
    say(this.first ? 'Crea il tuo unicorno! Prima scegli il suo nome. Tocca i nomi per sentirli!' : 'Il laboratorio magico! Fai diventare bellissimo il tuo unicorno.');
  },
  render(anim) {
    const u = Store.data.unicorn, box = $('.lab-uni', this.el);
    box.innerHTML = unicornSVG(u, { wings: true });
    $('.lab-name', this.el).textContent = u.name;
    if (anim) { box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop'); }
  },
  opts() {
    const u = Store.data.unicorn, t = this.tab, box = $('.lab-opts', this.el), d = Store.data;
    $$('.tab', this.el).forEach(b => b.classList.toggle('on', b.dataset.t === t));
    let items = [];
    const grad = c => `background:linear-gradient(135deg,${c.join(',')})`;
    if (t === 'name') items = UNI_NAMES.map(([n, e]) => ({ k: n, html: `<span>${e}</span><b>${n}</b>`, on: u.name === n, cls: 'name' }));
    if (t === 'body') items = Object.entries(UNI.body).map(([k, c]) => ({ k, style: `background:${c}`, on: u.body === k }));
    if (t === 'mane') items = Object.entries(UNI.mane).map(([k, c]) => ({ k, style: grad(c), on: u.mane === k }));
    if (t === 'horn') items = Object.entries(UNI.horn).map(([k, c]) => ({ k, style: c ? grad(c) : grad(RAINBOW), on: u.horn === k }));
    if (t === 'wing') items = Object.entries(UNI.wing).map(([k, c]) => ({ k, style: c ? `background:linear-gradient(135deg,#fff,${c})` : grad(RAINBOW), on: u.wing === k }));
    if (t === 'mark') items = Object.entries(UNI.marks).map(([k, e]) => ({ k, html: e, on: u.mark === k }));
    if (t === 'acc') items = Object.keys(SHOP).map(k => {
      const owned = d.owned.includes(k);
      return { k, html: `${UNI.accs[k]}${owned ? '' : `<i class="price">💎${SHOP[k]}</i>`}`, on: u.acc.includes(k), cls: owned ? '' : 'buy' };
    });
    box.className = 'lab-opts ' + (t === 'name' ? 'names' : '');
    box.innerHTML = items.map(i => `<button class="opt ${i.on ? 'on' : ''} ${i.cls || ''}" data-k="${i.k}" style="${i.style || ''}">${i.html || ''}</button>`).join('');
    $$('.opt', box).forEach(b => b.onclick = () => this.choose(b.dataset.k, b));
  },
  choose(k, btn) {
    const u = Store.data.unicorn, t = this.tab, d = Store.data;
    if (t === 'acc') {
      if (!d.owned.includes(k)) {
        if (d.gems < SHOP[k]) { Sound.softPop(); say(`Servono ${NUM_WORDS[SHOP[k]] || SHOP[k]} diamanti. Raccogline altri nelle missioni!`); return; }
        addGems(-SHOP[k]); d.owned.push(k); Sound.win(); say(`Hai comprato ${ACC_SAY[k].replace('!', '')}! Evviva!`);
      }
      const i = u.acc.indexOf(k);
      if (i >= 0) { u.acc.splice(i, 1); Sound.softPop(); } else { u.acc.push(k); say(ACC_SAY[k]); }
    } else {
      u[t] = k;
      if (t === 'name') say(k + '!', { pitch: 1.4 });
      else if (t !== 'mark') say(k.charAt(0).toUpperCase() + k.slice(1) + '!');
    }
    Store.save();
    Sound.bell(NF(pick(['C6', 'E6', 'G6', 'A6'])), 0.6, 0.2);
    const [x, y] = centerOf($('.lab-uni', this.el)); FX.sparkle(x, y, 14);
    this.render(true); this.opts();
  },
  random() {
    const u = Store.data.unicorn;
    u.body = pick(Object.keys(UNI.body)); u.mane = pick(Object.keys(UNI.mane)); u.horn = pick(Object.keys(UNI.horn));
    u.wing = pick(Object.keys(UNI.wing)); u.mark = pick(Object.keys(UNI.marks).slice(1));
    Store.save(); Sound.magic();
    const [x, y] = centerOf($('.lab-uni', this.el)); FX.burst(x, y, { n: 30 });
    say(pick(['Abracadabra!', 'Magia!', 'Bidibi bodibi bu!']));
    this.render(true); this.opts();
  },
  ok() {
    Sound.win(); FX.confetti();
    const first = !Store.data.created;
    Store.data.created = true; Store.save();
    go('map');
    if (first) {
      Famiglia.last = Date.now(); Famiglia.toast('Mamma, babbo e Zsafragy tifano per te!');
      say(`Che bello ${Store.data.unicorn.name}! Ora tu e ${Store.data.unicorn.name} siete pronte a partire. Tocca il Bosco delle Fate per la prima missione! La mamma Martina, il babbo Daniele e la gattina Zsafragy fanno il tifo per te!`);
    } else say(`${Store.data.unicorn.name} è bellissimo!`);
  }
};

/* ---------- Scuderia ---------- */
Screens.stable = {
  enter(el) {
    const d = Store.data;
    Music.play('mappa');
    const cards = [{ id: 'mio', ...riderInfo('mio') }, ...RIDERS.map(r => d.rescued.includes(r.id) ? { id: r.id, ...riderInfo(r.id) } : { id: r.id, locked: true })];
    el.innerHTML = topbar('🗺️') + `<div class="gallery">${cards.map(c => c.locked
      ? `<div class="card locked"><span class="lock-ico">${WORLDS[c.id].icon}</span><b>?</b></div>`
      : `<button class="card ${String(d.ride) === String(c.id) ? 'on' : ''}" data-r="${c.id}">${unicornSVG(c.look, { wings: true })}<span class="c-name">${c.name}</span><i class="c-pow">${c.icon}</i></button>`).join('')}</div>`;
    bindTop(el, () => go('map'));
    $$('.card[data-r]', el).forEach(b => b.onclick = () => {
      d.ride = b.dataset.r === 'mio' ? 'mio' : +b.dataset.r; Store.save();
      $$('.card[data-r]', el).forEach(x => x.classList.toggle('on', x === b));
      Sound.chime(); const [x, y] = centerOf(b); FX.sparkle(x, y, 14);
      const ri = riderInfo(d.ride); say(ri.mine ? `${ri.name}, il tuo unicorno! ${MY_POWER.say}` : RIDERS[d.ride].say + ` Volerai con ${ri.name}!`);
    });
    $$('.card.locked', el).forEach(b => b.onclick = () => { Sound.softPop(); say('Questo unicorno è ancora prigioniero del Nuvolone. Liberalo nelle missioni!'); });
    say(d.rescued.length ? 'La tua scuderia! Tocca un unicorno per volare con lui.' : 'La tua scuderia! Per ora c\'è solo il tuo unicorno. Salva gli altri dal Nuvolone!');
  }
};

/* ---------- Libro delle fatine ---------- */
Screens.book = {
  enter(el) {
    const d = Store.data;
    Music.play('mappa');
    el.innerHTML = topbar('🗺️') + `<div class="gallery book">${FAIRIES.map(f => d.fairies.includes(f.id)
      ? `<button class="card fairy ${d.fairy === f.id ? 'on' : ''}" data-f="${f.id}" style="--c:${f.color}"><span class="f-big">🧚</span><i class="c-pow">${f.e}</i></button>`
      : `<div class="card locked"><span class="lock-ico">${WORLDS[f.id].icon}</span><b>?</b></div>`).join('')}</div>`;
    bindTop(el, () => go('map'));
    $$('.card[data-f]', el).forEach(b => b.onclick = () => {
      const f = +b.dataset.f; d.fairy = f; Store.save();
      $$('.card[data-f]', el).forEach(x => x.classList.toggle('on', x === b));
      Sound.magic(); const [x, y] = centerOf(b); FX.sparkle(x, y, 18);
      say(FAIRIES[f].say + ' Tocca il suo bottone mentre voli!');
    });
    $$('.card.locked', el).forEach(b => b.onclick = () => { Sound.softPop(); say('Questa fatina è ancora chiusa in una bolla. Liberala nelle missioni!'); });
    say(d.fairies.length ? 'Il libro delle fatine! Scegli la fatina che vola con te.' : 'Il libro delle fatine è ancora vuoto. Fai le missioni per liberarle!');
  }
};

/* ---------- Area genitori ---------- */
const Parent = {
  open() {
    Sound.click();
    const a = randi(4, 9), b = randi(3, 9);
    Modal.show(`<div class="modal-title">Area genitori</div><p class="pp">Quanto fa ${a} × ${b}?</p>
      <input id="pp-ans" type="number" inputmode="numeric" class="pp-in">
      <div class="modal-actions"><button class="round-btn" id="pp-no">✖</button><button class="round-btn" id="pp-ok">✔</button></div>`, 'parent');
    $('#pp-no').onclick = () => Modal.hide();
    $('#pp-ok').onclick = () => { if (+$('#pp-ans').value === a * b) this.panel(); else { Sound.softPop(); Modal.hide(); } };
    $('#pp-ans').focus();
  },
  panel() {
    const d = Store.data;
    let tot = 0; WORLDS.forEach((_, w) => tot += worldStars(w));
    Modal.show(`<div class="modal-title">Area genitori</div>
      <label class="pp-row"><input type="checkbox" id="pp-voice" ${d.voice ? 'checked' : ''}> Voce narrante</label>
      <label class="pp-row"><input type="checkbox" id="pp-music" ${d.music ? 'checked' : ''}> Musica</label>
      <p class="pp-small">⭐ ${tot}/90 stelle · 💎 ${d.gems} · 🦄 ${d.rescued.length}/6 unicorni · 🧚 ${d.fairies.length}/6 fatine</p>
      <div class="modal-actions"><button class="text-btn danger" id="pp-reset">Ricomincia da zero</button><button class="text-btn" id="pp-save">Salva</button></div>`, 'parent');
    $('#pp-save').onclick = () => {
      d.voice = $('#pp-voice').checked; d.music = $('#pp-music').checked; Store.save();
      d.music ? Music.start() : Music.stop(); Modal.hide();
    };
    $('#pp-reset').onclick = () => {
      const b = $('#pp-reset');
      if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Sicuro? Tocca ancora'; return; }
      try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
      location.reload();
    };
  }
};
