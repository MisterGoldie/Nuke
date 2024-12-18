"use client";

import { useEffect, useCallback, useState, useContext } from "react";
import sdk, { FrameContext } from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import useSound from 'use-sound';
import Leaderboard from './Leaderboard';
import Image from 'next/image';
import { LocalState, Card, initializeGame, drawCards, handleNuke } from './gameLogic';
import CardComponent from './Card';
import WarAnimation from './WarAnimation';
import NukeAnimation from './NukeAnimation';
import { soundCache, preloadAssets } from '~/utils/optimizations';
import HowToPlay from './HowToPlay';
import { fetchUserDataByFid } from '../utils/neynarUtils';

type GameState = 'menu' | 'game' | 'leaderboard' | 'tutorial';

// Add interface for your context type
interface ExtendedFrameContext extends FrameContext {
  fid?: string;  // Add fid as optional property
}

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
  const [delayedMessage, setDelayedMessage] = useState<string>("Draw card to begin");
  const [isFirstCard, setIsFirstCard] = useState(true);
  const [username, setUsername] = useState<string>('');

  const handleGameEnd = async (outcome: 'win' | 'loss') => {
    if (!context?.fid) return;
    
    try {
      const result = {
        fid: context.fid,
        outcome: outcome
      };
      
      const response = await fetch('/api/game-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        throw new Error('Failed to store game result');
      }
    } catch (error) {
      console.error('Error storing game result:', error);
    }
  };

  const handleDrawCard = () => {
    if (!gameData.playerCard && !gameData.cpuCard) {
        setGameData(prevState => {
            const newState = drawCards(prevState);
            // Force immediate state update for deck counts
            return {
                ...newState,
                playerDeck: [...newState.playerDeck],  // Create new array references
                cpuDeck: [...newState.cpuDeck]        // to ensure React sees the change
            };
        });
    }
  };

  const handleNukeClick = () => {
    setGameData((prevState: LocalState) => {
      const newState = handleNuke(prevState, 'player');
      setShowNukeAnimation(true);
      setNukeInitiator('player');
      playNukeSound();
      setTimeout(() => setShowNukeAnimation(false), 2000);
      return newState;
    });
  };

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
          const username = data?.data?.Socials?.Social?.[0]?.profileName || `Player ${fid}`;
          setUsername(username);
        }

        await sdk.actions.ready();
        console.log("SDK Ready - Game State:", gameState);
        setTimeout(() => {
          setIsFrameLoaded(true);
        }, 1000);
      } catch (err) {
        console.error("SDK Error:", err);
      }
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded, gameState]);

  // Add effect to handle WAR state changes
  useEffect(() => {
    if (gameData.isWar) {
      setShowWarAnimation(true);
      playWarSound();
      // Extend WAR animation to 2.5 seconds
      const timer = setTimeout(() => {
        setShowWarAnimation(false);
      }, 2500);  // Changed from 1500 to 2500
      return () => clearTimeout(timer);
    }
  }, [gameData.isWar, playWarSound]);

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
    
    // Start music on tutorial, keep playing through game
    if ((gameState === 'tutorial' || gameState === 'game') && gameplayMusic) {
      console.log('Attempting to play gameplay music');
      gameplayMusic.volume = 0.5;
      gameplayMusic.loop = true;
      
      // Only play if not already playing
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

      // Only cleanup when returning to menu or leaderboard
      return () => {
        if (['menu', 'leaderboard'].includes(gameState)) {
          console.log('Cleaning up gameplay music');
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
      // Clear first card state
      if (isFirstCard) {
        setIsFirstCard(false);
      }
      
      // Clear any existing message first
      setDelayedMessage("");
      
      // Wait for CPU card flip animation before showing result
      const resultTimer = setTimeout(() => {
        // Replace "You" with username in messages
        const message = gameData.message.replace(/You/g, username);
        setDelayedMessage(message);
        
        // Then set timer for "draw next" message
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
      setDelayedMessage("WAR!");
    }
  }, [gameData.isWar]);

  // Handle game start flow
  const handleStartGame = () => {
    setGameData(initializeGame());
    setGameState('tutorial'); // Show tutorial first
  };

  // Handle tutorial completion
  const handleTutorialComplete = () => {
    setGameState('game');
  };

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
      </div>
    );
  }

  // Tutorial State
  if (gameState === 'tutorial') {
    return (
      <div className="arcade-container flex flex-col items-center p-8">
        <h1 className="arcade-text text-4xl mb-6 title-glow">HOW TO PLAY</h1>
        
        <div className="space-y-6 text-[#00ff00] max-w-[350px]">
          <section>
            <h2 className="text-2xl mb-2">Basic Rules</h2>
            <p className="text-sm leading-relaxed">
              Each player starts with 26 cards. Players draw cards simultaneously. Higher card wins both cards!
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-2">WAR!</h2>
            <p className="text-sm leading-relaxed">
              When cards match, it's WAR! Each player puts down 3 face-down cards and 1 face-up card. Winner takes all 8 cards!
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-2">NUKE Power!</h2>
            <p className="text-sm leading-relaxed">
              Each player has one NUKE. Use it to steal 10 cards from your opponent! Use wisely - you only get one.
            </p>
          </section>

          <section>
            <h2 className="text-2xl mb-2">Winning</h2>
            <p className="text-sm leading-relaxed">
              Collect all cards to win! If a player doesn't have enough cards for WAR, they lose.
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
      <div className="arcade-container w-[420px] h-[685px] bg-black relative overflow-hidden flex flex-col items-center justify-between p-6">
        {/* Nuke Animation */}
        <NukeAnimation 
          isVisible={showNukeAnimation} 
          initiator={nukeInitiator}
        />

        {/* Card Count Display */}
        <div className="absolute top-4 left-4 right-4 flex justify-between arcade-text text-lg">
          <span>CPU Cards: {gameData.cpuDeck.length}</span>
          <span>Your Cards: {gameData.playerDeck.length}</span>
        </div>

        {/* Bottom Action Buttons - Raised higher */}
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

          <button
            onClick={handleNukeClick}
            disabled={!gameData.playerHasNuke || gameData.cpuDeck.length < 10}
            className={`
              text-lg py-2 px-4 rounded
              border-2
              ${gameData.playerHasNuke ? 'text-red-500 border-red-500 font-bold' : 'text-green-500 border-green-500'}
              ${gameData.playerHasNuke && gameData.cpuDeck.length >= 10 ? 'animate-pulse' : ''}
            `}
            style={{
              textShadow: gameData.playerHasNuke 
                ? '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000'
                : '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00',
              boxShadow: gameData.playerHasNuke
                ? '0 0 10px rgba(255, 0, 0, 0.3), inset 0 0 10px rgba(255, 0, 0, 0.2)'
                : '0 0 10px rgba(0, 255, 0, 0.3), inset 0 0 10px rgba(0, 255, 0, 0.2)'
            }}
          >
            {gameData.playerHasNuke ? 'NUKE!' : 'NUKE USED'}
          </button>
        </div>

        {/* WAR Animation */}
        <WarAnimation isVisible={showWarAnimation} />
        
        {/* CPU Card Area */}
        <div className="text-center w-full mt-8 flex flex-col items-center">
          <p className="arcade-text text-lg mb-4">CPU's Card</p>
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
          />
          <p className="arcade-text text-lg mt-4">{username}'s Card</p>
        </div>
      </div>
    );
  }

  // Leaderboard State
  if (gameState === 'leaderboard') {
    return <Leaderboard isMuted={false} playGameJingle={() => {}} />;
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

  return null;
}