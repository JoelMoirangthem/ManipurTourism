import { NextRequest } from "next/server";
import { PostMessage, ScopeDenied, postMessage } from "@/lib/inquiryStore";
import { resolveActor } from "@/lib/actors";

// POST /api/inquiries/[id]/messages — visitor follow-up or provider reply.
// senderId and senderRole are derived from the resolved actor; a request body
// claiming senderRole "provider" from a visitor session is ignored, not trusted.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = PostMessage.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid message", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const actor = await resolveActor(request.nextUrl.searchParams.get("as"));
    const message = await postMessage(id, parsed.data, actor);
    return Response.json(
      {
        message,
        note: message.availability
          ? "Host-reported for the stated dates only, expiring — not a reservation."
          : undefined,
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof ScopeDenied) return Response.json({ error: e.message }, { status: 403 });
    const msg = e instanceof Error ? e.message : "Failed";
    const status =
      msg === "Inquiry not found" ? 404
        : msg === "Inquiry is closed" ? 410
          : msg.startsWith("Only the provider") ? 403
            : 400;
    return Response.json({ error: msg }, { status });
  }
}
