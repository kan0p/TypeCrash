// Lobby: código de sala grande, jugadores que entran (con animación) y expulsión.
import { $, escapeHTML, gsap, prefersReducedMotion } from '../shared/dom.js';
import { vehicleSVG } from '../shared/vehicles.js';
import { formatClock } from '../core/timing.js';
import { LEVEL_LABELS } from '../data/phrase-bank.js';
import { sound } from './sound.js';

export const MAX_PLAYERS = 50;

const KICK_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>';

let onKickCb = null;
const rendered = new Map(); // uid → <li>

export function initLobby({ onKick }) {
  onKickCb = onKick;
  $('#lobby-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-kick]');
    if (!btn) return;
    const name = btn.dataset.name;
    if (window.confirm(`¿Sacar a «${name}» de la sala?`)) onKickCb?.(btn.dataset.kick);
  });
}

export function showLobbyRoom(code, config) {
  $('#lobby-code').textContent = code;
  $('#lobby-code').dataset.text = code;
  $('#lobby-code').classList.add('misprint');
  const what = config.source === 'bank'
    ? LEVEL_LABELS[config.level]
    : `Texto propio${config.level ? ` ajustado al nivel ${config.level}` : ''}`;
  const n = config.phrases.length;
  $('#lobby-summary').textContent = `${formatClock(config.durationSec)} · ${n} ${n === 1 ? 'frase' : 'frases'} · ${what}`;
}

/** Sincroniza la grilla con el mapa de jugadores (uid → datos). */
export function renderLobby(players) {
  const grid = $('#lobby-grid');
  const entries = [...players.entries()].sort((a, b) => (a[1].joinedAt || 0) - (b[1].joinedAt || 0));
  const fresh = [];

  for (const [uid, li] of rendered) {
    if (!players.has(uid)) {
      rendered.delete(uid);
      if (prefersReducedMotion()) li.remove();
      else gsap.to(li, { autoAlpha: 0, scale: 0.6, duration: 0.3, ease: 'power2.in', onComplete: () => li.remove() });
    }
  }

  for (const [uid, p] of entries) {
    let li = rendered.get(uid);
    const sig = `${p.name}|${p.vehicle?.type}|${p.vehicle?.color}`;
    if (li && li.dataset.sig === sig) continue;
    const html = `<div class="chip__car">${vehicleSVG(p.vehicle?.type, p.vehicle?.color)}</div>`
      + `<span class="chip__name${p.name.length > 10 ? ' is-long' : ''}">${escapeHTML(p.name)}</span>`
      + `<button type="button" class="chip__kick" data-kick="${escapeHTML(uid)}" data-name="${escapeHTML(p.name)}" aria-label="Sacar a ${escapeHTML(p.name)}">${KICK_ICON}</button>`;
    if (li) { li.innerHTML = html; li.dataset.sig = sig; continue; }
    li = document.createElement('li');
    li.className = 'chip';
    li.dataset.sig = sig;
    li.innerHTML = html;
    grid.append(li);
    rendered.set(uid, li);
    fresh.push(li);
  }

  if (fresh.length) sound.join();
  if (fresh.length && !prefersReducedMotion()) {
    gsap.from(fresh, {
      y: -60, scale: 0.4, autoAlpha: 0, duration: 0.7, ease: 'back.out(2.2)', stagger: 0.06, clearProps: 'transform',
    });
    for (const li of fresh) {
      gsap.fromTo(li.querySelectorAll('.wheel'), { rotation: 0, transformOrigin: '50% 50%' }, { rotation: 540, duration: 0.9, ease: 'power3.out' });
    }
  }

  const n = players.size;
  grid.style.setProperty('--cols', String(n <= 24 ? 8 : n <= 40 ? 10 : 12));
  $('#lobby-count').textContent = String(n);
  $('#lobby-empty').hidden = n > 0;
  $('#start-btn').disabled = n < 1;
}

export function resetLobby() {
  rendered.clear();
  $('#lobby-grid').innerHTML = '';
}
