export type ScreenId = "menu" | "game" | "leaderboard" | "tutorial";

export type WarStage =
  | "initial"
  | "showing-cards"
  | "drawing-cards"
  | "revealing-winner"
  | "complete";

export type GameOutcome = "win" | "loss" | "tie";

export type HandleGameEnd = (
  outcome: GameOutcome,
  isTimeUp?: boolean,
) => Promise<void>;
