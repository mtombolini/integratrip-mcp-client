import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Per-user data hangs off users.id; that is how isolation is enforced.
// Extensible for Tarea 2 (conversations, messages, tool_invocations).

export const authTypeEnum = pgEnum("auth_type", ["pre", "dcr", "cimd"]);
export const flowKindEnum = pgEnum("flow_kind", ["login", "connect"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  subject: text("subject").notNull().unique(), // AS `sub` (UC email)
  email: text("email").notNull(),
  studentId: text("student_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mcpConnections = pgTable(
  "mcp_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    authType: authTypeEnum("auth_type").notNull(),
    resourceUrl: text("resource_url").notNull(), // …/mcp, also the token audience
    issuer: text("issuer").notNull(),
    authorizationEndpoint: text("authorization_endpoint").notNull(),
    tokenEndpoint: text("token_endpoint").notNull(),
    scopes: text("scopes").notNull().default("mcp:tools"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("mcp_connections_user_idx").on(t.userId),
    uniqueIndex("mcp_connections_user_resource_uq").on(t.userId, t.resourceUrl),
  ],
);

export const mcpClientRegistrations = pgTable("mcp_client_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  connectionId: uuid("connection_id")
    .notNull()
    .unique()
    .references(() => mcpConnections.id, { onDelete: "cascade" }),
  clientId: text("client_id").notNull(),
  clientSecretEnc: text("client_secret_enc"), // encrypted; null for public (cimd)
  metadataDocumentUrl: text("metadata_document_url"), // cimd only
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mcpTokens = pgTable("mcp_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  connectionId: uuid("connection_id")
    .notNull()
    .unique()
    .references(() => mcpConnections.id, { onDelete: "cascade" }),
  accessTokenEnc: text("access_token_enc").notNull(),
  refreshTokenEnc: text("refresh_token_enc"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  scope: text("scope"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Short-lived state for an in-flight authorization-code flow, matched by `state`.
export const oauthFlows = pgTable(
  "oauth_flows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    state: text("state").notNull().unique(),
    kind: flowKindEnum("kind").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    codeVerifier: text("code_verifier").notNull(),
    resource: text("resource").notNull(),
    redirectUri: text("redirect_uri").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("oauth_flows_state_idx").on(t.state)],
);

export type User = typeof users.$inferSelect;
export type McpConnection = typeof mcpConnections.$inferSelect;
export type McpClientRegistration = typeof mcpClientRegistrations.$inferSelect;
export type McpToken = typeof mcpTokens.$inferSelect;
export type OAuthFlow = typeof oauthFlows.$inferSelect;
