# Install

Requirements: Node 22+ and Docker.

```bash
npm install
docker compose up -d
npm run authority:query -- "Why keep the invoice ledger idempotency check?"
npm run test:authority
```

The included CLI and website use a synthetic corpus. Replace the in-memory
adapter with PostgreSQL using `migrations/001_memory_authority.sql`, retain the
same `MemoryAuthority` compiler contract, and expose `context_pack` through the
MCP adapter.

In production, inject the 32-byte root key through a secrets manager. Never use
the synthetic Atlas key outside the demo.
