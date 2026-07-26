import { useEffect, useState } from "react";
import { WalletPanel, type WalletController } from "../wallet/WalletPanel";
import {
  approveAndExecuteSafeProposal,
  getSafeProposalStatus,
  parseSafeTenderInput,
  prepareSafeTender,
  safeReleaseConfiguration,
  serializeSafeTransactionHandoff,
  type SafePreparationResult,
  type SafeTenderInput,
} from "./safePreparation";
import { ContextHelp } from "../shell/ContextHelp";
import { useToasts } from "../shell/ToastProvider";

const emptyInput: SafeTenderInput = {
  metadata: "",
  ceiling: "",
  deadline: "",
  vendors: "",
  nonce: "1",
};

export function SafeActionHandoff({
  result,
  busy = false,
  onRefresh,
  onApprove,
}: {
  result: SafePreparationResult;
  busy?: boolean;
  onRefresh?: () => void;
  onApprove?: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  async function copy(label: string, value: string) {
    try {
      if (!navigator.clipboard) throw new Error("clipboard-unavailable");
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} copied.`);
    } catch {
      setCopyStatus("Clipboard unavailable. Select and copy the value manually.");
    }
  }

  return (
    <section className="safe-handoff" aria-label="Safe transaction handoff">
      <div>
        <p className="eyebrow">SAFE TRANSACTION SERVICE</p>
        <h3>{result.executed ? "Safe batch executed" : "Safe proposal published"}</h3>
        <p>
          Preparation and tender creation are one atomic Safe batch. The raw
          calls below remain available as a recovery handoff.
        </p>
      </div>
      <label>
        <span>Target contract</span>
        <input readOnly value={result.target} aria-label="Safe target contract" />
      </label>
      <button
        className="secondary-button"
        type="button"
        onClick={() => void copy("Target", result.target)}
      >
        COPY TARGET
      </button>
      <label className="safe-calldata-field">
        <span>Transaction calldata</span>
        <textarea
          readOnly
          value={result.safeTransactionData}
          aria-label="Safe transaction calldata"
        />
      </label>
      <div className="safe-handoff-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={() =>
            void copy("Calldata", result.safeTransactionData)
          }
        >
          COPY CALLDATA
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() =>
            void copy("Transaction JSON", serializeSafeTransactionHandoff(result))
          }
        >
          COPY BATCH JSON
        </button>
        <a
          className="secondary-button"
          href={safeReleaseConfiguration.walletUrl}
          target="_blank"
          rel="noreferrer"
        >
          OPEN SAFE ↗
        </a>
      </div>
      <dl className="safe-handoff-evidence">
        <div>
          <dt>Safe</dt>
          <dd>{result.safe}</dd>
        </div>
        <div>
          <dt>Action hash</dt>
          <dd>{result.actionHash}</dd>
        </div>
        <div>
          <dt>Safe transaction hash</dt>
          <dd>{result.safeTxHash}</dd>
        </div>
        <div>
          <dt>Threshold progress</dt>
          <dd>{result.confirmations} / {result.threshold} approvals</dd>
        </div>
        <div>
          <dt>Execution</dt>
          <dd>
            {result.executionTransactionHash ? (
              <a
                href={`https://sepolia.etherscan.io/tx/${result.executionTransactionHash}`}
                target="_blank"
                rel="noreferrer"
              >
                Confirmed on Sepolia ↗
              </a>
            ) : "Waiting for threshold"}
          </dd>
        </div>
      </dl>
      <div className="safe-handoff-actions">
        {onRefresh && (
          <button className="secondary-button" disabled={busy} onClick={onRefresh}>
            REFRESH SIGNATURES ↻
          </button>
        )}
        {!result.executed && onApprove && (
          <button className="primary-button" disabled={busy} onClick={onApprove}>
            APPROVE / EXECUTE →
          </button>
        )}
      </div>
      {copyStatus && (
        <p className="result-line" aria-live="polite">{copyStatus}</p>
      )}
    </section>
  );
}

export function SafeTreasuryWorkspace({
  wallet,
}: {
  wallet: WalletController;
}) {
  const toasts = useToasts();
  const [input, setInput] = useState(emptyInput);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SafePreparationResult | null>(null);
  const connected =
    wallet.state.status === "connected" &&
    wallet.state.account &&
    wallet.state.walletClient;

  useEffect(() => {
    setStage(null);
    setError(null);
    setResult(null);
  }, [wallet.state.sessionRevision]);

  async function prepare() {
    if (!connected) return;
    const toastId = toasts.start(
      "PREPARE SAFE ACTION",
      "Validating Safe-bound tender input…",
    );
    setError(null);
    setResult(null);
    try {
      parseSafeTenderInput(input);
      const prepared = await prepareSafeTender({
        input,
        walletClient: wallet.state.walletClient!,
        provider: wallet.state.selectedProvider!.provider,
        account: wallet.state.account!,
        onStage: (nextStage) => {
          setStage(nextStage);
          toasts.update(toastId, nextStage);
        },
      });
      setResult(prepared);
      toasts.succeed(
        toastId,
        prepared.executed
          ? "Safe tender batch executed. Relay will confirm funding automatically."
          : "Safe proposal published for the remaining approvals.",
      );
    } catch (cause) {
      toasts.fail(
        toastId,
        "Safe preparation stopped. Review the input and module status.",
      );
      setError(cause instanceof Error ? cause.message : "Safe preparation failed.");
    } finally {
      setStage(null);
    }
  }

  async function refreshProposal() {
    if (!result) return;
    const toastId = toasts.start("SAFE STATUS", "Reading threshold status…");
    try {
      const status = await getSafeProposalStatus(result.safeTxHash);
      setResult((current) => current ? { ...current, ...status } : current);
      toasts.succeed(toastId, `${status.confirmations}/${status.threshold} approvals collected.`);
    } catch {
      toasts.fail(toastId, "Safe Transaction Service status is unavailable.");
    }
  }

  async function approveProposal() {
    if (!result || !connected) return;
    const toastId = toasts.start("SAFE APPROVAL", "Checking proposal status…");
    setStage("Checking proposal status");
    try {
      const status = await approveAndExecuteSafeProposal({
        safeTxHash: result.safeTxHash,
        provider: wallet.state.selectedProvider!.provider,
        account: wallet.state.account!,
        onStage: (nextStage) => {
          setStage(nextStage);
          toasts.update(toastId, nextStage);
        },
      });
      setResult((current) => current ? { ...current, ...status } : current);
      toasts.succeed(
        toastId,
        status.executed
          ? "Safe batch executed. Relay will continue the public lifecycle."
          : `${status.confirmations}/${status.threshold} approvals collected.`,
      );
    } catch {
      toasts.fail(toastId, "Safe approval or execution did not complete.");
    } finally {
      setStage(null);
    }
  }

  return (
    <main className="role-workspace safe-workspace" id="main-content">
      <section className="workspace-intro">
        <ContextHelp
          label="Help for Safe Buyer workspace"
          title="HOW TO USE SAFE BUYER"
          steps={[
            "Connect an owner of the configured Safe on Sepolia.",
            "Enter the public terms, ceiling, deadline, approved vendors, and a fresh one-time nonce.",
            "Approve one atomic Safe batch containing preparation and tender creation.",
            "For a multi-owner Safe, collect the displayed threshold; VeilBid executes once it is met.",
          ]}
          note="The relay automatically handles public funding confirmation, eligible close, and proof-based finalize. Safe threshold authorization remains mandatory."
        />
        <p className="eyebrow">SAFE BUYER / PRIMARY WORKFLOW</p>
        <h1>Approve once. Track the threshold.</h1>
        <p>
          VeilBid batches encrypted input preparation and tender creation. Safe
          owners retain custody; the permissionless relay handles later public steps.
        </p>
      </section>
      <WalletPanel wallet={wallet} />
      <p className="workspace-notice">
        RELEASE MODULE: {safeReleaseConfiguration.moduleEnabled ? "ENABLED" : "DISABLED"}
        {" · "}LIVE MODULE STATE IS RECHECKED BEFORE PREPARATION.
      </p>
      <section className="write-form">
        <div className="form-heading">
          <p className="eyebrow">ATOMIC SAFE BATCH</p>
          <h2>Create a Safe-owned tender</h2>
        </div>
        {[
          ["metadata", "Public metadata"],
          ["ceiling", "Public ceiling (6 decimals)"],
          ["deadline", "Bid deadline"],
          ["nonce", "One-time nonce"],
        ].map(([name, label]) => (
          <label key={name}>
            <span>{label}</span>
            <input
              type={name === "deadline" ? "datetime-local" : "text"}
              value={input[name as keyof SafeTenderInput]}
              onChange={(event) =>
                setInput((current) => ({ ...current, [name]: event.target.value }))
              }
            />
          </label>
        ))}
        <label>
          <span>Approved vendors</span>
          <textarea
            value={input.vendors}
            onChange={(event) =>
              setInput((current) => ({ ...current, vendors: event.target.value }))
            }
            placeholder="One address per line"
          />
        </label>
        <div className="privacy-confirmation">
          <strong>AUTHORITY BOUNDARY</strong>
          <span>
            Expected for the threshold-1 demo: one Safe approval and one on-chain
            execution confirmation. Funding proof, close, and finalize require no Buyer signature.
          </span>
        </div>
        <button
          className="primary-button"
          disabled={!connected || stage !== null}
          onClick={() => void prepare()}
        >
          CREATE WITH SAFE →
        </button>
        {stage && <p className="progress-line" aria-live="polite">{stage}</p>}
        {error && <p className="inline-error" role="alert">{error}</p>}
        {result && (
          <SafeActionHandoff
            result={result}
            busy={stage !== null}
            onRefresh={() => void refreshProposal()}
            onApprove={() => void approveProposal()}
          />
        )}
      </section>
    </main>
  );
}
