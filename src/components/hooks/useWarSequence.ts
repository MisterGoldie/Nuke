"use client";

import { useEffect, useRef, useState } from "react";
import {
  awardWarPile,
  getDisplayCounts,
  type LocalState,
} from "../gameLogic";
import type { HandleGameEnd, WarStage } from "../gameTypes";

interface UseWarSequenceArgs {
  gameData: LocalState;
  setGameData: React.Dispatch<React.SetStateAction<LocalState>>;
  setIsProcessing: (processing: boolean) => void;
  setDelayedMessage: (message: string) => void;
  playWarSound: () => void;
  username: string;
  handleGameEnd: HandleGameEnd;
}

export function useWarSequence({
  gameData,
  setGameData,
  setIsProcessing,
  setDelayedMessage,
  playWarSound,
  username,
  handleGameEnd,
}: UseWarSequenceArgs) {
  const [showWarAnimation, setShowWarAnimation] = useState(false);
  const [warStage, setWarStage] = useState<WarStage>("initial");
  const [warCards, setWarCards] = useState<{ player: LocalState["warPile"]; cpu: LocalState["warPile"] }>({
    player: [],
    cpu: [],
  });
  const [warWinner, setWarWinner] = useState<"player" | "cpu" | undefined>();
  const [warWinningCard, setWarWinningCard] = useState<Record<string, string> | undefined>();

  const warHandledRef = useRef(false);
  const warWinnerRef = useRef<"player" | "cpu" | null>(null);
  const handleGameEndRef = useRef(handleGameEnd);
  handleGameEndRef.current = handleGameEnd;

  useEffect(() => {
    if (!gameData.isWar || gameData.gameOver || warHandledRef.current) {
      return;
    }
    warHandledRef.current = true;

    let cancelled = false;
    const pile = gameData.warPile;
    setIsProcessing(true);
    setWarStage("showing-cards");
    setWarCards({
      player: [pile[2], pile[4], pile[6]].filter((card): card is NonNullable<typeof card> => Boolean(card)),
      cpu: [pile[3], pile[5], pile[7]].filter((card): card is NonNullable<typeof card> => Boolean(card)),
    });
    playWarSound();

    const drawingTimer = setTimeout(() => {
      if (cancelled) return;
      setShowWarAnimation(true);
      setWarStage("drawing-cards");
    }, 1500);

    const revealTimer = setTimeout(() => {
      if (cancelled) return;
      const winner = Math.random() < 0.5 ? "player" : "cpu";
      warWinnerRef.current = winner;
      setWarWinner(winner);

      const suits = ["hearts", "diamonds", "clubs", "spades"];
      const playerSuit = suits[Math.floor(Math.random() * suits.length)]!;
      let cpuSuit = suits[Math.floor(Math.random() * suits.length)]!;
      while (cpuSuit === playerSuit) {
        cpuSuit = suits[Math.floor(Math.random() * suits.length)]!;
      }
      const highRanks = ["Q", "K", "A"];
      const lowRanks = ["9", "10", "J"];
      const winnerRank = highRanks[Math.floor(Math.random() * highRanks.length)]!;
      const loserRank = lowRanks[Math.floor(Math.random() * lowRanks.length)]!;
      setWarWinningCard({
        playerSuit,
        cpuSuit,
        playerRank: winner === "player" ? winnerRank : loserRank,
        cpuRank: winner === "cpu" ? winnerRank : loserRank,
        display: winner === "player" ? winnerRank : loserRank,
        suit: winner === "player" ? playerSuit : cpuSuit,
      });
      setWarStage("revealing-winner");
    }, 3500);

    const completeTimer = setTimeout(() => {
      if (cancelled) return;
      setWarStage("complete");
    }, 5500);

    const finishTimer = setTimeout(() => {
      if (cancelled) return;
      setShowWarAnimation(false);
      setGameData((prev) => {
        const winner = warWinnerRef.current ?? "player";
        warWinnerRef.current = null;
        const next = awardWarPile(prev, winner);
        if (next.gameOver) {
          const gameWinner = getDisplayCounts(next).player > 0 ? "player" : "cpu";
          const gameOverMessage = `GAME OVER - ${gameWinner === "player" ? username.toUpperCase() : "CPU"} WINS!`;
          next.message = gameOverMessage;
          setDelayedMessage(gameOverMessage);
          void handleGameEndRef.current(gameWinner === "player" ? "win" : "loss");
        }
        return next;
      });
      setIsProcessing(false);
      setWarWinner(undefined);
      setWarWinningCard(undefined);
      setWarStage("initial");
    }, 8500);

    return () => {
      cancelled = true;
      warHandledRef.current = false;
      clearTimeout(drawingTimer);
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
      clearTimeout(finishTimer);
    };
  }, [gameData.isWar, gameData.gameOver, playWarSound, username, setGameData, setDelayedMessage, setIsProcessing]);

  return {
    showWarAnimation,
    warStage,
    warCards,
    warWinner,
    warWinningCard,
  };
}
