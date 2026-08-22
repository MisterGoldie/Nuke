'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getCrudeboysSrc } from '../lib/crudeboysArt';

const DEFAULT_CARD_ASPECT_RATIO = 1300 / 1500;

interface CardProps {
  suit: string;
  rank: string;
  isFlipped: boolean;
  isPlayerCard: boolean;
  onClick?: () => void;
  isNukeActive?: boolean;
  singleCard?: boolean;
  /** Crudeboys item id for this specific card in the current game */
  artId?: string;
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
  artId,
  frontImageSrc,
  showRankOverlay = false,
}: CardProps) {
  const targetSrc = frontImageSrc ?? getCrudeboysSrc(artId);
  const [imageSrc, setImageSrc] = useState<string | null>(targetSrc);
  const [frontImageFailed, setFrontImageFailed] = useState(false);
  const [cardAspectRatio, setCardAspectRatio] = useState(DEFAULT_CARD_ASPECT_RATIO);

  useEffect(() => {
    setImageSrc(targetSrc);
    setFrontImageFailed(false);
  }, [targetSrc]);

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
        relative ${singleCard ? 'h-full w-full' : 'mx-auto w-[var(--card-width,120px)]'}
        card ${isFlipped ? 'flipped' : ''}
      `}
      style={{
        aspectRatio: cardAspectRatio,
        perspective: 1600,
        perspectiveOrigin: '50% 50%',
      }}
      initial={false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={isPlayerCard && onClick ? { scale: 1.04, y: -4 } : undefined}
      whileTap={isPlayerCard && onClick ? { scale: 0.98 } : undefined}
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.85,
          ease: [0.45, 0.05, 0.25, 1],
          delay: isPlayerCard ? 0 : 0.12,
        }}
      >
        {/* Face-down: purple "N" back */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl shadow-lg [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
          style={{
            background: 'linear-gradient(to bottom right, #1a0933, #4a148c, #7b1fa2)',
          }}
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
        </div>

        {/* Face-up: Crudeboys WebP */}
        <div
          className={`absolute inset-0 overflow-hidden rounded-xl shadow-xl [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)] ${rankColor}`}
        >
          <div className="relative w-full h-full bg-white">
            {imageSrc && !frontImageFailed ? (
              <img
                key={imageSrc}
                src={imageSrc}
                alt={rank ? `${rank} ${suit}` : 'Card face'}
                className="absolute inset-0 h-full w-full rounded-[10px] object-cover"
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
        </div>
      </motion.div>
    </motion.div>
  );
}
