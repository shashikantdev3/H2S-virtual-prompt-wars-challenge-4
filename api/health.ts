import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getHealth } from '../server/controllers';

export default function handler(
  _req: VercelRequest,
  res: VercelResponse,
): void {
  res.status(200).json(getHealth());
}
