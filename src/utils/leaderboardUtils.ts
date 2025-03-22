export interface LeaderboardEntry {
  fid: string;
  username: string;
  wins: number;
  losses: number;
  lastPlayed: Date;
}

export async function fetchLeaderboardData(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch('/api/nuke?action=leaderboard&limit=10');
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard data');
    }
    
    const data = await response.json();
    
    if (data.leaderboard) {
      return Promise.all(data.leaderboard.map(async (entry: any) => {
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
            fid: entry.fid,
            username: `fid:${entry.fid}`,
            wins: entry.wins || 0,
            losses: entry.losses || 0,
            lastPlayed: entry.lastPlayed ? new Date(entry.lastPlayed) : new Date()
          };
        }
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    throw error;
  }
}
