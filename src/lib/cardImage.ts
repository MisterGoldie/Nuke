import type { Card } from '~/components/gameLogic';

/** Shown when a specific card PNG is missing */
export const CARD_IMAGE_FALLBACK = '/card-front.png';

export const CARD_SUITS = ['spades', 'clubs', 'hearts', 'diamonds'] as const;
export type CardSuitKey = (typeof CARD_SUITS)[number];

export const CARD_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'] as const;

/**
 * PNG naming in public/cards/:
 *   {rank}-{suit}.png
 * Examples:
 *   k-hearts.png   = King of Hearts
 *   10-spades.png  = Ten of Spades
 *   a-diamonds.png = Ace of Diamonds
 */
export function normalizeSuitKey(suit: string): CardSuitKey | null {
  const s = suit.toLowerCase().trim();
  if (s === 'spades' || s.includes('♠')) return 'spades';
  if (s === 'clubs' || s.includes('♣')) return 'clubs';
  if (s === 'hearts' || s.includes('♥')) return 'hearts';
  if (s === 'diamonds' || s.includes('♦')) return 'diamonds';
  return null;
}

export function normalizeRankKey(display: string): string | null {
  const r = display.trim().toLowerCase();
  if ((CARD_RANKS as readonly string[]).includes(r)) return r;
  if (r === 'jack') return 'j';
  if (r === 'queen') return 'q';
  if (r === 'king') return 'k';
  if (r === 'ace') return 'a';
  return null;
}

export function getCardImagePath(display: string, suit: string): string {
  const suitKey = normalizeSuitKey(suit);
  const rankKey = normalizeRankKey(display);
  if (!suitKey || !rankKey) return CARD_IMAGE_FALLBACK;
  return `/cards/${rankKey}-${suitKey}.png`;
}

export function getCardImagePathFromCard(card: Pick<Card, 'display' | 'suit'>): string {
  return getCardImagePath(card.display, card.suit);
}

/** All 52 face image paths (for preloading). */
export function getAllCardImagePaths(): string[] {
  return CARD_SUITS.flatMap((suit) =>
    CARD_RANKS.map((rank) => `/cards/${rank}-${suit}.png`),
  );
}
