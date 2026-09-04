import { NextResponse } from "next/server";
import { clientMetadataDocumentUrl, redirectUri } from "@/config/env";

// CIMD client-metadata document. Its own public URL is the client_id; the AS
// fetches this at authorize time. Public client (no secret, PKCE only).
export function GET() {
  const url = clientMetadataDocumentUrl();
  return NextResponse.json(
    {
      client_id: url,
      client_name: "IntegraTrip MCP Client",
      redirect_uris: [redirectUri()],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: "mcp:tools",
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
