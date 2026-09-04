// JSON Schema helpers for rendering dynamic forms from a tool's inputSchema.
// Pure (no runtime deps) so it is safe to import in client components.

export type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  const?: unknown;
  description?: string;
  title?: string;
  default?: unknown;
  format?: string;
  minimum?: number;
  maximum?: number;
};

export type McpTool = {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: JsonSchema;
};

export type FieldKind =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "enum"
  | "json";

export function schemaType(s: JsonSchema): string {
  return Array.isArray(s.type) ? s.type[0] : s.type ?? "string";
}

export function fieldKind(s: JsonSchema): FieldKind {
  if (s.enum && s.enum.length > 0) return "enum";
  const t = schemaType(s);
  if (t === "boolean") return "boolean";
  if (t === "integer") return "integer";
  if (t === "number") return "number";
  if (t === "string") return "string";
  return "json"; // object/array/unknown → raw JSON editor
}

export function initialValues(schema?: JsonSchema): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const props = schema?.properties ?? {};
  for (const [key, prop] of Object.entries(props)) {
    if (prop.default !== undefined) out[key] = prop.default;
    else if (fieldKind(prop) === "boolean") out[key] = false;
    else out[key] = "";
  }
  return out;
}

// Drop empty optional values so we don't send blank strings for absent args.
export function cleanArguments(
  schema: JsonSchema | undefined,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const required = new Set(schema?.required ?? []);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    const isEmpty = value === "" || value === undefined || value === null;
    if (isEmpty && !required.has(key)) continue;
    out[key] = value;
  }
  return out;
}
