// @vitest-environment node
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app';

const app = createApp();

describe('API', () => {
  it('GET /api/health returns ok and genai flag', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.genai).toBe('boolean');
  });

  it('GET /api/stadium returns the venue with zones', async () => {
    const res = await request(app).get('/api/stadium');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.zones)).toBe(true);
    expect(res.body.zones.length).toBeGreaterThan(0);
  });

  it('GET /api/ops returns congestion and recommendations', async () => {
    const res = await request(app).get('/api/ops');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('peak');
    expect(Array.isArray(res.body.congestion)).toBe(true);
    expect(Array.isArray(res.body.recommendations)).toBe(true);
  });

  it('POST /api/assistant answers a valid wayfinding question', async () => {
    const res = await request(app)
      .post('/api/assistant')
      .send({
        message: 'How do I get to the food court?',
        context: {
          language: 'en',
          accessibleRoute: false,
          currentZoneId: 'gate-c',
        },
      });
    expect(res.status).toBe(200);
    expect(res.body.answer.intent).toBe('wayfinding');
    expect(res.body.answer.text).toMatch(/Total walking time/i);
  });

  it('POST /api/assistant rejects an invalid body with 400', async () => {
    const res = await request(app)
      .post('/api/assistant')
      .send({
        message: '',
        context: { language: 'en', accessibleRoute: false },
      });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
