import { NextRequest, NextResponse } from "next/server";
import { withRetry } from "@/db";
import { tags } from "@/db/schema";

export async function GET() {
  try {
    return await withRetry(async (db) => {
      const result = await db.select().from(tags).orderBy(tags.name);
      return NextResponse.json({ tags: result });
    });
  } catch (err) { console.error(err); return NextResponse.json({ tags: [] }); }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    return await withRetry(async (db) => {
      const [newTag] = await db.insert(tags).values({ name: name.toLowerCase().trim() }).onConflictDoNothing().returning();
      if (!newTag) {
        const all = await db.select().from(tags);
        const found = all.find((t: { id: number; name: string }) => t.name.toLowerCase() === name.toLowerCase().trim());
        return NextResponse.json({ tag: found });
      }
      return NextResponse.json({ tag: newTag }, { status: 201 });
    });
  } catch (err) { console.error(err); return NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
