"use client";

import { useEffect, useCallback, useState, useContext, useMemo } from "react";
import sdk, { FrameContext } from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import useSound from 'use-sound';
import Leaderboard from './Leaderboard';
import Image from 'next/image';
import { LocalState, Card, initializeGame, drawCards, handleNuke } from './gameLogic';
import CardComponent from './Card';
import dynamic from 'next/dynamic';
import { soundCache, preloadAssets } from '~/utils/optimizations';
import HowToPlay from './HowToPlay';
import { fetchUserDataByFid } from '../utils/neynarUtils';

type GameState = 'menu' | 'game' | 'leaderboard' | 'tutorial';

// Add interface for your context type
interface ExtendedFrameContext extends FrameContext {
  fid?: string;  // Add fid as optional property
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
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameData, setGameData] = useState<LocalState>(initializeGame());
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<ExtendedFrameContext | null>(null);
  const [isFrameLoaded, setIsFrameLoaded] = useState(false);
  const [showWarAnimation, setShowWarAnimation] = useState(false);
  const [showNukeAnimation, setShowNukeAnimation] = useState(false);
  const [nukeInitiator, setNukeInitiator] = useState<'player' | 'cpu'>('player');
  const [playNukeSound] = useSound('/sounds/nuke.mp3', { volume: 0.75 });
  const [playWarSound] = useSound('/sounds/war.mp3', { volume: 0.75 });
  const [playGameplayMusic] = useSound('/sounds/gameplay.mp3', { volume: 0.2, loop: true });
  const [delayedMessage, setDelayedMessage] = useState<string>("Draw card to begin");
  const [isFirstCard, setIsFirstCard] = useState(true);
  const [username, setUsername] = useState<string>('Your');
  const [isFidLoaded, setIsFidLoaded] = useState(false);
  const [hasSubmittedResult, setHasSubmittedResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(240); // 240 seconds = 4 minutes
  const [isGameLocked, setIsGameLocked] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const handleGameEnd = useCallback(async (outcome: 'win' | 'loss', isTimeUp: boolean = false) => {
    if (hasSubmittedResult || isGameLocked) {
        console.log("Game already ended, skipping...");
        return;
    }

    // Lock the game and stop timer immediately
    setIsGameLocked(true);
    setIsTimerRunning(false);  // Force timer to stop
    
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

  const handleDrawCard = useCallback(() => {
    if (showWarAnimation || showNukeAnimation || isProcessing) {
        return;
    }

    if (!gameData.playerCard && !gameData.cpuCard) {
        if (isFirstCard) {
            setIsFirstCard(false);
        }
        
        const newState = drawCards(gameData);
        setGameData(newState);
        
        if (newState.gameOver) {
            const outcome = newState.message.includes("You win") ? "win" : "loss";
            handleGameEnd(outcome);
        }
    }
  }, [gameData, showWarAnimation, showNukeAnimation, isProcessing, handleGameEnd]);

  const handleNukeClick = useCallback(() => {
    if (showNukeAnimation || isProcessing) return;
    
    setIsProcessing(true);
    setGameData((prevState) => {
        const newState = handleNuke(prevState, 'player');
        setShowNukeAnimation(true);
        setNukeInitiator('player');
        playNukeSound();
        
        // Clear animation after delay
        setTimeout(() => {
            setShowNukeAnimation(false);
            setIsProcessing(false);
            
            if (newState.gameOver) {
                handleGameEnd('win');
            }
        }, 2000);
        
        return newState;
    });
}, [showNukeAnimation, isProcessing, playNukeSound, handleGameEnd]);

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
          setIsFidLoaded(true);  // Mark FID as loaded
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

  // Effect for War animation
  useEffect(() => {
    let warTimer: NodeJS.Timeout;
    
    if (gameData.isWar && !gameData.gameOver) {
      setIsProcessing(true);
      setShowWarAnimation(true);
      playWarSound();
      
      warTimer = setTimeout(() => {
        if (!gameData.gameOver) {  // Additional check before updating state
          setShowWarAnimation(false);
          setGameData(prev => ({
            ...prev,
            isWar: false,
            readyForNextCard: true
          }));
          setIsProcessing(false);
        }
      }, 3000);
    }
    
    return () => {
      if (warTimer) {
        clearTimeout(warTimer);
      }
      setIsProcessing(false);
    };
  }, [gameData.isWar, gameData.gameOver, playWarSound]);

  useEffect(() => {
    if (gameData.isNukeActive) {
        setShowNukeAnimation(true);
        setNukeInitiator(gameData.message.includes("CPU") ? 'cpu' : 'player');
        playNukeSound();
        
        const timer = setTimeout(() => {
            setShowNukeAnimation(false);
            setGameData(prev => ({
                ...prev,
                isNukeActive: false,
                playerCard: null,
                cpuCard: null,
                readyForNextCard: true,
                message: "Draw next card to continue"
            }));
            setIsProcessing(false);
        }, 2000);
        
        return () => {
            clearTimeout(timer);
            setIsProcessing(false);
        };
    }
  }, [gameData.isNukeActive, gameData.message, playNukeSound]);

  // Add effect to handle CPU NUKE sound
  useEffect(() => {
    if (gameData.isNukeActive && !gameData.cpuHasNuke) {
      // CPU just used their NUKE
      playNukeSound();
    }
  }, [gameData.isNukeActive, gameData.cpuHasNuke]);

  useEffect(() => {
    if (gameData.readyForNextCard) {
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
  }, [gameData.readyForNextCard]);

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
    preloadAssets();
  }, []);

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
            
            const drawNextTimer = setTimeout(() => {
                setDelayedMessage("Draw next card to continue");
            }, 2000);
            
            return () => clearTimeout(drawNextTimer);
        }, 400);
        
        return () => clearTimeout(resultTimer);
    }
  }, [gameData.playerCard, gameData.cpuCard, gameData.message, username]);

  // Special handling for WAR messages
  useEffect(() => {
    if (gameData.isWar) {
      setDelayedMessage("WAR! 3 cards each drawn");
    }
  }, [gameData.isWar]);

  // Handle game start flow
  const handleStartGame = () => {
    setGameData(initializeGame());
    setIsFirstCard(true);
    setGameState('tutorial');
  };

  // Handle tutorial completion
  const handleTutorialComplete = () => {
    setGameState('game');
    setTimeRemaining(240);
    setIsFirstCard(true);
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
                    const playerTotal = gameData.playerDeck.length + (gameData.playerCard ? 1 : 0);
                    const cpuTotal = gameData.cpuDeck.length + (gameData.cpuCard ? 1 : 0);
                    
                    // Update game state and message
                    setGameData(prev => ({
                        ...prev,
                        gameOver: true,
                        readyForNextCard: false,
                        message: playerTotal > cpuTotal ? 
                            `GAME OVER - Time's Up! ${username} wins with ${playerTotal} cards!` : 
                            `GAME OVER - Time's Up! CPU wins with ${cpuTotal} cards!`
                    }));
                    
                    // Set the delayed message for display
                    setDelayedMessage(playerTotal > cpuTotal ? 
                        `GAME OVER - Time's Up! ${username} wins with ${playerTotal} cards!` : 
                        `GAME OVER - Time's Up! CPU wins with ${cpuTotal} cards!`
                    );
                    
                    // Handle game end with isTimeUp flag
                    handleGameEnd(playerTotal > cpuTotal ? 'win' : 'loss', true);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
        
        return () => clearInterval(timerInterval);
    }
}, [gameState, gameData, username, handleGameEnd, isTimerRunning]);

  // Menu State
  if (gameState === 'menu') {
    return (
      <div className="arcade-container flex flex-col items-center">
        <div className="h-full flex flex-col items-center justify-between pt-20 pb-12">
          <div />
          
          <div className="flex flex-col items-center gap-16">
            <div className="text-center">
              <h1 className="arcade-text text-6xl mb-2 title-glow">NUKE</h1>
              <p className="arcade-text text-2xl">WAR STYLE CARD GAME</p>
            </div>

            {/* Nuclear Hazard Symbol (Trefoil) */}
            <div className="trefoil">
              <div className="circle"></div>
              <div className="blade"></div>
              <div className="blade"></div>
              <div className="blade"></div>
            </div>

            <div className="flex flex-col items-center gap-3 w-[260px]">
              <Button 
                data-action="start-game"
                className="arcade-button glow-blue text-2xl py-3"
                onClick={handleStartGame}
              >
                START GAME
              </Button>
              
              <Button 
                data-action="leaderboard"
                className="arcade-button glow-yellow text-2xl py-3"
                onClick={() => setGameState('leaderboard')}
              >
                LEADERBOARD
              </Button>
              <p className="arcade-text text-sm mt-2 text-center w-full">Powered by The POD</p>
            </div>
          </div>

          <div />
        </div>

        {/* Version number in its own div at the bottom */}
        <div className="absolute bottom-4 arcade-text text-xs" style={{ 
          textShadow: '0 0 5px #00ff00, 0 0 10px #00ff00',
          opacity: 0.8 
        }}>
          version 1.0
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
          Share Frame
        </button>
      </div>
    );
  }

  // Tutorial State
  if (gameState === 'tutorial') {
    return (
      <div className="arcade-container flex flex-col items-center p-8">
        <h1 className="arcade-text text-4xl mb-6 title-glow">HOW TO PLAY</h1>
        
        <div className="space-y-6 max-w-[350px]">
          <section>
            <h2 className="arcade-text-green text-2xl mb-2">Basic Rules</h2>
            <p className="arcade-text-green text-sm leading-relaxed">
              Each player starts with 26 cards. Players draw cards simultaneously. Higher card takes both cards! Be aware of the 4 minute timer.
            </p>
          </section>

          <section>
            <h2 className="arcade-text-green text-2xl mb-2">WAR!</h2>
            <p className="arcade-text-green text-sm leading-relaxed">
              When cards match, it's WAR! Each player puts down 3 face-down cards and 1 face-up card. Winner takes all 8 cards!
            </p>
          </section>

          <section>
            <h2 className="arcade-text-orange text-2xl mb-2">NUKE Power!</h2>
            <p className="arcade-text-orange text-sm leading-relaxed">
              Each player has one NUKE. Use it to steal 10 cards from the opponent! Use wisely - you only get one.
            </p>
          </section>

          <section>
            <h2 className="arcade-text-green text-2xl mb-2">Winning</h2>
            <p className="arcade-text-green text-sm leading-relaxed">
              Collect all cards to win! If a player doesn't have enough cards for WAR or NUKE, they automatically lose. Whoever has the most cards when the timer runs out is also declared the winner.
            </p>
          </section>
        </div>

        <Button 
          className="arcade-button glow-blue text-xl py-2 mt-8"
          onClick={handleTutorialComplete}
        >
          START PLAYING
        </Button>
      </div>
    );
  }

  // Game State
  if (gameState === 'game') {
    return (
      <div className={`arcade-container w-[420px] h-[685px] bg-black relative overflow-hidden flex flex-col items-center justify-between p-6 ${showNukeAnimation ? 'nuke-border-flash' : ''}`}>
        {/* Nuke Animation */}
        <NukeAnimation 
          isVisible={showNukeAnimation} 
          initiator={nukeInitiator}
        />

        {/* Card Count Display */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <span className="arcade-text text-lg">CPU Cards: {gameData.cpuDeck.length}</span>
          <span className="text-yellow-500 text-lg" style={{ textShadow: 'none' }}>
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </span>
          <span className="arcade-text text-lg">Your Cards: {gameData.playerDeck.length}</span>
        </div>

        {/* CPU Card Area */}
        <div className="text-center w-full mt-8 flex flex-col items-center relative">
          <p className="arcade-text text-lg mb-4">CPU's card</p>
          
          {/* CPU Nuke Used Status Message */}
          {!gameData.cpuHasNuke && (
            <div 
              className="absolute bottom-16 left-12 text-lg text-red-500 flex flex-col items-center pointer-events-none"
              style={{
                textShadow: '0 0 10px #ff0000',
                zIndex: 10
              }}
            >
              <span>NUKE</span>
              <span>USED</span>
            </div>
          )}
          
          <CardComponent
            suit={gameData.cpuCard?.suit || ''}
            rank={gameData.cpuCard?.display || ''}
            isFlipped={gameData.cpuCard !== null}
            isPlayerCard={false}
          />
        </div>

        {/* Game Status */}
        <div className="text-center text-xl my-4 relative">
          <div className="text-[#00ff00]" style={{ textShadow: 'none', position: 'relative', zIndex: 1 }}>
            {isFirstCard ? "Draw card to begin" : delayedMessage}
          </div>
        </div>

        {/* Player Card Area */}
        <div className="text-center w-full flex flex-col items-center">
          <CardComponent
            suit={gameData.playerCard?.suit || ''}
            rank={gameData.playerCard?.display || ''}
            isFlipped={gameData.playerCard !== null}
            isPlayerCard={true}
            onClick={handleDrawCard}
            isNukeActive={showNukeAnimation}
          />
          <p className="arcade-text text-lg mt-4">
            {username === 'Your' ? 'Your card' : `${username}'s card`}
          </p>
        </div>

        {/* Bottom Action Buttons */}
        <div className="absolute bottom-24 left-4 right-4 flex justify-between items-center">
          <button
            onClick={() => setGameState('menu')}
            className="text-lg py-2 px-4 text-yellow-400 font-bold border-2 border-yellow-400 rounded"
            style={{
              textShadow: '0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.3), inset 0 0 10px rgba(255, 215, 0, 0.2)'
            }}
          >
            BACK
          </button>

          {/* Only show NUKE button if it's available */}
          {gameData.playerHasNuke && (
            <button
              onClick={handleNukeClick}
              className="text-lg py-2 px-4 rounded border-2 text-red-500 border-red-500 font-bold"
              style={{
                textShadow: '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000',
                boxShadow: '0 0 10px rgba(255, 0, 0, 0.3), inset 0 0 10px rgba(255, 0, 0, 0.2)'
              }}
            >
              NUKE!
            </button>
          )}
        </div>

        {/* Nuke Used Status Message - Show when nuke is not available */}
        {!gameData.playerHasNuke && (
          <div 
            className="absolute bottom-24 right-12 text-lg text-green-500 flex flex-col items-center pointer-events-none"
            style={{
              textShadow: '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00',
            }}
          >
            <span>NUKE</span>
            <span>USED</span>
          </div>
        )}
      </div>
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
      <div className="arcade-container w-[424px] h-[685px] bg-black relative overflow-hidden flex flex-col justify-center">
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

      // Allow current animations to complete
      setTimeout(() => {
        setGameData(newState);
        setShowWarAnimation(false);
        setShowNukeAnimation(false);
        setIsProcessing(false);

        // Set final game over message
        const gameOverMessage = gameData.message.includes("You win") || gameData.message.includes("NUKE") ?
          `GAME OVER - ${username} WINS!` :
          "GAME OVER - CPU WINS!";
        
        setDelayedMessage(gameOverMessage);
        
        // Handle game end once
        const outcome = gameData.message.includes("You win") || gameData.message.includes("NUKE") ? 
          'win' : 'loss';
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

  // Single timer effect that starts when game state changes to 'game'
  useEffect(() => {
    console.log('Timer Effect Running:', { gameState, gameOver: gameData.gameOver });
    
    if (gameState === 'game') {
        console.log('Game started - initializing timer');
        // Reset timer to 4 minutes (240 seconds)
        setTimeRemaining(240);
        
        // Create interval that ticks every second
        const timerInterval = setInterval(() => {
            setTimeRemaining(prevTime => {
                console.log('Current time:', prevTime);
                // If time is up, handle game end
                if (prevTime <= 0) {
                    clearInterval(timerInterval);
                    const playerTotal = gameData.playerDeck.length + (gameData.playerCard ? 1 : 0);
                    const cpuTotal = gameData.cpuDeck.length + (gameData.cpuCard ? 1 : 0);
                    
                    setGameData(prev => ({
                        ...prev,
                        gameOver: true,
                        message: playerTotal > cpuTotal ? 
                            `Time's Up - ${username} wins with ${playerTotal} cards!` : 
                            `Time's Up - CPU wins with ${cpuTotal} cards!`
                    }));
                    
                    handleGameEnd(playerTotal > cpuTotal ? 'win' : 'loss');
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
        
        // Cleanup function
        return () => {
            console.log('Cleaning up timer interval');
            clearInterval(timerInterval);
        };
    }
}, [gameState]); // Only depend on gameState to prevent unnecessary re-renders

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

  return null;
}