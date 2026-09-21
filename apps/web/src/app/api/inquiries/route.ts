import { NextRequest } from "next/server";
import { CreateInquiry, IdempotencyConflict, createInquiry, listInquiries } from "@/lib/inquiryStore";
import { forbiddenResponse, ForbiddenError, resolveActor } from "@/lib/actors";

// GET /api/inquiries?placeId=&state=&as=
// Scope-enforced: a visitor sees only their own threads, a provider only threads
// against their listings, a reviewer all. Previously this returned everything.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const actor = await resolveActor(url.searchParams.get("as"));
  const inquiries = await listInquiries({
    actor,
    placeId: url.searchParams.get("placeId") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
  });
  return Response.json({
    scope: { actorId: actor.id, role: actor.role, unverified: actor.unverified },
    inquiries: inquiries.map((i) => ({
      id: i.id,
      placeId: i.placeId,
      partySize: i.partySize,
      checkIn: i.checkIn,
      checkOut: i.checkOut,
      state: i.state,
      messageCount: i.messages.length,
      updatedAt: i.updatedAt,
      // A provider needs to know whether the last word was theirs.
      awaitingProvider: i.messages.at(-1)?.senderRole === "visitor",
    })),
  });
}

// POST /api/inquiries — idempotent create (409 on same key + different payload).
// visitorId is taken from the resolved actor, never from the body.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreateInquiry.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid inquiry", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const actor = await resolveActor(new URL(request.url).searchParams.get("as"));
    const { inquiry, replayed } = await createInquiry(parsed.data, actor);
    return Response.json(
      {
        inquiry,
        replayed,
        note: "Sent to service — not read. Host replies are host-reported, never reservations.",
      },
      { status: replayed ? 200 : 201 }
    );
  } catch (e) {
    if (e instanceof IdempotencyConflict) return Response.json({ error: e.message }, { status: 409 });
    if (e instanceof ForbiddenError) return forbiddenResponse(e);
    throw e;
  }
}
