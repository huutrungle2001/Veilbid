import { Link } from "react-router";

const navItems = [
  ["overview", "OVERVIEW"],
  ["quick-start", "QUICK START"],
  ["public", "PUBLIC EXPLORER"],
  ["buyer", "BUYER GUIDE"],
  ["vendor", "VENDOR GUIDE"],
  ["activity", "CLOSE & RECOVERY"],
  ["auditor", "AUDITOR"],
  ["safe", "SAFE TREASURY"],
  ["architecture", "ARCHITECTURE"],
  ["privacy", "PRIVACY"],
  ["evidence", "VERIFICATION"],
  ["troubleshooting", "TROUBLESHOOTING"],
  ["boundaries", "BOUNDARIES"],
] as const;

function StepList({
  steps,
}: {
  steps: readonly { title: string; copy: string }[];
}) {
  return (
    <ol className="docs-steps">
      {steps.map((step, index) => (
        <li key={step.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DocsPage() {
  return (
    <div className="marketing-page docs-page">
      <main className="docs-main" id="main-content">
        <aside className="docs-nav" aria-label="Documentation sections">
          <strong>ON THIS PAGE</strong>
          {navItems.map(([id, label]) => (
            <a href={`#${id}`} key={id}>{label}</a>
          ))}
        </aside>
        <article className="docs-content">
          <section id="overview">
            <p className="eyebrow">PROTOCOL GUIDE / SEPOLIA RELEASE</p>
            <h1>Use VeilBid from tender to settlement.</h1>
            <p className="docs-lede">
              VeilBid is a confidential procurement protocol for Safe
              treasuries. Buyers publish rules and escrow a public ceiling;
              approved vendors submit encrypted bids; iExec Nox selects the
              earliest valid minimum; the market verifies a public winner-ID
              proof before confidential settlement.
            </p>
            <div className="docs-callout">
              <strong>TESTNET NOTICE</strong>
              <p>
                This release runs on Ethereum Sepolia with test assets. Never
                paste a private key into the app. Wallet signatures remain in
                your selected browser wallet.
              </p>
            </div>
          </section>

          <section id="quick-start">
            <p className="eyebrow">QUICK START</p>
            <h2>Inspect first. Connect only when needed.</h2>
            <StepList steps={[
              { title: "Open Tenders", copy: "Use the TENDERS link to load confirmed public state. No wallet is required to browse; recent records are marked until finality." },
              { title: "Choose a workspace", copy: "Switch between Public, Buyer, Vendor, Activity, Auditor, and Safe Treasury from the workspace bar." },
              { title: "Use contextual help", copy: "Hover or focus the ? control at the upper-right of a workspace or beside Balances for page-specific instructions." },
              { title: "Connect your wallet", copy: "Select CONNECT WALLET beside the Sepolia indicator, then choose any detected EIP-6963 provider." },
              { title: "Confirm Sepolia", copy: "If your wallet is on another chain, use SWITCH TO SEPOLIA. Write actions stay unavailable on the wrong network." },
              { title: "Follow transaction progress", copy: "A bottom-right notification moves through validation, simulation, wallet signature, confirmation, and completion. Verify every target and value in the wallet prompt." },
              { title: "Refresh confirmed state", copy: "After confirmation, refresh the public dossier. It appears immediately with a finality-pending label; proof requests can be resumed from Activity if interrupted." },
            ]} />
            <div className="docs-actions">
              <Link className="primary-button" to="/room">OPEN TENDERS →</Link>
              <a className="secondary-button" href="#buyer">READ BUYER GUIDE</a>
            </div>
          </section>

          <section id="public">
            <p className="eyebrow">PUBLIC EXPLORER</p>
            <h2>Read canonical state without signing.</h2>
            <p>
              Public mode indexes confirmed Sepolia events and shows each
              tender’s ceiling, deadline, bid count, buyer, lifecycle status,
              winner where available, award receipt, and transaction
              fingerprints. It never substitutes mock tenders when RPC or
              indexing fails.
            </p>
            <ul className="docs-checklist">
              <li>Select a tender card to open its public dossier.</li>
              <li>Use the lifecycle and readiness labels to distinguish contract state from derived next actions.</li>
              <li>Inspect Sepolia links and receipt ownership for awarded tenders.</li>
              <li>Refresh to reread confirmed logs; recent records remain marked until the 12-block finality boundary.</li>
            </ul>
          </section>

          <section id="buyer">
            <p className="eyebrow">BUYER GUIDE</p>
            <h2>Create an exactly funded tender.</h2>
            <StepList steps={[
              { title: "Connect a Sepolia wallet", copy: "Open the Buyer workspace and connect the account that will own the tender. The demo uses test vUSDC only." },
              { title: "Define public terms", copy: "Enter public metadata, a public ceiling, a future bid deadline, and between one and eight approved vendor addresses." },
              { title: "Acquire and wrap test assets", copy: "Use GET TEST USDC, then WRAP TO vcUSDC to test confidential balances manually. Approve and wrap may require two wallet confirmations. The guided Buyer flow can instead acquire and wrap the exact ceiling automatically." },
              { title: "Authorize the market", copy: "Approve the market as the confidential-token operator required for escrow." },
              { title: "Create funded tender", copy: "Simulate, review, and sign the tender creation transaction. The public terms and encrypted budget are bound together." },
              { title: "Prove exact funding", copy: "Request the public equality result proving escrow equals the ceiling, without opening the confidential balance itself." },
              { title: "Open bidding", copy: "Confirm the proof on-chain. The tender becomes Open only after exact funding is verified." },
            ]} />
            <p className="docs-note">
              If the funding proof is interrupted, do not create another
              tender. Open Activity and resume the stored public checkpoint.
              The eye beside vcUSDC performs an explicit, session-only reveal
              and appears disabled when no confidential balance exists.
            </p>
          </section>

          <section id="vendor">
            <p className="eyebrow">VENDOR GUIDE</p>
            <h2>Submit one immutable sealed price.</h2>
            <StepList steps={[
              { title: "Connect the approved account", copy: "The connected address must occupy an approved vendor slot on an Open tender." },
              { title: "Select the tender", copy: "Check the public ceiling, deadline, buyer, and admission status before entering any private value." },
              { title: "Enter the bid privately", copy: "The plaintext exists only in the active browser session while the Nox input is prepared for this market." },
              { title: "Encrypt for the market", copy: "Bind the confidential input to the chain, market contract, tender, and connected vendor." },
              { title: "Simulate and sign", copy: "The app simulates the write first. Review the wallet request, sign once, and wait for confirmation." },
              { title: "Refresh the dossier", copy: "The public bid count updates, but neither the price nor a plaintext shadow value is indexed." },
            ]} />
            <div className="docs-callout">
              <strong>IMMUTABILITY</strong>
              <p>
                One approved address can submit one bid for its assigned slot.
                There is no edit or plaintext recovery path in the public UI.
              </p>
            </div>
          </section>

          <section id="activity">
            <p className="eyebrow">CLOSE, PROVE, SETTLE</p>
            <h2>Permissionless progress with resumable checkpoints.</h2>
            <p>
              Once the deadline passes, any connected Sepolia account can close
              an eligible tender. Nox performs the winner comparison, and only
              the encrypted winner identifier is deliberately sent through
              public decryption. The market verifies the proof and settles
              against its stored vendor mapping.
            </p>
            <StepList steps={[
              { title: "Close when ready", copy: "Activity derives close eligibility from confirmed public state and simulates the close transaction against canonical on-chain state." },
              { title: "Request winner proof", copy: "The relay requests public decryption for the winner ID, not for bid or settlement values." },
              { title: "Resume after interruption", copy: "Activity stores only public tender IDs and trigger transaction hashes; handles and proofs are reread when resuming." },
              { title: "Finalize once", copy: "On-chain proof verification and replay protection permit confidential vendor payment or the protocol’s full refund outcome." },
            ]} />
          </section>

          <section id="auditor">
            <p className="eyebrow">AUDITOR / SELECTIVE DISCLOSURE</p>
            <h2>Reveal one granted bid, not the whole auction.</h2>
            <p>
              A vendor can grant access to its own stored bid. After close, the
              buyer can grant a per-handle viewer. In Auditor, connect the
              intended viewer, select the public bid reference, check its ACL,
              and reveal only after authorization succeeds.
            </p>
            <ul className="docs-checklist">
              <li>The revealed value is session-only and clears when the wallet account or chain changes.</li>
              <li>A viewer grant provides no token operator, Safe signer, buyer, vendor, or administrator authority.</li>
              <li>Do not capture plaintext values in screenshots, logs, or committed evidence.</li>
            </ul>
          </section>

          <section id="safe">
            <p className="eyebrow">SAFE TREASURY</p>
            <h2>Preparation is not execution.</h2>
            <p>
              Choose any discovered Sepolia Safe owned by the connected wallet.
              VeilBid lets the connected wallet deposit confidential funding,
              then proposes tender setup, tender creation, balance-view grants,
              and unwraps through the Safe Transaction Service. Every treasury
              spend still satisfies that Safe’s configured threshold.
            </p>
            <StepList steps={[
              { title: "Select and fund", copy: "Select a Safe card or paste an address. DEPOSIT TO SAFE approves public test vUSDC from the connected wallet and wraps vcUSDC directly to that Safe." },
              { title: "Configure when creating", copy: "The tender form shows CONFIGURE THIS SAFE only when required. Its one-time threshold batch deploys/enables the deterministic module and binds the canonical Market." },
              { title: "Reveal only when needed", copy: "The eye grants the connected owner viewer access to the current balance handle, then decrypts only in this browser session. A new handle requires a new grant." },
              { title: "Enter an amount or use Full", copy: "The Full shortcut uses the encrypted balance directly without reveal. A custom amount first reveals the current balance privately, then encrypts only that amount for an atomic preparation + wrapper batch." },
              { title: "Finalize the public exit", copy: "After the Safe executes, FINALIZE UNWRAP completes the permissionless public proof and releases public vUSDC to the connected wallet. The amount and recipient become public; remaining vcUSDC and bid values stay confidential." },
            ]} />
            <div className="docs-callout">
              <strong>AUTHORITY BOUNDARY</strong>
              <p>
                Neither preparation contract can execute from the Safe, custody
                funds, or bypass owners. Multi-owner proposals remain pending
                until the normal threshold is reached.
              </p>
            </div>
          </section>

          <section id="architecture">
            <p className="eyebrow">ARCHITECTURE</p>
            <h2>Four boundaries, one settlement path.</h2>
            <dl className="docs-definition-grid">
              <div><dt>Tender Room</dt><dd>Wallet-free public index plus Buyer, Vendor, Activity, Auditor, and Safe workspaces.</dd></div>
              <div><dt>Auction House</dt><dd>Non-upgradeable market, ERC-7984 demo assets, non-transferable receipt, and preparation-only Safe module.</dd></div>
              <div><dt>Settlement Relay</dt><dd>Stateless permissionless close and finalize automation with bounded, sequential actions.</dd></div>
              <div><dt>Operator Console</dt><dd>Strict-schema MCP stdio tools with no signer, write, or private-decryption surface.</dd></div>
            </dl>
            <p>
              Chain bindings provide canonical ABIs, release addresses, event
              codecs, domain types, and the public index shared by these
              components.
            </p>
          </section>

          <section id="privacy">
            <p className="eyebrow">PRIVACY MAP</p>
            <h2>Public coordination is not anonymous bidding.</h2>
            <div className="privacy-table" role="table" aria-label="Data visibility">
              <div role="row"><strong role="cell">Public</strong><span role="cell">Tender ID, buyer, vendors, ceiling, deadline, status, winner, hashes, receipt.</span></div>
              <div role="row"><strong role="cell">Confidential</strong><span role="cell">Bid values, best price, payment and refund values, confidential balances.</span></div>
              <div role="row"><strong role="cell">Selective</strong><span role="cell">One stored bid may be revealed only to its vendor or explicit per-handle viewers.</span></div>
            </div>
          </section>

          <section id="evidence">
            <p className="eyebrow">VERIFICATION</p>
            <h2>Evidence stays useful—and sanitized.</h2>
            <p>
              The release records public chain IDs, block numbers, contract
              addresses, transaction hashes, statuses, runtime mappings, and
              lifecycle assertions. It excludes private keys, wallet
              signatures, plaintext bids, confidential balance values,
              encrypted handles, and proof bytes.
            </p>
            <ul className="docs-checklist">
              <li>Runtime bytecode and source mappings are checked against the canonical release manifest.</li>
              <li>Sepolia evidence covers exact funding, encrypted argmin, public winner proof, confidential settlement, refund, and Safe authority boundaries.</li>
              <li>Frontend smoke checks exercise wallet-free loading, responsive rendering, navigation, and keyboard focus.</li>
            </ul>
            <Link className="primary-button" to="/room">INSPECT PUBLIC STATE →</Link>
          </section>

          <section id="troubleshooting">
            <p className="eyebrow">TROUBLESHOOTING</p>
            <h2>Recover without inventing state.</h2>
            <dl className="troubleshooting-list">
              <div><dt>No wallet detected</dt><dd>Unlock or install an EIP-6963 compatible browser wallet, then reload. Public mode remains available.</dd></div>
              <div><dt>Wrong network</dt><dd>Open the header wallet menu and select SWITCH TO SEPOLIA. Write actions remain disabled until chain 11155111 is active.</dd></div>
              <div><dt>Public state unavailable</dt><dd>Retry the Sepolia read. VeilBid deliberately shows an error instead of substituting mock data.</dd></div>
              <div><dt>Safe assets are not listed</dt><dd>Safe Buyer intentionally shows only vcUSDC. Open the selected account in Safe Wallet to inspect or transfer public ETH, vUSDC, and unrelated assets.</dd></div>
              <div><dt>Custom unwrap is unavailable</dt><dd>Reveal the current Safe vcUSDC balance first. Full unwrap does not require reveal. Both modes need the Safe threshold, followed by public-proof finalization.</dd></div>
              <div><dt>Proof request interrupted</dt><dd>Open Activity and resume the public checkpoint. Do not repeat tender creation or submit an alternate winner.</dd></div>
              <div><dt>Auditor cannot reveal</dt><dd>Confirm the connected account has a grant for that exact bid handle; access to another bid does not carry over.</dd></div>
              <div><dt>Safe action unavailable</dt><dd>Confirm the connected wallet is a Safe owner and the live module is enabled. Enabling or re-enabling it requires a normal Safe threshold transaction.</dd></div>
            </dl>
          </section>

          <section id="boundaries">
            <p className="eyebrow">NON-CLAIMS</p>
            <h2>What VeilBid does not promise.</h2>
            <ul>
              <li>Bidder identities, timing, tender metadata, and transaction graphs are public.</li>
              <li>VeilBid does not verify delivered service quality or prevent off-chain collusion.</li>
              <li>The current release is Sepolia test infrastructure, not audited or mainnet-ready software.</li>
              <li>A closed tender waits for a valid Nox proof; there is no buyer timeout override or plaintext fallback.</li>
              <li>Safe preparation does not bypass the Safe threshold, and auditor access does not imply custody authority.</li>
            </ul>
            <div className="docs-actions">
              <Link className="primary-button" to="/room">USE THE APP →</Link>
              <a className="secondary-button" href="#overview">BACK TO TOP ↑</a>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
