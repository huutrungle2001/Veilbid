export function DocsPage() {
  return (
    <div className="marketing-page docs-page">
      <header className="topbar">
        <a className="skip-link" href="#main-content">SKIP TO CONTENT</a>
        <a className="wordmark" href="/" aria-label="VeilBid home">VEILBID</a>
        <nav aria-label="Primary navigation">
          <a href="/room">TENDER ROOM</a>
          <a href="#architecture">ARCHITECTURE</a>
          <a href="#boundaries">BOUNDARIES</a>
        </nav>
        <div className="network-pill"><span aria-hidden="true" />SEPOLIA</div>
      </header>
      <main className="docs-main" id="main-content">
        <aside className="docs-nav" aria-label="Documentation sections">
          <a href="#overview">OVERVIEW</a>
          <a href="#architecture">ARCHITECTURE</a>
          <a href="#privacy">PRIVACY</a>
          <a href="#safe">SAFE AUTHORITY</a>
          <a href="#evidence">EVIDENCE</a>
          <a href="#boundaries">BOUNDARIES</a>
        </aside>
        <article className="docs-content">
          <section id="overview">
            <p className="eyebrow">PROTOCOL GUIDE / HACKATHON BUILD</p>
            <h1>How VeilBid keeps procurement prices sealed.</h1>
            <p className="docs-lede">
              Buyers publish tender rules and escrow the public ceiling.
              Approved vendors submit encrypted bids. iExec Nox computes the
              earliest valid minimum, then the market verifies a public
              winner-ID proof before confidential settlement.
            </p>
          </section>
          <section id="architecture">
            <p className="eyebrow">ARCHITECTURE</p>
            <h2>Four boundaries, one settlement path.</h2>
            <dl className="docs-definition-grid">
              <div><dt>Tender Room</dt><dd>Wallet-free public index plus Buyer, Vendor, Activity, Auditor, and Safe workspaces.</dd></div>
              <div><dt>Auction House</dt><dd>Non-upgradeable market, ERC-7984 demo assets, receipt, and preparation-only Safe module.</dd></div>
              <div><dt>Settlement Relay</dt><dd>Stateless permissionless close/finalize automation with bounded sequential actions.</dd></div>
              <div><dt>Operator Console</dt><dd>Five strict-schema MCP stdio tools with no signer, write, or private-decryption surface.</dd></div>
            </dl>
          </section>
          <section id="privacy">
            <p className="eyebrow">PRIVACY MAP</p>
            <h2>Public coordination is not anonymous bidding.</h2>
            <div className="privacy-table" role="table" aria-label="Data visibility">
              <div role="row"><strong role="cell">Public</strong><span role="cell">Tender ID, buyer, vendors, ceiling, deadline, status, winner, hashes, receipt.</span></div>
              <div role="row"><strong role="cell">Confidential</strong><span role="cell">Bid values, best price, payment/refund values, confidential balances.</span></div>
              <div role="row"><strong role="cell">Selective</strong><span role="cell">One stored bid may be revealed only to its vendor or explicit per-handle viewers.</span></div>
            </div>
          </section>
          <section id="safe">
            <p className="eyebrow">SAFE AUTHORITY</p>
            <h2>Preparation is not execution.</h2>
            <p>
              The restricted module binds chain, Safe, module, market,
              complete tender terms, encrypted budget, and nonce. It cannot
              call the Safe or transfer funds. Tender creation still requires
              a normal transaction satisfying the Safe threshold.
            </p>
          </section>
          <section id="evidence">
            <p className="eyebrow">VERIFICATION</p>
            <h2>Evidence stays useful—and sanitized.</h2>
            <p>
              Public evidence records chain IDs, blocks, addresses,
              transaction hashes, statuses, runtime checks, and lifecycle
              assertions. It excludes private keys, signatures, plaintext
              bids, balance values, encrypted handles, and proof bytes.
            </p>
            <a className="primary-button" href="/room">INSPECT PUBLIC STATE →</a>
          </section>
          <section id="boundaries">
            <p className="eyebrow">NON-CLAIMS</p>
            <h2>What VeilBid does not promise.</h2>
            <ul>
              <li>Bidder identities, timing, tender metadata, and transaction graphs are public.</li>
              <li>VeilBid does not verify service quality or prevent off-chain collusion.</li>
              <li>The current release is Sepolia test infrastructure, not audited mainnet software.</li>
              <li>A closed tender waits for a valid Nox proof; there is no buyer timeout override.</li>
            </ul>
          </section>
        </article>
      </main>
    </div>
  );
}
