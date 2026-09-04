import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { decrypt } from "@/lib/crypto";
import { refreshToken as doRefresh } from "@/lib/oauth/engine";
import { getConnectionAuth, saveRefreshedTokens } from "@/lib/connections/repo";
import type { McpConnection } from "@/lib/db/schema";

type ConnAuth = NonNullable<Awaited<ReturnType<typeof getConnectionAuth>>>;

async function ensureAccessToken(auth: ConnAuth): Promise<string> {
  const { conn, client, token } = auth;
  if (token.expiresAt.getTime() > Date.now()) return decrypt(token.accessTokenEnc);

  const refresh = token.refreshTokenEnc ? decrypt(token.refreshTokenEnc) : null;
  if (!refresh) return decrypt(token.accessTokenEnc);

  const next = await doRefresh({
    tokenEndpoint: conn.tokenEndpoint,
    refreshToken: refresh,
    resource: conn.resourceUrl,
    client,
  });
  await saveRefreshedTokens(conn.id, next);
  return next.accessToken;
}

async function withClient<T>(
  conn: McpConnection,
  accessToken: string,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const transport = new StreamableHTTPClientTransport(new URL(conn.resourceUrl), {
    requestInit: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const client = new Client(
    { name: "integratrip", version: "1.0.0" },
    { capabilities: {} },
  );
  try {
    await client.connect(transport);
    return await fn(client);
  } finally {
    await client.close().catch(() => {});
  }
}

async function resolveAuth(userId: string, connectionId: string): Promise<ConnAuth> {
  const auth = await getConnectionAuth(userId, connectionId);
  if (!auth) throw new Error("CONNECTION_NOT_FOUND");
  return auth;
}

export async function listTools(userId: string, connectionId: string) {
  const auth = await resolveAuth(userId, connectionId);
  const token = await ensureAccessToken(auth);
  const result = await withClient(auth.conn, token, (c) => c.listTools());
  return result.tools;
}

export async function callTool(
  userId: string,
  connectionId: string,
  name: string,
  args: Record<string, unknown>,
) {
  const auth = await resolveAuth(userId, connectionId);
  const token = await ensureAccessToken(auth);
  return withClient(auth.conn, token, (c) => c.callTool({ name, arguments: args }));
}
