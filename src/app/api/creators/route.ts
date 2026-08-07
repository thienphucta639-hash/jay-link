import { NextResponse } from "next/server";
import { store } from "@/db/memory";

export async function GET() {
  const s = store();
  const map: Record<string, { creatorHandle: string; creatorName: string | null; clipCount: number; latestPreview: string | null }> = {};
  for (const c of s.clips) {
    if (!c.creatorHandle) continue;
    if (!map[c.creatorHandle]) {
      map[c.creatorHandle] = { creatorHandle: c.creatorHandle, creatorName: c.creatorName, clipCount: 0, latestPreview: c.previewImage };
    }
    map[c.creatorHandle].clipCount++;
  }
  const creators = Object.values(map).sort((a, b) => b.clipCount - a.clipCount);
  return NextResponse.json({ creators });
}
