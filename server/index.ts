import { createApp } from './app';
import { isGenAiEnabled } from './genai';

const PORT = Number(process.env.PORT) || 8080;

const app = createApp();

app.listen(PORT, () => {
  const mode = isGenAiEnabled()
    ? 'generative (Gemini)'
    : 'deterministic fallback (no GEMINI_API_KEY set)';
  // eslint-disable-next-line no-console
  console.info(`StadiumIQ listening on port ${PORT} — assistant mode: ${mode}`);
});
