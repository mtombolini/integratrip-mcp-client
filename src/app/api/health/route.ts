import { NextResponse } from "next/server";

/** Lightweight liveness probe for the deployment platform. No secrets, no DB. */
export function GET() {
  return NextResponse.json({ status: "ok", service: "integratrip-mcp-client" });
}
