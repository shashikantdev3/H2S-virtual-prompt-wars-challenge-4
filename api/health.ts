import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isGenAiEnabled } from '../server/genai';

export default function handler(
  _req: VercelRequest,
  res: VercelResponse,
): void {
  res.status(200).json({ status: 'ok', genai: isGenAiEnabled() });
}
