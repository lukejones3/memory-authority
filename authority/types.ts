export type MemoryType =
  | "event"
  | "decision"
  | "incident"
  | "change"
  | "test"
  | "task"
  | "summary";

export type MemoryStatus = "active" | "superseded" | "retracted";

export interface MemoryInput {
  id: string;
  scope: string;
  type: MemoryType;
  text: string;
  title: string;
  source: string;
  eventTime: string;
  status?: MemoryStatus;
  primaryEvidence?: boolean;
  validFrom?: string;
  validUntil?: string;
  metadata?: Record<string, unknown>;
}

export interface StoredMemory extends Omit<MemoryInput, "text"> {
  status: MemoryStatus;
  primaryEvidence: boolean;
  nonce: string;
  ciphertext: string;
  tag: string;
  contentHash: string;
  tokenDigests: string[];
}

export interface MemoryEdge {
  id: string;
  source: string;
  target: string;
  type:
    | "CAUSED"
    | "FAILED_BECAUSE"
    | "RESOLVED_BY"
    | "VERIFIED_BY"
    | "SUPERSEDED_BY"
    | "IMPLEMENTED_BY"
    | "DEPENDS_ON"
    | "NEXT_ACTION";
  weight?: number;
  provenance: string;
}

export interface ClientGrant {
  clientId: string;
  scopes: string[];
  canWrite?: boolean;
  canLink?: boolean;
  canSnapshot?: boolean;
}

export interface Candidate {
  memoryId: string;
  title: string;
  type: MemoryType;
  text: string;
  source: string;
  eventTime: string;
  scope: string;
  score: number;
  components: {
    lexical: number;
    graph: number;
    authority: number;
    recency: number;
    status: number;
  };
  reasons: string[];
  selected: boolean;
}

export interface ContextPacket {
  packetId: string;
  fingerprint: string;
  compilerVersion: string;
  clientId: string;
  scope: string;
  queryHash: string;
  support: "supported" | "contextual" | "unsupported";
  budget: { limit: number; used: number };
  candidates: number;
  memories: Candidate[];
  trace: string[];
}

export interface EncryptedSnapshot {
  version: string;
  ledgerFingerprint: string;
  memories: StoredMemory[];
  edges: MemoryEdge[];
  grants: ClientGrant[];
}
