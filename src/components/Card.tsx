import { FC } from 'react';

interface CardProps {
  suit: string;
  rank: string;
  isFlipped: boolean;
  isPlayerCard: boolean;
  onClick?: () => void;
  isNukeActive?: boolean;
}

export default function Card({ suit, rank, isFlipped, isPlayerCard, onClick, isNukeActive }: CardProps) {
  const borderClass = isNukeActive 
    ? 'border-2 border-red-500 animate-nuke-border' 
    : 'border-2 border-green-500';

  return (
    <div
      onClick={isPlayerCard ? onClick : undefined}
      className={`
        relative w-[120px] h-[168px] 
        transform transition-transform duration-300 ease-in-out
        ${isPlayerCard ? 'hover:scale-105 cursor-pointer' : ''}
        perspective-1000
        mx-auto
        card ${isFlipped ? 'flipped' : ''}
      `}
    >
      {/* Stack effect - bottom card */}
      <div className={`absolute top-2 left-1 w-full h-full bg-[#3f51b5] rounded-xl ${borderClass} opacity-40`} />
      
      {/* Stack effect - middle card */}
      <div className={`absolute top-1 left-0.5 w-full h-full bg-[#3f51b5] rounded-xl ${borderClass} opacity-60`} />

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
            bg-gradient-to-br from-[#4a148c] via-[#7b1fa2] to-[#9c27b0] rounded-xl
            ${borderClass}
            flex justify-center items-center
            backface-hidden
            overflow-hidden
            shadow-lg
          `}
        >
          <div className="relative w-full h-full flex justify-center items-center">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full grid grid-cols-8 grid-rows-12">
                {Array.from({ length: 96 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-white/20"></div>
                ))}
              </div>
            </div>
            
            {/* Card border with glow effect */}
            <div className="absolute inset-[3px] rounded-lg border-2 border-purple-400/70 shadow-[inset_0_0_10px_rgba(128,0,255,0.3)]">
              {/* Inner decoration line */}
              <div className="absolute inset-[8px] rounded-md border border-purple-400/30"></div>
            </div>
            
            {/* Central emblem */}
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="relative">
                {/* Background halo */}
                <div className="absolute -inset-8 bg-purple-500/10 rounded-full blur-md"></div>
                
                {/* Main N logo with enhanced style */}
                <div className="relative text-7xl font-bold text-purple-400 drop-shadow-[0_0_8px_rgba(128,0,255,0.7)]">
                  <span className="animate-glow">N</span>
                </div>
                
                {/* Subtle outer rings */}
                <div className="absolute -inset-4 border-2 border-purple-500/20 rounded-full"></div>
                <div className="absolute -inset-6 border border-purple-500/10 rounded-full"></div>
              </div>
            </div>
            
            {/* Corner suit symbols with enhanced styling */}
            <div className="absolute top-3 left-3 text-xl text-white/80 drop-shadow-md transform -rotate-12">♠</div>
            <div className="absolute top-3 right-3 text-xl text-white/80 drop-shadow-md transform rotate-12">♣</div>
            <div className="absolute bottom-3 left-3 text-xl text-purple-300/90 drop-shadow-md transform rotate-12">♥</div>
            <div className="absolute bottom-3 right-3 text-xl text-purple-300/90 drop-shadow-md transform -rotate-12">♦</div>
            
            {/* Diagonal line decorations */}
            <div className="absolute h-[200%] w-[1px] bg-purple-400/20 rotate-45 transform-origin-center"></div>
            <div className="absolute h-[200%] w-[1px] bg-purple-400/20 -rotate-45 transform-origin-center"></div>
            <div className="absolute h-[150%] w-[1px] bg-purple-400/30 rotate-[30deg] transform-origin-center"></div>
            <div className="absolute h-[150%] w-[1px] bg-purple-400/30 -rotate-[30deg] transform-origin-center"></div>
            
            {/* Small decorative elements */}
            <div className="absolute top-1/4 left-1/4 text-xs text-purple-300/50">•</div>
            <div className="absolute top-1/4 right-1/4 text-xs text-purple-300/50">•</div>
            <div className="absolute bottom-1/4 left-1/4 text-xs text-purple-300/50">•</div>
            <div className="absolute bottom-1/4 right-1/4 text-xs text-purple-300/50">•</div>
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