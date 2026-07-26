import type { PublicTender } from "@veilbid/chain-bindings";
import { useEffect, useMemo, useState } from "react";
import type { Hex } from "viem";
import {
  submitVendorBid,
  type VendorBidStage,
} from "../transactions/vendorBid";
import type { WalletController } from "../wallet/WalletPanel";
import { useToasts } from "../shell/ToastProvider";

const stageLabels: Record<VendorBidStage, string> = {
  checking: "Checking admission",
  encrypting: "Encrypting for market",
  simulating: "Simulating transaction",
  signing: "Awaiting signature",
  confirming: "Waiting for confirmation",
  confirmed: "Bid confirmed",
};

export function VendorBidForm({
  wallet,
  tenders,
  onConfirmed,
}: {
  wallet: WalletController;
  tenders: readonly PublicTender[];
  onConfirmed: () => void;
}) {
  const toasts = useToasts();
  const openTenders = useMemo(
    () => tenders.filter((tender) => tender.status === "Open"),
    [tenders],
  );
  const [tenderId, setTenderId] = useState("");
  const [price, setPrice] = useState("");
  const [stage, setStage] = useState<VendorBidStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<Hex | null>(null);
  const selected = openTenders.find(
    (tender) => tender.tenderId.toString() === tenderId,
  );
  const pending = stage !== null && stage !== "confirmed";
  const connected =
    wallet.state.status === "connected" &&
    wallet.state.account &&
    wallet.state.walletClient;

  useEffect(() => {
    setPrice("");
    setStage(null);
    setError(null);
    setTransactionHash(null);
  }, [wallet.state.sessionRevision]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!connected || !selected) return;
    const toastId = toasts.start(
      "SUBMIT BID",
      "Checking tender and vendor admission…",
    );
    setError(null);
    setTransactionHash(null);
    try {
      const result = await submitVendorBid({
        walletClient: wallet.state.walletClient!,
        account: wallet.state.account!,
        tenderId: selected.tenderId,
        publicCeiling: selected.publicCeiling,
        priceInput: price,
        onStage: (nextStage) => {
          setStage(nextStage);
          if (nextStage === "confirmed") {
            toasts.succeed(toastId, stageLabels[nextStage]);
          } else {
            toasts.update(toastId, stageLabels[nextStage]);
          }
        },
      });
      setTransactionHash(result.transactionHash);
      setPrice("");
      onConfirmed();
    } catch (cause) {
      setStage(null);
      toasts.fail(
        toastId,
        "Bid submission stopped. Review the wallet request and tender state.",
      );
      setError(
        cause instanceof Error
          ? cause.message
          : "Bid submission failed before confirmation.",
      );
    }
  }

  return (
    <form className="write-form" onSubmit={(event) => void submit(event)}>
      <div className="form-heading">
        <p className="eyebrow">SEALED BID</p>
        <h2>Encrypt and submit one immutable price.</h2>
      </div>
      <label>
        Open tender
        <select
          value={tenderId}
          onChange={(event) => setTenderId(event.target.value)}
          disabled={pending}
          required
        >
          <option value="">
            {openTenders.length === 0
              ? "No Open tenders available"
              : "Select confirmed dossier"}
          </option>
          {openTenders.map((tender) => (
            <option
              key={tender.tenderId.toString()}
              value={tender.tenderId.toString()}
            >
              Tender {tender.tenderId.toString()} · ceiling{" "}
              {Number(tender.publicCeiling) / 1_000_000} vUSDC
            </option>
          ))}
        </select>
      </label>
      {openTenders.length === 0 && (
        <p className="form-empty-hint" role="status">
          No confirmed tender is accepting bids. Check Public and refresh
          after the buyer opens a tender.
        </p>
      )}
      <label>
        Private bid price (vUSDC)
        <input
          type="password"
          inputMode="decimal"
          autoComplete="off"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          disabled={pending}
          placeholder="Visible only in this browser session"
          required
        />
      </label>
      <div className="privacy-confirmation">
        <strong>Privacy boundary</strong>
        <span>
          The plaintext price is sent to the Nox handle client in memory. It is
          never written to the public index, URL, storage, or VeilBid logs.
        </span>
      </div>
      {stage && (
        <p className="progress-line" aria-live="polite">
          <span className="signal-dot" aria-hidden="true" />
          {stageLabels[stage]}
        </p>
      )}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {transactionHash && (
        <p className="result-line" aria-live="polite">
          Confirmed · {transactionHash.slice(0, 10)}…{transactionHash.slice(-8)}
        </p>
      )}
      <button
        className="primary-button"
        type="submit"
        disabled={!connected || !selected || pending}
      >
        {connected ? "ENCRYPT, SIMULATE & SUBMIT →" : "CONNECT WALLET TO BID"}
      </button>
    </form>
  );
}
