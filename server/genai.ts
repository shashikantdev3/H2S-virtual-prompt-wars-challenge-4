import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FanContext, Stadium } from '../shared/types';
import { answerFallback, buildGrounding } from '../shared/concierge';
import type { ConciergeAnswer } from '../shared/types';

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';
const API_KEY = process.env.GEMINI_API_KEY ?? '';

/** Whether a generative model is configured. Never logs the key itself. */
export function isGenAiEnabled(): boolean {
  return API_KEY.trim().length > 0;
}

const LANGUAGE_NAMES: Record<FanContext['language'], string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
};

function systemPrompt(context: FanContext): string {
  return [
    'You are StadiumIQ, a helpful, concise assistant for fans at a FIFA World Cup 2026 stadium.',
    `Reply ONLY in ${LANGUAGE_NAMES[context.language]}.`,
    'Use ONLY the facts in the GROUNDING block. Never invent gates, times, routes, or amenities.',
    'If the grounding does not contain the answer, say you are not sure and suggest Guest Services.',
    'Keep replies under 90 words. Be warm, clear, and practical. Preserve any numbered route steps.',
  ].join(' ');
}

let cachedClient: GoogleGenerativeAI | null = null;
function client(): GoogleGenerativeAI {
  if (!cachedClient) cachedClient = new GoogleGenerativeAI(API_KEY);
  return cachedClient;
}

/**
 * Answer a fan question. When a Gemini key is configured, the deterministic
 * grounding is passed to the model for a fluent, localized reply. Otherwise
 * (or if the model call fails) the verified deterministic answer is returned.
 * Either way the factual content comes from the knowledge base.
 */
export async function answerQuestion(
  stadium: Stadium,
  message: string,
  context: FanContext,
): Promise<ConciergeAnswer> {
  const fallback = answerFallback(stadium, message, context);
  if (!isGenAiEnabled()) return fallback;

  try {
    const grounding = buildGrounding(stadium, message, context);
    const model = client().getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt(context),
    });
    const result = await model.generateContent(
      `GROUNDING:\n${grounding}\n\nFAN QUESTION: ${message}`,
    );
    const text = result.response.text().trim();
    if (!text) return fallback;
    return { ...fallback, text, generative: true };
  } catch (err) {
    // Fail safe: never surface model errors to the fan.
    console.error('GenAI call failed, using deterministic fallback:', err);
    return fallback;
  }
}
