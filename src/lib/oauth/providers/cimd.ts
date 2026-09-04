import { clientMetadataDocumentUrl } from "@/config/env";
import type { ClientCredentials, ClientProvider } from "../types";

// CIMD (Cielo Sur): client_id is the public URL of the metadata document we host
// at /oauth/client-metadata.json. Public client, no secret; the AS fetches it.
export const cimdProvider: ClientProvider = {
  authType: "cimd",
  async resolve(): Promise<ClientCredentials> {
    const url = clientMetadataDocumentUrl();
    return { clientId: url, metadataDocumentUrl: url };
  },
};
