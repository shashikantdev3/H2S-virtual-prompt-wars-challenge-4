import { t } from './i18n';
import type {
  Amenity,
  ConciergeAnswer,
  FanContext,
  Intent,
  Stadium,
} from './types';
import { findRoute, getZone, resolveZoneId } from './wayfinding';

/** Default arrival point when the fan has not shared their location. */
const DEFAULT_ORIGIN = 'gate-c';

/**
 * Keyword sets per intent, evaluated in the order defined by INTENT_ORDER.
 * Specific categories (transport, schedule, accessibility) are matched before
 * generic wayfinding so that "how do I get the train" is a transport question
 * while "how do I get to section 300" is wayfinding.
 */
const INTENT_KEYWORDS: Record<Exclude<Intent, 'general'>, string[]> = {
  transport: [
    'train',
    'rail',
    'bus',
    'shuttle',
    'parking',
    'uber',
    'lyft',
    'rideshare',
    'metro',
    'transport',
    'transit',
    'tren',
    'autobús',
    'estacionamiento',
    'transporte',
  ],
  schedule: [
    'match',
    'kickoff',
    'kick off',
    'schedule',
    'fixture',
    'when is',
    'game',
    'partido',
    'calendario',
    'horaire',
  ],
  accessibility: [
    'wheelchair',
    'accessible',
    'step-free',
    'step free',
    'elevator',
    'lift',
    'ramp',
    'disabled',
    'mobility',
    'accesible',
    'ascensor',
    'ascenseur',
  ],
  wayfinding: [
    'how do i get',
    'how to get',
    'route',
    'directions',
    'way to',
    'get to',
    'find my seat',
    'cómo llego',
    'comment aller',
  ],
  amenity: [
    'restroom',
    'toilet',
    'bathroom',
    'food',
    'eat',
    'drink',
    'water',
    'first aid',
    'medical',
    'charging',
    'charge',
    'guest services',
    'baño',
    'comida',
    'agua',
    'toilettes',
    'nourriture',
    'eau',
  ],
};

const INTENT_ORDER: Array<Exclude<Intent, 'general'>> = [
  'transport',
  'schedule',
  'accessibility',
  'wayfinding',
  'amenity',
];

/** Classify the fan's message into a single intent. */
export function detectIntent(message: string): Intent {
  const text = message.toLowerCase();
  for (const intent of INTENT_ORDER) {
    if (INTENT_KEYWORDS[intent].some((kw) => text.includes(kw))) {
      return intent;
    }
  }
  return 'general';
}

const AMENITY_HINTS: Array<{ hints: string[]; category: Amenity['category'] }> =
  [
    {
      hints: ['restroom', 'toilet', 'bathroom', 'baño', 'toilettes'],
      category: 'restroom',
    },
    { hints: ['food', 'eat', 'comida', 'nourriture'], category: 'food' },
    { hints: ['water', 'agua', 'eau', 'drink'], category: 'water' },
    { hints: ['first aid', 'medical', 'médico'], category: 'first-aid' },
    { hints: ['charging', 'charge', 'cargar'], category: 'charging' },
    {
      hints: ['guest services', 'info', 'help desk', 'información'],
      category: 'info',
    },
  ];

/** Find the destination zone id implied by the message, if any. */
export function extractDestination(
  stadium: Stadium,
  message: string,
): string | undefined {
  const text = message.toLowerCase();

  for (const { hints, category } of AMENITY_HINTS) {
    if (hints.some((h) => text.includes(h))) {
      const preferCategory =
        category === 'restroom' ? 'accessible-restroom' : category;
      const amenity =
        stadium.amenities.find((a) => a.category === preferCategory) ??
        stadium.amenities.find((a) => a.category === category);
      if (amenity) return amenity.zoneId;
    }
  }

  for (const zone of stadium.zones) {
    if (text.includes(zone.name.toLowerCase())) return zone.id;
  }
  const secMatch = text.match(/\b([123])00s?\b/);
  if (secMatch) {
    const id = `sec-${secMatch[1]}00`;
    if (getZone(stadium, id)) return id;
  }
  const gateMatch = text.match(/\bgate\s*([a-d])\b/);
  if (gateMatch) return `gate-${gateMatch[1]}`;

  return resolveZoneId(stadium, message);
}

function formatMatch(m: Stadium['matches'][number]): string {
  const date = new Date(m.kickoff);
  const when = Number.isNaN(date.getTime())
    ? m.kickoff
    : date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
  return `${m.home} vs ${m.away} — ${m.stage}, ${when}`;
}

function noRoute(
  intent: Intent,
  lang: FanContext['language'],
): ConciergeAnswer {
  return {
    intent,
    language: lang,
    text: t(lang, 'noRoute'),
    generative: false,
  };
}

/**
 * Deterministic, grounded responder. Answers directly from the knowledge base
 * with no external calls, so it is used both as the offline fallback and as the
 * factual grounding for the generative layer.
 */
export function answerFallback(
  stadium: Stadium,
  message: string,
  context: FanContext,
): ConciergeAnswer {
  const intent = detectIntent(message);
  const lang = context.language;
  const origin = context.currentZoneId ?? DEFAULT_ORIGIN;

  const wantsRoute =
    intent === 'wayfinding' ||
    (intent === 'accessibility' && !!extractDestination(stadium, message));

  if (wantsRoute) {
    const destination = extractDestination(stadium, message);
    const destZone = destination ? getZone(stadium, destination) : undefined;
    const originZone = getZone(stadium, origin);
    if (!destination || !destZone || !originZone) {
      return noRoute(intent, lang);
    }
    const stepFree = context.accessibleRoute || intent === 'accessibility';
    const route = findRoute(stadium, origin, destination, stepFree);
    if (!route) {
      return noRoute(intent, lang);
    }
    const intro = stepFree ? t(lang, 'stepFreeRoute') : t(lang, 'routeIntro');
    const stepLines = route.steps.map(
      (s, i) =>
        `${i + 1}. ${s.instruction} (${s.minutes} ${t(lang, 'minutes')})`,
    );
    const text = [
      `${intro} ${originZone.name} → ${destZone.name}:`,
      ...stepLines,
      `${t(lang, 'totalTime')}: ${route.totalMinutes} ${t(lang, 'minutes')}.`,
    ].join('\n');
    return {
      intent: 'wayfinding',
      language: lang,
      text,
      generative: false,
      route,
    };
  }

  if (intent === 'amenity') {
    const destination = extractDestination(stadium, message);
    const zone = destination ? getZone(stadium, destination) : undefined;
    if (zone) {
      const originZone = getZone(stadium, origin);
      const route = findRoute(
        stadium,
        origin,
        zone.id,
        context.accessibleRoute,
      );
      const eta =
        route && originZone
          ? ` (~${route.totalMinutes} ${t(lang, 'minutes')} from ${originZone.name})`
          : '';
      return {
        intent,
        language: lang,
        text: `${t(lang, 'amenityIntro')}: ${zone.name}${eta}.`,
        generative: false,
        ...(route ? { route } : {}),
      };
    }
  }

  if (intent === 'transport') {
    const options = stadium.transport
      .filter((o) => (context.accessibleRoute ? o.accessible : true))
      .map((o) => `• ${o.name}: ${o.note}`);
    return {
      intent,
      language: lang,
      text: `${t(lang, 'transportIntro')}:\n${options.join('\n')}`,
      generative: false,
    };
  }

  if (intent === 'schedule') {
    const lines = stadium.matches.map((m) => `• ${formatMatch(m)}`);
    return {
      intent,
      language: lang,
      text: `${t(lang, 'scheduleIntro')}:\n${lines.join('\n')}`,
      generative: false,
    };
  }

  if (intent === 'accessibility') {
    const accessibleRestroom = stadium.amenities.find(
      (a) => a.category === 'accessible-restroom',
    );
    const restroomZone = accessibleRestroom
      ? getZone(stadium, accessibleRestroom.zoneId)?.name
      : undefined;
    const lines = [
      `${t(lang, 'accessibilityIntro')}:`,
      '• Step-free routes avoid all stairs; ask me for a "step-free route" to any zone.',
      '• Elevators serve the Upper Concourse and Upper Bowl (300s).',
      restroomZone ? `• Accessible restrooms: ${restroomZone}.` : '',
      '• Accessible parking is in Lot G near Gate D.',
    ].filter(Boolean);
    return {
      intent,
      language: lang,
      text: lines.join('\n'),
      generative: false,
    };
  }

  return {
    intent: 'general',
    language: lang,
    text: t(lang, 'fallbackGeneral'),
    generative: false,
  };
}

/**
 * Build a compact, factual grounding block for the generative model. Only
 * verified knowledge-base facts are included, which keeps the model from
 * inventing gates, times, or routes (hallucination control).
 */
export function buildGrounding(
  stadium: Stadium,
  message: string,
  context: FanContext,
): string {
  const base = answerFallback(stadium, message, context);
  const zones = stadium.zones
    .map((z) => `${z.name}${z.stepFree ? '' : ' (stairs)'}`)
    .join(', ');
  const transport = stadium.transport
    .map((o) => `${o.name}: ${o.note}`)
    .join(' | ');
  const matches = stadium.matches.map(formatMatch).join(' | ');
  return [
    `Venue: ${stadium.name}, ${stadium.city}, ${stadium.country}.`,
    `Zones: ${zones}.`,
    `Transport: ${transport}.`,
    `Matches: ${matches}.`,
    `Fan context: language=${context.language}, at=${context.currentZoneId ?? 'unknown'}, accessibleRoute=${context.accessibleRoute}.`,
    `Verified answer to ground on: ${base.text.replace(/\n/g, ' ')}`,
  ].join('\n');
}
