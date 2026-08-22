import snapshot from '~/lib/crudeboysSnapshot.json';
import { CARD_RANKS, CARD_SUITS, type CardSuitKey } from '~/lib/cardImage';

export const CRUDEBOYS_COLLECTION = 'crudeboys';
export const DOGGY_API = 'https://api.doggy.market';
export const DOGGY_CDN = 'https://cdn.doggy.market/content';

const PAGE_SIZE = 100;
const COLLECTION_SUPPLY = 522;
const DECK_SIZE = CARD_SUITS.length * CARD_RANKS.length;
const CACHE_MS = 24 * 60 * 60 * 1000;

export type CrudeboysCardArt = {
  inscriptionId: string;
  itemId?: string;
  imageUrl: string;
};

export type CrudeboysDeck = Record<string, CrudeboysCardArt>;

export type CrudeboysDeckResponse = {
  collection: typeof CRUDEBOYS_COLLECTION;
  source: 'live' | 'snapshot';
  images: Record<string, string>;
};

type ListingItem = {
  inscriptionId?: string;
  itemId?: string | number;
  attributes?: Record<string, string>;
};

type ListingsPage = {
  total?: number;
  data?: ListingItem[];
};

let memoryCache: { expires: number; payload: CrudeboysDeckResponse } | null = null;

function contentUrl(inscriptionId: string): string {
  return `${DOGGY_CDN}/${inscriptionId}`;
}

function snapshotDeck(): CrudeboysDeck {
  const images = snapshot.images as Record<string, CrudeboysCardArt>;
  const deck: CrudeboysDeck = {};
  for (const [key, art] of Object.entries(images)) {
    deck[key] = {
      inscriptionId: art.inscriptionId,
      itemId: art.itemId,
      imageUrl: art.imageUrl || contentUrl(art.inscriptionId),
    };
  }
  return deck;
}

function parseSuit(cardType: string | undefined): CardSuitKey | null {
  const value = (cardType ?? '').trim().toLowerCase();
  if (value.startsWith('club')) return 'clubs';
  if (value.startsWith('diamond')) return 'diamonds';
  if (value.startsWith('heart')) return 'hearts';
  if (value.startsWith('spade')) return 'spades';
  return null;
}

function parseRank(attributes: Record<string, string> | undefined): string | null {
  if (!attributes) return null;
  const blob = [
    attributes['Red numbered cards'],
    attributes['Black numbered cards'],
    attributes['Red Face cards'],
    attributes['Black face cards'],
    attributes['Joker cards'],
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!blob || blob.includes('joker')) return null;
  if (blob.includes('ace')) return 'a';
  if (blob.includes('king')) return 'k';
  if (blob.includes('queen')) return 'q';
  if (blob.includes('jack')) return 'j';
  const numbered = blob.match(/\b(10|[2-9])\b/);
  return numbered?.[1] ?? null;
}

export function listingToCardKey(item: ListingItem): string | null {
  const suit = parseSuit(item.attributes?.['Card type']);
  const rank = parseRank(item.attributes);
  if (!suit || !rank) return null;
  return `${rank}-${suit}`;
}

function mergeDecks(primary: CrudeboysDeck, fallback: CrudeboysDeck): CrudeboysDeck {
  return { ...fallback, ...primary };
}

function toImageMap(deck: CrudeboysDeck): Record<string, string> {
  return Object.fromEntries(
    Object.entries(deck).map(([key, art]) => [key, art.imageUrl]),
  );
}

async function fetchListingsPage(offset: number): Promise<ListingItem[]> {
  const url = `${DOGGY_API}/listings/nfts/${CRUDEBOYS_COLLECTION}?sortBy=inscriptionNumber&sortOrder=asc&offset=${offset}&limit=${PAGE_SIZE}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'NukeGame/1.0 (Crudeboys card art)',
    },
    next: { revalidate: 86400 },
  });
  if (!response.ok) {
    throw new Error(`Doggy.market listings failed (${response.status})`);
  }
  const page = (await response.json()) as ListingsPage;
  return page.data ?? [];
}

async function fetchLiveDeck(): Promise<CrudeboysDeck> {
  const offsets = Array.from(
    { length: Math.ceil(COLLECTION_SUPPLY / PAGE_SIZE) },
    (_, index) => index * PAGE_SIZE,
  );
  const pages = await Promise.all(offsets.map((offset) => fetchListingsPage(offset)));
  const deck: CrudeboysDeck = {};

  for (const item of pages.flat()) {
    if (!item.inscriptionId) continue;
    const key = listingToCardKey(item);
    if (!key || deck[key]) continue;
    deck[key] = {
      inscriptionId: item.inscriptionId,
      itemId: item.itemId !== undefined ? String(item.itemId) : undefined,
      imageUrl: contentUrl(item.inscriptionId),
    };
    if (Object.keys(deck).length === DECK_SIZE) break;
  }

  return deck;
}

async function refreshLiveDeck(): Promise<void> {
  try {
    const live = await fetchLiveDeck();
    const merged = mergeDecks(live, snapshotDeck());
    memoryCache = {
      expires: Date.now() + CACHE_MS,
      payload: {
        collection: CRUDEBOYS_COLLECTION,
        source: Object.keys(live).length >= DECK_SIZE ? 'live' : 'snapshot',
        images: toImageMap(merged),
      },
    };
  } catch (error) {
    console.error('Failed to load Crudeboys from doggy.market, using snapshot', error);
  }
}

export async function getCrudeboysDeck(): Promise<CrudeboysDeckResponse> {
  if (memoryCache && memoryCache.expires > Date.now()) {
    return memoryCache.payload;
  }

  const snapshotPayload: CrudeboysDeckResponse = {
    collection: CRUDEBOYS_COLLECTION,
    source: 'snapshot',
    images: toImageMap(snapshotDeck()),
  };
  memoryCache = { expires: Date.now() + CACHE_MS, payload: snapshotPayload };
  void refreshLiveDeck();
  return snapshotPayload;
}
