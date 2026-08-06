import { NextResponse } from "next/server";
import { db } from "@/db";
import { clips } from "@/db/schema";
import { sql, isNotNull } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select({
        creatorHandle: clips.creatorHandle,
        creatorName: clips.creatorName,
        clipCount: sql<number>`count(*)::int`,
        latestClipId: sql<number>`max(${clips.id})`,
        latestPreview: sql<string>`(array_agg(${clips.previewImage} ORDER BY ${clips.savedAt} DESC))[1]`,
      })
      .from(clips)
      .where(isNotNull(clips.creatorHandle))
      .groupBy(clips.creatorHandle, clips.creatorName)
      .orderBy(sql`count(*) DESC`);
    return NextResponse.json({ creators: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ creators: [] });
  }
}
