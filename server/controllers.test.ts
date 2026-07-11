// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getHealth, getOps, getStadium, postAssistant } from './controllers';

describe('controllers', () => {
  it('getHealth reports status and a boolean genai flag', () => {
    const h = getHealth();
    expect(h.status).toBe('ok');
    expect(typeof h.genai).toBe('boolean');
  });

  it('getStadium returns a venue with zones', () => {
    expect(getStadium().zones.length).toBeGreaterThan(0);
  });

  it('getOps is deterministic for a fixed timestamp', () => {
    const a = getOps(1_000_000);
    const b = getOps(1_000_000);
    expect(a).toEqual(b);
    expect(a).toHaveProperty('peak');
    expect(a.recommendations.length).toBeGreaterThan(0);
  });

  it('postAssistant returns 200 for a valid request', async () => {
    const r = await postAssistant({
      message: 'How do I get to the food court?',
      context: {
        language: 'en',
        accessibleRoute: false,
        currentZoneId: 'gate-c',
      },
    });
    expect(r.status).toBe(200);
    expect('answer' in r.body).toBe(true);
  });

  it('postAssistant returns 400 for an invalid request', async () => {
    const r = await postAssistant({ message: '' });
    expect(r.status).toBe(400);
    expect('error' in r.body).toBe(true);
  });
});
