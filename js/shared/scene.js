// Escena del desierto en capas de tinta plana: cielo en franjas, sol, tres cordones
// de cerros y una fila de postes. Cada capa se repite dos veces para hacer parallax infinito.

const HILLS = {
  far: 'M0 200 L0 120 Q60 80 130 98 T270 70 Q330 52 400 84 T540 64 Q610 40 690 78 T840 60 Q910 44 980 86 T1130 70 Q1200 50 1270 82 T1420 66 Q1500 52 1600 120 L1600 200 Z',
  mid: 'M0 200 L0 136 Q80 96 170 122 Q240 140 310 104 Q390 66 470 112 Q540 150 620 118 Q700 86 790 120 Q870 150 950 108 Q1030 70 1110 116 Q1190 152 1270 124 Q1350 96 1440 128 Q1520 150 1600 136 L1600 200 Z',
  near: 'M0 200 L0 160 Q100 136 200 156 Q290 172 380 148 Q470 126 560 152 Q650 176 740 154 Q830 132 920 158 Q1010 178 1100 150 Q1190 128 1280 156 Q1370 178 1460 152 Q1530 138 1600 160 L1600 200 Z',
};

/** Solo la cresta del cerro (sin los bordes laterales), para que el contorno no marque la unión. */
const ridge = (d) => d.replace(/^M0 200 L/, 'M').replace(/ L1600 200 Z$/, '');

function hillLayer(name, fill, keyline) {
  const svg = `<svg viewBox="0 0 1600 200" preserveAspectRatio="none" aria-hidden="true">`
    + `<path d="${HILLS[name]}" fill="${fill}"/>`
    + (keyline ? `<path d="${ridge(HILLS[name])}" fill="none" stroke="#16141a" stroke-width="2.5" transform="translate(-4 -3)" vector-effect="non-scaling-stroke"/>` : '')
    + '</svg>';
  return `<div class="scene__layer scene__layer--${name}" data-parallax="${name}"><div class="scene__strip">${svg}${svg}</div></div>`;
}

function postsLayer() {
  let posts = '';
  for (let i = 0; i < 4; i++) {
    const x = 120 + i * 400;
    posts += `<rect x="${x}" y="8" width="5" height="62" fill="#16141a"/>`
      + `<rect x="${x - 3}" y="66" width="11" height="4" fill="#16141a"/>`
      + `<rect x="${x - 14}" y="14" width="33" height="4" fill="#16141a"/>`
      + `<path d="M${x + 2} 16 Q${x + 202} 40 ${x + 402} 16" fill="none" stroke="#16141a" stroke-width="1.4"/>`;
  }
  const svg = `<svg viewBox="0 0 1600 70" preserveAspectRatio="none" aria-hidden="true">${posts}</svg>`;
  return `<div class="scene__layer scene__layer--posts" data-parallax="posts"><div class="scene__strip">${svg}${svg}</div></div>`;
}

/** HTML de la escena completa. Se inserta como fondo de un contenedor .scene */
export function sceneHTML({ posts = true } = {}) {
  return `<div class="scene__sky" aria-hidden="true">
      <span class="scene__band scene__band--1"></span>
      <span class="scene__band scene__band--2"></span>
      <span class="scene__band scene__band--3"></span>
      <span class="scene__band scene__band--4"></span>
      <span class="scene__sun"></span>
    </div>
    ${hillLayer('far', '#b5532a', false)}
    ${hillLayer('mid', '#e9892b', true)}
    ${hillLayer('near', '#7a2e1f', true)}
    ${posts ? postsLayer() : ''}`;
}

/** Duración (s) de una vuelta completa por capa: más cerca = más rápido. */
const SPEEDS = { far: 140, mid: 80, near: 46, posts: 22 };

/** Marcado de las líneas de la carretera. Se mueven igual que la capa de postes. */
export const ROAD_LINES_HTML = '<div class="road-lines" aria-hidden="true"><div class="road-lines__strip"></div></div>';

/**
 * Arranca el parallax con GSAP. Devuelve un controlador para acelerar/detener.
 * `roads`: contenedores con líneas de carretera (.road-lines__strip). Cada franja mide
 * el doble del ancho de la escena (--scene-w) y se desplaza -50 % en el mismo tiempo
 * que los postes: el suelo y los postes recorren la misma distancia por segundo.
 * @param {HTMLElement} root contenedor .scene
 */
export function startParallax(root, gsap, { reduced = false, roads = [] } = {}) {
  // Ancho real de la escena, también cuando se muestra después (parte oculta).
  const setWidth = () => { if (root.offsetWidth) root.style.setProperty('--scene-w', `${root.offsetWidth}px`); };
  setWidth();
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(setWidth) : null;
  resizeObserver?.observe(root);
  const strips = roads.flatMap((el) => [...el.querySelectorAll('.road-lines__strip')]);
  const roadTweens = strips.length
    ? [gsap.to(strips, { xPercent: -50, duration: SPEEDS.posts, ease: 'none', repeat: -1 })]
    : [];
  const tweens = [...root.querySelectorAll('[data-parallax]')].map((layer) => {
    const strip = layer.querySelector('.scene__strip');
    return gsap.to(strip, {
      xPercent: -50,
      duration: SPEEDS[layer.dataset.parallax] || 60,
      ease: 'none',
      repeat: -1,
    });
  }).concat(roadTweens);
  const setSpeed = (s, duration = 1.2) => tweens.forEach((t) => gsap.to(t, { timeScale: s, duration, ease: 'power2.out', overwrite: true }));
  if (reduced) tweens.forEach((t) => t.pause());
  return {
    setSpeed: (s, d) => { if (!reduced) setSpeed(s, d); },
    pause: () => tweens.forEach((t) => t.pause()),
    kill: () => { tweens.forEach((t) => t.kill()); resizeObserver?.disconnect(); },
  };
}
