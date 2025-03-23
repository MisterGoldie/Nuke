import { motion } from 'framer-motion';

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
            bg-gradient-to-br from-[#4a148c] via-[#7b1fa2] to-[#9c27b0] rounded-xl
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
        </motion.div>

        {/* Back of card (card face) */}
        <motion.div
          className={`
            absolute w-full h-full
            bg-white rounded-xl shadow-xl
            border-2 border-green-500
            flex flex-col justify-between p-4
            backface-hidden rotate-y-180
            ${suit.includes('♥️') || suit.includes('♦️') ? 'text-red-600' : 'text-black'}
          `}
          initial={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
          animate={{ boxShadow: "0 8px 15px rgba(0, 0, 0, 0.2)" }}
          transition={{ duration: 0.5 }}
        >
          <div className="self-start text-xl">{rank}{suit}</div>
          <div className="text-4xl self-center">{suit}</div>
          <div className="self-end text-xl rotate-180">{rank}{suit}</div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
} 