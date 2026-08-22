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
    <div className="arcade-container">
      <ExplosionBackground isActive={true} />
      <div className="relative z-10 flex h-full w-full flex-col items-center">
        <div className="flex w-full justify-end">
          <button
            className="arcade-button glow-purple rounded-md border px-3 py-1 text-xs sm:text-sm"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            onClick={share}
          >
            Share Game
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="text-center">
            <h1
              className="arcade-text title-glow mb-3 tracking-wider"
              style={{ fontSize: "var(--title-size)" }}
            >
              NUKE
            </h1>
            <p className="arcade-text text-[clamp(0.95rem,4vw,1.5rem)] tracking-wide">
              WAR STYLE CARD GAME
            </p>
          </div>

          <div className="flex w-full max-w-xs flex-col items-center gap-4">
            <Button
              data-action="start-game"
              className="arcade-button glow-blue w-full py-3 text-xl sm:text-2xl"
              onClick={onStartGame}
            >
              START GAME
            </Button>
            <Button
              data-action="leaderboard"
              className="arcade-button glow-yellow w-full py-3 text-xl sm:text-2xl"
              onClick={onLeaderboard}
            >
              LEADERBOARD
            </Button>
            <p className="arcade-text mt-1 text-center text-xs sm:text-sm">Powered by /thepod</p>
          </div>
        </div>

        <p
          className="arcade-text pb-8 text-center text-xs"
          style={{ textShadow: "0 0 5px #00ff00", opacity: 0.8 }}
        >
          version 1.3
        </p>
      </div>
      <SoundToggle isMuted={isMuted} onToggle={onToggleMute} />
    </div>
  );
}
