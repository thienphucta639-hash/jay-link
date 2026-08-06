import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { clips, clipTags, tags } from "@/db/schema";
import { eq, desc, ilike, or, sql, and, gte, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!isDbAvailable()) {
    return NextResponse.json({ clips: [], total: 0, error: "Database not configured" });
  }

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

  if (collectionId) {
    conditions.push(eq(clips.collectionId, parseInt(collectionId)));
  }

  if (saveReason) {
    conditions.push(eq(clips.saveReason, saveReason));
  }

  if (watchStatus) {
    conditions.push(eq(clips.watchStatus, watchStatus));
  }

  if (pinnedOnly) {
    conditions.push(eq(clips.isPinned, true));
  }

  if (dateFrom) {
    conditions.push(gte(clips.savedAt, new Date(dateFrom)));
  }

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

  // If tag filter, find clip ids first
  let tagClipIds: number[] | null = null;
  if (tagFilter) {
    const tagRows = await db
      .select({ clipId: clipTags.clipId })
      .from(clipTags)
      .innerJoin(tags, eq(tags.id, clipTags.tagId))
      .where(ilike(tags.name, `%${tagFilter}%`));
    tagClipIds = tagRows.map((r) => r.clipId);
    if (tagClipIds.length === 0) {
      return NextResponse.json({ clips: [], total: 0 });
    }
    conditions.push(inArray(clips.id, tagClipIds));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let orderBy;
  switch (sortBy) {
    case "open_count":
      orderBy = desc(clips.openCount);
      break;
    case "last_opened":
      orderBy = desc(clips.lastOpenedAt);
      break;
    default:
      orderBy = desc(clips.savedAt);
  }

  const [result, countResult] = await Promise.all([
    db
      .select()
      .from(clips)
      .where(whereClause)
      .orderBy(desc(clips.isPinned), orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(clips)
      .where(whereClause),
  ]);

  // Get tags for each clip
  const clipIds = result.map((c) => c.id);
  const clipTagsMap: Record<number, string[]> = {};
  if (clipIds.length > 0) {
    const tagRows = await db
      .select({
        clipId: clipTags.clipId,
        tagName: tags.name,
      })
      .from(clipTags)
      .innerJoin(tags, eq(tags.id, clipTags.tagId))
      .where(inArray(clipTags.clipId, clipIds));

    for (const row of tagRows) {
      if (!clipTagsMap[row.clipId]) clipTagsMap[row.clipId] = [];
      clipTagsMap[row.clipId].push(row.tagName);
    }
  }

  const clipsWithTags = result.map((c) => ({
    ...c,
    tags: clipTagsMap[c.id] || [],
  }));

  return NextResponse.json({
    clips: clipsWithTags,
    total: countResult[0]?.count || 0,
  });
}

export async function POST(req: NextRequest) {
  if (!isDbAvailable()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json();
  const {
    sourceUrl,
    creatorName,
    creatorHandle,
    previewImage,
    customTitle,
    note,
    saveReason,
    collectionId,
    tagIds,
  } = body;

  if (!sourceUrl) {
    return NextResponse.json({ error: "Link is required" }, { status: 400 });
  }

  // Check duplicate
  const existing = await db
    .select()
    .from(clips)
    .where(eq(clips.sourceUrl, sourceUrl))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      {
        error: "duplicate",
        existingClip: existing[0],
        message: "Clip này đã có trong kho rồi!",
      },
      { status: 409 }
    );
  }

  const [newClip] = await db
    .insert(clips)
    .values({
      sourceUrl,
      creatorName: creatorName || null,
      creatorHandle: creatorHandle || null,
      previewImage: previewImage || null,
      customTitle: customTitle || null,
      note: note || null,
      saveReason: saveReason || null,
      collectionId: collectionId ? parseInt(collectionId) : null,
    })
    .returning();

  // Add tags
  if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
    const tagValues = tagIds.map((tagId: number) => ({
      clipId: newClip.id,
      tagId,
    }));
    await db.insert(clipTags).values(tagValues);
  }

  return NextResponse.json({ clip: newClip }, { status: 201 });
}
