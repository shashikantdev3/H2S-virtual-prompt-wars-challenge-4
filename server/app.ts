import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { STADIUM } from '../shared/stadium';
import {
  generateRecommendations,
  peakLevel,
  simulateCongestion,
} from '../shared/congestion';
import { answerQuestion, isGenAiEnabled } from './genai';
import { validateAssistantRequest } from './validation';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(__dirname, '..', 'dist');

/**
 * Build the Express application. Kept as a factory (no side effects, no
 * listening) so tests can import and exercise the app directly.
 */
export function createApp(): Express {
  const app = express();

  // Security headers. The CSP allows the app's own assets only; the client
  // talks solely to same-origin /api endpoints.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '16kb' }));

  // Basic abuse protection on the API surface.
  const apiLimiter = rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', genai: isGenAiEnabled() });
  });

  app.get('/api/stadium', (_req: Request, res: Response) => {
    res.json(STADIUM);
  });

  app.get('/api/ops', (_req: Request, res: Response) => {
    const congestion = simulateCongestion(STADIUM, Date.now());
    res.json({
      peak: peakLevel(congestion),
      congestion,
      recommendations: generateRecommendations(STADIUM, congestion),
    });
  });

  app.post('/api/assistant', async (req: Request, res: Response) => {
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
      res.json({ answer, genaiEnabled: isGenAiEnabled() });
    } catch {
      res
        .status(500)
        .json({ error: 'The assistant is temporarily unavailable.' });
    }
  });

  // Serve the built client in production, with SPA fallback for client routes.
  app.use(express.static(CLIENT_DIST, { maxAge: '1h', index: false }));
  app.get(/^(?!\/api).*/, (_req: Request, res: Response) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'), (err) => {
      if (err) res.status(200).send('StadiumIQ API is running.');
    });
  });

  return app;
}
