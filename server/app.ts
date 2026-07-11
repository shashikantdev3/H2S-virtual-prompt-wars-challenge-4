import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { getHealth, getOps, getStadium, postAssistant } from './controllers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(__dirname, '..', 'dist');

/**
 * Build the Express application used for local development and integration
 * tests. It is a thin transport over the shared controllers in
 * `controllers.ts`; production on Vercel uses the functions in `api/` which
 * call the same controllers. Kept as a side-effect-free factory so tests can
 * import and exercise the app directly.
 */
export function createApp(): Express {
  const app = express();

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

  const apiLimiter = rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json(getHealth());
  });

  app.get('/api/stadium', (_req: Request, res: Response) => {
    res.json(getStadium());
  });

  app.get('/api/ops', (_req: Request, res: Response) => {
    res.json(getOps());
  });

  app.post('/api/assistant', async (req: Request, res: Response) => {
    const result = await postAssistant(req.body);
    res.status(result.status).json(result.body);
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
