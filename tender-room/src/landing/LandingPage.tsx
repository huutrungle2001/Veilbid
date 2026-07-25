export function LandingPage() {
  return (
    <div className="marketing-page">
      <header className="topbar">
        <a className="skip-link" href="#main-content">SKIP TO CONTENT</a>
        <a className="wordmark" href="/" aria-label="VeilBid home">
          VEILBID
        </a>
        <nav aria-label="Primary navigation">
          <a href="/room">TENDER ROOM</a>
          <a href="/docs">DOCS</a>
          <a href="/docs#evidence">EVIDENCE</a>
        </nav>
        <div className="network-pill">
          <span aria-hidden="true" />
          SEPOLIA
        </div>
      </header>

      <main className="landing-main" id="main-content">
        <section className="landing-hero">
          <p className="eyebrow">CONFIDENTIAL PROCUREMENT / SAFE TREASURIES</p>
          <h1>
            Lowest valid bid.
            <br />
            <em>Without publishing prices.</em>
          </h1>
          <div className="landing-lede">
            <p>
              VeilBid combines public tender rules, encrypted vendor bids,
              Nox-computed selection, proof-derived awards, and confidential
              ERC-7984 settlement on Ethereum Sepolia.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="/room">
                OPEN TENDER ROOM →
              </a>
              <a className="secondary-button" href="/docs">
                READ THE PROTOCOL
              </a>
            </div>
          </div>
        </section>

        <section className="landing-proof-grid" aria-label="Protocol pillars">
          {[
            ["01", "PUBLIC RULES", "Tender terms, deadlines, bidders, status, winner, and transaction evidence remain inspectable."],
            ["02", "PRIVATE PRICES", "Bid values and confidential payment amounts remain Nox handles rather than a plaintext shadow ledger."],
            ["03", "SAFE AUTHORITY", "Preparation can bind encrypted inputs, but only a threshold-authorized Safe transaction can move Safe-owned funds."],
            ["04", "PROOF-DERIVED AWARD", "The market verifies the publicly decrypted winner ID and settles against the stored vendor—never a client-supplied winner."],
          ].map(([number, title, copy]) => (
            <article key={number}>
              <span>{number}</span>
              <h2>{title}</h2>
              <p>{copy}</p>
            </article>
          ))}
        </section>

        <section className="landing-flow">
          <div>
            <p className="eyebrow">ONE VERIFIABLE LIFECYCLE</p>
            <h2>Fund → Bid → Close → Prove → Settle</h2>
          </div>
          <ol>
            <li><strong>BUYER</strong><span>Escrows exactly the public ceiling.</span></li>
            <li><strong>VENDORS</strong><span>Submit encrypted prices into fixed public slots.</span></li>
            <li><strong>NOX</strong><span>Selects the earliest valid minimum while values stay encrypted.</span></li>
            <li><strong>ANYONE</strong><span>Finalizes the proof-derived winner or full refund.</span></li>
          </ol>
        </section>

        <section className="truth-panel">
          <p className="eyebrow">CURRENT RELEASE TRUTH</p>
          <h2>Real Sepolia state. Explicit test boundaries.</h2>
          <p>
            The connected deployment is reusable E2E infrastructure and is not
            yet explorer-verified as the canonical release. VeilBid does not
            claim anonymous bidders, hidden metadata, formal auditing, or
            mainnet readiness.
          </p>
          <a className="text-link" href="/docs#boundaries">SEE ALL BOUNDARIES →</a>
        </section>
      </main>
    </div>
  );
}
