import type { AuthType, ClientProvider } from "../types";
import { preProvider } from "./pre";
import { dcrProvider } from "./dcr";
import { cimdProvider } from "./cimd";

const providers: Record<AuthType, ClientProvider> = {
  pre: preProvider,
  dcr: dcrProvider,
  cimd: cimdProvider,
};

export function getProvider(authType: AuthType): ClientProvider {
  const p = providers[authType];
  if (!p) throw new Error(`Unknown auth type: ${authType}`);
  return p;
}
