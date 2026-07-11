import { useCallback, useEffect, useState } from 'react';
import { fetchOps, type OpsSnapshot } from '../api';
import type { CongestionLevel } from '../../shared/types';

const LEVEL_COLOR: Record<CongestionLevel, string> = {
  low: 'var(--low)',
  moderate: 'var(--moderate)',
  high: 'var(--high)',
  critical: 'var(--critical)',
};

/** Operations view: live-ish congestion plus AI-generated staff guidance. */
export function OpsDashboard() {
  const [snapshot, setSnapshot] = useState<OpsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await fetchOps());
    } catch {
      setError('Could not load operations data. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="grid grid--sidebar">
      <section className="card" aria-labelledby="ops-heading">
        <h2 id="ops-heading">Crowd overview</h2>
        {snapshot ? (
          <>
            <div className="ops-peak">
              <span>Peak level:</span>
              <span className={`pill pill--${snapshot.peak}`}>
                {snapshot.peak}
              </span>
            </div>
            <ul className="zone-list">
              {snapshot.congestion.map((z) => (
                <li className="zone-row" key={z.zoneId}>
                  <span>{z.zoneName}</span>
                  <span aria-hidden="true">
                    {Math.round(z.occupancy * 100)}%
                  </span>
                  <span className="visually-hidden">
                    {z.zoneName} is {z.level} at {Math.round(z.occupancy * 100)}
                    percent capacity
                  </span>
                  <div
                    className="meter"
                    role="img"
                    aria-label={`${Math.round(z.occupancy * 100)}% capacity, ${z.level}`}
                  >
                    <div
                      className="meter__fill"
                      style={{
                        width: `${Math.round(z.occupancy * 100)}%`,
                        background: LEVEL_COLOR[z.level],
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted">{loading ? 'Loading…' : 'No data yet.'}</p>
        )}
        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className="card" aria-labelledby="rec-heading">
        <h2 id="rec-heading">Recommended actions</h2>
        <p className="card__hint muted">
          Prioritised guidance for venue staff, generated from live congestion.
        </p>
        <div aria-live="polite">
          {snapshot && snapshot.recommendations.length > 0 ? (
            snapshot.recommendations.map((r) => (
              <div key={r.id} className={`rec rec--${r.severity}`}>
                <div className="rec__sev">{r.severity}</div>
                <div>{r.message}</div>
              </div>
            ))
          ) : (
            <p className="muted">No recommendations to show.</p>
          )}
        </div>
      </section>
    </div>
  );
}
