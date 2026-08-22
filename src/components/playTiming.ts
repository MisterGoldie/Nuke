/** Keep draw UI, score pops, and trick settle on the same clock. */
export const HAND_SHUFFLE_WAVE_MS = 220;
export const HAND_SHUFFLE_SETTLE_MS = 620;
export const HAND_REVEAL_MS = 900;
export const CARD_FLIP_MS = 850;
/** Faces are readable; show +/- and the result line. */
export const TRICK_RESULT_MS = HAND_REVEAL_MS + CARD_FLIP_MS;
/** Clear the table after the result has been on screen. */
export const TRICK_SETTLE_MS = TRICK_RESULT_MS + 1400;
