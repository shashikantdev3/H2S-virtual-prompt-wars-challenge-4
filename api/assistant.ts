import type { VercelRequest, VercelResponse } from '@vercel/node';
import { STADIUM } from '../shared/stadium';
import { answerQuestion, isGenAiEnabled } from '../server/genai';
import { validateAssistantRequest } from '../server/validation';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }
  const parsed = validateAssistantRequest(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  try {
    const answer = await answerQuestion(
      STADIUM,
      parsed.value.message,
      parsed.value.context,
    );
    res.status(200).json({ answer, genaiEnabled: isGenAiEnabled() });
  } catch {
    res
      .status(500)
      .json({ error: 'The assistant is temporarily unavailable.' });
  }
}
