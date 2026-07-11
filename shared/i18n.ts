import type { LanguageCode } from './types';

export const SUPPORTED_LANGUAGES: ReadonlyArray<{
  code: LanguageCode;
  label: string;
}> = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
];

/** UI + fallback-response strings, keyed by language. */
const STRINGS = {
  en: {
    routeIntro: 'Here is the fastest route',
    stepFreeRoute: 'Here is the step-free route',
    totalTime: 'Total walking time',
    minutes: 'min',
    noRoute:
      'Sorry, I could not find a route for that. Please ask Guest Services.',
    amenityIntro: 'You can find that here',
    transportIntro: 'Getting to and from the stadium',
    scheduleIntro: 'Upcoming matches at this venue',
    accessibilityIntro: 'Accessibility support',
    fallbackGeneral:
      'I can help with directions, amenities, transport, accessibility, and the match schedule. What do you need?',
  },
  es: {
    routeIntro: 'Esta es la ruta más rápida',
    stepFreeRoute: 'Esta es la ruta sin escaleras',
    totalTime: 'Tiempo total a pie',
    minutes: 'min',
    noRoute:
      'Lo siento, no encontré una ruta. Consulta con Atención al Cliente.',
    amenityIntro: 'Puedes encontrarlo aquí',
    transportIntro: 'Cómo llegar y salir del estadio',
    scheduleIntro: 'Próximos partidos en esta sede',
    accessibilityIntro: 'Apoyo de accesibilidad',
    fallbackGeneral:
      'Puedo ayudarte con direcciones, servicios, transporte, accesibilidad y el calendario. ¿Qué necesitas?',
  },
  fr: {
    routeIntro: 'Voici l’itinéraire le plus rapide',
    stepFreeRoute: 'Voici l’itinéraire sans escaliers',
    totalTime: 'Temps de marche total',
    minutes: 'min',
    noRoute:
      'Désolé, je n’ai pas trouvé d’itinéraire. Adressez-vous à l’accueil.',
    amenityIntro: 'Vous pouvez le trouver ici',
    transportIntro: 'Accès au stade et départ',
    scheduleIntro: 'Prochains matchs dans ce stade',
    accessibilityIntro: 'Assistance accessibilité',
    fallbackGeneral:
      'Je peux aider avec les directions, les services, le transport, l’accessibilité et le calendrier. Que vous faut-il ?',
  },
} as const;

export type StringKey = keyof (typeof STRINGS)['en'];

/** Translate a key into the requested language, falling back to English. */
export function t(language: LanguageCode, key: StringKey): string {
  return STRINGS[language]?.[key] ?? STRINGS.en[key];
}

const ES_HINTS = [
  'donde',
  'dónde',
  'baño',
  'salida',
  'entrada',
  'partido',
  'cómo',
  'como llego',
  'gracias',
  'ayuda',
];
const FR_HINTS = [
  'où',
  'ou est',
  'toilettes',
  'sortie',
  'entrée',
  'match',
  'comment',
  'merci',
  'aide',
  'accès',
];

/**
 * Best-effort language detection from the user's text. This is a lightweight
 * heuristic used only to pick a sensible default; the explicit language
 * selector always takes precedence in the UI.
 */
export function detectLanguage(text: string): LanguageCode {
  const lower = ` ${text.toLowerCase()} `;
  const score = (hints: string[]) =>
    hints.reduce((n, h) => (lower.includes(h) ? n + 1 : n), 0);
  const es = score(ES_HINTS);
  const fr = score(FR_HINTS);
  if (es === 0 && fr === 0) return 'en';
  return es >= fr ? 'es' : 'fr';
}
