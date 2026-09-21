import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { addUpload, listUploads, type UploadRecord } from "@/lib/uploadStore";
import { requireRole, resolveActor } from "@/lib/actors";
import { seedRetriever } from "@/lib/adapters";

export const runtime = "nodejs";

const QUARANTINE = path.join(process.cwd(), ".uploads", "quarantine");
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

// GET /api/uploads — moderation queue. Reviewer-scoped: a visitor cannot read
// other people's submissions, so the queue is gated rather than open.
export async function GET(request: NextRequest) {
  const actor = await resolveActor(request.nextUrl.searchParams.get("as"));
  if (actor.role !== "reviewer") {
    return Response.json(
      { uploads: [], note: "Moderation queue is reviewer-only. Set the mt_actor cookie to a reviewer to inspect it." },
      { status: 200 }
    );
  }
  return Response.json({ uploads: await listUploads(), scope: { role: actor.role, unverified: actor.unverified } });
}

// POST /api/uploads — multipart: placeId, caption, attribution, license,
// ownershipAffirmed=on, file. Saved to gitignored quarantine, never public.
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ error: "multipart form required" }, { status: 400 });

  const placeId = String(form.get("placeId") ?? "");
  const caption = String(form.get("caption") ?? "").slice(0, 280);
  const attribution = String(form.get("attribution") ?? "").slice(0, 120);
  const license = String(form.get("license") ?? "").slice(0, 120);
  const ownershipAffirmed = form.get("ownershipAffirmed") === "on" || form.get("ownershipAffirmed") === "true";
  const file = form.get("file");

  if (!placeId || !caption || !attribution || !license) {
    return Response.json({ error: "placeId, caption, attribution and license are required" }, { status: 400 });
  }
  // An upload must target a place that exists, or the approved photo has no page.
  const place = await seedRetriever.getPlace(placeId);
  if (!place) return Response.json({ error: `Unknown placeId '${placeId}'.` }, { status: 400 });
  if (!ownershipAffirmed) {
    return Response.json({ error: "Confirm you own the photo or have permission to share it." }, { status: 400 });
  }
  if (!(file instanceof File)) return Response.json({ error: "file is required" }, { status: 400 });
  if (!ALLOWED.has(file.type)) return Response.json({ error: "Only JPEG/PNG/WebP accepted." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "File exceeds 5 MB." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const digest = createHash("sha256").update(bytes).digest("hex");
  await fs.mkdir(QUARANTINE, { recursive: true });
  const id = randomUUID();
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  await fs.writeFile(path.join(QUARANTINE, `${id}.${ext}`), bytes);

  const actor = await resolveActor(request.nextUrl.searchParams.get("as"));
  requireRole(actor, "visitor", "reviewer");

  const record: UploadRecord = {
    id,
    placeId,
    caption,
    attribution,
    license,
    ownershipAffirmed,
    moderation: "pending",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    digest,
    ext,
    createdAt: new Date().toISOString(),
  };
  await addUpload(record);
  return Response.json({
    upload: record,
    submittedBy: { id: actor.id, unverified: actor.unverified },
    note: "Quarantined — pending reviewer approval. Never shown publicly until approved. EXIF must be stripped before S3 promotion (Phase 1).",
  });
}
