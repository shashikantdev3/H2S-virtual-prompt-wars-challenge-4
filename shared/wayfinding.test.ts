import { describe, expect, it } from 'vitest';
import { STADIUM } from './stadium';
import { findRoute, resolveZoneId } from './wayfinding';

describe('resolveZoneId', () => {
  it('matches by id, exact name, and substring', () => {
    expect(resolveZoneId(STADIUM, 'gate-c')).toBe('gate-c');
    expect(resolveZoneId(STADIUM, 'Gate C')).toBe('gate-c');
    expect(resolveZoneId(STADIUM, 'rail')).toBe('transit-rail');
  });

  it('returns undefined for unknown input', () => {
    expect(resolveZoneId(STADIUM, 'nonexistent place')).toBeUndefined();
  });
});

describe('findRoute', () => {
  it('finds a route between two connected zones', () => {
    const route = findRoute(STADIUM, 'gate-c', 'food-court');
    expect(route).not.toBeNull();
    expect(route!.steps.length).toBeGreaterThan(0);
    expect(route!.totalMinutes).toBeGreaterThan(0);
    expect(route!.steps.at(-1)!.zoneId).toBe('food-court');
  });

  it('returns a zero-length route to the same zone', () => {
    const route = findRoute(STADIUM, 'gate-a', 'gate-a');
    expect(route).not.toBeNull();
    expect(route!.totalMinutes).toBe(0);
    expect(route!.steps).toHaveLength(0);
  });

  it('excludes stairs when a step-free route is requested', () => {
    const withStairs = findRoute(STADIUM, 'concourse-n', 'sec-300', false);
    const stepFree = findRoute(STADIUM, 'concourse-n', 'sec-300', true);
    expect(withStairs).not.toBeNull();
    expect(stepFree).not.toBeNull();
    // The step-free route avoids the stairs edge, so it is not faster.
    expect(stepFree!.totalMinutes).toBeGreaterThanOrEqual(
      withStairs!.totalMinutes,
    );
    expect(stepFree!.stepFree).toBe(true);
  });

  it('returns null for unknown zones', () => {
    expect(findRoute(STADIUM, 'gate-a', 'no-such-zone')).toBeNull();
  });

  it('produces the fastest route by total minutes', () => {
    const route = findRoute(STADIUM, 'transit-rail', 'sec-100');
    expect(route).not.toBeNull();
    // rail -> gate-c (5) -> concourse-s (2) -> sec-100 (2) = 9
    expect(route!.totalMinutes).toBe(9);
  });
});
