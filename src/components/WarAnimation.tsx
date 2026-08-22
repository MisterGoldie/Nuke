'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CardComponent from './Card';
import type { Card } from './gameLogic';
import type { WarStage } from './gameTypes';

interface WarAnimationProps {
  isVisible: boolean;
  warStage: WarStage;
  matchedCards: { player: Card | null; cpu: Card | null };
  faceDownCards: { player: Card[]; cpu: Card[] };
  revealCards: { player: Card | null; cpu: Card | null };
  warWinner?: 'player' | 'cpu';
}

function PlayCard({
  card,
  isPlayer,
  flipped,
}: {
  card: Card;
  isPlayer: boolean;
  flipped: boolean;
}) {
  return (
    <CardComponent
      suit={card.suit}
      rank={card.display}
      artId={card.artId}
      isFlipped={flipped}
      isPlayerCard={isPlayer}
      singleCard
    />
  );
}

function FaceDownStack({
  cards,
  isPlayer,
  animateIn,
}: {
  cards: Card[];
  isPlayer: boolean;
  animateIn: boolean;
}) {
  return (
    <div className="relative h-[170px] w-[var(--card-width,120px)] sm:h-[200px]">
      {cards.map((card, index) => (
        <motion.div
          key={`${card.artId ?? card.symbol}-${index}`}
          className="absolute inset-x-0"
          initial={animateIn ? { x: isPlayer ? -80 : 80, y: -24, opacity: 0 } : false}
          animate={{ x: 0, y: index * 12, opacity: 1 }}
          transition={{ duration: 0.45, delay: animateIn ? 0.12 * index : 0 }}
        >
          <PlayCard card={card} isPlayer={isPlayer} flipped={false} />
        </motion.div>
      ))}
    </div>
  );
}

export default function WarAnimation({
  isVisible,
  warStage,
  matchedCards,
  faceDownCards,
  revealCards,
  warWinner,
}: WarAnimationProps) {
  const [facesUp, setFacesUp] = useState(false);

  useEffect(() => {
    if (warStage !== 'revealing-winner' && warStage !== 'complete') {
      setFacesUp(false);
      return;
    }
    const timer = window.setTimeout(() => setFacesUp(true), 60);
    return () => window.clearTimeout(timer);
  }, [warStage]);

  if (!isVisible) return null;

  const pileCount =
    (matchedCards.player ? 1 : 0) +
    (matchedCards.cpu ? 1 : 0) +
    faceDownCards.player.length +
    faceDownCards.cpu.length +
    (revealCards.player ? 1 : 0) +
    (revealCards.cpu ? 1 : 0);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-3">
      <div className="absolute inset-0 bg-black/70" />

      {warStage === 'drawing-cards' && (
        <div className="relative flex w-full max-w-lg flex-col items-center">
          <motion.div
            className="mb-4 text-center text-6xl font-bold text-red-500 sm:text-8xl"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ textShadow: '0 0 12px #ff0000' }}
          >
            WAR!
          </motion.div>
          <p className="mb-4 text-center text-sm text-white sm:text-lg">Same rank — 3 face-down, then 1 face-up</p>
          <div className="mb-6 flex w-full justify-center gap-10">
            {matchedCards.player && (
              <div className="flex flex-col items-center gap-2">
                <PlayCard card={matchedCards.player} isPlayer flipped />
                <span className="text-xs text-white">Your match</span>
              </div>
            )}
            {matchedCards.cpu && (
              <div className="flex flex-col items-center gap-2">
                <PlayCard card={matchedCards.cpu} isPlayer={false} flipped />
                <span className="text-xs text-white">CPU match</span>
              </div>
            )}
          </div>
          <div className="flex w-full justify-between gap-4 px-2">
            <div className="flex flex-col items-center">
              <div className="mb-2 text-sm text-white">Your ante</div>
              <FaceDownStack cards={faceDownCards.player} isPlayer animateIn />
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-2 text-sm text-white">CPU ante</div>
              <FaceDownStack cards={faceDownCards.cpu} isPlayer={false} animateIn />
            </div>
          </div>
        </div>
      )}

      {warStage === 'revealing-winner' && (
        <div className="relative flex w-full max-w-lg flex-col items-center">
          <p className="mb-4 text-center text-lg text-white sm:text-2xl">Face-up cards decide it</p>
          <div className="mb-6 flex w-full justify-between gap-4 px-2">
            <FaceDownStack cards={faceDownCards.player} isPlayer animateIn={false} />
            <FaceDownStack cards={faceDownCards.cpu} isPlayer={false} animateIn={false} />
          </div>
          <div className="flex items-end justify-center gap-8">
            {revealCards.player && (
              <motion.div
                className="relative flex flex-col items-center"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                {warWinner === 'player' && (
                  <div className="absolute inset-0 -z-10 scale-110 rounded-xl bg-green-500 blur-md" />
                )}
                <PlayCard card={revealCards.player} isPlayer flipped={facesUp} />
                <span className="mt-2 text-xs text-white">Your card</span>
              </motion.div>
            )}
            {revealCards.cpu && (
              <motion.div
                className="relative flex flex-col items-center"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.12 }}
              >
                {warWinner === 'cpu' && (
                  <div className="absolute inset-0 -z-10 scale-110 rounded-xl bg-red-500 blur-md" />
                )}
                <PlayCard card={revealCards.cpu} isPlayer={false} flipped={facesUp} />
                <span className="mt-2 text-xs text-white">CPU card</span>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {warStage === 'complete' && warWinner && (
        <div className="relative flex flex-col items-center">
          <motion.div
            className={`mb-6 text-center text-5xl font-bold sm:text-7xl ${warWinner === 'player' ? 'text-green-500' : 'text-red-500'}`}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              textShadow: warWinner === 'player' ? '0 0 12px #00ff00' : '0 0 12px #ff0000',
            }}
          >
            {warWinner === 'player' ? 'YOU WIN!' : 'CPU WINS!'}
          </motion.div>
          {(warWinner === 'player' ? revealCards.player : revealCards.cpu) && (
            <PlayCard
              card={(warWinner === 'player' ? revealCards.player : revealCards.cpu)!}
              isPlayer={warWinner === 'player'}
              flipped
            />
          )}
          <p className="mt-6 text-center text-lg font-bold text-white">
            {warWinner === 'player' ? 'You won' : 'CPU won'} the war
            {pileCount > 0 ? ` and took ${pileCount} cards` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
