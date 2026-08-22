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

export const preloadAssets = (isMuted = false) => {
  assetManifest.images.forEach((src) => {
    if (assetCache.has(src)) return;
    const img = new Image();
    img.src = src;
    assetCache.set(src, img);
  });

  assetManifest.sounds.forEach((src) => {
    const cached = soundCache.get(src);
    if (cached) {
      cached.muted = isMuted;
      return;
    }

    const audio = new Audio();
    audio.preload = "auto";
    audio.muted = isMuted;
    audio.volume = src.includes("gameplay.mp3") ? 0.2 : 0.75;
    audio.src = src;
    soundCache.set(src, audio);
    audio.load();
  });
};

export const playSound = (soundUrl: string, isMuted: boolean) => {
  if (soundCache.has(soundUrl)) {
    const audio = soundCache.get(soundUrl);
    if (audio) {
      audio.muted = isMuted;
      audio.currentTime = 0;
      if (!isMuted) {
        audio.play();
      }
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