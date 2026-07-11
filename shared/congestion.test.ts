import { describe, expect, it } from 'vitest';
import { STADIUM } from './stadium';
import {
  generateRecommendations,
  levelFromOccupancy,
  peakLevel,
  simulateCongestion,
} from './congestion';
import type { ZoneCongestion } from './types';

describe('levelFromOccupancy', () => {
  it('maps occupancy to congestion levels at the right thresholds', () => {
    expect(levelFromOccupancy(0.2)).toBe('low');
    expect(levelFromOccupancy(0.5)).toBe('moderate');
    expect(levelFromOccupancy(0.75)).toBe('high');
    expect(levelFromOccupancy(0.95)).toBe('critical');
  });
});

describe('simulateCongestion', () => {
  it('is deterministic for a given seed bucket', () => {
    const a = simulateCongestion(STADIUM, 1_000_000);
    const b = simulateCongestion(STADIUM, 1_000_000);
    expect(a).toEqual(b);
  });

  it('only reports monitored zones with valid occupancy', () => {
    const snapshot = simulateCongestion(STADIUM, 42_000);
    expect(snapshot.length).toBeGreaterThan(0);
    for (const z of snapshot) {
      expect(z.occupancy).toBeGreaterThanOrEqual(0);
      expect(z.occupancy).toBeLessThanOrEqual(1);
    }
  });
});

describe('generateRecommendations', () => {
  it('suggests redirecting fans from a critical gate to a calmer gate', () => {
    const congestion: ZoneCongestion[] = [
      {
        zoneId: 'gate-a',
        zoneName: 'Gate A',
        level: 'critical',
        occupancy: 0.95,
      },
      { zoneId: 'gate-b', zoneName: 'Gate B', level: 'low', occupancy: 0.2 },
    ];
    const recs = generateRecommendations(STADIUM, congestion);
    const action = recs.find((r) => r.zoneId === 'gate-a');
    expect(action).toBeDefined();
    expect(action!.severity).toBe('action');
    expect(action!.message).toContain('Gate B');
  });

  it('returns an all-clear when nothing is congested', () => {
    const congestion: ZoneCongestion[] = [
      { zoneId: 'gate-a', zoneName: 'Gate A', level: 'low', occupancy: 0.2 },
    ];
    const recs = generateRecommendations(STADIUM, congestion);
    expect(recs).toHaveLength(1);
    expect(recs[0]!.severity).toBe('info');
  });

  it('orders actions before warnings and info', () => {
    const congestion: ZoneCongestion[] = [
      { zoneId: 'gate-a', zoneName: 'Gate A', level: 'high', occupancy: 0.8 },
      {
        zoneId: 'gate-b',
        zoneName: 'Gate B',
        level: 'critical',
        occupancy: 0.95,
      },
      { zoneId: 'gate-c', zoneName: 'Gate C', level: 'low', occupancy: 0.1 },
    ];
    const recs = generateRecommendations(STADIUM, congestion);
    expect(recs[0]!.severity).toBe('action');
  });
});

describe('peakLevel', () => {
  it('returns the highest present level', () => {
    const congestion: ZoneCongestion[] = [
      { zoneId: 'a', zoneName: 'A', level: 'low', occupancy: 0.1 },
      { zoneId: 'b', zoneName: 'B', level: 'high', occupancy: 0.8 },
    ];
    expect(peakLevel(congestion)).toBe('high');
  });
});
