import type { PublicBid, PublicTender } from "@veilbid/chain-bindings";
import { useEffect, useMemo, useState } from "react";
import {
  createAuditorPublicClient,
  inspectBidViewer,
  revealAuthorizedBid,
} from "./revealBid";
import { WalletPanel, type WalletController } from "../wallet/WalletPanel";

export function AuditorWorkspace({
  wallet,
  tenders,
  bids,
}: {
  wallet: WalletController;
  tenders: readonly PublicTender[];
  bids: readonly PublicBid[];
}) {
  const [selection, setSelection] = useState("");
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState<{
    value: string;
    solidityType: string;
  } | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const connected =
    wallet.state.status === "connected" &&
    wallet.state.account &&
    wallet.state.walletClient;
  const options = useMemo(
    () =>
      bids.map((bid) => ({
        ...bid,
        tender: tenders.find(
          (tender) => tender.tenderId === bid.tenderId,
        ),
        key: `${bid.tenderId}:${bid.bidId}`,
      })),
    [bids, tenders],
  );
  const selected = options.find((option) => option.key === selection);

  useEffect(() => {
    setAuthorized(null);
    setRevealed(null);
    setStage(null);
    setError(null);
  }, [selection, wallet.state.sessionRevision]);

  async function checkAccess() {
    if (!connected || !selected) return;
    setError(null);
    setRevealed(null);
    setStage("Reading per-bid viewer ACL");
    try {
      const result = await inspectBidViewer({
        publicClient: createAuditorPublicClient(),
        tenderId: selected.tenderId,
        bidId: selected.bidId,
        account: wallet.state.account!,
      });
      setAuthorized(result);
      if (!result) setError("This wallet has not been granted access to this bid.");
    } catch {
      setAuthorized(null);
      setError("Viewer access could not be read from Sepolia.");
    } finally {
      setStage(null);
    }
  }

  async function reveal() {
    if (!connected || !selected || authorized !== true) return;
    setError(null);
    setStage("Awaiting wallet authorization and private reveal");
    try {
      const result = await revealAuthorizedBid({
        walletClient: wallet.state.walletClient!,
        tenderId: selected.tenderId,
        bidId: selected.bidId,
        account: wallet.state.account!,
      });
      setRevealed(result);
    } catch (cause) {
      setRevealed(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "Authorized reveal failed.",
      );
    } finally {
      setStage(null);
    }
  }

  return (
    <main className="role-workspace auditor-workspace">
      <section className="workspace-intro">
        <p className="eyebrow">AUDITOR / SELECTIVE DISCLOSURE</p>
        <h1>Reveal one granted bid.</h1>
        <p>
          Access is checked per stored bid. A viewer grant does not confer token,
          Safe signer, buyer, vendor, or protocol authority.
        </p>
      </section>
      <WalletPanel wallet={wallet} />
      <section className="write-form auditor-form">
        <label>
          <span>Public bid reference</span>
          <select
            value={selection}
            onChange={(event) => setSelection(event.target.value)}
          >
            <option value="">Select tender / bid</option>
            {options.map((option) => (
              <option value={option.key} key={option.key}>
                Tender {option.tenderId.toString()} · Bid{" "}
                {option.bidId.toString()} · {option.tender?.status ?? "Unknown"}
              </option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          <button
            className="secondary-button"
            disabled={!connected || !selected || stage !== null}
            onClick={() => void checkAccess()}
          >
            CHECK VIEWER ACCESS
          </button>
          <button
            className="primary-button"
            disabled={!connected || authorized !== true || stage !== null}
            onClick={() => void reveal()}
          >
            REVEAL IN SESSION →
          </button>
        </div>
        {authorized === true && (
          <p className="success-line">Authorized for this bid only.</p>
        )}
        {stage && <p className="progress-line">{stage}</p>}
        {error && <p className="inline-error" role="alert">{error}</p>}
        {revealed && (
          <section className="reveal-result" aria-live="polite">
            <p className="eyebrow">SESSION-ONLY PLAINTEXT</p>
            <strong>{revealed.value}</strong>
            <span>{revealed.solidityType} · cleared on wallet/session change</span>
          </section>
        )}
      </section>
    </main>
  );
}
