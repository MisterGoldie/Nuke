'use client';

import { useEffect, useState } from 'react';
import { fetchLeaderboardData, LeaderboardEntry } from '../utils/leaderboardUtils';

export function useLeaderboardManager() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadLeaderboardData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchLeaderboardData();
        setLeaderboardData(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboardData();
  }, []);

  return {
    leaderboardData,
    isLoading,
    error
  };
}
