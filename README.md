# 🏟️ StadiumIQ

**A GenAI smart-stadium concierge and operations assistant for the FIFA World Cup 2026.**

StadiumIQ helps fans, volunteers, and venue staff move through a World Cup
stadium with less friction. Fans get multilingual, accessibility-aware
navigation and answers from a verified venue knowledge base; operators get a
live crowd overview with prioritised, AI-narrated recommendations for
real-time decision support.

Built for **Challenge 4: Smart Stadiums & Tournament Operations**.

> Live demo: deploy in one command to Google Cloud Run (see Deployment).

---

## 1. Chosen vertical

From the challenge verticals, StadiumIQ focuses on three that reinforce each
other:

- **Navigation and accessibility** — step-free, context-aware wayfinding
  between any two zones (gates, concourses, seating, amenities, transport).
- **Multilingual assistance** — the concierge understands and replies in
  English, Spanish, and French, the three primary languages of the 2026 host
  nations (USA, Mexico, Canada).
- **Crowd management and operational intelligence** — a real-time congestion
  overview with prioritised recommendations for staff (for example, redirecting
  arriving fans from an overcrowded gate to a calmer one).

Two personas are served in one app: the **fan** (Concierge tab) and the
**operator / volunteer** (Operations tab).

## 2. Approach and logic

The core principle is **grounded generative AI**: the model never invents
facts. Every answer is built on a deterministic, auditable knowledge base and
routing engine, and Generative AI is layered on top only to phrase that verified
answer fluently in the fan's language.

Logical decision-making from user context:

- The concierge classifies each message into an **intent** (wayfinding,
  amenity, transport, schedule, accessibility, general).
- It uses the fan's **context** (language, current location, and whether they
  need step-free routes) to tailor the response. A wheelchair user asking for a
  route to the upper deck gets an elevator route, not stairs.
- Routing is a real **Dijkstra shortest-path** over the venue graph, with a
  filter that removes stair edges when step-free access is requested.
- Operations turns a congestion snapshot into ranked recommendations
  (actions before warnings before info), pairing each overcrowded gate with the
  calmest alternative.

Because the deterministic layer produces a correct answer on its own, the app
is **fully functional with no API key** (it uses the verified answer directly)
and **richer with a key** (Gemini rephrases it naturally). This also keeps it
testable and safe to evaluate offline.

## 3. How the solution works

```
Browser (React SPA)
   │  POST /api/assistant { message, context }
   ▼
Express server (Node)
   ├─ validate input (type, length, range)
   ├─ concierge: detect intent + build a grounded answer from the knowledge base
   │     └─ wayfinding: Dijkstra route (step-free aware)
   ├─ if GEMINI_API_KEY set → Gemini rephrases the grounded answer in-language
   │     else → return the verified deterministic answer
   └─ /api/ops → congestion snapshot + ranked recommendations
```

- **Frontend:** React + TypeScript (Vite). Two tabs: Fan Concierge (chat with
  language, location, and accessibility controls) and Operations (congestion
  meters + recommendations). Built to WCAG 2.1 AA.
- **Backend:** Express + TypeScript, run with `tsx`. Endpoints: `/api/assistant`,
  `/api/ops`, `/api/stadium`, `/api/health`. Helmet security headers,
  compression, rate limiting, and strict input validation.
- **Shared domain (`shared/`):** pure, framework-free, fully unit-tested logic
  for the knowledge base, wayfinding, congestion, i18n, and the concierge.
- **GenAI:** Google Gemini via `@google/generative-ai`. The key lives only on
  the server and is read from an environment variable, never shipped to the
  browser.

### API quick reference

| Method | Route            | Purpose                                       |
| ------ | ---------------- | --------------------------------------------- |
| POST   | `/api/assistant` | Ask the concierge (returns a grounded answer) |
| GET    | `/api/ops`       | Congestion snapshot + staff recommendations   |
| GET    | `/api/stadium`   | The venue knowledge base                      |
| GET    | `/api/health`    | Liveness + whether GenAI is configured        |

## 4. Getting started

```bash
# Node 20+ required
npm install

# copy env template (the app runs without a key too)
cp .env.example .env   # optionally add GEMINI_API_KEY

# run client (5173) + server (8080) together
npm run dev
```

Open http://localhost:5173. The client proxies `/api` to the server.

### Scripts

| Script                  | What it does                                 |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Run client and server together               |
| `npm run build`         | Type-check and build the client bundle       |
| `npm start`             | Run the production server (serves the build) |
| `npm test`              | Run the test suite                           |
| `npm run test:coverage` | Tests with a coverage report                 |
| `npm run lint`          | ESLint (zero warnings allowed)               |
| `npm run typecheck`     | TypeScript, no emit                          |
| `npm run format`        | Format with Prettier                         |

## 5. Deployment (Google Cloud Run, one command)

The app is a single container. With the gcloud CLI installed and authenticated:

```bash
# deploy with the offline fallback
./deploy.sh

# or deploy with the generative model enabled
GEMINI_API_KEY=your_key ./deploy.sh
```

`deploy.sh` enables the required APIs and runs `gcloud run deploy --source .`,
which builds the Dockerfile and returns a public HTTPS URL. See the script
header for prerequisites and overrides (`PROJECT_ID`, `REGION`, `SERVICE`).

## 6. Security

- The Gemini API key is server-side only, injected as an environment variable,
  and never committed or exposed to the browser.
- All API input is validated for type, length, and range before use.
- Helmet sets a strict Content-Security-Policy and related headers; the API is
  rate-limited; the JSON body size is capped.
- The container runs as a non-root user.

## 7. Accessibility

Targets WCAG 2.1 AA: semantic landmarks and one `h1`, labelled controls, a skip
link, visible focus styles, ARIA tabs, live regions for chat and
recommendations, congestion meters exposed as labelled images with text
equivalents, AA color contrast, and support for `prefers-color-scheme` and
`prefers-reduced-motion`. Accessibility is also a first-class product feature:
step-free routing.

## 8. Testing

Vitest + Testing Library + Supertest cover the wayfinding engine, congestion and
recommendations, the concierge and intents, i18n, request validation, the HTTP
API, and the React UI (including a full send-and-reply flow).

## 9. Assumptions

- The venue data (`shared/stadium.ts`) is a representative demo model of a World
  Cup 2026 host stadium, not surveyed measurements. It is isolated in one file
  so it can be replaced by a real venue feed.
- Congestion is simulated deterministically as a stand-in for a real sensor or
  turnstile feed, so the demo is reproducible and testable.
- Language coverage is English, Spanish, and French (the primary host-nation
  languages); more can be added in `shared/i18n.ts`.
- Without a `GEMINI_API_KEY`, responses come from the verified deterministic
  layer; a key adds fluent generative phrasing on top of the same facts.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the layered design.

## License

[MIT](LICENSE).
