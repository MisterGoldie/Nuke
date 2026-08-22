"use client";

import { useEffect, useState } from "react";
import { returnUnassignedToOwners, type LocalState } from "../gameLogic";
import { soundCache } from "~/utils/optimizations";
import type { ScreenId } from "../gameTypes";

const MATCH_SECONDS = 240;

interface UseGameTimerArgs {
  screen: ScreenId;
  gameOver: boolean;
  isMuted: boolean;
  setGameData: React.Dispatch<React.SetStateAction<LocalState>>;
  setDelayedMessage: (message: string) => void;
  setIsGameLocked: (locked: boolean) => void;
}

export function useGameTimer({
  screen,
  gameOver,
  isMuted,
  setGameData,
  setDelayedMessage,
  setIsGameLocked,
}: UseGameTimerArgs) {
  const [timeRemaining, setTimeRemaining] = useState(MATCH_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    setIsTimerRunning(screen === "game" && !gameOver);
  }, [screen, gameOver]);

  useEffect(() => {
    if (screen !== "game" || !isTimerRunning) return;

    const timerInterval = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime > 1) return prevTime - 1;

        clearInterval(timerInterval);
        const warSound = soundCache.get("/sounds/war.mp3");
        if (warSound && !isMuted) {
          warSound.currentTime = 0;
          warSound.volume = 0.75;
          void warSound.play();
        }

        const timerMessage = "TIME'S UP - GAME OVER!";
        setGameData((prev) => ({
          ...returnUnassignedToOwners(prev),
          gameOver: true,
          readyForNextCard: false,
          message: timerMessage,
          isNukeActive: false,
        }));
        setDelayedMessage(timerMessage);
        setIsTimerRunning(false);
        setIsGameLocked(true);
        return 0;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [screen, isTimerRunning, isMuted, setGameData, setDelayedMessage, setIsGameLocked]);

  const resetTimer = () => {
    setTimeRemaining(MATCH_SECONDS);
    setIsTimerRunning(true);
  };

  return { timeRemaining, resetTimer };
}
