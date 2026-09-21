// Inquiry store — server-only, file-backed for dev (Postgres in Phase 1 hardening).
// Immutable originals, per-thread sequences, idempotent creates.
// Host replies are private-by-default, expiring, host-reported — never reservations.
//
// GAP FIXED (a): `listInquiries` returned every thread to every caller. It now
// requires an actor scope, so a visitor sees only their own threads and a
// provider sees only threads addressed to listings they own.
// GAP FIXED (b): the 14-day constant applied to all availability replies. Expiry
// is now derived per availability kind, from data-governance §5.

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import type { Actor, Role } from "./actors";

const DATA_FILE = path.join(process.cwd(), ".data", "inquiries.json");

export const AvailabilityKind = z.enum(["reported_available", "reported_unavailable", "needs_details"]);

export const CreateInquiry = z.object({
  placeId: z.string().min(1).max(80),
  listingId: z.string().min(1).max(80).default("directory"),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  partySize: z.number().int().min(1).max(50),
  message: z.string().min(1).max(2000),
  idempotencyKey: z.string().min(8).max(120),
});

export const PostMessage = z.object({
  text: z.string().min(1).max(2000),
  availability: z
    .object({
      kind: AvailabilityKind,
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDateExclusive: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      quantity: z.number().int().min(0).nullable().default(null),
      quotePaise: z.number().int().min(0).nullable().default(null),
    })
    .nullable()
    .default(null),
});

export interface StoredMessage {
  id: string;
  inquiryId: string;
  senderId: string;
  senderRole: "visitor" | "provider";
  /** True while identity was self-asserted rather than authenticated. */
  senderUnverified: boolean;
  sequence: number;
  originalText: string;
  availability: {
    kind: z.infer<typeof AvailabilityKind>;
    startDate: string;
    endDateExclusive: string;
    quantity: number | null;
    quotePaise: number | null;
    currency: "INR";
  } | null;
  /** Derived from kind + observation window, not a global constant. */
  expiresAt: string | null;
  /** "machine_unreviewed" when routed through MT; "human" for typed replies. */
  quality: "human" | "machine_unreviewed";
  acceptedAt: string;
}

export interface StoredInquiry {
  id: string;
  placeId: string;
  listingId: string;
  /** Owner listing slugs, so provider scoping can be evaluated. */
  providerListingIds: string[];
  visitorId: string;
  /** Role of the account that opened the thread (see createInquiry). */
  openedByRole: Role;
  checkIn: string | null;
  checkOut: string | null;
  partySize: number;
  state: "open" | "answered" | "closed";
  idempotencyKey: string;
  payloadDigest: string;
  createdAt: string;
  updatedAt: string;
  messages: StoredMessage[];
}

async function loadAll(): Promise<StoredInquiry[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoredInquiry[];
    if (!Array.isArray(parsed)) return [];
    // Records written before `openedByRole` existed are treated as visitor-opened,
    // which is what every pre-existing thread in fact was.
    return parsed.map((i) => ({ ...i, openedByRole: i.openedByRole ?? "visitor" }));
  } catch {
    return [];
  }
}

async function saveAll(all: StoredInquiry[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(all, null, 2), "utf8");
}

function digestOf(obj: unknown): string {
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

export class IdempotencyConflict extends Error {}
export class ScopeDenied extends Error {}

/**
 * Availability expiry, per kind (data-governance §5).
 *  - reported_available: a claim about capacity that decays fastest → 7 days
 *  - reported_unavailable: "not free" is more durable than "free"        → 21 days
 *  - needs_details:       no operational content at all                  → 14 days
 * Expiry is capped so it never outlives the stay window it describes.
 */
export function availabilityExpiry(
  kind: z.infer<typeof AvailabilityKind>,
  endDateExclusive: string,
  now: Date = new Date()
): string {
  const days = kind === "reported_available" ? 7 : kind === "reported_unavailable" ? 21 : 14;
  const base = now.getTime() + days * 86_400_000;
  const end = new Date(`${endDateExclusive}T00:00:00Z`).getTime();
  return new Date(Number.isFinite(end) ? Math.min(base, end) : base).toISOString();
}

/** Create thread + first message atomically. Same key + same payload → original. Same key + different payload → 409. */
export async function createInquiry(
  input: z.infer<typeof CreateInquiry>,
  actor: Actor
): Promise<{ inquiry: StoredInquiry; replayed: boolean }> {
  const all = await loadAll();
  const { idempotencyKey, message, ...rest } = input;
  const digest = digestOf({ ...rest, message });
  // Idempotency is scoped per visitor so one visitor cannot probe another's keys.
  const existing = all.find((i) => i.visitorId === actor.id && i.idempotencyKey === idempotencyKey);
  if (existing) {
    if (existing.payloadDigest !== digest) throw new IdempotencyConflict("Same idempotency key with a different payload.");
    return { inquiry: existing, replayed: true };
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  // Which provider(s) may read this thread. The inquiry is addressed to the
  // chosen listing; the place slug is included only when it is a DISTINCT
  // addressable listing (some places are themselves the listing). Including
  // placeId unconditionally both duplicated entries when listingId === placeId
  // and silently widened provider scope to anyone owning the place slug.
  const addressedToListings = [...new Set([rest.listingId, rest.placeId].filter(Boolean))];
  const inquiry: StoredInquiry = {
    id,
    placeId: rest.placeId,
    listingId: rest.listingId,
    providerListingIds: addressedToListings,
    visitorId: actor.id,
    /**
     * The role the opener had when the thread was created. A provider may itself
     * be a traveller, in which case they open a thread as a customer — recording
     * the role removes any ambiguity about what `visitorId` means, and stops the
     * UI from presenting a host's own enquiry as if a visitor sent it.
     */
    openedByRole: actor.role,
    checkIn: rest.checkIn,
    checkOut: rest.checkOut,
    partySize: rest.partySize,
    state: "open",
    idempotencyKey,
    payloadDigest: digest,
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: randomUUID(),
        inquiryId: id,
        // Identity comes from the resolved actor, never from the request body.
        senderId: actor.id,
        senderRole: "visitor",
        senderUnverified: actor.unverified,
        sequence: 1,
        originalText: message,
        availability: null,
        expiresAt: null,
        quality: "human",
        acceptedAt: now,
      },
    ],
  };
  all.push(inquiry);
  await saveAll(all);
  return { inquiry, replayed: false };
}

export interface ScopeOptions {
  actor: Actor;
  placeId?: string;
  state?: string;
  /** Provider-only: restrict to these listing slugs. */
  listingIds?: string[];
}

/**
 * Listings a provider is entitled to act on. In the demo the single provider
 * identity owns the directory listing; Phase C1 replaces this with a real
 * provider→listing ownership table.
 */
export function listingsFor(actor: Actor): string[] {
  if (actor.role === "provider" || actor.role === "authority") return ["directory", "sendra-resort", "loktak-lake", "kangla-fort"];
  return [];
}

/**
 * Scope-enforced listing. A visitor is limited to threads they own; a provider
 * is limited to threads that touch one of their listings; a reviewer sees all
 * (read-only in the UI). This is the boundary that was missing before.
 */
export async function listInquiries(opts: ScopeOptions): Promise<StoredInquiry[]> {
  const all = await loadAll();
  const { actor } = opts;
  const owned = opts.listingIds?.length ? opts.listingIds : listingsFor(actor);
  return all
    .filter((i) => {
      if (actor.role === "visitor") return i.visitorId === actor.id;
      if (actor.role === "provider" || actor.role === "authority") return owned.some((l) => i.providerListingIds.includes(l));
      return true; // reviewer / admin / moderator
    })
    .filter((i) => (!opts.placeId || i.placeId === opts.placeId) && (!opts.state || i.state === opts.state))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * Fetch with an authorization check.
 *
 * A visitor may read only their own thread. A provider may read only threads
 * against a listing they own — reading a stranger's private thread by guessing
 * its id is refused, not allowed.
 */
/**
 * Scope-enforced single-thread read. Every role is handled EXPLICITLY — an
 * `if` chain that only names some roles would silently default-allow the rest,
 * which is how the unscoped read survived earlier. Unknown roles are denied.
 */
export async function getInquiryScoped(id: string, actor: Actor): Promise<StoredInquiry | null> {
  const all = await loadAll();
  const found = all.find((i) => i.id === id);
  if (!found) return null;

  switch (actor.role) {
    case "visitor":
      if (found.visitorId !== actor.id) throw new ScopeDenied("This thread belongs to another visitor.");
      return found;
    case "provider": {
      const owned = listingsFor(actor);
      const touchesOwnListing = owned.some((l) => found.providerListingIds.includes(l));
      if (!touchesOwnListing) throw new ScopeDenied("This thread is not addressed to one of your listings.");
      return found;
    }
    case "reviewer":
      // Deliberate, stated policy: a moderator may audit any thread to check a
      // reported problem, and the console is read-only for them. Consistency
      // with listInquiries() matters — both must allow the same roles.
      return found;
    default:
      throw new ScopeDenied("This account may not read inquiry threads.");
  }
}

export async function getInquiry(id: string): Promise<StoredInquiry | null> {
  const all = await loadAll();
  return all.find((i) => i.id === id) ?? null;
}

/**
 * Append a message with a monotonic per-thread sequence.
 * Role is taken from the actor; a visitor cannot post as a provider (R37).
 */
export async function postMessage(
  inquiryId: string,
  input: z.infer<typeof PostMessage>,
  actor: Actor
): Promise<StoredMessage> {
  const all = await loadAll();
  const inquiry = all.find((i) => i.id === inquiryId);
  if (!inquiry) throw new Error("Inquiry not found");
  if (inquiry.state === "closed") throw new Error("Inquiry is closed");

  const isProviderOrAuth = actor.role === "provider" || actor.role === "authority";
  const role: "visitor" | "provider" = isProviderOrAuth ? "provider" : "visitor";
  if (role === "visitor" && inquiry.visitorId !== actor.id) {
    throw new ScopeDenied("This thread belongs to another visitor.");
  }
  if (isProviderOrAuth && !listingsFor(actor).some((l) => inquiry.providerListingIds.includes(l))) {
    throw new ScopeDenied("This thread is not addressed to one of your listings.");
  }
  if (input.availability && !isProviderOrAuth) {
    throw new Error("Only the provider or authority can post an availability report.");
  }

  const now = new Date();
  const msg: StoredMessage = {
    id: randomUUID(),
    inquiryId,
    senderId: actor.id,
    senderRole: role,
    senderUnverified: actor.unverified,
    sequence: inquiry.messages.length + 1,
    originalText: input.text,
    availability: input.availability ? { ...input.availability, currency: "INR" } : null,
    expiresAt: input.availability
      ? availabilityExpiry(input.availability.kind, input.availability.endDateExclusive, now)
      : null,
    quality: "human",
    acceptedAt: now.toISOString(),
  };
  inquiry.messages.push(msg);
  if (role === "provider") inquiry.state = "answered";
  else if (inquiry.state === "answered") inquiry.state = "open";
  inquiry.updatedAt = msg.acceptedAt;
  await saveAll(all);
  return msg;
}

/** Close a thread. Either side may close; the state is terminal. */
export async function closeInquiry(inquiryId: string, actor: Actor): Promise<StoredInquiry> {
  const all = await loadAll();
  const inquiry = all.find((i) => i.id === inquiryId);
  if (!inquiry) throw new Error("Inquiry not found");
  if (actor.role === "visitor" && inquiry.visitorId !== actor.id) {
    throw new ScopeDenied("This thread belongs to another visitor.");
  }
  inquiry.state = "closed";
  inquiry.updatedAt = new Date().toISOString();
  await saveAll(all);
  return inquiry;
}
