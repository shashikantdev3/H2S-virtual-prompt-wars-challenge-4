import type {
  CongestionLevel,
  OpsRecommendation,
  Stadium,
  ZoneCongestion,
} from './types';

/** Zone kinds we actively monitor for crowd management. */
const MONITORED_KINDS = new Set(['gate', 'concourse', 'transport']);

/** Deterministic pseudo-random value in [0, 1) from a string + seed. */
function hashUnit(key: string, seed: number): number {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Convert to unsigned and normalise.
  return ((h >>> 0) % 1000) / 1000;
}

export function levelFromOccupancy(occupancy: number): CongestionLevel {
  if (occupancy >= 0.9) return 'critical';
  if (occupancy >= 0.75) return 'high';
  if (occupancy >= 0.5) return 'moderate';
  return 'low';
}

/**
 * Produce a deterministic congestion snapshot for the monitored zones.
 *
 * The value is a stand-in for a real sensor / turnstile feed. It is fully
 * deterministic for a given `seed`, which keeps the UI stable between renders
 * and makes the behaviour unit-testable. Pass `Date.now()` in production for a
 * value that evolves over time.
 */
export function simulateCongestion(
  stadium: Stadium,
  seed: number,
): ZoneCongestion[] {
  // Bucket the seed so the snapshot is stable within a short window.
  const bucket = Math.floor(seed / 15000);
  return stadium.zones
    .filter((z) => MONITORED_KINDS.has(z.kind))
    .map((z) => {
      const occupancy = Math.round(hashUnit(z.id, bucket) * 100) / 100;
      return {
        zoneId: z.id,
        zoneName: z.name,
        occupancy,
        level: levelFromOccupancy(occupancy),
      };
    });
}

/** Rank order for comparing congestion levels. */
const LEVEL_RANK: Record<CongestionLevel, number> = {
  low: 0,
  moderate: 1,
  high: 2,
  critical: 3,
};

/**
 * Turn a congestion snapshot into prioritised operational recommendations.
 *
 * For each overcrowded gate we look for the least busy neighbouring gate and
 * suggest redirecting arriving fans there. Critical zones are escalated to
 * "action". This is the deterministic core that a GenAI layer can narrate.
 */
export function generateRecommendations(
  stadium: Stadium,
  congestion: ZoneCongestion[],
): OpsRecommendation[] {
  const gates = congestion.filter((c) =>
    stadium.zones.some((z) => z.id === c.zoneId && z.kind === 'gate'),
  );
  const recs: OpsRecommendation[] = [];

  for (const gate of gates) {
    if (LEVEL_RANK[gate.level] < LEVEL_RANK.high) continue;

    // Find the calmest alternative gate.
    const alternative = gates
      .filter((g) => g.zoneId !== gate.zoneId)
      .sort((a, b) => a.occupancy - b.occupancy)[0];

    const severity = gate.level === 'critical' ? 'action' : 'warning';
    const target =
      alternative && LEVEL_RANK[alternative.level] < LEVEL_RANK[gate.level]
        ? ` Redirect arriving fans to ${alternative.zoneName} (currently ${Math.round(
            alternative.occupancy * 100,
          )}% full).`
        : '';

    recs.push({
      id: `rec-${gate.zoneId}`,
      severity,
      zoneId: gate.zoneId,
      message: `${gate.zoneName} is ${gate.level} at ${Math.round(
        gate.occupancy * 100,
      )}% capacity.${target}`,
    });
  }

  // Escalate any critical transport hub as well.
  for (const c of congestion) {
    const zone = stadium.zones.find((z) => z.id === c.zoneId);
    if (zone?.kind === 'transport' && c.level === 'critical') {
      recs.push({
        id: `rec-${c.zoneId}`,
        severity: 'action',
        zoneId: c.zoneId,
        message: `${c.zoneName} is critically congested. Stagger egress messaging and hold fans in nearby concourses.`,
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      id: 'rec-all-clear',
      severity: 'info',
      zoneId: 'venue',
      message:
        'All monitored zones are within safe capacity. No action needed.',
    });
  }

  // Actions first, then warnings, then info.
  const sevRank = { action: 0, warning: 1, info: 2 } as const;
  return recs.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
}

/** Compute the highest congestion level currently present (for headline UI). */
export function peakLevel(congestion: ZoneCongestion[]): CongestionLevel {
  return congestion.reduce<CongestionLevel>((peak, c) => {
    return LEVEL_RANK[c.level] > LEVEL_RANK[peak] ? c.level : peak;
  }, 'low');
}
