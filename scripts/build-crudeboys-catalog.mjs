import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.doggy.market/listings/nfts/crudeboys?sortBy=inscriptionNumber&sortOrder=asc';
const PAGE_SIZE = 100;
const SUPPLY = 522;

function parseSuit(cardType) {
  const value = String(cardType ?? '').trim().toLowerCase();
  if (value.startsWith('club')) return 'clubs';
  if (value.startsWith('diamond')) return 'diamonds';
  if (value.startsWith('heart')) return 'hearts';
  if (value.startsWith('spade')) return 'spades';
  if (value.startsWith('joker')) return 'joker';
  return null;
}

function parseRank(attributes) {
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

  if (!blob) return null;
  if (blob.includes('joker')) return 'joker';
  if (blob.includes('ace')) return 'a';
  if (blob.includes('king')) return 'k';
  if (blob.includes('queen')) return 'q';
  if (blob.includes('jack')) return 'j';
  const numbered = blob.match(/\b(10|[2-9])\b/);
  return numbered?.[1] ?? null;
}

async function fetchPage(offset) {
  const url = `${API}&offset=${offset}&limit=${PAGE_SIZE}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'NukeGame/1.0 (Crudeboys catalog)',
    },
  });
  if (!res.ok) throw new Error(`listings ${res.status} at offset ${offset}`);
  const json = await res.json();
  return json.data ?? [];
}

const offsets = Array.from({ length: Math.ceil(SUPPLY / PAGE_SIZE) }, (_, i) => i * PAGE_SIZE);
const pages = await Promise.all(offsets.map(fetchPage));
const items = pages.flat();

const pools = {};
const jokers = [];
const unmapped = [];

for (const item of items) {
  const itemId = item.itemId !== undefined ? String(item.itemId) : null;
  if (!itemId) continue;
  const suit = parseSuit(item.attributes?.['Card type']);
  const rank = parseRank(item.attributes);
  if (suit === 'joker' || rank === 'joker') {
    jokers.push(itemId);
    continue;
  }
  if (!suit || !rank) {
    unmapped.push(itemId);
    continue;
  }
  const key = `${rank}-${suit}`;
  if (!pools[key]) pools[key] = [];
  pools[key].push(itemId);
}

for (const key of Object.keys(pools)) {
  pools[key].sort((a, b) => Number(a) - Number(b));
}

const catalog = {
  collection: 'crudeboys',
  totalListed: items.length,
  pools,
  jokers: jokers.sort((a, b) => Number(a) - Number(b)),
};

const outPath = path.join(ROOT, 'src/lib/crudeboysCatalog.json');
fs.writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`);

const poolKeys = Object.keys(pools).sort();
const poolSizes = poolKeys.map((key) => `${key}:${pools[key].length}`);
console.log('listed', items.length);
console.log('pools', poolKeys.length, poolSizes.join(' '));
console.log('jokers', jokers.length, jokers.join(','));
console.log('unmapped', unmapped.length, unmapped.slice(0, 10).join(','));
console.log('wrote', outPath);
