import { db } from '~/utils/firebase';
import { fetchUserDataByFid } from '../../../utils/neynarUtils';
import { checkFanTokenOwnership } from '../../../utils/tokenUtils';
import { calculatePODScore } from '../../../utils/scoreUtils';
import { NUKE_PLAYERS_COLLECTION } from '~/lib/firebaseCollections';
import { storeGameResult } from '~/utils/nukeFirebase';

export async function POST(request: Request) {
  try {
    const { fid, action } = await request.json();

    if (!fid) {
      return Response.json({ error: 'FID is required' }, { status: 400 });
    }

    if (action !== 'win' && action !== 'loss' && action !== 'tie') {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    await storeGameResult({
      playerFid: String(fid),
      outcome: action,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Firebase operation failed:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userFid = searchParams.get('userFid');

    const usersRef = db.collection(NUKE_PLAYERS_COLLECTION);

    const leaderboardSnapshot = await usersRef
      .orderBy('wins', 'desc')
      .limit(10)
      .get();

    const leaderboard = await Promise.all(
      leaderboardSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const userData = await fetchUserDataByFid(doc.id);
        const totalGames = (data.wins || 0) + (data.losses || 0) + (data.ties || 0);
        const { balance } = await checkFanTokenOwnership(doc.id);

        const podScore = calculatePODScore(
          data.wins || 0,
          data.ties || 0,
          data.losses || 0,
          totalGames,
          balance || 0
        );

        return {
          fid: doc.id,
          username: userData?.username || `fid:${doc.id}`,
          wins: data.wins || 0,
          losses: data.losses || 0,
          ties: data.ties || 0,
          pfp: userData?.pfp || '',
          podScore
        };
      })
    );

    let userData = null;
    if (userFid) {
      const userDoc = await usersRef.doc(userFid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        if (!data) {
          throw new Error('User data is undefined');
        }
        const userDataFromFarcaster = await fetchUserDataByFid(userFid);
        const totalGames = (data.wins || 0) + (data.losses || 0) + (data.ties || 0);
        const { balance } = await checkFanTokenOwnership(userFid);

        userData = {
          fid: userFid,
          username: userDataFromFarcaster?.username || `fid:${userFid}`,
          wins: data?.wins || 0,
          losses: data?.losses || 0,
          ties: data?.ties || 0,
          pfp: userDataFromFarcaster?.pfp || '',
          podScore: calculatePODScore(
            data.wins || 0,
            data.ties || 0,
            data.losses || 0,
            totalGames,
            balance || 0
          )
        };
      }
    }

    return Response.json({ leaderboard, userData });
  } catch (error) {
    console.error('Error fetching data:', error);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
