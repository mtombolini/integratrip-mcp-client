import { loginEnv } from "@/config/env";
import type { ClientCredentials, ClientProvider } from "../types";

// PRE (Andes Air): client created once in the AS /console, provided via env.
// The same client also serves app login (differing only by `resource`).
export const preProvider: ClientProvider = {
  authType: "pre",
  async resolve(): Promise<ClientCredentials> {
    const { PRE_CLIENT_ID, PRE_CLIENT_SECRET } = loginEnv();
    return { clientId: PRE_CLIENT_ID, clientSecret: PRE_CLIENT_SECRET };
  },
};
