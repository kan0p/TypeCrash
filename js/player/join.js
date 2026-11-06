// Ingreso del jugador: código + nombre, elección de vehículo y alta en la sala.
import {
  db, ref, get, update, onDisconnect, serverTimestamp, friendlyError,
} from '../firebase.js';
import { $, $$, escapeHTML, storage } from '../shared/dom.js';
import { cleanPlayerName, nameKey } from '../core/texts.js';
import {
  VEHICLES, COLORS, vehicleSVG, vehicleById, colorById, assignVehicle,
} from '../shared/vehicles.js';

export const MAX_PLAYERS = 50;
const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8.5l4 4 8-9" fill="none" stroke="#16141a" stroke-width="2.6"/></svg>';

/** Revisa la sala antes de elegir vehículo. Devuelve { ok, room, existing, takenVehicles } o { ok:false, message }. */
export async function checkRoom(code, rawName, uid) {
  if (!/^[1-9][0-9]{4}$/.test(code)) return { ok: false, field: 'code', message: 'El código tiene 5 números. Míralo en la pantalla principal.' };
  const named = cleanPlayerName(rawName);
  if (!named.ok) return { ok: false, field: 'name', message: named.reason };

  let room;
  try {
    room = (await get(ref(db, `rooms/${code}`))).val();
  } catch (err) {
    return { ok: false, message: friendlyError(err) };
  }
  if (!room) return { ok: false, field: 'code', message: `No encontramos la sala ${code}. Revisa el código en la pantalla.` };

  const players = room.players || {};
  if (players[uid]) return { ok: true, room, existing: players[uid], name: named.name };

  if (room.status !== 'lobby') return { ok: false, message: 'La carrera ya comenzó. Espera a que el anfitrión abra la próxima ronda y vuelve a intentarlo.' };
  const key = nameKey(named.name);
  if (room.names?.[key] && room.names[key] !== uid) {
    return { ok: false, field: 'name', message: `Ya hay alguien llamado «${named.name}» en la sala. Agrega tu apellido o una inicial.` };
  }
  if (Object.keys(room.slots || {}).length >= MAX_PLAYERS) {
    return { ok: false, message: 'La sala está llena: ya hay 50 jugadores.' };
  }
  const takenVehicles = Object.values(players).map((p) => p.vehicle).filter(Boolean);
  return { ok: true, room, name: named.name, takenVehicles };
}

/** Alta atómica: cupo + nombre + jugador en una sola escritura. */
export async function joinRoom({ code, uid, name, vehicle }) {
  const key = nameKey(name);
  for (let attempt = 0; attempt < 4; attempt++) {
    const [slotsSnap, playersSnap, statusSnap] = await Promise.all([
      get(ref(db, `rooms/${code}/slots`)),
      get(ref(db, `rooms/${code}/players`)),
      get(ref(db, `rooms/${code}/status`)),
    ]);
    if (statusSnap.val() !== 'lobby') throw Object.assign(new Error('started'), { friendly: 'La carrera ya comenzó. Espera la próxima ronda.' });
    const slots = slotsSnap.val() || {};
    const free = Array.from({ length: MAX_PLAYERS }, (_, i) => i).filter((i) => !slots[i]);
    if (!free.length) throw Object.assign(new Error('full'), { friendly: 'La sala está llena: ya hay 50 jugadores.' });
    const taken = Object.values(playersSnap.val() || {}).map((p) => p.vehicle).filter(Boolean);
    const finalVehicle = assignVehicle(vehicle.type, vehicle.color, taken);
    const slot = free[Math.floor(Math.random() * Math.min(free.length, 3))];
    const roomRoot = ref(db, `rooms/${code}`);
    const player = { name, nameKey: key, slot, vehicle: finalVehicle, joinedAt: serverTimestamp(), round: 0 };
    try {
      await update(roomRoot, {
        [`slots/${slot}`]: uid,
        [`names/${key}`]: uid,
        [`players/${uid}`]: player,
      });
      // Si se cierra la pestaña en el lobby, se libera el cupo y el nombre.
      await Promise.all([
        onDisconnect(ref(db, `rooms/${code}/players/${uid}`)).remove(),
        onDisconnect(ref(db, `rooms/${code}/slots/${slot}`)).remove(),
        onDisconnect(ref(db, `rooms/${code}/names/${key}`)).remove(),
      ]);
      return { ...player, vehicle: finalVehicle };
    } catch (err) {
      const nameTaken = (await get(ref(db, `rooms/${code}/names/${key}`)).catch(() => null))?.val();
      if (nameTaken && nameTaken !== uid) {
        throw Object.assign(err, { friendly: `Alguien acaba de entrar como «${name}». Usa otro nombre.`, field: 'name' });
      }
      if (attempt === 3) throw Object.assign(err, { friendly: friendlyError(err) });
    }
  }
  return null;
}

/** Ya en carrera: si se cae la conexión, el jugador NO se borra (conserva su resultado). */
export function keepOnDisconnect(code, uid, player) {
  return Promise.all([
    onDisconnect(ref(db, `rooms/${code}/players/${uid}`)).cancel(),
    onDisconnect(ref(db, `rooms/${code}/slots/${player.slot}`)).cancel(),
    onDisconnect(ref(db, `rooms/${code}/names/${player.nameKey}`)).cancel(),
  ]).catch(() => {});
}

/** Salir voluntariamente desde la espera. */
export async function leaveRoom(code, uid, player) {
  await update(ref(db, `rooms/${code}`), {
    [`players/${uid}`]: null,
    [`slots/${player.slot}`]: null,
    [`names/${player.nameKey}`]: null,
  });
}

// ---------------------------------------------------------------------------
// Garaje (selector de vehículo)
// ---------------------------------------------------------------------------
export function renderGarage({ name, code, taken, onPick }) {
  // Un vehículo guardado de una versión anterior del catálogo se descarta.
  const saved = storage.get('typecrash.vehicle', null);
  const savedType = VEHICLES.some((v) => v.id === saved?.type) ? saved.type : VEHICLES[0].id;
  const savedColor = COLORS.some((c) => c.id === saved?.color) ? saved.color : COLORS[0].id;
  let choice = assignVehicle(savedType, savedColor, taken);

  $('#garage-who').textContent = `${name} · sala ${code}`;
  $('#garage-vehicles').innerHTML = VEHICLES.map((v) => `<label class="pick">
      <input type="radio" name="vehicle" value="${v.id}">
      ${vehicleSVG(v.id, 'sal', { title: v.label })}
      <span class="pick__label">${escapeHTML(v.label)}</span>
    </label>`).join('');
  $('#garage-colors').innerHTML = COLORS.map((c) => `<label class="swatch" title="${c.label}">
      <input type="radio" name="color" value="${c.id}">
      <span class="swatch__chip" style="--chip:${c.hex}">${CHECK}</span>
      <span class="swatch__name">${c.label}</span>
    </label>`).join('');

  const takenSet = new Set(taken.map((t) => `${t.type}:${t.color}`));
  const preview = () => {
    const v = vehicleById(choice.type);
    const c = colorById(choice.color);
    const busy = takenSet.has(`${choice.type}:${choice.color}`);
    $('#garage-preview').innerHTML = `${vehicleSVG(choice.type, choice.color)}<div class="garage__preview-road"></div>
      <p class="garage__preview-name">${escapeHTML(v.label)} ${escapeHTML(c.label.toLowerCase())}</p>
      ${busy ? '<p>Ya lo tiene otra persona: te daremos otro color al entrar.</p>' : ''}`;
    for (const input of $$('input[name="vehicle"]')) input.checked = input.value === choice.type;
    for (const input of $$('input[name="color"]')) input.checked = input.value === choice.color;
    // Los íconos del selector toman la tinta elegida
    for (const label of $$('#garage-vehicles .pick')) {
      const type = $('input', label).value;
      $('svg', label).outerHTML = vehicleSVG(type, choice.color, { title: vehicleById(type).label });
    }
    onPick(choice);
  };
  $('#garage-vehicles').onchange = (e) => { choice = { ...choice, type: e.target.value }; preview(); };
  $('#garage-colors').onchange = (e) => { choice = { ...choice, color: e.target.value }; preview(); };
  preview();
  return () => choice;
}
