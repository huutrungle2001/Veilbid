import type { PublicMarketIndex, PublicTender } from "@veilbid/chain-bindings";
import { getTenderReadiness } from "@veilbid/chain-bindings";
import deployment from "@veilbid/chain-bindings/addresses/sepolia.release";
import { useMemo } from "react";
import { formatUnits } from "viem";
import { useLocation, useSearchParams } from "react-router-dom";
import type { LoadedPublicMarket } from "../public-market/loadPublicMarket";
import {
  type PublicMarketState,
  usePublicMarket,
} from "../public-market/usePublicMarket";
import { useWallet } from "../wallet/useWallet";
import type { WalletController } from "../wallet/WalletPanel";
import { ActivityWorkspace } from "../activity/ActivityWorkspace";
import { AuditorWorkspace } from "../auditor/AuditorWorkspace";
import { SafeTreasuryWorkspace } from "../safe/SafeTreasuryWorkspace";
import { DocsPage } from "../landing/DocsPage";
import { LandingPage } from "../landing/LandingPage";
import { PrimaryNavigation } from "./PrimaryNavigation";
import {
  RoleWorkspace,
  type InteractiveRole,
} from "../workspaces/RoleWorkspace";

type RoomRole =
  | "PUBLIC"
  | InteractiveRole
  | "ACTIVITY"
  | "AUDITOR"
  | "SAFE TREASURY";

const zeroIndex: PublicMarketIndex = {
  tenders: [],
  bids: [],
  checkpoint: null,
};

function shortAddress(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function timestampLabel(timestamp: bigint) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(Number(timestamp) * 1_000));
}

function StatusBadge({ status }: { status: PublicTender["status"] }) {
  const verified = ["Awarded", "Refunded"].includes(status);
  const encrypted = ["Open", "Closed"].includes(status);
  return (
    <span
      className={`privacy-badge ${
        verified ? "verified" : encrypted ? "encrypted" : ""
      }`}
    >
      <span aria-hidden="true">
        {verified ? "✓" : encrypted ? "◆" : "◌"}
      </span>
      {status.toUpperCase()}
    </span>
  );
}

function TenderCard({
  tender,
  selected,
  onSelect,
}: {
  tender: PublicTender;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`tender-card ${selected ? "selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="card-kicker">TENDER / {tender.tenderId.toString()}</span>
      <span className="card-title">
        Confidential procurement #{tender.tenderId.toString()}
      </span>
      <span className="card-facts">
        <span>
          <strong>{formatUnits(tender.publicCeiling, 6)} vUSDC</strong>
          Public ceiling
        </span>
        <span>
          <strong>{tender.bidCount}</strong>
          Sealed bids
        </span>
      </span>
      <span className="card-deadline">
        Deadline · {timestampLabel(tender.bidDeadline)}
      </span>
      <span className="card-footer">
        <StatusBadge status={tender.status} />
        <span className="card-arrow" aria-hidden="true">
          →
        </span>
      </span>
    </button>
  );
}

function Lifecycle({ tender }: { tender: PublicTender }) {
  const sequence = ["FundingPending", "Open", "Closed"] as const;
  const final =
    tender.status === "Awarded" || tender.status === "Refunded"
      ? tender.status
      : "Awarded / Refunded";
  const steps = [...sequence, final];
  const activeIndex = sequence.includes(
    tender.status as (typeof sequence)[number],
  )
    ? sequence.indexOf(tender.status as (typeof sequence)[number])
    : 3;
  return (
    <ol className="lifecycle" aria-label="Tender lifecycle">
      {steps.map((step, index) => (
        <li
          key={step}
          className={
            index < activeIndex
              ? "complete"
              : index === activeIndex
                ? "active"
                : ""
          }
        >
          <span>{index < activeIndex ? "✓" : index + 1}</span>
          {step.replace(/([A-Z])/g, " $1").trim().toUpperCase()}
        </li>
      ))}
    </ol>
  );
}

function AwardReceiptPanel({ tender }: { tender: PublicTender }) {
  if (tender.status !== "Awarded" || !tender.winner) return null;
  const receiptAddress = deployment.contracts.VeilBidAwardReceipt.address;
  return (
    <section className="receipt-panel" aria-label="Award receipt evidence">
      <div>
        <p className="eyebrow">NON-TRANSFERABLE AWARD RECEIPT</p>
        <h3>Receipt #{tender.tenderId.toString()}</h3>
        <p>
          Minted atomically to the proof-derived winner. Approval, transfer,
          and receiver-callback paths are disabled by the receipt contract.
        </p>
      </div>
      <dl>
        <div><dt>Owner</dt><dd title={tender.winner}>{shortAddress(tender.winner)}</dd></div>
        <div><dt>Contract</dt><dd title={receiptAddress}>{shortAddress(receiptAddress)}</dd></div>
        <div><dt>Finalization tx</dt><dd title={tender.updatedTransaction}>{shortAddress(tender.updatedTransaction)}</dd></div>
        <div><dt>Transferability</dt><dd>DISABLED</dd></div>
      </dl>
      <a
        className="text-link"
        href={`https://sepolia.etherscan.io/token/${receiptAddress}?a=${tender.tenderId.toString()}`}
        target="_blank"
        rel="noreferrer"
      >
        INSPECT ON SEPOLIA ↗
      </a>
    </section>
  );
}

function TenderDetail({
  tender,
  finalizedBlock,
}: {
  tender: PublicTender;
  finalizedBlock: bigint;
}) {
  const readiness = getTenderReadiness(
    tender,
    BigInt(Math.floor(Date.now() / 1_000)),
  );
  const readinessLabel = readiness.needsFundingProof
    ? "VERIFYING ESCROW"
    : readiness.canClose
      ? "CLOSE READY"
      : readiness.needsWinnerProof
        ? "PUBLIC PROOF PENDING"
        : readiness.terminal
          ? "TERMINAL / VERIFIED ON-CHAIN"
          : "ACCEPTING SEALED BIDS";

  return (
    <article className="detail-panel">
      <header className="detail-header">
        <div>
          <p className="eyebrow">PUBLIC DOSSIER / TENDER {tender.tenderId.toString()}</p>
          <h2>Procurement terms stay public. Prices stay sealed.</h2>
        </div>
        <StatusBadge status={tender.status} />
      </header>

      <Lifecycle tender={tender} />

      <section className="readiness-strip">
        <span className="signal-dot" aria-hidden="true" />
        <div>
          <strong>{readinessLabel}</strong>
          <span>Derived from finalized public state, not a contract status.</span>
        </div>
      </section>

      <dl className="term-grid">
        <div>
          <dt>Public ceiling</dt>
          <dd>{formatUnits(tender.publicCeiling, 6)} vUSDC</dd>
        </div>
        <div>
          <dt>Bid deadline</dt>
          <dd>{timestampLabel(tender.bidDeadline)} UTC</dd>
        </div>
        <div>
          <dt>Buyer / Safe</dt>
          <dd title={tender.buyer}>{shortAddress(tender.buyer)}</dd>
        </div>
        <div>
          <dt>Sealed bids</dt>
          <dd>{tender.bidCount}</dd>
        </div>
      </dl>

      <section className="privacy-panel">
        <div className="aperture" aria-hidden="true">
          <span />
        </div>
        <div>
          <p className="eyebrow">PUBLIC WINNER / PRIVATE PRICE</p>
          <h3>
            {tender.winner
              ? `Awarded to ${shortAddress(tender.winner)}`
              : "Winner is proof-derived after close"}
          </h3>
          <p>
            Bid values never enter this public index. Only the winner ID is
            deliberately opened for on-chain proof verification.
          </p>
          <div className="badge-row">
            <span className="privacy-badge encrypted">◆ ENCRYPTED PRICE</span>
            <span className="privacy-badge">◎ PUBLIC METADATA</span>
          </div>
        </div>
      </section>

      <AwardReceiptPanel tender={tender} />

      <section className="evidence-panel">
        <p className="eyebrow">FINALIZED EVIDENCE</p>
        <dl>
          <div>
            <dt>Chain</dt>
            <dd>Ethereum Sepolia / 11155111</dd>
          </div>
          <div>
            <dt>Finalized through</dt>
            <dd>Block {finalizedBlock.toString()}</dd>
          </div>
          <div>
            <dt>Metadata fingerprint</dt>
            <dd title={tender.metadataHash}>
              {shortAddress(tender.metadataHash)}
            </dd>
          </div>
          <div>
            <dt>Last transaction</dt>
            <dd title={tender.updatedTransaction}>
              {shortAddress(tender.updatedTransaction)}
            </dd>
          </div>
        </dl>
      </section>
    </article>
  );
}

export function ExplorerView({
  state,
  onRetry,
  activeRole = "PUBLIC",
  onRoleChange,
  wallet,
}: {
  state: PublicMarketState;
  onRetry: () => void;
  activeRole?: RoomRole;
  onRoleChange?: (role: RoomRole) => void;
  wallet?: WalletController;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const index = state.data?.index ?? zeroIndex;
  const deploymentKind = state.data?.deploymentKind ?? deployment.kind;
  const deploymentVerified =
    state.data?.deploymentVerified ?? deployment.verified;
  const selectedId = searchParams.get("tender");
  const selected = useMemo(
    () =>
      index.tenders.find(
        (tender) => tender.tenderId.toString() === selectedId,
      ) ??
      index.tenders[0] ??
      null,
    [index.tenders, selectedId],
  );

  return (
    <>
      <div className="rolebar" aria-label="Tender workspaces">
        {["PUBLIC", "BUYER", "VENDOR", "ACTIVITY", "AUDITOR", "SAFE TREASURY"].map(
          (role) => {
            const interactive =
              role === "PUBLIC" ||
              role === "BUYER" ||
              role === "VENDOR" ||
              role === "ACTIVITY" ||
              role === "AUDITOR" ||
              role === "SAFE TREASURY";
            const enabled = role === "PUBLIC" || (interactive && Boolean(wallet));
            return (
              <button
                key={role}
                className={role === activeRole ? "active" : ""}
                aria-pressed={role === activeRole}
                disabled={!enabled}
                onClick={() =>
                  enabled && onRoleChange?.(role as RoomRole)
                }
                title={
                  enabled
                    ? `${role} workspace`
                    : "Role workspace is not enabled in this release slice"
                }
              >
                {role}
              </button>
            );
          },
        )}
      </div>

      {activeRole === "ACTIVITY" && wallet ? (
        <ActivityWorkspace
          wallet={wallet}
          tenders={index.tenders}
          onRefresh={onRetry}
        />
      ) : activeRole === "AUDITOR" && wallet ? (
        <AuditorWorkspace
          wallet={wallet}
          tenders={index.tenders}
          bids={index.bids}
        />
      ) : activeRole === "SAFE TREASURY" && wallet ? (
        <SafeTreasuryWorkspace wallet={wallet} />
      ) : (activeRole === "BUYER" || activeRole === "VENDOR") && wallet ? (
        <RoleWorkspace
          role={activeRole}
          wallet={wallet}
          tenders={index.tenders}
          bids={index.bids}
          onRefresh={onRetry}
        />
      ) : (
        <main id="main-content">
          <section className="explorer-intro">
          <div>
            <p className="eyebrow">CONFIDENTIAL PROCUREMENT / LIVE TEST STATE</p>
            <h1>
              Public terms.
              <br />
              <em>Private bids.</em>
            </h1>
          </div>
          <div className="intro-copy">
            <p>
              Browse finalized tender coordination without connecting a
              wallet. Prices and confidential balances are never indexed here.
            </p>
            <span className="deployment-label">
              {deploymentKind.toUpperCase()} DEPLOYMENT ·{" "}
              {deploymentVerified
                ? "SOURCE/DEPLOYMENT VERIFIED"
                : "NOT SOURCE/DEPLOYMENT VERIFIED"}
            </span>
          </div>
        </section>

          {state.status === "loading" && (
          <section className="state-panel" aria-live="polite">
            <span className="loading-mark" aria-hidden="true" />
            <div>
              <h2>Reading finalized Sepolia logs</h2>
              <p>No placeholder tenders are shown while public state loads.</p>
            </div>
          </section>
        )}

          {state.status === "error" && (
          <section className="state-panel error" role="alert">
            <span aria-hidden="true">!</span>
            <div>
              <h2>Public state unavailable</h2>
              <p>{state.error}</p>
              <button className="secondary-button" onClick={onRetry}>
                RETRY SEPOLIA →
              </button>
            </div>
          </section>
        )}

          {state.status === "ready" && index.tenders.length === 0 && (
          <section className="state-panel">
            <span aria-hidden="true">0</span>
            <div>
              <h2>No finalized tenders found</h2>
              <p>The explorer is connected; no public tender events exist yet.</p>
            </div>
          </section>
        )}

          {state.status === "ready" && selected && state.data && (
          <section className="explorer-grid" id="tenders">
            <aside className="dossier-list" aria-label="Public tenders">
              <header>
                <div>
                  <p className="eyebrow">FINALIZED DOSSIERS</p>
                  <h2>{index.tenders.length} tenders</h2>
                </div>
                <button
                  className="icon-button"
                  onClick={onRetry}
                  aria-label="Refresh finalized Sepolia state"
                >
                  ↻
                </button>
              </header>
              {index.tenders.map((tender) => (
                <TenderCard
                  key={tender.tenderId.toString()}
                  tender={tender}
                  selected={selected.tenderId === tender.tenderId}
                  onSelect={() =>
                    setSearchParams({ tender: tender.tenderId.toString() })
                  }
                />
              ))}
            </aside>
            <TenderDetail
              tender={selected}
              finalizedBlock={state.data.finalizedBlock}
            />
          </section>
          )}
        </main>
      )}

      <footer id="evidence">
        <div>
          <span className="wordmark inverted">VEILBID</span>
          <p>Confidential procurement for Safe treasuries.</p>
        </div>
        <div className="footer-meta">
          <span>ETHEREUM SEPOLIA</span>
          <span>TEST ASSETS ONLY</span>
          <span>UNAUDITED HACKATHON SOFTWARE</span>
        </div>
      </footer>
    </>
  );
}

function TenderRoomApp({ wallet }: { wallet: WalletController }) {
  const { state, refresh } = usePublicMarket();
  const [roomParams, setRoomParams] = useSearchParams();
  const requestedRole = roomParams.get("role")?.toUpperCase();
  const activeRole: RoomRole =
    requestedRole === "BUYER" ||
    requestedRole === "VENDOR" ||
    requestedRole === "ACTIVITY" ||
    requestedRole === "AUDITOR" ||
    requestedRole === "SAFE TREASURY"
      ? requestedRole
      : "PUBLIC";
  const setActiveRole = (role: RoomRole) => {
    const next = new URLSearchParams(roomParams);
    if (role === "PUBLIC") next.delete("role");
    else next.set("role", role.toLowerCase());
    setRoomParams(next);
  };
  return (
    <ExplorerView
      state={state}
      onRetry={() => void refresh()}
      activeRole={activeRole}
      onRoleChange={setActiveRole}
      wallet={wallet}
    />
  );
}

export function App() {
  const location = useLocation();
  const wallet = useWallet();
  const legacyRoomLink =
    new URLSearchParams(location.search).has("role") ||
    new URLSearchParams(location.search).has("tender");
  const page =
    location.pathname === "/docs" ? (
      <DocsPage />
    ) : location.pathname === "/room" || legacyRoomLink ? (
      <TenderRoomApp wallet={wallet} />
    ) : (
      <LandingPage />
    );
  return (
    <>
      <PrimaryNavigation wallet={wallet} />
      {page}
    </>
  );
}

export type { LoadedPublicMarket };
