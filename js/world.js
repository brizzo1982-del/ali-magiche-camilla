'use strict';
/* ============ Disegno dei mondi (sfondi a strati), del Nuvolone e degli oggetti ============ */
const RAINBOW = ['#ff6b9d', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#b197fc'];
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function puff(c, x, y, r) {
  c.beginPath();
  c.arc(x - r * 0.6, y + r * 0.1, r * 0.55, 0, 7); c.arc(x, y - r * 0.2, r * 0.7, 0, 7);
  c.arc(x + r * 0.65, y + r * 0.1, r * 0.5, 0, 7); c.arc(x, y + r * 0.25, r * 0.55, 0, 7);
  c.fill();
}
function skyGrad(c, W, H, a, b, stop = 1) {
  const g = c.createLinearGradient(0, 0, 0, H * stop); g.addColorStop(0, a); g.addColorStop(1, b);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function hills(c, W, H, base, amp, freq, off, col) {
  c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W + 20; x += 16) c.lineTo(x, base - Math.sin((x + off) * freq) * amp - Math.sin((x + off) * freq * 2.3 + 1) * amp * 0.45);
  c.lineTo(W, H); c.closePath(); c.fill();
}
function hillY(x, base, amp, freq, off) { return base - Math.sin((x + off) * freq) * amp - Math.sin((x + off) * freq * 2.3 + 1) * amp * 0.45; }
// esegue fn(x, i) per ogni "mattonella" di un livello che scorre con parallasse
function tiles(W, step, off, fn) {
  const first = Math.floor(off / step) - 1;
  for (let i = first; i * step - off < W + step; i++) fn(i * step - off, i);
}
function flower(c, x, y, r, col) {
  c.fillStyle = col;
  for (let i = 0; i < 5; i++) { const a = i * 1.2566; c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8, 0, 7); c.fill(); }
  c.fillStyle = '#ffd43b'; c.beginPath(); c.arc(x, y, r * 0.6, 0, 7); c.fill();
}
function glow(c, x, y, r, col) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
}

const SCENERY = {
  bosco(c, W, H, t, off, k) {
    skyGrad(c, W, H, '#a5d8ff', '#e6fcf5');
    glow(c, W * 0.8, H * 0.16, 130 * k, 'rgba(255,244,180,.9)');
    hills(c, W, H, H * 0.62, 40 * k, 0.003, off * 0.15, '#b2f2bb');
    tiles(W, 150 * k, off * 0.45, (x, i) => {
      const h = (90 + hash(i) * 90) * k, by = H * 0.8;
      c.fillStyle = '#8d6e63'; c.fillRect(x - 7 * k, by - h * 0.5, 14 * k, h * 0.55);
      const g = ['#2f9e44', '#40c057', '#37b24d'][((i % 3) + 3) % 3];
      c.fillStyle = g; c.beginPath();
      c.arc(x, by - h * 0.6, h * 0.32, 0, 7); c.arc(x - h * 0.22, by - h * 0.45, h * 0.24, 0, 7); c.arc(x + h * 0.22, by - h * 0.45, h * 0.24, 0, 7); c.fill();
      if (hash(i + 9) > 0.5) { c.fillStyle = '#ff6b9d'; c.beginPath(); c.arc(x + h * 0.1, by - h * 0.62, 5 * k, 0, 7); c.fill(); }
    });
    hills(c, W, H, H * 0.9, 18 * k, 0.006, off, '#69db7c');
    tiles(W, 95 * k, off, (x, i) => {
      const y = hillY(x, H * 0.9, 18 * k, 0.006, off) + 10 * k;
      if (hash(i) > 0.55) { // funghetto
        c.fillStyle = '#fff4e6'; c.fillRect(x - 5 * k, y - 16 * k, 10 * k, 16 * k);
        c.fillStyle = '#fa5252'; c.beginPath(); c.arc(x, y - 16 * k, 15 * k, Math.PI, 0); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 6 * k, y - 22 * k, 3 * k, 0, 7); c.arc(x + 5 * k, y - 20 * k, 2.5 * k, 0, 7); c.fill();
      } else flower(c, x, y, 5 * k, ['#ff8cc6', '#ffffff', '#b197fc', '#ffe066'][i & 3]);
    });
    for (let i = 0; i < 18; i++) { // lucciole
      const x = (hash(i) * W + Math.sin(t * 0.6 + i) * 40 - off * 0.2) % W, y = H * (0.25 + hash(i + 50) * 0.6) + Math.cos(t * 0.8 + i * 2) * 20;
      const xx = x < 0 ? x + W : x;
      glow(c, xx, y, 10 * k * (0.7 + 0.3 * Math.sin(t * 4 + i)), 'rgba(255,240,120,.9)');
    }
  },
  arcobaleno(c, W, H, t, off, k) {
    skyGrad(c, W, H, '#ffdeeb', '#fff9db');
    const cx = W * 0.65 - (off * 0.03) % (W * 0.2), cy = H * 0.95;
    c.lineWidth = 22 * k; c.globalAlpha = 0.55;
    RAINBOW.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(cx, cy, H * 0.75 - i * 22 * k, Math.PI, 0); c.stroke(); });
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,.9)';
    tiles(W, 260 * k, off * 0.25, (x, i) => puff(c, x, H * (0.12 + hash(i) * 0.25), (40 + hash(i + 3) * 30) * k));
    tiles(W, 180 * k, off * 0.35, (x, i) => {
      c.fillStyle = ['#ffc9c9', '#ffe8cc', '#fff3bf', '#d3f9d8', '#d0ebff', '#e5dbff'][((i % 6) + 6) % 6];
      c.beginPath(); c.arc(x, H * 0.92, (110 + hash(i) * 60) * k, Math.PI, 0); c.fill();
    });
    hills(c, W, H, H * 0.92, 14 * k, 0.007, off, '#8ce99a');
    tiles(W, 60 * k, off, (x, i) => flower(c, x, hillY(x, H * 0.92, 14 * k, 0.007, off) + 12 * k, 5 * k, RAINBOW[((i % 6) + 6) % 6]));
  },
  nuvole(c, W, H, t, off, k) {
    skyGrad(c, W, H, '#74c0fc', '#e7f5ff');
    glow(c, W * 0.15, H * 0.12, 120 * k, 'rgba(255,255,255,.9)');
    tiles(W, 420 * k, off * 0.12, (x, i) => { // castelli tra le nuvole
      if (hash(i) < 0.5) return;
      const by = H * 0.6; c.fillStyle = 'rgba(208,235,255,.95)';
      c.fillRect(x - 40 * k, by - 90 * k, 80 * k, 90 * k);
      for (const dx of [-40, 22]) { c.fillRect(x + dx * k, by - 130 * k, 18 * k, 130 * k); c.beginPath(); c.moveTo(x + (dx - 4) * k, by - 130 * k); c.lineTo(x + (dx + 9) * k, by - 160 * k); c.lineTo(x + (dx + 22) * k, by - 130 * k); c.fill(); }
      c.fillStyle = '#ffd43b'; c.fillRect(x - 6 * k, by - 50 * k, 12 * k, 18 * k);
      c.fillStyle = 'rgba(255,255,255,.95)'; puff(c, x, by, 70 * k);
    });
    c.fillStyle = 'rgba(255,255,255,.75)';
    tiles(W, 230 * k, off * 0.4, (x, i) => puff(c, x, H * (0.15 + hash(i + 7) * 0.4), (35 + hash(i) * 30) * k));
    c.fillStyle = '#ffffff';
    tiles(W, 110 * k, off, (x, i) => puff(c, x, H * 0.97 - hash(i) * 20 * k, (60 + hash(i + 1) * 30) * k));
  },
  mare(c, W, H, t, off, k) {
    skyGrad(c, W, H, '#99e9f2', '#fff0f6', 0.68);
    glow(c, W * 0.78, H * 0.2, 120 * k, 'rgba(255,236,153,.95)');
    c.fillStyle = 'rgba(255,255,255,.8)';
    tiles(W, 300 * k, off * 0.2, (x, i) => puff(c, x, H * (0.1 + hash(i) * 0.2), (35 + hash(i + 2) * 25) * k));
    const sea = H * 0.66;
    tiles(W, 520 * k, off * 0.25, (x, i) => { // isolette con palma
      if (hash(i) < 0.4) return;
      c.fillStyle = '#ffe8a3'; c.beginPath(); c.ellipse(x, sea + 4, 70 * k, 18 * k, 0, Math.PI, 0); c.fill();
      c.strokeStyle = '#8d6e63'; c.lineWidth = 6 * k; c.beginPath(); c.moveTo(x, sea - 10 * k); c.quadraticCurveTo(x + 10 * k, sea - 50 * k, x + 4 * k, sea - 80 * k); c.stroke();
      c.fillStyle = '#40c057'; for (let a = 0; a < 5; a++) { c.beginPath(); c.ellipse(x + 4 * k + Math.cos(a * 1.25) * 22 * k, sea - 82 * k + Math.sin(a * 1.25) * 8 * k, 26 * k, 8 * k, a * 1.25, 0, 7); c.fill(); }
    });
    const g = c.createLinearGradient(0, sea, 0, H); g.addColorStop(0, '#3bc9db'); g.addColorStop(1, '#1971c2');
    c.fillStyle = g; c.fillRect(0, sea, W, H - sea);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3 * k;
    for (let row = 0; row < 4; row++) {
      const y = sea + (12 + row * (H - sea) / 4) ; c.beginPath();
      for (let x = 0; x <= W + 10; x += 10) c.lineTo(x, y + Math.sin((x + off * (0.6 + row * 0.3)) * 0.03 + t * 2 + row) * 4 * k);
      c.stroke();
    }
    const jx = ((t * 120) % (W + 400)) - 200; // delfino che salta
    const ph = (t * 0.9) % 3;
    if (ph < 1.2) {
      const px = W - jx, py = sea - Math.sin(ph / 1.2 * Math.PI) * 70 * k;
      c.save(); c.translate(px, py); c.scale(-1, 1); c.rotate(-Math.cos(ph / 1.2 * Math.PI) * 0.6);
      c.font = `${44 * k}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🐬', 0, 0); c.restore();
    }
    for (let i = 0; i < 14; i++) { const x = (hash(i) * W - off * 0.5) % W; glow(c, x < 0 ? x + W : x, sea + hash(i + 4) * (H - sea), 6 * k * (0.5 + 0.5 * Math.sin(t * 3 + i)), 'rgba(255,255,255,.9)'); }
  },
  caramella(c, W, H, t, off, k) {
    skyGrad(c, W, H, '#fcc2d7', '#fff4e6');
    c.fillStyle = 'rgba(255,255,255,.85)';
    tiles(W, 280 * k, off * 0.15, (x, i) => puff(c, x, H * (0.1 + hash(i) * 0.2), (35 + hash(i + 5) * 25) * k));
    tiles(W, 240 * k, off * 0.3, (x, i) => { // montagne di caramella con la glassa
      const h = (180 + hash(i) * 120) * k, w = 150 * k, by = H * 0.85;
      c.fillStyle = ['#e599f7', '#ffa8a8', '#ffd8a8', '#a5d8ff', '#b2f2bb'][((i % 5) + 5) % 5];
      c.beginPath(); c.moveTo(x - w, by); c.quadraticCurveTo(x, by - h * 1.6, x + w, by); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - w * 0.42, by - h * 0.55);
      for (let j = 0; j <= 6; j++) c.lineTo(x - w * 0.42 + j * w * 0.14, by - h * 0.55 + (j % 2 ? 14 : 0) * k);
      c.quadraticCurveTo(x, by - h * 0.95, x - w * 0.42, by - h * 0.55); c.fill();
    });
    hills(c, W, H, H * 0.9, 14 * k, 0.006, off, '#faa2c1');
    tiles(W, 170 * k, off, (x, i) => { // alberi lecca lecca
      if (hash(i) < 0.35) return;
      const y = hillY(x, H * 0.9, 14 * k, 0.006, off) + 8 * k;
      c.fillStyle = '#fff'; c.fillRect(x - 3 * k, y - 70 * k, 6 * k, 70 * k);
      c.fillStyle = ['#ff6b6b', '#cc5de8', '#4dabf7', '#51cf66'][((i % 4) + 4) % 4]; c.beginPath(); c.arc(x, y - 82 * k, 22 * k, 0, 7); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 4 * k; c.beginPath();
      for (let a = 0; a < 12; a += 0.3) c.lineTo(x + Math.cos(a + t) * a * 1.7 * k, y - 82 * k + Math.sin(a + t) * a * 1.7 * k);
      c.stroke();
    });
  },
  castello(c, W, H, t, off, k) {
    skyGrad(c, W, H, '#1b1446', '#6741d9');
    for (let i = 0; i < 70; i++) {
      const x = hash(i) * W, y = hash(i + 100) * H * 0.75, s = (1 + hash(i + 7) * 2) * k;
      c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.5 + hash(i + 3)) + i)); c.fillStyle = '#fff';
      drawStar(c, x, y, s * 2, 4, 0.4); c.fill();
    }
    c.globalAlpha = 1;
    glow(c, W * 0.82, H * 0.18, 110 * k, 'rgba(255,243,191,.6)');
    c.fillStyle = '#fff3bf'; c.beginPath(); c.arc(W * 0.82, H * 0.18, 42 * k, 0, 7); c.fill();
    c.fillStyle = '#e9e3a5'; c.beginPath(); c.arc(W * 0.82 - 12 * k, H * 0.18 - 8 * k, 7 * k, 0, 7); c.arc(W * 0.82 + 14 * k, H * 0.18 + 10 * k, 5 * k, 0, 7); c.fill();
    tiles(W, 600 * k, off * 0.1, (x, i) => { // il castello del Re Nuvolone
      const by = H * 0.8; c.fillStyle = '#4c3a9a';
      c.fillRect(x - 90 * k, by - 120 * k, 180 * k, 120 * k);
      for (const [dx, hh] of [[-110, 190], [-20, 240], [70, 170]]) {
        c.fillRect(x + dx * k, by - hh * k, 40 * k, hh * k);
        c.beginPath(); c.moveTo(x + (dx - 8) * k, by - hh * k); c.lineTo(x + (dx + 20) * k, by - (hh + 50) * k); c.lineTo(x + (dx + 48) * k, by - hh * k); c.fill();
      }
      c.fillStyle = '#ffd43b';
      for (let j = 0; j < 6; j++) if (Math.sin(t * 0.7 + j + i) > -0.5) c.fillRect(x + (-80 + j * 28) * k, by - (70 + (j % 2) * 30) * k, 10 * k, 14 * k);
    });
    hills(c, W, H, H * 0.9, 16 * k, 0.006, off, '#3b2d7a');
    tiles(W, 80 * k, off, (x, i) => glow(c, x, hillY(x, H * 0.9, 16 * k, 0.006, off) + 14 * k, 9 * k, ['rgba(255,140,198,.9)', 'rgba(116,192,252,.9)', 'rgba(255,224,102,.9)'][((i % 3) + 3) % 3]));
  }
};

/* Il Nuvolone: mood 0 = arrabbiato, 1 = felice */
function drawBoss(c, x, y, r, mood, t, flash, king) {
  const g = Math.round(134 + (255 - 134) * mood);
  c.save(); c.translate(x, y);
  c.scale(1 + Math.sin(t * 3) * 0.03, 1 - Math.sin(t * 3) * 0.03);
  if (mood > 0.2) { c.globalAlpha = mood * 0.6; c.fillStyle = RAINBOW[Math.floor(t * 4) % 6]; puff(c, 0, 0, r * 1.12); c.globalAlpha = 1; }
  c.fillStyle = flash > 0 ? '#ffffff' : `rgb(${g},${g + (mood > 0.5 ? 0 : 6)},${Math.min(255, g + 14)})`;
  puff(c, 0, 0, r);
  if (king) { // corona del Re
    c.fillStyle = '#ffd43b'; c.beginPath(); c.moveTo(-r * 0.35, -r * 0.62);
    [[-0.3, -1.0], [-0.15, -0.75], [0, -1.08], [0.15, -0.75], [0.3, -1.0], [0.35, -0.62]].forEach(([a, b]) => c.lineTo(a * r, b * r)); c.closePath(); c.fill();
    c.fillStyle = '#ff6b9d'; c.beginPath(); c.arc(0, -r * 0.9, r * 0.06, 0, 7); c.fill();
  }
  const ex = r * 0.28, ey = -r * 0.08, er = r * 0.09;
  c.fillStyle = '#343a40';
  c.beginPath(); c.arc(-ex, ey, er, 0, 7); c.arc(ex, ey, er, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-ex + er * 0.35, ey - er * 0.35, er * 0.35, 0, 7); c.arc(ex + er * 0.35, ey - er * 0.35, er * 0.35, 0, 7); c.fill();
  c.strokeStyle = '#343a40'; c.lineWidth = r * 0.06; c.lineCap = 'round';
  const brow = (1 - mood) * 0.5; // sopracciglia arrabbiate
  c.beginPath(); c.moveTo(-ex - er * 1.4, ey - er * (2.2 - brow * 2)); c.lineTo(-ex + er * 1.2, ey - er * (2.2 + brow * 1.6));
  c.moveTo(ex + er * 1.4, ey - er * (2.2 - brow * 2)); c.lineTo(ex - er * 1.2, ey - er * (2.2 + brow * 1.6)); c.stroke();
  c.beginPath(); // bocca: da broncio a sorriso
  const smile = mood * 2 - 1;
  c.moveTo(-r * 0.2, r * 0.22); c.quadraticCurveTo(0, r * 0.22 + smile * r * 0.2, r * 0.2, r * 0.22); c.stroke();
  if (mood > 0.6) { c.fillStyle = 'rgba(255,140,180,.6)'; c.beginPath(); c.arc(-r * 0.45, r * 0.12, r * 0.09, 0, 7); c.arc(r * 0.45, r * 0.12, r * 0.09, 0, 7); c.fill(); }
  c.restore();
}

function drawStorm(c, x, y, r, t, k) {
  c.fillStyle = '#a5b1c2'; puff(c, x, y, r);
  c.fillStyle = '#495057';
  c.beginPath(); c.arc(x - r * 0.28, y - r * 0.05, r * 0.08, 0, 7); c.arc(x + r * 0.28, y - r * 0.05, r * 0.08, 0, 7); c.fill();
  c.strokeStyle = '#495057'; c.lineWidth = 2.5 * k; c.beginPath(); c.arc(x, y + r * 0.32, r * 0.16, Math.PI + 0.4, -0.4); c.stroke();
  if (Math.sin(t * 5 + x * 0.01) > 0.7) { // fulmine
    c.fillStyle = '#ffd43b'; c.beginPath();
    c.moveTo(x, y + r * 0.5); c.lineTo(x - r * 0.15, y + r * 0.9); c.lineTo(x + r * 0.02, y + r * 0.9); c.lineTo(x - r * 0.1, y + r * 1.25); c.lineTo(x + r * 0.2, y + r * 0.78); c.lineTo(x + r * 0.02, y + r * 0.78); c.closePath(); c.fill();
  }
}

function drawBubble(c, x, y, r, col, t, ph = 0) {
  const sq = 1 + Math.sin(t * 4 + ph) * 0.04;
  c.save(); c.translate(x, y); c.scale(sq, 2 - sq);
  const gr = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(0.5, col + '55'); gr.addColorStop(1, col + 'cc');
  c.fillStyle = gr; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
  c.lineWidth = 3; c.strokeStyle = col; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(-r * 0.42, -r * 0.45, r * 0.18, r * 0.1, -0.7, 0, 7); c.fill();
  c.restore();
}
function emoji(c, e, x, y, size, rot = 0) {
  c.save(); c.translate(x, y); if (rot) c.rotate(rot);
  c.font = size + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e, 0, size * 0.04);
  c.restore();
}
