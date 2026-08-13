# Architecture

Memory Authority is a model-independent selection boundary. It does not ask an
LLM what should be remembered or what should be retrieved.

```text
events / commits / decisions / incidents / tests
                    ↓
          encrypted append-only ledger
                    ↓
    blind lexical index + keyed semantic geometry
                    ↓
 typed causal graph + validity + supersession state
                    ↓
       deterministic candidate compiler
                    ↓
 support gate → evidence packing → packet fingerprint
                    ↓
      MCP / SDK → Codex, Claude, local models
```

## What is deterministic

Given the same ledger snapshot, grants, compiler artifact fingerprint, query,
scope, and budget, compilation emits the same candidate scores, selected
records, order, packet ID, and SHA-256 fingerprint.

The downstream model may reason differently. It cannot silently change which
historical evidence it received.

## Memory layers

1. **Primary evidence** — original messages, commits, decisions, incidents,
   tests, and artifacts.
2. **Derived memory** — summaries, episodes, facets, and state snapshots with
   explicit source lineage.
3. **Typed edges** — causal and historical relations such as `CAUSED`,
   `FAILED_BECAUSE`, `RESOLVED_BY`, `VERIFIED_BY`, and `SUPERSEDED_BY`.
4. **Validity** — active, superseded, retracted, valid-from, and valid-until
   state prevents old truth from masquerading as current truth.
5. **Context packs** — immutable receipts containing support status, budget,
   provenance, selected memory IDs, compiler version, and fingerprint.

## Retrieval is not authority

Lexical, vector, temporal, and graph search produce candidates. They do not
decide the final packet individually. The compiler scores across evidence
authority, query coverage, graph structure, source quality, validity, and
context budget. A polished derived summary can therefore lose to a less fluent
primary record.

## Software-product memory

For codebases, the unit is not only a chunk of code. It includes:

- the decision that created a constraint;
- the failed predecessor;
- the incident produced by violating it;
- the commit that restored it;
- the test that makes the lesson executable;
- the supersession chain when architecture changes.

That turns repository retrieval into accumulated engineering experience rather
than file search.
