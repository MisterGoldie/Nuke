/** Keep draw UI, score pops, and trick settle on the same clock. */
export const HAND_SHUFFLE_WAVE_MS = 220;
export const HAND_SHUFFLE_SETTLE_MS = 620;
export const HAND_REVEAL_MS = 900;
export const CARD_FLIP_MS = 850;
/** Faces are readable; show +/- and the result line. */
export const TRICK_RESULT_MS = HAND_REVEAL_MS + CARD_FLIP_MS;
/** Clear the table after the result has been on screen. */
export const TRICK_SETTLE_MS = TRICK_RESULT_MS + 1400;
/** After the tied faces are up, hold them on the table before WAR ante. */
export const WAR_HOLD_MATCH_MS = 1400;
/** Face-down ante cards land in the overlay. */
export const WAR_DRAW_MS = 1400;
/** Face-up war cards stay visible before the winner banner. */
export const WAR_REVEAL_HOLD_MS = 1800;
/** Winner banner before the pile is awarded. */
export const WAR_COMPLETE_MS = 2200;
