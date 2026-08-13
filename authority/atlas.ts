import { MemoryAuthority } from "./authority";
import type { MemoryEdge, MemoryInput } from "./types";

export const ATLAS_KEY = Buffer.from(
  "c2f7b6fe451cc57dd3eb2d028734c709771ed48a511abd85197680b03bc7c2ad",
  "hex",
);

export const atlasMemories: MemoryInput[] = [
  {
    id: "mem_decision_017", scope: "atlas/core", type: "decision",
    title: "Keep the idempotency boundary", eventTime: "2026-01-14T18:00:00Z",
    source: "docs/decisions/017-idempotency.md#L18", primaryEvidence: true,
    text: "InvoiceLedger apply must reject a previously observed provider event id before any balance mutation. The webhook retry contract is at least once and cannot be trusted to be exactly once.",
  },
  {
    id: "mem_refactor_044", scope: "atlas/core", type: "change",
    title: "Remove redundant lookup", eventTime: "2026-02-03T10:00:00Z",
    source: "git:44aa109:ledger/repository.ts#L44", primaryEvidence: true,
    status: "superseded",
    text: "Removed the provider event id lookup before the ledger mutation as an apparent redundant read.",
  },
  {
    id: "mem_incident_004", scope: "atlas/core", type: "incident",
    title: "Duplicate webhook charged 18 accounts", eventTime: "2026-02-03T14:00:00Z",
    source: "incidents/INC-004.md#L6", primaryEvidence: true,
    text: "The provider retried 31 webhook events after a timeout. Eighteen accounts crossed the invoice ledger balance boundary twice before rollback.",
  },
  {
    id: "mem_fix_051", scope: "atlas/core", type: "change",
    title: "Restore atomic lookup and mutation", eventTime: "2026-02-03T19:00:00Z",
    source: "git:9c13a41:ledger/repository.ts#L44", primaryEvidence: true,
    text: "Moved the idempotency lookup and ledger mutation into one PostgreSQL transaction and added a unique constraint on provider event id.",
  },
  {
    id: "mem_test_008", scope: "atlas/core", type: "test",
    title: "Retry regression is executable", eventTime: "2026-02-03T20:00:00Z",
    source: "tests/ledger-retry.test.ts#L27", primaryEvidence: true,
    text: "Replay the same provider event concurrently twenty times. Exactly one invoice ledger mutation commits and nineteen attempts return already applied.",
  },
  {
    id: "mem_summary_012", scope: "atlas/core", type: "summary",
    title: "Billing reliability summary", eventTime: "2026-02-04T09:00:00Z",
    source: "generated/reliability-summary.md", primaryEvidence: false,
    text: "The invoice ledger idempotency incident showed why provider event deduplication and atomic PostgreSQL mutation matter for billing reliability.",
  },
  {
    id: "mem_nebula_secret", scope: "nebula/private", type: "decision",
    title: "Unreleased acquisition", eventTime: "2026-02-05T10:00:00Z",
    source: "board/private-acquisition.md", primaryEvidence: true,
    text: "Synthetic secret for the isolation test. This must never be visible to an Atlas client.",
  },
];

export const atlasEdges: MemoryEdge[] = [
  { id: "edge_01", source: "mem_decision_017", target: "mem_refactor_044", type: "FAILED_BECAUSE", provenance: "reviewed" },
  { id: "edge_02", source: "mem_refactor_044", target: "mem_incident_004", type: "CAUSED", provenance: "incident review" },
  { id: "edge_03", source: "mem_incident_004", target: "mem_fix_051", type: "RESOLVED_BY", provenance: "PR #51" },
  { id: "edge_04", source: "mem_fix_051", target: "mem_test_008", type: "VERIFIED_BY", provenance: "CI" },
  { id: "edge_05", source: "mem_refactor_044", target: "mem_fix_051", type: "SUPERSEDED_BY", provenance: "ADR-017" },
];

export function createAtlasAuthority(): MemoryAuthority {
  const authority = new MemoryAuthority(ATLAS_KEY, [
    { clientId: "atlas-demo", scopes: ["atlas/*"], canWrite: true, canLink: true, canSnapshot: true },
    { clientId: "nebula-demo", scopes: ["nebula/*"], canWrite: true, canLink: true, canSnapshot: true },
  ]);
  atlasMemories.forEach(memory => authority.admit(memory, memory.scope.startsWith("atlas/") ? "atlas-demo" : "nebula-demo"));
  atlasEdges.forEach(edge => authority.link(edge, "atlas-demo"));
  return authority;
}
