import { NextApiRequest, NextApiResponse } from "next";
import { storeGameResult } from "~/utils/nukeFirebase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    
    console.log('Received game result:', req.body);
    
    try {
        const { fid, outcome } = req.body;
        
        // Validate required fields
        if (!fid || !outcome) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Create game result object
        const gameResult = {
            playerFid: fid.toString(),
            outcome: outcome,
            score: outcome === 'win' ? 1 : 0,
            difficulty: 'medium' as const,  // default difficulty
            moves: 0,  // You can track moves if needed
        };

        // Store the result in Firebase
        await storeGameResult(gameResult);
        
        return res.status(200).json({ message: 'Game result recorded successfully' });
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ message: 'Error recording game result' });
    }
} 