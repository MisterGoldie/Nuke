import { useState, useEffect } from 'react';
import sdk from '@farcaster/frame-sdk';
import { useLeaderboardManager } from './LeaderboardManager';
import { LeaderboardEntry } from '~/utils/leaderboardUtils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Leaderboard({ currentUserFid, onBack }: { currentUserFid?: string, onBack: () => void }) {
  const { leaderboardData, isLoading, error } = useLeaderboardManager();

  if (isLoading) {
    return (
      <motion.div 
        className="arcade-container flex flex-col items-center justify-center p-8 h-[685px] w-[420px] bg-black relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="absolute inset-0 z-0 bg-gradient-to-b from-purple-900/20 to-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
        
        {/* Centered loading content */}
        <div className="flex flex-col items-center justify-center h-full w-full relative z-10">
          <motion.div 
            className="w-20 h-20 border-4 border-purple-500 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="arcade-text text-xl mt-6"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              textShadow: '0 0 10px #9c27b0, 0 0 20px #9c27b0',
              color: '#e0aaff'
            }}
          >
            Loading leaderboard...
          </motion.p>
        </div>
        
        {/* Decorative elements */}
        <motion.div 
          className="absolute top-20 left-4 text-4xl opacity-20 z-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          ♠
        </motion.div>
        <motion.div 
          className="absolute bottom-20 right-4 text-4xl opacity-20 z-0"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          ♦
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="arcade-container flex flex-col items-center justify-center p-8 h-[685px] w-[420px]">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="text-red-500 text-2xl mb-4"
        >
          ⚠️
        </motion.div>
        <motion.p 
          className="arcade-text text-xl text-red-400 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Error loading leaderboard:<br/>{error.message}
        </motion.p>
        <motion.button
          onClick={onBack}
          className="arcade-button glow-yellow text-xl py-2 mt-8"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          BACK TO MENU
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div 
      className="arcade-container flex flex-col items-center p-8 pt-96 pb-4 h-[685px] w-[420px] bg-black relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="absolute inset-0 z-0 bg-gradient-to-b from-purple-900/20 to-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      
      <motion.h1 
        className="arcade-text text-4xl mb-20 relative z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          textShadow: '0 0 10px #9c27b0, 0 0 20px #9c27b0, 0 0 30px #9c27b0',
          color: '#e0aaff'
        }}
      >
        LEADERBOARD
      </motion.h1>

      <motion.div 
        className="w-full max-w-md space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar relative z-10 px-2 mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {leaderboardData.map((entry, index) => (
          <motion.div 
            key={index} 
            className={`flex items-center justify-between p-4 rounded-lg ${entry.fid === currentUserFid ? 'bg-purple-900/50' : 'bg-black/70'}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.3 }}
            whileHover={{ 
              scale: 1.02, 
              boxShadow: '0 0 15px rgba(156, 39, 176, 0.5)', 
              backgroundColor: entry.fid === currentUserFid ? 'rgba(156, 39, 176, 0.6)' : 'rgba(0, 0, 0, 0.8)' 
            }}
            style={{
              border: `2px solid ${index < 3 ? '#FFD700' : '#9c27b0'}`,
              boxShadow: `0 0 10px ${index < 3 ? 'rgba(255, 215, 0, 0.3)' : 'rgba(156, 39, 176, 0.3)'}`,
            }}
          >
            <div className="flex items-center gap-4">
              <motion.span 
                className={`arcade-text text-2xl ${index < 3 ? 'text-yellow-400' : 'text-purple-400'}`}
                animate={index < 3 ? { scale: [1, 1.1, 1] } : {}}
                transition={index < 3 ? { duration: 1.5, repeat: Infinity, repeatDelay: 1 } : {}}
              >
                #{index + 1}
              </motion.span>
              
              {/* Profile Image */}
              <motion.div 
                className="relative w-8 h-8 rounded-full overflow-hidden border-2 flex-shrink-0"
                style={{ 
                  borderColor: index < 3 ? '#FFD700' : '#9c27b0',
                  boxShadow: `0 0 8px ${index < 3 ? 'rgba(255, 215, 0, 0.6)' : 'rgba(156, 39, 176, 0.6)'}` 
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index + 0.2 }}
              >
                {entry.profileImage ? (
                  <img 
                    src={entry.profileImage} 
                    alt={`${entry.username}'s profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to default image on error
                      (e.target as HTMLImageElement).src = 'https://i.imgur.com/HeIi0wU.png';
                    }}
                  />
                ) : (
                  // Default profile image
                  <div className="w-full h-full bg-purple-900 flex items-center justify-center text-xs text-white">
                    {entry.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </motion.div>
              
              <span className="arcade-text text-xl">{entry.username}</span>
            </div>
            <div className={`arcade-text text-xl ${index < 3 ? 'text-yellow-400' : 'text-purple-400'}`}>
              {entry.wins} wins
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex-grow"></div>
      <motion.div 
        className="flex flex-col items-center gap-3 w-[260px] relative z-10 mb-12"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <motion.button
          onClick={() => {
            const shareText = 'Play "Nuke" by @goldie and /thepod team 🃏';
            const shareUrl = 'nuke-podplay.vercel.app';
            sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`);
          }}
          className="arcade-button w-full text-xl py-3 rounded-md"
          whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(156, 39, 176, 0.6), inset 0 0 15px rgba(156, 39, 176, 0.4)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          style={{
            border: '2px solid #9c27b0',
            color: '#e0aaff',
            textShadow: '0 0 10px #9c27b0, 0 0 20px #9c27b0',
            boxShadow: '0 0 10px rgba(156, 39, 176, 0.4), inset 0 0 10px rgba(156, 39, 176, 0.3)'
          }}
        >
          SHARE GAME
        </motion.button>
        
        <motion.button
          onClick={onBack}
          className="arcade-button w-full text-xl py-3 rounded-md"
          whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255, 215, 0, 0.5), inset 0 0 15px rgba(255, 215, 0, 0.3)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          style={{
            border: '2px solid #ffd700',
            color: '#fff8e1',
            textShadow: '0 0 10px #ffd700, 0 0 20px #ffd700',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.3), inset 0 0 10px rgba(255, 215, 0, 0.2)'
          }}
        >
          BACK TO MENU
        </motion.button>
      </motion.div>

      {/* Decorative elements */}
      <motion.div 
        className="absolute top-20 left-4 text-4xl opacity-20 z-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        ♠
      </motion.div>
      <motion.div 
        className="absolute bottom-20 right-4 text-4xl opacity-20 z-0"
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        ♦
      </motion.div>
      <motion.div 
        className="absolute top-1/2 left-6 text-4xl opacity-20 z-0"
        animate={{ rotate: 180, scale: [1, 1.2, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        ♣
      </motion.div>
      <motion.div 
        className="absolute top-1/3 right-6 text-4xl opacity-20 z-0"
        animate={{ rotate: -180, scale: [1, 1.2, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        ♥
      </motion.div>
    </motion.div>
  );
}