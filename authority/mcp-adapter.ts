import type { MemoryAuthority } from "./authority";

/**
 * Deliberately thin MCP-facing boundary. The MCP server transports calls; it
 * does not rank, summarize, or choose evidence. Those decisions stay inside
 * MemoryAuthority and are therefore shared by every model client.
 */
export function createMemoryTools(authority: MemoryAuthority) {
  return {
    context_pack: (input: { query: string; clientId: string; scope: string; budgetChars?: number }) =>
      authority.compile(input.query, input.clientId, input.scope, input.budgetChars),
    memory_snapshot: (input: { clientId: string }) => authority.snapshot(input.clientId),
  };
}
