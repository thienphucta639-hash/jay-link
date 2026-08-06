import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tags } from "@/db/schema";

export async function GET() {
  const result = await db.select().from(tags).orderBy(tags.name);
  return NextResponse.json({ tags: result });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [newTag] = await db
    .insert(tags)
    .values({ name: name.toLowerCase().trim() })
    .onConflictDoNothing()
    .returning();

  if (!newTag) {
    // Already exists, fetch it
    const existing = await db.select().from(tags);
    const found = existing.find(
      (t) => t.name.toLowerCase() === name.toLowerCase().trim()
    );
    return NextResponse.json({ tag: found });
  }

  return NextResponse.json({ tag: newTag }, { status: 201 });
}
