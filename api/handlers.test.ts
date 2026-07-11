// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import health from './health';
import stadium from './stadium';
import ops from './ops';
import assistant from './assistant';

interface CapturedRes {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  status: (c: number) => CapturedRes;
  json: (b: unknown) => CapturedRes;
  setHeader: (k: string, v: string) => void;
}

function mockRes(): CapturedRes {
  const res: CapturedRes = {
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

const asReq = (init: Partial<VercelRequest>): VercelRequest =>
  init as unknown as VercelRequest;
const asRes = (res: CapturedRes): VercelResponse =>
  res as unknown as VercelResponse;

describe('Vercel API handlers', () => {
  it('health returns ok', () => {
    const res = mockRes();
    health(asReq({}), asRes(res));
    expect(res.statusCode).toBe(200);
    expect((res.body as { status: string }).status).toBe('ok');
  });

  it('stadium returns zones', () => {
    const res = mockRes();
    stadium(asReq({}), asRes(res));
    expect(res.statusCode).toBe(200);
    expect(Array.isArray((res.body as { zones: unknown[] }).zones)).toBe(true);
  });

  it('ops returns congestion and recommendations', () => {
    const res = mockRes();
    ops(asReq({}), asRes(res));
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('peak');
    expect(res.body).toHaveProperty('recommendations');
  });

  it('assistant answers a valid POST', async () => {
    const res = mockRes();
    await assistant(
      asReq({
        method: 'POST',
        body: {
          message: 'How do I get to the food court?',
          context: {
            language: 'en',
            accessibleRoute: false,
            currentZoneId: 'gate-c',
          },
        },
      }),
      asRes(res),
    );
    expect(res.statusCode).toBe(200);
    expect((res.body as { answer: { intent: string } }).answer.intent).toBe(
      'wayfinding',
    );
  });

  it('assistant rejects a non-POST method', async () => {
    const res = mockRes();
    await assistant(asReq({ method: 'GET' }), asRes(res));
    expect(res.statusCode).toBe(405);
  });

  it('assistant rejects an invalid body', async () => {
    const res = mockRes();
    await assistant(
      asReq({ method: 'POST', body: { message: '' } }),
      asRes(res),
    );
    expect(res.statusCode).toBe(400);
  });
});
