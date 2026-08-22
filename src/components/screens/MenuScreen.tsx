"use client";

import sdk from "@farcaster/frame-sdk";
import { Button } from "~/components/ui/Button";
import ExplosionBackground from "../ExplosionBackground";
import SoundToggle from "../SoundToggle";

interface MenuScreenProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onStartGame: () => void;
  onLeaderboard: () => void;
}

export default function MenuScreen({
  isMuted,
  onToggleMute,
  onStartGame,
  onLeaderboard,
}: MenuScreenProps) {
  const share = () => {
    const shareText = 'Play "Nuke" by @goldie and /thepod team 🃏';
    const shareUrl = "nuke-podplay.vercel.app";
    sdk.actions.openUrl(
      `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`,
    );
  };

  return (
    <div className="arcade-container flex flex-col items-center overflow-hidden">
      <ExplosionBackground isActive={true} />
      <div className="h-full w-full flex flex-col items-center justify-between pt-10 pb-8">
        <div />

        <div className="flex flex-col items-center gap-10 mt-4">
          <div className="text-center mb-8 transform scale-110">
            <h1 className="arcade-text text-7xl mb-3 title-glow tracking-wider">NUKE</h1>
            <p className="arcade-text text-2xl tracking-wide">WAR STYLE CARD GAME</p>
          </div>

          <div className="flex flex-col items-center gap-4 w-[280px]">
            <Button
              data-action="start-game"
              className="arcade-button glow-blue text-2xl py-3 w-full transform hover:scale-105 transition-transform"
              onClick={onStartGame}
            >
              START GAME
            </Button>

            <Button
              data-action="leaderboard"
              className="arcade-button glow-yellow text-2xl py-3 w-full transform hover:scale-105 transition-transform"
              onClick={onLeaderboard}
            >
              LEADERBOARD
            </Button>
            <p className="arcade-text text-sm mt-3 text-center w-full">Powered by /thepod</p>
          </div>
        </div>

        <div />
      </div>

      <div
        className="absolute bottom-16 left-0 right-0 text-center arcade-text text-xs"
        style={{
          textShadow: "0 0 5px #00ff00, 0 0 10px #00ff00",
          opacity: 0.8,
        }}
      >
        version 1.3
      </div>

      <button
        className="absolute top-4 right-4 px-3 py-1 text-sm border border-purple-400 rounded-md text-purple-400 hover:bg-gray-800 transition-colors arcade-button glow-purple"
        style={{ zIndex: 50, backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={share}
      >
        Share Game
      </button>

      <SoundToggle isMuted={isMuted} onToggle={onToggleMute} />
    </div>
  );
}
