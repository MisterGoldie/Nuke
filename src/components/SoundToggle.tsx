import Image from 'next/image';

interface SoundToggleProps {
  isMuted: boolean;
  onToggle: () => void;
}

export default function SoundToggle({ isMuted, onToggle }: SoundToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="absolute bottom-4 right-4 z-50 w-8 h-8 flex items-center justify-center"
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