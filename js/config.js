const POINTS = { A: 1, B: 3, E: 1, I: 1, J: 6, M: 3, N: 1, U: 1 };

export const TILES = [...'BENJAMINBAUM'].map((letter, id) => ({ id, letter, points: POINTS[letter] }));

export const FIELD_COUNT = 15;
export const FIELD_PREMIUMS = ['TW', null, null, 'DL', null, null, null, 'TW', null, null, null, 'DL', null, null, 'TW'];

export const SECRET_WORDS = ['BENNI', 'NINJA'];

export const KONAMI_SEQUENCE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
export const KONAMI_TAIL = ['B', 'A'];
export const KONAMI_TIMEOUT_MS = 5000;

export const MAX_FIELD_SIZE = 64;
export const MIN_HIT_SIZE = 40;

// Matter.js speed is measured in px per 1/60 s step.
export const SNAP_MAX_SPEED = 4;
// How far above the floor a released tile still snaps, in field sizes.
export const SNAP_CAPTURE_HEIGHT = 2.5;
