import { describe, expect, it } from 'vitest';
import { detectLanguage, t } from './i18n';

describe('t', () => {
  it('translates known keys per language', () => {
    expect(t('en', 'minutes')).toBe('min');
    expect(t('es', 'totalTime')).toContain('Tiempo');
    expect(t('fr', 'accessibilityIntro')).toContain('accessibilit');
  });
});

describe('detectLanguage', () => {
  it('detects Spanish and French hints, defaulting to English', () => {
    expect(detectLanguage('donde esta el baño')).toBe('es');
    expect(detectLanguage('où est la sortie')).toBe('fr');
    expect(detectLanguage('where is the exit')).toBe('en');
  });
});
