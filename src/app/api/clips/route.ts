import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clips, clipTags, tags } from "@/db/schema";
import { eq, desc, ilike, or, sql, and, gte, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
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

    if (q) {
      conditions.push(
        or(
          ilike(clips.customTitle, `%${q}%`),
          ilike(clips.note, `%${q}%`),
          ilike(clips.creatorHandle, `%${q}%`),
          ilike(clips.creatorName, `%${q}%`)
        )
      );
    }
    if (collectionId && !isNaN(parseInt(collectionId))) {
      conditions.push(eq(clips.collectionId, parseInt(collectionId)));
    }
    if (saveReason) conditions.push(eq(clips.saveReason, saveReason));
    if (watchStatus) conditions.push(eq(clips.watchStatus, watchStatus));
    if (pinnedOnly) conditions.push(eq(clips.isPinned, true));
    if (dateFrom) conditions.push(gte(clips.savedAt, new Date(dateFrom)));
    if (dateTo) {
      const to = new Date(dateTo);
      to.setDate(to.getDate() + 1);
      conditions.push(sql`${clips.savedAt} < ${to}`);
    }
    if (creatorFilter) {
      conditions.push(
        or(
          ilike(clips.creatorHandle, `%${creatorFilter}%`),
          ilike(clips.creatorName, `%${creatorFilter}%`)
        )
      );
    }
    if (tagFilter) {
      const tagRows = await db
        .select({ clipId: clipTags.clipId })
        .from(clipTags)
        .innerJoin(tags, eq(tags.id, clipTags.tagId))
        .where(ilike(tags.name, `%${tagFilter}%`));
      const ids = tagRows.map((r) => r.clipId);
      if (ids.length === 0) return NextResponse.json({ clips: [], total: 0 });
      conditions.push(inArray(clips.id, ids));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const order =
      sortBy === "open_count"
        ? desc(clips.openCount)
        : sortBy === "last_opened"
          ? desc(clips.lastOpenedAt)
          : desc(clips.savedAt);

    const [result, countResult] = await Promise.all([
      db.select().from(clips).where(where).orderBy(desc(clips.isPinned), order).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(clips).where(where),
    ]);

    const clipIds = result.map((c) => c.id);
    const map: Record<number, string[]> = {};
    if (clipIds.length > 0) {
      const rows = await db
        .select({ clipId: clipTags.clipId, tagName: tags.name })
        .from(clipTags)
        .innerJoin(tags, eq(tags.id, clipTags.tagId))
        .where(inArray(clipTags.clipId, clipIds));
      for (const r of rows) {
        if (!map[r.clipId]) map[r.clipId] = [];
        map[r.clipId].push(r.tagName);
      }
    }

    return NextResponse.json({
      clips: result.map((c) => ({ ...c, tags: map[c.id] || [] })),
      total: countResult[0]?.count || 0,
    });
  } catch (err) {
    console.error("GET /api/clips error:", err);
    return NextResponse.json({ clips: [], total: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceUrl, customTitle, creatorHandle, creatorName, previewImage, note, saveReason, collectionId, tagIds } = body;

    if (!sourceUrl || typeof sourceUrl !== "string" || !sourceUrl.trim()) {
      return NextResponse.json({ error: "Link is required" }, { status: 400 });
    }

    const url = sourceUrl.trim();

    // Duplicate check
    const existing = await db.select().from(clips).where(eq(clips.sourceUrl, url)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "duplicate", existingClip: existing[0], message: "Clip này đã có trong kho rồi!" }, { status: 409 });
    }

    // Safe parse collectionId
    let colId: number | null = null;
    if (collectionId != null && collectionId !== "" && collectionId !== false) {
      const n = typeof collectionId === "number" ? collectionId : parseInt(String(collectionId));
      if (!isNaN(n) && n > 0) colId = n;
    }

    const s = (v: unknown) => (v && typeof v === "string" && v.trim() ? v.trim() : null);

    const [newClip] = await db
      .insert(clips)
      .values({
        sourceUrl: url,
        creatorName: s(creatorName),
        creatorHandle: s(creatorHandle),
        previewImage: s(previewImage),
        customTitle: s(customTitle),
        note: s(note),
        saveReason: s(saveReason),
        collectionId: colId,
      })
      .returning();

    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      const valid = tagIds.map((id: unknown) => Number(id)).filter((n) => !isNaN(n) && n > 0);
      if (valid.length > 0) {
        await db.insert(clipTags).values(valid.map((tagId) => ({ clipId: newClip.id, tagId })));
      }
    }

    return NextResponse.json({ clip: newClip }, { status: 201 });
  } catch (err) {
    console.error("POST /api/clips error:", err);
    return NextResponse.json({ error: "Lỗi server khi lưu clip" }, { status: 500 });
  }
}
