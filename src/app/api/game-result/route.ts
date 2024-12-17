import { db } from '~/utils/firebase-admin';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const result = await request.json();
    
    // Update player stats - just wins and losses
    const playerRef = db.collection('nuke_players').doc(result.fid);
    await playerRef.set({
      [`${result.outcome}s`]: admin.firestore.FieldValue.increment(1),
      lastPlayed: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing game result:', error);
    return NextResponse.json({ error: 'Failed to store result' }, { status: 500 });
  }
} 