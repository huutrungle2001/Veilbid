import { useEffect, useState } from "react";
import { WalletPanel, type WalletController } from "../wallet/WalletPanel";
import {
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
}: {
  result: SafePreparationResult;
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
        <p className="eyebrow">SAFE TRANSACTION READY</p>
        <h3>Submit through normal Safe authorization</h3>
        <p>
          Open the configured Safe, create a new transaction with value 0,
          then paste the target and calldata below. Review both before signing.
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
          COPY TRANSACTION JSON
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
          <dt>Preparation transaction</dt>
          <dd>
            <a
              href={`https://sepolia.etherscan.io/tx/${result.transactionHash}`}
              target="_blank"
              rel="noreferrer"
            >
              Inspect on Sepolia ↗
            </a>
          </dd>
        </div>
      </dl>
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
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof prepareSafeTender>
  > | null>(null);
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
        account: wallet.state.account!,
        onStage: (nextStage) => {
          setStage(nextStage);
          toasts.update(toastId, nextStage);
        },
      });
      setResult(prepared);
      toasts.succeed(
        toastId,
        "Safe calldata prepared in this browser session.",
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

  return (
    <main className="role-workspace safe-workspace" id="main-content">
      <section className="workspace-intro">
        <ContextHelp
          label="Help for Safe Treasury workspace"
          title="HOW TO USE SAFE TREASURY"
          steps={[
            "Connect a wallet that can prepare the intended Safe action.",
            "Enter the public terms, ceiling, deadline, approved vendors, and a fresh one-time nonce.",
            "Prepare the encrypted input and generated market calldata in this browser session.",
            "Open the Safe interface, submit that calldata, and satisfy the Safe's configured signer threshold.",
          ]}
          note="This screen produces input only and has no treasury execution authority. Module state is checked on Sepolia again before every preparation."
        />
        <p className="eyebrow">SAFE TREASURY / PREPARATION ONLY</p>
        <h1>Prepare. Then authorize.</h1>
        <p>
          Preparation binds encrypted budget, full tender terms, consumer, and
          nonce. It cannot execute from the Safe or move Safe-owned funds.
        </p>
      </section>
      <WalletPanel wallet={wallet} />
      <p className="workspace-notice">
        RELEASE MODULE: {safeReleaseConfiguration.moduleEnabled ? "ENABLED" : "DISABLED"}
        {" · "}LIVE MODULE STATE IS RECHECKED BEFORE PREPARATION.
      </p>
      <section className="write-form">
        <div className="form-heading">
          <p className="eyebrow">BOUND ACTION INPUT</p>
          <h2>Prepare createTenderAuthorized</h2>
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
            After preparation, submit the generated market calldata through the
            Safe UI and satisfy its configured threshold.
          </span>
        </div>
        <button
          className="primary-button"
          disabled={!connected || stage !== null}
          onClick={() => void prepare()}
        >
          PREPARE INPUT ONLY →
        </button>
        {stage && <p className="progress-line" aria-live="polite">{stage}</p>}
        {error && <p className="inline-error" role="alert">{error}</p>}
        {result && <SafeActionHandoff result={result} />}
      </section>
    </main>
  );
}
