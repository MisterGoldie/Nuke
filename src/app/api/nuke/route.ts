import { NextRequest } from 'next/server';
import { 
  storeGameResult, 
  getPlayerStats, 
  getLeaderboard,
  getRecentGames 
} from '~/utils/nukeFirebase';

export async function POST(request: NextRequest) {
  try {
    const gameResult = await request.json();
    
    // Validate required fields
    if (!gameResult.playerFid || !gameResult.outcome) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Store the result using the existing function
    await storeGameResult(gameResult);
    
    return Response.json({ 
      success: true,
      message: 'Game result stored successfully'
    });
  } catch (error) {
    console.error('Error storing game result:', error);
    return Response.json({ 
      error: 'Failed to store game result',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const playerFid = searchParams.get('playerFid');
    const limit = parseInt(searchParams.get('limit') || '10');

    switch (action) {
      case 'stats':
        if (!playerFid) {
          return Response.json({ error: 'Player FID required' }, { status: 400 });
        }
        const stats = await getPlayerStats(playerFid);
        return Response.json({ stats });

      case 'leaderboard':
        const leaderboard = await getLeaderboard(limit);
        return Response.json({ leaderboard });
      case 'recent':
        if (!playerFid) {
          return Response.json({ error: 'Player FID required' }, { status: 400 });
        }
        const games = await getRecentGames(playerFid, limit);
        return Response.json({ games });

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in GET /api/nuke:', error);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
} 