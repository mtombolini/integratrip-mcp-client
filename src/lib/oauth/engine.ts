import type { ClientCredentials, TokenSet } from "./types";

// Shared OAuth 2.1 authorization-code engine — identical for login and all three
// MCP mechanisms. The only variation (obtaining client_id) lives in the providers.

export function buildAuthorizeUrl(params: {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  resource: string;
  scope: string;
  state: string;
  codeChallenge: string;
  prompt?: "login";
}): string {
  const url = new URL(params.authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("resource", params.resource); // RFC 8707, becomes the audience
  if (params.prompt) url.searchParams.set("prompt", params.prompt);
  return url.toString();
}

type RawTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

function toTokenSet(raw: RawTokenResponse): TokenSet {
  const ttl = raw.expires_in ?? 3600;
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    expiresAt: new Date(Date.now() + Math.max(0, ttl - 30) * 1000),
    scope: raw.scope,
  };
}

async function postToken(
  tokenEndpoint: string,
  body: URLSearchParams,
): Promise<TokenSet> {
  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`token endpoint ${res.status}: ${text.slice(0, 300)}`);
  }
  return toTokenSet((await res.json()) as RawTokenResponse);
}

export async function exchangeCode(params: {
  tokenEndpoint: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
  resource: string;
  client: ClientCredentials;
}): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.client.clientId,
    code_verifier: params.codeVerifier,
    resource: params.resource,
  });
  if (params.client.clientSecret) {
    body.set("client_secret", params.client.clientSecret);
  }
  return postToken(params.tokenEndpoint, body);
}

export async function refreshToken(params: {
  tokenEndpoint: string;
  refreshToken: string;
  resource: string;
  client: ClientCredentials;
}): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    client_id: params.client.clientId,
    resource: params.resource,
  });
  if (params.client.clientSecret) {
    body.set("client_secret", params.client.clientSecret);
  }
  return postToken(params.tokenEndpoint, body);
}
