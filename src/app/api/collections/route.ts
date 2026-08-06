import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collections, clips } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET() {
  const result = await db
    .select({
      id: collections.id,
      name: collections.name,
      color: collections.color,
      coverImage: collections.coverImage,
      isPinned: collections.isPinned,
      createdAt: collections.createdAt,
      clipCount: sql<number>`(SELECT count(*) FROM clips WHERE clips.collection_id = ${collections.id})::int`,
    })
    .from(collections)
    .orderBy(desc(collections.isPinned), collections.createdAt);

  return NextResponse.json({ collections: result });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, color } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [newCollection] = await db
    .insert(collections)
    .values({
      name,
      color: color || "#FF6B6B",
    })
    .returning();

  return NextResponse.json({ collection: newCollection }, { status: 201 });
}
