"use client";

import { useEffect, useMemo, useState } from "react";
import { scenarios } from "./demo-data";

type View = "packet" | "scores" | "graph" | "replay";
type DemoResult = {
  query: string;
  denied?: boolean;
  answer: string;
  replayVerified: boolean;
  packet: {
    packetId: string;
    fingerprint: string;
    compilerVersion: string;
    clientId: string;
    scope: string;
    support: string;
    budget: { limit: number; used: number };
    candidates: number;
    memories: Array<{
      memoryId: string; title: string; type: string; text: string; source: string; eventTime: string; score: number;
      selected: boolean; reasons: string[]; components: { lexical: number; graph: number; authority: number; recency: number; status: number };
    }>;
    trace: string[];
  };
  graph: { nodes: Array<{ id: string; label: string; type: string; selected: boolean; status: string }>; edges: Array<{ from: string; to: string; type: string }> };
};

const DEFAULT_QUERY = "Why does the invoice ledger still need the idempotency guard?";

function short(value: string, length = 16) {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}
export function MemoryAuthorityDemo() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [scope, setScope] = useState("atlas/core");
  const [view, setView] = useState<View>("packet");
  const [result, setResult] = useState<DemoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [runNumber, setRunNumber] = useState(0);

  const run = async (nextQuery = query, nextScope = scope) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: nextQuery, scope: nextScope, budgetChars: 4_000 }) });
      const data = await response.json() as DemoResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? `Compiler failed (${response.status})`);
      setResult(data);
      setRunNumber(value => value + 1);
      setView("packet");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Compiler failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void run(DEFAULT_QUERY, "atlas/core"), 0);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (id: string) => {
    const scenario = scenarios.find(item => item.id === id) ?? scenarios[0];
    const nextScope = id === "denied" ? "nebula/private" : "atlas/core";
    setQuery(scenario.query);
    setScope(nextScope);
    void run(scenario.query, nextScope);
  };

  const graph = useMemo(() => {
    const nodes = result?.graph.nodes ?? [];
    return nodes.map((node, index) => ({ ...node, x: 12 + ((index * 31) % 76), y: 20 + ((index * 47) % 62) }));
  }, [result]);

  return <main>
    <nav className="nav shell">
      <a className="brand" href="#top"><span className="brand-mark"><i /><i /><i /></span><span>MEMORY AUTHORITY</span></a>
      <div className="nav-links"><a href="#explorer">Compiler</a><a href="#architecture">Architecture</a><a href="https://github.com/lukejones3/memory-authority" target="_blank" rel="noreferrer">Source ↗</a></div>
    </nav>

    <section className="hero shell" id="top">
      <div className="hero-copy">
        <div className="eyebrow">WORKING REFERENCE IMPLEMENTATION · SYNTHETIC DATA</div>
        <h1>Memory decisions outside the model.</h1>
        <p className="hero-lede">Encrypted evidence enters a deterministic compiler before inference. Identity, scope, provenance, supersession, graph traversal, support, and context budget are explicit—and replayable.</p>
        <div className="hero-actions"><a className="button primary" href="#explorer">Run the compiler</a><a className="button secondary" href="https://github.com/lukejones3/memory-authority" target="_blank" rel="noreferrer">Inspect source</a></div>
      </div>
      <div className="hero-machine">
        <div className="machine-top"><span>LIVE AUTHORITY</span><span className="mono">{result?.packet.compilerVersion ?? "starting"}</span></div>
        <div className="summary-list">
          <div><span>1</span><p><b>Authorize</b><small>Explicit client and scope before decryption.</small></p></div>
          <div><span>2</span><p><b>Compile</b><small>Primary evidence, typed graph, validity, and budget.</small></p></div>
          <div><span>3</span><p><b>Seal</b><small>Same state + request = same packet fingerprint.</small></p></div>
        </div>
        <div className="summary-result"><span>LAST RUN</span><code>{result ? short(result.packet.packetId, 23) : "waiting"}</code><b>{loading ? "compiling" : result?.packet.support ?? "ready"}</b></div>
      </div>
    </section>

    <section className="proof-strip"><div className="shell proof-grid">
      <div><strong>Encrypted</strong><span>AES-GCM evidence ledger</span></div><div><strong>Scoped</strong><span>deny before candidate formation</span></div><div><strong>Typed</strong><span>causal and supersession graph</span></div><div><strong>Empty</strong><span>when evidence is unsupported</span></div><div><strong>Replayable</strong><span>SHA-256 packet fingerprint</span></div>
    </div></section>

    <section className="explorer shell" id="explorer">
      <div className="section-head"><div><span className="section-number">LIVE COMPILER</span><h2>Ask the synthetic history anything.</h2></div><p>This form calls the real encrypted authority. The quick cases set inputs; they do not swap in prewritten output.</p></div>
      <div className="scenario-rail">{scenarios.map((item, index) => <button key={item.id} onClick={() => choose(item.id)}><span>{String(index + 1).padStart(2, "0")}</span><b>{item.label}</b><small>{item.kicker}</small></button>)}</div>

      <div className="live-workbench">
        <aside className="live-input">
          <div className="panel-label">REQUEST / CLIENT: ATLAS-DEMO</div>
          <label><span>Question</span><textarea value={query} onChange={event => setQuery(event.target.value)} rows={7} maxLength={600} /></label>
          <label><span>Requested scope</span><select value={scope} onChange={event => setScope(event.target.value)}><option value="atlas/core">atlas/core · granted</option><option value="nebula/private">nebula/private · denied</option></select></label>
          <button className="compile-button" disabled={loading || !query.trim()} onClick={() => void run()}>{loading ? "Compiling evidence…" : "Compile context packet"}<span>→</span></button>
          {error ? <p className="compile-error">{error}</p> : null}
          <div className="trace-list"><div className="panel-label">DETERMINISTIC TRACE / RUN {String(runNumber).padStart(3, "0")}</div>{result?.packet.trace.map((line, index) => <div key={`${line}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{line}</p><b>✓</b></div>)}</div>
        </aside>

        <section className="live-result">
          <header className="result-topbar"><div><span>CONTEXT PACK</span><b>{result?.packet.packetId ?? "not compiled"}</b></div><span className={`status status-${result?.packet.support ?? "contextual"}`}>{loading ? "running" : result?.packet.support ?? "ready"}</span><div className="fingerprint"><span>FINGERPRINT</span><b>{result ? short(result.packet.fingerprint, 24) : "—"}</b></div></header>
          <div className="view-tabs">{(["packet", "scores", "graph", "replay"] as View[]).map(item => <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item}</button>)}<span>{result ? `${result.packet.budget.used.toLocaleString()} / ${result.packet.budget.limit.toLocaleString()} chars` : "0 / 4,000 chars"}</span></div>

          {view === "packet" ? <div className="packet-view">
            <div className="model-answer"><div className="answer-head"><span>COMPILED ANSWER PREVIEW</span><small>deterministic extract, no hidden LLM call</small></div><p>{result?.answer ?? "Compile a question to inspect the packet."}</p></div>
            <div className="memory-stack">{result?.packet.memories.length ? result.packet.memories.map((memory, index) => <article key={memory.memoryId}><div className="memory-index">{String(index + 1).padStart(2, "0")}</div><div className="memory-body"><div className="memory-meta"><span className={`type type-${memory.type}`}>{memory.type}</span><time>{new Date(memory.eventTime).toLocaleDateString()}</time><b>{memory.score.toFixed(3)}</b></div><h3>{memory.title}</h3><p>{memory.text}</p><code>{memory.source}</code></div></article>) : <div className="empty-packet"><strong>{result?.denied ? "ACCESS DENIED" : "SEALED EMPTY PACKET"}</strong><p>No evidence crossed the authority boundary.</p></div>}</div>
          </div> : null}

          {view === "scores" ? <div className="score-view">{result?.packet.memories.length ? result.packet.memories.map(memory => <article key={memory.memoryId}><header><div><span>{memory.type}</span><h3>{memory.title}</h3></div><strong>{memory.score.toFixed(3)}</strong></header>{Object.entries(memory.components).map(([name, score]) => <div className="score-line" key={name}><span>{name}</span><i><b style={{ width: `${Math.max(0, Math.min(100, Number(score) * 100))}%` }} /></i><code>{Number(score).toFixed(3)}</code></div>)}<p>{memory.reasons.join(" · ")}</p></article>) : <div className="empty-packet"><strong>ZERO CANDIDATES PACKED</strong><p>Nothing was supplied downstream.</p></div>}</div> : null}

          {view === "graph" ? <div className="live-graph"><div className="graph-stage">{result?.graph.edges.map(edge => { const from = graph.find(node => node.id === edge.from); const to = graph.find(node => node.id === edge.to); if (!from || !to) return null; const dx = to.x - from.x, dy = to.y - from.y, width = Math.sqrt(dx * dx + dy * dy), angle = Math.atan2(dy, dx) * 180 / Math.PI; return <div className="edge" key={`${edge.from}-${edge.to}`} style={{ left: `${from.x}%`, top: `${from.y}%`, width: `${width}%`, transform: `rotate(${angle}deg)` }}><span>{edge.type}</span></div>; })}{graph.map(node => <div className={`graph-node node-${node.type} ${node.selected ? "selected" : ""}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} key={node.id}><i />{node.label}</div>)}</div><p>{result?.graph.edges.length ?? 0} typed relationships survived scope and packet selection.</p></div> : null}

          {view === "replay" ? <div className="replay-view"><div className="packet-seal"><span>PACKET FINGERPRINT</span><b>{result?.packet.fingerprint ?? "—"}</b><small>{result?.packet.packetId ?? "not compiled"}</small></div><div className="replay-arrow"><i /><span>SECOND COMPILATION</span><i /></div><div className="replay-verdict"><strong>{result?.replayVerified ? "IDENTICAL" : "MISMATCH"}</strong><p>Same encrypted state, client, scope, query, and budget returned {result?.replayVerified ? "the same bytes" : "different evidence"}.</p></div></div> : null}
        </section>
      </div>
    </section>

    <section className="architecture" id="architecture"><div className="shell"><div className="section-head light"><div><span className="section-number">BOUNDARY</span><h2>The model is downstream.</h2></div><p>It can reason over the packet. It cannot silently decide identity, scope, what counts as memory, which version is current, or whether unsupported history should be invented.</p></div><div className="architecture-flow">{["Events + artifacts", "Encrypted ledger", "Typed causal graph", "Deterministic compiler", "Sealed packet", "Any model client"].map((label, index) => <div key={label}><span>{String(index + 1).padStart(2, "0")}</span><b>{label}</b>{index < 5 ? <i>→</i> : null}</div>)}</div></div></section>
    <footer className="shell"><div className="brand"><span className="brand-mark"><i /><i /><i /></span><span>MEMORY AUTHORITY</span></div><p>Evidence before inference.</p><span className="mono">Apache-2.0 · synthetic demo only</span></footer>
  </main>;
}
