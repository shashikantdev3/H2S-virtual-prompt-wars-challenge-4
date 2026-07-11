import type { Path, RouteResult, RouteStep, Stadium, Zone } from './types';

/** Look up a zone by id. Returns undefined if not found. */
export function getZone(stadium: Stadium, zoneId: string): Zone | undefined {
  return stadium.zones.find((z) => z.id === zoneId);
}

/**
 * Resolve a free-text location (id or partial name) to a zone id.
 * Case-insensitive; matches on id, exact name, or name substring.
 */
export function resolveZoneId(
  stadium: Stadium,
  query: string,
): string | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const byId = stadium.zones.find((z) => z.id.toLowerCase() === q);
  if (byId) return byId.id;
  const byName = stadium.zones.find((z) => z.name.toLowerCase() === q);
  if (byName) return byName.id;
  const bySub = stadium.zones.find((z) => z.name.toLowerCase().includes(q));
  return bySub?.id;
}

interface Edge {
  to: string;
  minutes: number;
  hasStairs: boolean;
}

/** Build a bidirectional adjacency list from the stadium paths. */
function buildGraph(paths: Path[]): Map<string, Edge[]> {
  const graph = new Map<string, Edge[]>();
  const add = (from: string, edge: Edge) => {
    const list = graph.get(from) ?? [];
    list.push(edge);
    graph.set(from, list);
  };
  for (const p of paths) {
    add(p.from, { to: p.to, minutes: p.minutes, hasStairs: p.hasStairs });
    add(p.to, { to: p.from, minutes: p.minutes, hasStairs: p.hasStairs });
  }
  return graph;
}

/**
 * Find the fastest walking route between two zones using Dijkstra's algorithm.
 *
 * When `stepFree` is true, paths that involve stairs are excluded so the route
 * is wheelchair- and stroller-accessible. Returns `null` if no route exists
 * (for example, if a step-free route is requested but none is available).
 */
export function findRoute(
  stadium: Stadium,
  fromZoneId: string,
  toZoneId: string,
  stepFree = false,
): RouteResult | null {
  if (!getZone(stadium, fromZoneId) || !getZone(stadium, toZoneId)) {
    return null;
  }
  if (fromZoneId === toZoneId) {
    return {
      fromZoneId,
      toZoneId,
      steps: [],
      totalMinutes: 0,
      stepFree: true,
    };
  }

  const graph = buildGraph(stadium.paths);
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  dist.set(fromZoneId, 0);

  // Simple priority selection (linear scan) is fine for this small graph.
  while (visited.size < stadium.zones.length) {
    let current: string | undefined;
    let best = Infinity;
    for (const [zoneId, d] of dist) {
      if (!visited.has(zoneId) && d < best) {
        best = d;
        current = zoneId;
      }
    }
    if (current === undefined) break;
    if (current === toZoneId) break;
    visited.add(current);

    for (const edge of graph.get(current) ?? []) {
      if (stepFree && edge.hasStairs) continue;
      if (visited.has(edge.to)) continue;
      const nextDist = best + edge.minutes;
      if (nextDist < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, nextDist);
        prev.set(edge.to, current);
      }
    }
  }

  if (!dist.has(toZoneId)) return null;

  // Reconstruct the path from destination back to origin.
  const order: string[] = [];
  let node: string | undefined = toZoneId;
  while (node !== undefined) {
    order.unshift(node);
    if (node === fromZoneId) break;
    node = prev.get(node);
  }
  if (order[0] !== fromZoneId) return null;

  const steps: RouteStep[] = [];
  for (let i = 1; i < order.length; i += 1) {
    const fromId = order[i - 1]!;
    const toId = order[i]!;
    const zone = getZone(stadium, toId)!;
    const edge = (graph.get(fromId) ?? []).find((e) => e.to === toId)!;
    steps.push({
      zoneId: toId,
      zoneName: zone.name,
      instruction: `Head to ${zone.name}`,
      minutes: edge.minutes,
    });
  }

  return {
    fromZoneId,
    toZoneId,
    steps,
    totalMinutes: dist.get(toZoneId) ?? 0,
    stepFree,
  };
}
