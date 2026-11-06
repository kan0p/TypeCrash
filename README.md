# TypeCrash

**Carreras de tecleo multijugador en tiempo real.** Cada jugador conduce un vehículo por una carretera del desierto, y lo único que lo hace avanzar son sus dedos. Escribe bien y aceleras; equivócate y chocas.

TypeCrash convierte la práctica de mecanografía en una competencia en vivo. Todos corren en la misma pista, proyectada en una pantalla compartida, mientras cada participante escribe desde su propio computador. La partida está pensada para que nadie se quede atrás por frustración: los errores cuestan, pero nunca detienen la carrera.

**Jugar ahora:** [kan0p.github.io/TypeCrash](https://kan0p.github.io/TypeCrash/) · Pantalla principal (anfitrión): [kan0p.github.io/TypeCrash/host.html](https://kan0p.github.io/TypeCrash/host.html)

---

## La idea

Mejorar la velocidad y la precisión al escribir requiere repetición, y la repetición aburre. TypeCrash le pone algo en juego a cada tecla:

- **Ves tu progreso.** Tu vehículo avanza con cada carácter correcto, frente a todos.
- **Cada error se nota.** Aparece un cono, un bache o una mancha de aceite, tu vehículo choca y pierde terreno.
- **Hay suspenso.** Durante la carrera nadie ve puntajes, solo posiciones en la pista. El resultado se revela al final, en un podio.
- **Siempre hay revancha.** Una nueva ronda con frases nuevas está a un clic.

## Cómo se juega

1. **El anfitrión abre una sala.** Elige la duración, el texto y la cantidad de frases, y obtiene un código de 5 números.
2. **Los jugadores se unen.** Entran desde su computador con el código, escriben su nombre y eligen un vehículo en el garaje.
3. **Cuenta regresiva.** 3, 2, 1… la escena se imprime capa por capa, y en «¡YA!» todos salen a la vez.
4. **A escribir.** Cada jugador ve la frase actual en grande. Cada tecla consume un carácter: si es correcta, avanza; si no, queda marcada en rojo y el cursor sigue igual. **No se puede borrar** y pegar está bloqueado.
5. **Contra el reloj.** Cada frase tiene un tiempo proporcional a su largo. Si se agota, la frase se cierra y pasas a la siguiente.
6. **Podio.** Al terminar el tiempo se revelan el 3.º, el 2.º y el 1.º lugar, seguidos de la tabla de los 10 mejores.

### Puntaje

| Acción | Puntos |
|---|---|
| Carácter correcto | **+10** |
| Error | **−5** |
| Terminar una frase antes de su límite | **+1 por cada décima de segundo sobrante** |

El puntaje de una frase nunca baja de cero. Gana quien suma más puntos; si hay empate, gana quien cometió menos errores y luego quien terminó primero. El bono por velocidad hace que los empates exactos sean prácticamente imposibles.

### Posición en la pista

Lo que avanza tu vehículo depende de lo bien que escribes:

```
avance = (correctos − 0,5 × errores) / total de caracteres de la carrera
(terminar todas las frases = llegar a la meta)
```

Escribir rápido pero mal no sirve: cada error te devuelve medio carácter.

## Características

- **Hasta 50 jugadores por sala**, en una pista o en dos pistas paralelas.
- **Tres niveles de dificultad**: solo minúsculas; luego mayúsculas, tildes y ñ; y al final puntuación, números y signos `¿? ¡!`.
- **Texto propio**: el anfitrión puede escribir sus propias frases (una por línea), ajustarlas a un nivel y guardarlas para reutilizarlas.
- **Teclado en español de verdad**: las tildes con tecla muerta (´ + a = á) funcionan como en cualquier editor.
- **24 vehículos originales en 6 colores** (144 combinaciones):
  - Deportivos: superdeportivo, muscle car, rally, fórmula, descapotable y auto de carrera.
  - Extrafalarios: carrito de supermercado con turbo, sofá veloz, tina rodante, completo, cohete, zapatilla, tostadora, monster truck y auto burbuja.
  - Del taller: camioneta, camión tolva, bus, moto, grúa, tractor, jeep, furgón y retroexcavadora.
- **Animación fluida** con parallax del desierto, ruedas que giran, choques con humo y anticipación en la partida.
- **Música y efectos en la pantalla principal**, cada uno con su volumen y su silencio en el panel **Audio**:
  - **Música:** una pista de ambiente en el lobby y los resultados, y otra durante la carrera, con fundido entre ambas.
  - **Efectos:** sintetizados en el navegador (cuenta regresiva, un motor que sigue el ritmo de la carrera, choques, bocina final, redoble y fanfarria).
  - Los computadores de los jugadores quedan en silencio.
- **Accesible**: los errores se marcan con subrayado y tachado, no solo con color, y se respeta la preferencia de reducir movimiento.
- **Sin cuentas**: nadie se registra. Basta con un enlace, un código y un nombre.

## Modos extra

| URL | Para qué sirve |
|---|---|
| `index.html?practica` | Práctica en solitario, sin sala. Admite `?practica=2` o `?practica=3` para elegir el nivel. |
| `index.html?sala=12345` | Enlace directo con el código de sala ya escrito. |
| `host.html?demo=40` | Simula 40 jugadores sin conexión: sirve para ver la pista llena o medir el rendimiento de un equipo. |

En la pantalla del anfitrión, la tecla **F** activa la pantalla completa.

---

## Tecnología

TypeCrash es un sitio estático: no hay servidor propio ni paso de compilación, y funciona con costo cero.

| Pieza | Uso |
|---|---|
| HTML, CSS y JavaScript (ES modules) | Interfaz, motor de tecleo y lógica de juego |
| [Firebase Realtime Database](https://firebase.google.com/docs/database) | Salas, jugadores y avance en tiempo real (plan gratuito Spark) |
| Firebase Anonymous Auth | Identidad temporal sin registro |
| [GSAP 3](https://gsap.com) | Animación de vehículos, choques, cuenta regresiva y podio |
| Web Audio API y HTML Audio | Efectos generados en el navegador y música en bucle (`assets/audio/`) |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Celebración del primer lugar |
| Big Shoulders y Atkinson Hyperlegible | Tipografías bajo licencia SIL OFL, incluidas en el repositorio |
| GitHub Pages | Publicación |

### Arquitectura

```
index.html                 pantalla del jugador
host.html                  pantalla principal (anfitrión)
css/                       base.css (tokens y escena), player.css, host.css
js/config.example.js       plantilla de la configuración web de Firebase (js/config.js no se versiona)
.github/workflows/         deploy a GitHub Pages: genera js/config.js desde los secrets
js/firebase.js             app, autenticación anónima, reloj del servidor
js/core/                   lógica pura y testeada: puntaje, motor de tecleo, tiempos, textos
js/data/phrase-bank.js     banco de frases por nivel
js/player/                 ingreso, garaje y carrera del jugador
js/host/                   configuración, lobby, pista, sonido, resultados y simulador
js/shared/                 vehículos SVG, escena del desierto, utilidades
database.rules.json        reglas de seguridad de la base de datos
tests/                     pruebas con node --test
```

- **Tiempo sincronizado**: todos los relojes se alinean con la hora del servidor, así que la cuenta regresiva y el fin de la carrera son iguales para todos.
- **Tráfico liviano**: cada jugador envía su avance como máximo 4 veces por segundo. La pantalla principal se suscribe una sola vez a la lista de jugadores y anima todo localmente.
- **Reglas que se hacen cumplir en la base de datos**:
  - Solo quien creó la sala puede iniciarla, configurarla o sacar jugadores, y cada jugador solo puede escribir su propio estado.
  - El cupo máximo de 50 y los nombres únicos se reservan en la misma escritura que crea al jugador. Si el cupo o el nombre ya están tomados, la base rechaza la escritura completa.
  - Nadie puede unirse a una carrera ya iniciada.
- **Limpieza automática**: al crear una sala nueva se borran las salas propias de más de 24 horas.

> El puntaje se calcula en el navegador de cada jugador. Es un juego, no un examen certificado.

---

## Puesta en marcha

Necesitas una cuenta de Google (para Firebase), una de GitHub y [Node.js](https://nodejs.org) 18 o superior en tu computador. Los jugadores no instalan nada: solo abren una página web.

### 1. Crear el proyecto en Firebase

1. En <https://console.firebase.google.com> crea un proyecto en el plan **Spark** (gratuito).
2. **Authentication → Comenzar → Método de acceso → Anónimo → Habilitar.**
3. **Realtime Database → Crear base de datos.** Elige una ubicación y parte en **modo bloqueado**.

### 2. Configurar la app web

En **Configuración del proyecto → Tus apps → Web**, registra una app y anota los valores de su `firebaseConfig`. Revisa que incluya `databaseURL`.

El repositorio no incluye `js/config.js`: cada quien usa su propio proyecto de Firebase.

- **Local:** copia `js/config.example.js` como `js/config.js` y pon tus valores. Ese archivo está en `.gitignore`.
- **GitHub Pages:** en **Settings → Secrets and variables → Actions → New repository secret** crea estos 7 secrets:

| Secret | Valor de `firebaseConfig` |
|---|---|
| `FIREBASE_API_KEY` | `apiKey` |
| `FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `FIREBASE_DATABASE_URL` | `databaseURL` |
| `FIREBASE_PROJECT_ID` | `projectId` |
| `FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `FIREBASE_APP_ID` | `appId` |

> La configuración web de Firebase termina siendo visible en el navegador de quien abre el juego. Lo que protege los datos son las reglas de `database.rules.json` y las restricciones de la API key (en Google Cloud, limítala al dominio de tu sitio).

### 3. Publicar las reglas de seguridad

```bash
npx firebase-tools login                                          # inicia sesión con Google (una vez)
npx firebase-tools deploy --only database --project TU-PROYECTO   # publica database.rules.json
```

`firebase-tools` es la herramienta oficial de Firebase para la terminal. `npx` la ejecuta sin instalarla, y `--only database` publica solo las reglas, sin tocar nada más del proyecto.

### 4. Publicar en GitHub Pages

1. Sube el repositorio a GitHub como **público**.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Cada push a `main` ejecuta el workflow `Deploy a GitHub Pages` (pestaña **Actions**), que genera `js/config.js` con los secrets y publica el sitio. También puedes lanzarlo a mano con **Run workflow**.
4. En un par de minutos el juego queda disponible en:
   - Jugadores: `https://TU-USUARIO.github.io/TypeCrash/`
   - Anfitrión: `https://TU-USUARIO.github.io/TypeCrash/host.html`

### 5. Autorizar el dominio

En Firebase: **Authentication → Configuración → Dominios autorizados → Agregar dominio** → `TU-USUARIO.github.io`.

### Desarrollo local

Primero crea `js/config.js` a partir de `js/config.example.js` (ver paso 2).

Los ES modules no se cargan si abres el archivo con doble clic (`file://`), así que hay que servir la carpeta:

```bash
npx http-server -c-1 -p 8080 .      # o bien: python3 -m http.server 8080
```

- Anfitrión: <http://localhost:8080/host.html>
- Jugadores: <http://localhost:8080/>

Para simular a varios jugadores en el mismo computador, usa un navegador distinto para cada uno. Las ventanas normales de un mismo navegador comparten la misma identidad, y las de incógnito también la comparten entre sí.

### Pruebas

```bash
node --test
```

Cubren el puntaje, el motor de tecleo (incluidas las tildes por composición y la normalización Unicode), el reparto del tiempo entre frases, el procesamiento de textos y el orden del ranking.

---

## Créditos

- Tipografías: [Big Shoulders](https://github.com/xotypeco/big_shoulders) y [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/), bajo licencia SIL Open Font License (ver `assets/fonts/`).
- Vehículos, escena e íconos: diseños originales de TypeCrash.
