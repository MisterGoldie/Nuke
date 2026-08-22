import { useCallback } from 'react';
import {
  LocalState,
  drawCards,
  handleNuke,
  getDisplayCounts,
  declareWinner,
} from './gameLogic';
import { TRICK_RESULT_MS } from './playTiming';

interface GameManagerProps {
  gameData: LocalState;
  setGameData: (state: LocalState | ((prevState: LocalState) => LocalState)) => void;
  setShowNukeAnimation: (show: boolean) => void;
  setNukeInitiator: (initiator: 'player' | 'cpu') => void;
  setIsProcessing: (processing: boolean) => void;
  handleGameEnd: (outcome: 'win' | 'loss' | 'tie', isTimeUp?: boolean) => Promise<void>;
  playNukeSound: () => void;
  setPlayerCardChange?: (change: number | null) => void;
  setCpuCardChange?: (change: number | null) => void;
  setDelayedMessage?: (message: string) => void;
}

function trickDelta(state: LocalState): { player: number; cpu: number } {
  if (!state.playerCard || !state.cpuCard) {
    return { player: 0, cpu: 0 };
  }
  if (state.playerCard.rank > state.cpuCard.rank) {
    return { player: 1, cpu: -1 };
  }
  if (state.cpuCard.rank > state.playerCard.rank) {
    return { player: -1, cpu: 1 };
  }
  return { player: 0, cpu: 0 };
}

export function useGameManager({
  gameData,
  setGameData,
  setShowNukeAnimation,
  setNukeInitiator,
  setIsProcessing,
  handleGameEnd,
  playNukeSound,
  setPlayerCardChange,
  setCpuCardChange,
  setDelayedMessage,
}: GameManagerProps) {
  const handleDrawCard = useCallback(() => {
    if (gameData.gameOver || gameData.isWar || gameData.isNukeActive) {
      return;
    }

    const counts = getDisplayCounts(gameData);
    if (counts.player === 0 || counts.cpu === 0 || counts.player === 52 || counts.cpu === 52) {
      const winner = counts.player > 0 ? 'player' : 'cpu';
      setGameData(prev => declareWinner(
        prev,
        winner,
        winner === 'player' ? 'GAME OVER - YOU WIN!' : 'GAME OVER - CPU WINS!',
      ));
      handleGameEnd(winner === 'player' ? 'win' : 'loss', false);
      return;
    }

    if (!gameData.playerCard && !gameData.cpuCard) {
      setIsProcessing(true);
      const prevCounts = getDisplayCounts(gameData);
      const newState = drawCards(gameData);
      setGameData(newState);

      setTimeout(() => {
        if (newState.isWar) return;
        const nextCounts = getDisplayCounts(newState);
        let playerDeckChange = nextCounts.player - prevCounts.player;
        let cpuDeckChange = nextCounts.cpu - prevCounts.cpu;

        if (playerDeckChange === 0 && cpuDeckChange === 0) {
          const pending = trickDelta(newState);
          playerDeckChange = pending.player;
          cpuDeckChange = pending.cpu;
        }

        if (playerDeckChange !== 0 && setPlayerCardChange) {
          setPlayerCardChange(playerDeckChange);
        }
        if (cpuDeckChange !== 0 && setCpuCardChange) {
          setCpuCardChange(cpuDeckChange);
        }
      }, TRICK_RESULT_MS);

      setTimeout(() => {
        if (newState.isWar) return;
        setIsProcessing(false);
        if (newState.gameOver) {
          const outcome = newState.message.includes('YOU WIN') || newState.message.includes('You win')
            ? 'win'
            : 'loss';
          handleGameEnd(outcome);
        }
      }, 800);
    }
  }, [gameData, setIsProcessing, setGameData, handleGameEnd, setPlayerCardChange, setCpuCardChange]);

  const handleNukeClick = useCallback(() => {
    if (gameData.gameOver || gameData.isWar || gameData.isNukeActive || !gameData.playerHasNuke) {
      return;
    }

    setIsProcessing(true);
    setGameData((prevState: LocalState) => {
      const prevCounts = getDisplayCounts(prevState);
      const newState = handleNuke(prevState, 'player');

      setShowNukeAnimation(true);
      setNukeInitiator('player');
      playNukeSound();

      setTimeout(() => {
        const nextCounts = getDisplayCounts(newState);
        const playerDeckChange = nextCounts.player - prevCounts.player;
        const cpuDeckChange = nextCounts.cpu - prevCounts.cpu;

        if (playerDeckChange !== 0 && setPlayerCardChange) {
          setPlayerCardChange(playerDeckChange);
        }
        if (cpuDeckChange !== 0 && setCpuCardChange) {
          setCpuCardChange(cpuDeckChange);
        }
      }, 1000);

      setTimeout(() => {
        setShowNukeAnimation(false);

        if (newState.message.includes("CPU has fewer than 10 cards")) {
          setGameData(prev => declareWinner(prev, 'player', "Game Over - You win with a NUKE!"));
          setIsProcessing(false);
          handleGameEnd('win');
        } else {
          setGameData(prev => ({
            ...prev,
            playerCard: null,
            cpuCard: null,
            isNukeActive: false,
            readyForNextCard: true,
            message: "Draw next card to continue",
          }));
          setDelayedMessage?.("Draw next card to continue");
          setPlayerCardChange?.(null);
          setCpuCardChange?.(null);
          setTimeout(() => {
            setIsProcessing(false);
          }, 100);
        }
      }, 2500);

      return newState;
    });
  }, [gameData, setIsProcessing, setGameData, setShowNukeAnimation, setNukeInitiator, playNukeSound, handleGameEnd, setPlayerCardChange, setCpuCardChange, setDelayedMessage]);

  return { handleDrawCard, handleNukeClick };
}
