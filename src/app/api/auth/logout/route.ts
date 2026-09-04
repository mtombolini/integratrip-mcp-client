import { NextResponse } from "next/server";
import { coreEnv } from "@/config/env";
import { clearSession } from "@/lib/auth/session";

export async function GET() {
  await clearSession();
  return NextResponse.redirect(coreEnv().APP_BASE_URL);
}

export const POST = GET;
