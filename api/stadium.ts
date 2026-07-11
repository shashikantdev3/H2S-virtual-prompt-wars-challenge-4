import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStadium } from '../server/controllers';

export default function handler(
  _req: VercelRequest,
  res: VercelResponse,
): void {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).json(getStadium());
}
