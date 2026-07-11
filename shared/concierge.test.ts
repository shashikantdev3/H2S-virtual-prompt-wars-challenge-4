import { describe, expect, it } from 'vitest';
import { STADIUM } from './stadium';
import { answerFallback, detectIntent, extractDestination } from './concierge';
import type { FanContext } from './types';

const baseCtx: FanContext = { language: 'en', accessibleRoute: false };

describe('detectIntent', () => {
  it('classifies common questions', () => {
    expect(detectIntent('How do I get to gate C?')).toBe('wayfinding');
    expect(detectIntent('Where is the nearest restroom?')).toBe('amenity');
    expect(detectIntent('Which train do I take?')).toBe('transport');
    expect(detectIntent('When is the next match?')).toBe('schedule');
    expect(detectIntent('Is there wheelchair access?')).toBe('accessibility');
    expect(detectIntent('hello there')).toBe('general');
  });
});

describe('extractDestination', () => {
  it('maps amenity words to a zone', () => {
    expect(extractDestination(STADIUM, 'where is a restroom')).toBe(
      'restroom-s',
    );
    expect(extractDestination(STADIUM, 'I want food')).toBe('food-court');
  });

  it('parses section and gate shorthand', () => {
    expect(extractDestination(STADIUM, 'get me to 300s')).toBe('sec-300');
    expect(extractDestination(STADIUM, 'route to gate a')).toBe('gate-a');
  });
});

describe('answerFallback', () => {
  it('produces a wayfinding route with steps', () => {
    const ans = answerFallback(STADIUM, 'How do I get to the food court?', {
      ...baseCtx,
      currentZoneId: 'gate-c',
    });
    expect(ans.intent).toBe('wayfinding');
    expect(ans.route).toBeDefined();
    expect(ans.text).toMatch(/Total walking time/i);
    expect(ans.generative).toBe(false);
  });

  it('honours accessible routing for step-free requests', () => {
    const ans = answerFallback(STADIUM, 'step-free route to 300s', {
      ...baseCtx,
      currentZoneId: 'concourse-n',
      accessibleRoute: true,
    });
    expect(ans.route?.stepFree).toBe(true);
  });

  it('answers transport questions from the knowledge base', () => {
    const ans = answerFallback(STADIUM, 'how do I get the train', baseCtx);
    expect(ans.intent).toBe('transport');
    expect(ans.text).toContain('Rail');
  });

  it('lists the schedule', () => {
    const ans = answerFallback(STADIUM, 'match schedule', baseCtx);
    expect(ans.intent).toBe('schedule');
    expect(ans.text).toContain('Final');
  });

  it('replies in the requested language for general queries', () => {
    const ans = answerFallback(STADIUM, 'hola', { ...baseCtx, language: 'es' });
    expect(ans.language).toBe('es');
    expect(ans.text).toMatch(/Puedo ayudarte/);
  });
});
