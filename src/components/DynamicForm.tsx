"use client";

import {
  fieldKind,
  schemaType,
  type JsonSchema,
} from "@/lib/mcp/schema";

// Form inferred from a tool's inputSchema. Controlled by the parent. Complex
// types (object/array) fall back to a JSON textarea so no tool is un-callable.
export function DynamicForm({
  schema,
  values,
  onChange,
}: {
  schema?: JsonSchema;
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const props = schema?.properties ?? {};
  const required = new Set(schema?.required ?? []);
  const entries = Object.entries(props);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Esta tool no requiere argumentos.
      </p>
    );
  }

  function set(key: string, value: unknown) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      {entries.map(([key, prop]) => {
        const kind = fieldKind(prop);
        const isReq = required.has(key);
        const label = prop.title ?? key;
        const raw = values[key];

        return (
          <label key={key} className="block text-sm">
            <span className="mb-1 flex items-center gap-1 font-medium text-slate-700">
              {label}
              {isReq && <span className="text-red-500">*</span>}
              <span className="font-mono text-xs font-normal text-slate-400">
                {schemaType(prop)}
              </span>
            </span>
            {prop.description && (
              <span className="mb-1 block text-xs text-slate-500">
                {prop.description}
              </span>
            )}

            {kind === "boolean" ? (
              <input
                type="checkbox"
                checked={Boolean(raw)}
                onChange={(e) => set(key, e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
            ) : kind === "enum" ? (
              <select
                value={String(raw ?? "")}
                onChange={(e) => set(key, e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {(prop.enum ?? []).map((opt) => (
                  <option key={String(opt)} value={String(opt)}>
                    {String(opt)}
                  </option>
                ))}
              </select>
            ) : kind === "number" || kind === "integer" ? (
              <input
                type="number"
                step={kind === "integer" ? 1 : "any"}
                value={raw === undefined || raw === null ? "" : String(raw)}
                onChange={(e) =>
                  set(key, e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            ) : kind === "json" ? (
              <textarea
                rows={3}
                value={typeof raw === "string" ? raw : JSON.stringify(raw ?? "", null, 2)}
                onChange={(e) => set(key, e.target.value)}
                placeholder='JSON, p. ej. {"clave": "valor"}'
                className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
              />
            ) : (
              <input
                type={prop.format === "date" ? "date" : "text"}
                value={typeof raw === "string" ? raw : String(raw ?? "")}
                onChange={(e) => set(key, e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            )}
          </label>
        );
      })}
    </div>
  );
}
