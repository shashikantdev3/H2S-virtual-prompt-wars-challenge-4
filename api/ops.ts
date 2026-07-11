import type { VercelRequest, VercelResponse } from '@vercel/node';
import { STADIUM } from '../shared/stadium';
import {
  generateRecommendations,
  peakLevel,
  simulateCongestion,
} from '../shared/congestion';

export default function handler(
  _req: VercelRequest,
  res: VercelResponse,
): void {
  const congestion = simulateCongestion(STADIUM, Date.now());
  res.status(200).json({
    peak: peakLevel(congestion),
    congestion,
    recommendations: generateRecommendations(STADIUM, congestion),
  });
}
