import Image from 'next/image';

interface SoundToggleProps {
  isMuted: boolean;
  onToggle: () => void;
}

export default function SoundToggle({ isMuted, onToggle }: SoundToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="absolute z-50 flex h-8 w-8 items-center justify-center"
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom))",
        right: "max(1rem, env(safe-area-inset-right))",
      }}
      aria-label={isMuted ? "Unmute sound" : "Mute sound"}
    >
      <Image
        src={isMuted ? '/mute.svg' : '/sound.svg'}
        alt={isMuted ? "Unmuted" : "Muted"}
        width={24}
        height={24}
        className="transition-opacity duration-200 hover:opacity-80"
      />
    </button>
  );
} 