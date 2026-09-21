import { NextRequest } from "next/server";
import { getInquiryScoped, ScopeDenied } from "@/lib/inquiryStore";
import { resolveActor } from "@/lib/actors";

// GET /api/inquiries/[id] — full thread, originals first. Next 16: params is async.
// Scoped: fetching another visitor's thread is a 403, not a 200.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const actor = await resolveActor(request.nextUrl.searchParams.get("as"));
  try {
    const inquiry = await getInquiryScoped(id, actor);
    if (!inquiry) return Response.json({ error: "Inquiry not found" }, { status: 404 });
    return Response.json({ inquiry, scope: { role: actor.role, unverified: actor.unverified } });
  } catch (e) {
    if (e instanceof ScopeDenied) return Response.json({ error: e.message }, { status: 403 });
    throw e;
  }
}
