CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS memory_authority;

CREATE TABLE IF NOT EXISTS memory_authority.memories (
  memory_id text PRIMARY KEY,
  privacy_scope text NOT NULL,
  memory_type text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','superseded','retracted')),
  source_namespace text NOT NULL,
  source_id text NOT NULL,
  revision integer NOT NULL DEFAULT 1,
  event_time timestamptz NOT NULL,
  valid_from timestamptz,
  valid_until timestamptz,
  primary_evidence boolean NOT NULL DEFAULT false,
  pinned boolean NOT NULL DEFAULT false,
  ciphertext bytea NOT NULL,
  nonce bytea NOT NULL,
  content_hash text NOT NULL,
  key_version integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}',
  provenance jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_namespace, source_id, revision)
);

CREATE TABLE IF NOT EXISTS memory_authority.lexical_terms (
  term_digest text NOT NULL,
  memory_id text NOT NULL REFERENCES memory_authority.memories(memory_id) ON DELETE CASCADE,
  term_frequency real NOT NULL DEFAULT 1,
  PRIMARY KEY (term_digest, memory_id)
);
CREATE INDEX IF NOT EXISTS lexical_terms_lookup
  ON memory_authority.lexical_terms(term_digest, memory_id);

CREATE TABLE IF NOT EXISTS memory_authority.semantic_vectors (
  memory_id text NOT NULL REFERENCES memory_authority.memories(memory_id) ON DELETE CASCADE,
  model_name text NOT NULL,
  transform_version text NOT NULL,
  transform_fingerprint text NOT NULL,
  content_hash text NOT NULL,
  vector_hash text NOT NULL,
  embedding vector(384) NOT NULL,
  PRIMARY KEY (memory_id, model_name, transform_version)
);
CREATE INDEX IF NOT EXISTS semantic_vectors_hnsw
  ON memory_authority.semantic_vectors
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 128);

CREATE TABLE IF NOT EXISTS memory_authority.edges (
  edge_id text PRIMARY KEY,
  source_memory_id text NOT NULL REFERENCES memory_authority.memories(memory_id) ON DELETE CASCADE,
  target_memory_id text NOT NULL REFERENCES memory_authority.memories(memory_id) ON DELETE CASCADE,
  edge_type text NOT NULL,
  weight real NOT NULL DEFAULT 1,
  confidence real NOT NULL DEFAULT 1,
  provenance jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source_memory_id <> target_memory_id)
);
CREATE INDEX IF NOT EXISTS edges_source ON memory_authority.edges(source_memory_id, edge_type);
CREATE INDEX IF NOT EXISTS edges_target ON memory_authority.edges(target_memory_id, edge_type);

CREATE TABLE IF NOT EXISTS memory_authority.client_grants (
  client_id text PRIMARY KEY,
  allowed_scopes text[] NOT NULL,
  can_write boolean NOT NULL DEFAULT false,
  can_link boolean NOT NULL DEFAULT false,
  can_snapshot boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memory_authority.context_packs (
  context_pack_id text PRIMARY KEY,
  client_id text NOT NULL REFERENCES memory_authority.client_grants(client_id),
  privacy_scope text NOT NULL,
  query_hash text NOT NULL,
  compiler_version text NOT NULL,
  artifact_fingerprint text NOT NULL,
  packet_fingerprint text NOT NULL,
  support_status text NOT NULL,
  budget_chars integer NOT NULL,
  used_chars integer NOT NULL,
  selection jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memory_authority.snapshots (
  snapshot_id text PRIMARY KEY,
  ledger_count bigint NOT NULL,
  ledger_fingerprint text NOT NULL,
  semantic_fingerprint text NOT NULL,
  edge_fingerprint text NOT NULL,
  grant_fingerprint text NOT NULL,
  artifact_fingerprint text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
