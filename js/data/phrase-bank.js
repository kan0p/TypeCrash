// Banco de frases predefinidas. Contexto: «Taller Mecánico del Norte» (taller ficticio).
// Vocabulario cotidiano, comprensible para cualquier jugador.
// Cada frase tiene entre 20 y 70 caracteres.

export const PHRASE_BANK = {
  // Nivel 1: solo minúsculas, sin tildes, sin puntuación, sin números.
  1: [
    'el camion necesita cambio de aceite',
    'revisa la presion de los neumaticos',
    'la camioneta dos entra al taller hoy',
    'guarda los filtros en la bodega',
    'el bus tiene una luz quemada',
    'lava las manos antes de almorzar',
    'la grua llega temprano en la tarde',
    'pide mas guantes para el turno',
    'el jeep rojo espera en el patio',
    'ordena las llaves en el panel',
    'el tractor pierde agua por abajo',
    'limpia la mesa de trabajo al final',
    'la moto de reparto tiene un ruido raro',
    'anota los kilometros del furgon blanco',
    'el cliente vuelve el viernes a las cinco',
    'barre el piso del galpon grande',
    'carga la bateria del auto azul',
    'el camion tolva sale a la mina manana',
  ],
  // Nivel 2: mayúscula inicial, tildes y ñ, sin puntuación salvo punto final.
  2: [
    'La camioneta dos necesita revisión de frenos',
    'El jefe de taller firmó la orden de trabajo',
    'Revisa la batería antes de salir a terreno',
    'El minibús quedó listo para la mantención',
    'Cambia las pastillas del camión número uno',
    'La señora Muñoz pidió el presupuesto mañana.',
    'El mecánico ajustó la tensión de la correa',
    'Hoy llegó el repuesto para la grúa pequeña.',
    'Anótalo en la bitácora antes de irte',
    'El técnico revisó el líquido de dirección',
    'La retroexcavadora vuelve después del almuerzo',
    'Pídele a Begoña la llave del galpón',
    'El furgón de reparto tiene la luz de freno quemada',
    'Usa lentes de seguridad en el esmeril.',
    'Ñuñoa envió otro camión para revisión',
    'El jeep necesita alineación y balanceo',
  ],
  // Nivel 3: tildes, ñ, comas, puntos, números y signos básicos (¿?¡!).
  3: [
    '¿Quién revisó el filtro de aire del camión 3?',
    'El repuesto cuesta $45.900, más IVA.',
    'Mantención preventiva: aceite, filtros y frenos.',
    '¡Atención! El vehículo 2 no puede salir hoy.',
    'Se usaron 4 litros de aceite 15W-40 en la camioneta.',
    '¿Quedan 12 bujías en la bodega del fondo?',
    'La grúa 7 llega a las 14:30, no antes.',
    '¡Ojo! El piso del taller está mojado.',
    'Neumáticos 205/55: presión de 32 libras.',
    'El bus 21 recorrió 180.000 km este año.',
    '¿Alguien vio la llave de 13 mm? ¡La necesito!',
    'Orden 58: cambio de embrague y revisión.',
    'Turno de mañana: Pía, Iñaki y Tomás.',
    'El presupuesto final es de $128.500, con IVA.',
    '¡Listo! La retroexcavadora pasó la prueba.',
    'Faltan 3 filtros, 2 correas y 1 batería.',
  ],
};

export const LEVEL_LABELS = {
  1: 'Nivel 1 · minúsculas, sin tildes',
  2: 'Nivel 2 · mayúsculas, tildes y ñ',
  3: 'Nivel 3 · puntuación y números',
};
