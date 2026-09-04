import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { jwksUrl } from "@/config/env";

const globalForJwks = globalThis as unknown as {
  __jwks?: ReturnType<typeof createRemoteJWKSet>;
};

function jwks() {
  return (globalForJwks.__jwks ??= createRemoteJWKSet(new URL(jwksUrl())));
}

export type AccessTokenClaims = JWTPayload & {
  email?: string;
  student_id?: string;
  client_id?: string;
  scope?: string;
};

export async function verifyToken(
  token: string,
  opts: { issuer: string; audience: string },
): Promise<AccessTokenClaims> {
  const { payload } = await jwtVerify(token, jwks(), {
    issuer: opts.issuer,
    audience: opts.audience,
  });
  return payload as AccessTokenClaims;
}
