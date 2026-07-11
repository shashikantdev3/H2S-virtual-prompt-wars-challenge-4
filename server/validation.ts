import type { FanContext, LanguageCode } from '../shared/types';

export interface AssistantRequest {
  message: string;
  context: FanContext;
}

export type ValidationResult =
  | { ok: true; value: AssistantRequest }
  | { ok: false; error: string };

const LANGUAGES: LanguageCode[] = ['en', 'es', 'fr'];
const MAX_MESSAGE_LENGTH = 500;
const MAX_ZONE_ID_LENGTH = 40;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Validate and normalise an untrusted /api/assistant request body.
 *
 * All external input is checked for type, range, and length before use. This
 * guards against oversized payloads, prototype pollution, and malformed data
 * reaching the model or the domain logic.
 */
export function validateAssistantRequest(body: unknown): ValidationResult {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  const { message, context } = body;
  if (typeof message !== 'string' || message.trim().length === 0) {
    return { ok: false, error: 'A non-empty "message" string is required.' };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `"message" must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
    };
  }

  if (!isPlainObject(context)) {
    return { ok: false, error: 'A "context" object is required.' };
  }

  const language = context.language;
  if (
    typeof language !== 'string' ||
    !LANGUAGES.includes(language as LanguageCode)
  ) {
    return { ok: false, error: 'context.language must be one of en, es, fr.' };
  }

  const accessibleRoute = context.accessibleRoute;
  if (typeof accessibleRoute !== 'boolean') {
    return { ok: false, error: 'context.accessibleRoute must be a boolean.' };
  }

  let currentZoneId: string | undefined;
  if (context.currentZoneId !== undefined) {
    if (
      typeof context.currentZoneId !== 'string' ||
      context.currentZoneId.length > MAX_ZONE_ID_LENGTH
    ) {
      return { ok: false, error: 'context.currentZoneId is invalid.' };
    }
    currentZoneId = context.currentZoneId;
  }

  return {
    ok: true,
    value: {
      message: message.trim(),
      context: {
        language: language as LanguageCode,
        accessibleRoute,
        ...(currentZoneId ? { currentZoneId } : {}),
      },
    },
  };
}
