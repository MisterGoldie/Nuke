interface NukeAnimationProps {
  isVisible: boolean;
  initiator: 'player' | 'cpu';
}

export default function NukeAnimation({ isVisible, initiator }: NukeAnimationProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div className="relative">
        <div className="text-[125px] font-bold text-red-500 nuke-text animate-nuke-pulse">
          NUKE!
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="nuke-explosion"></div>
        </div>
        <div className="text-2xl text-red-400 text-center mt-4">
          {initiator === 'player' ? 'Stealing 10 cards!' : 'Lost 10 cards!'}
        </div>
      </div>
    </div>
  );
} 