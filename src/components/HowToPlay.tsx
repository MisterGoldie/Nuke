import { Button } from "./ui/Button";

interface HowToPlayProps {
  onBack: () => void;
}

export default function HowToPlay({ onBack }: HowToPlayProps) {
  return (
    <div className="arcade-container flex flex-col items-center p-8">
      <h1 className="arcade-text text-4xl mb-6 title-glow">HOW TO PLAY</h1>
      
      <div className="space-y-6 max-w-[350px]">
        <section>
          <h2 className="text-2xl mb-2">Basic Rules</h2>
          <p className="text-sm leading-relaxed">
            Each player starts with 26 cards. Players draw cards simultaneously. Higher card wins both cards!
          </p>
        </section>

        <section>
          <h2 className="text-2xl mb-2">WAR!</h2>
          <p className="text-sm leading-relaxed">
            When cards match, it's WAR! Each player puts down 3 face-down cards and 1 face-up card. Winner takes all 8 cards!
          </p>
        </section>

        <section>
          <h2 className="nuke-text-orange text-2xl mb-2">NUKE Power!</h2>
          <p className="nuke-text-orange text-sm leading-relaxed">
            Each player has one NUKE. Use it anytime to steal 10 cards! If opponent has less than 10 cards, they automatically lose!
          </p>
        </section>

        <section>
          <h2 className="text-2xl mb-2">Winning</h2>
          <p className="text-sm leading-relaxed">
            Collect all cards to win! If a player doesn't have enough cards for WAR, they lose.
          </p>
        </section>
      </div>

      <Button 
        className="arcade-button glow-blue text-xl py-2 mt-8"
        onClick={onBack}
      >
        BACK TO MENU
      </Button>
    </div>
  );
} 