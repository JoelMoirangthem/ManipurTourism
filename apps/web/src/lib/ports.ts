// Ports — interfaces only. Core depends on these, never on adapters (SOLID DIP).
// See docs/build/architecture.md §2.

export type Intent =
  | "plan"
  | "place_fact"
  | "status"
  | "inquiry_draft"
  | "translate"
  | "weather_context"
  | "out_of_scope";

export interface PlaceClaim {
  id: string;
  fieldKey: string;
  valueText: string | null;
  valueInt: number | null;
  sourceTitle: string;
  sourceUrl: string | null;
  scope: string;
  observedAt: string | null;
  /** Optional hard expiry. When present it outranks age-based projection. */
  validUntil?: string | null;
  reviewState: string;
}

export interface PlacePhoto {
  storageKey: string;
  caption: string;
  attribution: string;
  license: string;
  sourcePage: string;
  /** "seed" = bundled fixture, "approved-upload" = passed moderation. */
  origin?: "seed" | "approved-upload";
  uploadedAt?: string | null;
}

export interface PlaceRecord {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  district: string;
  summary: string;
  /** One short evocative sentence for cover cards. Verified-only wording. */
  tagline: string;
  lat: number | null;
  lng: number | null;
  coordSource: string | null;
  isDemo: boolean;
  claims: PlaceClaim[];
  photos: PlacePhoto[];
  /** Hosts/operators registered against this place (Phase C). */
  contactable?: boolean;
}

export interface EvidenceBundle {
  places: PlaceRecord[];
  claimIds: string[];
  unknowns: string[];
}

export interface IRetriever {
  searchPlaces(query: string, opts?: { district?: string; category?: string; limit?: number }): Promise<PlaceRecord[]>;
  getPlace(id: string): Promise<PlaceRecord | null>;
  nearby(lat: number, lng: number, radiusKm: number): Promise<{ place: PlaceRecord; distanceKm: number }[]>;
  listAll(): Promise<PlaceRecord[]>;
}

export interface ILLMProvider {
  complete(system: string, user: string, opts?: { maxTokens?: number; timeoutMs?: number }): Promise<string>;
  /** Token stream (OpenAI-compatible SSE). Yields text deltas; throws on upstream failure. */
  stream?(system: string, user: string, opts?: { maxTokens?: number; timeoutMs?: number }): AsyncGenerator<string>;
}

export interface ITranslator {
  translate(text: string, targetLang: string, targetScript?: string): Promise<{ text: string; provider: string; model: string }>;
}

export interface RouterResult {
  intent: Intent;
  /** Which router rule fired. Diagnostic only; safe to expose. */
  matched?: string;
  confidence?: "high" | "low";
  bundle: EvidenceBundle;
  answer: string;
  sources: { title: string; url: string | null; kind?: "claim" | "web" }[];
  searchedAt: string;
  /** Populated when the model answer was rejected and the template was used. */
  degraded?: { reason: string[] } | null;
}
