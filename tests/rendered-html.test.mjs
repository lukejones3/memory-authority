import assert from "node:assert/strict";
import test from "node:test";

async function request(path = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, init),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the complete Memory Authority demo", async () => {
  const response = await request("/", { headers: { accept: "text/html" } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Memory Authority/);
  assert.match(html, /Memory decisions outside the model/);
  assert.match(html, /Ask the synthetic history anything/);
  assert.match(html, /synthetic demo only/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

async function compile(query, scope = "atlas/core") {
  const response = await request("/api/demo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, scope, budgetChars: 4000 }),
  });
  return { response, body: await response.json() };
}

test("interactive route runs the real authority and replays deterministically", async () => {
  const first = await compile("Why keep the invoice ledger idempotency check?");
  const second = await compile("Why keep the invoice ledger idempotency check?");
  assert.equal(first.response.status, 200);
  assert.equal(first.body.packet.support, "supported");
  assert.ok(first.body.packet.memories.some(memory => memory.memoryId === "mem_decision_017"));
  assert.equal(first.body.packet.fingerprint, second.body.packet.fingerprint);
  assert.equal(first.body.packet.packetId, second.body.packet.packetId);
  assert.equal(first.body.replayVerified, true);
});

test("interactive route abstains and denies before retrieval", async () => {
  const unsupported = await compile("Which lunar submarine caused the wedding outage?");
  assert.equal(unsupported.response.status, 200);
  assert.equal(unsupported.body.packet.support, "unsupported");
  assert.deepEqual(unsupported.body.packet.memories, []);
  assert.equal(unsupported.body.packet.budget.used, 0);

  const denied = await compile("Read the unreleased acquisition plan", "nebula/private");
  assert.equal(denied.response.status, 200);
  assert.equal(denied.body.denied, true);
  assert.equal(denied.body.packet.support, "denied");
  assert.equal(denied.body.packet.candidates, 0);
  assert.deepEqual(denied.body.packet.memories, []);
  assert.match(denied.body.packet.trace.join(" "), /zero evidence decrypted/);
});
