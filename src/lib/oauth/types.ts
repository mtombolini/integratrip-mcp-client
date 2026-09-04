export type AuthType = "pre" | "dcr" | "cimd";

export type ProtectedResourceMetadata = {
  resource: string;
  authorization_servers: string[];
  scopes_supported?: string[];
  resource_name?: string;
};

export type AuthServerMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  registration_endpoint?: string;
  client_id_metadata_document_supported?: boolean;
  code_challenge_methods_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  scopes_supported?: string[];
};

export type DiscoveredTarget = {
  resource: string;
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string;
  metadata: AuthServerMetadata;
};

export type ClientCredentials = {
  clientId: string;
  clientSecret?: string; // pre/dcr only
  metadataDocumentUrl?: string; // cimd only
  raw?: unknown;
};

// The only thing that varies across pre/dcr/cimd: how the client_id is obtained.
export interface ClientProvider {
  readonly authType: AuthType;
  resolve(target: DiscoveredTarget): Promise<ClientCredentials>;
}

export type TokenSet = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope?: string;
};
