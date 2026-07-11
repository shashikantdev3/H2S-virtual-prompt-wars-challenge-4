import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Only wire up DOM helpers when running in a browser-like (jsdom) environment.
// Server tests use the node environment, where `window`/`document` are absent.
if (typeof window !== 'undefined') {
  const { cleanup } = await import('@testing-library/react');
  afterEach(() => {
    cleanup();
  });

  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
}
