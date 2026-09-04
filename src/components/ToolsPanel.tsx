"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cleanArguments,
  fieldKind,
  initialValues,
  type McpTool,
} from "@/lib/mcp/schema";
import { DynamicForm } from "./DynamicForm";
import { ResultViewer, type ToolCallResult } from "./ResultViewer";

/** Parse JSON-typed fields (object/array) from their textarea strings. */
function buildArguments(
  tool: McpTool,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const props = tool.inputSchema?.properties ?? {};
  const out: Record<string, unknown> = { ...values };
  for (const [key, prop] of Object.entries(props)) {
    if (fieldKind(prop) === "json" && typeof out[key] === "string") {
      const s = (out[key] as string).trim();
      if (s === "") {
        delete out[key];
        continue;
      }
      out[key] = JSON.parse(s); // may throw → surfaced as a call error
    }
  }
  return cleanArguments(tool.inputSchema, out);
}

export function ToolsPanel({ connectionId }: { connectionId: string }) {
  const [tools, setTools] = useState<McpTool[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<McpTool | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [calling, setCalling] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolCallResult | null>(null);

  const loadTools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/connections/${connectionId}/tools`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudieron listar las tools");
      setTools(data.tools);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    // Intentional data fetch on mount (and when the connection changes).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTools();
  }, [loadTools]);

  function selectTool(tool: McpTool) {
    setSelected(tool);
    setValues(initialValues(tool.inputSchema));
    setResult(null);
    setCallError(null);
  }

  async function execute() {
    if (!selected) return;
    setCalling(true);
    setCallError(null);
    setResult(null);
    try {
      const args = buildArguments(selected, values);
      const res = await fetch(
        `/api/connections/${connectionId}/tools/call`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: selected.name, arguments: args }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "La ejecución falló");
      setResult(data.result as ToolCallResult);
    } catch (err) {
      setCallError(
        err instanceof SyntaxError
          ? "Un campo JSON no es válido."
          : err instanceof Error
            ? err.message
            : "Error desconocido",
      );
    } finally {
      setCalling(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      {/* Tools list */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tools</h2>
          <button
            onClick={loadTools}
            className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
          >
            Recargar
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">Cargando tools…</p>}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
            <p className="mt-1 text-xs text-red-500">
              Puede que la autorización haya expirado. Intenta reconectar el MCP.
            </p>
          </div>
        )}

        {tools && tools.length === 0 && (
          <p className="text-sm text-slate-500">Este MCP no expone tools.</p>
        )}

        {tools && tools.length > 0 && (
          <ul className="space-y-2">
            {tools.map((t) => (
              <li key={t.name}>
                <button
                  onClick={() => selectTool(t)}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    selected?.name === t.name
                      ? "border-slate-900 ring-1 ring-slate-900"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <div className="font-mono text-sm font-medium">{t.name}</div>
                  {t.description && (
                    <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {t.description}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Execution panel */}
      <div>
        {!selected ? (
          <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
            Selecciona una tool para ver sus parámetros y ejecutarla.
          </p>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-mono text-lg font-semibold">{selected.name}</h3>
              {selected.description && (
                <p className="mt-1 text-sm text-slate-600">
                  {selected.description}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <DynamicForm
                schema={selected.inputSchema}
                values={values}
                onChange={setValues}
              />
              <button
                onClick={execute}
                disabled={calling}
                className="mt-5 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40"
              >
                {calling ? "Ejecutando…" : "Ejecutar tool"}
              </button>
            </div>

            {callError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {callError}
              </div>
            )}

            {result && <ResultViewer result={result} />}
          </div>
        )}
      </div>
    </div>
  );
}
