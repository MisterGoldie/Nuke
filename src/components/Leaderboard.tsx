import { useState, useEffect } from 'react';
import sdk from '@farcaster/frame-sdk';
import { useLeaderboardManager } from './LeaderboardManager';
import { LeaderboardEntry } from '../utils/leaderboardUtils';

export default function Leaderboard({ currentUserFid, onBack }: { currentUserFid?: string, onBack: () => void }) {
  const { leaderboardData, isLoading, error } = useLeaderboardManager();

  if (isLoading) {
    return <div>Loading leaderboard...</div>;
  }

  if (error) {
    return <div>Error loading leaderboard: {error.message}</div>;
  }

  return (
    <div className="arcade-container flex flex-col items-center p-8">
      <h1 className="arcade-text text-4xl mb-6 title-glow">LEADERBOARD</h1>

      <div className="w-full max-w-md space-y-4 mb-8 max-h-[400px] overflow-y-auto">
        {leaderboardData.map((entry, index) => (
          <div 
            key={index} 
            className={`flex items-center justify-between p-4 border-2 border-green-500 rounded-lg ${
              entry.fid === currentUserFid ? 'bg-green-900/30' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="arcade-text text-2xl text-green-400">#{index + 1}</span>
              <span className="arcade-text text-xl">{entry.username}</span>
            </div>
            <div className="arcade-text text-xl text-green-400">
              {entry.wins} wins
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 w-[260px]">
        <button
          onClick={() => {
            const shareText = 'Play "Nuke" by @goldie and /thepod team 🃏';
            const shareUrl = 'nuke-podplay.vercel.app';
            sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`);
          }}
          className="arcade-button glow-purple text-2xl py-3"
        >
          SHARE GAME
        </button>
        
        <button
          onClick={onBack}
          className="arcade-button glow-yellow text-2xl py-3"
        >
          BACK TO MENU
        </button>
      </div>
    </div>
  );
}