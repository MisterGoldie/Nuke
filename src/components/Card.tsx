import { motion } from 'framer-motion';

interface CardProps {
  suit: string;
  rank: string;
  isFlipped: boolean;
  isPlayerCard: boolean;
  onClick?: () => void;
  isNukeActive?: boolean;
  singleCard?: boolean; // Add option to display as a single card without stack effect
}

export default function Card({ suit, rank, isFlipped, isPlayerCard, onClick, isNukeActive, singleCard = false }: CardProps) {
  // Determine if the card is red (hearts/diamonds) or black (spades/clubs)
  const isRedCard = suit.includes('♥️') || suit.includes('♦️') || suit.includes('♥') || suit.includes('♦');
  
  const borderClass = isNukeActive 
    ? 'border-2 border-red-500 animate-nuke-border' 
    : 'border-2 border-green-500';

  return (
    <motion.div
      onClick={isPlayerCard ? onClick : undefined}
      className={`
        relative w-[120px] h-[168px] 
        perspective-1000
        mx-auto
        card ${isFlipped ? 'flipped' : ''}
      `}
      initial={{ scale: 0.95, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={isPlayerCard ? { scale: 1.05, y: -5 } : undefined}
      whileTap={isPlayerCard ? { scale: 0.98 } : undefined}
    >
      {/* Stack effect - only shown when singleCard is false */}
      {!singleCard && (
        <>
          {/* Stack effect - bottom card */}
          <motion.div 
            className={`absolute top-2 left-1 w-full h-full bg-[#7b1fa2] rounded-xl ${borderClass} opacity-40`}
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
          
          {/* Stack effect - middle card */}
          <motion.div 
            className={`absolute top-1 left-0.5 w-full h-full bg-[#7b1fa2] rounded-xl ${borderClass} opacity-60`}
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
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          delay: isPlayerCard ? 0 : 0.2
        }}
      >
        {/* Front of card (back design) */}
        <motion.div
          className={`
            absolute w-full h-full
            bg-gradient-to-br from-[#1a0933] via-[#4a148c] to-[#7b1fa2] rounded-xl
            ${borderClass}
            flex justify-center items-center
            backface-hidden
            overflow-hidden
            shadow-lg
          `}
          initial={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
          animate={{ boxShadow: "0 8px 15px rgba(0, 0, 0, 0.2)" }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-full h-full flex justify-center items-center">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-15">
              <div className="w-full h-full grid grid-cols-8 grid-rows-12">
                {Array.from({ length: 96 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-white/20"></div>
                ))}
              </div>
            </div>
            
            {/* Card border with glow effect */}
            <div className="absolute inset-[3px] rounded-lg border-2 border-purple-400/50 shadow-[inset_0_0_10px_rgba(128,0,255,0.2)]">
              {/* Inner decoration line */}
              <div className="absolute inset-[8px] rounded-md border border-purple-400/30"></div>
            </div>
            
            {/* Central emblem */}
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="relative">
                {/* Background glow */}
                <div className="absolute -inset-8 bg-purple-500/10 rounded-full blur-md"></div>
                
                {/* Main N logo with enhanced style */}
                <div className="relative text-7xl font-bold text-purple-300 drop-shadow-[0_0_8px_rgba(128,0,255,0.7)]">
                  <span>N</span>
                </div>
                
                {/* Subtle outer rings - static, no animations */}
                <div className="absolute -inset-4 border-2 border-purple-500/30 rounded-full" />
                <div className="absolute -inset-6 border border-purple-500/20 rounded-full" />
              </div>
            </div>
            
            {/* Corner suit symbols with enhanced styling */}
            <div className="absolute top-3 left-3 text-xl text-purple-200/90 drop-shadow-md transform -rotate-12">♠</div>
            <div className="absolute top-3 right-3 text-xl text-purple-200/90 drop-shadow-md transform rotate-12">♣</div>
            <div className="absolute bottom-3 left-3 text-xl text-purple-200/90 drop-shadow-md transform rotate-12">♥</div>
            <div className="absolute bottom-3 right-3 text-xl text-purple-200/90 drop-shadow-md transform -rotate-12">♦</div>
            
            {/* Diagonal line decorations - static, no animations */}
            <div className="absolute h-[200%] w-[1px] bg-purple-400/20 rotate-45 transform-origin-center" />
            <div className="absolute h-[200%] w-[1px] bg-purple-400/20 -rotate-45 transform-origin-center" />
            
            {/* Small decorative elements - static, no animations */}
            <div className="absolute top-1/4 left-1/4 text-xs text-purple-300/50">•</div>
            <div className="absolute top-1/4 right-1/4 text-xs text-purple-300/50">•</div>
            <div className="absolute bottom-1/4 left-1/4 text-xs text-purple-300/50">•</div>
            <div className="absolute bottom-1/4 right-1/4 text-xs text-purple-300/50">•</div>
          </div>
        </motion.div>

        {/* Back of card (card face) */}
        <motion.div
          className={`
            absolute w-full h-full
            bg-gradient-to-br from-white via-white to-gray-50 rounded-xl shadow-xl
            border-2 ${isNukeActive ? 'border-red-500 animate-nuke-border' : 'border-green-500'}
            flex flex-col justify-between p-2
            backface-hidden rotate-y-180
            overflow-hidden
            ${suit.includes('♥️') || suit.includes('♦️') || suit.includes('♥') || suit.includes('♦') ? 'text-red-600' : 'text-black'}
          `}
          initial={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
          animate={{ boxShadow: "0 8px 15px rgba(0, 0, 0, 0.2)" }}
          transition={{ duration: 0.5 }}
        >
          {/* Card inner border with subtle pattern */}
          <div className="absolute inset-[3px] rounded-lg border border-gray-200">
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full grid grid-cols-6 grid-rows-8">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-black/5"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Top left rank and suit */}
          <div className="self-start z-10 flex flex-col items-center ml-1 mt-1">
            <div className={`font-bold ${rank.length > 1 ? 'text-xl' : 'text-2xl'}`}>{rank}</div>
            <div className={`${rank.length > 1 ? 'text-xl' : 'text-2xl'} -mt-1`}>{suit}</div>
          </div>

          {/* Center suit display with decorative elements */}
          <div className="absolute inset-0 flex justify-center items-center z-10">
            {/* Main center suit symbol */}
            <div className={`text-6xl transform ${suit.includes('♥️') || suit.includes('♦️') || suit.includes('♥') || suit.includes('♦') ? 'text-red-600' : 'text-black'}`}>
              {suit}
            </div>

            {/* Decorative background elements */}
            <div className="absolute inset-0 flex justify-center items-center opacity-5">
              <div className="w-32 h-32 rounded-full border-8 border-current"></div>
              <div className="absolute w-40 h-40 rounded-full border-2 border-current"></div>
            </div>
          </div>

          {/* Bottom right rank and suit (inverted) */}
          <div className="self-end z-10 flex flex-col items-center mr-1 mb-1 transform rotate-180">
            <div className={`font-bold ${rank.length > 1 ? 'text-xl' : 'text-2xl'}`}>{rank}</div>
            <div className={`${rank.length > 1 ? 'text-xl' : 'text-2xl'} -mt-1`}>{suit}</div>
          </div>

          {/* Additional decorative elements based on card rank */}
          {(rank === 'A') && (
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="w-24 h-24 border-2 border-current opacity-10 rounded-lg transform rotate-45"></div>
            </div>
          )}
          {(['K', 'Q', 'J'].includes(rank)) && (
            <div className="absolute inset-0 flex justify-center items-center">
              <div className="w-20 h-20 border border-current opacity-10 rounded-full"></div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
} 