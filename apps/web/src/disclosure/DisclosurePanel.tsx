import type { PublicBid, PublicTender } from "@veilbid/chain-bindings";
import { useEffect, useMemo, useState } from "react";
import { revealAuthorizedBid } from "../auditor/revealBid";
import type { WalletController } from "../wallet/WalletPanel";
import type { InteractiveRole } from "../workspaces/RoleWorkspace";
import { grantStoredBidViewer } from "./grantViewer";

export function eligibleDisclosureBids(
  role: InteractiveRole,
  account: string | null,
  tenders: readonly PublicTender[],
  bids: readonly PublicBid[],
) {
  if (!account) return [];
  return bids.filter((bid) => {
    const tender = tenders.find((item) => item.tenderId === bid.tenderId);
    return role === "VENDOR"
      ? bid.vendor.toLowerCase() === account.toLowerCase()
      : tender?.buyer.toLowerCase() === account.toLowerCase() &&
          !["FundingPending", "Open"].includes(tender.status);
  });
}

export function DisclosurePanel({
  role,
  wallet,
  tenders,
  bids,
  onConfirmed,
}: {
  role: InteractiveRole;
  wallet: WalletController;
  tenders: readonly PublicTender[];
  bids: readonly PublicBid[];
  onConfirmed: () => void;
}) {
  const account = wallet.state.account;
  const eligible = useMemo(
    () => eligibleDisclosureBids(role, account, tenders, bids),
    [account, bids, role, tenders],
  );
  const [selectedKey, setSelectedKey] = useState("");
  const [viewer, setViewer] = useState("");
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [grantResult, setGrantResult] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selected = eligible.find(
    (bid) => `${bid.tenderId}:${bid.bidId}` === selectedKey,
  );
  const connected =
    wallet.state.status === "connected" &&
    wallet.state.walletClient &&
    wallet.state.account;

  useEffect(() => {
    setPlaintext(null);
    setGrantResult(null);
    setStage(null);
    setError(null);
  }, [selectedKey, wallet.state.sessionRevision]);

  async function reveal() {
    if (!connected || !selected) return;
    setError(null);
    setStage("Authorizing session-only reveal");
    try {
      const result = await revealAuthorizedBid({
        walletClient: wallet.state.walletClient!,
        account: wallet.state.account!,
        tenderId: selected.tenderId,
        bidId: selected.bidId,
      });
      setPlaintext(result.value);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Reveal failed.");
    } finally {
      setStage(null);
    }
  }

  async function grant() {
    if (!connected || !selected) return;
    setError(null);
    setStage("Simulating per-bid viewer grant");
    try {
      const transactionHash = await grantStoredBidViewer({
        walletClient: wallet.state.walletClient!,
        account: wallet.state.account!,
        tenderId: selected.tenderId,
        bidId: selected.bidId,
        viewer,
      });
      setGrantResult(
        `Viewer grant confirmed · ${transactionHash.slice(0, 10)}…${transactionHash.slice(-8)}`,
      );
      setViewer("");
      onConfirmed();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Viewer grant failed.");
    } finally {
      setStage(null);
    }
  }

  return (
    <section className="write-form disclosure-panel">
      <div className="form-heading">
        <p className="eyebrow">SELECTIVE DISCLOSURE</p>
        <h2>Reveal or grant one stored bid.</h2>
      </div>
      <label>
        Eligible bid
        <select value={selectedKey} onChange={(event) => setSelectedKey(event.target.value)}>
          <option value="">Select one public bid reference</option>
          {eligible.map((bid) => (
            <option key={`${bid.tenderId}:${bid.bidId}`} value={`${bid.tenderId}:${bid.bidId}`}>
              Tender {bid.tenderId.toString()} · Bid {bid.bidId.toString()}
            </option>
          ))}
        </select>
      </label>
      <label>
        Viewer address
        <input value={viewer} onChange={(event) => setViewer(event.target.value)} placeholder="0x…" />
      </label>
      <div className="privacy-confirmation">
        <strong>IRREVERSIBLE PER-HANDLE GRANT</strong>
        <span>
          Vendors may grant their own bid at any time. EOA buyers may grant only
          after Open; Safe buyers must use a threshold-authorized Safe transaction.
        </span>
      </div>
      <div className="form-actions">
        <button className="secondary-button" disabled={!connected || !selected || stage !== null} onClick={() => void reveal()}>
          REVEAL TO THIS WALLET
        </button>
        <button className="primary-button" disabled={!connected || !selected || !viewer || stage !== null} onClick={() => void grant()}>
          GRANT THIS BID →
        </button>
      </div>
      {stage && <p className="progress-line" aria-live="polite">{stage}</p>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {plaintext && (
        <p className="result-line" aria-live="polite">
          Session-only bid value · {plaintext}
        </p>
      )}
      {grantResult && (
        <p className="result-line" aria-live="polite">{grantResult}</p>
      )}
    </section>
  );
}
