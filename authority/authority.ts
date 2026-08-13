import { blindTokens, decrypt, encrypt, hmac, sha256, stableId, tokenize } from "./crypto";
import type {
  Candidate,
  ClientGrant,
  ContextPacket,
  EncryptedSnapshot,
  MemoryEdge,
  MemoryInput,
  StoredMemory,
} from "./types";

export const COMPILER_VERSION = "memory-authority-1.0.0";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

function scopeMatches(scope: string, grant: string): boolean {
  if (grant.endsWith("/*")) return scope.startsWith(grant.slice(0, -1));
  return scope === grant;
}

export class MemoryAuthority {
  private readonly key: Buffer;
  private readonly memories = new Map<string, StoredMemory>();
  private readonly edges = new Map<string, MemoryEdge>();
  private readonly grants = new Map<string, ClientGrant>();

  constructor(key: Buffer, grants: ClientGrant[] = []) {
    if (key.length !== 32) throw new Error("MemoryAuthority requires a 32-byte key");
    this.key = Buffer.from(key);
    grants.forEach(grant => this.grants.set(grant.clientId, { ...grant, scopes: [...grant.scopes] }));
  }

  grant(grant: ClientGrant): void {
    this.grants.set(grant.clientId, { ...grant, scopes: [...grant.scopes] });
  }

  admit(input: MemoryInput, clientId: string): string {
    const grant = this.requireGrant(clientId, input.scope, "write");
    if (!grant.canWrite) throw new Error(`client ${clientId} cannot write`);
    const aad = `${input.id}\0${input.scope}`;
    const sealed = encrypt(this.key, input.text, aad);
    const { text, ...safeInput } = input;
    this.memories.set(input.id, {
      ...safeInput,
      ...sealed,
      status: input.status ?? "active",
      primaryEvidence: input.primaryEvidence ?? false,
      contentHash: hmac(this.key, "content", text),
      tokenDigests: blindTokens(this.key, text),
    });
    return input.id;
  }

  link(edge: MemoryEdge, clientId: string): string {
    const source = this.memories.get(edge.source);
    const target = this.memories.get(edge.target);
    if (!source || !target) throw new Error("edge endpoints must exist");
    this.requireGrant(clientId, source.scope, "link");
    this.requireGrant(clientId, target.scope, "link");
    if (source.scope !== target.scope) throw new Error("cross-scope edges are forbidden");
    const grant = this.grants.get(clientId)!;
    if (!grant.canLink) throw new Error(`client ${clientId} cannot link`);
    this.edges.set(edge.id, { ...edge, weight: edge.weight ?? 1 });
    return edge.id;
  }

  compile(query: string, clientId: string, scope: string, budgetChars = 4_000): ContextPacket {
    this.requireGrant(clientId, scope, "read");
    const queryTokens = tokenize(query);
    const queryDigests = new Set(blindTokens(this.key, query));
    const allowed = [...this.memories.values()].filter(memory =>
      memory.scope === scope && memory.status !== "retracted"
    );
    const lexicalIds = new Set(
      allowed.filter(memory => memory.tokenDigests.some(token => queryDigests.has(token))).map(memory => memory.id),
    );
    const graphIds = new Map<string, number>();
    for (const edge of this.edges.values()) {
      if (lexicalIds.has(edge.source)) graphIds.set(edge.target, Math.max(graphIds.get(edge.target) ?? 0, edge.weight ?? 1));
      if (lexicalIds.has(edge.target)) graphIds.set(edge.source, Math.max(graphIds.get(edge.source) ?? 0, edge.weight ?? 1));
    }

    const asOf = Math.max(...allowed.map(memory => Date.parse(memory.eventTime)));
    const candidates = allowed
      .filter(memory => lexicalIds.has(memory.id) || graphIds.has(memory.id))
      .map(memory => this.score(memory, queryTokens, graphIds.get(memory.id) ?? 0, asOf))
      .sort((a, b) => b.score - a.score || a.memoryId.localeCompare(b.memoryId));

    const selected: Candidate[] = [];
    const rejectedDerived = new Set<string>();
    let used = 0;
    for (const candidate of candidates) {
      const memory = this.memories.get(candidate.memoryId)!;
      const candidateTokens = tokenize(candidate.text);
      const nearPrimary = !memory.primaryEvidence && candidates.some(existing => {
        const existingMemory = this.memories.get(existing.memoryId)!;
        if (!existingMemory.primaryEvidence || existing.memoryId === candidate.memoryId) return false;
        const existingTokens = new Set(tokenize(existing.text));
        const overlap = candidateTokens.filter(token => existingTokens.has(token)).length;
        return overlap / Math.max(1, candidateTokens.length) >= 0.4;
      });
      if (!memory.primaryEvidence && nearPrimary) {
        candidate.reasons.push("rejected: near-duplicate derived record");
        rejectedDerived.add(candidate.memoryId);
        continue;
      }
      const size = candidate.text.length + candidate.title.length + candidate.source.length + 64;
      if (used + size > budgetChars) {
        candidate.reasons.push("rejected: context budget exhausted");
        continue;
      }
      candidate.selected = true;
      selected.push(candidate);
      used += size;
    }

    const support = selected.length === 0
      ? "unsupported"
      : selected[0].score >= 0.58
        ? "supported"
        : "contextual";
    const packed = support === "unsupported" ? [] : selected;
    const queryHash = hmac(this.key, "query", query);
    const packetCore = {
      compilerVersion: COMPILER_VERSION,
      clientId,
      scope,
      queryHash,
      support,
      budget: { limit: budgetChars, used: support === "unsupported" ? 0 : used },
      candidates: candidates.length,
      memories: packed.map(candidate => ({
        ...candidate,
        score: round(candidate.score),
        components: Object.fromEntries(
          Object.entries(candidate.components).map(([key, value]) => [key, round(value)]),
        ) as Candidate["components"],
      })),
      trace: [
        `grant verified: ${clientId} → ${scope}`,
        `${candidates.length} candidates formed from blind lexical index + graph`,
        `${rejectedDerived.size} near-duplicate derived records suppressed`,
        `${packed.length} evidence records packed within ${budgetChars} chars`,
      ],
    };
    const fingerprint = sha256(canonical(packetCore));
    return {
      packetId: stableId(this.key, "ctx", fingerprint),
      fingerprint,
      ...packetCore,
    };
  }

  snapshot(clientId: string): EncryptedSnapshot {
    const grant = this.grants.get(clientId);
    if (!grant?.canSnapshot) throw new Error(`client ${clientId} cannot snapshot`);
    const memories = [...this.memories.values()]
      .filter(memory => grant.scopes.some(scope => scopeMatches(memory.scope, scope)))
      .sort((a, b) => a.id.localeCompare(b.id));
    const ids = new Set(memories.map(memory => memory.id));
    const edges = [...this.edges.values()]
      .filter(edge => ids.has(edge.source) && ids.has(edge.target))
      .sort((a, b) => a.id.localeCompare(b.id));
    const grants = [...this.grants.values()]
      .filter(item => item.scopes.some(scope => grant.scopes.includes(scope)))
      .sort((a, b) => a.clientId.localeCompare(b.clientId));
    const core = { version: COMPILER_VERSION, memories, edges, grants };
    return { ...core, ledgerFingerprint: sha256(canonical(core)) };
  }

  static restore(key: Buffer, snapshot: EncryptedSnapshot): MemoryAuthority {
    const authority = new MemoryAuthority(key, snapshot.grants);
    snapshot.memories.forEach(memory => authority.memories.set(memory.id, { ...memory }));
    snapshot.edges.forEach(edge => authority.edges.set(edge.id, { ...edge }));
    return authority;
  }

  private score(memory: StoredMemory, queryTokens: string[], graph: number, asOf: number): Candidate {
    const text = decrypt(this.key, memory, `${memory.id}\0${memory.scope}`);
    const tokens = new Set(tokenize(`${memory.title} ${text}`));
    const overlap = queryTokens.filter(token => tokens.has(token)).length;
    const lexical = overlap / Math.max(1, queryTokens.length);
    const authority = memory.primaryEvidence ? 1 : 0.48;
    const recency = Math.max(0, 1 - (asOf - Date.parse(memory.eventTime)) / (1000 * 60 * 60 * 24 * 365 * 5));
    const status = memory.status === "active" ? 1 : -0.65;
    const total = lexical * 0.52 + graph * 0.22 + authority * 0.18 + recency * 0.08 + (status < 0 ? status * 0.25 : 0);
    const reasons = [];
    if (overlap) reasons.push(`matched ${overlap} query terms`);
    if (graph) reasons.push("typed graph neighbor");
    if (memory.primaryEvidence) reasons.push("primary evidence");
    if (memory.status === "superseded") reasons.push("historical: superseded");
    return {
      memoryId: memory.id,
      title: memory.title,
      type: memory.type,
      text,
      source: memory.source,
      eventTime: memory.eventTime,
      scope: memory.scope,
      score: total,
      components: { lexical, graph, authority, recency, status },
      reasons,
      selected: false,
    };
  }

  private requireGrant(clientId: string, scope: string, operation: string): ClientGrant {
    const grant = this.grants.get(clientId);
    if (!grant) throw new Error(`explicit client identity required for ${operation}`);
    if (!grant.scopes.some(item => scopeMatches(scope, item))) {
      throw new Error(`client ${clientId} is not granted scope ${scope}`);
    }
    return grant;
  }
}
