import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collections } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.color !== undefined) updateData.color = body.color;
  if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;

  if (Object.keys(updateData).length > 0) {
    await db
      .update(collections)
      .set(updateData)
      .where(eq(collections.id, parseInt(id)));
  }

  const [updated] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, parseInt(id)));

  return NextResponse.json({ collection: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(collections).where(eq(collections.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
