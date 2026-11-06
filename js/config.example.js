// Plantilla de configuración web de Firebase.
//
// Uso local: copia este archivo como js/config.js y reemplaza los valores con los de
// Consola de Firebase → Configuración del proyecto → Tus apps → Web.
// js/config.js está en .gitignore: nunca se sube al repositorio.
//
// En GitHub Pages, js/config.js lo genera el workflow .github/workflows/deploy.yml
// a partir de los secrets del repositorio (Settings → Secrets and variables → Actions).
export const firebaseConfig = {
  apiKey: 'TU_API_KEY',
  authDomain: 'TU-PROYECTO.firebaseapp.com',
  databaseURL: 'https://TU-PROYECTO-default-rtdb.firebaseio.com',
  projectId: 'TU-PROYECTO',
  storageBucket: 'TU-PROYECTO.firebasestorage.app',
  messagingSenderId: 'TU_SENDER_ID',
  appId: 'TU_APP_ID',
};
