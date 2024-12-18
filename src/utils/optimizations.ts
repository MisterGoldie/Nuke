// Asset and sound preloading
export const soundCache = new Map<string, HTMLAudioElement>();
const assetCache = new Map();

export const preloadAssets = () => {
  console.log('Preloading assets...'); // Debug log
  
  const assets = [
    '/game-board.png',
    '/splash.png',
    '/sounds/click.mp3',
    '/sounds/win.mp3',
    '/sounds/lose.mp3',
    '/sounds/theme.mp3',
    '/sounds/war.mp3',
    '/sounds/gameplay.mp3'
  ];
  
  assets.forEach(asset => {
    if (asset.endsWith('.mp3')) {
      if (!soundCache.has(asset)) {
        console.log('Loading audio:', asset); // Debug log
        const audio = new Audio(asset);
        if (asset.includes('gameplay')) {
          audio.loop = true;
          audio.volume = 0.4;
          console.log('Configured gameplay music:', audio); // Debug log
        }
        soundCache.set(asset, audio);
      }
    } else {
      if (!assetCache.has(asset)) {
        const img = new Image();
        img.src = asset;
        assetCache.set(asset, img);
      }
    }
  });
  
  console.log('Assets preloaded, soundCache:', soundCache); // Debug log
};

export const playSound = (soundUrl: string) => {
  if (soundCache.has(soundUrl)) {
    const audio = soundCache.get(soundUrl);
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  }
}; 