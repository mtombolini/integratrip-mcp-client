import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { callTool } from "@/lib/mcp/client";

const bodySchema = z.object({
  name: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()).default({}),
});

/** tools/call for a connected MCP. */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_arguments" }, { status: 400 });
  }

  try {
    const result = await callTool(
      session.uid,
      id,
      parsed.data.name,
      parsed.data.arguments,
    );
    return NextResponse.json({ result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "tools_call_failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
