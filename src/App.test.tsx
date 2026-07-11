import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const stadium = {
  id: 'v',
  name: 'Test Venue',
  city: 'Testville',
  country: 'USA',
  zones: [
    { id: 'gate-a', name: 'Gate A', kind: 'gate', stepFree: true },
    {
      id: 'transit-rail',
      name: 'Rail Station',
      kind: 'transport',
      stepFree: true,
    },
  ],
  paths: [],
  amenities: [],
  matches: [],
  transport: [],
};

const opsSnapshot = {
  peak: 'moderate',
  congestion: [
    { zoneId: 'gate-a', zoneName: 'Gate A', level: 'moderate', occupancy: 0.6 },
  ],
  recommendations: [
    { id: 'r1', severity: 'info', zoneId: 'venue', message: 'All clear.' },
  ],
};

function mockFetch() {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (url === '/api/stadium') {
      return { ok: true, json: async () => stadium } as Response;
    }
    if (url === '/api/ops') {
      return { ok: true, json: async () => opsSnapshot } as Response;
    }
    if (url === '/api/assistant') {
      const body = JSON.parse(String(init?.body));
      return {
        ok: true,
        json: async () => ({
          answer: {
            intent: 'general',
            language: body.context.language,
            text: `Echo: ${body.message}`,
            generative: false,
          },
          genaiEnabled: false,
        }),
      } as Response;
    }
    return { ok: false, status: 404, json: async () => ({}) } as Response;
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders the header and both tabs', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /stadiumiq/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /fan concierge/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /operations/i }),
    ).toBeInTheDocument();
  });

  it('provides a skip link', () => {
    render(<App />);
    expect(
      screen.getByRole('link', { name: /skip to main content/i }),
    ).toBeInTheDocument();
  });

  it('answers a concierge question', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText(/type your question/i);
    await user.type(input, 'hello');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(await screen.findByText(/Echo: hello/)).toBeInTheDocument();
  });

  it('loads the operations dashboard when its tab is selected', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /operations/i }));
    expect(
      await screen.findByRole('heading', { name: /crowd overview/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/all clear/i)).toBeInTheDocument();
  });
});
