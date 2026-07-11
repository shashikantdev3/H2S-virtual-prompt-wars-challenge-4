import { STADIUM } from '../shared/stadium';
import {
  generateRecommendations,
  peakLevel,
  simulateCongestion,
} from '../shared/congestion';
import type {
  CongestionLevel,
  ConciergeAnswer,
  OpsRecommendation,
  Stadium,
  ZoneCongestion,
} from '../shared/types';
import { answerQuestion, isGenAiEnabled } from './genai';
import { validateAssistantRequest } from './validation';

/**
 * Transport-agnostic request controllers.
 *
 * These functions contain the actual endpoint logic and know nothing about
 * Express or Vercel. Both the Express server (`app.ts`, used for local dev and
 * tests) and the Vercel serverless functions (`api/*.ts`, used in production)
 * are thin adapters that call these, so there is a single source of truth.
 */

export interface HealthResponse {
  status: 'ok';
  genai: boolean;
}

export function getHealth(): HealthResponse {
  return { status: 'ok', genai: isGenAiEnabled() };
}

export function getStadium(): Stadium {
  return STADIUM;
}

export interface OpsResponse {
  peak: CongestionLevel;
  congestion: ZoneCongestion[];
  recommendations: OpsRecommendation[];
}

/** Build the operations snapshot. `now` is injectable to keep it testable. */
export function getOps(now: number = Date.now()): OpsResponse {
  const congestion = simulateCongestion(STADIUM, now);
  return {
    peak: peakLevel(congestion),
    congestion,
    recommendations: generateRecommendations(STADIUM, congestion),
  };
}

/** A transport-neutral result: an HTTP status paired with a JSON body. */
export interface ApiResult<T> {
  status: number;
  body: T;
}

export interface AssistantResponse {
  answer: ConciergeAnswer;
  genaiEnabled: boolean;
}

type AssistantResult = ApiResult<AssistantResponse | { error: string }>;

/**
 * Validate and answer an assistant request. Returns the status and body for the
 * adapter to send. Never throws: model failures degrade to a 500 body.
 */
export async function postAssistant(body: unknown): Promise<AssistantResult> {
  const parsed = validateAssistantRequest(body);
  if (!parsed.ok) {
    return { status: 400, body: { error: parsed.error } };
  }
  try {
    const answer = await answerQuestion(
      STADIUM,
      parsed.value.message,
      parsed.value.context,
    );
    return { status: 200, body: { answer, genaiEnabled: isGenAiEnabled() } };
  } catch {
    return {
      status: 500,
      body: { error: 'The assistant is temporarily unavailable.' },
    };
  }
}
