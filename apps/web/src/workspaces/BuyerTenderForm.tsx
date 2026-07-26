import { useEffect, useState } from "react";
import {
  createBuyerTender,
  type BuyerTenderStage,
} from "../transactions/buyerTender";
import type { WalletController } from "../wallet/WalletPanel";

const labels: Record<BuyerTenderStage, string> = {
  faucet: "Acquiring test USDC",
  "approve-wrapper": "Approving official wrapper",
  wrap: "Wrapping confidential vUSDC",
  "approve-market": "Authorizing market operator",
  create: "Creating and funding tender",
  "funding-proof": "Recovering exact-funding proof",
  "confirm-funding": "Opening tender on-chain",
  confirmed: "Tender open",
};

function minimumLocalDeadline() {
  const deadline = new Date(Date.now() + 60_000);
  deadline.setMinutes(
    deadline.getMinutes() - deadline.getTimezoneOffset(),
  );
  return deadline.toISOString().slice(0, 16);
}

export function BuyerTenderForm({
  wallet,
  onConfirmed,
}: {
  wallet: WalletController;
  onConfirmed: () => void;
}) {
  const [metadata, setMetadata] = useState("");
  const [ceiling, setCeiling] = useState("");
  const [deadline, setDeadline] = useState("");
  const [vendors, setVendors] = useState("");
  const [stage, setStage] = useState<BuyerTenderStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const pending = stage !== null && stage !== "confirmed";
  const connected =
    wallet.state.status === "connected" &&
    wallet.state.account &&
    wallet.state.walletClient;

  useEffect(() => {
    setStage(null);
    setError(null);
    setResult(null);
  }, [wallet.state.sessionRevision]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!connected) return;
    setError(null);
    setResult(null);
    try {
      const created = await createBuyerTender({
        walletClient: wallet.state.walletClient!,
        account: wallet.state.account!,
        draft: {
          metadata,
          ceilingInput: ceiling,
          deadlineInput: deadline,
          vendorInput: vendors,
        },
        onStage: setStage,
      });
      setResult(`Tender ${created.tenderId.toString()} opened on Sepolia`);
      onConfirmed();
    } catch (cause) {
      setStage(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "Tender creation stopped before confirmation.",
      );
    }
  }

  return (
    <form className="write-form" onSubmit={(event) => void submit(event)}>
      <div className="form-heading">
        <p className="eyebrow">EXACTLY FUNDED TENDER</p>
        <h2>Create public terms and confidential escrow.</h2>
      </div>
      <label>
        Public metadata
        <input
          value={metadata}
          onChange={(event) => setMetadata(event.target.value)}
          maxLength={240}
          disabled={pending}
          placeholder="Procurement title or terms fingerprint source"
          required
        />
      </label>
      <label>
        Public ceiling (vUSDC)
        <input
          value={ceiling}
          onChange={(event) => setCeiling(event.target.value)}
          inputMode="decimal"
          disabled={pending}
          placeholder="100"
          required
        />
      </label>
      <label>
        Public bid deadline
        <input
          type="datetime-local"
          value={deadline}
          onChange={(event) => setDeadline(event.target.value)}
          min={minimumLocalDeadline()}
          disabled={pending}
          required
        />
        <small className="field-hint">
          Choose a local time at least one minute from now.
        </small>
      </label>
      <label>
        Approved vendors (1–8)
        <input
          value={vendors}
          onChange={(event) => setVendors(event.target.value)}
          disabled={pending}
          placeholder="Comma or space separated addresses"
          required
        />
      </label>
      <div className="privacy-confirmation">
        <strong>Authority boundary</strong>
        <span>
          This EOA path signs normal wallet transactions. It never grants the
          buyer access to vendor bid values while the tender is open.
        </span>
      </div>
      {stage && (
        <p className="progress-line" aria-live="polite">
          <span className="signal-dot" aria-hidden="true" />
          {labels[stage]}
        </p>
      )}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {result && <p className="result-line" aria-live="polite">{result}</p>}
      <button
        className="primary-button"
        type="submit"
        disabled={!connected || pending}
      >
        {connected ? "PREPARE & FUND TENDER →" : "CONNECT WALLET TO CREATE"}
      </button>
    </form>
  );
}
