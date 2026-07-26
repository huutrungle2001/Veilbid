import { useEffect, useState } from "react";
import {
  createBuyerTender,
  type BuyerTenderStage,
} from "../transactions/buyerTender";
import type { WalletController } from "../wallet/WalletPanel";
import { useToasts } from "../shell/ToastProvider";

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
  const toasts = useToasts();
  const [metadata, setMetadata] = useState("");
  const [ceiling, setCeiling] = useState("");
  const [deadline, setDeadline] = useState("");
  const [vendors, setVendors] = useState([""]);
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
    const toastId = toasts.start(
      "CREATE TENDER",
      "Validating public terms and test balances…",
    );
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
          vendorInput: vendors.join("\n"),
        },
        onStage: (nextStage) => {
          setStage(nextStage);
          if (nextStage === "confirmed") {
            toasts.succeed(toastId, labels[nextStage]);
          } else {
            toasts.update(toastId, labels[nextStage]);
          }
        },
      });
      setResult(`Tender ${created.tenderId.toString()} opened on Sepolia`);
      onConfirmed();
    } catch (cause) {
      setStage(null);
      toasts.fail(
        toastId,
        "Tender creation stopped. Review the form or wallet request.",
      );
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
      <fieldset className="vendor-fieldset">
        <legend>Approved vendors (1–8)</legend>
        <small id="approved-vendors-help" className="field-hint">
          Add one wallet address per row. You can also paste comma- or
          whitespace-separated addresses into a row.
        </small>
        <div className="vendor-input-list">
          {vendors.map((vendor, index) => (
            <div className="vendor-input-row" key={`vendor-${index}`}>
              <label htmlFor={`approved-vendor-${index}`}>
                Vendor {index + 1}
                <input
                  id={`approved-vendor-${index}`}
                  value={vendor}
                  onChange={(event) => {
                    const pasted = event.target.value
                      .split(/[\s,]+/)
                      .filter(Boolean);
                    if (pasted.length > 1) {
                      setVendors((current) => [
                        ...current.slice(0, index),
                        ...pasted.slice(0, 8 - index),
                        ...current.slice(index + 1),
                      ]);
                    } else {
                      setVendors((current) =>
                        current.map((value, itemIndex) =>
                          itemIndex === index ? event.target.value : value,
                        ),
                      );
                    }
                  }}
                  disabled={pending}
                  placeholder="0x…"
                  aria-describedby="approved-vendors-help"
                  required
                />
              </label>
              {vendors.length > 1 && (
                <button
                  className="vendor-remove-button"
                  type="button"
                  onClick={() =>
                    setVendors((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  disabled={pending}
                  aria-label={`Remove vendor ${index + 1}`}
                >
                  REMOVE
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          className="vendor-add-button"
          type="button"
          onClick={() => setVendors((current) => [...current, ""])}
          disabled={pending || vendors.length >= 8}
        >
          + ADD VENDOR ({vendors.length}/8)
        </button>
      </fieldset>
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
