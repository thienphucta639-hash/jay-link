import { NextRequest, NextResponse } from "next/server";
import { store } from "@/db/memory";

export async function GET() {
  const s = store();
  const sorted = [...s.tags].sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({ tags: sorted });
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const s = store();
  const clean = name.toLowerCase().trim();
  const existing = s.tags.find(t => t.name === clean);
  if (existing) return NextResponse.json({ tag: existing });
  const tag = { id: s.nextId.tag++, name: clean };
  s.tags.push(tag);
  return NextResponse.json({ tag }, { status: 201 });
}
