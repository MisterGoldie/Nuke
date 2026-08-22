"use client";

import { useEffect } from "react";
import {
  countAllCards,
  getDisplayCounts,
  settleTrick,
  type LocalState,
} from "../gameLogic";
import { TRICK_RESULT_MS, TRICK_SETTLE_MS } from "../playTiming";

interface UseTrickFlowArgs {
  enabled: boolean;
  gameData: LocalState;
  setGameData: React.Dispatch<React.SetStateAction<LocalState>>;
  username: string;
  setDelayedMessage: (message: string) => void;
}

export function useTrickFlow({
  enabled,
  gameData,
  setGameData,
  username,
  setDelayedMessage,
}: UseTrickFlowArgs) {
  useEffect(() => {
    if (!enabled) return;
    if (!gameData.readyForNextCard || gameData.gameOver || gameData.isWar || gameData.isNukeActive) {
      return;
    }

    if (!gameData.playerCard && !gameData.cpuCard) {
      setGameData((prev) =>
        prev.readyForNextCard ? { ...prev, readyForNextCard: false } : prev,
      );
      return;
    }

    const timer = setTimeout(() => {
      setGameData((prev) => settleTrick(prev));
    }, TRICK_SETTLE_MS);

    return () => clearTimeout(timer);
  }, [
    enabled,
    gameData.readyForNextCard,
    gameData.gameOver,
    gameData.isWar,
    gameData.isNukeActive,
    gameData.playerCard,
    gameData.cpuCard,
    setGameData,
  ]);

  useEffect(() => {
    if (!enabled || !gameData.playerCard || !gameData.cpuCard) return;
    if (gameData.isWar && gameData.warPile.length > 0) return;

    setDelayedMessage("");
    const resultTimer = setTimeout(() => {
      const message =
        username === "Your"
          ? gameData.message.replace(/You/g, "Player")
          : gameData.message.replace(/You/g, username);
      setDelayedMessage(message);

      if (gameData.isWar || gameData.gameOver || message.includes("GAME OVER")) {
        return;
      }

      setTimeout(() => {
        if (!gameData.gameOver) {
          setDelayedMessage("Draw next card to continue");
        }
      }, 2000);
    }, TRICK_RESULT_MS);

    return () => clearTimeout(resultTimer);
  }, [
    enabled,
    gameData.playerCard,
    gameData.cpuCard,
    gameData.isWar,
    gameData.message,
    gameData.gameOver,
    username,
    setDelayedMessage,
  ]);

  useEffect(() => {
    if (!enabled) return;
    const total = countAllCards(gameData);
    if (total === 52) return;
    console.error("Card count error:", {
      playerDeck: gameData.playerDeck.length,
      cpuDeck: gameData.cpuDeck.length,
      playerCard: gameData.playerCard ? 1 : 0,
      cpuCard: gameData.cpuCard ? 1 : 0,
      warPile: gameData.warPile.length,
      display: getDisplayCounts(gameData),
      total,
    });
  }, [enabled, gameData]);
}
