import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { AuthType } from "./types";

// Persisted in-flight authorization-code flow, created before the redirect and
// consumed once at the callback (matched by `state`).

const TTL_MS = 10 * 60 * 1000;

export type FlowPayload = {
  issuer: string;
  tokenEndpoint: string;
  clientId: string;
  clientSecretEnc?: string | null;
  metadataDocumentUrl?: string | null;
  raw?: unknown;
  authType?: AuthType;
  name?: string;
  resourceUrl?: string;
  authorizationEndpoint?: string;
  scope?: string;
};

export async function createFlow(input: {
  state: string;
  kind: "login" | "connect";
  userId?: string | null;
  codeVerifier: string;
  resource: string;
  redirectUri: string;
  payload: FlowPayload;
}) {
  await db()
    .insert(schema.oauthFlows)
    .values({
      state: input.state,
      kind: input.kind,
      userId: input.userId ?? null,
      codeVerifier: input.codeVerifier,
      resource: input.resource,
      redirectUri: input.redirectUri,
      payload: input.payload,
      expiresAt: new Date(Date.now() + TTL_MS),
    });
}

export async function consumeFlow(state: string) {
  const [flow] = await db()
    .select()
    .from(schema.oauthFlows)
    .where(eq(schema.oauthFlows.state, state));
  if (!flow) return null;
  await db().delete(schema.oauthFlows).where(eq(schema.oauthFlows.state, state));
  if (flow.expiresAt.getTime() < Date.now()) return null;
  return { ...flow, payload: flow.payload as FlowPayload };
}
