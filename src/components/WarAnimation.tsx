import { motion, AnimatePresence } from 'framer-motion';
import CardComponent from './Card';

interface WarAnimationProps {
  isVisible: boolean;
  playerCard?: any;
  cpuCard?: any;
  warCards?: {player: any[], cpu: any[]};
  warStage: 'initial' | 'showing-cards' | 'drawing-cards' | 'complete';
  warWinner?: 'player' | 'cpu';
  warWinningCard?: any;
}

export default function WarAnimation({ 
  isVisible, 
  playerCard, 
  cpuCard, 
  warCards = {player: [], cpu: []},
  warStage,
  warWinner,
  warWinningCard
}: WarAnimationProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      
      {/* Matching cards that started the war */}
      {warStage === 'showing-cards' && (
        <div className="relative flex flex-col items-center mb-8">
          <div className="text-2xl text-white mb-4">MATCHING CARDS!</div>
          <div className="flex space-x-20">
            {playerCard && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <CardComponent
                  suit={playerCard.suit}
                  rank={playerCard.display}
                  isFlipped={true}
                  isPlayerCard={true}
                />
              </motion.div>
            )}
            {cpuCard && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <CardComponent
                  suit={cpuCard.suit}
                  rank={cpuCard.display}
                  isFlipped={true}
                  isPlayerCard={false}
                />
              </motion.div>
            )}
          </div>
        </div>
      )}
      
      {/* War animation with cards being drawn */}
      {warStage === 'drawing-cards' && (
        <div className="relative flex flex-col items-center">
          {/* WAR text */}
          <motion.div 
            className="text-[125px] font-bold text-red-500 mb-8" 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            style={{ 
              textShadow: '0 0 10px #ff0000',
              WebkitTextStroke: '2px #800000'
            }}
          >
            WAR!
          </motion.div>
          
          {/* Cards being drawn animation */}
          <div className="flex justify-between w-full px-20 mt-4">
            {/* Player cards */}
            <div className="flex flex-col items-center">
              <div className="text-xl text-white mb-2">YOUR CARDS</div>
              <div className="relative h-[200px] w-[120px]">
                {warCards.player.map((card, index) => (
                  <motion.div 
                    key={`player-${index}`}
                    className="absolute"
                    initial={{ x: -100, y: -50, opacity: 0, rotateY: 180 }}
                    animate={{ 
                      x: 0, 
                      y: index * 20, 
                      opacity: 1,
                      rotateY: 0
                    }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 0.2 + (index * 0.2)
                    }}
                  >
                    <div className="w-[120px] h-[168px] bg-purple-700 rounded-xl border-2 border-white flex items-center justify-center text-white">
                      <span className="text-3xl">?</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* CPU cards */}
            <div className="flex flex-col items-center">
              <div className="text-xl text-white mb-2">CPU CARDS</div>
              <div className="relative h-[200px] w-[120px]">
                {warCards.cpu.map((card, index) => (
                  <motion.div 
                    key={`cpu-${index}`}
                    className="absolute"
                    initial={{ x: 100, y: -50, opacity: 0, rotateY: 180 }}
                    animate={{ 
                      x: 0, 
                      y: index * 20, 
                      opacity: 1,
                      rotateY: 0 
                    }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 0.2 + (index * 0.2)
                    }}
                  >
                    <div className="w-[120px] h-[168px] bg-purple-700 rounded-xl border-2 border-white flex items-center justify-center text-white">
                      <span className="text-3xl">?</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Particles */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-red-500 rounded-full"
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0 
                }}
                animate={{ 
                  x: Math.cos(i * 30 * Math.PI / 180) * 200, 
                  y: Math.sin(i * 30 * Math.PI / 180) * 200,
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 1.5, 
                  delay: i * 0.05,
                  repeat: Infinity,
                  repeatType: 'loop'
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* War winner animation */}
      {warStage === 'complete' && warWinner && warWinningCard && (
        <div className="relative flex flex-col items-center justify-center w-full h-full">
          {/* Winner announcement */}
          <motion.div 
            className={`text-[80px] font-bold mb-12 text-center ${warWinner === 'player' ? 'text-green-500' : 'text-red-500'}`}
            initial={{ scale: 0.5, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            style={{ 
              textShadow: `0 0 10px ${warWinner === 'player' ? '#00ff00' : '#ff0000'}`,
              WebkitTextStroke: `2px ${warWinner === 'player' ? '#006400' : '#800000'}`
            }}
          >
            {warWinner === 'player' ? 'YOU WIN!' : 'CPU WINS!'}
          </motion.div>
          
          {/* Winning card animation */}
          <motion.div
            initial={{ scale: 0, rotateY: 180, opacity: 0 }}
            animate={{ scale: 1.8, rotateY: 0, opacity: 1 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.3,
              type: 'spring',
              stiffness: 200
            }}
            className="mb-12 relative"
          >
            {/* Card glow effect */}
            <div 
              className={`absolute inset-0 rounded-xl blur-md -z-10 ${warWinner === 'player' ? 'bg-green-500' : 'bg-red-500'}`} 
              style={{ transform: 'scale(1.15)' }}
            />
            <CardComponent
              suit={warWinningCard.suit === 'hearts' ? '♥️' : warWinningCard.suit === 'diamonds' ? '♦️' : warWinningCard.suit === 'clubs' ? '♣️' : '♠️'}
              rank={warWinningCard.display}
              isFlipped={true}
              isPlayerCard={warWinner === 'player'}
            />
          </motion.div>
          
          {/* Celebration particles */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-4 h-4 rounded-full ${warWinner === 'player' ? 'bg-green-500' : 'bg-red-500'}`}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0 
                }}
                animate={{ 
                  x: Math.cos(i * 18 * Math.PI / 180) * 300, 
                  y: Math.sin(i * 18 * Math.PI / 180) * 300,
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2, 
                  delay: i * 0.05,
                  repeat: 2,
                  repeatType: 'reverse'
                }}
              />
            ))}
          </div>
          
          {/* Cards won text */}
          <motion.div 
            className="text-3xl text-white mt-8 text-center font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            {warWinner === 'player' ? 'You won' : 'CPU won'} the war and collected cards!
          </motion.div>
        </div>
      )}
    </div>
  );
} 