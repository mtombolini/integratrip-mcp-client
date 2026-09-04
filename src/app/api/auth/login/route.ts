import { NextResponse } from "next/server";
import { coreEnv, redirectUri } from "@/config/env";
import { loginIssuer } from "@/config/env";
import { encryptOptional } from "@/lib/crypto";
import { discoverIssuer } from "@/lib/oauth/discovery";
import { buildAuthorizeUrl } from "@/lib/oauth/engine";
import { generatePkce, randomState } from "@/lib/oauth/pkce";
import { createFlow } from "@/lib/oauth/flows";
import { getProvider } from "@/lib/oauth/providers";

// App login: plain OAuth against realm `pre` (not discovered from a 401),
// with resource = this app's origin.
export async function GET() {
  const issuer = loginIssuer();
  const metadata = await discoverIssuer(issuer);
  const client = await getProvider("pre").resolve({
    resource: coreEnv().APP_BASE_URL,
    issuer,
    authorizationEndpoint: metadata.authorization_endpoint,
    tokenEndpoint: metadata.token_endpoint,
    scope: "mcp:tools",
    metadata,
  });

  const { verifier, challenge } = generatePkce();
  const state = randomState();
  const resource = coreEnv().APP_BASE_URL;

  await createFlow({
    state,
    kind: "login",
    codeVerifier: verifier,
    resource,
    redirectUri: redirectUri(),
    payload: {
      issuer,
      tokenEndpoint: metadata.token_endpoint,
      clientId: client.clientId,
      clientSecretEnc: encryptOptional(client.clientSecret),
    },
  });

  const authorizeUrl = buildAuthorizeUrl({
    authorizationEndpoint: metadata.authorization_endpoint,
    clientId: client.clientId,
    redirectUri: redirectUri(),
    resource,
    scope: "mcp:tools",
    state,
    codeChallenge: challenge,
    prompt: "login",
  });

  return NextResponse.redirect(authorizeUrl);
}
