// Upload store — server-only, file-backed so approved media survives restarts.
//
// GAP FIXED: the store was a module-level array, so every approved photo was
// lost on reload and `places/[id]` had no way to show moderated contributions.
// Quarantine bytes stay in gitignored .uploads/quarantine; records go to
// .data/uploads.json. Records are never public until moderation === "approved".

import { promises as fs } from "node:fs";
import path from "node:path";

export type Moderation = "pending" | "approved" | "rejected";

export interface UploadRecord {
  id: string;
  placeId: string;
  caption: string;
  attribution: string;
  license: string;
  ownershipAffirmed: boolean;
  moderation: Moderation;
  reviewedBy: string | null;
  reviewedAt: string | null;
  /** Decision must carry a reason when rejected (R41). */
  reviewNote: string | null;
  digest: string;
  /** Original filename is NOT stored — only the derived, non-identifying id. */
  ext: string;
  createdAt: string;
}

const DATA_FILE = path.join(process.cwd(), ".data", "uploads.json");

async function loadAll(): Promise<UploadRecord[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as UploadRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAll(all: UploadRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(all, null, 2), "utf8");
}

export async function listUploads(): Promise<UploadRecord[]> {
  const all = await loadAll();
  return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Public surface: approved records only, newest first. */
export async function listApprovedUploads(placeId?: string): Promise<UploadRecord[]> {
  const all = await loadAll();
  return all
    .filter((u) => u.moderation === "approved" && (!placeId || u.placeId === placeId))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function addUpload(r: UploadRecord): Promise<void> {
  const all = await loadAll();
  all.push(r);
  await saveAll(all);
}

export async function setModeration(
  id: string,
  decision: "approved" | "rejected",
  reviewer: string,
  note: string | null
): Promise<UploadRecord | null> {
  const all = await loadAll();
  const rec = all.find((u) => u.id === id);
  if (!rec) return null;
  // A decision is final for this record; re-deciding would destroy the audit trail.
  if (rec.moderation !== "pending") return rec;
  rec.moderation = decision;
  rec.reviewedBy = reviewer;
  rec.reviewedAt = new Date().toISOString();
  rec.reviewNote = note;
  await saveAll(all);
  return rec;
}

/** Public URL for an approved asset. Unapproved ids resolve to null. */
export async function publicMediaUrl(id: string): Promise<string | null> {
  const all = await loadAll();
  const rec = all.find((u) => u.id === id);
  if (!rec || rec.moderation !== "approved") return null;
  return `/api/uploads/${rec.id}/raw`;
}

export async function getUpload(id: string): Promise<UploadRecord | null> {
  const all = await loadAll();
  return all.find((u) => u.id === id) ?? null;
}
