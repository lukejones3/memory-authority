import { atlasEdges, atlasMemories, createAtlasAuthority } from "../../../authority/atlas";
import type { ContextPacket } from "../../../authority/types";

export const dynamic = "force-dynamic";

type DemoRequest = { query?: unknown; scope?: unknown; budgetChars?: unknown };

function response(packet: ContextPacket, query: string, replayVerified: boolean) {
  const selected = new Set(packet.memories.map(memory => memory.memoryId));
  const graphNodes = atlasMemories
    .filter(memory => memory.scope === packet.scope && (selected.has(memory.id) || packet.memories.length === 0))
    .map(memory => ({ id: memory.id, label: memory.title, type: memory.type, selected: selected.has(memory.id), status: memory.status ?? "active" }));
  const nodeIds = new Set(graphNodes.map(node => node.id));
  const graphEdges = atlasEdges
    .filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map(edge => ({ from: edge.source, to: edge.target, type: edge.type }));
  const answer = packet.support === "unsupported"
    ? "The authority found no supported evidence for this request. It returned a sealed empty packet instead of giving the model a plausible story."
    : `The authority compiled ${packet.memories.length} evidence record${packet.memories.length === 1 ? "" : "s"}. ${packet.memories.map(memory => memory.text).join(" ")}`;
  return { query, packet, answer, replayVerified, graph: { nodes: graphNodes, edges: graphEdges } };
}

export async function POST(request: Request) {
  let body: DemoRequest;
  try {
    body = await request.json() as DemoRequest;
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const query = typeof body.query === "string" ? body.query.trim().slice(0, 600) : "";
  if (!query) return Response.json({ error: "Enter a memory question." }, { status: 400 });
  const scope = body.scope === "nebula/private" ? "nebula/private" : "atlas/core";
  const requestedBudget = typeof body.budgetChars === "number" ? body.budgetChars : 4_000;
  const budgetChars = Math.max(700, Math.min(8_000, Math.round(requestedBudget)));
  const authority = createAtlasAuthority();
  try {
    const packet = authority.compile(query, "atlas-demo", scope, budgetChars);
    const replay = authority.compile(query, "atlas-demo", scope, budgetChars);
    return Response.json(response(packet, query, replay.fingerprint === packet.fingerprint), {
      headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Access denied";
    if (/not granted scope/.test(message)) {
      return Response.json({
        query,
        denied: true,
        answer: "Denied before candidate formation. The Atlas client is not granted the Nebula scope; no evidence was decrypted or packed.",
        packet: {
          packetId: "no-packet-issued", fingerprint: "denied-before-retrieval", compilerVersion: "memory-authority-1.0.0",
          clientId: "atlas-demo", scope, queryHash: "not-computed", support: "denied", budget: { limit: budgetChars, used: 0 }, candidates: 0, memories: [],
          trace: ["client identity verified", "scope grant intersection empty", "candidate formation skipped", "zero evidence decrypted"],
        },
        replayVerified: true,
        graph: { nodes: [{ id: "atlas-demo", label: "atlas-demo", type: "client", selected: true, status: "active" }, { id: "nebula/private", label: "nebula/private", type: "denied", selected: false, status: "denied" }], edges: [{ from: "atlas-demo", to: "nebula/private", type: "DENIED" }] },
      }, { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
    }
    return Response.json({ error: "The compiler could not complete this request." }, { status: 500 });
  }
}

