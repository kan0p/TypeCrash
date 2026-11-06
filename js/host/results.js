// Resultados: podio animado (3.º, 2.º, 1.º) y tabla de los 10 mejores.
import { $, $$, escapeHTML, gsap, prefersReducedMotion } from '../shared/dom.js';
import { vehicleSVG, vehicleById, colorById } from '../shared/vehicles.js';
import { sound } from './sound.js';

const CONFETTI_COLORS = ['#f2b52a', '#e2457a', '#e9892b', '#eef0ec', '#4a6fe0', '#16a89d'];
let podiumTimeline = null;

function placeHTML(entry, place) {
  const v = vehicleById(entry.vehicle?.type);
  const c = colorById(entry.vehicle?.color);
  return `<div class="place place--${place}">
      <div class="place__car">${vehicleSVG(entry.vehicle?.type, entry.vehicle?.color)}</div>
      <div class="place__column"><span class="place__n display">${place}</span></div>
      <div class="place__caption">
        <p class="place__name">${escapeHTML(entry.name)}</p>
        <p class="place__veh">${escapeHTML(v.label)} · ${escapeHTML(c.label.toLowerCase())}</p>
      </div>
    </div>`;
}

function fireConfetti() {
  const confetti = window.confetti;
  if (!confetti || prefersReducedMotion()) return;
  const base = { colors: CONFETTI_COLORS, disableForReducedMotion: true, ticks: 260, scalar: 1.2 };
  confetti({ ...base, particleCount: 140, spread: 80, startVelocity: 55, origin: { x: 0.5, y: 0.55 } });
  setTimeout(() => confetti({ ...base, particleCount: 90, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } }), 250);
  setTimeout(() => confetti({ ...base, particleCount: 90, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } }), 400);
}

/** Podio: revela 3.º, 2.º y 1.º en ese orden. Devuelve una promesa al terminar. */
export function playPodium(ranked) {
  const stage = $('#podium-stage');
  const podium = $('#podium');
  const toTable = $('#to-table');
  $('#standings').hidden = true;
  podium.hidden = false;
  toTable.hidden = true;
  const top = ranked.slice(0, 3);
  stage.innerHTML = top.map((e, i) => placeHTML(e, i + 1)).join('');

  return new Promise((resolve) => {
    podiumTimeline?.kill();
    const done = () => { toTable.hidden = false; toTable.focus(); resolve(); };
    if (prefersReducedMotion()) { done(); return; }

    const tl = gsap.timeline({ onComplete: done });
    podiumTimeline = tl;
    tl.from('.podium__title', { y: -40, autoAlpha: 0, duration: 0.6, ease: 'back.out(2)' });
    const order = [3, 2, 1].filter((n) => n <= top.length);
    let at = 0.8;
    for (const n of order) {
      const place = $(`.place--${n}`, stage);
      const isFirst = n === 1;
      gsap.set($('.place__column', place), { scaleY: 0 });
      gsap.set([$('.place__car', place), $('.place__caption', place), $('.place__n', place)], { autoAlpha: 0 });
      if (isFirst) { tl.call(() => sound.drumroll(1.3), [], at); at += 1.4; } // redoble y suspenso
      else tl.call(() => sound.reveal(), [], at + 0.5);
      tl.to($('.place__column', place), { scaleY: 1, duration: isFirst ? 1.2 : 0.8, ease: 'back.out(1.3)' }, at)
        .fromTo($('.place__n', place), { autoAlpha: 0, scale: 2.2 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(3)' }, `>-0.2`)
        .fromTo($('.place__car', place), { autoAlpha: 0, y: -260 }, { autoAlpha: 1, y: 0, duration: 0.75, ease: 'bounce.out' }, '>-0.1')
        .fromTo($$('.place__car .wheel', place), { rotation: 0, transformOrigin: '50% 50%' }, { rotation: 360, duration: 0.75, ease: 'power2.out' }, '<')
        .fromTo($('.place__caption', place), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, '>-0.25');
      if (isFirst) tl.call(() => { fireConfetti(); sound.fanfare(); }, [], '<');
      at = tl.duration() + 0.5;
    }
  });
}

/** Tabla top 10 ordenada por puntaje. */
export function showStandings(ranked, { total, round }) {
  podiumTimeline?.kill();
  window.confetti?.reset();
  $('#podium').hidden = true;
  const standings = $('#standings');
  standings.hidden = false;
  $('#standings-meta').textContent = `${total} ${total === 1 ? 'jugador' : 'jugadores'} · ronda ${round}`;
  $('#standings-body').innerHTML = ranked.slice(0, 10).map((e) => `<tr>
      <td class="col-pos">${e.position}</td>
      <td class="col-veh">${vehicleSVG(e.vehicle?.type, e.vehicle?.color)}</td>
      <td class="col-name">${escapeHTML(e.name)}</td>
      <td class="col-score">${e.score.toLocaleString('es-CL')}</td>
      <td class="col-num">${e.errors}</td>
      <td class="col-num">${e.accuracy.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</td>
    </tr>`).join('');
  if (!prefersReducedMotion()) {
    gsap.from('#standings-body tr', { x: -50, autoAlpha: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07, clearProps: 'all' });
  }
  $('#rematch-btn').focus();
}
