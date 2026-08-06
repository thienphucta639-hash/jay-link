import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { clips, clipTags, tags } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDbAvailable()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  const clipId = parseInt(id);

  const result = await db
    .select()
    .from(clips)
    .where(eq(clips.id, clipId))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get tags
  const tagRows = await db
    .select({ tagName: tags.name, tagId: tags.id })
    .from(clipTags)
    .innerJoin(tags, eq(tags.id, clipTags.tagId))
    .where(eq(clipTags.clipId, clipId));

  // Increment open count
  await db
    .update(clips)
    .set({
      openCount: (result[0].openCount || 0) + 1,
      lastOpenedAt: new Date(),
    })
    .where(eq(clips.id, clipId));

  return NextResponse.json({
    clip: {
      ...result[0],
      tags: tagRows,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDbAvailable()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  const clipId = parseInt(id);
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    "customTitle",
    "note",
    "saveReason",
    "watchStatus",
    "isPinned",
    "collectionId",
    "creatorName",
    "creatorHandle",
    "previewImage",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(clips).set(updateData).where(eq(clips.id, clipId));
  }

  // Update tags if provided
  if (body.tagIds && Array.isArray(body.tagIds)) {
    await db.delete(clipTags).where(eq(clipTags.clipId, clipId));
    if (body.tagIds.length > 0) {
      const tagValues = body.tagIds.map((tagId: number) => ({
        clipId,
        tagId,
      }));
      await db.insert(clipTags).values(tagValues);
    }
  }

  const [updated] = await db
    .select()
    .from(clips)
    .where(eq(clips.id, clipId))
    .limit(1);

  return NextResponse.json({ clip: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDbAvailable()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  const clipId = parseInt(id);

  await db.delete(clips).where(eq(clips.id, clipId));
  return NextResponse.json({ success: true });
}
