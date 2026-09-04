import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { listTools } from "@/lib/mcp/client";

/** tools/list for a connected MCP (ownership enforced in the repo layer). */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const tools = await listTools(session.uid, id);
    return NextResponse.json({ tools });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "tools_list_failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
