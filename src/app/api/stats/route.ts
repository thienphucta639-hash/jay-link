import { NextResponse } from "next/server";
import { store } from "@/db/memory";

export async function GET() {
  const s = store();
  return NextResponse.json({
    totalClips: s.clips.length,
    unclassified: s.clips.filter(c => !c.collectionId).length,
    pinned: s.clips.filter(c => c.isPinned).length,
    unreviewed: s.clips.filter(c => c.watchStatus === "unreviewed").length,
  });
}
