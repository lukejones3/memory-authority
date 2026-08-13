"use client";

import { useMemo, useState } from "react";
import { scenarios } from "./demo-data";

type View = "packet" | "candidates" | "graph" | "replay";

function StatusPill({ status }: { status: string }) {
  return <span className={`status status-${status}`}>{status}</span>;
}

export function MemoryAuthorityDemo() {
  const [scenarioId, setScenarioId] = useState("decision");
  const [view, setView] = useState<View>("packet");
  const [ran, setRan] = useState(1);
  const scenario = useMemo(
    () => scenarios.find(item => item.id === scenarioId) ?? scenarios[0],
    [scenarioId]
  );
  const selected = scenario.candidates.filter(item => item.selected);

  const choose = (id: string) => {
    setScenarioId(id);
    setView("packet");
    setRan(value => value + 1);
  };

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="Memory Authority home">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>MEMORY AUTHORITY</span>
        </a>
        <div className="nav-links">
          <a href="#explorer">Live explorer</a>
          <a href="#architecture">Architecture</a>
          <a href="#install">Install</a>
          <a className="repo-link" href="https://github.com/lukejones3/memory-authority" target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> THE MODEL DOES NOT CHOOSE ITS MEMORIES</div>
          <h1>Memory belongs<br /><em>outside</em> the model.</h1>
          <p className="hero-lede">
            A deterministic, encrypted authority compiles provenance-bearing evidence before inference—then replays the exact same context into any model.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#explorer">Run the authority <span>↓</span></a>
            <a className="button secondary" href="#architecture">See the system</a>
          </div>
        </div>
        <div className="hero-machine" aria-label="Memory authority pipeline">
          <div className="machine-top">
            <span>AUTHORITY / LIVE</span>
            <span className="mono muted">compiler v2.4.0</span>
          </div>
          <div className="vault-orbit">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="vault-core">
              <span className="core-label">ENCRYPTED<br />EVIDENCE</span>
              <strong>8</strong>
              <small>candidates</small>
            </div>
            <span className="satellite sat-a">DECISION</span>
            <span className="satellite sat-b">INCIDENT</span>
            <span className="satellite sat-c">TEST</span>
            <span className="satellite sat-d">CHANGE</span>
          </div>
          <div className="compile-strip">
            <div><span>01</span><b>verify</b><small>client + scope</small></div>
            <div><span>02</span><b>compile</b><small>rank + traverse</small></div>
            <div><span>03</span><b>seal</b><small>packet fingerprint</small></div>
          </div>
        </div>
      </section>

      <section className="proof-strip">
        <div className="shell proof-grid">
          <div><strong>100%</strong><span>exact target recall</span></div>
          <div><strong>10/10</strong><span>broad retrieval suite</span></div>
          <div><strong>0</strong><span>fabricated memories</span></div>
          <div><strong>1.17M</strong><span>private events mirrored</span></div>
          <div><strong>SHA-256</strong><span>replay fingerprint</span></div>
        </div>
      </section>

      <section className="explorer shell" id="explorer">
        <div className="section-head">
          <div>
            <span className="section-number">01 / LIVE SYSTEM</span>
            <h2>Watch memory become evidence.</h2>
          </div>
          <p>Select a failure mode. The authority exposes what it considered, why it selected or rejected each record, and what the model actually received.</p>
        </div>

        <div className="scenario-rail" role="tablist" aria-label="Demo scenarios">
          {scenarios.map((item, index) => (
            <button
              key={item.id}
              className={item.id === scenarioId ? "active" : ""}
              onClick={() => choose(item.id)}
              role="tab"
              aria-selected={item.id === scenarioId}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{item.label}</b>
              <small>{item.kicker}</small>
            </button>
          ))}
        </div>

        <div className="workbench">
          <div className="query-column">
            <div className="panel-label">INPUT / CLIENT: ATLAS-DEMO</div>
            <div className="query-box">
              <span className="prompt-symbol">›</span>
              <p>{scenario.query}</p>
              <button onClick={() => setRan(value => value + 1)} aria-label="Run current scenario">Run <span>⌘↵</span></button>
            </div>
            <div className="route-card">
              <span>ROUTE</span>
              <p>{scenario.route}</p>
              <div className="route-line"><i /><i /><i className={scenario.support} /></div>
            </div>
            <div className="trace-list">
              <div className="panel-label">DETERMINISTIC TRACE / RUN {String(ran).padStart(3, "0")}</div>
              {scenario.trace.map((line, index) => (
                <div key={line}><span>{String(index + 1).padStart(2, "0")}</span><p>{line}</p><b>✓</b></div>
              ))}
            </div>
          </div>

          <div className="result-column">
            <div className="result-topbar">
              <div><span>CONTEXT PACK</span><b>{scenario.packetId}</b></div>
              <StatusPill status={scenario.support} />
              <div className="fingerprint"><span>FINGERPRINT</span><b>{scenario.fingerprint}</b></div>
            </div>
            <div className="view-tabs" role="tablist">
              {(["packet", "candidates", "graph", "replay"] as View[]).map(item => (
                <button key={item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item}</button>
              ))}
              <span>{scenario.budget}</span>
            </div>

            {view === "packet" && (
              <div className="packet-view">
                <div className="model-answer">
                  <div className="answer-head"><span>MODEL RESPONSE</span><small>grounded only in the sealed packet</small></div>
                  <p>{scenario.answer}</p>
                </div>
                <div className="memory-stack">
                  {selected.length ? selected.map((memory, index) => (
                    <article key={memory.id}>
                      <div className="memory-index">{String(index + 1).padStart(2, "0")}</div>
                      <div className="memory-body">
                        <div className="memory-meta"><span className={`type type-${memory.type}`}>{memory.type}</span><time>{memory.date}</time><b>{memory.score.toFixed(3)}</b></div>
                        <h3>{memory.title}</h3>
                        <p>{memory.text}</p>
                        <code>{memory.source}</code>
                      </div>
                    </article>
                  )) : (
                    <div className="empty-packet"><strong>{scenario.support === "denied" ? "ACCESS DENIED" : "EMPTY PACKET"}</strong><p>No evidence crossed the authority boundary.</p></div>
                  )}
                </div>
              </div>
            )}

            {view === "candidates" && (
              <div className="candidate-view">
                <div className="candidate-head"><span>RECORD</span><span>SCORE COMPOSITION</span><span>DECISION</span></div>
                {scenario.candidates.length ? scenario.candidates.map(candidate => (
                  <div className={`candidate-row ${candidate.selected ? "is-selected" : "is-rejected"}`} key={candidate.id}>
                    <div><b>{candidate.title}</b><code>{candidate.id}</code></div>
                    <div className="score-bars">
                      <span style={{ "--score": candidate.lexical } as React.CSSProperties}><i />lex {candidate.lexical.toFixed(2)}</span>
                      <span style={{ "--score": candidate.graph } as React.CSSProperties}><i />graph {candidate.graph.toFixed(2)}</span>
                      <span style={{ "--score": candidate.authority } as React.CSSProperties}><i />source {candidate.authority.toFixed(2)}</span>
                    </div>
                    <div><strong>{candidate.score.toFixed(3)}</strong><small>{candidate.reason}</small></div>
                  </div>
                )) : <div className="empty-packet"><strong>ZERO CANDIDATES</strong><p>The request was stopped before retrieval.</p></div>}
              </div>
            )}

            {view === "graph" && (
              <div className="graph-view">
                <div className="graph-stage">
                  {scenario.edges.map(edge => {
                    const from = scenario.nodes.find(node => node.id === edge.from)!;
                    const to = scenario.nodes.find(node => node.id === edge.to)!;
                    const dx = to.x - from.x;
                    const dy = to.y - from.y;
                    const width = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                    return <div className="edge" key={`${edge.from}-${edge.to}`} style={{ left: `${from.x + 5}%`, top: `${from.y + 5}%`, width: `${width}%`, transform: `rotate(${angle}deg)` }}><span>{edge.label}</span></div>;
                  })}
                  {scenario.nodes.map(node => <div className={`graph-node node-${node.kind}`} key={node.id} style={{ left: `${node.x}%`, top: `${node.y}%` }}><i />{node.label}</div>)}
                </div>
                <div className="graph-legend"><span><i className="decision" /> decision</span><span><i className="incident" /> incident</span><span><i className="test" /> executable proof</span><span><i className="denied" /> authority boundary</span></div>
              </div>
            )}

            {view === "replay" && (
              <div className="replay-view">
                <div className="packet-seal"><span>SEALED ONCE</span><b>{scenario.fingerprint}</b><small>{scenario.packetId}</small></div>
                <div className="replay-arrow"><i /><span>IDENTICAL BYTES</span><i /></div>
                <div className="client-pair">
                  <article><span className="client-icon codex-icon">C</span><div><small>CLIENT A</small><h3>Codex</h3><code>{scenario.fingerprint}</code></div><b>verified</b></article>
                  <article><span className="client-icon claude-icon">A</span><div><small>CLIENT B</small><h3>Claude</h3><code>{scenario.fingerprint}</code></div><b>verified</b></article>
                </div>
                <p className="replay-note">The models may reason differently. They do not get to silently rewrite, omit, or invent the historical evidence supplied to them.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="architecture" id="architecture">
        <div className="shell">
          <div className="section-head light">
            <div><span className="section-number">02 / ARCHITECTURE</span><h2>Not RAG with a memory label.</h2></div>
            <p>The model is downstream of identity, scope, encryption, candidate formation, graph traversal, packing, support classification, and replay proof.</p>
          </div>
          <div className="architecture-flow">
            {["Events + artifacts", "Encrypted ledger", "Typed causal graph", "Deterministic compiler", "Sealed context pack", "Any model client"].map((label, index) => (
              <div key={label}><span>{String(index + 1).padStart(2, "0")}</span><b>{label}</b>{index < 5 && <i>→</i>}</div>
            ))}
          </div>
          <div className="principle-grid">
            <article><span>01</span><h3>Memory decisions leave the model</h3><p>Storage, validity, supersession, ranking, scope, and packing are explicit system behavior—not latent model preference.</p></article>
            <article><span>02</span><h3>Primary evidence outranks polish</h3><p>Original decisions, incidents, commits, tests, and messages beat later summaries that merely sound authoritative.</p></article>
            <article><span>03</span><h3>History remains typed</h3><p>FAILED_BECAUSE, SUPERSEDED_BY, CAUSED, RESOLVED_BY, and VERIFIED_BY preserve why code and products became what they are.</p></article>
            <article><span>04</span><h3>Unsupported means empty</h3><p>When support is absent, the compiler seals an empty packet. The model cannot convert a plausible story into a memory.</p></article>
          </div>
        </div>
      </section>

      <section className="install shell" id="install">
        <div className="install-copy">
          <span className="section-number">03 / RUN IT</span>
          <h2>Give an agent institutional memory without giving it authority over memory.</h2>
          <p>The repository includes the deterministic compiler, AES-GCM ledger, HMAC semantic transform, PostgreSQL + pgvector schema, scoped client grants, MCP adapter, synthetic Atlas corpus, frozen evaluation suite, and threat model.</p>
          <a className="button primary dark-button" href="https://github.com/lukejones3/memory-authority" target="_blank" rel="noreferrer">Open the repository ↗</a>
        </div>
        <div className="code-window">
          <div className="code-title"><span><i /><i /><i /></span><b>terminal</b><small>atlas-demo</small></div>
          <pre><code><span className="dim"># start PostgreSQL + pgvector</span>{"\n"}<span className="prompt">$</span> docker compose up -d{"\n\n"}<span className="dim"># install and seed synthetic history</span>{"\n"}<span className="prompt">$</span> npm install{"\n"}<span className="prompt">$</span> npm run authority:seed{"\n\n"}<span className="dim"># compile a deterministic packet</span>{"\n"}<span className="prompt">$</span> npm run authority:query -- \\{"\n"}  <span className="string">&quot;Why does InvoiceLedger keep the guard?&quot;</span>{"\n\n"}<span className="success">✓ ctx_atlas_01J8Z6QK · 7a91c4e8…c21f</span></code></pre>
        </div>
      </section>

      <footer className="shell">
        <div className="brand"><span className="brand-mark"><i /><i /><i /></span><span>MEMORY AUTHORITY</span></div>
        <p>Evidence before inference. Memory outside the model.</p>
        <span className="mono">Apache-2.0 · synthetic demo data only</span>
      </footer>
    </main>
  );
}
