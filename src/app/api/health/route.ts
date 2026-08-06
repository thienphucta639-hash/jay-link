import { NextResponse } from "next/server";
import { isDbReady } from "@/db";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    database: isDbReady() ? "connected" : "not configured",
    timestamp: new Date().toISOString(),
  });
}
