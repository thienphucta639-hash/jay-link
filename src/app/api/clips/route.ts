import { NextRequest, NextResponse } from "next/server";
import { withRetry } from "@/db";
import { clips, clipTags, tags } from "@/db/schema";
import { eq, desc, ilike, or, sql, and, gte, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    return await withRetry(async (db) => {
      const url = req.nextUrl;
      const q = url.searchParams.get("q") || "";
      const collectionId = url.searchParams.get("collection_id");
      const saveReason = url.searchParams.get("save_reason");
      const watchStatus = url.searchParams.get("watch_status");
      const pinnedOnly = url.searchParams.get("pinned") === "true";
      const sortBy = url.searchParams.get("sort") || "saved_at";
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");
      const tagFilter = url.searchParams.get("tag");
      const creatorFilter = url.searchParams.get("creator");
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");

      const conditions = [];
      if (q) conditions.push(or(ilike(clips.customTitle, `%${q}%`), ilike(clips.note, `%${q}%`), ilike(clips.creatorHandle, `%${q}%`), ilike(clips.creatorName, `%${q}%`)));
      if (collectionId && !isNaN(parseInt(collectionId))) conditions.push(eq(clips.collectionId, parseInt(collectionId)));
      if (saveReason) conditions.push(eq(clips.saveReason, saveReason));
      if (watchStatus) conditions.push(eq(clips.watchStatus, watchStatus));
      if (pinnedOnly) conditions.push(eq(clips.isPinned, true));
      if (dateFrom) conditions.push(gte(clips.savedAt, new Date(dateFrom)));
      if (dateTo) { const to = new Date(dateTo); to.setDate(to.getDate() + 1); conditions.push(sql`${clips.savedAt} < ${to}`); }
      if (creatorFilter) conditions.push(or(ilike(clips.creatorHandle, `%${creatorFilter}%`), ilike(clips.creatorName, `%${creatorFilter}%`)));
      if (tagFilter) {
        const tagRows = await db.select({ clipId: clipTags.clipId }).from(clipTags).innerJoin(tags, eq(tags.id, clipTags.tagId)).where(ilike(tags.name, `%${tagFilter}%`));
        const ids = tagRows.map((r: { clipId: number }) => r.clipId);
        if (ids.length === 0) return NextResponse.json({ clips: [], total: 0 });
        conditions.push(inArray(clips.id, ids));
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const order = sortBy === "open_count" ? desc(clips.openCount) : sortBy === "last_opened" ? desc(clips.lastOpenedAt) : desc(clips.savedAt);

      const [result, countResult] = await Promise.all([
        db.select().from(clips).where(where).orderBy(desc(clips.isPinned), order).limit(limit).offset(offset),
        db.select({ count: sql<number>`count(*)::int` }).from(clips).where(where),
      ]);
      const clipIds = result.map((c: { id: number }) => c.id);
      const map: Record<number, string[]> = {};
      if (clipIds.length > 0) {
        const rows = await db.select({ clipId: clipTags.clipId, tagName: tags.name }).from(clipTags).innerJoin(tags, eq(tags.id, clipTags.tagId)).where(inArray(clipTags.clipId, clipIds));
        for (const r of rows) { if (!map[r.clipId]) map[r.clipId] = []; map[r.clipId].push(r.tagName); }
      }
      return NextResponse.json({ clips: result.map((c: { id: number }) => ({ ...c, tags: map[c.id] || [] })), total: countResult[0]?.count || 0 });
    });
  } catch (err) { console.error("GET /api/clips:", err); return NextResponse.json({ clips: [], total: 0 }); }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 }); }

  const sourceUrl = body.sourceUrl;
  if (!sourceUrl || typeof sourceUrl !== "string" || !sourceUrl.trim()) return NextResponse.json({ error: "Link is required" }, { status: 400 });

  let cleanUrl = String(sourceUrl).trim();
  try { const parsed = new URL(cleanUrl); cleanUrl = `${parsed.origin}${parsed.pathname}`; } catch {}

  try {
    return await withRetry(async (db) => {
      const existing = await db.select({ id: clips.id }).from(clips).where(eq(clips.sourceUrl, cleanUrl)).limit(1);
      if (existing.length > 0) return NextResponse.json({ error: "duplicate", message: "Clip này đã có trong kho rồi!" }, { status: 409 });

      let colId: number | null = null;
      const raw = body.collectionId;
      if (raw != null && raw !== "" && raw !== false) { const n = typeof raw === "number" ? raw : parseInt(String(raw)); if (!isNaN(n) && n > 0) colId = n; }

      const s = (v: unknown): string | null => v != null && typeof v === "string" && v.trim().length > 0 ? v.trim() : null;

      const [newClip] = await db.insert(clips).values({
        sourceUrl: cleanUrl, creatorName: s(body.creatorName), creatorHandle: s(body.creatorHandle),
        previewImage: s(body.previewImage), customTitle: s(body.customTitle), note: s(body.note),
        saveReason: s(body.saveReason), collectionId: colId,
      }).returning();

      const tagIds = body.tagIds;
      if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
        const valid = tagIds.map((id: unknown) => Number(id)).filter((n: number) => !isNaN(n) && n > 0);
        if (valid.length > 0) await db.insert(clipTags).values(valid.map((tagId: number) => ({ clipId: newClip.id, tagId })));
      }
      return NextResponse.json({ clip: newClip }, { status: 201 });
    });
  } catch (err: unknown) {
    console.error("POST /api/clips:", err);
    let detail = "Lỗi không xác định";
    if (err instanceof Error) {
      const pgErr = err as Error & { code?: string };
      detail = pgErr.code ? `[${pgErr.code}] ${err.message}` : err.message;
    }
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
