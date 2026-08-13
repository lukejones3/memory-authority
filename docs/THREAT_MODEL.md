# Threat model

## Protected assets

- memory plaintext;
- cross-tenant isolation;
- semantic geometry;
- packet integrity and replay proof;
- historical validity and provenance;
- client capabilities.

## Defenses

### Explicit identity

No client inherits a privileged default. Missing identity fails closed.

### Scope before decryption

The client grant is checked before candidate formation. Edges may not cross
privacy scopes. Snapshot, write, and link permissions are independent.

### Encrypted evidence

Memory bodies use AES-256-GCM with record ID and scope as additional
authenticated data. Search terms use purpose-separated HMAC digests. A
production semantic transform must be keyed, versioned, and fingerprinted.

### Provenance over fluency

Generated summaries remain derived records with source edges. They are not
allowed to silently become primary evidence.

### Replay integrity

Snapshots bind ledger rows, semantic-vector authority, edges, grants, compiler
artifacts, schema, runtime, and retrieval index configuration. Context packs
bind the query hash, selected evidence, order, budget, and compiler version.

## Explicit non-goals

- Protecting plaintext after an authorized model client receives its packet.
- Claiming deterministic downstream reasoning.
- Treating embedding similarity as proof.
- Automatically converting model output into authoritative memory.
