// Inicialización de Firebase (app, autenticación anónima, Realtime Database)
// y helpers de la base de datos compartidos por anfitrión y jugador.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {
  getDatabase, ref, get, set, update, remove, onValue, off, serverTimestamp,
  onDisconnect, onChildAdded, onChildChanged, onChildRemoved,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js';
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getDatabase(app);

export {
  ref, get, set, update, remove, onValue, off, serverTimestamp, onDisconnect,
  onChildAdded, onChildChanged, onChildRemoved,
};

/** Inicia sesión anónima (nadie crea cuenta) y devuelve el uid. */
export function signIn() {
  return new Promise((resolve, reject) => {
    const stop = onAuthStateChanged(auth, (user) => {
      if (user) { stop(); resolve(user.uid); }
    }, reject);
    signInAnonymously(auth).catch((err) => { stop(); reject(err); });
  });
}

// ---- Reloj sincronizado con el servidor ----
let serverOffset = 0;
onValue(ref(db, '.info/serverTimeOffset'), (snap) => { serverOffset = snap.val() || 0; });

/** Hora actual estimada del servidor (ms). */
export function serverNow() {
  return Date.now() + serverOffset;
}

/** Espera a que llegue el primer offset (para no arrancar con reloj local). */
export function syncClock() {
  // Las rutas .info no admiten get(): se lee el primer valor con onValue.
  return new Promise((resolve) => {
    onValue(ref(db, '.info/serverTimeOffset'), (snap) => {
      serverOffset = snap.val() || 0;
      resolve();
    }, { onlyOnce: true });
  });
}

// ---- Conexión ----
export function watchConnection(callback) {
  return onValue(ref(db, '.info/connected'), (snap) => callback(Boolean(snap.val())));
}

// ---- Rutas ----
export const roomPath = (code) => `rooms/${code}`;
export const roomRef = (code, sub = '') => ref(db, sub ? `rooms/${code}/${sub}` : `rooms/${code}`);

/** Mensaje amable para errores de Firebase. */
export function friendlyError(err) {
  const code = err?.code || '';
  if (code.includes('PERMISSION_DENIED') || /permission/i.test(err?.message || '')) {
    return 'La sala no aceptó el cambio. Puede que la carrera ya haya comenzado o que la sala esté llena.';
  }
  if (code.includes('admin-restricted-operation') || code.includes('operation-not-allowed')) {
    return 'El inicio de sesión anónimo no está activado en Firebase (Authentication → Anónimo).';
  }
  if (code.includes('network') || code.includes('unavailable')) {
    return 'Sin conexión. Revisa internet e inténtalo de nuevo.';
  }
  return 'Algo falló al conectar con la sala. Inténtalo de nuevo.';
}
