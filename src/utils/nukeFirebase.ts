import { db } from './firebase';
import { FieldValue } from 'firebase-admin/firestore';

interface GameResult {
  playerFid: string;
  outcome: 'win' | 'loss' | 'tie';
  timestamp?: FieldValue;
}

interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
  lastPlayed: FieldValue;
}

// Store game result
export async function storeGameResult(gameResult: GameResult) {
  try {
    const { playerFid } = gameResult;
    
    // Create batch write
    const batch = db.batch();
    
    // Add to games collection with simplified data
    const gameRef = db.collection('nuke_games').doc();
    batch.set(gameRef, {
      playerFid,
      outcome: gameResult.outcome,
      timestamp: FieldValue.serverTimestamp()
    });
    
    // Update player stats with simplified data
    const playerRef = db.collection('nuke_players').doc(playerFid);
    const statsUpdate: Partial<PlayerStats> = {
      totalGames: FieldValue.increment(1) as unknown as number,
      [`${gameResult.outcome}s`]: FieldValue.increment(1) as unknown as number,
      lastPlayed: FieldValue.serverTimestamp()
    };
    
    batch.set(playerRef, statsUpdate, { merge: true });
    await batch.commit();
    console.log(`Stored game result for player ${playerFid}`);
    
  } catch (error) {
    console.error('Error storing game result:', error);
    throw error;
  }
}

// Get player stats
export async function getPlayerStats(playerFid: string): Promise<PlayerStats | null> {
  try {
    const doc = await db.collection('nuke_players').doc(playerFid).get();
    return doc.exists ? doc.data() as PlayerStats : null;
  } catch (error) {
    console.error('Error getting player stats:', error);
    throw error;
  }
}

// Get leaderboard
export async function getLeaderboard(limit: number = 10) {
  try {
    const usersRef = db.collection('nuke_players');
    const leaderboardSnapshot = await usersRef
      .orderBy('wins', 'desc')
      .limit(limit)
      .get();
      
    return leaderboardSnapshot.docs.map(doc => ({
      fid: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
}

// Get recent games
export async function getRecentGames(playerFid?: string, limit: number = 10) {
  try {
    let query = db.collection('nuke_games')
      .orderBy('timestamp', 'desc')
      .limit(limit);
      
    if (playerFid) {
      query = query.where('playerFid', '==', playerFid);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting recent games:', error);
    throw error;
  }
}

// Update high score
export async function updateHighScore(playerFid: string, newScore: number) {
  try {
    const playerRef = db.collection('nuke_players').doc(playerFid);
    await playerRef.set({
      highScore: FieldValue.increment(newScore)
    }, { merge: true });
  } catch (error) {
    console.error('Error updating high score:', error);
    throw error;
  }
}