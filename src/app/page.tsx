import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">IntegraTrip</span>
          <Link
            href="/api/auth/login"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-widest text-slate-500">
          IIC3103 · Cliente MCP
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Conecta servidores MCP, descubre sus tools y ejecútalas.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-600">
          IntegraTrip centraliza la planificación de viajes conectándose a
          servicios externos vía Model Context Protocol. Inicia sesión para
          conectar tus servidores MCP, listar sus herramientas e invocarlas de
          forma segura.
        </p>
        <div className="mt-10">
          <Link
            href="/api/auth/login"
            className="inline-flex rounded-md bg-slate-900 px-6 py-3 text-base font-medium text-white transition hover:bg-slate-700"
          >
            Comenzar
          </Link>
        </div>

        <dl className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            {
              t: "Conexión segura",
              d: "OAuth 2.1 + PKCE. Los secretos y tokens viven solo en el servidor.",
            },
            {
              t: "Descubrimiento de tools",
              d: "tools/list por cada MCP conectado, con sus parámetros e inputSchema.",
            },
            {
              t: "Ejecución de tools",
              d: "Formularios dinámicos desde inputSchema y resultados legibles.",
            },
          ].map((f) => (
            <div
              key={f.t}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <dt className="font-medium">{f.t}</dt>
              <dd className="mt-2 text-sm text-slate-600">{f.d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-slate-500">
          IntegraTrip · Tarea 1 IIC3103 — Taller de Integración
        </div>
      </footer>
    </main>
  );
}
