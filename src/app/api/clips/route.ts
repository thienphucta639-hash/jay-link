import { NextRequest, NextResponse } from "next/server";
import { store } from "@/db/memory";

function isValidTikTokUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    const h = url.hostname.toLowerCase();
    return ["tiktok.com","www.tiktok.com","m.tiktok.com","vm.tiktok.com","vt.tiktok.com"].includes(h);
  } catch { return false; }
}

function cleanUrl(input: string): string {
  try { const u = new URL(input.trim()); return `${u.origin}${u.pathname}`; }
  catch { return input.trim(); }
}

export async function GET(req: NextRequest) {
  const s = store();
  const url = req.nextUrl;
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const colId = url.searchParams.get("collection_id");
  const saveReason = url.searchParams.get("save_reason");
  const watchStatus = url.searchParams.get("watch_status");
  const pinnedOnly = url.searchParams.get("pinned") === "true";
  const dateFrom = url.searchParams.get("date_from");
  const tagFilter = (url.searchParams.get("tag") || "").toLowerCase();
  const creatorFilter = (url.searchParams.get("creator") || "").toLowerCase();
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let filtered = [...s.clips];

  if (q) filtered = filtered.filter(c =>
    (c.customTitle || "").toLowerCase().includes(q) ||
    (c.note || "").toLowerCase().includes(q) ||
    (c.creatorHandle || "").toLowerCase().includes(q) ||
    (c.creatorName || "").toLowerCase().includes(q)
  );
  if (colId && !isNaN(parseInt(colId))) filtered = filtered.filter(c => c.collectionId === parseInt(colId));
  if (saveReason) filtered = filtered.filter(c => c.saveReason === saveReason);
  if (watchStatus) filtered = filtered.filter(c => c.watchStatus === watchStatus);
  if (pinnedOnly) filtered = filtered.filter(c => c.isPinned);
  if (dateFrom) { const d = new Date(dateFrom).getTime(); filtered = filtered.filter(c => new Date(c.savedAt).getTime() >= d); }
  if (creatorFilter) filtered = filtered.filter(c => (c.creatorHandle || "").toLowerCase().includes(creatorFilter) || (c.creatorName || "").toLowerCase().includes(creatorFilter));
  if (tagFilter) filtered = filtered.filter(c => c.tags.some(t => t.toLowerCase().includes(tagFilter)));

  // Sort: pinned first, then by date
  filtered.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
  });

  const total = filtered.length;
  const paged = filtered.slice(offset, offset + limit);

  return NextResponse.json({ clips: paged, total });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const sourceUrl = body.sourceUrl;
  if (!sourceUrl || typeof sourceUrl !== "string" || !isValidTikTokUrl(sourceUrl)) {
    return NextResponse.json({ error: "Link không phải TikTok" }, { status: 400 });
  }

  const clean = cleanUrl(sourceUrl);
  const s = store();

  // Duplicate check
  if (s.clips.some(c => c.sourceUrl === clean)) {
    return NextResponse.json({ error: "duplicate", message: "Clip này đã có trong kho rồi!" }, { status: 409 });
  }

  const str = (v: unknown): string | null => v != null && typeof v === "string" && v.trim() ? v.trim() : null;

  let colId: number | null = null;
  const raw = body.collectionId;
  if (raw != null && raw !== "" && raw !== false) {
    const n = typeof raw === "number" ? raw : parseInt(String(raw));
    if (!isNaN(n) && n > 0) colId = n;
  }

  // Resolve tag names
  const tagNames: string[] = [];
  const tagIds = body.tagIds;
  if (tagIds && Array.isArray(tagIds)) {
    for (const id of tagIds) {
      const tag = s.tags.find(t => t.id === Number(id));
      if (tag) tagNames.push(tag.name);
    }
  }

  const clip = {
    id: s.nextId.clip++,
    sourceUrl: clean,
    creatorName: str(body.creatorName),
    creatorHandle: str(body.creatorHandle),
    previewImage: str(body.previewImage),
    customTitle: str(body.customTitle),
    note: str(body.note),
    saveReason: str(body.saveReason),
    watchStatus: "unreviewed",
    isPinned: false,
    savedAt: new Date().toISOString(),
    lastOpenedAt: null,
    openCount: 0,
    collectionId: colId,
    tags: tagNames,
  };

  s.clips.push(clip);

  return NextResponse.json({ clip }, { status: 201 });
}
