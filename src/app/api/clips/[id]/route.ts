import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clips, clipTags, tags } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clipId = parseInt(id);
    const result = await db.select().from(clips).where(eq(clips.id, clipId)).limit(1);
    if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const tagRows = await db
      .select({ tagName: tags.name, tagId: tags.id })
      .from(clipTags)
      .innerJoin(tags, eq(tags.id, clipTags.tagId))
      .where(eq(clipTags.clipId, clipId));

    await db.update(clips).set({ openCount: (result[0].openCount || 0) + 1, lastOpenedAt: new Date() }).where(eq(clips.id, clipId));

    return NextResponse.json({ clip: { ...result[0], tags: tagRows } });
  } catch (err) {
    console.error("GET /api/clips/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clipId = parseInt(id);
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    for (const f of ["customTitle", "note", "saveReason", "watchStatus", "isPinned", "collectionId", "creatorName", "creatorHandle", "previewImage"]) {
      if (body[f] !== undefined) updates[f] = body[f];
    }

    if (Object.keys(updates).length > 0) {
      await db.update(clips).set(updates).where(eq(clips.id, clipId));
    }

    if (body.tagIds && Array.isArray(body.tagIds)) {
      await db.delete(clipTags).where(eq(clipTags.clipId, clipId));
      if (body.tagIds.length > 0) {
        await db.insert(clipTags).values(body.tagIds.map((tagId: number) => ({ clipId, tagId })));
      }
    }

    const [updated] = await db.select().from(clips).where(eq(clips.id, clipId)).limit(1);
    return NextResponse.json({ clip: updated });
  } catch (err) {
    console.error("PATCH /api/clips/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(clips).where(eq(clips.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/clips/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
