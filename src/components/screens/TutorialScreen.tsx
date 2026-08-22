"use client";

import { Button } from "~/components/ui/Button";

interface TutorialScreenProps {
  onStart: () => void;
}

export default function TutorialScreen({ onStart }: TutorialScreenProps) {
  return (
    <div className="arcade-container">
      <h1
        className="arcade-text title-glow mb-4 shrink-0 tracking-wide"
        style={{ fontSize: "clamp(1.75rem, 8vw, 3rem)" }}
      >
        HOW TO PLAY
      </h1>

      <div className="custom-scrollbar min-h-0 w-full max-w-md flex-1 space-y-6 overflow-y-auto">
        <section>
          <h2 className="arcade-text-green mb-2 text-xl tracking-wide sm:text-2xl">Basic Rules</h2>
          <p className="arcade-text-green text-sm leading-relaxed sm:text-base">
            Each player starts with 26 cards. Players draw cards simultaneously. Higher card takes both cards! Be aware of the 4 minute timer.
          </p>
        </section>

        <section>
          <h2 className="arcade-text-green mb-2 text-xl tracking-wide sm:text-2xl">WAR!</h2>
          <p className="arcade-text-green text-sm leading-relaxed sm:text-base">
            When cards match, it&apos;s WAR! Each player puts down 3 face-down cards and 1 face-up card. Winner takes all 8 cards!
          </p>
        </section>

        <section>
          <h2 className="arcade-text-orange mb-2 text-xl tracking-wide sm:text-2xl">NUKE Power!</h2>
          <p className="arcade-text-orange text-sm leading-relaxed sm:text-base">
            Each player has one NUKE. Use it to steal 10 cards from the opponent! Use wisely - you only get one.
          </p>
        </section>

        <section>
          <h2 className="arcade-text-green mb-2 text-xl tracking-wide sm:text-2xl">Winning</h2>
          <p className="arcade-text-green text-sm leading-relaxed sm:text-base">
            Collect all 52 cards to win! If a player doesn&apos;t have enough cards for WAR or NUKE, they automatically lose. When the timer runs out, the game simply ends without declaring a winner.
          </p>
        </section>
      </div>

      <div className="mt-4 flex w-full max-w-xs shrink-0 justify-center">
        <Button
          className="arcade-button glow-blue w-full py-3 text-lg sm:text-xl"
          onClick={onStart}
        >
          START PLAYING
        </Button>
      </div>
    </div>
  );
}
