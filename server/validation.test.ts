import { describe, expect, it } from 'vitest';
import { validateAssistantRequest } from './validation';

describe('validateAssistantRequest', () => {
  it('accepts a well-formed request', () => {
    const result = validateAssistantRequest({
      message: 'Where is Gate C?',
      context: {
        language: 'en',
        accessibleRoute: false,
        currentZoneId: 'gate-a',
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.message).toBe('Where is Gate C?');
      expect(result.value.context.currentZoneId).toBe('gate-a');
    }
  });

  it('rejects a non-object body', () => {
    expect(validateAssistantRequest('nope').ok).toBe(false);
    expect(validateAssistantRequest(null).ok).toBe(false);
  });

  it('rejects an empty or missing message', () => {
    expect(
      validateAssistantRequest({
        message: '   ',
        context: { language: 'en', accessibleRoute: false },
      }).ok,
    ).toBe(false);
  });

  it('rejects an oversized message', () => {
    const result = validateAssistantRequest({
      message: 'x'.repeat(501),
      context: { language: 'en', accessibleRoute: false },
    });
    expect(result.ok).toBe(false);
  });

  it('rejects an unsupported language', () => {
    const result = validateAssistantRequest({
      message: 'hi',
      context: { language: 'de', accessibleRoute: false },
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a non-boolean accessibleRoute', () => {
    const result = validateAssistantRequest({
      message: 'hi',
      context: { language: 'en', accessibleRoute: 'yes' },
    });
    expect(result.ok).toBe(false);
  });

  it('drops an over-long zone id', () => {
    const result = validateAssistantRequest({
      message: 'hi',
      context: {
        language: 'en',
        accessibleRoute: false,
        currentZoneId: 'z'.repeat(41),
      },
    });
    expect(result.ok).toBe(false);
  });
});
