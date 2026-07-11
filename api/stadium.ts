import type { VercelRequest, VercelResponse } from '@vercel/node';
import { STADIUM } from '../shared/stadium';

export default function handler(
  _req: VercelRequest,
  res: VercelResponse,
): void {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).json(STADIUM);
}
