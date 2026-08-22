"use client";

import { useEffect, useRef } from "react";
import { declareWinner, type LocalState } from "../gameLogic";
import type { HandleGameEnd } from "../gameTypes";

interface UseCpuNukeSequenceArgs {
  gameData: LocalState;
  setGameData: React.Dispatch<React.SetStateAction<LocalState>>;
  setShowNukeAnimation: (show: boolean) => void;
  setNukeInitiator: (initiator: "player" | "cpu") => void;
  setIsProcessing: (processing: boolean) => void;
  playNukeSound: () => void;
  handleGameEnd: HandleGameEnd;
}

export function useCpuNukeSequence({
  gameData,
  setGameData,
  setShowNukeAnimation,
  setNukeInitiator,
  setIsProcessing,
  playNukeSound,
  handleGameEnd,
}: UseCpuNukeSequenceArgs) {
  const handleGameEndRef = useRef(handleGameEnd);
  handleGameEndRef.current = handleGameEnd;

  useEffect(() => {
    const isCpuNuke = gameData.isNukeActive && gameData.message.includes("CPU LAUNCHED");
    if (!isCpuNuke) return;

    setShowNukeAnimation(true);
    setNukeInitiator("cpu");
    playNukeSound();

    const timer = setTimeout(() => {
      setShowNukeAnimation(false);

      if (gameData.message.includes("Player has fewer than 10 cards")) {
        setGameData((prev) => declareWinner(prev, "cpu", "Game Over - CPU wins with a NUKE!"));
        void handleGameEndRef.current("loss");
        setIsProcessing(false);
      } else {
        setGameData((prev) => ({
          ...prev,
          isNukeActive: false,
          playerCard: null,
          cpuCard: null,
          readyForNextCard: true,
          message: "Draw next card to continue",
        }));
        setTimeout(() => setIsProcessing(false), 100);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [
    gameData.isNukeActive,
    gameData.message,
    playNukeSound,
    setGameData,
    setIsProcessing,
    setNukeInitiator,
    setShowNukeAnimation,
  ]);
}
