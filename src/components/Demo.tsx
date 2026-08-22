"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { getDisplayCounts, initializeGame, type LocalState } from "./gameLogic";
import { useGameManager } from "./GameManager";
import type { GameOutcome, ScreenId } from "./gameTypes";
import { useCpuNukeSequence } from "./hooks/useCpuNukeSequence";
import { useFarcasterUser } from "./hooks/useFarcasterUser";
import { useGameAudio } from "./hooks/useGameAudio";
import { useGameTimer } from "./hooks/useGameTimer";
import { useTrickFlow } from "./hooks/useTrickFlow";
import { useWarSequence } from "./hooks/useWarSequence";
import MenuScreen from "./screens/MenuScreen";
import TutorialScreen from "./screens/TutorialScreen";

const GameScreen = dynamic(() => import("./screens/GameScreen"), {
  ssr: false,
  loading: () => (
    <div className="arcade-container flex items-center justify-center">
      <p className="arcade-text text-xl animate-pulse">Loading...</p>
    </div>
  ),
});

const Leaderboard = dynamic(() => import("./Leaderboard"), {
  ssr: false,
});

export default function Demo() {
  const [screen, setScreen] = useState<ScreenId>("menu");
  const [gameData, setGameData] = useState<LocalState>(initializeGame);
  const [showNukeAnimation, setShowNukeAnimation] = useState(false);
  const [nukeInitiator, setNukeInitiator] = useState<"player" | "cpu">("player");
  const [delayedMessage, setDelayedMessage] = useState("Draw card to begin");
  const [hasSubmittedResult, setHasSubmittedResult] = useState(false);
  const [, setIsProcessing] = useState(false);
  const [isGameLocked, setIsGameLocked] = useState(false);
  const [playerCardChange, setPlayerCardChange] = useState<number | null>(null);
  const [cpuCardChange, setCpuCardChange] = useState<number | null>(null);

  const inGame = screen === "game";
  const { context, username } = useFarcasterUser();
  const { isMuted, toggleMute, playWarSound, playNukeSound } = useGameAudio(screen);
  const { timeRemaining, resetTimer } = useGameTimer({
    screen,
    gameOver: gameData.gameOver,
    isMuted,
    setGameData,
    setDelayedMessage,
    setIsGameLocked,
  });

  const handleGameEnd = useCallback(
    async (outcome: GameOutcome, isTimeUp = false) => {
      if (hasSubmittedResult || isGameLocked) return;
      setIsGameLocked(true);
      if (isTimeUp || !context?.user?.fid) return;

      try {
        const response = await fetch("/api/nuke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerFid: context.user.fid.toString(),
            outcome,
          }),
        });
        if (!response.ok) throw new Error("Failed to store game result");
        setHasSubmittedResult(true);
      } catch (error) {
        console.error("Error in handleGameEnd:", error);
      }
    },
    [context?.user?.fid, hasSubmittedResult, isGameLocked],
  );

  const { handleDrawCard, handleNukeClick } = useGameManager({
    gameData,
    setGameData,
    setShowNukeAnimation,
    setNukeInitiator,
    setIsProcessing,
    handleGameEnd,
    playNukeSound,
    setPlayerCardChange,
    setCpuCardChange,
  });

  const war = useWarSequence({
    gameData,
    setGameData,
    setIsProcessing,
    setDelayedMessage,
    playWarSound,
    username,
    handleGameEnd,
  });

  useCpuNukeSequence({
    gameData,
    setGameData,
    setShowNukeAnimation,
    setNukeInitiator,
    setIsProcessing,
    playNukeSound,
    handleGameEnd,
  });

  useTrickFlow({
    enabled: inGame,
    gameData,
    setGameData,
    username,
    setDelayedMessage,
  });

  useEffect(() => {
    if (!gameData.gameOver) {
      setIsGameLocked(false);
      setHasSubmittedResult(false);
    }
  }, [gameData.gameOver]);

  const startGame = () => {
    setGameData(initializeGame());
    setDelayedMessage("Draw card to begin");
    setScreen("tutorial");
  };

  const startPlaying = () => {
    setScreen("game");
    setDelayedMessage("Draw card to begin");
    resetTimer();
  };

  if (screen === "menu") {
    return (
      <MenuScreen
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onStartGame={startGame}
        onLeaderboard={() => setScreen("leaderboard")}
      />
    );
  }

  if (screen === "tutorial") {
    return <TutorialScreen onStart={startPlaying} />;
  }

  if (screen === "game") {
    return (
      <GameScreen
        gameData={gameData}
        cardCounts={getDisplayCounts(gameData)}
        timeRemaining={timeRemaining}
        delayedMessage={delayedMessage}
        username={username}
        showNukeAnimation={showNukeAnimation}
        nukeInitiator={nukeInitiator}
        showWarAnimation={war.showWarAnimation}
        warCards={war.warCards}
        warStage={war.warStage}
        warWinner={war.warWinner}
        warWinningCard={war.warWinningCard}
        playerCardChange={playerCardChange}
        cpuCardChange={cpuCardChange}
        onPlayerCardChangeDone={() => setPlayerCardChange(null)}
        onCpuCardChangeDone={() => setCpuCardChange(null)}
        onDrawCard={handleDrawCard}
        onNuke={handleNukeClick}
        onBack={() => setScreen("menu")}
      />
    );
  }

  if (screen === "leaderboard") {
    return <Leaderboard onBack={() => setScreen("menu")} />;
  }

  return null;
}
