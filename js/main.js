'use strict';
/* ============ Avvio ============ */
FX.init(); Voice.init(); Famiglia.start();
go('splash');
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('visibilitychange', () => {
  if (!Sound.ctx) return;
  if (document.hidden) {
    Music.stop(); if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (current === 'play' && Screens.play.state === 'play' && !Screens.play.paused) Screens.play.pause();
  } else if (Store.data.music && current !== 'splash') Music.start();
});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}
