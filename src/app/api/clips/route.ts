import { NextRequest, NextResponse } from "next/server";
import { withRetry, rawQuery, extractError } from "@/db";
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

interface ClipRow {
  id: number;
  source_url: string;
  creator_name: string | null;
  creator_handle: string | null;
  preview_image: string | null;
  custom_title: string | null;
  note: string | null;
  save_reason: string | null;
  watch_status: string;
  is_pinned: boolean;
  saved_at: string;
  last_opened_at: string | null;
  open_count: number;
  collection_id: number | null;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 }); }

  const sourceUrl = body.sourceUrl;
  if (!sourceUrl || typeof sourceUrl !== "string" || !sourceUrl.trim())
    return NextResponse.json({ error: "Link is required" }, { status: 400 });

  // Clean URL — remove tracking params
  let cleanUrl = String(sourceUrl).trim();
  try { const parsed = new URL(cleanUrl); cleanUrl = `${parsed.origin}${parsed.pathname}`; } catch {}

  // Parse optional fields
  const str = (v: unknown): string | null => v != null && typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
  let colId: number | null = null;
  const rawCol = body.collectionId;
  if (rawCol != null && rawCol !== "" && rawCol !== false) {
    const n = typeof rawCol === "number" ? rawCol : parseInt(String(rawCol));
    if (!isNaN(n) && n > 0) colId = n;
  }

  try {
    // Use RAW SQL — bypass Drizzle completely for reliability
    
    // 1. Check duplicate
    const existing = await rawQuery<{ id: number }>(
      "SELECT id FROM clips WHERE source_url = $1 LIMIT 1",
      [cleanUrl]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "duplicate", message: "Clip này đã có trong kho rồi!" },
        { status: 409 }
      );
    }

    // 2. Insert clip
    const inserted = await rawQuery<ClipRow>(
      `INSERT INTO clips (source_url, creator_name, creator_handle, preview_image, custom_title, note, save_reason, collection_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        cleanUrl,
        str(body.creatorName),
        str(body.creatorHandle),
        str(body.previewImage),
        str(body.customTitle),
        str(body.note),
        str(body.saveReason),
        colId,
      ]
    );

    if (inserted.length === 0) {
      return NextResponse.json({ error: "Insert thất bại" }, { status: 500 });
    }

    const newClip = inserted[0];

    // 3. Insert tags
    const tagIds = body.tagIds;
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      const valid = tagIds.map((id: unknown) => Number(id)).filter((n: number) => !isNaN(n) && n > 0);
      for (const tagId of valid) {
        await rawQuery(
          "INSERT INTO clip_tags (clip_id, tag_id) VALUES ($1, $2)",
          [newClip.id, tagId]
        );
      }
    }

    return NextResponse.json({
      clip: {
        id: newClip.id,
        sourceUrl: newClip.source_url,
        creatorName: newClip.creator_name,
        creatorHandle: newClip.creator_handle,
        previewImage: newClip.preview_image,
        customTitle: newClip.custom_title,
        note: newClip.note,
        saveReason: newClip.save_reason,
        watchStatus: newClip.watch_status,
        isPinned: newClip.is_pinned,
        savedAt: newClip.saved_at,
        lastOpenedAt: newClip.last_opened_at,
        openCount: newClip.open_count,
        collectionId: newClip.collection_id,
      },
    }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/clips raw error:", err);
    const detail = extractError(err);
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
