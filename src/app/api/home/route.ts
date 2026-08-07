import { NextResponse } from "next/server";
import { store } from "@/db/memory";

// Single API for HomeTab — returns everything in one call
export async function GET() {
  const s = store();
  const clips = [...s.clips].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
  });

  const pinned = clips.filter(c => c.isPinned).slice(0, 6);
  const recent = clips.slice(0, 20);
  const inbox = clips.filter(c => !c.collectionId).slice(0, 6);

  const colsWithCount = s.collections.map(c => ({
    ...c,
    coverImage: null,
    clipCount: s.clips.filter(cl => cl.collectionId === c.id).length,
  }));
  colsWithCount.sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));

  const creatorMap: Record<string, { handle: string; name: string | null; count: number }> = {};
  for (const c of s.clips) {
    if (!c.creatorHandle) continue;
    if (!creatorMap[c.creatorHandle]) creatorMap[c.creatorHandle] = { handle: c.creatorHandle, name: c.creatorName, count: 0 };
    creatorMap[c.creatorHandle].count++;
  }
  const creators = Object.values(creatorMap).sort((a, b) => b.count - a.count).slice(0, 10);

  return NextResponse.json({
    stats: {
      totalClips: s.clips.length,
      unclassified: s.clips.filter(c => !c.collectionId).length,
      pinned: s.clips.filter(c => c.isPinned).length,
      unreviewed: s.clips.filter(c => c.watchStatus === "unreviewed").length,
    },
    pinned,
    recent,
    inbox,
    collections: colsWithCount,
    creators,
  });
}
