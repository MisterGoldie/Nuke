"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, { FrameContext } from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import useSound from 'use-sound';
import Leaderboard from './Leaderboard';
import Image from 'next/image';
import { LocalState, Card, initializeGame, drawCards, handleNuke } from './gameLogic';
import CardComponent from './Card';
import WarAnimation from './WarAnimation';
import NukeAnimation from './NukeAnimation';

type GameState = 'menu' | 'game' | 'leaderboard';

export default function Demo() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameData, setGameData] = useState<LocalState>(initializeGame());
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext | null>(null);
  const [isFrameLoaded, setIsFrameLoaded] = useState(false);
  const [showWarAnimation, setShowWarAnimation] = useState(false);
  const [showNukeAnimation, setShowNukeAnimation] = useState(false);
  const [nukeInitiator, setNukeInitiator] = useState<'player' | 'cpu'>('player');
  const [playNukeSound] = useSound('/sounds/nuke.mp3', { volume: 0.75 });

  const handleDrawCard = () => {
    console.log('Card clicked!');
    setGameData(prevState => {
      console.log('Previous state:', prevState);
      const newState = drawCards(prevState);
      console.log('New state:', newState);
      return newState;
    });
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
      // Hide animation after 1.5 seconds
      const timer = setTimeout(() => {
        setShowWarAnimation(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameData.isWar]);

  // Add effect to handle CPU NUKE sound
  useEffect(() => {
    if (gameData.isNukeActive && !gameData.cpuHasNuke) {
      // CPU just used their NUKE
      playNukeSound();
    }
  }, [gameData.isNukeActive, gameData.cpuHasNuke]);

  // Menu State
  if (gameState === 'menu') {
    console.log('Rendering menu board');
    return (
      <div className="arcade-container w-[420px] h-[685px] bg-black relative overflow-hidden flex flex-col justify-center mx-auto">
        <div className="text-center mb-8">
          <h1 className="arcade-text text-6xl mb-4 animate-pulse">NUKE</h1>
          <p className="arcade-text text-2xl">WAR CARD GAME</p>
        </div>

        <div className="flex flex-col gap-6 max-w-[260px] mx-auto">
          <Button 
            data-action="start-game"
            className="arcade-button text-2xl py-6"
            onClick={() => {
              setGameData(initializeGame());
              setGameState('game');
            }}
          >
            START GAME
          </Button>
          
          <Button 
            data-action="leaderboard"
            className="arcade-button text-2xl py-6"
            onClick={() => setGameState('leaderboard')}
          >
            LEADERBOARD
          </Button>
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
        <div className="absolute top-16 right-4">
          <button
            onClick={handleNukeClick}
            disabled={!gameData.playerHasNuke || gameData.cpuDeck.length < 10}
            className={`
              arcade-button px-4 py-2 text-sm
              ${!gameData.playerHasNuke || gameData.cpuDeck.length < 10 ? 'opacity-50 cursor-not-allowed' : 'animate-pulse'}
            `}
          >
            {gameData.playerHasNuke ? 'NUKE!' : 'NUKE USED'}
          </button>
        </div>

        {/* WAR Animation */}
        <WarAnimation isVisible={showWarAnimation} />
        
        {/* CPU Card Area */}
        <div className="text-center w-full mt-8">
          <p className="arcade-text text-lg mb-4">CPU's Card</p>
          <CardComponent
            suit={gameData.cpuCard?.suit || ''}
            rank={gameData.cpuCard?.display || ''}
            isFlipped={gameData.playerCard !== null}
            isPlayerCard={false}
          />
        </div>

        {/* Game Status */}
        <div className="text-center arcade-text text-xl my-4">
          {gameData.message}
          {gameData.isWar && gameData.warPile.length > 0 && (
            <div className="text-sm mt-2">
              Cards at stake: {gameData.warPile.length + 2}
            </div>
          )}
        </div>

        {/* Player Card Area */}
        <div className="text-center w-full">
          <p className="arcade-text text-lg mb-4">Your Card</p>
          <CardComponent
            suit={gameData.playerCard?.suit || ''}
            rank={gameData.playerCard?.display || ''}
            isFlipped={gameData.playerCard !== null}
            isPlayerCard={true}
            onClick={handleDrawCard}
          />
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