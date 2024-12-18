import { useState } from 'react';

type LeaderboardProps = {
  isMuted: boolean;
  playGameJingle: () => void;
  currentUserFid?: string;
  pfpUrl?: string;
  onBack: () => void;
};

export default function Leaderboard({ isMuted, playGameJingle, currentUserFid, pfpUrl, onBack }: LeaderboardProps) {
  return (
    <div className="arcade-container flex flex-col items-center p-8">
      <h1 className="arcade-text text-4xl mb-6 title-glow">LEADERBOARD</h1>

      <div className="w-full max-w-md space-y-4 mb-8">
        <div className="arcade-text text-xl text-center">
          Coming Soon!
        </div>
      </div>

      <button
        onClick={onBack}
        className="arcade-button text-xl py-3 px-8"
        style={{
          textShadow: '0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700',
          boxShadow: '0 0 10px rgba(255, 215, 0, 0.3), inset 0 0 10px rgba(255, 215, 0, 0.2)',
          color: '#ffd700',
          borderColor: '#ffd700'
        }}
      >
        BACK TO MENU
      </button>
    </div>
  );
} 
////