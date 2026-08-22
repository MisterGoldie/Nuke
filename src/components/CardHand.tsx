'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Card from './Card';

const CARD_ASPECT = 1300 / 1500;

function CardBack() {
  return (
    <div className="h-full w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#1a0933] via-[#4a148c] to-[#7b1fa2] shadow-[0_8px_16px_rgba(0,0,0,0.45)]">
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="absolute inset-[3px] rounded-lg border-2 border-purple-400/50" />
        <div className="text-5xl font-bold text-purple-300 drop-shadow-[0_0_8px_rgba(128,0,255,0.7)] sm:text-6xl">
          N
        </div>
        <div className="absolute left-2 top-2 text-sm text-purple-200/80">♠</div>
        <div className="absolute right-2 top-2 text-sm text-purple-200/80">♣</div>
        <div className="absolute bottom-2 left-2 text-sm text-purple-200/80">♥</div>
        <div className="absolute bottom-2 right-2 text-sm text-purple-200/80">♦</div>
      </div>
    </div>
  );
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rand(seed: number): number {
  const next = Math.sin(seed) * 10000;
  return next - Math.floor(next);
}

type Pose = { x: number; y: number; rotate: number; z: number };

function fanPose(index: number, count: number): Pose {
  const mid = count > 1 ? (count - 1) / 2 : 0;
  const t = count === 1 ? 0 : index - mid;
  const spread = count <= 3 ? 16 : 20;
  const tilt = count <= 3 ? 7 : 9;
  return {
    x: t * spread,
    y: t * t * 2.8,
    rotate: t * tilt,
    z: index + 1,
  };
}

function shufflePose(
  index: number,
  count: number,
  seed: number,
  wave: number,
  isPlayer: boolean,
): Pose {
  const n = rand(seed + index * 17 + wave * 91);
  const n2 = rand(seed + index * 31 + wave * 13);
  const n3 = rand(seed + index * 47 + wave * 7);
  const spreadX = isPlayer ? 108 : 72;
  const spreadY = isPlayer ? 52 : 36;
  const twist = isPlayer ? 72 : 48;
  return {
    x: (n - 0.5) * spreadX,
    y: (n2 - 0.5) * spreadY,
    rotate: (n3 - 0.5) * twist,
    z: Math.floor(n * count) + 1,
  };
}

interface CardHandProps {
  isPlayer: boolean;
  deckCount: number;
  playCard: {
    suit: string;
    display: string;
    artId?: string;
  } | null;
  onDraw?: () => void;
}

export default function CardHand({ isPlayer, deckCount, playCard, onDraw }: CardHandProps) {
  const hasPlay = playCard !== null;
  const canDraw = isPlayer && !hasPlay && deckCount > 0;
  const visibleCount = Math.min(7, hasPlay ? Math.min(6, deckCount) + 1 : deckCount);

  const [shuffleWave, setShuffleWave] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const drawId = playCard ? `${playCard.artId ?? ''}:${playCard.suit}:${playCard.display}` : '';

  useEffect(() => {
    if (!hasPlay) {
      setShuffleWave(0);
      setRevealed(false);
      return;
    }

    setRevealed(false);
    setShuffleWave(1);
    const waveTwo = window.setTimeout(() => setShuffleWave(2), 220);
    const settle = window.setTimeout(() => setShuffleWave(0), 620);
    const reveal = window.setTimeout(() => setRevealed(true), 900);

    return () => {
      window.clearTimeout(waveTwo);
      window.clearTimeout(settle);
      window.clearTimeout(reveal);
    };
  }, [drawId, hasPlay]);

  const seed = useMemo(() => hashSeed(`${drawId}:${isPlayer ? 'p' : 'c'}`), [drawId, isPlayer]);

  if (!hasPlay && deckCount <= 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-purple-500/20 text-xs text-purple-300/50"
        style={{
          width: 'var(--card-width, 120px)',
          aspectRatio: CARD_ASPECT,
        }}
      >
        Empty
      </div>
    );
  }

  const shuffling = shuffleWave > 0;

  return (
    <motion.div
      onClick={canDraw ? onDraw : undefined}
      className={`relative mx-auto ${canDraw ? 'cursor-pointer' : ''}`}
      style={{
        width: 'calc(var(--card-width, 120px) + 8rem)',
        height: 'calc(var(--card-width, 120px) / 0.866 + 3.25rem)',
      }}
      whileHover={canDraw ? { y: isPlayer ? -8 : 8 } : undefined}
      whileTap={canDraw ? { scale: 0.98 } : undefined}
    >
      {Array.from({ length: visibleCount }, (_, index) => {
        const isTop = index === visibleCount - 1;
        const backCount = hasPlay ? Math.max(0, visibleCount - 1) : visibleCount;
        const pose = shuffling
          ? shufflePose(index, visibleCount, seed, shuffleWave, isPlayer)
          : isTop && hasPlay
            ? { x: 0, y: revealed ? -26 : -10, rotate: 0, z: 30 }
            : fanPose(index, Math.max(1, backCount));

        return (
          <motion.div
            key={`fan-${index}`}
            className="absolute left-1/2 top-1/2"
            style={{
              width: 'var(--card-width, 120px)',
              aspectRatio: CARD_ASPECT,
              marginLeft: 'calc(var(--card-width, 120px) / -2)',
              marginTop: 'calc(var(--card-width, 120px) / -2 / 0.866)',
              transformOrigin: isTop && hasPlay && !shuffling ? '50% 50%' : '50% 100%',
              zIndex: pose.z,
            }}
            initial={false}
            animate={{
              x: pose.x,
              y: pose.y,
              rotate: pose.rotate,
            }}
            transition={{
              type: 'spring',
              stiffness: shuffling ? 320 : 240,
              damping: shuffling ? 18 : 22,
              mass: 0.8,
              delay: shuffling ? index * 0.025 : isTop && hasPlay ? 0 : index * 0.02,
            }}
          >
            {isTop && hasPlay ? (
              <Card
                suit={playCard.suit}
                rank={playCard.display}
                artId={playCard.artId}
                isFlipped={revealed}
                isPlayerCard={isPlayer}
                singleCard
              />
            ) : (
              <CardBack />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
