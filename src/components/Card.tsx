import { FC } from 'react';

interface CardProps {
  suit: string;
  rank: string;
  isFlipped: boolean;
  isPlayerCard: boolean;
  onClick?: () => void;
}

export default function Card({ suit, rank, isFlipped, isPlayerCard, onClick }: CardProps) {
  return (
    <div
      onClick={isPlayerCard ? onClick : undefined}
      className={`
        relative w-[120px] h-[168px] 
        transform transition-transform duration-300 ease-in-out
        ${isPlayerCard ? 'hover:scale-105 cursor-pointer' : ''}
        perspective-1000
        mx-auto
      `}
    >
      <div
        className={`
          relative w-full h-full
          transition-transform duration-500 ease-in-out
          transform-style-preserve-3d
          ${isFlipped ? `rotate-y-180 ${isPlayerCard ? '' : 'delay-300'}` : 'rotate-y-0'}
        `}
        style={{
          transitionDelay: isPlayerCard ? '0ms' : '300ms'
        }}
      >
        {/* Front of card (back design) */}
        <div
          className={`
            absolute w-full h-full
            bg-[#1a237e] rounded-xl
            border-2 border-green-500
            flex justify-center items-center
            backface-hidden
            overflow-hidden
          `}
        >
          <div className="relative w-full h-full flex justify-center items-center">
            {/* Glowing border effect */}
            <div className="absolute inset-0 border-4 border-green-500 rounded-xl animate-pulse"></div>
            
            {/* Center design */}
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="text-6xl font-bold text-green-500 animate-glow">N</div>
            </div>
            
            {/* Corner patterns */}
            <div className="absolute top-4 left-4 text-green-500 text-xl">♠️</div>
            <div className="absolute top-4 right-4 text-green-500 text-xl">♣️</div>
            <div className="absolute bottom-4 left-4 text-green-500 text-xl">♥️</div>
            <div className="absolute bottom-4 right-4 text-green-500 text-xl">♦️</div>
            
            {/* Diagonal patterns */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex justify-center items-center text-green-500">
                  {i % 2 === 0 ? '★' : '•'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Back of card (card face) */}
        <div
          className={`
            absolute w-full h-full
            bg-white rounded-xl shadow-xl
            border-2 border-green-500
            flex flex-col justify-between p-4
            backface-hidden rotate-y-180
            ${suit.includes('♥️') || suit.includes('♦️') ? 'text-red-600' : 'text-black'}
          `}
        >
          <div className="self-start text-xl">{rank}{suit}</div>
          <div className="text-4xl self-center">{suit}</div>
          <div className="self-end text-xl rotate-180">{rank}{suit}</div>
        </div>
      </div>
    </div>
  );
} 