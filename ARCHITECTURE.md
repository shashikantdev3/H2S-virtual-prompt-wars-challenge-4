# Architecture

StadiumIQ is a full-stack TypeScript app with a strict separation between
**pure domain logic**, a **thin server**, and a **presentation layer**. The
same domain code runs on both the server and (where useful) the client, so
there is a single source of truth for the venue model and routing.

## Layers

```
┌──────────────────────────────────────────────────────────────┐
│ Client (src/) — React + Vite + TypeScript                     │
│   Concierge tab (chat + context) · Operations tab (crowd)     │
│   Talks only to same-origin /api. WCAG 2.1 AA.                │
├──────────────────────────────────────────────────────────────┤
│ Server (server/) — Express + TypeScript (run via tsx)         │
│   app.ts     : routes, helmet, rate limit, static hosting     │
│   validation : untrusted input checks                         │
│   genai.ts   : Gemini wrapper with graceful fallback          │
├──────────────────────────────────────────────────────────────┤
│ Shared domain (shared/) — pure, framework-free, tested        │
│   stadium.ts    : venue knowledge base                        │
│   wayfinding.ts : Dijkstra routing (step-free aware)          │
│   congestion.ts : deterministic sim + recommendation engine   │
│   concierge.ts  : intent detection + grounded/fallback answers│
│   i18n.ts       : en/es/fr strings + language detection       │
│   types.ts      : shared domain types                         │
└──────────────────────────────────────────────────────────────┘
```

## Key decisions

- **Grounded GenAI.** The deterministic concierge always produces a correct
  answer from the knowledge base. Gemini only rephrases that verified answer in
  the fan's language, which controls hallucination and keeps facts accurate.
- **Works with or without a key.** `genai.ts` returns the deterministic answer
  when `GEMINI_API_KEY` is absent or a model call fails. This makes the app
  resilient, offline-testable, and safe to evaluate.
- **Context-driven logic.** Intent + fan context (language, location, access
  needs) determine the response. Step-free requests filter stair edges out of
  the routing graph.
- **Single source of truth (data).** `shared/` is imported by both server and
  client, so the venue model and routing never drift between layers.
- **Single source of truth (endpoints).** All endpoint logic lives in
  `server/controllers.ts`. The Vercel functions (`api/*.ts`, production) and the
  Express server (`server/app.ts`, dev/tests) are thin transports that call the
  same controllers, so the two deployment targets can never diverge.
- **Security by construction.** Server-only API key, validated input, Helmet
  CSP, rate limiting, capped body size, non-root container.
- **Testability.** The domain is pure and deterministic (congestion is seeded),
  giving high-confidence unit tests; Supertest exercises the real HTTP surface.

## Request lifecycle (`POST /api/assistant`)

1. `validation.ts` checks the body (message length, language enum, booleans).
2. `concierge.answerFallback` classifies intent and builds a grounded answer
   (running Dijkstra for wayfinding intents).
3. If a Gemini key is set, `genai.answerQuestion` sends the grounding plus a
   strict system prompt to the model and returns its phrasing; otherwise the
   deterministic answer is returned as-is.
4. The client renders the reply in an ARIA live region.

## Testing strategy

- **Domain:** exhaustive unit tests for routing, congestion, recommendations,
  concierge intents, and i18n.
- **Server:** validation unit tests plus Supertest integration tests against the
  Express app.
- **Client:** Testing Library tests including a full send-and-reply flow and the
  operations dashboard load.
