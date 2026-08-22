"use client";

import { useEffect, useRef, useState } from "react";
import {
  awardWarPile,
  dealWarAnte,
  getDisplayCounts,
  resolveWarWinner,
  type Card,
  type LocalState,
} from "../gameLogic";
import type { HandleGameEnd, WarStage } from "../gameTypes";
import {
  TRICK_RESULT_MS,
  WAR_COMPLETE_MS,
  WAR_DRAW_MS,
  WAR_HOLD_MATCH_MS,
  WAR_REVEAL_HOLD_MS,
} from "../playTiming";

interface UseWarSequenceArgs {
  gameData: LocalState;
  setGameData: React.Dispatch<React.SetStateAction<LocalState>>;
  setIsProcessing: (processing: boolean) => void;
  setDelayedMessage: (message: string) => void;
  playWarSound: () => void;
  username: string;
  handleGameEnd: HandleGameEnd;
}

function pileByOwner(pile: Card[], owner: "player" | "cpu"): Card[] {
  return pile.filter((_, index) => (owner === "player" ? index % 2 === 0 : index % 2 === 1));
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
  const [matchedCards, setMatchedCards] = useState<{ player: Card | null; cpu: Card | null }>({
    player: null,
    cpu: null,
  });
  const [faceDownCards, setFaceDownCards] = useState<{ player: Card[]; cpu: Card[] }>({
    player: [],
    cpu: [],
  });
  const [warWinner, setWarWinner] = useState<"player" | "cpu" | undefined>();

  const warHandledRef = useRef(false);
  const warWinnerRef = useRef<"player" | "cpu" | null>(null);
  const gameDataRef = useRef(gameData);
  gameDataRef.current = gameData;
  const handleGameEndRef = useRef(handleGameEnd);
  handleGameEndRef.current = handleGameEnd;

  useEffect(() => {
    if (!gameData.isWar || gameData.gameOver || warHandledRef.current) {
      return;
    }

    const tiedPlayer = gameDataRef.current.playerCard;
    const tiedCpu = gameDataRef.current.cpuCard;
    if (!tiedPlayer || !tiedCpu || gameDataRef.current.warPile.length > 0) {
      return;
    }

    warHandledRef.current = true;
    let cancelled = false;

    setMatchedCards({ player: tiedPlayer, cpu: tiedCpu });
    setIsProcessing(true);
    setWarStage("showing-cards");
    setShowWarAnimation(false);

    const startOverlayAt = TRICK_RESULT_MS + WAR_HOLD_MATCH_MS;
    const revealAt = startOverlayAt + WAR_DRAW_MS;
    const completeAt = revealAt + WAR_REVEAL_HOLD_MS;
    const finishAt = completeAt + WAR_COMPLETE_MS;

    const overlayTimer = window.setTimeout(() => {
      if (cancelled) return;
      playWarSound();
      setGameData((prev) => dealWarAnte(prev));
      setShowWarAnimation(true);
      setWarStage("drawing-cards");
    }, startOverlayAt);

    const revealTimer = window.setTimeout(() => {
      if (cancelled) return;
      setWarStage("revealing-winner");
    }, revealAt);

    const completeTimer = window.setTimeout(() => {
      if (cancelled) return;
      setWarStage("complete");
    }, completeAt);

    const finishTimer = window.setTimeout(() => {
      if (cancelled) return;
      setShowWarAnimation(false);
      setGameData((prev) => {
        const winner = warWinnerRef.current ?? resolveWarWinner(prev);
        warWinnerRef.current = null;
        const next = awardWarPile(prev, winner);
        if (next.gameOver) {
          const gameWinner = getDisplayCounts(next).player > 0 ? "player" : "cpu";
          const gameOverMessage = `GAME OVER - ${gameWinner === "player" ? username.toUpperCase() : "CPU"} WINS!`;
          next.message = gameOverMessage;
          setDelayedMessage(gameOverMessage);
          void handleGameEndRef.current(gameWinner === "player" ? "win" : "loss");
        } else {
          setDelayedMessage("Draw next card to continue");
        }
        return next;
      });
      setIsProcessing(false);
      setWarWinner(undefined);
      setMatchedCards({ player: null, cpu: null });
      setFaceDownCards({ player: [], cpu: [] });
      setWarStage("initial");
      warHandledRef.current = false;
    }, finishAt);

    return () => {
      cancelled = true;
      warHandledRef.current = false;
      window.clearTimeout(overlayTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(completeTimer);
      window.clearTimeout(finishTimer);
    };
  }, [gameData.isWar, gameData.gameOver, playWarSound, username, setGameData, setDelayedMessage, setIsProcessing]);

  useEffect(() => {
    if (!gameData.isWar || gameData.warPile.length === 0) return;
    const playerPile = pileByOwner(gameData.warPile, "player");
    const cpuPile = pileByOwner(gameData.warPile, "cpu");
    setFaceDownCards({
      player: playerPile.slice(1),
      cpu: cpuPile.slice(1),
    });
    warWinnerRef.current = resolveWarWinner(gameData);
    setWarWinner(warWinnerRef.current);
  }, [gameData.isWar, gameData.warPile, gameData.playerCard, gameData.cpuCard]);

  return {
    showWarAnimation,
    warStage,
    matchedCards,
    faceDownCards,
    revealCards: {
      player: gameData.isWar && gameData.warPile.length > 0 ? gameData.playerCard : null,
      cpu: gameData.isWar && gameData.warPile.length > 0 ? gameData.cpuCard : null,
    },
    warWinner,
  };
}
