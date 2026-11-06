// Utilidades de DOM y animación compartidas.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHTML = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Marcas de aviso dibujadas (no glifos): alerta, error y retomar. */
const MARK_PATHS = {
  warn: '<path d="M10 2l9 16H1z" fill="currentColor"/><path d="M10 7.5v5M10 14.6v1.6" stroke="#eef0ec" stroke-width="2.2"/>',
  error: '<path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="3.2" stroke-linecap="square"/>',
  resume: '<path d="M15.5 6.5A7 7 0 1 0 17 11" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M11.5 2.5h6v6z" fill="currentColor"/>',
};
export const markSVG = (kind) => `<svg class="notice__mark" viewBox="0 0 20 20" aria-hidden="true">${MARK_PATHS[kind]}</svg>`;

/** GSAP y canvas-confetti se cargan por CDN como scripts clásicos. */
export const gsap = window.gsap;

/** true si el sistema pide reducir movimiento (se actualiza en vivo). */
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
export const prefersReducedMotion = () => reduceQuery.matches;

/**
 * Muestra una pantalla (section[data-screen]) y oculta las demás, con entrada animada.
 */
export function showScreen(name, root = document) {
  let shown = null;
  for (const el of $$('[data-screen]', root)) {
    const active = el.dataset.screen === name;
    el.hidden = !active;
    if (active) shown = el;
  }
  if (shown && gsap && !prefersReducedMotion()) {
    gsap.fromTo(shown, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', clearProps: 'transform,opacity,visibility' });
  }
  return shown;
}

/** Texto con desregistro: copia el contenido en data-text para el ::before. */
export function misprint(el, text) {
  el.textContent = text;
  el.dataset.text = text;
}

/** localStorage envuelto en try/catch (modo privado, almacenamiento bloqueado…). */
export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* sin almacenamiento */ }
  },
};

/** Limita llamadas a `fn` a una cada `ms`, garantizando la última. */
export function throttle(fn, ms) {
  let last = 0;
  let timer = null;
  let pendingArgs = null;
  const run = () => {
    clearTimeout(timer);
    timer = null;
    if (!pendingArgs) return;
    const args = pendingArgs;
    pendingArgs = null;
    last = Date.now();
    fn(...args);
  };
  const throttled = (...args) => {
    pendingArgs = args;
    const wait = ms - (Date.now() - last);
    if (wait <= 0) run();
    else if (!timer) timer = setTimeout(run, wait);
  };
  throttled.flush = () => { if (timer) run(); };
  throttled.cancel = () => { clearTimeout(timer); timer = null; pendingArgs = null; };
  return throttled;
}
