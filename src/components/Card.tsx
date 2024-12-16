import { FC } from 'react';

interface CardProps {
  suit: string;
  rank: string;
  isFlipped: boolean;
  onClick?: () => void;
  isPlayerCard?: boolean;
}

const Card: FC<CardProps> = ({ suit, rank, isFlipped, onClick, isPlayerCard }) => {
  const getColor = () => {
    return suit === '♥️' || suit === '♦️' ? 'text-red-600' : 'text-black';
  };

  return (
    <div 
      className={`w-40 h-56 relative ${isPlayerCard ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={isPlayerCard ? onClick : undefined}
      style={{ transformStyle: 'preserve-3d', transition: 'transform 0.6s' }}
    >
      {/* Card Back */}
      <div 
        className="absolute w-full h-full"
        style={{ 
          backfaceVisibility: 'hidden',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        <div className="w-full h-full rounded-xl bg-white border-4 border-green-500 
          shadow-lg shadow-green-500/50 flex items-center justify-center p-2">
          <div className="w-full h-full rounded-lg bg-green-900 
            flex items-center justify-center">
            <div className="text-green-500 text-5xl font-bold">N</div>
          </div>
        </div>
      </div>
      
      {/* Card Front */}
      <div 
        className="absolute w-full h-full"
        style={{ 
          backfaceVisibility: 'hidden',
          transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)'
        }}
      >
        <div className="w-full h-full rounded-xl bg-white
          border-4 border-green-500 shadow-lg shadow-green-500/50 flex flex-col p-4">
          <div className={`text-2xl font-bold ${getColor()}`}>{rank}{suit}</div>
          <div className={`text-6xl font-bold flex-1 flex items-center justify-center ${getColor()}`}>
            {rank}{suit}
          </div>
          <div className={`text-2xl font-bold self-end ${getColor()}`}>{rank}{suit}</div>
        </div>
      </div>
    </div>
  );
};

export default Card; 