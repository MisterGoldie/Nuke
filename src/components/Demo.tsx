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

type GameState = 'menu' | 'game' | 'leaderboard';

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
  const [playTheme, { stop: stopTheme }] = useSound('/sounds/theme.mp3', { 
    volume: 0.5,
    loop: true
  });
  const [playWarSound] = useSound('/sounds/war.mp3', { volume: 0.75 });

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

  // Add effect to play theme on mount
  useEffect(() => {
    if (gameState === 'menu') {
      playTheme();
    } else {
      stopTheme();
    }
    return () => {
      stopTheme();
    };
  }, [gameState, playTheme, stopTheme]);

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

  // Start gameplay music when game starts
  useEffect(() => {
    console.log('Game State Changed:', gameState); // Debug log
    const gameplayMusic = soundCache.get('/sounds/gameplay.mp3');
    console.log('Gameplay Music Object:', gameplayMusic); // Debug log
    
    if (gameState === 'game') {
      if (gameplayMusic) {
        console.log('Attempting to play gameplay music'); // Debug log
        gameplayMusic.volume = 0.5;
        gameplayMusic.loop = true;
        
        const playPromise = gameplayMusic.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Gameplay music started successfully'); // Debug log
            })
            .catch((error: Error) => {
              console.error('Gameplay music failed to play:', error); // Debug error
            });
        }
      } else {
        console.error('Gameplay music not found in cache'); // Debug error
      }

      return () => {
        if (gameplayMusic) {
          console.log('Cleaning up gameplay music'); // Debug log
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
                onClick={() => {
                  setGameData(initializeGame());
                  setGameState('game');
                }}
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

        {/* NUKE Button */}
        <div className="absolute bottom-4 right-0 flex justify-end w-32">
          <button
            onClick={handleNukeClick}
            disabled={!gameData.playerHasNuke || gameData.cpuDeck.length < 10}
            className={`
              text-lg py-2 px-4
              ${gameData.playerHasNuke 
                ? 'text-red-500 font-bold' 
                : 'text-green-500'}
              ${gameData.playerHasNuke && gameData.cpuDeck.length >= 10 
                ? 'animate-pulse' 
                : ''}
              ml-auto
              ${gameData.playerHasNuke 
                ? 'text-shadow-red' 
                : 'text-shadow-green'}
            `}
            style={{
              textShadow: gameData.playerHasNuke 
                ? '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000'
                : '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00'
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
            {gameData.message}
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
          <p className="arcade-text text-lg mt-4">Your Card</p>
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

  return null;
}