import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Concierge } from './components/Concierge';
import { OpsDashboard } from './components/OpsDashboard';
import { fetchStadium } from './api';
import type { Stadium } from '../shared/types';

type TabId = 'concierge' | 'ops';

/**
 * Root application. Owns the top-level tab state, loads the venue knowledge
 * base once, and tracks whether the server is answering via Gemini or the
 * deterministic fallback.
 */
export default function App() {
  const [tab, setTab] = useState<TabId>('concierge');
  const [stadium, setStadium] = useState<Stadium | null>(null);
  const [genaiEnabled, setGenaiEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetchStadium()
      .then(setStadium)
      .catch(() => setStadium(null));
  }, []);

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header genaiEnabled={genaiEnabled} />

      <main id="main-content" tabIndex={-1}>
        <div className="container">
          <div className="tabs" role="tablist" aria-label="Sections">
            <button
              type="button"
              role="tab"
              id="tab-concierge"
              aria-selected={tab === 'concierge'}
              aria-controls="panel-concierge"
              className="tab"
              onClick={() => setTab('concierge')}
            >
              Fan Concierge
            </button>
            <button
              type="button"
              role="tab"
              id="tab-ops"
              aria-selected={tab === 'ops'}
              aria-controls="panel-ops"
              className="tab"
              onClick={() => setTab('ops')}
            >
              Operations
            </button>
          </div>

          {tab === 'concierge' ? (
            <div
              id="panel-concierge"
              role="tabpanel"
              aria-labelledby="tab-concierge"
            >
              <Concierge stadium={stadium} onGenaiStatus={setGenaiEnabled} />
            </div>
          ) : (
            <div id="panel-ops" role="tabpanel" aria-labelledby="tab-ops">
              <OpsDashboard />
            </div>
          )}
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>
            StadiumIQ answers from a verified venue knowledge base. With a
            Gemini key it adds fluent multilingual phrasing; without one it runs
            a fully offline deterministic fallback. Demo data models a World Cup
            2026 host venue.
          </p>
        </div>
      </footer>
    </div>
  );
}
