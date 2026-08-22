import type { Card } from '~/components/gameLogic';

export const CARD_SUITS = ['spades', 'clubs', 'hearts', 'diamonds'] as const;
export type CardSuitKey = (typeof CARD_SUITS)[number];

export const CARD_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k', 'a'] as const;

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

export function getCardArtKey(display: string, suit: string): string | null {
  const suitKey = normalizeSuitKey(suit);
  const rankKey = normalizeRankKey(display);
  if (!suitKey || !rankKey) return null;
  return `${rankKey}-${suitKey}`;
}

export function getCardImagePathFromCard(card: Pick<Card, 'display' | 'suit'>): string | null {
  return getCardArtKey(card.display, card.suit);
}
