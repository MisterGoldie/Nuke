// Asset and sound preloading
export const soundCache = new Map<string, HTMLAudioElement>();
const assetCache = new Map();

export const assetManifest = {
  images: [
    '/game-board.png',
    '/splash.png',
    '/icon.png',
    '/urlimage.png',
    '/bomb.svg'
  ],
  sounds: [
    '/sounds/click.mp3',
    '/sounds/win.mp3',
    '/sounds/lose.mp3',
    '/sounds/boomsback.mp3',
    '/sounds/war.mp3',
    '/sounds/gameplay.mp3',
    '/sounds/nuke.mp3'
  ]
};

export const preloadAssets = async () => {
  const imagePromises = assetManifest.images.map(src => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  });

  const audioPromises = assetManifest.sounds.map(src => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => {
        soundCache.set(src, audio);
        resolve(audio);
      };
      audio.onerror = reject;
      audio.src = src;
      audio.load();
    });
  });

  try {
    await Promise.all([...imagePromises, ...audioPromises]);
    console.log('All assets preloaded successfully');
  } catch (error) {
    console.error('Error preloading assets:', error);
  }
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

export const debounceAnimation = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}; 