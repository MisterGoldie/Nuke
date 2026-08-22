"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import CardHand from "../CardHand";
import type { LocalState } from "../gameLogic";
import type { WarStage } from "../gameTypes";

const WarAnimation = dynamic(() => import("../WarAnimation"), {
  ssr: false,
  loading: () => null,
});

const NukeAnimation = dynamic(() => import("../NukeAnimation"), {
  ssr: false,
  loading: () => null,
});

interface GameScreenProps {
  gameData: LocalState;
  cardCounts: { player: number; cpu: number };
  timeRemaining: number;
  delayedMessage: string;
  username: string;
  showNukeAnimation: boolean;
  nukeInitiator: "player" | "cpu";
  showWarAnimation: boolean;
  warCards: { player: LocalState["warPile"]; cpu: LocalState["warPile"] };
  warStage: WarStage;
  warWinner?: "player" | "cpu";
  warWinningCard?: Record<string, string>;
  playerCardChange: number | null;
  cpuCardChange: number | null;
  onPlayerCardChangeDone: () => void;
  onCpuCardChangeDone: () => void;
  onDrawCard: () => void;
  onNuke: () => void;
  onBack: () => void;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function CardDelta({
  change,
  className,
  onDone,
}: {
  change: number;
  className: string;
  onDone: () => void;
}) {
  return (
    <motion.div
      className={className}
      initial={{ y: 0, opacity: 0, scale: 0.5 }}
      animate={{ y: -24, opacity: 1, scale: 1.15 }}
      exit={{ y: -48, opacity: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      onAnimationComplete={onDone}
    >
      <span
        className={`text-xl font-bold sm:text-2xl ${change > 0 ? "text-green-500" : "text-red-500"}`}
        style={{
          textShadow: "0 0 8px rgba(0, 0, 0, 0.8)",
          filter: "drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))",
        }}
      >
        {change > 0 ? "+" : ""}
        {change}
      </span>
    </motion.div>
  );
}

export default function GameScreen({
  gameData,
  cardCounts,
  timeRemaining,
  delayedMessage,
  username,
  showNukeAnimation,
  nukeInitiator,
  showWarAnimation,
  warCards,
  warStage,
  warWinner,
  warWinningCard,
  playerCardChange,
  cpuCardChange,
  onPlayerCardChangeDone,
  onCpuCardChangeDone,
  onDrawCard,
  onNuke,
  onBack,
}: GameScreenProps) {
  const timesUp = delayedMessage.includes("TIME'S UP");
  const playerLabel = username === "Your" ? "Your card" : `${username}'s card`;

  return (
    <motion.div
      className={`arcade-container ${showNukeAnimation ? "nuke-border-flash" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <NukeAnimation isVisible={showNukeAnimation} initiator={nukeInitiator} />
      <WarAnimation
        isVisible={showWarAnimation}
        playerCard={gameData.playerCard}
        cpuCard={gameData.cpuCard}
        warCards={warCards}
        warStage={warStage}
        warWinner={warWinner}
        warWinningCard={warWinningCard}
      />

      <div className="game-table">
        <motion.div
          className="game-hud flex w-full items-center justify-between gap-2"
          style={{ fontSize: "var(--hud-size)" }}
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <motion.span
            className="arcade-text min-w-0 truncate"
            animate={{ scale: cardCounts.player < 10 ? [1, 1.08, 1] : 1 }}
            transition={{
              duration: 0.5,
              repeat: cardCounts.player < 10 ? Infinity : 0,
              repeatDelay: 1.5,
            }}
          >
            You: {cardCounts.player}
          </motion.span>
          <motion.span
            className={`shrink-0 tabular-nums ${timeRemaining <= 30 ? "text-red-500 font-bold" : "text-yellow-500"}`}
            animate={{
              opacity: [1, 0.7, 1],
              scale: timeRemaining <= 30 ? [1, 1.08, 1] : 1,
            }}
            transition={{
              duration: timeRemaining <= 30 ? 0.8 : 1.5,
              repeat: Infinity,
            }}
          >
            {formatTime(timeRemaining)}
          </motion.span>
          <motion.span
            className="arcade-text flex min-w-0 flex-col items-end truncate text-right"
            animate={{ scale: cardCounts.cpu < 10 ? [1, 1.08, 1] : 1 }}
            transition={{
              duration: 0.5,
              repeat: cardCounts.cpu < 10 ? Infinity : 0,
              repeatDelay: 1.5,
            }}
          >
            CPU: {cardCounts.cpu}
            {!gameData.cpuHasNuke && (
              <span className="text-[0.6rem] font-bold leading-none text-red-500 sm:text-xs">
                NUKE USED
              </span>
            )}
          </motion.span>
        </motion.div>

        <motion.div
          className="game-cpu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="arcade-text mb-2 text-sm sm:text-lg">CPU&apos;s card</p>
          <div className="relative">
            <AnimatePresence>
              {cpuCardChange ? (
                <CardDelta
                  change={cpuCardChange}
                  className="absolute -right-8 top-0 z-50"
                  onDone={onCpuCardChangeDone}
                />
              ) : null}
            </AnimatePresence>
            <CardHand
              isPlayer={false}
              deckCount={gameData.cpuDeck.length}
              playCard={
                gameData.cpuCard
                  ? {
                      suit: gameData.cpuCard.suit,
                      display: gameData.cpuCard.display,
                      artId: gameData.cpuCard.artId,
                    }
                  : null
              }
            />
          </div>
        </motion.div>

        <motion.div className="game-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={delayedMessage}
              className={`max-w-full px-2 text-sm sm:text-xl ${timesUp ? "text-[#ff9900] font-bold" : "text-[#00ff00]"}`}
              style={{
                textShadow: timesUp ? "0 0 10px rgba(255, 153, 0, 0.8)" : "none",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, scale: timesUp ? [1, 1.04, 1] : 1 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {timeRemaining === 0
                ? "TIME'S UP - GAME OVER!"
                : delayedMessage.includes("LAUNCHED")
                  ? "Draw next card to continue"
                  : delayedMessage}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="game-player"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="relative">
            <AnimatePresence>
              {playerCardChange ? (
                <CardDelta
                  change={playerCardChange}
                  className="absolute -left-8 top-0 z-50"
                  onDone={onPlayerCardChangeDone}
                />
              ) : null}
            </AnimatePresence>
            <CardHand
              isPlayer
              deckCount={gameData.playerDeck.length}
              playCard={
                gameData.playerCard
                  ? {
                      suit: gameData.playerCard.suit,
                      display: gameData.playerCard.display,
                      artId: gameData.playerCard.artId,
                    }
                  : null
              }
              onDraw={onDrawCard}
            />
          </div>
          <p
            className="arcade-text mt-2 max-w-[70%] truncate text-sm sm:text-lg"
            title={playerLabel}
          >
            {playerLabel}
          </p>
        </motion.div>

        <motion.div
          className="game-actions flex w-full items-center justify-between"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <motion.button
            onClick={onBack}
            className="rounded border-2 border-yellow-400 px-3 py-1.5 text-xs font-bold text-yellow-400 sm:text-sm"
            style={{
              textShadow: "0 0 10px #ffd700",
              boxShadow: "0 0 10px rgba(255, 215, 0, 0.3), inset 0 0 10px rgba(255, 215, 0, 0.2)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            BACK
          </motion.button>

          <AnimatePresence mode="wait">
            {gameData.playerHasNuke ? (
              <motion.button
                key="nuke-button"
                onClick={onNuke}
                className="rounded border-2 border-red-500 px-3 py-1.5 text-xs font-bold text-red-500 sm:text-sm"
                style={{
                  textShadow: "0 0 10px #ff0000",
                  boxShadow: "0 0 10px rgba(255, 0, 0, 0.3), inset 0 0 10px rgba(255, 0, 0, 0.2)",
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
              >
                NUKE!
              </motion.button>
            ) : (
              <motion.div
                key="nuke-used"
                className="flex flex-col items-center justify-center rounded border-2 border-purple-500 px-3 py-1 text-[0.65rem] font-bold text-purple-500 sm:text-xs"
                style={{
                  textShadow: "0 0 10px #9c27b0",
                  boxShadow: "0 0 10px rgba(156, 39, 176, 0.3), inset 0 0 10px rgba(156, 39, 176, 0.2)",
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <span>NUKE</span>
                <span>USED</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
