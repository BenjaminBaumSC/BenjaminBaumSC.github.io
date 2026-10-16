export const POINTS = { A: 1, B: 3, C: 4, D: 1, E: 1, I: 1, J: 6, M: 3, N: 1, O: 2, P: 4, R: 1, T: 1, U: 1, Y: 10, 2: 2, 3: 3, 4: 4, 8: 8 };

export const TILES = [...'BENJAMINBAUM'].map((letter, id) => ({ id, letter, points: POINTS[letter] }));
// Delivered after BENJAMIN BAUM; enough for MINI, CODUMO, BITU84 and BEN32.
export const EXTRA_TILES = [...'ICOODT8432'].map((letter, i) => ({ id: TILES.length + i, letter, points: POINTS[letter] }));

// Fully coloured guests of the BENNI party; their own id range keeps them apart from real tiles.
const PARTY_COLORS = ['#c8423a', '#2f6db5', '#f5bc0a', '#20b69e', '#e74266'];
export const PARTY_TILES = [...'PARTY'].map((letter, i) => ({ id: 100 + i, letter, points: POINTS[letter], color: PARTY_COLORS[i] }));

export const FIELD_COUNT = 15;
export const FIELD_PREMIUMS = ['TW', null, null, 'DL', null, null, null, 'TW', null, null, null, 'DL', null, null, 'TW'];

export const SECRET_WORDS = ['BENNI', 'NINJA', 'BENJAMIN BAUM', 'MINI', 'CODUMO', 'BITU84', 'BEN32'];

export const KONAMI_SEQUENCE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
export const KONAMI_TAIL = ['B', 'A'];
export const KONAMI_TIMEOUT_MS = 5000;

export const MAX_FIELD_SIZE = 64;
export const MIN_HIT_SIZE = 40;

// Pointer speed at release in px/ms; faster counts as a throw.
export const SNAP_MAX_POINTER_SPEED = 0.6;
// How far outside a field the pointer may be, in field sizes.
export const SNAP_TOLERANCE = 0.3;
