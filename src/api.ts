import type {
  ConciergeAnswer,
  FanContext,
  OpsRecommendation,
  Stadium,
  ZoneCongestion,
  CongestionLevel,
} from '../shared/types';

/** Thin, typed client for the StadiumIQ API. */

export interface OpsSnapshot {
  peak: CongestionLevel;
  congestion: ZoneCongestion[];
  recommendations: OpsRecommendation[];
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export function fetchStadium(): Promise<Stadium> {
  return getJson<Stadium>('/api/stadium');
}

export function fetchOps(): Promise<OpsSnapshot> {
  return getJson<OpsSnapshot>('/api/ops');
}

export async function askAssistant(
  message: string,
  context: FanContext,
): Promise<{ answer: ConciergeAnswer; genaiEnabled: boolean }> {
  return postJson('/api/assistant', { message, context });
}
