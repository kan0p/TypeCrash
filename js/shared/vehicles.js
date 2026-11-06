// Catálogo de 24 vehículos originales: deportivos, extrafalarios y del taller (vista lateral, mirando a la derecha) × 6 tintas.
// Estilo serigrafía: tinta plana + contorno negro levemente desregistrado.
// Las ruedas son <g class="wheel"> separados para animar su giro.

export const INK = '#16141a';
export const PAPER = '#eef0ec';
const GLASS = '#a9c6e8';

export const COLORS = [
  { id: 'tomate', label: 'Tomate', hex: '#e8452f' },
  { id: 'maiz', label: 'Maíz', hex: '#f2b52a' },
  { id: 'cobalto', label: 'Cobalto', hex: '#4a6fe0' },
  { id: 'turquesa', label: 'Turquesa', hex: '#16a89d' },
  { id: 'magenta', label: 'Magenta', hex: '#d93d7e' },
  { id: 'sal', label: 'Sal', hex: PAPER },
];

/**
 * Cada vehículo: viewBox 0 0 120 64, suelo en y≈60, mirando a la derecha.
 * body = trazos en la tinta del jugador; ink = detalles negros; glass = vidrios;
 * paper = detalles en blanco papel; wheels = [cx, cy, r].
 * under = trazos de color fijo detrás de la carrocería; over = trazos de color fijo encima
 *   ({ d, fill } o { d, stroke, w } para líneas).
 * Todos son diseños propios: nada imita marcas, modelos reales ni personajes.
 */
const BREAD = '#e9a85a';
const SAUSAGE = '#b8432e';
const FLAME = '#f2b52a';

export const VEHICLES = [
  // ---- Deportivos ----
  {
    id: 'cuna', label: 'Superdeportivo',
    body: ['M4 46l2-8 24-4 20-10 28-2 26 10 12 6v10H4z', 'M3 32h15v4H3z'],
    glass: ['M54 26l22-1 16 7-44 1z'],
    ink: ['M64 36h20l-4 6H66z', 'M8 36h3v6H8z'],
    paper: ['M107 37l8 2v3l-8-1z'],
    wheels: [[26, 48, 10], [94, 48, 10]],
  },
  {
    id: 'muscle', label: 'Muscle car',
    body: ['M4 48V36q0-3 4-3l24-1 10-12h32l10 12 24 1q8 1 8 7v8z'],
    glass: ['M46 23h12v8H40zM62 23h10l8 8H62z'],
    ink: ['M90 27h13v6H90z', 'M59 21h2v27h-2z'],
    paper: ['M4 38h112v2.6H4z', 'M110 35h6v3h-6z'],
    wheels: [[26, 48, 11], [94, 48, 11]],
  },
  {
    id: 'rally', label: 'Rally',
    body: ['M6 48V32q0-4 4-4l14-2 12-12h44l16 14 14 2q6 1 6 6v12z', 'M3 22h17v4H3z'],
    glass: ['M40 18h18v9H32zM62 18h16l12 9H62z'],
    ink: ['M42 9h32v5H42z', 'M8 26h3v6H8z'],
    paper: ['M45 10h5v3h-5zM55.5 10h5v3h-5zM66 10h5v3h-5z', 'M66 38a6 6 0 1 0 12 0a6 6 0 1 0-12 0z'],
    wheels: [[28, 48, 10], [94, 48, 10]],
  },
  {
    id: 'formula', label: 'Fórmula',
    body: ['M14 40l26-4 14-6h16l6 6 34 4 4 6H14z', 'M98 44h20v4H98z', 'M2 20h18v7H2z'],
    glass: ['M57 28a7 7 0 1 0 14 0a7 7 0 1 0-14 0z'],
    ink: ['M8 27h4v14H8z', 'M60 27h11v3H60z'],
    paper: ['M80 40h14v2.5H80z'],
    wheels: [[24, 46, 12], [96, 46, 11]],
  },
  {
    id: 'descapotable', label: 'Descapotable',
    body: ['M4 48V38q0-4 4-4l36-1 8-5 6 5 50 1q8 1 8 7v7z'],
    glass: ['M60 33l6-11h3l-5 11z'],
    ink: ['M36 30L14 23l2 5 20 5z'],
    paper: ['M39 26a7 7 0 1 0 14 0a7 7 0 1 0-14 0z', 'M110 37h6v3h-6z'],
    wheels: [[26, 48, 10], [94, 48, 10]],
  },
  // ---- Extrafalarios ----
  {
    id: 'carrito', label: 'Carrito turbo',
    body: ['M22 14h84l-8 26H32z', 'M8 28h18v10H8z'],
    glass: [],
    ink: ['M36 16h2.5v24H36zM52 16h2.5v24H52zM68 16h2.5v24H68zM84 16h2.5v24H84z', 'M25 26h78v2.5H25z', 'M30 40h68v3H30z', 'M106 14l9-6 2 2.5-9 6z'],
    paper: [],
    over: [{ d: 'M8 28L1 33l7 5z', fill: FLAME }],
    wheels: [[38, 50, 6], [90, 50, 6]],
  },
  {
    id: 'sofa', label: 'Sofá veloz',
    body: ['M8 30h104v16H8z', 'M8 10h16v22H8z', 'M98 22h14v10H98z'],
    glass: [],
    ink: ['M24 29h74v2.5H24z', 'M14 46h4v4h-4zM102 46h4v4h-4z', 'M86 14l6 16h2.5l-6-16z'],
    paper: ['M80 10a6 6 0 1 0 12 0a6 6 0 1 0-12 0z'],
    wheels: [[26, 52, 7], [94, 52, 7]],
  },
  {
    id: 'tina', label: 'Tina rodante',
    body: ['M6 26h108q0 20-20 22H26Q6 46 6 26z'],
    glass: [],
    ink: ['M4 23h112v4H4z', 'M101 23V5H86v3h12v15z'],
    paper: ['M28 18a5 5 0 1 0 10 0a5 5 0 1 0-10 0zM42 15a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0-13 0zM58 19a4 4 0 1 0 8 0a4 4 0 1 0-8 0z', 'M84 10h4v2h-4zM86 14h3v2h-3z'],
    wheels: [[30, 51, 8], [90, 51, 8]],
  },
  {
    id: 'completo', label: 'Completo',
    body: ['M12 30q2 18 22 18h52q20 0 22-18z'],
    under: [{ d: 'M4 27q0-9 11-9h90q11 0 11 9t-11 9H15Q4 36 4 27z', fill: SAUSAGE }],
    glass: [],
    ink: [],
    paper: [],
    over: [
      { d: 'M18 20l8-4 8 4 8-4 8 4 8-4 8 4 8-4 8 4 8-4 8 4', stroke: FLAME, w: 3 },
      { d: 'M24 25a3 3 0 1 0 6 0a3 3 0 1 0-6 0zM50 25a3 3 0 1 0 6 0a3 3 0 1 0-6 0zM76 25a3 3 0 1 0 6 0a3 3 0 1 0-6 0z', fill: '#e8452f' },
    ],
    wheels: [[30, 51, 8], [90, 51, 8]],
  },
  {
    id: 'cohete', label: 'Cohete',
    body: ['M10 26h68q30 0 38 13-8 13-38 13H10z', 'M12 26L5 10h16l9 16z'],
    glass: ['M70 32a6 6 0 1 0 12 0a6 6 0 1 0-12 0z'],
    ink: ['M10 24h3v30h-3z', 'M44 26h2.5v26H44z'],
    paper: ['M110 37l6 2-6 3z'],
    over: [{ d: 'M10 30L1 39l9 9z', fill: FLAME }, { d: 'M10 34l-4 5 4 5z', fill: '#e8452f' }],
    wheels: [[32, 54, 6], [84, 54, 6]],
  },
  {
    id: 'zapatilla', label: 'Zapatilla',
    body: ['M8 44V24q0-8 10-8h26q6 0 10 6l16 8 34 4q12 2 12 10z'],
    glass: [],
    ink: ['M6 44h112v6H6z'],
    paper: ['M100 35q14 2 14 9h-14z', 'M18 22h14v4H18z'],
    over: [{ d: 'M50 22l8 4M56 19l8 5M62 23l8 4', stroke: '#eef0ec', w: 2.4 }],
    wheels: [[28, 53, 7], [92, 53, 7]],
  },
  {
    id: 'tostadora', label: 'Tostadora',
    body: ['M12 20q0-6 6-6h84q6 0 6 6v28H12z'],
    under: [{ d: 'M32 3h24v14H32zM62 1h24v16H62z', fill: BREAD }],
    glass: [],
    ink: ['M32 13h24v2.5H32zM62 13h24v2.5H62z', 'M108 25h8v4h-8z'],
    paper: ['M20 22h4v18h-4z'],
    over: [{ d: 'M36 6h16v8H36zM66 4h16v10H66z', fill: '#f6d9a4' }],
    wheels: [[32, 52, 8], [88, 52, 8]],
  },
  // ---- Taller (catálogo original) ----
  {
    id: 'camioneta', label: 'Camioneta',
    body: ['M6 46V36q0-3 3-3h49V22q0-4 4-4h22q4 0 7 4l9 11 10 2q4 1 4 5v6q0 4-4 4H10q-4 0-4-4z'],
    glass: ['M64 22h19l9 11H64z'],
    ink: ['M8 29h48v4H8z', 'M60 33h2v15h-2z'],
    paper: ['M109 38h5v3h-5z'],
    wheels: [[28, 50, 10], [92, 50, 10]],
  },
  {
    id: 'tolva', label: 'Camión tolva',
    body: ['M80 46V20q0-4 4-4h16q4 0 6 4l8 14v12z', 'M4 18l70-5 3 31H10z'],
    glass: ['M86 20h14l8 13H86z'],
    ink: ['M4 44h112v8H4z', 'M20 17l2 27h3l-2-27zM40 16l1 28h3l-1-28zM58 14l1 30h3l-1-30z'],
    paper: ['M110 38h4v4h-4z'],
    wheels: [[22, 52, 10], [45, 52, 10], [98, 52, 10]],
  },
  {
    id: 'bus', label: 'Bus',
    body: ['M4 18q0-6 6-6h96q6 0 8 6l2 6v28H4z'],
    glass: ['M10 18h14v12H10zM27 18h14v12H27zM44 18h14v12H44zM61 18h14v12H61zM78 18h14v12H78zM98 18h10l6 14H98z'],
    ink: ['M4 36h112v4H4z', 'M94 18h2v34h-2z'],
    paper: ['M110 42h6v4h-6z'],
    wheels: [[26, 52, 9], [92, 52, 9]],
  },
  {
    id: 'moto', label: 'Moto',
    body: ['M44 26q16-8 36-2l4 10-38 2z', 'M86 22l14-4 2 12-12 4z'],
    glass: [],
    ink: ['M24 49l24-17h32l15 17-4 2-13-14H50L27 52z', 'M34 28l16-2v6l-14 2z', 'M84 24l7-11h7v3h-5l-6 9z'],
    paper: ['M97 18a4 4 0 1 0 8 0a4 4 0 1 0-8 0z'],
    wheels: [[26, 50, 11], [94, 50, 11]],
  },
  {
    id: 'grua', label: 'Grúa',
    body: ['M74 50V22q0-4 4-4h18q4 0 7 4l9 12 2 16z', 'M6 38h70v12H6z', 'M12 38l6-4 36-26 4 3-36 27z'],
    glass: ['M80 22h16l9 11H80z'],
    ink: ['M55 10h2v20h-2z', 'M52 30h8v3q0 5-5 5h-1v-3h1q2 0 2-2h-5z'],
    paper: ['M84 13h9v5h-9z'],
    wheels: [[26, 52, 10], [92, 52, 10]],
  },
  {
    id: 'tractor', label: 'Tractor',
    body: ['M50 46V30l58 2q4 1 4 5v9z', 'M10 40q2-18 22-18t22 18h-6q-2-12-16-12T16 40z', 'M20 4h40v6H20z'],
    glass: ['M28 10h24v18H28z'],
    ink: ['M24 10h4v22h-4zM52 10h4v20h-4z', 'M78 14h4v18h-4z'],
    paper: ['M106 36h6v4h-6z'],
    wheels: [[32, 44, 18], [96, 52, 10]],
  },
  {
    id: 'jeep', label: 'Jeep',
    body: ['M8 48V30l22-2 6-12h50l2 12 20 2q4 1 4 6v12z'],
    glass: ['M40 20h18v8H38zM62 20h20l2 8H62z'],
    ink: ['M2 30a7 7 0 1 0 14 0a7 7 0 1 0-14 0z', 'M60 18h2v30h-2z', 'M104 34h2v8h-2zM100 34h2v8h-2z'],
    paper: ['M108 32h4v4h-4z'],
    wheels: [[30, 50, 10], [92, 50, 10]],
  },
  {
    id: 'furgon', label: 'Furgón',
    body: ['M6 48V14q0-4 4-4h74q6 0 10 6l16 16q4 2 4 6v10z'],
    glass: ['M88 16l16 16H88z', 'M66 16h18v14H66z'],
    ink: ['M6 38h108v3H6z', 'M62 14h2v34h-2z'],
    paper: ['M109 40h5v3h-5z'],
    wheels: [[26, 50, 10], [94, 50, 10]],
  },
  {
    id: 'retro', label: 'Retroexcavadora',
    body: ['M30 30h56v18H30z', 'M44 30V10h30l2 20z', 'M86 34l18 6 2 4-20-4z', 'M30 34L14 14l-4 2 16 22z', 'M14 14L4 30l4 2 10-16z'],
    glass: ['M48 14h24v14H48z'],
    ink: ['M100 40l18-2-2 14-14-2z', 'M2 30h8l-2 8-6-2z'],
    paper: ['M82 32h4v3h-4z'],
    wheels: [[42, 50, 12], [82, 52, 9]],
  },
  {
    id: 'carrera', label: 'Auto de carrera',
    body: ['M4 46l4-10 32-2 12-10h22l10 10 28 4q4 2 4 6v4H4z', 'M4 26h14v4h-8v6H6z'],
    glass: ['M54 27h18l6 7H50z'],
    ink: ['M30 40h60v3H30z'],
    paper: ['M59 41a5 5 0 1 0 10 0a5 5 0 1 0-10 0z'],
    wheels: [[24, 50, 10], [96, 50, 10]],
  },
  // ---- Dos más ----
  {
    id: 'monstruo', label: 'Monster truck',
    body: ['M18 30V20q0-3 3-3h42l8-11h22q4 0 6 4l6 10q4 1 4 5v5z'],
    glass: ['M74 9h18l6 10H70z'],
    ink: ['M16 30h92v4H16z', 'M34 34h6v8h-6zM84 34h6v8h-6z', 'M24 23h40v3H24z'],
    paper: ['M102 22h5v3h-5z'],
    wheels: [[30, 47, 15], [90, 47, 15]],
  },
  {
    id: 'burbuja', label: 'Auto burbuja',
    body: ['M26 46q-6 0-6-8 0-22 30-26h14q30 2 34 26 0 8-6 8z'],
    glass: ['M44 18h20q16 2 22 16H40q-4-12 4-16z'],
    ink: ['M64 18h2v28h-2z'],
    paper: ['M92 38a4 4 0 1 0 8 0a4 4 0 1 0-8 0z', 'M34 4a3 3 0 1 0 6 0a3 3 0 1 0-6 0z'],
    over: [{ d: 'M37 7v9', stroke: '#16141a', w: 2 }],
    wheels: [[40, 50, 8], [86, 50, 8]],
  },
];

export const vehicleById = (id) => VEHICLES.find((v) => v.id === id) || VEHICLES[0];
export const colorById = (id) => COLORS.find((c) => c.id === id) || COLORS[0];

function wheelSVG([cx, cy, r]) {
  const rim = r * 0.55;
  return '<g class="wheel">'
    + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${INK}"/>`
    + `<circle cx="${cx}" cy="${cy}" r="${rim}" fill="${PAPER}"/>`
    + `<path d="M${cx - rim} ${cy}h${rim * 2}M${cx} ${cy - rim}v${rim * 2}" stroke="${INK}" stroke-width="${Math.max(1.6, r * 0.18)}"/>`
    + `<circle cx="${cx}" cy="${cy}" r="${r * 0.18}" fill="${INK}"/>`
    + '</g>';
}

/**
 * SVG de un vehículo. El contorno negro va desplazado 1,5 px (desregistro de serigrafía).
 * @param {string} type id del vehículo
 * @param {string} color id de la tinta
 */
export function vehicleSVG(type, color, { className = 'vehicle-svg', title } = {}) {
  const v = vehicleById(type);
  const c = colorById(color);
  const paths = (list, fill) => list.map((d) => `<path d="${d}" fill="${fill}"/>`).join('');
  const fixed = (list = []) => list.map((p) => (p.stroke
    ? `<path d="${p.d}" fill="none" stroke="${p.stroke}" stroke-width="${p.w || 2}" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<path d="${p.d}" fill="${p.fill}"/>`)).join('');
  const keyline = v.body.map((d) => `<path d="${d}"/>`).join('');
  const label = title ?? `${v.label} ${c.label.toLowerCase()}`;
  return `<svg class="${className}" viewBox="0 0 120 64" role="img" aria-label="${label}">`
    + `<g class="body">${fixed(v.under)}${paths(v.body, c.hex)}${paths(v.glass, GLASS)}${paths(v.ink, INK)}${paths(v.paper, PAPER)}${fixed(v.over)}</g>`
    + `<g class="keyline" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round" transform="translate(-1.5 -1)">${keyline}</g>`
    + `<g class="wheels">${v.wheels.map(wheelSVG).join('')}</g>`
    + '</svg>';
}

/** Elige un color libre para el tipo pedido; si no hay, el primer par libre. */
export function assignVehicle(wantedType, wantedColor, taken) {
  const key = (t, c) => `${t}:${c}`;
  const used = new Set(taken.map((v) => key(v.type, v.color)));
  if (!used.has(key(wantedType, wantedColor))) return { type: wantedType, color: wantedColor };
  const freeColor = COLORS.find((c) => !used.has(key(wantedType, c.id)));
  if (freeColor) return { type: wantedType, color: freeColor.id };
  for (const v of VEHICLES) {
    for (const c of COLORS) if (!used.has(key(v.id, c.id))) return { type: v.id, color: c.id };
  }
  return { type: wantedType, color: wantedColor };
}

// ---- Obstáculos (aparecen frente al vehículo cuando el jugador se equivoca) ----
export const OBSTACLES = {
  cono: `<svg viewBox="0 0 40 40" class="obstacle-svg" aria-hidden="true"><path d="M4 36h32v4H4z" fill="${INK}"/><path d="M15 4h10l8 32H7z" fill="#f26b1d"/><path d="M12 16h16l2 7H10zM9 28h22l1 5H8z" fill="${PAPER}"/><path d="M15 4h10l8 32H7z" fill="none" stroke="${INK}" stroke-width="2" transform="translate(-1 -1)"/></svg>`,
  bache: `<svg viewBox="0 0 40 40" class="obstacle-svg" aria-hidden="true"><ellipse cx="20" cy="32" rx="18" ry="6" fill="#7a2e1f"/><ellipse cx="20" cy="31" rx="13" ry="3.5" fill="${INK}"/><path d="M4 29l5-3 3 3M30 27l5 1 2 3" stroke="${INK}" stroke-width="2" fill="none"/></svg>`,
  aceite: `<svg viewBox="0 0 40 40" class="obstacle-svg" aria-hidden="true"><path d="M3 32q2-6 10-5 3-4 9-2 7-3 12 1 5 2 3 6-2 5-10 4-5 3-12 1-10 1-12-5z" fill="${INK}"/><path d="M14 30q4-2 8 0" stroke="#4a6fe0" stroke-width="2" fill="none"/><path d="M24 31q3-1 6 0" stroke="#d93d7e" stroke-width="1.6" fill="none"/></svg>`,
};
export const OBSTACLE_KEYS = Object.keys(OBSTACLES);
