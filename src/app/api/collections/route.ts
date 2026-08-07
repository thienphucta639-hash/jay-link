import { NextRequest, NextResponse } from "next/server";
import { store } from "@/db/memory";

export async function GET() {
  const s = store();
  const result = s.collections.map(c => ({
    ...c,
    coverImage: null,
    clipCount: s.clips.filter(cl => cl.collectionId === c.id).length,
  }));
  result.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return 0;
  });
  return NextResponse.json({ collections: result });
}

export async function POST(req: NextRequest) {
  const { name, color } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const s = store();
  const col = {
    id: s.nextId.col++,
    name,
    color: color || "#FF6B6B",
    isPinned: false,
    createdAt: new Date().toISOString(),
  };
  s.collections.push(col);
  return NextResponse.json({ collection: { ...col, coverImage: null, clipCount: 0 } }, { status: 201 });
}
