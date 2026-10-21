'use strict';
/* ============ Il mondo del gioco: mondi, missioni, fatine, unicorni ============ */

// Le fatine che Camilla libera: ognuna ha una magia da usare in volo (tasto in basso a destra)
const FAIRIES = [
  { id: 0, name: 'Fata dei Fiori', e: '🌸', color: '#ff8cc6', power: 'magnete', dur: 7, say: 'La Fata dei Fiori! Con la sua magia tutte le cose da prendere volano verso di te!' },
  { id: 1, name: "Fata dell'Arcobaleno", e: '🌈', color: '#ffa94d', power: 'scudo', dur: 6, say: "La Fata dell'Arcobaleno! Ti fa uno scudo colorato e le nuvole cattive non ti fanno niente!" },
  { id: 2, name: 'Fata del Vento', e: '🍃', color: '#63e6be', power: 'lento', dur: 6, say: 'La Fata del Vento! Con un soffio magico tutto va più piano!' },
  { id: 3, name: "Fata dell'Acqua", e: '💧', color: '#4dabf7', power: 'onda', dur: 0, say: "La Fata dell'Acqua! Con un'onda magica trasforma le nuvole cattive in bolle di sapone!" },
  { id: 4, name: 'Fata dei Dolci', e: '🍭', color: '#f783ac', power: 'pioggia', dur: 0, say: 'La Fata dei Dolci! Fa piovere tante cose da raccogliere!' },
  { id: 5, name: 'Fata della Luna', e: '🌙', color: '#9775fa', power: 'cuore', dur: 0, say: 'La Fata della Luna! Ti regala un cuoricino quando sei stanca!' }
];

// Gli unicorni da liberare: ognuno ha un potere che funziona sempre mentre vola
const RIDERS = [
  { id: 0, name: 'Trifoglio', look: { body: 'menta', mane: 'menta', horn: 'oro', wing: 'menta', mark: 'fiore', acc: [] }, power: 'cuore', icon: '❤️', say: 'Trifoglio ha un cuoricino in più!' },
  { id: 1, name: 'Iride', look: { body: 'bianco', mane: 'arcobaleno', horn: 'arcobaleno', wing: 'arcobaleno', mark: 'arcobaleno', acc: [] }, power: 'calamita', icon: '🧲', say: 'Iride attira le cose da raccogliere!' },
  { id: 2, name: 'Nuvola', look: { body: 'azzurro', mane: 'azzurro', horn: 'argento', wing: 'bianco', mark: 'luna', acc: [] }, power: 'piano', icon: '🐢', say: 'Con Nuvola le nuvole cattive vanno più piano!' },
  { id: 3, name: 'Perla', look: { body: 'lilla', mane: 'viola', horn: 'cristallo', wing: 'azzurro', mark: 'stella', acc: ['collana'] }, power: 'bolla', icon: '🫧', say: 'Perla parte con una bolla magica che la protegge!' },
  { id: 4, name: 'Fragolina', look: { body: 'rosa', mane: 'fragola', horn: 'rosa', wing: 'rosa', mark: 'cuore', acc: ['fiocco'] }, power: 'doppio', icon: '💎', say: 'Fragolina trova il doppio dei diamanti!' },
  { id: 5, name: 'Luna', look: { body: 'lilla', mane: 'oro', horn: 'argento', wing: 'viola', mark: 'luna', acc: ['corona'] }, power: 'tutto', icon: '👑', say: 'Luna è la più magica: ha un cuore in più e attira le cose!' }
];
const MY_POWER = { icon: '✨', say: 'Il tuo unicorno! Con lui la magia delle fatine si ricarica più in fretta!' };

// Colori degli anelli, con il plurale per la voce
const RING_COLORS = {
  rosso: { c: '#ff4d4f', pl: 'rossi' }, giallo: { c: '#fcc419', pl: 'gialli' }, blu: { c: '#3b5bdb', pl: 'blu' },
  verde: { c: '#40c057', pl: 'verdi' }, viola: { c: '#9c36b5', pl: 'viola' }, arancione: { c: '#fd7e14', pl: 'arancioni' },
  rosa: { c: '#f06595', pl: 'rosa' }, azzurro: { c: '#4dabf7', pl: 'azzurri' }
};
const NUM_WORDS = ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove', 'venti'];
const LETTER_SAY = { A: 'A', B: 'Bi', C: 'Ci', D: 'Di', E: 'E', F: 'Effe', G: 'Gi', H: 'Acca', I: 'I', L: 'Elle', M: 'Emme', N: 'Enne', O: 'O', P: 'Pi', R: 'Erre', S: 'Esse', T: 'Ti', U: 'U', V: 'Vu', Z: 'Zeta' };

const WORLDS = [
  {
    name: 'Bosco delle Fate', icon: '🌳', theme: 'bosco', color: '#69db7c', item: { e: '🌸', one: 'fiore', many: 'fiori' },
    friends: ['🐰', '🦔', '🐿️'], boss: 'Nuvolone Brontolone',
    intro: 'Benvenuta nel Bosco delle Fate! Qui le fatine vivono tra gli alberi e i funghetti. Il Nuvolone Brontolone ha chiuso le fatine nelle bolle. Aiutiamole!',
    levels: [
      { type: 'collect', n: 6 }, { type: 'rescue', n: 3 }, { type: 'rings', n: 6, colors: ['rosso', 'giallo', 'blu'] },
      { type: 'numbers', max: 3, rounds: 4 }, { type: 'boss', hits: 3 }
    ]
  },
  {
    name: 'Valle Arcobaleno', icon: '🌈', theme: 'arcobaleno', color: '#ffa94d', item: { e: '🎨', one: 'goccia di colore', many: 'gocce di colore' },
    friends: ['🐻', '🦊', '🐨'], boss: 'Nuvolone Brontolone',
    intro: "Ecco la Valle Arcobaleno! Il Nuvolone ha rubato i colori dell'arcobaleno. Riportiamoli tutti!",
    levels: [
      { type: 'collect', n: 10 }, { type: 'letters', word: 'CAMILLA' }, { type: 'deliver', n: 3 },
      { type: 'rings', n: 8, colors: ['verde', 'arancione', 'viola', 'rosso'] }, { type: 'boss', hits: 3 }
    ]
  },
  {
    name: 'Regno delle Nuvole', icon: '☁️', theme: 'nuvole', color: '#74c0fc', item: { e: '⭐', one: 'stellina', many: 'stelline' },
    friends: ['🐦', '🦉', '🐥'], boss: 'Nuvolone Brontolone',
    intro: 'Siamo nel Regno delle Nuvole, sopra il cielo! Qui le nuvole sono morbide come lo zucchero filato. Attenta a quelle grigie!',
    levels: [
      { type: 'collect', n: 12 }, { type: 'rescue', n: 4 }, { type: 'numbers', max: 5, rounds: 5 },
      { type: 'deliver', n: 3 }, { type: 'boss', hits: 4 }
    ]
  },
  {
    name: 'Mare di Cristallo', icon: '🐬', theme: 'mare', color: '#3bc9db', item: { e: '🐚', one: 'conchiglia', many: 'conchiglie' },
    friends: ['🐢', '🐬', '🐙'], boss: 'Nuvolone Brontolone',
    intro: 'Che bello, il Mare di Cristallo! I delfini saltano tra le onde. Voliamo sopra il mare a cercare le conchiglie magiche!',
    levels: [
      { type: 'collect', n: 12 }, { type: 'letters', word: 'MAMMA' }, { type: 'rings', n: 9, colors: ['azzurro', 'rosa', 'giallo', 'verde'] },
      { type: 'rescue', n: 5 }, { type: 'boss', hits: 4 }
    ]
  },
  {
    name: 'Montagne di Caramella', icon: '🍭', theme: 'caramella', color: '#f783ac', item: { e: '🍬', one: 'caramella', many: 'caramelle' },
    friends: ['🐷', '🐹', '🐭'], boss: 'Nuvolone Brontolone',
    intro: 'Le Montagne di Caramella! Qui tutto è dolcissimo: alberi di lecca lecca e neve di zucchero!',
    levels: [
      { type: 'collect', n: 15 }, { type: 'numbers', max: 7, rounds: 6 }, { type: 'deliver', n: 4 },
      { type: 'letters', word: 'BABBO' }, { type: 'boss', hits: 5 }
    ]
  },
  {
    name: 'Castello delle Stelle', icon: '🏰', theme: 'castello', color: '#9775fa', item: { e: '🌟', one: 'stella cadente', many: 'stelle cadenti' },
    friends: ['🦉', '🐈', '🦄'], boss: 'Re Nuvolone',
    intro: 'Siamo arrivate al Castello delle Stelle, nel cielo della notte! Qui abita il Re Nuvolone. È la missione più grande di tutte!',
    levels: [
      { type: 'collect', n: 15 }, { type: 'letters', word: 'STELLA' }, { type: 'rescue', n: 5 },
      { type: 'numbers', max: 9, rounds: 6 }, { type: 'boss', hits: 6 }
    ]
  }
];

// Accessori da comprare con i diamanti nel laboratorio dell'unicorno
const SHOP = { brillantini: 0, fiocco: 10, fiore: 15, collana: 20, occhiali: 25, corona: 40 };
const UNI_NAMES = [
  ['Stellina', '⭐'], ['Lucina', '✨'], ['Perlina', '🫧'], ['Nuvoletta', '☁️'], ['Fragolina', '🍓'],
  ['Aurora', '🌅'], ['Margherita', '🌼'], ['Cometa', '☄️'], ['Zucchero', '🍬'], ['Arcobalena', '🌈']
];

const MISSION_ICON = { collect: null, rescue: '🧚', rings: '⭕', numbers: '🔢', letters: '🔤', deliver: '💌', boss: '⛈️' };

function levelKey(w, l) { return w + '-' + l; }
function starsOf(w, l) { return Store.data.stars[levelKey(w, l)] || 0; }
function levelOpen(w, l) {
  if (w === 0 && l === 0) return true;
  if (l > 0) return starsOf(w, l - 1) > 0;
  return starsOf(w - 1, 4) > 0;
}
function worldOpen(w) { return levelOpen(w, 0); }
function worldStars(w) { let s = 0; for (let l = 0; l < 5; l++) s += starsOf(w, l); return s; }

// Cosa dice la voce prima di partire
function briefing(w, l) {
  const W = WORLDS[w], L = W.levels[l];
  switch (L.type) {
    case 'collect': return `Missione: raccogli ${NUM_WORDS[L.n]} ${W.item.many}! Contiamo insieme!`;
    case 'rescue': return `Missione: ci sono ${NUM_WORDS[L.n]} fatine chiuse nelle bolle. Toccale con il tuo unicorno per liberarle!`;
    case 'rings': return `Missione: vola dentro gli anelli del colore giusto! Ascolta bene quale colore ti dico.`;
    case 'numbers': return `Missione dei numeri: io ti dico un numero e tu prendi la bolla con quel numero!`;
    case 'letters': return `Missione delle lettere: prendi le lettere una alla volta per scrivere ${L.word === 'CAMILLA' ? 'il tuo nome, Camilla' : 'la parola ' + L.word.toLowerCase()}!`;
    case 'deliver': return `Missione postino: prendi la lettera d'amore e portala agli amici che la aspettano!`;
    case 'boss': return `Missione grande! Il ${W.boss} è arrabbiato. Prendi un arcobaleno e poi vola contro di lui per farlo tornare buono! Attenta alle gocce di pioggia!`;
  }
}
