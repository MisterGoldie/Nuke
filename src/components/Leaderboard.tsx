import { useState, useEffect } from 'react';
import sdk from '@farcaster/frame-sdk';

interface LeaderboardEntry {
  fid: string;
  username: string;
  wins: number;
  losses: number;
  lastPlayed: Date;
}

export default function Leaderboard({ currentUserFid, onBack }: { currentUserFid?: string, onBack: () => void }) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/nuke?action=leaderboard&limit=10');
        const data = await response.json();
        
        if (data.leaderboard) {
          const entries = await Promise.all(data.leaderboard.map(async (entry: any) => {
            const query = `
              query ($fid: String!) {
                Socials(input: {filter: {dappName: {_eq: farcaster}, userId: {_eq: $fid}}, blockchain: ethereum}) {
                  Social {
                    profileName
                  }
                }
              }
            `;

            try {
              const response = await fetch(process.env.NEXT_PUBLIC_AIRSTACK_API_URL!, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': process.env.NEXT_PUBLIC_AIRSTACK_API_KEY!,
                },
                body: JSON.stringify({ 
                  query, 
                  variables: { fid: entry.fid.toString() } 
                }),
              });

              const data = await response.json();
              const username = data?.data?.Socials?.Social?.[0]?.profileName;

              return {
                fid: entry.fid,
                username: username || `fid:${entry.fid}`,
                wins: entry.wins || 0,
                losses: entry.losses || 0,
                lastPlayed: entry.lastPlayed ? new Date(entry.lastPlayed) : new Date()
              };
            } catch (error) {
              console.error('Error fetching username for FID:', entry.fid, error);
              return {
                ...entry,
                username: `fid:${entry.fid}`
              };
            }
          }));
          
          setLeaderboardData(entries);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="arcade-container flex flex-col items-center p-8">
      <h1 className="arcade-text text-4xl mb-6 title-glow">LEADERBOARD</h1>

      <div className="w-full max-w-md space-y-4 mb-8 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="arcade-text text-xl animate-pulse">Loading...</div>
        ) : (
          leaderboardData.map((entry, index) => (
            <div 
              key={entry.fid} 
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
          ))
        )}
      </div>

      <button
        onClick={() => {
          const shareText = 'Play "Nuke" by @goldie and /thepod team 🃏';
          const shareUrl = 'nuke-podplay.vercel.app';
          sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`);
        }}
        className="arcade-button text-xl py-3 px-8 mb-4"
        style={{
          textShadow: '0 0 10px #a855f7, 0 0 20px #a855f7, 0 0 30px #a855f7',
          boxShadow: '0 0 10px rgba(168, 85, 247, 0.3), inset 0 0 10px rgba(168, 85, 247, 0.2)',
          color: '#a855f7',
          borderColor: '#a855f7'
        }}
      >
        SHARE GAME
      </button>

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