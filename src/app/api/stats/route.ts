import { NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { clips } from "@/db/schema";
import { sql, isNull, eq } from "drizzle-orm";

export async function GET() {
  if (!isDbAvailable()) {
    return NextResponse.json({
      totalClips: 0,
      unclassified: 0,
      pinned: 0,
      unreviewed: 0,
    });
  }

  const [totalClips] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clips);

  const [unclassified] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clips)
    .where(isNull(clips.collectionId));

  const [pinned] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clips)
    .where(eq(clips.isPinned, true));

  const [unreviewed] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clips)
    .where(eq(clips.watchStatus, "unreviewed"));

  return NextResponse.json({
    totalClips: totalClips.count,
    unclassified: unclassified.count,
    pinned: pinned.count,
    unreviewed: unreviewed.count,
  });
}
