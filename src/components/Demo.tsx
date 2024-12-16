"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, { FrameContext } from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import useSound from 'use-sound';
import Leaderboard from './Leaderboard';
import Image from 'next/image';
import { LocalState, Card, initializeGame, drawCards } from './gameLogic';
import CardComponent from './Card';

type GameState = 'menu' | 'game' | 'leaderboard';

export default function Demo() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [gameData, setGameData] = useState<LocalState>(initializeGame());

  const handleDrawCard = () => {
    console.log('Card clicked!');
    setGameData(prevState => {
      console.log('Previous state:', prevState);
      const newState = drawCards(prevState);
      console.log('New state:', newState);
      return newState;
    });
  };

  // Menu State
  if (gameState === 'menu') {
    return (
      <div className="arcade-container w-[424px] h-[685px] bg-black relative overflow-hidden flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 className="arcade-text text-6xl mb-4 animate-pulse">NUKE</h1>
          <p className="arcade-text text-2xl">WAR CARD GAME</p>
        </div>

        <div className="flex flex-col gap-6 max-w-[300px] mx-auto">
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
      <div className="arcade-container w-[424px] h-[685px] bg-black relative overflow-hidden flex flex-col">
        {/* Game Stats */}
        <div className="text-center py-4">
          <p className="arcade-text text-xl text-green-500">
            Player Cards: {gameData.playerDeck.length} | CPU Cards: {gameData.cpuDeck.length}
          </p>
        </div>

        {/* CPU Card Area */}
        <div className="flex-1 flex flex-col items-center justify-evenly">
          <div className="text-center">
            <p className="arcade-text text-lg mb-2">CPU's Card</p>
            <CardComponent
              suit={gameData.cpuCard?.suit || ''}
              rank={gameData.cpuCard?.display || ''}
              isFlipped={gameData.playerCard !== null}
              isPlayerCard={false}
            />
          </div>

          {/* Player Card Area */}
          <div className="text-center">
            <p className="arcade-text text-lg mb-2">Your Card</p>
            <CardComponent
              suit={gameData.playerCard?.suit || ''}
              rank={gameData.playerCard?.display || ''}
              isFlipped={gameData.playerCard !== null}
              isPlayerCard={true}
              onClick={handleDrawCard}
            />
            <p className="arcade-text text-sm text-center mt-2">
              Click your card to play
            </p>
          </div>
        </div>

        {/* Game Message */}
        <div className="text-center py-4">
          <p className="arcade-text text-lg text-green-500">{gameData.message}</p>
        </div>
      </div>
    );
  }

  // Leaderboard State
  if (gameState === 'leaderboard') {
    return <Leaderboard isMuted={false} playGameJingle={() => {}} />;
  }

  return null;
}