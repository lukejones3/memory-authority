# Memory Authority

**Evidence before inference. Memory outside the model.**

Memory Authority is a model-independent encrypted memory system that makes
memory selection an explicit, deterministic system responsibility. It stores
provenance-bearing evidence, preserves causal and supersession topology,
compiles a bounded context pack, fingerprints the result, and supplies the same
packet to any model client.

It is not a chatbot memory wrapper and not a vector-search demo.

## See it

The interactive Atlas demo exposes:

- a primary architecture decision;
- the failed predecessor and production incident;
- the remediation and executable regression test;
- candidate scores and rejection reasons;
- typed graph traversal;
- identical replay to Codex and Claude;
- cross-scope denial;
- unsupported-query abstention;
- continuity after session compaction.

All public evidence is synthetic. No personal Human Repo data is included.

## Run

```bash
npm install
npm run dev
npm run test:authority
npm run authority:query -- "Why must InvoiceLedger keep the idempotency check?"
```

For PostgreSQL + pgvector:

```bash
docker compose up -d
```

## Core invariants

1. No privileged default client identity.
2. Scope authorization happens before decryption and candidate formation.
3. Derived summaries never silently become primary evidence.
4. Search creates candidates; the deterministic compiler creates the packet.
5. Unsupported queries produce empty packets.
6. Same state, query, grant, compiler, and budget produce the same fingerprint.
7. Snapshots bind ledger, semantic authority, graph, grants, and compiler
   artifacts.

Read [Architecture](docs/ARCHITECTURE.md), [Threat model](docs/THREAT_MODEL.md),
[Evaluation](docs/EVALUATION.md), and [Install](docs/INSTALL.md).

## Status

The repository contains a working reference compiler and synthetic evaluation
surface. The private production authority that motivated it currently mirrors
1.17M canonical events with full semantic coverage and passes its frozen exact
and broad retrieval suites.

Apache-2.0.
