import { z } from "zod";
import { NextRequest } from "next/server";
import { getUpload, setModeration } from "@/lib/uploadStore";
import { forbiddenResponse, ForbiddenError, requireRole, resolveActor } from "@/lib/actors";

export const runtime = "nodejs";

const Body = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().max(280).nullable().default(null),
});

// PATCH /api/uploads/[id] — reviewer decision. The reviewer identity comes from
// the resolved actor. A `reviewer` field in the body is no longer honoured:
// that was a forged-audit-trail hole.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}) as unknown);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return Response.json({ error: "decision must be approved|rejected" }, { status: 400 });

  try {
    const actor = await resolveActor(request.nextUrl.searchParams.get("as"));
    requireRole(actor, "reviewer");
    const existing = await getUpload(id);
    if (!existing) return Response.json({ error: "Upload not found" }, { status: 404 });
    if (existing.moderation !== "pending") {
      return Response.json(
        { error: `Already ${existing.moderation} by ${existing.reviewedBy}. Decisions are final for audit purposes.` },
        { status: 409 }
      );
    }
    if (parsed.data.decision === "rejected" && !parsed.data.note?.trim()) {
      return Response.json({ error: "A rejection must record a reason." }, { status: 400 });
    }
    const rec = await setModeration(id, parsed.data.decision, actor.id, parsed.data.note);
    return Response.json({ upload: rec, decidedBy: { id: actor.id, unverified: actor.unverified } });
  } catch (e) {
    if (e instanceof ForbiddenError) return forbiddenResponse(e);
    throw e;
  }
}
