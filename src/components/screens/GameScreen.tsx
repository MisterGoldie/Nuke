"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import CardComponent from "../Card";
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
      animate={{ y: -30, opacity: 1, scale: 1.2 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      onAnimationComplete={onDone}
    >
      <span
        className={`text-2xl font-bold ${change > 0 ? "text-green-500" : "text-red-500"}`}
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

function NukeUsedLabel({ color }: { color: "red" | "purple" }) {
  const isRed = color === "red";
  return (
    <motion.div
      className={`absolute bottom-16 left-12 text-lg flex flex-col items-center pointer-events-none ${isRed ? "text-red-500" : ""}`}
      style={{
        textShadow: isRed ? "0 0 10px #ff0000" : undefined,
        zIndex: 10,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: 1,
        textShadow: isRed
          ? ["0 0 10px #ff0000", "0 0 15px #ff0000", "0 0 10px #ff0000"]
          : undefined,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.4, textShadow: { duration: 1.5, repeat: Infinity } }}
    >
      <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
        NUKE
      </motion.span>
      <motion.span animate={{ y: [0, 2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
        USED
      </motion.span>
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
      className={`arcade-container relative overflow-hidden p-4 ${showNukeAnimation ? "nuke-border-flash" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ height: "695px" }}
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

      <AnimatePresence>
        {cpuCardChange ? (
          <CardDelta
            change={cpuCardChange}
            className="absolute top-[220px] right-[80px] z-50"
            onDone={onCpuCardChangeDone}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {playerCardChange ? (
          <CardDelta
            change={playerCardChange}
            className="absolute bottom-[150px] left-[80px] z-50"
            onDone={onPlayerCardChangeDone}
          />
        ) : null}
      </AnimatePresence>

      <motion.div
        className="absolute top-4 left-4 right-4 flex justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.span
          className="arcade-text text-lg"
          animate={{ scale: cardCounts.player < 10 ? [1, 1.1, 1] : 1 }}
          transition={{
            duration: 0.5,
            repeat: cardCounts.player < 10 ? Infinity : 0,
            repeatDelay: 1.5,
          }}
        >
          Your Cards: {cardCounts.player}
        </motion.span>
        <motion.span
          className={`text-lg ${timeRemaining <= 30 ? "text-red-500" : "text-yellow-500"}`}
          style={{
            textShadow: timeRemaining <= 30 ? "0 0 5px rgba(255, 0, 0, 0.7)" : "none",
            fontWeight: timeRemaining <= 30 ? "bold" : "normal",
          }}
          animate={{
            opacity: [1, 0.7, 1],
            scale: timeRemaining <= 30 ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: timeRemaining <= 30 ? 0.8 : 1.5,
            repeat: Infinity,
            repeatDelay: timeRemaining <= 30 ? 0.2 : 0.5,
          }}
        >
          {formatTime(timeRemaining)}
        </motion.span>
        <motion.span
          className="arcade-text text-lg"
          animate={{ scale: cardCounts.cpu < 10 ? [1, 1.1, 1] : 1 }}
          transition={{
            duration: 0.5,
            repeat: cardCounts.cpu < 10 ? Infinity : 0,
            repeatDelay: 1.5,
          }}
        >
          CPU Cards: {cardCounts.cpu}
        </motion.span>
      </motion.div>

      <motion.div
        className="text-center w-full flex flex-col items-center absolute top-[100px] left-0 right-0"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <motion.p
          className="arcade-text text-lg mb-4"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        >
          CPU&apos;s card
        </motion.p>
        <AnimatePresence>
          {!gameData.cpuHasNuke && <NukeUsedLabel color="red" />}
        </AnimatePresence>
        <CardComponent
          suit={gameData.cpuCard?.suit || ""}
          rank={gameData.cpuCard?.display || ""}
          isFlipped={gameData.cpuCard !== null}
          isPlayerCard={false}
        />
      </motion.div>

      <motion.div
        className="text-center text-xl absolute top-[360px] left-0 right-0"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={delayedMessage}
            className={timesUp ? "text-[#ff9900] font-bold text-2xl" : "text-[#00ff00]"}
            style={{
              textShadow: timesUp ? "0 0 10px rgba(255, 153, 0, 0.8)" : "none",
              position: "relative",
              zIndex: 1,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, scale: timesUp ? [1, 1.05, 1] : 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              duration: 0.3,
              scale: { duration: 0.8, repeat: timesUp ? Infinity : 0 },
            }}
          >
            {timeRemaining === 0 ? "TIME'S UP - GAME OVER!" : delayedMessage}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="text-center w-full flex flex-col items-center absolute top-[440px] left-0 right-0"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <CardComponent
          suit={gameData.playerCard?.suit || ""}
          rank={gameData.playerCard?.display || ""}
          isFlipped={gameData.playerCard !== null}
          isPlayerCard={true}
          onClick={onDrawCard}
          isNukeActive={showNukeAnimation}
        />
        <motion.p
          className="arcade-text text-lg mt-4 max-w-[60%] mx-auto truncate"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          title={playerLabel}
        >
          {playerLabel}
        </motion.p>
      </motion.div>

      <motion.div
        className="absolute bottom-4 left-4 right-4 flex justify-between items-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <motion.button
          onClick={onBack}
          className="text-sm py-1.5 px-3 text-yellow-400 font-bold border-2 border-yellow-400 rounded"
          style={{
            textShadow: "0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700",
            boxShadow: "0 0 10px rgba(255, 215, 0, 0.3), inset 0 0 10px rgba(255, 215, 0, 0.2)",
          }}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 15px rgba(255, 215, 0, 0.5), inset 0 0 15px rgba(255, 215, 0, 0.3)",
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          BACK
        </motion.button>

        <AnimatePresence mode="wait">
          {gameData.playerHasNuke ? (
            <motion.button
              key="nuke-button"
              onClick={onNuke}
              className="text-sm py-1.5 px-3 rounded border-2 text-red-500 border-red-500 font-bold"
              style={{
                textShadow: "0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000",
                boxShadow: "0 0 10px rgba(255, 0, 0, 0.3), inset 0 0 10px rgba(255, 0, 0, 0.2)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                boxShadow: [
                  "0 0 10px rgba(255, 0, 0, 0.3), inset 0 0 10px rgba(255, 0, 0, 0.2)",
                  "0 0 20px rgba(255, 0, 0, 0.5), inset 0 0 20px rgba(255, 0, 0, 0.3)",
                  "0 0 10px rgba(255, 0, 0, 0.3), inset 0 0 10px rgba(255, 0, 0, 0.2)",
                ],
              }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{
                scale: 1.1,
                boxShadow: "0 0 20px rgba(255, 0, 0, 0.6), inset 0 0 20px rgba(255, 0, 0, 0.4)",
              }}
              whileTap={{ scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 17,
                boxShadow: { duration: 2, repeat: Infinity },
              }}
            >
              NUKE!
            </motion.button>
          ) : (
            <motion.div
              key="nuke-used"
              className="text-xs py-1.5 px-3 rounded border-2 text-purple-500 border-purple-500 font-bold flex flex-col items-center justify-center"
              style={{
                textShadow: "0 0 10px #9c27b0, 0 0 20px #9c27b0, 0 0 30px #9c27b0",
                boxShadow: "0 0 10px rgba(156, 39, 176, 0.3), inset 0 0 10px rgba(156, 39, 176, 0.2)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                boxShadow: [
                  "0 0 10px rgba(156, 39, 176, 0.3), inset 0 0 10px rgba(156, 39, 176, 0.2)",
                  "0 0 20px rgba(156, 39, 176, 0.5), inset 0 0 20px rgba(156, 39, 176, 0.3)",
                  "0 0 10px rgba(156, 39, 176, 0.3), inset 0 0 10px rgba(156, 39, 176, 0.2)",
                ],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 17,
                boxShadow: { duration: 2, repeat: Infinity },
              }}
            >
              <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                NUKE
              </motion.span>
              <motion.span animate={{ y: [0, 2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                USED
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
