import { getCrudeboysDeck } from '~/lib/crudeboys';

export const revalidate = 86400;

export async function GET() {
  const deck = await getCrudeboysDeck();
  return Response.json(deck, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}
