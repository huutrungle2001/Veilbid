import { useEffect, useState } from "react";
import { WalletPanel, type WalletController } from "../wallet/WalletPanel";
import {
  parseSafeTenderInput,
  prepareSafeTender,
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
          note="This screen produces input only and has no treasury execution authority. The current demo module must be enabled by a normal Safe threshold transaction first."
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
        THE CURRENT E2E MANIFEST RECORDS THE DEMO MODULE AS DISABLED. RE-ENABLE
        REQUIRES A NORMAL SAFE THRESHOLD TRANSACTION.
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
        {result && (
          <p className="result-line" aria-live="polite">
            Prepared {result.actionHash.slice(0, 12)}… · Safe transaction
            calldata generated in this session.
          </p>
        )}
      </section>
    </main>
  );
}
