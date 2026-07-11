// @vitest-environment node
import { describe, expect, it } from 'vitest';
import health from './health';
import stadium from './stadium';
import ops from './ops';
import assistant from './assistant';

function mockRes() {
  const res: {
    statusCode: number;
    body: unknown;
    headers: Record<string, string>;
    status: (c: number) => typeof res;
    json: (b: unknown) => typeof res;
    setHeader: (k: string, v: string) => void;
  } = {
    statusCode: 0,
    body: undefined,
    headers: {},
    status(c) {
      this.statusCode = c;
      return this;
    },
    json(b) {
      this.body = b;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
    },
  };
  return res;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('Vercel API handlers', () => {
  it('health returns ok', () => {
    const res = mockRes();
    health({} as any, res as any);
    expect(res.statusCode).toBe(200);
    expect((res.body as { status: string }).status).toBe('ok');
  });

  it('stadium returns zones', () => {
    const res = mockRes();
    stadium({} as any, res as any);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray((res.body as { zones: unknown[] }).zones)).toBe(true);
  });

  it('ops returns congestion and recommendations', () => {
    const res = mockRes();
    ops({} as any, res as any);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('peak');
    expect(res.body).toHaveProperty('recommendations');
  });

  it('assistant answers a valid POST', async () => {
    const res = mockRes();
    await assistant(
      {
        method: 'POST',
        body: {
          message: 'How do I get to the food court?',
          context: {
            language: 'en',
            accessibleRoute: false,
            currentZoneId: 'gate-c',
          },
        },
      } as any,
      res as any,
    );
    expect(res.statusCode).toBe(200);
    expect((res.body as any).answer.intent).toBe('wayfinding');
  });

  it('assistant rejects a non-POST method', async () => {
    const res = mockRes();
    await assistant({ method: 'GET' } as any, res as any);
    expect(res.statusCode).toBe(405);
  });

  it('assistant rejects an invalid body', async () => {
    const res = mockRes();
    await assistant(
      { method: 'POST', body: { message: '' } } as any,
      res as any,
    );
    expect(res.statusCode).toBe(400);
  });
});
