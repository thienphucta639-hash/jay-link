import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collections } from "@/db/schema";
import { sql, desc } from "drizzle-orm";

export async function GET() {
  try {
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
  } catch (err) {
    console.error("GET /api/collections error:", err);
    return NextResponse.json({ collections: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, color } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const [c] = await db.insert(collections).values({ name, color: color || "#FF6B6B" }).returning();
    return NextResponse.json({ collection: c }, { status: 201 });
  } catch (err) {
    console.error("POST /api/collections error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
