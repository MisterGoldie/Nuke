"use client";

import { Button } from "~/components/ui/Button";

interface TutorialScreenProps {
  onStart: () => void;
}

export default function TutorialScreen({ onStart }: TutorialScreenProps) {
  return (
    <div className="arcade-container flex flex-col items-center overflow-hidden p-6">
      <h1 className="arcade-text text-5xl mb-8 title-glow tracking-wide">HOW TO PLAY</h1>

      <div className="space-y-8 max-w-[350px] flex-1 overflow-y-auto custom-scrollbar">
        <section>
          <h2 className="arcade-text-green text-2xl mb-3 tracking-wide">Basic Rules</h2>
          <p className="arcade-text-green text-sm leading-relaxed">
            Each player starts with 26 cards. Players draw cards simultaneously. Higher card takes both cards! Be aware of the 4 minute timer.
          </p>
        </section>

        <section>
          <h2 className="arcade-text-green text-2xl mb-3 tracking-wide">WAR!</h2>
          <p className="arcade-text-green text-sm leading-relaxed">
            When cards match, it&apos;s WAR! Each player puts down 3 face-down cards and 1 face-up card. Winner takes all 8 cards!
          </p>
        </section>

        <section>
          <h2 className="arcade-text-orange text-2xl mb-3 tracking-wide">NUKE Power!</h2>
          <p className="arcade-text-orange text-sm leading-relaxed">
            Each player has one NUKE. Use it to steal 10 cards from the opponent! Use wisely - you only get one.
          </p>
        </section>

        <section>
          <h2 className="arcade-text-green text-2xl mb-3 tracking-wide">Winning</h2>
          <p className="arcade-text-green text-sm leading-relaxed">
            Collect all 52 cards to win! If a player doesn&apos;t have enough cards for WAR or NUKE, they automatically lose. When the timer runs out, the game simply ends without declaring a winner.
          </p>
        </section>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <Button
          className="arcade-button glow-blue text-xl py-3 px-6 w-[280px] transform hover:scale-105 transition-transform"
          onClick={onStart}
        >
          START PLAYING
        </Button>
      </div>
    </div>
  );
}
