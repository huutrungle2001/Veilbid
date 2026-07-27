import { useEffect, useState } from "react";
import {
  createBuyerTender,
  type BuyerTenderStage,
} from "../transactions/buyerTender";
import type { WalletController } from "../wallet/WalletPanel";
import { useToasts } from "../shell/ToastProvider";
import {
  confirmCreatedTenderFunding,
  type FundingConfirmationStage,
} from "../transactions/tenderFunding";
import { transactionErrorMessage } from "../transactions/errors";
import type { Hex } from "viem";

const labels: Record<BuyerTenderStage, string> = {
  faucet: "Acquiring test USDC",
  "approve-wrapper": "Approving official wrapper",
  wrap: "Wrapping confidential vUSDC",
  "approve-market": "Authorizing market operator",
  create: "Creating and funding tender",
  confirmed: "Tender created; preparing exact-funding verification",
};

const fundingLabels: Record<FundingConfirmationStage, string> = {
  reading: "Reading the new tender funding state",
  "requesting-proof": "Waiting for the public Nox funding proof",
  simulating: "Simulating exact-funding confirmation",
  signing: "Confirm funding in your wallet",
  confirming: "Waiting for Sepolia to open the tender",
  open: "Exact funding confirmed; tender is Open",
  cancelled: "Funding was insufficient; tender is Cancelled",
};

function minimumLocalDeadline() {
  const deadline = new Date(Date.now() + 120_000);
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
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const pending = stage !== null;
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
    const toastId = toasts.startStack(
      "CREATE TENDER",
      "Validating public terms and test balances…",
    );
    setStage("Validating public terms and test balances");
    setError(null);
    setResult(null);
    let createdTender: {
      tenderId: bigint;
      transactionHash: Hex;
    } | null = null;
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
          const nextLabel = labels[nextStage];
          setStage(nextLabel);
          toasts.update(toastId, nextLabel);
        },
      });
      createdTender = created;
      setResult(
        `Tender ${created.tenderId.toString()} created; verifying exact funding…`,
      );
      onConfirmed();
      const funding = await confirmCreatedTenderFunding({
        tenderId: created.tenderId,
        triggerTransactionHash: created.transactionHash,
        walletClient: wallet.state.walletClient!,
        account: wallet.state.account!,
        onStage: (nextStage) => {
          const nextLabel = fundingLabels[nextStage];
          setStage(nextLabel);
          toasts.update(toastId, nextLabel);
        },
      });
      if (funding.status === "cancelled") {
        throw new Error(
          "The tender was cancelled because the wallet could not escrow the full public ceiling.",
        );
      }
      setResult(`Tender ${created.tenderId.toString()} is Open and accepting bids.`);
      setStage(null);
      toasts.succeed(toastId, fundingLabels.open);
      onConfirmed();
    } catch (cause) {
      setStage(null);
      toasts.fail(
        toastId,
        createdTender
          ? "Tender was created, but direct funding confirmation stopped. The relay fallback can finish it."
          : "Tender creation stopped. Review the form or wallet request.",
      );
      setError(
        transactionErrorMessage(
          cause,
          createdTender
            ? "Tender creation succeeded, but funding confirmation is still pending. Resume from Activity or allow the relay fallback to finish."
            : "Tender creation stopped before confirmation.",
        ),
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
          buyer access to vendor bid values while the tender is open. After
          finalization, this same wallet automatically receives private review
          access to the stored bids.
        </span>
      </div>
      {stage && (
        <p className="progress-line" aria-live="polite">
          <span className="signal-dot" aria-hidden="true" />
          {stage}
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
