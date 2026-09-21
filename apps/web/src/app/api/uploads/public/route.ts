import { listApprovedUploads } from "@/lib/uploadStore";

export const runtime = "nodejs";

// GET /api/uploads/public?placeId= — the consumer side of the moderation loop.
//
// GAP FIXED: approved uploads previously had no public read path, so the whole
// upload → review → display cycle dead-ended in the reviewer console.
// Only moderation === "approved" records are ever returned here.
export async function GET(request: Request) {
  const placeId = new URL(request.url).searchParams.get("placeId") ?? undefined;
  const uploads = await listApprovedUploads(placeId);
  return Response.json({
    photos: uploads.map((u) => ({
      id: u.id,
      placeId: u.placeId,
      url: `/api/uploads/${u.id}/raw`,
      caption: u.caption,
      attribution: u.attribution,
      license: u.license,
      approvedAt: u.reviewedAt,
      origin: "approved-upload" as const,
    })),
    note: "Contributor photos that passed review. Attribution and license are shown alongside each photo.",
  });
}
