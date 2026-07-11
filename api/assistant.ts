import type { VercelRequest, VercelResponse } from '@vercel/node';
import { postAssistant } from '../server/controllers';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }
  const result = await postAssistant(req.body);
  res.status(result.status).json(result.body);
}
