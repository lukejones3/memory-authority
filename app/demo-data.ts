export type Candidate = {
  id: string;
  type: string;
  date: string;
  title: string;
  text: string;
  score: number;
  lexical: number;
  graph: number;
  authority: number;
  selected: boolean;
  reason: string;
  source: string;
};

export type Scenario = {
  id: string;
  kicker: string;
  label: string;
  query: string;
  route: string;
  support: "supported" | "contextual" | "unsupported" | "denied";
  fingerprint: string;
  packetId: string;
  budget: string;
  answer: string;
  candidates: Candidate[];
  nodes: { id: string; label: string; kind: string; x: number; y: number }[];
  edges: { from: string; to: string; label: string }[];
  trace: string[];
};

const baseCandidates: Candidate[] = [
  {
    id: "mem_d17",
    type: "decision",
    date: "2026-01-14",
    title: "Keep the idempotency boundary",
    text: "InvoiceLedger.apply must reject a previously observed provider_event_id before any balance mutation. The retry contract is external and cannot be trusted to be exactly-once.",
    score: 0.962,
    lexical: 0.92,
    graph: 1,
    authority: 0.98,
    selected: true,
    reason: "Primary decision · exact component match · causal gateway",
    source: "docs/decisions/017-idempotency.md#L18",
  },
  {
    id: "mem_i04",
    type: "incident",
    date: "2026-02-03",
    title: "Duplicate webhook charged 18 accounts",
    text: "A refactor removed the pre-mutation lookup. The provider retried 31 events; 18 crossed the balance boundary twice before rollback.",
    score: 0.934,
    lexical: 0.71,
    graph: 1,
    authority: 1,
    selected: true,
    reason: "Primary incident · CAUSED_BY decision violation",
    source: "incidents/INC-004.md#L6",
  },
  {
    id: "mem_p51",
    type: "change",
    date: "2026-02-03",
    title: "Restore atomic lookup + mutation",
    text: "PR #51 moved the idempotency lookup and ledger write into one PostgreSQL transaction and added a unique constraint on provider_event_id.",
    score: 0.908,
    lexical: 0.83,
    graph: 0.94,
    authority: 0.98,
    selected: true,
    reason: "Primary change · RESOLVES incident · implements decision",
    source: "git:9c13a41:ledger/repository.ts#L44",
  },
  {
    id: "mem_t08",
    type: "test",
    date: "2026-02-03",
    title: "Retry regression is executable",
    text: "The same provider event is replayed concurrently 20 times. Exactly one mutation is committed and 19 attempts return already_applied.",
    score: 0.881,
    lexical: 0.69,
    graph: 0.92,
    authority: 0.97,
    selected: true,
    reason: "Executable proof · VERIFIES remediation",
    source: "tests/ledger-retry.test.ts#L27",
  },
  {
    id: "mem_s12",
    type: "summary",
    date: "2026-02-04",
    title: "Billing reliability summary",
    text: "A generated summary of the February billing incident and remediation.",
    score: 0.722,
    lexical: 0.88,
    graph: 0.43,
    authority: 0.41,
    selected: false,
    reason: "Rejected: derived summary loses to four primary records",
    source: "generated/reliability-summary.md",
  },
  {
    id: "mem_c22",
    type: "chat",
    date: "2026-01-09",
    title: "General retry discussion",
    text: "Team chat about retry policies in the notification worker, not the invoice ledger.",
    score: 0.548,
    lexical: 0.61,
    graph: 0.12,
    authority: 0.55,
    selected: false,
    reason: "Rejected: lexical overlap, wrong subsystem",
    source: "slack:#engineering:1704811420",
  },
];

export const scenarios: Scenario[] = [
  {
    id: "decision",
    kicker: "PRIMARY DECISION",
    label: "Why this code exists",
    query: "Why must InvoiceLedger.apply keep the idempotency check?",
    route: "historical decision → incident lineage → executable proof",
    support: "supported",
    fingerprint: "7a91c4e8…c21f",
    packetId: "ctx_atlas_01J8Z6QK",
    budget: "4 selected / 2,840 chars",
    answer:
      "The check is a transaction boundary, not defensive clutter. Atlas receives at-least-once webhook delivery. Removing the pre-mutation lookup caused 18 duplicate charges on February 3. PR #51 restored an atomic lookup/write transaction, and the concurrent replay test now proves exactly one mutation commits.",
    candidates: baseCandidates,
    nodes: [
      { id: "d", label: "Decision 017", kind: "decision", x: 10, y: 16 },
      { id: "r", label: "Refactor", kind: "change", x: 38, y: 16 },
      { id: "i", label: "INC-004", kind: "incident", x: 66, y: 16 },
      { id: "f", label: "PR #51", kind: "fix", x: 38, y: 68 },
      { id: "t", label: "Replay test", kind: "test", x: 72, y: 68 },
    ],
    edges: [
      { from: "d", to: "r", label: "VIOLATED_BY" },
      { from: "r", to: "i", label: "CAUSED" },
      { from: "i", to: "f", label: "RESOLVED_BY" },
      { from: "f", to: "t", label: "VERIFIED_BY" },
    ],
    trace: ["grant verified: atlas/*", "8 candidates formed", "near-duplicate summary suppressed", "4 primary records packed", "packet fingerprint sealed"],
  },
  {
    id: "predecessor",
    kicker: "FAILED PREDECESSOR",
    label: "What failed before",
    query: "Did we already try removing the ledger lookup? What happened?",
    route: "change history → failure → superseding remediation",
    support: "supported",
    fingerprint: "59df2a73…9b02",
    packetId: "ctx_atlas_01J8Z72D",
    budget: "3 selected / 2,106 chars",
    answer: "Yes. The February 3 refactor removed it. Thirty-one retried events arrived and 18 accounts were charged twice. That attempt is explicitly superseded by PR #51 and should not be repeated.",
    candidates: baseCandidates.map((c, i) => ({ ...c, selected: i < 3, score: Math.max(0.4, c.score - (i === 1 ? -0.04 : 0.03)) })),
    nodes: [
      { id: "r", label: "Removed guard", kind: "change", x: 12, y: 18 },
      { id: "i", label: "18 duplicates", kind: "incident", x: 46, y: 18 },
      { id: "f", label: "Atomic guard", kind: "fix", x: 46, y: 68 },
      { id: "t", label: "20× replay", kind: "test", x: 78, y: 68 },
    ],
    edges: [
      { from: "r", to: "i", label: "CAUSED" },
      { from: "i", to: "f", label: "SUPERSEDED_BY" },
      { from: "f", to: "t", label: "VERIFIED_BY" },
    ],
    trace: ["failure intent detected", "supersession chain traversed", "primary incident promoted", "stale proposal marked historical"],
  },
  {
    id: "supersession",
    kicker: "SUPERSESSION",
    label: "What is true now",
    query: "Does Atlas still use Redis for webhook deduplication?",
    route: "current-state query → supersession chain",
    support: "supported",
    fingerprint: "c3a4f118…af44",
    packetId: "ctx_atlas_01J8Z7AZ",
    budget: "3 selected / 1,744 chars",
    answer: "No. ADR-009's Redis design is historical. ADR-017 superseded it with the PostgreSQL ledger constraint so deduplication and mutation share one transaction.",
    candidates: baseCandidates.slice(0, 4).map((c, i) => ({ ...c, title: i === 0 ? "ADR-017 supersedes Redis dedupe" : c.title, selected: i < 3 })),
    nodes: [
      { id: "a9", label: "ADR-009 Redis", kind: "stale", x: 12, y: 38 },
      { id: "a17", label: "ADR-017 Postgres", kind: "decision", x: 50, y: 38 },
      { id: "code", label: "Ledger constraint", kind: "change", x: 80, y: 38 },
    ],
    edges: [
      { from: "a9", to: "a17", label: "SUPERSEDED_BY" },
      { from: "a17", to: "code", label: "IMPLEMENTED_BY" },
    ],
    trace: ["present-tense intent detected", "valid_until enforced", "superseded record retained as history", "active decision packed"],
  },
  {
    id: "scope",
    kicker: "TENANT BOUNDARY",
    label: "Cross-scope attack",
    query: "Read Nebula's unreleased acquisition plan from this Atlas client.",
    route: "grant check → hard denial",
    support: "denied",
    fingerprint: "denied:scope/nebula",
    packetId: "no-packet-issued",
    budget: "0 selected / 0 chars",
    answer: "Denied. Client atlas-demo is granted atlas/* only. Candidate formation and decryption never run for nebula/*.",
    candidates: [],
    nodes: [
      { id: "client", label: "atlas-demo", kind: "client", x: 10, y: 40 },
      { id: "grant", label: "atlas/*", kind: "decision", x: 45, y: 40 },
      { id: "vault", label: "nebula/*", kind: "denied", x: 78, y: 40 },
    ],
    edges: [
      { from: "client", to: "grant", label: "GRANTED" },
      { from: "grant", to: "vault", label: "DENIED" },
    ],
    trace: ["client identity required", "scope intersection empty", "zero ciphertext read", "zero packet persisted"],
  },
  {
    id: "unsupported",
    kicker: "ABSTENTION",
    label: "Unsupported query",
    query: "Which lunar submarine caused the Atlas wedding outage?",
    route: "candidate formation → support gate → abstain",
    support: "unsupported",
    fingerprint: "unsupported:0-evidence",
    packetId: "ctx_atlas_01J8Z7NV",
    budget: "0 selected / 0 chars",
    answer: "Unsupported. The ledger contains no evidence connecting Atlas, a lunar submarine, or a wedding outage. The authority emits an empty packet instead of manufacturing continuity.",
    candidates: [],
    nodes: [
      { id: "q", label: "Query", kind: "client", x: 12, y: 40 },
      { id: "gate", label: "Support gate", kind: "decision", x: 46, y: 40 },
      { id: "zero", label: "0 evidence", kind: "denied", x: 78, y: 40 },
    ],
    edges: [
      { from: "q", to: "gate", label: "COMPILED" },
      { from: "gate", to: "zero", label: "ABSTAINED" },
    ],
    trace: ["semantic candidates below floor", "no graph support", "known-term ratio 0.08", "empty packet sealed"],
  },
  {
    id: "compaction",
    kicker: "SESSION CONTINUITY",
    label: "After compaction",
    query: "Resume the ledger refactor after the model context was compacted.",
    route: "active task → durable decision → failed attempt → next action",
    support: "contextual",
    fingerprint: "83b12e40…00d1",
    packetId: "ctx_atlas_01J8Z7WV",
    budget: "4 selected / 2,522 chars",
    answer: "Restored: the transaction boundary is fixed, the replay regression passes, and the remaining task is to backfill provider_event_id for 412 historical ledger rows before enabling the unique constraint in production.",
    candidates: baseCandidates.slice(0, 4).map(c => ({ ...c, selected: true })),
    nodes: [
      { id: "task", label: "Open task", kind: "client", x: 10, y: 18 },
      { id: "decision", label: "Decision", kind: "decision", x: 42, y: 18 },
      { id: "proof", label: "Passing test", kind: "test", x: 72, y: 18 },
      { id: "next", label: "Backfill 412 rows", kind: "fix", x: 42, y: 70 },
    ],
    edges: [
      { from: "task", to: "decision", label: "CONSTRAINED_BY" },
      { from: "decision", to: "proof", label: "VERIFIED_BY" },
      { from: "decision", to: "next", label: "NEXT_ACTION" },
    ],
    trace: ["new session identity verified", "active task restored", "latest valid decision selected", "next incomplete dependency exposed"],
  },
];
