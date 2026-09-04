import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { decryptOptional, encrypt, encryptOptional } from "@/lib/crypto";
import type { AuthType, ClientCredentials, TokenSet } from "@/lib/oauth/types";
import type { McpConnection } from "@/lib/db/schema";

// All reads/writes are scoped by userId, so a user only ever sees their own data.

export async function upsertUser(input: {
  subject: string;
  email: string;
  studentId?: string | null;
}) {
  const [user] = await db()
    .insert(schema.users)
    .values({
      subject: input.subject,
      email: input.email,
      studentId: input.studentId ?? null,
    })
    .onConflictDoUpdate({
      target: schema.users.subject,
      set: { email: input.email, studentId: input.studentId ?? null },
    })
    .returning();
  return user;
}

export type NewConnectionInput = {
  userId: string;
  name: string;
  authType: AuthType;
  resourceUrl: string;
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string;
  client: ClientCredentials;
  tokens: TokenSet;
};

export async function createConnection(input: NewConnectionInput) {
  return db().transaction(async (tx) => {
    const [conn] = await tx
      .insert(schema.mcpConnections)
      .values({
        userId: input.userId,
        name: input.name,
        authType: input.authType,
        resourceUrl: input.resourceUrl,
        issuer: input.issuer,
        authorizationEndpoint: input.authorizationEndpoint,
        tokenEndpoint: input.tokenEndpoint,
        scopes: input.scope,
      })
      .returning();

    await tx.insert(schema.mcpClientRegistrations).values({
      connectionId: conn.id,
      clientId: input.client.clientId,
      clientSecretEnc: encryptOptional(input.client.clientSecret),
      metadataDocumentUrl: input.client.metadataDocumentUrl ?? null,
      raw: (input.client.raw as object) ?? null,
    });

    await tx.insert(schema.mcpTokens).values({
      connectionId: conn.id,
      accessTokenEnc: encrypt(input.tokens.accessToken),
      refreshTokenEnc: encryptOptional(input.tokens.refreshToken),
      expiresAt: input.tokens.expiresAt,
      scope: input.tokens.scope ?? input.scope,
    });

    return conn;
  });
}

export async function listConnections(userId: string): Promise<McpConnection[]> {
  return db()
    .select()
    .from(schema.mcpConnections)
    .where(eq(schema.mcpConnections.userId, userId))
    .orderBy(desc(schema.mcpConnections.createdAt));
}

export async function getConnection(
  userId: string,
  connectionId: string,
): Promise<McpConnection | undefined> {
  const [conn] = await db()
    .select()
    .from(schema.mcpConnections)
    .where(
      and(
        eq(schema.mcpConnections.id, connectionId),
        eq(schema.mcpConnections.userId, userId),
      ),
    );
  return conn;
}

export async function deleteConnection(userId: string, connectionId: string) {
  await db()
    .delete(schema.mcpConnections)
    .where(
      and(
        eq(schema.mcpConnections.id, connectionId),
        eq(schema.mcpConnections.userId, userId),
      ),
    );
}

// Full auth material for a connection (server-side only). Verifies ownership.
export async function getConnectionAuth(userId: string, connectionId: string) {
  const conn = await getConnection(userId, connectionId);
  if (!conn) return undefined;

  const [reg] = await db()
    .select()
    .from(schema.mcpClientRegistrations)
    .where(eq(schema.mcpClientRegistrations.connectionId, connectionId));
  const [tok] = await db()
    .select()
    .from(schema.mcpTokens)
    .where(eq(schema.mcpTokens.connectionId, connectionId));

  const client: ClientCredentials = {
    clientId: reg.clientId,
    clientSecret: decryptOptional(reg.clientSecretEnc) ?? undefined,
    metadataDocumentUrl: reg.metadataDocumentUrl ?? undefined,
  };
  return { conn, client, token: tok };
}

export async function saveRefreshedTokens(
  connectionId: string,
  tokens: TokenSet,
) {
  await db()
    .update(schema.mcpTokens)
    .set({
      accessTokenEnc: encrypt(tokens.accessToken),
      refreshTokenEnc: encryptOptional(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
      scope: tokens.scope,
      updatedAt: new Date(),
    })
    .where(eq(schema.mcpTokens.connectionId, connectionId));
}
