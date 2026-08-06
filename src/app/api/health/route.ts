import { NextResponse } from "next/server";
import { isDbAvailable } from "@/db";

export async function GET() {
  return NextResponse.json({ 
    status: "ok",
    database: isDbAvailable() ? "connected" : "not configured",
    timestamp: new Date().toISOString()
  });
}
