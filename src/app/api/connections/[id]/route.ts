import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { deleteConnection } from "@/lib/connections/repo";

export async function DELETE(
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
  await deleteConnection(session.uid, id);
  return NextResponse.json({ ok: true });
}
