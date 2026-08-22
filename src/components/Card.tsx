'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getCardArtKey } from '../lib/cardImage';
import {
  getCachedCrudeboysImage,
  loadCrudeboysDeck,
} from '../lib/crudeboysClient';

const DEFAULT_CARD_ASPECT_RATIO = 240 / 277;

interface CardProps {
  suit: string;
  rank: string;
  isFlipped: boolean;
  isPlayerCard: boolean;
  onClick?: () => void;
  isNukeActive?: boolean;
  singleCard?: boolean;
  /** Override auto Crudeboys art for this card */
  frontImageSrc?: string;
  /** When false (default), only the NFT art shows on the face */
  showRankOverlay?: boolean;
}

export default function Card({
  suit,
  rank,
  isFlipped,
  isPlayerCard,
  onClick,
  isNukeActive,
  singleCard = false,
  frontImageSrc,
  showRankOverlay = false,
}: CardProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(frontImageSrc ?? null);
  const [frontImageFailed, setFrontImageFailed] = useState(false);
  const [cardAspectRatio, setCardAspectRatio] = useState(DEFAULT_CARD_ASPECT_RATIO);

  useEffect(() => {
    let cancelled = false;

    if (frontImageSrc) {
      setImageSrc(frontImageSrc);
      setFrontImageFailed(false);
      return;
    }

    if (!rank || !suit) {
      setImageSrc(null);
      setFrontImageFailed(false);
      return;
    }

    const cached = getCachedCrudeboysImage(rank, suit);
    if (cached) {
      setImageSrc(cached);
      setFrontImageFailed(false);
      return;
    }

    setImageSrc(null);
    setFrontImageFailed(false);

    void loadCrudeboysDeck()
      .then((images) => {
        if (cancelled) return;
        const key = getCardArtKey(rank, suit);
        const url = key ? images[key] : undefined;
        if (url) {
          setImageSrc(url);
          setFrontImageFailed(false);
          return;
        }
        setImageSrc(null);
        setFrontImageFailed(true);
      })
      .catch(() => {
        if (!cancelled) {
          setImageSrc(null);
          setFrontImageFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [frontImageSrc, rank, suit]);

  const isRedSuit =
    suit.includes('♥️') ||
    suit.includes('♦️') ||
    suit.includes('♥') ||
    suit.includes('♦') ||
    suit === 'hearts' ||
    suit === 'diamonds';
  const rankColor = isRedSuit ? 'text-red-600' : 'text-black';

  return (
    <motion.div
      onClick={isPlayerCard ? onClick : undefined}
      className={`
        relative w-[var(--card-width,120px)]
        perspective-1000
        mx-auto
        card ${isFlipped ? 'flipped' : ''}
      `}
      style={{ aspectRatio: cardAspectRatio }}
      initial={{ scale: 0.95, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={isPlayerCard ? { scale: 1.05, y: -5 } : undefined}
      whileTap={isPlayerCard ? { scale: 0.98 } : undefined}
    >
      {!singleCard && (
        <>
          <motion.div
            className="absolute top-2 left-1 w-full h-full bg-[#7b1fa2] rounded-xl opacity-40"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
          <motion.div
            className="absolute top-1 left-0.5 w-full h-full bg-[#7b1fa2] rounded-xl opacity-60"
            initial={{ scale: 0.99 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          />
        </>
      )}

      <motion.div
        className="relative w-full h-full transform-style-preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.5,
          type: 'spring',
          stiffness: 300,
          damping: 25,
          delay: isPlayerCard ? 0 : 0.2,
        }}
      >
        {/* Face-down: purple "N" back (unchanged) */}
        <motion.div
          className={`
            absolute w-full h-full
            bg-gradient-to-br from-[#1a0933] via-[#4a148c] to-[#7b1fa2] rounded-xl
            flex justify-center items-center
            backface-hidden
            overflow-hidden
            shadow-lg
          `}
          initial={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
          animate={{ boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)' }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-full h-full flex justify-center items-center">
            <div className="absolute inset-0 opacity-15">
              <div className="w-full h-full grid grid-cols-8 grid-rows-12">
                {Array.from({ length: 96 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-white/20" />
                ))}
              </div>
            </div>
            <div className="absolute inset-[3px] rounded-lg border-2 border-purple-400/50 shadow-[inset_0_0_10px_rgba(128,0,255,0.2)]">
              <div className="absolute inset-[8px] rounded-md border border-purple-400/30" />
            </div>
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="relative text-7xl font-bold text-purple-300 drop-shadow-[0_0_8px_rgba(128,0,255,0.7)]">
                N
              </div>
            </div>
            <div className="absolute top-3 left-3 text-xl text-purple-200/90">♠</div>
            <div className="absolute top-3 right-3 text-xl text-purple-200/90">♣</div>
            <div className="absolute bottom-3 left-3 text-xl text-purple-200/90">♥</div>
            <div className="absolute bottom-3 right-3 text-xl text-purple-200/90">♦</div>
          </div>
        </motion.div>

        {/* Face-up: Crudeboys NFT (visible after flip) */}
        <motion.div
          className={`
            absolute w-full h-full
            rounded-xl shadow-xl
            backface-hidden rotate-y-180
            overflow-hidden
            ${rankColor}
          `}
          initial={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
          animate={{ boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)' }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-full h-full bg-white">
            {imageSrc && !frontImageFailed ? (
              <img
                key={imageSrc}
                src={imageSrc}
                alt={rank ? `${rank} ${suit}` : 'Card face'}
                className="absolute inset-0 h-full w-full rounded-[10px] object-contain"
                onLoad={(event) => {
                  const { naturalWidth, naturalHeight } = event.currentTarget;
                  if (naturalWidth > 0 && naturalHeight > 0) {
                    setCardAspectRatio(naturalWidth / naturalHeight);
                  }
                }}
                onError={() => {
                  setImageSrc(null);
                  setFrontImageFailed(true);
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-br from-white to-gray-50 p-2">
                <div className={`font-bold text-2xl ${rankColor}`}>{rank}</div>
                <div className={`text-6xl self-center ${rankColor}`}>{suit}</div>
                <div className={`font-bold text-2xl self-end rotate-180 ${rankColor}`}>{rank}</div>
              </div>
            )}

            {showRankOverlay && rank && !frontImageFailed && (
              <>
                <div className="pointer-events-none absolute left-1 top-1 z-10 flex flex-col items-center drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                  <div className={`font-bold ${rank.length > 1 ? 'text-xl' : 'text-2xl'}`}>{rank}</div>
                  <div className={`${rank.length > 1 ? 'text-xl' : 'text-2xl'} -mt-1`}>{suit}</div>
                </div>
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                  <div className={`text-6xl drop-shadow-[0_2px_4px_rgba(255,255,255,0.85)] ${rankColor}`}>
                    {suit}
                  </div>
                </div>
                <div className="pointer-events-none absolute bottom-1 right-1 z-10 flex rotate-180 flex-col items-center drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                  <div className={`font-bold ${rank.length > 1 ? 'text-xl' : 'text-2xl'}`}>{rank}</div>
                  <div className={`${rank.length > 1 ? 'text-xl' : 'text-2xl'} -mt-1`}>{suit}</div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
//