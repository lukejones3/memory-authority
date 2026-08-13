import assert from "node:assert/strict";
import test from "node:test";
import { MemoryAuthority } from "./authority";
import { ATLAS_KEY, createAtlasAuthority } from "./atlas";

test("same state and query produce the exact same packet", () => {
  const authority = createAtlasAuthority();
  const first = authority.compile("Why keep the invoice ledger idempotency check?", "atlas-demo", "atlas/core");
  const second = authority.compile("Why keep the invoice ledger idempotency check?", "atlas-demo", "atlas/core");
  assert.equal(first.fingerprint, second.fingerprint);
  assert.equal(first.packetId, second.packetId);
  assert.deepEqual(first.memories, second.memories);
});

test("primary incident and executable test outrank generated summary", () => {
  const packet = createAtlasAuthority().compile(
    "invoice ledger idempotency incident provider retry test",
    "atlas-demo",
    "atlas/core",
  );
  assert.equal(packet.support, "supported");
  assert.ok(packet.memories.some(memory => memory.memoryId === "mem_incident_004"));
  assert.ok(packet.memories.some(memory => memory.memoryId === "mem_test_008"));
  assert.ok(!packet.memories.some(memory => memory.memoryId === "mem_summary_012"));
});

test("unsupported questions return a sealed empty packet", () => {
  const packet = createAtlasAuthority().compile(
    "Which lunar submarine caused the wedding outage?",
    "atlas-demo",
    "atlas/core",
  );
  assert.equal(packet.support, "unsupported");
  assert.equal(packet.memories.length, 0);
  assert.equal(packet.budget.used, 0);
});

test("cross-tenant reads are denied before candidate formation", () => {
  const authority = createAtlasAuthority();
  assert.throws(
    () => authority.compile("acquisition", "atlas-demo", "nebula/private"),
    /not granted scope/,
  );
});

test("missing client identity never inherits a privileged default", () => {
  const authority = createAtlasAuthority();
  assert.throws(
    () => authority.compile("ledger", "", "atlas/core"),
    /explicit client identity required/,
  );
});

test("snapshots contain ciphertext, not evidence plaintext", () => {
  const snapshot = createAtlasAuthority().snapshot("atlas-demo");
  const serialized = JSON.stringify(snapshot);
  assert.ok(snapshot.memories.length > 0);
  assert.ok(!serialized.includes("Eighteen accounts"));
  assert.ok(snapshot.memories.every(memory => memory.ciphertext && memory.nonce && memory.tag));
});

test("snapshot restore survives session compaction exactly", () => {
  const authority = createAtlasAuthority();
  const query = "What failed when the invoice ledger lookup was removed?";
  const before = authority.compile(query, "atlas-demo", "atlas/core");
  const restored = MemoryAuthority.restore(ATLAS_KEY, authority.snapshot("atlas-demo"));
  const after = restored.compile(query, "atlas-demo", "atlas/core");
  assert.equal(before.fingerprint, after.fingerprint);
  assert.equal(before.packetId, after.packetId);
});

test("cross-scope graph edges are forbidden", () => {
  const authority = createAtlasAuthority();
  authority.grant({ clientId: "admin", scopes: ["atlas/*", "nebula/*"], canWrite: true, canLink: true });
  assert.throws(
    () => authority.link({
      id: "bad", source: "mem_decision_017", target: "mem_nebula_secret",
      type: "DEPENDS_ON", provenance: "malicious",
    }, "admin"),
    /cross-scope edges are forbidden/,
  );
});
