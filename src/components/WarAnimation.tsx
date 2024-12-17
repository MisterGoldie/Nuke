interface WarAnimationProps {
  isVisible: boolean;
}

export default function WarAnimation({ isVisible }: WarAnimationProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      
      <div className="relative">
        <div 
          className="text-[125px] font-bold text-red-500" 
          style={{ 
            textShadow: 'none',
            WebkitTextStroke: 'none',
            filter: 'none'
          }}
        >
          WAR!
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-red-500 rounded-full animate-particle"
              style={{
                transform: `rotate(${i * 45}deg) translateY(-100px)`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 