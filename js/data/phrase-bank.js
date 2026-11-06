// Banco de frases predefinidas, de temas variados: anime, música, ciencia, naturaleza,
// deportes, comida, cine, juegos y vida cotidiana. Vocabulario comprensible para cualquiera.
// Cada frase tiene entre 20 y 70 caracteres (lo verifica tests/texts.test.js).

export const PHRASE_BANK = {
  // Nivel 1: solo minúsculas, sin tildes, sin ñ, sin puntuación, sin números.
  1: [
    // Anime
    'goku entrena todos los dias para ser mas fuerte',
    'vegeta nunca acepta perder una pelea',
    'las esferas del dragon conceden un deseo',
    'piccolo cuida a gohan desde que era chico',
    'freezer quiere conquistar todo el universo',
    'la nube voladora lleva a goku por el cielo',
    // Música
    'la guitarra electrica suena fuerte en el concierto',
    'el baterista marca el ritmo de la cancion',
    'el bajo y la bateria forman la base del grupo',
    'el publico canta el coro de su tema favorito',
    'la banda ensaya los martes en un garage',
    // Ciencia y espacio
    'la luna gira alrededor de la tierra',
    'marte es conocido como el planeta rojo',
    'el astronauta flota dentro de la nave',
    'el telescopio muestra los anillos de saturno',
    // Naturaleza
    'la ballena azul es el animal mas grande',
    'los pinguinos viven en lugares muy frios',
    'las abejas hacen miel con el polen de las flores',
    'el gato duerme al sol toda la tarde',
    'el desierto de atacama es muy seco',
    // Deportes, comida y vida diaria
    'el arquero atajo el penal en el ultimo minuto',
    'la bicicleta es buena para la salud',
    'las empanadas de pino salen calientes del horno',
    'una pizza con queso nunca falla',
    'el videojuego guarda la partida al final del nivel',
    'el tren cruza el valle al amanecer',
    'mi perro corre feliz por la playa',
    'el museo abre sus puertas a las diez',
  ],
  // Nivel 2: mayúscula inicial, tildes y ñ, sin puntuación salvo punto final.
  2: [
    // Anime
    'Goku aprendió el kamehameha de su maestro Roshi',
    'Vegeta es el príncipe de los guerreros saiyajin',
    'Krilin es el mejor amigo de Goku desde niño',
    'Las siete esferas del dragón están escondidas.',
    'Gohan derrotó a Cell con un ataque increíble.',
    'Bulma inventó el radar para encontrar las esferas',
    // Música
    'Freddie Mercury cantó frente a miles de personas',
    'El solo de guitarra fue lo mejor del concierto',
    'Los Jaivas mezclaron el rock con música andina.',
    'La batería retumbó durante toda la canción',
    'Violeta Parra escribió canciones inolvidables',
    // Ciencia y espacio
    'Júpiter es el planeta más grande del sistema solar',
    'El cometa dejó una estela brillante en el cielo.',
    'Los dinosaurios dominaron la Tierra hace mucho tiempo',
    // Naturaleza
    'El cóndor vuela sobre la cordillera de los Andes',
    'El colibrí agita sus alas muy rápido.',
    'La Antártica es el continente más frío del planeta',
    'El pingüino de Humboldt vive en la costa chilena',
    'El volcán Villarrica tiene un lago de lava',
    // Deportes, comida y vida diaria
    'La selección celebró el gol en el último minuto',
    'Mañana jugamos la final en el estadio nacional',
    'El pastel de choclo es una comida típica chilena',
    'Las sopaipillas son perfectas en un día de lluvia.',
    'Mi abuela cuenta historias junto a la estufa',
    'El dragón guardaba un tesoro en la montaña.',
  ],
  // Nivel 3: tildes, ñ, comas, puntos, números y signos básicos (¿?¡!).
  3: [
    // Anime
    '¡Kamehameha! Goku lanzó su ataque más fuerte.',
    '¿Cuántas esferas del dragón faltan? Solo 2.',
    'El rastreador marcó 9.000 de poder. ¡Increíble!',
    'Goku, Gohan y Goten entrenan juntos los domingos.',
    // Música
    'Queen tocó unos 20 minutos en el Live Aid de 1985.',
    'Concierto: sábado 14, a las 21:00 en el estadio.',
    '¿Rock, pop o cumbia? ¡Hoy suena de todo!',
    'El disco vendió 3 millones de copias en un año.',
    // Ciencia y espacio
    'La Luna está a unos 384.000 km de la Tierra.',
    'Un año en Marte dura unos 687 días terrestres.',
    'La luz del Sol tarda unos 8 minutos en llegar.',
    // Naturaleza y geografía
    'El Everest mide 8.849 metros de altura.',
    '¿Sabías que el pulpo tiene 3 corazones?',
    'Chile mide más de 4.000 km de norte a sur.',
    // Deportes, comida, cine y vida diaria
    '¡Gol! Chile ganó 2 a 1 en el último minuto.',
    'La entrada al cine cuesta $5.500, con cabritas.',
    'Receta: 2 huevos, 1 taza de harina y leche.',
    '¡Atención! El tren a Valparaíso sale a las 8:15.',
    'El nivel 5 del juego tiene 3 jefes finales.',
    '¿Quién se comió la última empanada? ¡Confiesa!',
  ],
};

export const LEVEL_LABELS = {
  1: 'Nivel 1 · minúsculas, sin tildes',
  2: 'Nivel 2 · mayúsculas, tildes y ñ',
  3: 'Nivel 3 · puntuación y números',
};
