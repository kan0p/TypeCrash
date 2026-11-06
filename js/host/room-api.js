// Operaciones del anfitrión sobre Firebase Realtime Database.
import {
  db, ref, get, set, update, remove, serverTimestamp, onChildAdded, onChildChanged, onChildRemoved,
  signIn, serverNow, syncClock, watchConnection, friendlyError,
} from '../firebase.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Código de 5 dígitos que no empieza en 0 (sin ambigüedad al dictarlo). */
const randomCode = () => String(10000 + Math.floor(Math.random() * 90000));

export function createFirebaseBackend() {
  let uid = null;

  async function cleanupOldRooms() {
    const snap = await get(ref(db, `hostRooms/${uid}`));
    const list = snap.val() || {};
    const now = serverNow();
    const patch = {};
    const open = [];
    for (const [code, createdAt] of Object.entries(list)) {
      if (now - createdAt > DAY_MS) {
        patch[`rooms/${code}`] = null;
        patch[`hostRooms/${uid}/${code}`] = null;
      } else {
        open.push({ code, createdAt });
      }
    }
    if (Object.keys(patch).length) {
      // Se borran una por una: si una sala ya no existe o no es mía, no frena al resto.
      await Promise.allSettled(Object.keys(patch).map((path) => remove(ref(db, path))));
    }
    return open.sort((a, b) => b.createdAt - a.createdAt);
  }

  return {
    demo: false,
    get uid() { return uid; },

    async init() {
      uid = await signIn();
      await syncClock();
    },

    now: serverNow,
    onConnection: watchConnection,

    /** Borra salas propias de más de 24 h y devuelve la más reciente que siga abierta. */
    async findOpenRoom() {
      const open = await cleanupOldRooms();
      for (const { code } of open) {
        const snap = await get(ref(db, `rooms/${code}`));
        const room = snap.val();
        if (room && room.hostUid === uid) return { code, room };
        await remove(ref(db, `hostRooms/${uid}/${code}`)).catch(() => {});
      }
      return null;
    },

    async createRoom(data) {
      await cleanupOldRooms().catch(() => {});
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = randomCode();
        const existing = await get(ref(db, `rooms/${code}`)).catch(() => null);
        if (existing?.exists()) continue;
        try {
          await set(ref(db, `rooms/${code}`), { ...data, hostUid: uid, createdAt: serverTimestamp() });
          await set(ref(db, `hostRooms/${uid}/${code}`), serverNow());
          return code;
        } catch (err) {
          if (attempt === 7) throw Object.assign(err, { friendly: friendlyError(err) });
        }
      }
      throw Object.assign(new Error('No hay códigos libres'), { friendly: 'No se encontró un código libre. Inténtalo de nuevo.' });
    },

    /** Actualiza campos de la sala. null borra el campo. */
    async updateRoom(code, patch) {
      await update(ref(db, `rooms/${code}`), patch);
    },

    async removeRoom(code) {
      await remove(ref(db, `rooms/${code}`));
      await remove(ref(db, `hostRooms/${uid}/${code}`)).catch(() => {});
    },

    /** Saca a un jugador: libera su cupo y su nombre. */
    async kick(code, playerUid, player) {
      const patch = { [`players/${playerUid}`]: null };
      if (player?.slot != null) patch[`slots/${player.slot}`] = null;
      if (player?.nameKey) patch[`names/${player.nameKey}`] = null;
      await update(ref(db, `rooms/${code}`), patch);
    },

    /** Una sola suscripción a players: altas, cambios y bajas. */
    listenPlayers(code, { added, changed, removed }) {
      const playersRef = ref(db, `rooms/${code}/players`);
      const offs = [
        onChildAdded(playersRef, (s) => added(s.key, s.val())),
        onChildChanged(playersRef, (s) => changed(s.key, s.val())),
        onChildRemoved(playersRef, (s) => removed(s.key)),
      ];
      return () => offs.forEach((off) => off());
    },
  };
}
