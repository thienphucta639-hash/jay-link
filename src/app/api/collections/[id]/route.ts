import { NextRequest, NextResponse } from "next/server";
import { store } from "@/db/memory";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = store();
  const col = s.collections.find(c => c.id === parseInt(id));
  if (!col) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  if (body.name !== undefined) col.name = body.name;
  if (body.color !== undefined) col.color = body.color;
  if (body.isPinned !== undefined) col.isPinned = body.isPinned;
  return NextResponse.json({ collection: col });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = store();
  const idx = s.collections.findIndex(c => c.id === parseInt(id));
  if (idx >= 0) s.collections.splice(idx, 1);
  // Unassign clips
  s.clips.forEach(c => { if (c.collectionId === parseInt(id)) c.collectionId = null; });
  return NextResponse.json({ success: true });
}
