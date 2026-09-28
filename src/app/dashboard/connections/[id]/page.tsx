import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getConnection } from "@/lib/connections/repo";
import { AUTH_TYPE_LABELS } from "@/config/mcp-servers";
import { ToolsPanel } from "@/components/ToolsPanel";
import { LogoutButton } from "@/components/LogoutButton";

export default async function ConnectionPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  const { id } = await props.params;
  const conn = await getConnection(session.uid, id);
  if (!conn) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            IntegraTrip
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 underline-offset-2 hover:underline"
        >
          ← Volver
        </Link>

        <div className="mt-3 flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{conn.name}</h1>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {AUTH_TYPE_LABELS[conn.authType]}
          </span>
        </div>
        <p className="mt-1 break-all font-mono text-xs text-slate-500">
          {conn.resourceUrl}
        </p>

        <div className="mt-8">
          <ToolsPanel connectionId={conn.id} />
        </div>
      </div>
    </main>
  );
}
