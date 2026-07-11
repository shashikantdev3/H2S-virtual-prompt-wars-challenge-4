/**
 * Shared domain types for StadiumIQ.
 *
 * These types are used by both the browser client and the Node server, so this
 * module must stay free of any platform-specific (DOM or Node) dependencies.
 */

export type LanguageCode = 'en' | 'es' | 'fr';

export type ZoneKind =
  | 'gate'
  | 'seating'
  | 'concourse'
  | 'amenity'
  | 'transport'
  | 'medical';

/** A physical point of interest inside or around the stadium. */
export interface Zone {
  id: string;
  /** Short human-readable name, e.g. "Gate C" or "First Aid North". */
  name: string;
  kind: ZoneKind;
  /** Optional longer description shown to fans. */
  description?: string;
  /** True if the zone is reachable without stairs (step-free). */
  stepFree: boolean;
}

/** A walkable connection between two zones. */
export interface Path {
  from: string;
  to: string;
  /** Estimated walking time in minutes. */
  minutes: number;
  /** True if this path involves stairs / is not step-free. */
  hasStairs: boolean;
}

export type AmenityCategory =
  | 'restroom'
  | 'accessible-restroom'
  | 'food'
  | 'water'
  | 'first-aid'
  | 'info'
  | 'charging'
  | 'transport';

export interface Amenity {
  id: string;
  name: string;
  category: AmenityCategory;
  zoneId: string;
}

/** A scheduled match at the venue. */
export interface Match {
  id: string;
  home: string;
  away: string;
  /** ISO-8601 kickoff time. */
  kickoff: string;
  stage: string;
}

/** The full, static knowledge base for a venue. */
export interface Stadium {
  id: string;
  name: string;
  city: string;
  country: string;
  zones: Zone[];
  paths: Path[];
  amenities: Amenity[];
  matches: Match[];
  /** Transport options serving the venue. */
  transport: TransportOption[];
}

export interface TransportOption {
  id: string;
  mode: 'metro' | 'bus' | 'rail' | 'rideshare' | 'park';
  name: string;
  /** Fan-facing guidance. */
  note: string;
  accessible: boolean;
}

/** Live-ish congestion level for a zone (simulated for the demo). */
export type CongestionLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface ZoneCongestion {
  zoneId: string;
  zoneName: string;
  level: CongestionLevel;
  /** Occupancy as a fraction of capacity, 0–1. */
  occupancy: number;
}

/** An operational recommendation for venue staff. */
export interface OpsRecommendation {
  id: string;
  severity: 'info' | 'warning' | 'action';
  zoneId: string;
  message: string;
}

/** Context describing the fan asking a question. */
export interface FanContext {
  language: LanguageCode;
  /** Zone id the fan is currently at, if known. */
  currentZoneId?: string;
  /** Whether the fan needs step-free / accessible routing. */
  accessibleRoute: boolean;
}

export type Intent =
  | 'wayfinding'
  | 'amenity'
  | 'transport'
  | 'schedule'
  | 'accessibility'
  | 'general';

/** A concierge answer plus the structured data that produced it. */
export interface ConciergeAnswer {
  intent: Intent;
  language: LanguageCode;
  /** The natural-language reply shown to the fan. */
  text: string;
  /** True when produced by the generative model, false for the fallback. */
  generative: boolean;
  /** Optional step-by-step route when the intent is wayfinding. */
  route?: RouteResult;
}

export interface RouteResult {
  fromZoneId: string;
  toZoneId: string;
  steps: RouteStep[];
  totalMinutes: number;
  stepFree: boolean;
}

export interface RouteStep {
  zoneId: string;
  zoneName: string;
  instruction: string;
  minutes: number;
}
