"use client";

import { useEffect } from "react";
import {
  countAllCards,
  getDisplayCounts,
  settleTrick,
  type LocalState,
} from "../gameLogic";

interface UseTrickFlowArgs {
  gameData: LocalState;
  setGameData: React.Dispatch<React.SetStateAction<LocalState>>;
  username: string;
  setDelayedMessage: (message: string) => void;
}

export function useTrickFlow({
  gameData,
  setGameData,
  username,
  setDelayedMessage,
}: UseTrickFlowArgs) {
  useEffect(() => {
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
    }, 2000);

    return () => clearTimeout(timer);
  }, [
    gameData.readyForNextCard,
    gameData.gameOver,
    gameData.isWar,
    gameData.isNukeActive,
    gameData.playerCard,
    gameData.cpuCard,
    setGameData,
  ]);

  useEffect(() => {
    if (!gameData.playerCard || !gameData.cpuCard) return;

    setDelayedMessage("");
    const resultTimer = setTimeout(() => {
      const message =
        username === "Your"
          ? gameData.message.replace(/You/g, "Player")
          : gameData.message.replace(/You/g, username);
      setDelayedMessage(message);

      if (!gameData.gameOver && !message.includes("GAME OVER")) {
        setTimeout(() => {
          if (!gameData.gameOver) {
            setDelayedMessage("Draw next card to continue");
          }
        }, 2000);
      }
    }, 400);

    return () => clearTimeout(resultTimer);
  }, [
    gameData.playerCard,
    gameData.cpuCard,
    gameData.message,
    gameData.gameOver,
    username,
    setDelayedMessage,
  ]);

  useEffect(() => {
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
  }, [gameData]);
}
