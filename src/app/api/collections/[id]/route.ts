import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collections } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const u: Record<string, unknown> = {};
    if (body.name !== undefined) u.name = body.name;
    if (body.color !== undefined) u.color = body.color;
    if (body.isPinned !== undefined) u.isPinned = body.isPinned;
    if (Object.keys(u).length > 0) await db.update(collections).set(u).where(eq(collections.id, parseInt(id)));
    const [updated] = await db.select().from(collections).where(eq(collections.id, parseInt(id)));
    return NextResponse.json({ collection: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(collections).where(eq(collections.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
