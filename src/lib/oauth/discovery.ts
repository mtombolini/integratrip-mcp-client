import type {
  AuthServerMetadata,
  DiscoveredTarget,
  ProtectedResourceMetadata,
} from "./types";

// MCP auth discovery: MCP 401 → WWW-Authenticate resource_metadata → Protected
// Resource Metadata → authorization_servers[0] → AS metadata. Issuer is never
// hardcoded; it comes from the server.

const JSON_HEADERS = { Accept: "application/json" };

function parseWwwAuthenticate(header: string): {
  resourceMetadata?: string;
  scope?: string;
} {
  const out: { resourceMetadata?: string; scope?: string } = {};
  const rm = header.match(/resource_metadata="([^"]+)"/i);
  if (rm) out.resourceMetadata = rm[1];
  const sc = header.match(/scope="([^"]+)"/i);
  if (sc) out.scope = sc[1];
  return out;
}

async function probeResourceMetadataUrl(mcpUrl: string): Promise<string> {
  const res = await fetch(mcpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "integratrip", version: "1.0.0" },
      },
    }),
  });
  const header = res.headers.get("www-authenticate");
  if (res.status === 401 && header) {
    const { resourceMetadata } = parseWwwAuthenticate(header);
    if (resourceMetadata) return resourceMetadata;
  }
  const u = new URL(mcpUrl);
  return `${u.origin}/.well-known/oauth-protected-resource${u.pathname}`;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: JSON_HEADERS, ...init });
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

async function fetchAsMetadata(issuer: string): Promise<AuthServerMetadata> {
  const u = new URL(issuer);
  const candidates = [
    `${u.origin}/.well-known/oauth-authorization-server${u.pathname}`,
    `${issuer}/.well-known/openid-configuration`,
    `${issuer}/.well-known/oauth-authorization-server`,
  ];
  let lastErr: unknown;
  for (const url of candidates) {
    try {
      return await fetchJson<AuthServerMetadata>(url);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(
    `Could not fetch AS metadata for ${issuer}: ${String(lastErr)}`,
  );
}

export async function discoverTarget(mcpUrl: string): Promise<DiscoveredTarget> {
  const prmUrl = await probeResourceMetadataUrl(mcpUrl);
  const prm = await fetchJson<ProtectedResourceMetadata>(prmUrl);

  const issuer = prm.authorization_servers?.[0];
  if (!issuer) {
    throw new Error(`Protected resource metadata has no authorization_servers`);
  }
  const metadata = await fetchAsMetadata(issuer);
  const scope = prm.scopes_supported?.join(" ") || "mcp:tools";

  return {
    resource: prm.resource ?? mcpUrl,
    issuer,
    authorizationEndpoint: metadata.authorization_endpoint,
    tokenEndpoint: metadata.token_endpoint,
    scope,
    metadata,
  };
}

// App login is not an MCP: it targets the realm issuer directly.
export async function discoverIssuer(issuer: string): Promise<AuthServerMetadata> {
  return fetchAsMetadata(issuer);
}
