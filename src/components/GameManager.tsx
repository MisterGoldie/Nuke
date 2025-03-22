import { useCallback } from 'react';
import { LocalState, drawCards, handleNuke } from './gameLogic';

interface GameManagerProps {
  gameData: LocalState;
  setGameData: (state: LocalState | ((prevState: LocalState) => LocalState)) => void;
  setShowWarAnimation: (show: boolean) => void;
  setShowNukeAnimation: (show: boolean) => void;
  setNukeInitiator: (initiator: 'player' | 'cpu') => void;
  setIsProcessing: (processing: boolean) => void;
  handleGameEnd: (outcome: 'win' | 'loss' | 'tie', isTimeUp?: boolean) => Promise<void>;
  playNukeSound: () => void;
}

export function useGameManager({
  gameData,
  setGameData,
  setShowWarAnimation,
  setShowNukeAnimation,
  setNukeInitiator,
  setIsProcessing,
  handleGameEnd,
  playNukeSound
}: GameManagerProps) {
  const handleDrawCard = useCallback(() => {
    // Prevent any actions if the game is over
    if (gameData.gameOver) {
      return;
    }
    
    if (!gameData.playerCard && !gameData.cpuCard) {
      setIsProcessing(true);
      const newState = drawCards(gameData);
      setGameData(newState);

      setTimeout(() => {
        setIsProcessing(false);
        if (newState.isWar) {
          setShowWarAnimation(true);
        } else if (newState.gameOver) {
          const outcome = newState.message.includes('You win') ? 'win' : 'loss';
          handleGameEnd(outcome);
        }
      }, 500);
    }
  }, [gameData, setIsProcessing, setGameData, setShowWarAnimation, handleGameEnd]);

  const handleNukeClick = useCallback(() => {
    // Prevent any actions if the game is over
    if (gameData.gameOver) {
      return;
    }
    
    setIsProcessing(true);
    setGameData((prevState: LocalState) => {
      const newState = handleNuke(prevState, 'player');
      setShowNukeAnimation(true);
      setNukeInitiator('player');
      playNukeSound();

      setTimeout(() => {
        setShowNukeAnimation(false);
        setIsProcessing(false);
        if (newState.gameOver) {
          handleGameEnd('win');
        }
      }, 2000);
      return newState;
    });
  }, [gameData, setIsProcessing, setGameData, setShowNukeAnimation, setNukeInitiator, playNukeSound, handleGameEnd]);

  return { handleDrawCard, handleNukeClick };
}
