"use client";

import { useEffect, useCallback, useState, useContext, useMemo } from "react";
import sdk, { FrameContext } from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import Leaderboard from './Leaderboard';
import Image from 'next/image';
import { LocalState, Card, initializeGame, drawCards, handleNuke } from './gameLogic';
import CardComponent from './Card';
import dynamic from 'next/dynamic';
import { soundCache, preloadAssets } from '~/utils/optimizations';
import HowToPlay from './HowToPlay';
import { fetchUserDataByFid } from '../utils/neynarUtils';
import SoundToggle from './SoundToggle';
import { useGameManager } from './GameManager';
import { motion, AnimatePresence } from 'framer-motion';
import ExplosionBackground from './ExplosionBackground';

type GameState = 'menu' | 'game' | 'leaderboard' | 'tutorial';

// Add interface for your context type
interface ExtendedFrameContext extends FrameContext {
  fid?: string;  // Add fid as optional 
}

// Add dynamic imports for animations
const WarAnimation = dynamic(() => import('./WarAnimation'), {
  ssr: false,
  loading: () => null
});

const NukeAnimation = dynamic(() => import('./NukeAnimation'), {
  ssr: false,
  loading: () => null
});

export default function Demo() {
  // State declarations first
  const [isMuted, setIsMuted] = useState(() => {
    const savedMute = localStorage.getItem('isMuted');
    return savedMute === 'true';
  });
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameData, setGameData] = useState<LocalState>(initializeGame());
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<ExtendedFrameContext | null>(null);
  const [isFrameLoaded, setIsFrameLoaded] = useState(false);
  const [showWarAnimation, setShowWarAnimation] = useState(false);
  const [showNukeAnimation, setShowNukeAnimation] = useState(false);
  const [nukeInitiator, setNukeInitiator] = useState<'player' | 'cpu'>('player');
  const [delayedMessage, setDelayedMessage] = useState<string>("Draw card to begin");
  const [isFirstCard, setIsFirstCard] = useState(true);
  const [username, setUsername] = useState<string>('Your');
  const [hasSubmittedResult, setHasSubmittedResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(240); // 240 seconds = 4 minutes
  const [isGameLocked, setIsGameLocked] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [playerCardChange, setPlayerCardChange] = useState<number | null>(null);
  const [cpuCardChange, setCpuCardChange] = useState<number | null>(null);

  // Add effect to handle muting across all states
  useEffect(() => {
    // Save mute state to localStorage
    localStorage.setItem('isMuted', isMuted.toString());
    
    // Get all audio elements from the cache
    const audioElements = Array.from(soundCache.values());
    
    // Update mute state for all audio elements
    audioElements.forEach(audio => {
      if (audio) {
        audio.muted = isMuted;
        if (isMuted) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
    });
  }, [isMuted, gameState]); // Add gameState as dependency to ensure it runs on state changes

  // Sound function declarations (move these to the top)
  const playWarSound = useCallback(() => {
    const warSound = soundCache.get('/sounds/war.mp3');
    if (warSound && !isMuted) {
      warSound.currentTime = 0;
      warSound.volume = 0.75;
      warSound.play();
    }
  }, [isMuted]);

  const playNukeSound = useCallback(() => {
    const nukeSound = soundCache.get('/sounds/nuke.mp3');
    if (nukeSound && !isMuted) {
      nukeSound.currentTime = 0;
      nukeSound.volume = 0.75;
      nukeSound.play();
    }
  }, [isMuted]);

  const handleGameEnd = useCallback(async (outcome: 'win' | 'loss' | 'tie', isTimeUp: boolean = false) => {
    if (hasSubmittedResult || isGameLocked) {
        console.log("Game already ended, skipping...");
        return;
    }

    setIsGameLocked(true);
    setIsTimerRunning(false);
    
    // If the game ended because the timer ran out, don't record any outcome
    // Timer expiration should not count as a win, loss, or tie for leaderboard purposes
    if (isTimeUp) {
        console.log("Timer expired - not recording any outcome");
        return;
    }
    
    if (!context?.user?.fid) {
        console.log("Waiting for FID to load...");
        return;
    }

    try {
        const gameResult = {
            playerFid: context.user.fid.toString(),
            outcome: outcome
        };
        
        console.log("Sending game result:", gameResult);
        const response = await fetch('/api/nuke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameResult),
        });

        if (!response.ok) {
            throw new Error('Failed to store game result');
        }

        setHasSubmittedResult(true);
        console.log('Game result stored successfully!');
    } catch (error) {
        console.error('Error in handleGameEnd:', error);
    }
}, [context?.user?.fid, hasSubmittedResult, isGameLocked]);

  const { handleDrawCard, handleNukeClick } = useGameManager({
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
  });

  useEffect(() => {
    const load = async () => {
      console.log("Loading SDK...");
      try {
        const ctx = await sdk.context;
        console.log("Got context:", ctx);
        setContext(ctx);
        
        // Get FID from context
        const fid = ctx?.user?.fid;
        if (fid) {
          // Use the same query method from the Frog app
          const query = `
            query ($fid: String!) {
              Socials(input: {filter: {dappName: {_eq: farcaster}, userId: {_eq: $fid}}, blockchain: ethereum}) {
                Social {
                  profileName
                }
              }
            }
          `;

          try {
            const response = await fetch(process.env.NEXT_PUBLIC_AIRSTACK_API_URL!, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.NEXT_PUBLIC_AIRSTACK_API_KEY!,
              },
              body: JSON.stringify({ 
                query, 
                variables: { fid: fid.toString() } 
              }),
            });

            const data = await response.json();
            const fetchedUsername = data?.data?.Socials?.Social?.[0]?.profileName;
            setUsername(fetchedUsername || 'Your');
          } catch (error) {
            console.error('Error fetching username:', error);
            setUsername('Your');
          }
        }

        await sdk.actions.ready();
        console.log("SDK Ready - Game State:", gameState);
        setTimeout(() => {
          setIsFrameLoaded(true);
        }, 1000);
      } catch (err) {
        console.error("SDK Error:", err);
        setUsername('Your');
      }
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded, gameState, fetchUserDataByFid]);

  // State for war animation sequence
  const [warStage, setWarStage] = useState<'initial' | 'showing-cards' | 'drawing-cards' | 'revealing-winner' | 'complete'>('initial');
  const [warCards, setWarCards] = useState<{player: any[], cpu: any[]}>({player: [], cpu: []});
  const [warWinner, setWarWinner] = useState<'player' | 'cpu' | undefined>(undefined);
  const [warWinningCard, setWarWinningCard] = useState<any>(undefined);
  
  // Effect for War animation
  useEffect(() => {
    let warTimer: NodeJS.Timeout;
    
    if (gameData.isWar && !gameData.gameOver && !gameData.isWarBeingHandled) {
      // Mark that we're handling the war to prevent duplicate processing
      setGameData(prevState => ({
        ...prevState,
        isWarBeingHandled: true
      }));
      
      // IMMEDIATELY check if either player doesn't have enough cards to complete a war
      // For a war, a player needs 5 cards total (1 in play + 3 face down + 1 final card)
      const playerTotalCards = 1 + gameData.playerDeck.length; // 1 card in play + cards in deck
      const cpuTotalCards = 1 + gameData.cpuDeck.length; // 1 card in play + cards in deck
      
      // If either player has 4 or fewer cards total, they can't complete the war
      if (playerTotalCards <= 5 || cpuTotalCards <= 5) {
        console.log('Low card count in war detected:', { playerTotalCards, cpuTotalCards });
        
        // Determine the winner based on who has more cards
        const winner = playerTotalCards > cpuTotalCards ? 'player' : 'cpu';
        const message = `GAME OVER - ${winner === 'player' ? username.toUpperCase() : 'CPU'} WINS!`;
        
        // Stop the timer
        setIsTimerRunning(false);
        
        // DON'T show any war animation
        setWarStage('initial');
        setShowWarAnimation(false);
        setIsProcessing(false);
        
        // Update game state to game over immediately
        setGameData(prev => ({
          ...prev,
          gameOver: true,
          message: message,
          isWarBeingHandled: false,
          isWar: false,
          playerCard: null,
          cpuCard: null,
          warPile: []
        }));
        
        // Make sure the message is visible
        setDelayedMessage(message);
        
        // Record the game outcome
        handleGameEnd(winner === 'player' ? 'win' : 'loss');
        
        return () => {};
      }
      
      // For a war, each player needs 3 cards from their deck (the initial matching cards are already in play)
      // So we check if either player has fewer than 3 cards left in their deck
      if (gameData.playerDeck.length < 3 || gameData.cpuDeck.length < 3) {
        // End game immediately if not enough cards
        const winner = gameData.playerDeck.length < 3 ? 'cpu' : 'player';
        const message = `GAME OVER - ${winner === 'player' ? username.toUpperCase() : 'CPU'} WINS!`;
        
        // Stop the timer
        setIsTimerRunning(false);
        
        // Immediately clear war state to prevent animation issues
        setWarStage('initial');
        setShowWarAnimation(false);
        
        // Immediately clear processing state to unfreeze the UI
        setIsProcessing(false);
        
        setTimeout(() => {
          // Update game state to game over
          setGameData(prev => ({
            ...prev,
            gameOver: true,
            message: message,
            isWarBeingHandled: false,
            isWar: false,
            // Clear any cards in play to prevent animation issues
            playerCard: null,
            cpuCard: null,
            warPile: []
          }));
          
          // Make sure the message displays properly
          setDelayedMessage(message);
        }, 500);
        
        return () => {};
      }
      
      // This check was moved to the beginning of the war effect
      // and is handled there without starting the animation
      if (false) {
        // Player will run out of cards during or after this war
        // Using constants to avoid variable reference errors
        const winner = 'player'; // Placeholder, never used
        const message = `GAME OVER - ${winner === 'player' ? username.toUpperCase() : 'CPU'} WINS!`;
        
        // Stop the timer
        setIsTimerRunning(false);
        
        // Immediately clear war state to prevent animation issues
        setWarStage('initial');
        setShowWarAnimation(false);
        
        // Immediately clear processing state to unfreeze the UI
        setIsProcessing(false);
        
        setTimeout(() => {
          // Update game state to game over
          setGameData(prev => ({
            ...prev,
            gameOver: true,
            message: message,
            isWarBeingHandled: false,
            isWar: false,
            // Clear any cards in play to prevent animation issues
            playerCard: null,
            cpuCard: null,
            warPile: []
          }));
          
          // Make sure the message displays properly
          setDelayedMessage(message);
        }, 500);
        
        return () => {};
      }
      
      // Reset war animation state
      setWarStage('initial');
      setIsProcessing(true);
      
      // First show the matching cards
      setWarStage('showing-cards');
      playWarSound();
      
      // After 1.5 seconds, show the war animation
      warTimer = setTimeout(() => {
        // Double-check that both players still have enough cards for war
        if (gameData.playerDeck.length < 3 || gameData.cpuDeck.length < 3) {
          // End game immediately if not enough cards
          const winner = gameData.playerDeck.length < 3 ? 'cpu' : 'player';
          const message = `GAME OVER - ${winner === 'player' ? username.toUpperCase() : 'CPU'} WINS!`;
          
          // Immediately clear war state to prevent animation issues
          setWarStage('initial');
          setShowWarAnimation(false);
          setIsProcessing(false); // CRITICAL: Clear processing state to unfreeze UI
          
          // Update game state to game over
          setGameData(prev => ({
            ...prev,
            gameOver: true,
            message: message,
            isWarBeingHandled: false,
            isWar: false,
            // Clear any cards in play to prevent animation issues
            playerCard: null,
            cpuCard: null,
            warPile: []
          }));
          
          // Make sure the message is immediately visible
          setDelayedMessage(message);
          return;
        }
        
        // Also check if a player doesn't have enough cards to complete a war
        // For a war, you need: 1 card already in play + 3 face down + 1 turned card = 5 cards total
        // So we end the game if a player has 4 or fewer total cards
        const playerTotalCards = 1 + gameData.playerDeck.length; // 1 card in play + cards in deck
        const cpuTotalCards = 1 + gameData.cpuDeck.length; // 1 card in play + cards in deck
        
        if (playerTotalCards <= 5 || cpuTotalCards <= 5) {
          console.log('Low card count in war detected:', { playerTotalCards, cpuTotalCards });
          // Player will run out of cards during this war
          const winner = playerTotalCards > cpuTotalCards ? 'player' : 'cpu';
          const message = `GAME OVER - ${winner === 'player' ? username.toUpperCase() : 'CPU'} WINS!`;
          
          // Immediately clear war state to prevent animation issues
          setWarStage('initial');
          setShowWarAnimation(false);
          setIsProcessing(false); // CRITICAL: Clear processing state to unfreeze UI
          
          // Update game state to game over
          setGameData(prev => ({
            ...prev,
            gameOver: true,
            message: message,
            isWarBeingHandled: false,
            isWar: false,
            playerCard: null,
            cpuCard: null,
            warPile: []
          }));
          
          // Make sure the message is immediately visible
          setDelayedMessage(message);
          return;
        }
        
        // Continue with war animation if both players have enough cards
        setShowWarAnimation(true);
        setWarStage('drawing-cards');
        
        // Generate visual cards for animation - just for display purposes
        // We'll use the first 3 cards from each deck for visual effect
        // The actual cards will be properly handled when distributing after the war
        const playerVisualCards = gameData.playerDeck.slice(0, Math.min(3, gameData.playerDeck.length));
        const cpuVisualCards = gameData.cpuDeck.slice(0, Math.min(3, gameData.cpuDeck.length));
        setWarCards({player: playerVisualCards, cpu: cpuVisualCards});
        
        // After 3 more seconds, first show the revealing-winner stage with the 4th card
        const completeTimer = setTimeout(() => {
          if (!gameData.gameOver) {  // Additional check before updating state
            // Determine war winner randomly (50/50 chance)
            const winner = Math.random() < 0.5 ? 'player' : 'cpu';
            setWarWinner(winner);
            
            // Create different cards for each player
            const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
            
            // Use different suits for player and CPU
            const playerSuit = suits[Math.floor(Math.random() * suits.length)];
            let cpuSuit;
            do {
              cpuSuit = suits[Math.floor(Math.random() * suits.length)];
            } while (cpuSuit === playerSuit); // Make sure suits are different
            
            // Higher rank (A, K, Q) for winner, lower rank (J, 10, 9) for loser
            const highRanks = ['Q', 'K', 'A'];
            const lowRanks = ['9', '10', 'J'];
            
            const winnerRank = highRanks[Math.floor(Math.random() * highRanks.length)];
            const loserRank = lowRanks[Math.floor(Math.random() * lowRanks.length)];
            
            // Create the card object with appropriate properties
            const winningCard = {
              playerSuit,
              cpuSuit,
              playerRank: winner === 'player' ? winnerRank : loserRank,
              cpuRank: winner === 'cpu' ? winnerRank : loserRank,
              display: winner === 'player' ? winnerRank : loserRank, // For backward compatibility
              suit: winner === 'player' ? playerSuit : cpuSuit // For backward compatibility
            };
            setWarWinningCard(winningCard);
            
            // First show the revealing-winner stage with the 4th deciding card
            setWarStage('revealing-winner');
            
            // After 2 seconds, show the complete war animation with winner
            setTimeout(() => {
              setWarStage('complete');
            
              // After 3 more seconds, hide the animation and continue the game
              const finalTimer = setTimeout(() => {
                setShowWarAnimation(false);
              
              // Create a new game state instead of modifying the existing one
              // This ensures we're not carrying over any war-related state
              const updatedState = {
                ...gameData,
                // Clear all war-related flags and data
                isWar: false,
                isWarBeingHandled: false, // Reset this flag to prevent issues with future wars
                warPile: [],
                readyForNextCard: true,
                playerCard: null,
                cpuCard: null
              };
              
              // In a standard war, the game logic has already put 8 cards into the war pile:
              // - 2 matching cards that started the war
              // - 3 cards from each player's deck
              // Total: 8 cards in the war pile
              
              // IMPORTANT: We need to make sure all 8 cards from the war pile go to the winner
              // The war pile should already contain all the cards from the war
              const warPile = gameData.warPile || [];
              
              // We don't need to take more cards from the players' decks
              // since the game logic already did that
              
              // Create copies of the decks to work with
              const playerDeckCopy = [...gameData.playerDeck];
              const cpuDeckCopy = [...gameData.cpuDeck];
              
              // Log the card counts for verification
              console.log('War card distribution:', {
                warPileCount: warPile.length,
                playerDeckCount: playerDeckCopy.length,
                cpuDeckCount: cpuDeckCopy.length,
                totalCards: warPile.length + playerDeckCopy.length + cpuDeckCopy.length
              });
              
              // All cards in the war pile go to the winner
              const allWageredCards = [...warPile];
              
              // The war pile should have 8 cards (2 matching + 3 from each player)
              // If it doesn't, something went wrong
              if (warPile.length !== 8) {
                console.warn(`War pile has ${warPile.length} cards instead of the expected 8 cards`);
                
                // If the war pile doesn't have 8 cards, we need to make sure the total card count is still 52
                // This is a safety measure to ensure the game state remains valid
                const missingCards = 8 - warPile.length;
                console.log(`Adding ${missingCards} missing cards to the war pile to maintain total card count`);
                
                // Create dummy cards to maintain the correct total
                for (let i = 0; i < missingCards; i++) {
                  allWageredCards.push({
                    rank: 2, // Lowest rank
                    suit: '♠️',
                    display: '2',
                    symbol: '2♠️'
                  });
                }
              }
              
              // Update the decks based on the winner
              if (winner === 'player') {
                updatedState.playerDeck = [...playerDeckCopy, ...allWageredCards];
                updatedState.cpuDeck = [...cpuDeckCopy];
                // Store the war result in a temporary variable for logging purposes
                const warResult = `${username} wins WAR with ${winningCard.display}${winningCard.suit}! (${allWageredCards.length} cards won)`;
                console.log(warResult);
                // Set the message to prompt the user to continue
                updatedState.message = "Draw next card to continue";
              } else {
                updatedState.playerDeck = [...playerDeckCopy];
                updatedState.cpuDeck = [...cpuDeckCopy, ...allWageredCards];
                // Store the war result in a temporary variable for logging purposes
                const warResult = `CPU wins WAR with ${winningCard.display}${winningCard.suit}! (${allWageredCards.length} cards won)`;
                console.log(warResult);
                // Set the message to prompt the user to continue
                updatedState.message = "Draw next card to continue";
              }
              
              // Log the card counts for debugging
              console.log('War results:', {
                winner,
                warPileSize: warPile.length,
                totalWagered: allWageredCards.length,
                newPlayerCount: updatedState.playerDeck.length,
                newCpuCount: updatedState.cpuDeck.length,
                totalCards: updatedState.playerDeck.length + updatedState.cpuDeck.length
              });
              
              // Make sure the next draw won't immediately trigger another war
              if (updatedState.playerDeck.length > 0 && updatedState.cpuDeck.length > 0) {
                // If the top cards would cause another war, move one of them down in the deck
                if (updatedState.playerDeck[0]?.rank === updatedState.cpuDeck[0]?.rank) {
                  // Move the player's top card to a random position in their deck
                  const topCard = updatedState.playerDeck.shift();
                  if (topCard && updatedState.playerDeck.length > 0) {
                    const randomPosition = Math.floor(Math.random() * updatedState.playerDeck.length);
                    updatedState.playerDeck.splice(randomPosition, 0, topCard);
                  } else {
                    // If there was only one card, put it back
                    if (topCard) updatedState.playerDeck.push(topCard);
                  }
                }
              }
              
              // Check if either player has run out of cards after the war
              if (updatedState.playerDeck.length === 0 || updatedState.cpuDeck.length === 0) {
                // Determine the winner based on who has cards left
                const gameWinner = updatedState.playerDeck.length > 0 ? 'player' : 'cpu';
                const gameOverMessage = `GAME OVER - ${gameWinner === 'player' ? username.toUpperCase() : 'CPU'} WINS!`;
                
                // Update game state to show game over message
                updatedState.gameOver = true;
                updatedState.message = gameOverMessage;
                updatedState.readyForNextCard = false;
                
                // Make sure the message is immediately visible
                setDelayedMessage(gameOverMessage);
                
                // Record the game outcome
                handleGameEnd(gameWinner === 'player' ? 'win' : 'loss');
                
                console.log(`Game over after war! ${gameWinner === 'player' ? username : 'CPU'} wins!`);
              } else if (updatedState.playerDeck.length <= 5) {
                // Player is dangerously low on cards - add a warning
                updatedState.message = `WARNING: You only have ${updatedState.playerDeck.length} cards left!`;
              }
              
              // Update the game state with our changes
              setGameData(updatedState);
              setIsProcessing(false);
              
              // Reset war animation states
              setWarWinner(undefined);
              setWarWinningCard(undefined);
            }, 3000);
            
              return () => clearTimeout(finalTimer);
            }, 3000);
          }
        }, 2000);
        
        return () => clearTimeout(completeTimer);
      }, 1500);
    }
    
    return () => {
      if (warTimer) {
        clearTimeout(warTimer);
      }
      setIsProcessing(false);
    };
  }, [gameData.isWar, gameData.gameOver, gameData.playerDeck, gameData.cpuDeck, playWarSound]);

  useEffect(() => {
    if (gameData.isNukeActive) {
        setShowNukeAnimation(true);
        setNukeInitiator(gameData.message.includes("CPU") ? 'cpu' : 'player');
        playNukeSound();
        
        const timer = setTimeout(() => {
            setShowNukeAnimation(false);
            
            // Check if this was a game-ending nuke message
            if (gameData.message.includes("Player has fewer than 10 cards")) {
                // CPU wins because player had fewer than 10 cards
                setGameData(prev => ({
                    ...prev,
                    isNukeActive: false,
                    gameOver: true,
                    message: "Game Over - CPU wins with a NUKE!"
                }));
                handleGameEnd('loss');
            } else {
                // Normal nuke completion - completely reset card state for proper animation timing
                setGameData(prev => {
                    // Create a fresh state copy to ensure animation timings reset properly
                    return {
                        ...prev,
                        isNukeActive: false,
                        // Completely reset card state for proper animation timing
                        playerCard: null,
                        cpuCard: null,
                        readyForNextCard: true,
                        message: "Draw next card to continue"
                    };
                });
                
                // Add a small delay before allowing the next card draw
                // This ensures animation timing is reset properly
                setTimeout(() => {
                    setIsProcessing(false);
                }, 100);
            }
            // Only set isProcessing to false for the game-ending case
            // For normal case, it's handled in the setTimeout above
            if (gameData.message.includes("Player has fewer than 10 cards")) {
                setIsProcessing(false);
            }
        }, 2500); // Reduced timing for better responsiveness while still showing full animation
        
        return () => {
            clearTimeout(timer);
            setIsProcessing(false);
        };
    }
  }, [gameData.isNukeActive, gameData.message, playNukeSound, handleGameEnd]);

  // Add effect to handle CPU NUKE sound
  useEffect(() => {
    if (gameData.isNukeActive && !gameData.cpuHasNuke) {
      // CPU just used their NUKE
      playNukeSound();
    }
  }, [gameData.isNukeActive, gameData.cpuHasNuke]);

  useEffect(() => {
    // Only reset the message if the game is not over
    if (gameData.readyForNextCard && !gameData.gameOver) {
        const timer = setTimeout(() => {
            setGameData(prevState => ({
                ...prevState,
                playerCard: null,
                cpuCard: null,
                readyForNextCard: false,
                message: "Draw next card to continue"
            }));
        }, gameData.warPile.length > 0 ? 4000 : 2000);  // 4 seconds for WAR, 2 seconds for normal

        return () => clearTimeout(timer);
    }
  }, [gameData.readyForNextCard, gameData.gameOver]);

  // Start gameplay music when tutorial starts and keep it playing through game
  useEffect(() => {
    console.log('Game State Changed:', gameState);
    const gameplayMusic = soundCache.get('/sounds/gameplay.mp3');
    const leaderboardMusic = soundCache.get('/sounds/boomsback.mp3');
    
    // Handle leaderboard music
    if (gameState === 'leaderboard' && leaderboardMusic) {
      // Stop gameplay music if playing
      if (gameplayMusic && !gameplayMusic.paused) {
        gameplayMusic.pause();
        gameplayMusic.currentTime = 0;
      }
      
      // Start leaderboard music
      leaderboardMusic.volume = 0.5;
      leaderboardMusic.loop = true;
      
      if (leaderboardMusic.paused) {
        const playPromise = leaderboardMusic.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Leaderboard music started successfully');
            })
            .catch((error: Error) => {
              console.error('Leaderboard music failed to play:', error);
            });
        }
      }
      
      return () => {
        leaderboardMusic.pause();
        leaderboardMusic.currentTime = 0;
      };
    }
    
    // Handle gameplay music
    if ((gameState === 'tutorial' || gameState === 'game') && gameplayMusic) {
      // Stop leaderboard music if playing
      if (leaderboardMusic && !leaderboardMusic.paused) {
        leaderboardMusic.pause();
        leaderboardMusic.currentTime = 0;
      }
      
      // Start gameplay music
      gameplayMusic.volume = 0.2;
      gameplayMusic.loop = true;
      
      if (gameplayMusic.paused) {
        const playPromise = gameplayMusic.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Gameplay music started successfully');
            })
            .catch((error: Error) => {
              console.error('Gameplay music failed to play:', error);
            });
        }
      }
      
      return () => {
        if (['menu', 'leaderboard'].includes(gameState)) {
          gameplayMusic.pause();
          gameplayMusic.currentTime = 0;
        }
      };
    }
  }, [gameState]);

  // Make sure preloadAssets is called when component mounts
  useEffect(() => {
    preloadAssets(isMuted);
  }, [isMuted]);

  // Handle the initial card flip messages
  useEffect(() => {
    if (gameData.playerCard && gameData.cpuCard) {
        if (isFirstCard) {
            setIsFirstCard(false);
        }
        
        setDelayedMessage("");
        
        const resultTimer = setTimeout(() => {
            // If no username found (username === 'Your'), replace "You" with "Player"
            // Otherwise, replace "You" with the actual username
            const message = username === 'Your' 
                ? gameData.message.replace(/You/g, 'Player')
                : gameData.message.replace(/You/g, username);
            
            setDelayedMessage(message);
            
            // Only set the "Draw next card" message if the game is not over
            if (!gameData.gameOver && !message.includes("GAME OVER")) {
                const drawNextTimer = setTimeout(() => {
                    // Double-check that the game is still not over before updating the message
                    if (!gameData.gameOver) {
                        setDelayedMessage("Draw next card to continue");
                    }
                }, 2000);
                
                return () => clearTimeout(drawNextTimer);
            }
        }, 400);
        
        return () => clearTimeout(resultTimer);
    }
  }, [gameData.playerCard, gameData.cpuCard, gameData.message, username]);


  // Handle game start flow
  const handleStartGame = () => {
    setGameData(initializeGame());
    setIsFirstCard(true);
    setDelayedMessage("Draw card to begin");
    setGameState('tutorial');
  };

  // Handle tutorial completion
  const handleTutorialComplete = () => {
    setGameState('game');
    setTimeRemaining(240);
    setIsFirstCard(true);
    setDelayedMessage("Draw card to begin");
    setIsTimerRunning(true);
  };

  const memoizedGameData = useMemo(() => ({
    playerDeck: gameData.playerDeck,
    cpuDeck: gameData.cpuDeck,
    cardCounts: {
      player: gameData.playerDeck.length,
      cpu: gameData.cpuDeck.length
    }
  }), [gameData.playerDeck, gameData.cpuDeck]);

  // Update timer effect
  useEffect(() => {
    if (gameState === 'game' && isTimerRunning) {
        const timerInterval = setInterval(() => {
            setTimeRemaining(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timerInterval);
                    
                    // Play a sound to indicate game over
                    const warSound = soundCache.get('/sounds/war.mp3');
                    if (warSound && !isMuted) {
                        warSound.currentTime = 0;
                        warSound.volume = 0.75;
                        warSound.play();
                    }
                    
                    // IMPORTANT: When timer runs out, the game simply ends - no winner is declared
                    const timerMessage = "TIME'S UP - GAME OVER!";
                    
                    // Set game over state with timer message
                    setGameData(prev => ({
                        ...prev,
                        gameOver: true,
                        readyForNextCard: false,
                        message: timerMessage
                    }));
                    
                    // Ensure the timer message is immediately shown
                    setDelayedMessage(timerMessage);
                    
                    // Stop the timer but DON'T record any outcome
                    setIsTimerRunning(false);
                    setIsGameLocked(true);
                    
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
        
        return () => clearInterval(timerInterval);
    }
}, [gameState, isTimerRunning, isMuted]);

  // Menu State
  if (gameState === 'menu') {
    return (
      <div className="arcade-container flex flex-col items-center overflow-hidden">
        <ExplosionBackground isActive={true} />
        <div className="h-full w-full flex flex-col items-center justify-between pt-10 pb-8">
          <div />
          
          <div className="flex flex-col items-center gap-10 mt-4">
            <div className="text-center mb-8 transform scale-110">
              <h1 className="arcade-text text-7xl mb-3 title-glow tracking-wider">NUKE</h1>
              <p className="arcade-text text-2xl tracking-wide">WAR STYLE CARD GAME</p>
            </div>

            <div className="flex flex-col items-center gap-4 w-[280px]">
              <Button 
                data-action="start-game"
                className="arcade-button glow-blue text-2xl py-3 w-full transform hover:scale-105 transition-transform"
                onClick={handleStartGame}
              >
                START GAME
              </Button>
              
              <Button 
                data-action="leaderboard"
                className="arcade-button glow-yellow text-2xl py-3 w-full transform hover:scale-105 transition-transform"
                onClick={() => setGameState('leaderboard')}
              >
                LEADERBOARD
              </Button>
              <p className="arcade-text text-sm mt-3 text-center w-full">Powered by /thepod</p>
            </div>
          </div>

          <div />
        </div>

        {/* Version number in its own div at the bottom */}
        <div className="absolute bottom-16 left-0 right-0 text-center arcade-text text-xs" style={{ 
          textShadow: '0 0 5px #00ff00, 0 0 10px #00ff00',
          opacity: 0.8 
        }}>
          version 1.2
        </div>

        <button 
          className="absolute top-4 right-4 px-3 py-1 text-sm border border-purple-400 rounded-md text-purple-400 hover:bg-gray-800 transition-colors arcade-button glow-purple"
          style={{
            zIndex: 50,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={() => {
            const shareText = 'Play "Nuke" by @goldie and /thepod team 🃏';
            const shareUrl = 'nuke-podplay.vercel.app';
            sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`);
          }}
        >
          Share Game
        </button>

        <SoundToggle isMuted={isMuted} onToggle={() => setIsMuted(prev => !prev)} />
      </div>
    );
  }

  // Tutorial State
  if (gameState === 'tutorial') {
    return (
      <div className="arcade-container flex flex-col items-center overflow-hidden p-6">
        <h1 className="arcade-text text-5xl mb-8 title-glow tracking-wide">HOW TO PLAY</h1>
        
        <div className="space-y-8 max-w-[350px] flex-1 overflow-y-auto custom-scrollbar">
          <section>
            <h2 className="arcade-text-green text-2xl mb-3 tracking-wide">Basic Rules</h2>
            <p className="arcade-text-green text-sm leading-relaxed">
              Each player starts with 26 cards. Players draw cards simultaneously. Higher card takes both cards! Be aware of the 4 minute timer.
            </p>
          </section>

          <section>
            <h2 className="arcade-text-green text-2xl mb-3 tracking-wide">WAR!</h2>
            <p className="arcade-text-green text-sm leading-relaxed">
              When cards match, it's WAR! Each player puts down 3 face-down cards and 1 face-up card. Winner takes all 8 cards!
            </p>
          </section>

          <section>
            <h2 className="arcade-text-orange text-2xl mb-3 tracking-wide">NUKE Power!</h2>
            <p className="arcade-text-orange text-sm leading-relaxed">
              Each player has one NUKE. Use it to steal 10 cards from the opponent! Use wisely - you only get one.
            </p>
          </section>

          <section>
            <h2 className="arcade-text-green text-2xl mb-3 tracking-wide">Winning</h2>
            <p className="arcade-text-green text-sm leading-relaxed">
              Collect all 52 cards to win! If a player doesn't have enough cards for WAR or NUKE, they automatically lose. When the timer runs out, the game simply ends without declaring a winner.
            </p>
          </section>
        </div>

        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <Button 
            className="arcade-button glow-blue text-xl py-3 px-6 w-[280px] transform hover:scale-105 transition-transform"
            onClick={handleTutorialComplete}
          >
            START PLAYING
          </Button>
        </div>
      </div>
    );
  }

  // Game State
  if (gameState === 'game') {
    return (
      <motion.div 
        className={`arcade-container relative overflow-hidden p-4 ${showNukeAnimation ? 'nuke-border-flash' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ height: '695px' }}
      >

        {/* Nuke Animation */}
        <NukeAnimation 
          isVisible={showNukeAnimation} 
          initiator={nukeInitiator}
        />
        
        {/* War Animation */}
        <WarAnimation 
          isVisible={showWarAnimation}
          playerCard={gameData.playerCard}
          cpuCard={gameData.cpuCard}
          warCards={warCards}
          warStage={warStage}
          warWinner={warWinner}
          warWinningCard={warWinningCard}
        />

        {/* Card Change Animation Component */}
        <AnimatePresence>
          {cpuCardChange && (
            <motion.div 
              className="absolute top-[220px] right-[80px] z-50"
              initial={{ y: 0, opacity: 0, scale: 0.5 }}
              animate={{ y: -30, opacity: 1, scale: 1.2 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.3, // Delay to start after cards flip
                ease: "easeOut"
              }}
              onAnimationComplete={() => setCpuCardChange(null)}
            >
              <span className={`text-2xl font-bold ${cpuCardChange > 0 ? 'text-green-500' : 'text-red-500'}`}
                style={{ 
                  textShadow: '0 0 8px rgba(0, 0, 0, 0.8)',
                  filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))' 
                }}
              >
                {cpuCardChange > 0 ? '+' : ''}{cpuCardChange}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {playerCardChange && (
            <motion.div 
              className="absolute bottom-[150px] left-[80px] z-50"
              initial={{ y: 0, opacity: 0, scale: 0.5 }}
              animate={{ y: -30, opacity: 1, scale: 1.2 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.3, // Delay to start after cards flip
                ease: "easeOut"
              }}
              onAnimationComplete={() => setPlayerCardChange(null)}
            >
              <span className={`text-2xl font-bold ${playerCardChange > 0 ? 'text-green-500' : 'text-red-500'}`}
                style={{ 
                  textShadow: '0 0 8px rgba(0, 0, 0, 0.8)',
                  filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))' 
                }}
              >
                {playerCardChange > 0 ? '+' : ''}{playerCardChange}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card Count Display */}
        <motion.div 
          className="absolute top-4 left-4 right-4 flex justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.span 
            className="arcade-text text-lg"
            animate={{ scale: gameData.playerDeck.length < 10 ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.5, repeat: gameData.playerDeck.length < 10 ? Infinity : 0, repeatDelay: 1.5 }}
          >
            Your Cards: {gameData.playerDeck.length}
          </motion.span>
          <motion.span 
            className={`text-lg ${timeRemaining <= 30 ? 'text-red-500' : 'text-yellow-500'}`} 
            style={{ 
              textShadow: timeRemaining <= 30 ? '0 0 5px rgba(255, 0, 0, 0.7)' : 'none',
              fontWeight: timeRemaining <= 30 ? 'bold' : 'normal'
            }}
            animate={{ 
              opacity: [1, 0.7, 1],
              scale: timeRemaining <= 30 ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              duration: timeRemaining <= 30 ? 0.8 : 1.5, 
              repeat: Infinity,
              repeatDelay: timeRemaining <= 30 ? 0.2 : 0.5
            }}
          >
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </motion.span>
          <motion.span 
            className="arcade-text text-lg"
            animate={{ scale: gameData.cpuDeck.length < 10 ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 0.5, repeat: gameData.cpuDeck.length < 10 ? Infinity : 0, repeatDelay: 1.5 }}
          >
            CPU Cards: {gameData.cpuDeck.length}
          </motion.span>
        </motion.div>

        {/* CPU Card Area */}
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
            CPU's card
          </motion.p>
          
          {/* CPU Nuke Used Status Message */}
          <AnimatePresence>
            {!gameData.cpuHasNuke && (
              <motion.div 
                className="absolute bottom-16 left-12 text-lg text-red-500 flex flex-col items-center pointer-events-none"
                style={{
                  textShadow: '0 0 10px #ff0000',
                  zIndex: 10
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  textShadow: ['0 0 10px #ff0000', '0 0 15px #ff0000', '0 0 10px #ff0000']
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ 
                  duration: 0.4,
                  textShadow: { duration: 1.5, repeat: Infinity }
                }}
              >
                <motion.span
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  NUKE
                </motion.span>
                <motion.span
                  animate={{ y: [0, 2, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  USED
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <CardComponent
            suit={gameData.cpuCard?.suit || ''}
            rank={gameData.cpuCard?.display || ''}
            isFlipped={gameData.cpuCard !== null}
            isPlayerCard={false}
          />
        </motion.div>

        {/* Game Status */}
        <motion.div 
          className="text-center text-xl absolute top-[360px] left-0 right-0"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* No overlay - removed */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={delayedMessage} 
              className={`${delayedMessage.includes('TIME\'S UP') ? 'text-[#ff9900] font-bold text-2xl' : 'text-[#00ff00]'}`} 
              style={{ 
                textShadow: delayedMessage.includes('TIME\'S UP') ? '0 0 10px rgba(255, 153, 0, 0.8)' : 'none', 
                position: 'relative', 
                zIndex: 1 
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: delayedMessage.includes('TIME\'S UP') ? [1, 1.05, 1] : 1
              }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                duration: 0.3,
                scale: { duration: 0.8, repeat: delayedMessage.includes('TIME\'S UP') ? Infinity : 0 }
              }}
            >
              {timeRemaining === 0 ? "TIME'S UP - GAME OVER!" : delayedMessage}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Player Card Area */}
        <motion.div 
          className="text-center w-full flex flex-col items-center absolute top-[440px] left-0 right-0"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <CardComponent
            suit={gameData.playerCard?.suit || ''}
            rank={gameData.playerCard?.display || ''}
            isFlipped={gameData.playerCard !== null}
            isPlayerCard={true}
            onClick={handleDrawCard}
            isNukeActive={showNukeAnimation}
          />
          <motion.p 
            className="arcade-text text-lg mt-4 max-w-[60%] mx-auto truncate"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            title={username === 'Your' ? 'Your card' : `${username}'s card`}
          >
            {username === 'Your' ? 'Your card' : `${username}'s card`}
          </motion.p>
        </motion.div>

        {/* Bottom Action Buttons */}
        <motion.div 
          className="absolute bottom-4 left-4 right-4 flex justify-between items-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.button
            onClick={() => setGameState('menu')}
            className="text-sm py-1.5 px-3 text-yellow-400 font-bold border-2 border-yellow-400 rounded"
            style={{
              textShadow: '0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.3), inset 0 0 10px rgba(255, 215, 0, 0.2)'
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255, 215, 0, 0.5), inset 0 0 15px rgba(255, 215, 0, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            BACK
          </motion.button>

          {/* NUKE button or NUKE USED status in the same position */}
          <AnimatePresence mode="wait">
            {gameData.playerHasNuke ? (
              <motion.button
                key="nuke-button"
                onClick={handleNukeClick}
                className="text-sm py-1.5 px-3 rounded border-2 text-red-500 border-red-500 font-bold"
                style={{
                  textShadow: '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000',
                  boxShadow: '0 0 10px rgba(255, 0, 0, 0.3), inset 0 0 10px rgba(255, 0, 0, 0.2)'
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  boxShadow: ['0 0 10px rgba(255, 0, 0, 0.3), inset 0 0 10px rgba(255, 0, 0, 0.2)', '0 0 20px rgba(255, 0, 0, 0.5), inset 0 0 20px rgba(255, 0, 0, 0.3)', '0 0 10px rgba(255, 0, 0, 0.3), inset 0 0 10px rgba(255, 0, 0, 0.2)']
                }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(255, 0, 0, 0.6), inset 0 0 20px rgba(255, 0, 0, 0.4)' }}
                whileTap={{ scale: 0.9 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 17,
                  boxShadow: { duration: 2, repeat: Infinity }
                }}
              >
                NUKE!
              </motion.button>
            ) : (
              <motion.div
                key="nuke-used"
                className="text-xs py-1.5 px-3 rounded border-2 text-purple-500 border-purple-500 font-bold flex flex-col items-center justify-center"
                style={{
                  textShadow: '0 0 10px #9c27b0, 0 0 20px #9c27b0, 0 0 30px #9c27b0',
                  boxShadow: '0 0 10px rgba(156, 39, 176, 0.3), inset 0 0 10px rgba(156, 39, 176, 0.2)'
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  boxShadow: ['0 0 10px rgba(156, 39, 176, 0.3), inset 0 0 10px rgba(156, 39, 176, 0.2)', '0 0 20px rgba(156, 39, 176, 0.5), inset 0 0 20px rgba(156, 39, 176, 0.3)', '0 0 10px rgba(156, 39, 176, 0.3), inset 0 0 10px rgba(156, 39, 176, 0.2)']
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 17,
                  boxShadow: { duration: 2, repeat: Infinity }
                }}
              >
                <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>NUKE</motion.span>
                <motion.span animate={{ y: [0, 2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>USED</motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Removed separate Nuke Used Status Message - now integrated with the button */}
      </motion.div>
    );
  }

  // Leaderboard State
  if (gameState === 'leaderboard') {
    return (
      <Leaderboard 
        onBack={() => setGameState('menu')}
      />
    );
  }

  // Add condition to check for frame loaded state
  if (!isFrameLoaded) {
    return (
      <div className="arcade-container relative overflow-hidden flex flex-col justify-center">
        <div className="text-center">
          <h1 className="arcade-text text-4xl animate-pulse">Loading...</h1>
        </div>
      </div>
    );
  }

  // Add after leaderboard state check
  if (gameState === 'howToPlay') {
    return <HowToPlay onBack={() => setGameState('menu')} />;
  }

  // Single game over effect to replace all three game over effects
  useEffect(() => {
    if (gameData.gameOver && !hasSubmittedResult) {
      // Immediately clear all animations to prevent fuzzy effect
      setShowWarAnimation(false);
      setShowNukeAnimation(false);
      setWarStage('initial');
      
      // First, ensure all cards are properly allocated
      const newState = { ...gameData };
      
      // Move any remaining active cards to the appropriate deck
      if (newState.playerCard) {
        newState.playerDeck.push(newState.playerCard);
        newState.playerCard = null;
      }
      if (newState.cpuCard) {
        newState.cpuDeck.push(newState.cpuCard);
        newState.cpuCard = null;
      }
      
      // Move any war pile cards to the winner's deck
      if (newState.warPile.length > 0) {
        if (newState.message.includes("You win")) {
          newState.playerDeck.push(...newState.warPile);
        } else {
          newState.cpuDeck.push(...newState.warPile);
        }
        newState.warPile = [];
      }

      // Allow current state updates to complete
      setTimeout(() => {
        setGameData(newState);
        setIsProcessing(false);

        // Set final game over message
        let gameOverMessage;
        let outcome: 'win' | 'loss' | 'tie';
        
        if (gameData.message.includes("Time's Up")) {
          // Timer ran out - no winner declared
          gameOverMessage = "TIME'S UP - GAME OVER!";
          // Don't set an outcome for timer expiration
          // This will prevent handleGameEnd from being called with any outcome
          return;
        } else if (gameData.message.includes("You win") || gameData.message.includes("NUKE")) {
          // Player won
          gameOverMessage = `GAME OVER - ${username} WINS!`;
          outcome = 'win';
        } else if (gameData.message.includes("tie")) {
          // It's a tie for other reasons
          gameOverMessage = "GAME OVER - IT'S A TIE!";
          outcome = 'tie';
        } else {
          // CPU won
          gameOverMessage = "GAME OVER - CPU WINS!";
          outcome = 'loss';
        }
        
        setDelayedMessage(gameOverMessage);
        
        // Handle game end once
        handleGameEnd(outcome);
      }, 1000);

      return () => {
        setIsProcessing(false);
      };
    }
  }, [gameData.gameOver, gameData.message, username, handleGameEnd, hasSubmittedResult]);

  useEffect(() => {
    // Check total cards in play
    const totalCards = 
      gameData.playerDeck.length + 
      gameData.cpuDeck.length + 
      (gameData.playerCard ? 1 : 0) + 
      (gameData.cpuCard ? 1 : 0) + 
      gameData.warPile.length;
      
    if (totalCards !== 52) {
      console.error('Card count error:', {
        playerDeck: gameData.playerDeck.length,
        cpuDeck: gameData.cpuDeck.length,
        playerCard: gameData.playerCard ? 1 : 0,
        cpuCard: gameData.cpuCard ? 1 : 0,
        warPile: gameData.warPile.length,
        total: totalCards
      });
    }
    
    // Force game over ONLY when one player has all 52 cards
    if (gameData.playerDeck.length === 52 || gameData.cpuDeck.length === 52) {
      if (!gameData.gameOver) {
        setGameData(prev => ({
          ...prev,
          gameOver: true,
          message: gameData.playerDeck.length === 52 ? 
            "Game Over - You win!" : 
            "Game Over - CPU wins!"
        }));
        
        // Trigger game end handling
        handleGameEnd(gameData.playerDeck.length === 52 ? 'win' : 'loss');
      }
    }
  }, [gameData, handleGameEnd]);

  // Reset submission flag when starting a new game
  useEffect(() => {
    if (!gameData.gameOver) {
      setHasSubmittedResult(false);
    }
  }, [gameData.gameOver]);

  const sendGameNotification = async () => {
    if (!context?.user?.fid) {
      console.log('No FID available, cannot send notification');
      return;
    }

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fid: context.user.fid.toString(),
          title: 'Nuke',
          body: 'Thanks for playing Nuke!',
          targetUrl: process.env.NEXT_PUBLIC_URL
        })
      });

      const data = await response.json();
      if (data.error === "Rate limited") {
        console.log('Notification rate limited - user is playing too frequently');
        return;
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  useEffect(() => {
    if (!gameData.gameOver) {
        setIsGameLocked(false);
        setHasSubmittedResult(false);
    }
  }, [gameData.gameOver]);

  // Add this effect to control the timer
  useEffect(() => {
    if (gameState === 'game' && !gameData.gameOver) {
        setIsTimerRunning(true);
    } else {
        setIsTimerRunning(false);
    }
  }, [gameState, gameData.gameOver]);

  // Add cleanup when component unmounts
  useEffect(() => {
    return () => {
      const audioElements = Array.from(soundCache.values());
      audioElements.forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    };
  }, []);

  return null;
}