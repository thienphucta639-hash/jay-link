import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ status: "ok", database: `error: ${msg}` });
  }
}
