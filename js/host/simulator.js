// Modo demostración del anfitrión (host.html?demo=40).
// Simula jugadores que teclean, sin Firebase. Sirve para probar la pista y medir
// el rendimiento en un equipo antes de jugar.
import { VEHICLES, COLORS } from '../shared/vehicles.js';
import { phraseScore, accuracy, trackProgress } from '../core/scoring.js';

const NAMES = [
  'Camila', 'Benjamín', 'Sofía', 'Matías', 'Valentina', 'Joaquín', 'Isidora', 'Tomás', 'Antonia', 'Vicente',
  'Martina', 'Agustín', 'Florencia', 'Diego', 'Josefa', 'Lucas', 'Catalina', 'Cristóbal', 'Fernanda', 'Ignacio',
  'Javiera', 'Felipe', 'Constanza', 'Nicolás', 'Daniela', 'Sebastián', 'Francisca', 'Gabriel', 'Emilia', 'Maximiliano',
  'Trinidad', 'Bastián', 'Amanda', 'Alonso', 'Paz', 'Renato', 'Colomba', 'Gaspar', 'Rocío', 'Simón',
  'Ignacia', 'Facundo', 'Belén', 'Damián', 'Millaray', 'Elías', 'Ayelén', 'Bruno', 'Pía', 'Iñaki',
];

export function createDemoBackend(count = 24) {
  const n = Math.max(1, Math.min(50, count));
  const players = new Map();
  let handlers = null;
  let room = null;
  let timers = [];
  let sim = null;

  const emit = (kind, uid) => handlers?.[kind]?.(uid, structuredClone(players.get(uid)));

  function addPlayers() {
    for (let i = 0; i < n; i++) {
      timers.push(setTimeout(() => {
        const uid = `demo-${i}`;
        players.set(uid, {
          name: NAMES[i % NAMES.length],
          nameKey: `demo_${i}`,
          slot: i,
          vehicle: { type: VEHICLES[i % VEHICLES.length].id, color: COLORS[Math.floor(i / VEHICLES.length) % COLORS.length].id },
          joinedAt: Date.now(),
          round: room.round,
        });
        emit('added', uid);
      }, 400 + i * 140));
    }
  }

  function startSimulation() {
    const { phrases, phraseTimesMs } = room.config;
    const lengths = phrases.map((p) => Array.from(p).length);
    const totalChars = lengths.reduce((a, b) => a + b, 0);
    const bots = [...players.keys()].map((uid) => ({
      uid,
      cps: 1.2 + Math.random() * 3.8,
      errRate: 0.02 + Math.random() * 0.12,
      phrase: 0, pos: 0, correct: 0, errors: 0, acc: 0, score: 0,
      phraseStart: room.startAt, phraseCorrect: 0, phraseErrors: 0, done: false, lastKeyAt: 0, lastErrorAt: 0,
    }));

    const closePhrase = (b, now, completed) => {
      const remainingMs = Math.max(0, b.phraseStart + phraseTimesMs[b.phrase] - now);
      b.score += phraseScore({ correct: b.phraseCorrect, errors: b.phraseErrors, completed, remainingMs });
      b.phrase += 1; b.pos = 0; b.phraseCorrect = 0; b.phraseErrors = 0; b.phraseStart = now;
      if (b.phrase >= phrases.length) b.done = true;
    };

    sim = setInterval(() => {
      const now = Date.now();
      if (now < room.startAt) return;
      const endAt = room.startAt + room.config.durationSec * 1000;
      for (const b of bots) {
        if (b.done) continue;
        if (now >= endAt) { closePhrase(b, now, false); b.done = true; continue; }
        b.acc += b.cps * 0.25 * (0.6 + Math.random() * 0.8);
        while (b.acc >= 1 && !b.done) {
          b.acc -= 1;
          const ok = Math.random() > b.errRate;
          if (ok) { b.correct++; b.phraseCorrect++; } else { b.errors++; b.phraseErrors++; b.lastErrorAt = now; }
          b.pos++; b.lastKeyAt = now;
          if (b.pos >= lengths[b.phrase]) closePhrase(b, now, true);
        }
        if (!b.done && now - b.phraseStart >= phraseTimesMs[b.phrase]) closePhrase(b, now, false);
        const p = players.get(b.uid);
        if (!p) continue;
        p.live = {
          round: room.round, phraseIndex: Math.min(b.phrase, phrases.length - 1),
          progress: b.phrase >= phrases.length ? 1 : trackProgress(b.correct, b.errors, totalChars), done: b.done,
          ...(b.lastErrorAt ? { lastErrorAt: b.lastErrorAt } : {}),
        };
        p.final = { score: b.score, errors: b.errors, correct: b.correct, accuracy: accuracy(b.correct, b.errors), lastKeyAt: b.lastKeyAt, round: room.round };
        emit('changed', b.uid);
      }
      if (bots.every((b) => b.done)) { clearInterval(sim); sim = null; }
    }, 250);
  }

  function finishAll() {
    clearInterval(sim); sim = null;
    for (const [uid, p] of players) {
      if (p.live && !p.live.done) { p.live.done = true; emit('changed', uid); }
    }
  }

  return {
    demo: true,
    uid: 'demo-host',
    async init() {},
    now: () => Date.now(),
    onConnection() {},
    async findOpenRoom() { return null; },
    async closeRoomByCode() {},
    async createRoom(data) {
      room = structuredClone(data);
      timers.push(setTimeout(addPlayers, 300));
      return '00000';
    },
    async updateRoom(_code, patch) {
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) delete room[k]; else room[k] = structuredClone(v);
      }
      if (patch.status === 'countdown') startSimulation();
      if (patch.status === 'finished') finishAll();
      if (patch.round) {
        for (const [uid, p] of players) { delete p.live; delete p.final; p.round = patch.round; emit('changed', uid); }
      }
    },
    async removeRoom() {
      timers.forEach(clearTimeout); timers = [];
      clearInterval(sim); sim = null;
      players.clear();
    },
    async kick(_code, uid) {
      players.delete(uid);
      handlers?.removed?.(uid);
    },
    listenPlayers(_code, h) {
      handlers = h;
      for (const uid of players.keys()) emit('added', uid);
      return () => { handlers = null; };
    },
  };
}
