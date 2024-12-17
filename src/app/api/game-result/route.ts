import { db } from '~/utils/firebase-admin';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const result = await request.json();
    
    // Update player stats
    const playerRef = db.collection('nuke_players').doc(result.playerFid);
    await playerRef.set({
      totalGames: admin.firestore.FieldValue.increment(1),
      [`${result.outcome}s`]: admin.firestore.FieldValue.increment(1),
      [`${result.difficulty}Wins`]: result.outcome === 'win' 
        ? admin.firestore.FieldValue.increment(1) 
        : admin.firestore.FieldValue.increment(0),
      lastPlayed: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Store game result
    await db.collection('nuke_games').add({
      ...result,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing game result:', error);
    return NextResponse.json({ error: 'Failed to store result' }, { status: 500 });
  }
} 