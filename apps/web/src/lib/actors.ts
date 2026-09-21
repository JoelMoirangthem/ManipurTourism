// Actors — server-only. THE ONLY source of senderId / reviewer identity (R37/R38).
//
// GAP FIXED: identity previously arrived in the request body, so any client could
// post as "provider-demo" or approve its own upload. Request bodies are now
// untrusted input; the actor is derived here and nowhere else.
//
// This is a DEV shim, not authentication. It reads a single self-asserted cookie
// so the demo can exercise both surfaces in one browser. Phase C1 replaces
// `resolveActor` with a real session lookup; every call site stays unchanged.

import { cookies } from "next/headers";

export type Role = "visitor" | "authority" | "admin" | "provider" | "reviewer";

export interface Actor {
  id: string;
  role: Role;
  displayName: string;
  /** True while identity is self-asserted. Surfaces must show this (ADR-11). */
  unverified: boolean;
}

export const ACTOR_COOKIE = "mt_actor";

const KNOWN: Record<string, Omit<Actor, "unverified">> = {
  "visitor-demo": { id: "visitor-demo", role: "visitor", displayName: "Visitor (demo)" },
  "authority-demo": { id: "authority-demo", role: "authority", displayName: "Local Authority (demo)" },
  "provider-demo": { id: "provider-demo", role: "authority", displayName: "Local Authority (Sendra Host demo)" },
  "admin-demo": { id: "admin-demo", role: "admin", displayName: "Admin Moderator (demo)" },
  "reviewer-demo": { id: "reviewer-demo", role: "admin", displayName: "Admin Moderator (demo)" },
};

/**
 * Resolve the acting identity. Precedence:
 *   1. `?as=` query override (dev only, gated by MT_ALLOW_ROLE_SWITCH)
 *   2. the mt_actor cookie
 *   3. anonymous visitor
 * Never throws — an unknown value degrades to the anonymous visitor, because
 * default-deny means "least privilege", not "crash".
 */
export async function resolveActor(override?: string | null): Promise<Actor> {
  const allowSwitch = process.env.MT_ALLOW_ROLE_SWITCH !== "false";
  let id: string | null = null;

  if (allowSwitch && override) {
    id = override;
  } else {
    const jar = await cookies();
    id = jar.get(ACTOR_COOKIE)?.value ?? null;
  }

  if (id && KNOWN[id]) return { ...KNOWN[id], unverified: true };
  return { id: "visitor-anon", role: "visitor", displayName: "Visitor", unverified: true };
}

/** Throws a Response-shaped error when the role is insufficient. */
export function requireRole(actor: Actor, ...allowed: Role[]): void {
  const norm = (r: Role) => (r === "reviewer" ? "admin" : r === "provider" ? "authority" : r);
  const normalizedActorRole = norm(actor.role);
  const normalizedAllowed = allowed.map(norm);
  if (!normalizedAllowed.includes(normalizedActorRole)) {
    throw new ForbiddenError(actor, allowed);
  }
}

export class ForbiddenError extends Error {
  constructor(readonly actor: Actor, readonly allowed: Role[]) {
    super(`Role '${actor.role}' may not perform this action (requires: ${allowed.join(", ")}).`);
  }
}

export function forbiddenResponse(err: ForbiddenError): Response {
  return Response.json(
    {
      error: err.message,
      hint: "This surface is scoped to its owner. In production this is a session check; in the demo, set the mt_actor cookie.",
    },
    { status: 403 }
  );
}
