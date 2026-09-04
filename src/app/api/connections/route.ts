import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { coreEnv } from "@/config/env";
import { requireSession } from "@/lib/auth/session";
import { startConnect } from "@/lib/connections/connect";

const bodySchema = z.object({
  authType: z.enum(["pre", "dcr", "cimd"]),
  serverUrl: z.string().url(),
  name: z.string().max(120).optional(),
});

/** Start a new MCP connection. Redirects the user to the AS authorize endpoint. */
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.redirect(coreEnv().APP_BASE_URL);
  }

  const form = await req.formData();
  const parsed = bodySchema.safeParse({
    authType: form.get("authType"),
    serverUrl: form.get("serverUrl"),
    name: form.get("name") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.redirect(
      `${coreEnv().APP_BASE_URL}/dashboard?error=invalid_connection_input`,
    );
  }

  try {
    const authorizeUrl = await startConnect({
      userId: session.uid,
      ...parsed.data,
    });
    // 303 so the browser follows with a GET (top-level nav → SameSite=Lax cookie).
    return NextResponse.redirect(authorizeUrl, { status: 303 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "connect_failed";
    return NextResponse.redirect(
      `${coreEnv().APP_BASE_URL}/dashboard?error=${encodeURIComponent(msg.slice(0, 200))}`,
    );
  }
}
