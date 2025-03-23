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
  setPlayerCardChange?: (change: number | null) => void;
  setCpuCardChange?: (change: number | null) => void;
}

export function useGameManager({
  gameData,
  setGameData,
  setShowWarAnimation,
  setShowNukeAnimation,
  setNukeInitiator,
  setIsProcessing,
  handleGameEnd,
  playNukeSound,
  setPlayerCardChange,
  setCpuCardChange
}: GameManagerProps) {
  const handleDrawCard = useCallback(() => {
    // Prevent any actions if the game is over or processing
    if (gameData.gameOver || gameData.isWar) {
      return;
    }
    
    // Check if game should be over before drawing cards
    if (gameData.playerDeck.length === 0 || gameData.cpuDeck.length === 0 || 
        gameData.playerDeck.length === 52 || gameData.cpuDeck.length === 52) {
      // Determine winner
      const winner = gameData.playerDeck.length > 0 ? 'player' : 'cpu';
      const endMessage = `GAME OVER - ${winner === 'player' ? 'YOU' : 'CPU'} WINS!`;
      
      // Update game state to game over
      setGameData(prev => ({
        ...prev,
        gameOver: true,
        message: endMessage
      }));
      
      handleGameEnd(winner === 'player' ? 'win' : 'loss', false);
      return;
    }
    
    if (!gameData.playerCard && !gameData.cpuCard) {
      setIsProcessing(true);
      const prevPlayerDeckLength = gameData.playerDeck.length;
      const prevCpuDeckLength = gameData.cpuDeck.length;
      
      const newState = drawCards(gameData);
      setGameData(newState);

      // Set a slight delay before showing the card change animations
      // This allows the card flip animations to complete first
      setTimeout(() => {
        // Calculate card changes for animation
        const playerDeckChange = newState.playerDeck.length - prevPlayerDeckLength;
        const cpuDeckChange = newState.cpuDeck.length - prevCpuDeckLength;
        
        // Only show animations if there was an actual change
        if (playerDeckChange !== 0 && setPlayerCardChange) {
          setPlayerCardChange(playerDeckChange);
        }
        
        if (cpuDeckChange !== 0 && setCpuCardChange) {
          setCpuCardChange(cpuDeckChange);
        }
      }, 300); // Delay the +1/-1 animations to start after cards have flipped

      setTimeout(() => {
        setIsProcessing(false);
        // Only trigger war animation if it's not already being handled in the Demo component
        // This prevents the war from being processed twice
        if (newState.isWar && !newState.isWarBeingHandled) {
          // Mark that we're handling the war to prevent duplicate processing
          setGameData(prevState => ({
            ...prevState,
            isWarBeingHandled: true
          }));
          setShowWarAnimation(true);
        } else if (newState.gameOver) {
          const outcome = newState.message.includes('You win') ? 'win' : 'loss';
          handleGameEnd(outcome);
        }
      }, 800); // Extended to allow animations to complete
    }
  }, [gameData, setIsProcessing, setGameData, setShowWarAnimation, handleGameEnd]);

  const handleNukeClick = useCallback(() => {
    // Prevent any actions if the game is over
    if (gameData.gameOver) {
      return;
    }
    
    setIsProcessing(true);
    setGameData((prevState: LocalState) => {
      const prevPlayerDeckLength = prevState.playerDeck.length;
      const prevCpuDeckLength = prevState.cpuDeck.length;
      
      const newState = handleNuke(prevState, 'player');
      setShowNukeAnimation(true);
      setNukeInitiator('player');
      playNukeSound();
      
      // Delay the card change animations to start after the nuke animation begins
      setTimeout(() => {
        // Calculate card changes for animation
        const playerDeckChange = newState.playerDeck.length - prevPlayerDeckLength;
        const cpuDeckChange = newState.cpuDeck.length - prevCpuDeckLength;
        
        // Only show animations if there was an actual change
        if (playerDeckChange !== 0 && setPlayerCardChange) {
          setPlayerCardChange(playerDeckChange);
        }
        
        if (cpuDeckChange !== 0 && setCpuCardChange) {
          setCpuCardChange(cpuDeckChange);
        }
      }, 1000); // Show +1/-1 animations midway through the nuke animation

      setTimeout(() => {
        setShowNukeAnimation(false);
        setIsProcessing(false);
        if (newState.gameOver) {
          handleGameEnd('win');
        }
      }, 2000);
      return newState;
    });
  }, [gameData, setIsProcessing, setGameData, setShowNukeAnimation, setNukeInitiator, playNukeSound, handleGameEnd, setPlayerCardChange, setCpuCardChange]);

  return { handleDrawCard, handleNukeClick };
}
