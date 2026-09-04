"use client";

// Renders a tools/call result: text (pretty-printed when JSON), images,
// resources and structured content. Bounded height/scroll so it never breaks
// the layout.

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string }
  | { type: "audio"; data: string; mimeType: string }
  | {
      type: "resource";
      resource: { uri?: string; text?: string; mimeType?: string };
    }
  | { type: "resource_link"; uri: string; name?: string }
  | Record<string, unknown>;

export type ToolCallResult = {
  content?: ContentBlock[];
  structuredContent?: unknown;
  isError?: boolean;
};

function tryParseJson(text: string): unknown | undefined {
  const t = text.trim();
  if (!t.startsWith("{") && !t.startsWith("[")) return undefined;
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-md bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function TextBlock({ text }: { text: string }) {
  const json = tryParseJson(text);
  if (json !== undefined) return <JsonBlock value={json} />;
  return (
    <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-50 p-4 text-sm text-slate-800">
      {text}
    </pre>
  );
}

function Block({ block }: { block: ContentBlock }) {
  const type = (block as { type?: string }).type;

  if (type === "text") {
    return <TextBlock text={(block as { text: string }).text} />;
  }
  if (type === "image") {
    const b = block as { data: string; mimeType: string };
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt="Resultado (imagen)"
        src={`data:${b.mimeType};base64,${b.data}`}
        className="max-h-96 max-w-full rounded-md border border-slate-200"
      />
    );
  }
  if (type === "resource") {
    const r = (block as { resource: { uri?: string; text?: string } }).resource;
    return (
      <div className="rounded-md border border-slate-200 p-3 text-sm">
        {r.uri && (
          <p className="break-all font-mono text-xs text-slate-500">{r.uri}</p>
        )}
        {r.text && <TextBlock text={r.text} />}
      </div>
    );
  }
  if (type === "resource_link") {
    const l = block as { uri: string; name?: string };
    return (
      <a
        href={l.uri}
        target="_blank"
        rel="noreferrer"
        className="break-all text-sm text-blue-600 underline"
      >
        {l.name ?? l.uri}
      </a>
    );
  }
  return <JsonBlock value={block} />;
}

export function ResultViewer({ result }: { result: ToolCallResult }) {
  return (
    <div
      className={`space-y-3 rounded-lg border p-4 ${
        result.isError
          ? "border-red-200 bg-red-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            result.isError ? "bg-red-500" : "bg-emerald-500"
          }`}
        />
        <span className="text-sm font-medium">
          {result.isError ? "La tool devolvió un error" : "Resultado"}
        </span>
      </div>

      {result.content?.map((block, i) => (
        <Block key={i} block={block} />
      ))}

      {result.structuredContent !== undefined && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            Structured content
          </p>
          <JsonBlock value={result.structuredContent} />
        </div>
      )}
    </div>
  );
}
