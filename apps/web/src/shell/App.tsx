import type { PublicMarketIndex, PublicTender } from "@veilbid/chain-bindings";
import { getTenderReadiness } from "@veilbid/chain-bindings";
import deployment from "@veilbid/chain-bindings/addresses/sepolia.release";
import { useMemo } from "react";
import { formatUnits } from "viem";
import { useLocation, useSearchParams } from "react-router";
import type { LoadedPublicMarket } from "../public-market/loadPublicMarket";
import {
  type PublicMarketState,
  usePublicMarket,
} from "../public-market/usePublicMarket";
import { useWallet } from "../wallet/useWallet";
import type { WalletController } from "../wallet/WalletPanel";
import { WalletBalancePanel } from "../wallet/WalletBalancePanel";
import { ActivityWorkspace } from "../activity/ActivityWorkspace";
import { SafeTreasuryWorkspace } from "../safe/SafeTreasuryWorkspace";
import { DocsPage } from "../landing/DocsPage";
import { LandingPage } from "../landing/LandingPage";
import { PrimaryNavigation } from "./PrimaryNavigation";
import { ContextHelp } from "./ContextHelp";
import {
  RoleWorkspace,
  type InteractiveRole,
} from "../workspaces/RoleWorkspace";

type RoomRole =
  | "PUBLIC"
  | InteractiveRole
  | "ACTIVITY"
  | "SAFE TREASURY";

type PublicTenderFilter =
  | "current"
  | "all"
  | "awarded"
  | "refunded"
  | "cancelled";

const publicTenderFilters: ReadonlyArray<{
  value: PublicTenderFilter;
  label: string;
}> = [
  { value: "current", label: "Current & awarded" },
  { value: "all", label: "All tenders" },
  { value: "awarded", label: "Awarded" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
];

function isPublicTenderFilter(value: string | null): value is PublicTenderFilter {
  return publicTenderFilters.some((option) => option.value === value);
}

function filterPublicTenders(
  tenders: readonly PublicTender[],
  filter: PublicTenderFilter,
) {
  if (filter === "all") return tenders;
  if (filter === "current") {
    return tenders.filter((tender) =>
      ["FundingPending", "Open", "Closed", "Awarded"].includes(tender.status),
    );
  }
  const status = filter === "cancelled" ? "Cancelled" :
    filter[0].toUpperCase() + filter.slice(1);
  return tenders.filter((tender) => tender.status === status);
}

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
          <strong>{tender.bidCount}/{tender.approvedVendorCount}</strong>
          Bids received
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
  indexedBlock,
  finalizedBlock,
}: {
  tender: PublicTender;
  indexedBlock: bigint;
  finalizedBlock: bigint;
}) {
  const finalityPending = tender.updatedBlock > finalizedBlock;
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
          <span>
            Derived from confirmed public state, not a contract status.
          </span>
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
          <dt>Review wallet</dt>
          <dd title={tender.reviewViewer}>{shortAddress(tender.reviewViewer)}</dd>
        </div>
        <div>
          <dt>Sealed bids</dt>
          <dd>{tender.bidCount} / {tender.approvedVendorCount} vendors</dd>
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
        <p className="eyebrow">
          {finalityPending ? "CONFIRMED / FINALITY PENDING" : "FINALIZED EVIDENCE"}
        </p>
        <dl>
          <div>
            <dt>Chain</dt>
            <dd>Ethereum Sepolia / 11155111</dd>
          </div>
          <div>
            <dt>Indexed through</dt>
            <dd>Block {indexedBlock.toString()}</dd>
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
  const requestedFilter = searchParams.get("status");
  const publicFilter: PublicTenderFilter = isPublicTenderFilter(requestedFilter)
    ? requestedFilter
    : "current";
  const visibleTenders = useMemo(() => {
    const filtered = filterPublicTenders(index.tenders, publicFilter);
    return activeRole === "PUBLIC" ? filtered : index.tenders;
  }, [activeRole, index.tenders, publicFilter]);
  const selectedId = searchParams.get("tender");
  const selected = useMemo(
    () =>
      visibleTenders.find(
        (tender) => tender.tenderId.toString() === selectedId,
      ) ??
      visibleTenders[0] ??
      null,
    [selectedId, visibleTenders],
  );

  function changePublicFilter(nextFilter: PublicTenderFilter) {
    const next = new URLSearchParams(searchParams);
    if (nextFilter === "current") next.delete("status");
    else next.set("status", nextFilter);
    if (
      selectedId &&
      !filterPublicTenders(index.tenders, nextFilter).some(
        (tender) => tender.tenderId.toString() === selectedId,
      )
    ) {
      next.delete("tender");
    }
    setSearchParams(next);
  }

  return (
    <div className="tender-layout">
      <div className="rolebar" aria-label="Tender workspaces">
        <div className="rolebar-links">
          {([
            ["PUBLIC", "PUBLIC"],
            ["SAFE TREASURY", "SAFE BUYER"],
            ["BUYER", "EOA BUYER"],
            ["VENDOR", "PRIVATE BIDS"],
            ["ACTIVITY", "ACTIVITY"],
          ] as const).map(([role, label]) => {
              const interactive =
                role === "PUBLIC" ||
                role === "BUYER" ||
                role === "VENDOR" ||
                role === "ACTIVITY" ||
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
                  {label}
                </button>
              );
            },
          )}
        </div>
        {wallet && <WalletBalancePanel wallet={wallet} />}
      </div>

      <div className="tender-surface">
        {activeRole === "ACTIVITY" && wallet ? (
          <ActivityWorkspace
            wallet={wallet}
            tenders={index.tenders}
            onRefresh={onRetry}
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
              <ContextHelp
                label="Help for Public workspace"
                title="HOW TO USE PUBLIC"
                steps={[
                  "Choose a confirmed tender from the dossier list.",
                  "Review its public ceiling, deadline, lifecycle, buyer, bid count, and award status.",
                  "Use refresh to reread confirmed Sepolia events when a transaction has just mined.",
                ]}
                note="No wallet is required. Bid prices and confidential balances never appear in this public index."
              />
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
                  Browse confirmed tender coordination without connecting a
                  wallet. Recent records remain marked until finality; prices
                  and confidential balances are never indexed here.
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
                  <h2>Reading confirmed Sepolia logs</h2>
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
                  <h2>No confirmed tenders found</h2>
                  <p>The explorer is connected; no public tender events exist yet.</p>
                </div>
              </section>
            )}

            {state.status === "ready" && state.data && (
              <section className="explorer-grid" id="tenders">
                <aside className="dossier-list" aria-label="Public tenders">
                  <header>
                    <div>
                      <p className="eyebrow">CONFIRMED DOSSIERS</p>
                      <h2>{visibleTenders.length} tenders</h2>
                    </div>
                    <button
                      className="icon-button"
                      onClick={onRetry}
                      aria-label="Refresh confirmed Sepolia state"
                    >
                      ↻
                    </button>
                  </header>
                  <label className="public-filter-control">
                    <span>Show</span>
                    <select
                      aria-label="Filter public tenders"
                      value={publicFilter}
                      onChange={(event) =>
                        changePublicFilter(event.target.value as PublicTenderFilter)
                      }
                    >
                      {publicTenderFilters.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {visibleTenders.length === 0 && (
                    <p className="form-empty-hint">
                      No tenders match this filter. Choose “All tenders” to
                      inspect cancelled and refunded history.
                    </p>
                  )}
                  {visibleTenders.map((tender) => (
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
                {selected ? (
                  <TenderDetail
                    tender={selected}
                    indexedBlock={state.data.indexedBlock}
                    finalizedBlock={state.data.finalizedBlock}
                  />
                ) : (
                  <section className="state-panel">
                    <span aria-hidden="true">0</span>
                    <div>
                      <h2>No tenders match this filter</h2>
                      <p>
                        Choose “All tenders” to inspect the public history.
                      </p>
                    </div>
                  </section>
                )}
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
      </div>
    </div>
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
    requestedRole === "SAFE TREASURY"
      ? requestedRole
      : requestedRole === "AUDITOR"
        ? "VENDOR"
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
