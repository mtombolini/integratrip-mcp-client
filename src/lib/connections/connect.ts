import { redirectUri } from "@/config/env";
import { encryptOptional } from "@/lib/crypto";
import { discoverTarget } from "@/lib/oauth/discovery";
import { buildAuthorizeUrl } from "@/lib/oauth/engine";
import { generatePkce, randomState } from "@/lib/oauth/pkce";
import { createFlow } from "@/lib/oauth/flows";
import { getProvider } from "@/lib/oauth/providers";
import type { AuthType } from "@/lib/oauth/types";

// Begin connecting an MCP: discover its auth, resolve a client via the
// mechanism-specific provider, persist the flow, return the AS authorize URL.
export async function startConnect(input: {
  userId: string;
  authType: AuthType;
  serverUrl: string;
  name?: string;
}): Promise<string> {
  const target = await discoverTarget(input.serverUrl);
  const client = await getProvider(input.authType).resolve(target);

  const { verifier, challenge } = generatePkce();
  const state = randomState();
  const name =
    input.name?.trim() || new URL(target.resource).hostname.split(".")[0];

  await createFlow({
    state,
    kind: "connect",
    userId: input.userId,
    codeVerifier: verifier,
    resource: target.resource,
    redirectUri: redirectUri(),
    payload: {
      authType: input.authType,
      name,
      issuer: target.issuer,
      authorizationEndpoint: target.authorizationEndpoint,
      tokenEndpoint: target.tokenEndpoint,
      scope: target.scope,
      clientId: client.clientId,
      clientSecretEnc: encryptOptional(client.clientSecret),
      metadataDocumentUrl: client.metadataDocumentUrl ?? null,
      raw: client.raw,
    },
  });

  return buildAuthorizeUrl({
    authorizationEndpoint: target.authorizationEndpoint,
    clientId: client.clientId,
    redirectUri: redirectUri(),
    resource: target.resource,
    scope: target.scope,
    state,
    codeChallenge: challenge,
  });
}
