import catalog from '~/lib/crudeboysCatalog.json';
import { getCardArtKey } from '~/lib/cardImage';

type Catalog = {
  pools: Record<string, string[]>;
  jokers: string[];
};

const pools = (catalog as Catalog).pools;

export function getCrudeboysSrc(artId?: string | null): string | null {
  if (!artId) return null;
  return `/crudeboys/${artId}.webp`;
}

export function pickArtId(display: string, suit: string): string | undefined {
  const key = getCardArtKey(display, suit);
  if (!key) return undefined;
  const pool = pools[key];
  if (!pool?.length) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function preloadArtIds(artIds: Array<string | undefined | null>): void {
  const unique = [...new Set(artIds.filter((id): id is string => Boolean(id)))];
  unique.forEach((id) => {
    const src = getCrudeboysSrc(id);
    if (!src) return;
    const img = new Image();
    img.src = src;
  });
}
