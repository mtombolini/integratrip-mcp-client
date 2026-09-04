import type { AuthType } from "@/lib/oauth/types";

/**
 * Known course MCP servers, offered as one-click presets in the connect UI.
 * Users may also connect an arbitrary MCP URL; these are just conveniences.
 */
export type McpServerPreset = {
  key: string;
  name: string;
  description: string;
  authType: AuthType;
  mcpUrl: string;
};

export const MCP_SERVER_PRESETS: McpServerPreset[] = [
  {
    key: "andes-air",
    name: "Andes Air",
    description: "Vuelos · Pre-Registered OAuth Client (PRE)",
    authType: "pre",
    mcpUrl: "https://tarea1-mcp-pre-z2fqxmm2ja-uc.a.run.app/mcp",
  },
  {
    key: "staywell",
    name: "StayWell",
    description: "Hoteles y reservas · Dynamic Client Registration (DCR)",
    authType: "dcr",
    mcpUrl: "https://tarea1-mcp-dcr-z2fqxmm2ja-uc.a.run.app/mcp",
  },
  {
    key: "cielo-sur",
    name: "Cielo Sur",
    description: "Clima · Client ID Metadata Document (CIMD)",
    authType: "cimd",
    mcpUrl: "https://tarea1-mcp-cimd-z2fqxmm2ja-uc.a.run.app/mcp",
  },
];

export const AUTH_TYPE_LABELS: Record<AuthType, string> = {
  pre: "PRE",
  dcr: "DCR",
  cimd: "CIMD",
};
