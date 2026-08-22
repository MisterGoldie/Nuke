import snapshot from '~/lib/crudeboysSnapshot.json';
import { getCardArtKey } from '~/lib/cardImage';

type SnapshotArt = { inscriptionId: string; imageUrl: string; itemId?: string };

let deckImages: Record<string, string> = Object.fromEntries(
  Object.entries(snapshot.images as Record<string, SnapshotArt>).map(([key, art]) => [
    key,
    art.imageUrl,
  ]),
);
let refreshing: Promise<Record<string, string>> | null = null;

export function getCachedCrudeboysImage(display: string, suit: string): string | null {
  const key = getCardArtKey(display, suit);
  if (!key) return null;
  return deckImages[key] ?? null;
}

async function refreshFromApi(): Promise<Record<string, string>> {
  const response = await fetch('/api/crudeboys');
  if (!response.ok) {
    throw new Error(`Crudeboys deck failed (${response.status})`);
  }
  const payload = (await response.json()) as { images?: Record<string, string> };
  if (payload.images && Object.keys(payload.images).length > 0) {
    deckImages = payload.images;
  }
  return deckImages;
}

export function loadCrudeboysDeck(): Promise<Record<string, string>> {
  if (!refreshing) {
    refreshing = refreshFromApi().catch((error) => {
      refreshing = null;
      console.error('Failed to refresh Crudeboys from doggy.market', error);
      return deckImages;
    });
  }
  return Promise.resolve(deckImages);
}

export function preloadCrudeboysDeck(): Promise<Record<string, string>> {
  return loadCrudeboysDeck().then((images) => {
    Object.values(images).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    return images;
  });
}
