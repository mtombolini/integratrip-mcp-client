import { redirectUri } from "@/config/env";
import type {
  ClientCredentials,
  ClientProvider,
  DiscoveredTarget,
} from "../types";

type RegistrationResponse = {
  client_id: string;
  client_secret?: string;
  [k: string]: unknown;
};

// DCR (StayWell): register a fresh confidential client during the flow (RFC 7591).
export const dcrProvider: ClientProvider = {
  authType: "dcr",
  async resolve(target: DiscoveredTarget): Promise<ClientCredentials> {
    const endpoint = target.metadata.registration_endpoint;
    if (!endpoint) {
      throw new Error("DCR realm did not advertise a registration_endpoint");
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_name: "IntegraTrip MCP Client",
        redirect_uris: [redirectUri()],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "client_secret_post",
      }),
    });
    if (res.status !== 201 && !res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`DCR register ${res.status}: ${text.slice(0, 300)}`);
    }
    const raw = (await res.json()) as RegistrationResponse;
    if (!raw.client_id) throw new Error("DCR register returned no client_id");
    return { clientId: raw.client_id, clientSecret: raw.client_secret, raw };
  },
};
