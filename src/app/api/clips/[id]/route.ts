import { NextRequest, NextResponse } from "next/server";
import { store } from "@/db/memory";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = store();
  const clip = s.clips.find(c => c.id === parseInt(id));
  if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  clip.openCount++;
  clip.lastOpenedAt = new Date().toISOString();

  const tagObjs = clip.tags.map(name => {
    const t = s.tags.find(t => t.name === name);
    return t ? { tagId: t.id, tagName: t.name } : { tagId: 0, tagName: name };
  });

  return NextResponse.json({ clip: { ...clip, tags: tagObjs } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = store();
  const clip = s.clips.find(c => c.id === parseInt(id));
  if (!clip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  if (body.customTitle !== undefined) clip.customTitle = body.customTitle;
  if (body.note !== undefined) clip.note = body.note;
  if (body.saveReason !== undefined) clip.saveReason = body.saveReason;
  if (body.watchStatus !== undefined) clip.watchStatus = body.watchStatus;
  if (body.isPinned !== undefined) clip.isPinned = body.isPinned;
  if (body.collectionId !== undefined) clip.collectionId = body.collectionId;
  if (body.creatorName !== undefined) clip.creatorName = body.creatorName;
  if (body.creatorHandle !== undefined) clip.creatorHandle = body.creatorHandle;

  if (body.tagIds && Array.isArray(body.tagIds)) {
    clip.tags = body.tagIds
      .map((id: number) => s.tags.find(t => t.id === id)?.name)
      .filter(Boolean) as string[];
  }

  return NextResponse.json({ clip });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = store();
  const idx = s.clips.findIndex(c => c.id === parseInt(id));
  if (idx >= 0) s.clips.splice(idx, 1);
  return NextResponse.json({ success: true });
}
