"use client";

import { useState } from "react";
import { MCP_SERVER_PRESETS, type McpServerPreset } from "@/config/mcp-servers";
import type { AuthType } from "@/lib/oauth/types";

// Presets fill the three course servers; the form POSTs to /api/connections,
// which redirects to the AS. Advanced mode allows an arbitrary MCP URL.
export function ConnectForm() {
  const [name, setName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [authType, setAuthType] = useState<AuthType>("pre");
  const [advanced, setAdvanced] = useState(false);

  function applyPreset(p: McpServerPreset) {
    setName(p.name);
    setServerUrl(p.mcpUrl);
    setAuthType(p.authType);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {MCP_SERVER_PRESETS.map((p) => {
          const selected = serverUrl === p.mcpUrl;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-lg border p-4 text-left transition ${
                selected
                  ? "border-slate-900 ring-1 ring-slate-900"
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <div className="font-medium">{p.name}</div>
              <div className="mt-1 text-xs text-slate-500">{p.description}</div>
            </button>
          );
        })}
      </div>

      <form action="/api/connections" method="post" className="mt-5 space-y-4">
        <input type="hidden" name="authType" value={authType} />
        <input type="hidden" name="serverUrl" value={serverUrl} />
        <input type="hidden" name="name" value={name} />

        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
        >
          {advanced ? "Ocultar opciones avanzadas" : "Opciones avanzadas (URL personalizada)"}
        </button>

        {advanced && (
          <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Nombre</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mi servidor MCP"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Mecanismo de autenticación
              </span>
              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value as AuthType)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="pre">PRE — Pre-Registered Client</option>
                <option value="dcr">DCR — Dynamic Client Registration</option>
                <option value="cimd">CIMD — Client ID Metadata Document</option>
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">URL del MCP</span>
              <input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://…/mcp"
                className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
              />
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={!serverUrl}
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Conectar
        </button>
      </form>
    </div>
  );
}
