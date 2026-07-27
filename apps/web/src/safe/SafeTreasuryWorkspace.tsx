import { useCallback, useEffect, useState } from "react";
import {
  formatEther,
  formatUnits,
  getAddress,
  isAddress,
  parseUnits,
  type Address,
  type Hex,
} from "viem";
import { ContextHelp } from "../shell/ContextHelp";
import { useToasts } from "../shell/ToastProvider";
import { WalletPanel, type WalletController } from "../wallet/WalletPanel";
import {
  approveAndExecuteSafeProposal,
  discoverOwnerSafes,
  fundSafeForVeilBid,
  getSafeProposalStatus,
  inspectSafeConfiguration,
  parseSafeTenderInput,
  prepareSafeTender,
  safeWalletUrl,
  serializeSafeTransactionHandoff,
  setupSafeForVeilBid,
  type SafeAccountConfiguration,
  type SafePreparationResult,
  type SafeProposalStatus,
  type SafeTenderInput,
} from "./safePreparation";
import {
  loadSafeProposals,
  rememberSafeProposal,
  type StoredSafeProposal,
} from "./safeProposalStore";

const emptyInput: SafeTenderInput = {
  metadata: "",
  ceiling: "",
  deadline: "",
  vendors: "",
};

function shortAddress(value: Address) {
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function safeActionTitle(result: SafePreparationResult) {
  if (result.kind === "setup") return "Safe setup";
  if (result.kind === "fund") return "Safe funding";
  return "Tender batch";
}

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
        <h3>
          {safeActionTitle(result)} {result.executed ? "executed" : "published"}
        </h3>
        <p>
          The proposal is recoverable from its public Safe transaction hash.
          Raw calls remain available as a manual handoff.
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
        <span>Last transaction calldata</span>
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
          onClick={() => void copy("Calldata", result.safeTransactionData)}
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
          href={safeWalletUrl(result.safe)}
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
        {result.actionHash && (
          <div>
            <dt>Action hash</dt>
            <dd>{result.actionHash}</dd>
          </div>
        )}
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

function SafeConfigurationCard({
  configuration,
}: {
  configuration: SafeAccountConfiguration;
}) {
  const checks = [
    ["Module contract", configuration.moduleDeployed],
    ["Module enabled", configuration.moduleEnabled],
    ["Market configured", configuration.marketConfigured],
    ["Settlement authority", configuration.marketAuthorized],
  ] as const;
  return (
    <section className="safe-account-card" aria-label="Selected Safe status">
      <div className="form-heading">
        <p className="eyebrow">SELECTED SAFE</p>
        <h2>{shortAddress(configuration.safe)}</h2>
        <p>
          {configuration.owners.length} owner(s) · threshold{" "}
          {configuration.threshold}
        </p>
      </div>
      <dl className="safe-handoff-evidence">
        <div>
          <dt>Safe ETH balance</dt>
          <dd>{Number(formatEther(configuration.balances.eth)).toFixed(4)} ETH</dd>
        </div>
        <div>
          <dt>Public Test USDC</dt>
          <dd>{formatUnits(configuration.balances.testUsdc, 6)} vUSDC</dd>
        </div>
        <div>
          <dt>Confidential vUSDC</dt>
          <dd>
            {configuration.balances.confidential === "encrypted"
              ? "Encrypted balance present"
              : configuration.balances.confidential === "none"
                ? "No encrypted balance"
                : "Status unavailable"}
          </dd>
        </div>
        <div>
          <dt>Preparation module</dt>
          <dd>{configuration.module ?? "Factory unavailable"}</dd>
        </div>
      </dl>
      <ul className="safe-readiness-list">
        {checks.map(([label, passed]) => (
          <li key={label} data-ready={passed}>
            <span aria-hidden="true">{passed ? "✓" : "○"}</span> {label}
          </li>
        ))}
      </ul>
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
  const [ownerSafes, setOwnerSafes] = useState<Address[]>([]);
  const [safeInput, setSafeInput] = useState("");
  const [selectedSafe, setSelectedSafe] = useState<Address | null>(null);
  const [configuration, setConfiguration] =
    useState<SafeAccountConfiguration | null>(null);
  const [discoveryStage, setDiscoveryStage] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SafePreparationResult | null>(null);
  const [fundAmount, setFundAmount] = useState("100");
  const [storedProposals, setStoredProposals] = useState<StoredSafeProposal[]>([]);
  const [storedStatuses, setStoredStatuses] = useState<
    Record<string, SafeProposalStatus>
  >({});
  const connected =
    wallet.state.status === "connected" &&
    wallet.state.account &&
    wallet.state.walletClient;

  const refreshConfiguration = useCallback(async (
    safe: Address,
    account: Address,
  ) => {
    setDiscoveryStage("Checking Safe ownership and VeilBid configuration…");
    setError(null);
    try {
      const inspected = await inspectSafeConfiguration({ safe, account });
      setSelectedSafe(safe);
      setSafeInput(safe);
      setConfiguration(inspected);
      setStoredProposals(
        loadSafeProposals().filter(
          (proposal) => proposal.safe.toLowerCase() === safe.toLowerCase(),
        ),
      );
    } catch (cause) {
      setConfiguration(null);
      setError(cause instanceof Error ? cause.message : "Safe inspection failed.");
    } finally {
      setDiscoveryStage(null);
    }
  }, []);

  useEffect(() => {
    setStage(null);
    setError(null);
    setResult(null);
    setConfiguration(null);
    setSelectedSafe(null);
    setOwnerSafes([]);
    setStoredProposals([]);
    if (!connected) return;
    let cancelled = false;
    const account = wallet.state.account!;
    setDiscoveryStage("Finding Sepolia Safes owned by this wallet…");
    void discoverOwnerSafes(account)
      .then(async (safes) => {
        if (cancelled) return;
        setOwnerSafes(safes);
        if (safes.length === 1) {
          await refreshConfiguration(safes[0], account);
        } else {
          setDiscoveryStage(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setDiscoveryStage(null);
        setError(
          "Safe discovery service is unavailable. Paste a Sepolia Safe address below.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [wallet.state.sessionRevision, connected, refreshConfiguration]);

  function remember(resultToStore: SafePreparationResult) {
    rememberSafeProposal({
      kind: resultToStore.kind,
      safe: resultToStore.safe,
      safeTxHash: resultToStore.safeTxHash,
      createdAt: new Date().toISOString(),
    });
    setStoredProposals(
      loadSafeProposals().filter(
        (proposal) =>
          proposal.safe.toLowerCase() === resultToStore.safe.toLowerCase(),
      ),
    );
  }

  async function selectSafe() {
    if (!connected) return;
    if (!isAddress(safeInput)) {
      setError("Enter a valid Sepolia Safe address.");
      return;
    }
    await refreshConfiguration(
      getAddress(safeInput),
      wallet.state.account!,
    );
  }

  async function runAction(
    label: string,
    action: (onStage: (next: string) => void) => Promise<SafePreparationResult>,
  ) {
    const toastId = toasts.start(label, "Building a threshold-authorized Safe action…");
    setError(null);
    setResult(null);
    try {
      const completed = await action((nextStage) => {
        setStage(nextStage);
        toasts.update(toastId, nextStage);
      });
      setResult(completed);
      remember(completed);
      toasts.succeed(
        toastId,
        completed.executed
          ? "Safe batch executed on Sepolia."
          : "Safe proposal published for the remaining approvals.",
      );
      if (completed.executed && wallet.state.account) {
        await refreshConfiguration(completed.safe, wallet.state.account);
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Safe action failed.";
      setError(message);
      toasts.fail(toastId, message);
    } finally {
      setStage(null);
    }
  }

  async function setup() {
    if (!connected || !configuration) return;
    await runAction("CONFIGURE SAFE", (onStage) =>
      setupSafeForVeilBid({
        configuration,
        provider: wallet.state.selectedProvider!.provider,
        account: wallet.state.account!,
        onStage,
      }),
    );
  }

  async function fund() {
    if (!connected || !configuration) return;
    let amount: bigint;
    try {
      amount = parseUnits(fundAmount, 6);
      if (amount <= 0n) throw new Error();
    } catch {
      setError("Enter a positive funding amount with at most 6 decimals.");
      return;
    }
    await runAction("FUND SAFE", (onStage) =>
      fundSafeForVeilBid({
        configuration,
        amount,
        provider: wallet.state.selectedProvider!.provider,
        account: wallet.state.account!,
        onStage,
      }),
    );
  }

  async function prepare() {
    if (!connected || !configuration) return;
    try {
      parseSafeTenderInput(input);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid tender input.");
      return;
    }
    await runAction("CREATE SAFE TENDER", (onStage) =>
      prepareSafeTender({
        input,
        configuration,
        walletClient: wallet.state.walletClient!,
        provider: wallet.state.selectedProvider!.provider,
        account: wallet.state.account!,
        onStage,
      }),
    );
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

  async function approveProposal(
    safe = result?.safe,
    safeTxHash = result?.safeTxHash,
  ) {
    if (!safe || !safeTxHash || !connected) return;
    const toastId = toasts.start("SAFE APPROVAL", "Checking proposal status…");
    setStage("Checking proposal status");
    try {
      const status = await approveAndExecuteSafeProposal({
        safe,
        safeTxHash,
        provider: wallet.state.selectedProvider!.provider,
        account: wallet.state.account!,
        onStage: (nextStage) => {
          setStage(nextStage);
          toasts.update(toastId, nextStage);
        },
      });
      if (result?.safeTxHash === safeTxHash) {
        setResult((current) => current ? { ...current, ...status } : current);
      }
      setStoredStatuses((current) => ({ ...current, [safeTxHash]: status }));
      toasts.succeed(
        toastId,
        status.executed
          ? "Safe batch executed."
          : `${status.confirmations}/${status.threshold} approvals collected.`,
      );
      if (status.executed && wallet.state.account) {
        await refreshConfiguration(safe, wallet.state.account);
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Safe approval failed.";
      setError(message);
      toasts.fail(toastId, message);
    } finally {
      setStage(null);
    }
  }

  async function refreshStored(proposal: StoredSafeProposal) {
    try {
      const status = await getSafeProposalStatus(proposal.safeTxHash);
      setStoredStatuses((current) => ({
        ...current,
        [proposal.safeTxHash]: status,
      }));
    } catch {
      setError("Could not recover that proposal from Safe Transaction Service.");
    }
  }

  return (
    <main className="role-workspace safe-workspace" id="main-content">
      <section className="workspace-intro">
        <ContextHelp
          label="Help for Safe Buyer workspace"
          title="HOW TO USE SAFE BUYER"
          steps={[
            "Connect any owner of a deployed Sepolia Safe.",
            "Choose the discovered Safe, or paste its address.",
            "Run the one-time VeilBid setup and fund confidential vUSDC if needed.",
            "Enter tender terms and approve the atomic preparation + creation batch.",
          ]}
          note="Setup, funding, and tender creation are normal Safe proposals. Multi-owner Safes retain their configured threshold."
        />
        <p className="eyebrow">SAFE BUYER / PRIMARY WORKFLOW</p>
        <h1>Use your own Safe treasury.</h1>
        <p>
          VeilBid discovers Safe accounts owned by the connected wallet,
          configures a dedicated preparation module, and preserves the Safe
          threshold for every treasury action.
        </p>
      </section>
      <WalletPanel wallet={wallet} />

      {connected && (
        <section className="write-form safe-selector">
          <div className="form-heading">
            <p className="eyebrow">1 / SELECT TREASURY</p>
            <h2>Choose a Sepolia Safe</h2>
          </div>
          {ownerSafes.length > 0 && (
            <div className="safe-choice-list">
              {ownerSafes.map((safe) => (
                <button
                  className={
                    selectedSafe?.toLowerCase() === safe.toLowerCase()
                      ? "secondary-button active"
                      : "secondary-button"
                  }
                  type="button"
                  key={safe}
                  onClick={() => {
                    setSafeInput(safe);
                    void refreshConfiguration(safe, wallet.state.account!);
                  }}
                >
                  {shortAddress(safe)}
                </button>
              ))}
            </div>
          )}
          <label>
            <span>Safe address</span>
            <input
              value={safeInput}
              onChange={(event) => setSafeInput(event.target.value)}
              placeholder="0x…"
            />
          </label>
          <button
            className="secondary-button"
            disabled={discoveryStage !== null}
            onClick={() => void selectSafe()}
          >
            CHECK SAFE →
          </button>
          {discoveryStage && (
            <p className="progress-line" aria-live="polite">{discoveryStage}</p>
          )}
        </section>
      )}

      {configuration && (
        <>
          <SafeConfigurationCard configuration={configuration} />
          <section className="write-form">
            <div className="form-heading">
              <p className="eyebrow">2 / PREPARE TREASURY</p>
              <h2>
                {configuration.ready
                  ? "Safe is ready"
                  : "One-time VeilBid setup"}
              </h2>
              <p>
                Setup deploys this Safe’s dedicated module, enables it, binds the
                Market, and grants settlement authority in one Safe proposal.
              </p>
            </div>
            {!configuration.ready && (
              <button
                className="primary-button"
                disabled={stage !== null || !configuration.module}
                onClick={() => void setup()}
              >
                CONFIGURE THIS SAFE →
              </button>
            )}
            {!configuration.module && (
              <p className="inline-error">
                Generic Safe setup is unavailable until the module factory is
                deployed in the release configuration.
              </p>
            )}
            <label>
              <span>Confidential funding amount (vUSDC)</span>
              <input
                value={fundAmount}
                onChange={(event) => setFundAmount(event.target.value)}
                inputMode="decimal"
              />
            </label>
            <button
              className="secondary-button"
              disabled={stage !== null}
              onClick={() => void fund()}
            >
              FAUCET + WRAP WITH SAFE →
            </button>
          </section>

          <section className="write-form">
            <div className="form-heading">
              <p className="eyebrow">3 / ATOMIC SAFE BATCH</p>
              <h2>Create a Safe-owned tender</h2>
              <p>
                VeilBid generates a fresh preparation nonce automatically. No
                extra owner input is required.
              </p>
            </div>
            {[
              ["metadata", "Public metadata"],
              ["ceiling", "Public ceiling (6 decimals)"],
              ["deadline", "Bid deadline"],
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
                Safe threshold approval remains mandatory. The relay only handles
                later permissionless lifecycle actions and cannot spend the Safe.
              </span>
            </div>
            <button
              className="primary-button"
              disabled={!configuration.ready || stage !== null}
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

          {storedProposals.length > 0 && (
            <section className="write-form safe-recovery">
              <div className="form-heading">
                <p className="eyebrow">RECOVERY</p>
                <h2>Recent Safe proposals</h2>
                <p>
                  Only public Safe addresses, transaction hashes, action types,
                  and timestamps are stored in this browser.
                </p>
              </div>
              <ul>
                {storedProposals.map((proposal) => {
                  const status = storedStatuses[proposal.safeTxHash];
                  return (
                    <li key={proposal.safeTxHash}>
                      <div>
                        <strong>{proposal.kind.toUpperCase()}</strong>
                        <span>{shortAddress(proposal.safeTxHash as Address)}</span>
                        <small>{new Date(proposal.createdAt).toLocaleString()}</small>
                        {status && (
                          <small>
                            {status.executed
                              ? "Executed"
                              : `${status.confirmations}/${status.threshold} approvals`}
                          </small>
                        )}
                      </div>
                      <div className="safe-handoff-actions">
                        <button
                          className="secondary-button"
                          onClick={() => void refreshStored(proposal)}
                        >
                          REFRESH
                        </button>
                        {!status?.executed && (
                          <button
                            className="secondary-button"
                            disabled={stage !== null}
                            onClick={() =>
                              void approveProposal(
                                proposal.safe,
                                proposal.safeTxHash,
                              )
                            }
                          >
                            APPROVE
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
      {!configuration && error && (
        <p className="inline-error" role="alert">{error}</p>
      )}
    </main>
  );
}
