import { promises as fs } from "node:fs";
import path from "node:path";
import { getUpload, listApprovedUploads } from "@/lib/uploadStore";

export const runtime = "nodejs";

const QUARANTINE = path.join(process.cwd(), ".uploads", "quarantine");

// GET /api/uploads/[id]/raw — serves the bytes for LOCAL rendering.
//
// Security posture: this route only serves records whose moderation state is
// "approved". That is what replaced the "public" mirror, which had no bytes to
// serve. Unapproved ids 404, so quarantine is not reachable from the browser.
//
// Phase 1 replaces this with a signed object-storage URL after an EXIF-strip
// pass; the authorization rule (approved-only) stays identical.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rec = await getUpload(id);
  if (!rec || rec.moderation !== "approved") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const bytes = await fs.readFile(path.join(QUARANTINE, `${rec.id}.${rec.ext}`));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": rec.ext === "png" ? "image/png" : rec.ext === "webp" ? "image/webp" : "image/jpeg",
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return Response.json({ error: "Asset unavailable" }, { status: 410 });
  }
}

// Re-export for the collection route's convenience is intentionally avoided:
// the collection listing lives in ../route.ts so each URL owns one handler.
export const dynamic = "force-dynamic";
