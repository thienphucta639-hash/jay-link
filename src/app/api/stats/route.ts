import { NextResponse } from "next/server";
import { db } from "@/db";
import { clips } from "@/db/schema";
import { sql, isNull, eq } from "drizzle-orm";

export async function GET() {
  try {
    const [total] = await db.select({ c: sql<number>`count(*)::int` }).from(clips);
    const [uncl] = await db.select({ c: sql<number>`count(*)::int` }).from(clips).where(isNull(clips.collectionId));
    const [pin] = await db.select({ c: sql<number>`count(*)::int` }).from(clips).where(eq(clips.isPinned, true));
    const [unr] = await db.select({ c: sql<number>`count(*)::int` }).from(clips).where(eq(clips.watchStatus, "unreviewed"));
    return NextResponse.json({ totalClips: total.c, unclassified: uncl.c, pinned: pin.c, unreviewed: unr.c });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ totalClips: 0, unclassified: 0, pinned: 0, unreviewed: 0 });
  }
}
