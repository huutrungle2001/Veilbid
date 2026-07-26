import type { PublicBid, PublicTender } from "@veilbid/chain-bindings";
import { useEffect, useMemo, useState } from "react";
import {
  createAuditorPublicClient,
  inspectBidViewer,
  revealAuthorizedBid,
} from "./revealBid";
import { WalletPanel, type WalletController } from "../wallet/WalletPanel";
import { ContextHelp } from "../shell/ContextHelp";
import { useToasts } from "../shell/ToastProvider";

export function AuditorWorkspace({
  wallet,
  tenders,
  bids,
}: {
  wallet: WalletController;
  tenders: readonly PublicTender[];
  bids: readonly PublicBid[];
}) {
  const toasts = useToasts();
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
    const toastId = toasts.start(
      "CHECK VIEWER ACCESS",
      "Reading the per-bid viewer permission from Sepolia…",
    );
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
      if (!result) {
        setError("This wallet has not been granted access to this bid.");
        toasts.fail(toastId, "This wallet is not authorized for the selected bid.");
      } else {
        toasts.succeed(toastId, "Viewer access confirmed for this bid only.");
      }
    } catch {
      setAuthorized(null);
      setError("Viewer access could not be read from Sepolia.");
      toasts.fail(toastId, "Viewer access could not be read from Sepolia.");
    } finally {
      setStage(null);
    }
  }

  async function reveal() {
    if (!connected || !selected || authorized !== true) return;
    const toastId = toasts.start(
      "REVEAL BID",
      "Waiting for wallet authorization and private decryption…",
    );
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
      toasts.succeed(
        toastId,
        "Bid revealed in this browser session only.",
      );
    } catch (cause) {
      setRevealed(null);
      toasts.fail(
        toastId,
        "Private reveal was rejected or could not be completed.",
      );
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
    <main className="role-workspace auditor-workspace" id="main-content">
      <section className="workspace-intro">
        <ContextHelp
          label="Help for Auditor workspace"
          title="HOW TO USE AUDITOR"
          steps={[
            "Connect the auditor wallet on Sepolia.",
            "Select one public tender and bid reference.",
            "Check the on-chain per-bid viewer permission before attempting a reveal.",
            "Reveal only after access is confirmed; the plaintext is cleared when the wallet session changes.",
          ]}
          note="Viewer access applies only to the granted handle and provides no token, Safe signer, buyer, vendor, or administrator authority."
        />
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
            <option value="">
              {options.length === 0
                ? "No public bid references available"
                : "Select tender / bid"}
            </option>
            {options.map((option) => (
              <option value={option.key} key={option.key}>
                Tender {option.tenderId.toString()} · Bid{" "}
                {option.bidId.toString()} · {option.tender?.status ?? "Unknown"}
              </option>
            ))}
          </select>
        </label>
        {options.length === 0 && (
          <p className="form-empty-hint" role="status">
            No confirmed bid references are indexed yet. A vendor must
            submit a bid before viewer access can be checked.
          </p>
        )}
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
          <p className="success-line" aria-live="polite">Authorized for this bid only.</p>
        )}
        {stage && <p className="progress-line" aria-live="polite">{stage}</p>}
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
