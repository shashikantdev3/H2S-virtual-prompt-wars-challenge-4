import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOps } from '../server/controllers';

export default function handler(
  _req: VercelRequest,
  res: VercelResponse,
): void {
  res.status(200).json(getOps());
}
