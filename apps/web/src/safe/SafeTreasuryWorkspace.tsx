import { useCallback, useEffect, useRef, useState } from "react";
import {
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
  authorizeSafeBalanceViewer,
  deployPersonalSafe,
  discoverOwnerSafes,
  fundSafeForVeilBid,
  getSafeProposalStatus,
  inspectSafeConfiguration,
  parseSafeTenderInput,
  prepareSafeTender,
  revealSafeConfidentialBalance,
  safeReleaseConfiguration,
  safeWalletUrl,
  serializeSafeTransactionHandoff,
  setupSafeForVeilBid,
  verifyOwnedSafes,
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
import {
  loadRememberedOwnerSafes,
  rememberOwnerSafe,
} from "./safeAccountStore";

const emptyInput: SafeTenderInput = {
  metadata: "",
  ceiling: "",
  deadline: "",
  vendors: "",
};

function shortAddress(value: Address) {
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function shortHash(value: string) {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

function safeActionTitle(result: SafePreparationResult) {
  if (result.kind === "setup") return "Safe setup";
  if (result.kind === "fund") return "Safe funding";
  if (result.kind === "view-balance") return "Balance viewer";
  if (result.kind === "withdraw-eth") return "ETH withdrawal";
  if (result.kind === "withdraw-usdc") return "vUSDC withdrawal";
  if (result.kind === "unwrap") return "vcUSDC unwrap";
  return "Tender batch";
}

function safeActionLabel(kind: StoredSafeProposal["kind"]) {
  if (kind === "setup") return "VEILBID SETUP";
  if (kind === "fund") return "SAFE FUNDING";
  if (kind === "tender") return "CREATE TENDER";
  if (kind === "view-balance") return "BALANCE VIEW";
  if (kind === "withdraw-eth") return "ETH WITHDRAWAL";
  if (kind === "withdraw-usdc") return "vUSDC WITHDRAWAL";
  return "vcUSDC UNWRAP";
}

function isTemporaryRpcError(cause: unknown) {
  const messages: string[] = [];
  let current: unknown = cause;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (current instanceof Error) messages.push(current.message);
    if (typeof current === "object") {
      const details = (current as { details?: unknown }).details;
      if (typeof details === "string") messages.push(details);
      current = (current as { cause?: unknown }).cause;
    } else {
      break;
    }
  }
  return /(failed to fetch|fetch failed|http request failed|network|timeout|timed out|429|502|503|504)/i
    .test(messages.join(" "));
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
  revealedConfidentialBalance,
  busy,
  revealPending,
  onRefresh,
  onToggleReveal,
}: {
  configuration: SafeAccountConfiguration;
  revealedConfidentialBalance: bigint | null;
  busy: boolean;
  revealPending: boolean;
  onRefresh: () => void;
  onToggleReveal: () => void;
}) {
  const checks = [
    ["Module contract", configuration.moduleDeployed],
    ["Module enabled", configuration.moduleEnabled],
    ["Market configured", configuration.marketConfigured],
    ["Settlement authority", configuration.marketAuthorized],
  ] as const;
  const hasConfidentialBalance =
    configuration.balances.confidential === "encrypted";
  const confidentialBalanceLabel =
    revealedConfidentialBalance !== null
      ? formatUnits(revealedConfidentialBalance, 6)
      : hasConfidentialBalance
        ? "••••••"
        : configuration.balances.confidential === "none"
          ? "0"
          : "Unavailable";
  return (
    <section className="safe-account-card" aria-label="Selected Safe status">
      <div className="safe-selected-heading">
        <div className="form-heading">
          <p className="eyebrow">SELECTED SAFE</p>
          <h2>{shortAddress(configuration.safe)}</h2>
          <p>
            {configuration.owners.length} owner(s) · threshold{" "}
            {configuration.threshold}
          </p>
        </div>
        <div className="safe-section-actions">
          <button
            className="secondary-button"
            disabled={busy}
            onClick={onRefresh}
            aria-label="Refresh selected Safe"
          >
            REFRESH ↻
          </button>
          <a
            className="secondary-button"
            href={safeWalletUrl(configuration.safe)}
            target="_blank"
            rel="noreferrer"
          >
            OPEN SAFE ↗
          </a>
        </div>
      </div>
      <div className="safe-selected-confidential">
        <div>
          <span>vcUSDC BALANCE</span>
          <strong>{confidentialBalanceLabel}</strong>
          <small>
            {revealedConfidentialBalance !== null
              ? "Visible in this browser session only"
              : configuration.confidentialViewerAuthorized
                ? "Private viewer authorized for the current handle"
                : hasConfidentialBalance
                  ? "First reveal requires Safe approval"
                  : "Confidential tender asset"}
          </small>
        </div>
        <button
          className="balance-reveal safe-balance-eye"
          type="button"
          onClick={onToggleReveal}
          disabled={!hasConfidentialBalance || busy || revealPending}
          aria-label={
            !hasConfidentialBalance
              ? "No confidential vcUSDC balance to reveal"
              : !configuration.confidentialViewerAuthorized
                ? "Authorize and reveal confidential Safe balance"
                : revealedConfidentialBalance === null
                  ? "Reveal confidential Safe balance"
                  : "Hide confidential Safe balance"
          }
          title={
            !hasConfidentialBalance
              ? "No vcUSDC balance"
              : !configuration.confidentialViewerAuthorized
                ? "Authorize this owner for the current balance handle"
                : revealedConfidentialBalance === null
                  ? "Reveal vcUSDC"
                  : "Hide vcUSDC"
          }
        >
          {revealedConfidentialBalance === null ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
              <path d="m4 4 16 16" />
              <path d="M10.6 6.1A10.6 10.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.2 2.9M14.4 17.7A10 10 0 0 1 12 18c-6 0-9.5-6-9.5-6a17 17 0 0 1 3.1-3.7" />
            </svg>
          )}
        </button>
      </div>
      <dl className="safe-handoff-evidence">
        <div>
          <dt>Owners</dt>
          <dd>{configuration.owners.join(", ")}</dd>
        </div>
        <div>
          <dt>Required approvals</dt>
          <dd>{configuration.threshold} / {configuration.owners.length}</dd>
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

function SafeConfigurationSkeleton({ safe }: { safe: Address }) {
  return (
    <section
      className="safe-account-card safe-account-loading"
      aria-label="Reading selected Safe"
      aria-live="polite"
    >
      <div className="form-heading">
        <p className="eyebrow">READING SELECTED SAFE</p>
        <h2>{shortAddress(safe)}</h2>
        <p>Checking owners, threshold, vcUSDC, and VeilBid setup on Sepolia…</p>
      </div>
      <div className="safe-skeleton-grid" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="safe-skeleton-line" aria-hidden="true" />
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
  const [configurationCache, setConfigurationCache] = useState<
    Record<string, SafeAccountConfiguration>
  >({});
  const configurationCacheRef = useRef<
    Record<string, SafeAccountConfiguration>
  >({});
  const inspectionRequestId = useRef(0);
  const [lastUsedSafe, setLastUsedSafe] = useState<Address | null>(null);
  const [loadingSafe, setLoadingSafe] = useState<Address | null>(null);
  const [safeReadWarning, setSafeReadWarning] = useState<string | null>(null);
  const [revealedSafeBalance, setRevealedSafeBalance] = useState<{
    handle: Hex;
    value: bigint;
  } | null>(null);
  const [revealPending, setRevealPending] = useState(false);
  const [discoveryStage, setDiscoveryStage] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SafePreparationResult | null>(null);
  const [fundAmount, setFundAmount] = useState("100");
  const [storedProposals, setStoredProposals] = useState<StoredSafeProposal[]>([]);
  const [storedStatuses, setStoredStatuses] = useState<
    Record<string, SafeProposalStatus>
  >({});
  const connected = Boolean(
    wallet.state.status === "connected" &&
    wallet.state.account &&
    wallet.state.walletClient,
  );

  const refreshConfiguration = useCallback(async (
    safe: Address,
    account: Address,
  ) => {
    const requestId = ++inspectionRequestId.current;
    const cacheKey = safe.toLowerCase();
    const cached = configurationCacheRef.current[cacheKey] ?? null;

    setSelectedSafe(safe);
    setLoadingSafe(safe);
    setConfiguration(cached);
    setStoredProposals(
      loadSafeProposals().filter(
        (proposal) => proposal.safe.toLowerCase() === cacheKey,
      ),
    );
    setError(null);
    setSafeReadWarning(null);
    try {
      const inspected = await inspectSafeConfiguration({ safe, account });
      if (inspectionRequestId.current !== requestId) return;

      configurationCacheRef.current = {
        ...configurationCacheRef.current,
        [cacheKey]: inspected,
      };
      setConfigurationCache(configurationCacheRef.current);
      setConfiguration(inspected);
      setRevealedSafeBalance((current) =>
        current?.handle === inspected.balances.confidentialHandle
          ? current
          : null,
      );
      rememberOwnerSafe(account, safe);
      setLastUsedSafe(safe);
      setOwnerSafes((current) =>
        current.some((candidate) => candidate.toLowerCase() === cacheKey)
          ? current
          : [...current, safe],
      );
    } catch (cause) {
      if (inspectionRequestId.current !== requestId) return;
      if (cached && isTemporaryRpcError(cause)) {
        setConfiguration(cached);
        setSafeReadWarning(
          "Live Sepolia refresh failed after trying backup RPCs. Showing the last successful read.",
        );
      } else {
        setConfiguration(null);
        setError(
          isTemporaryRpcError(cause)
            ? "Sepolia RPC is temporarily unavailable after trying backup providers. Please try again."
            : cause instanceof Error
              ? cause.message
              : "Safe inspection failed.",
        );
      }
    } finally {
      if (inspectionRequestId.current === requestId) {
        setLoadingSafe(null);
      }
    }
  }, []);

  useEffect(() => {
    setStage(null);
    setError(null);
    setResult(null);
    setConfiguration(null);
    setSelectedSafe(null);
    setLastUsedSafe(null);
    setLoadingSafe(null);
    setSafeReadWarning(null);
    setRevealedSafeBalance(null);
    setRevealPending(false);
    setOwnerSafes([]);
    setStoredProposals([]);
    configurationCacheRef.current = {};
    setConfigurationCache({});
    inspectionRequestId.current += 1;
    if (!connected) return;
    let cancelled = false;
    const account = wallet.state.account!;
    setDiscoveryStage("Finding Sepolia Safes owned by this wallet…");
    void (async () => {
      const remembered = loadRememberedOwnerSafes(account);
      let discovered: Address[] = [];
      let discoveryFailed = false;
      try {
        discovered = await discoverOwnerSafes(account);
      } catch {
        discoveryFailed = true;
      }
      const verified = await verifyOwnedSafes({
        account,
        safes: [...remembered, ...discovered],
      });
      if (cancelled) return;
      setOwnerSafes(verified);
      setLastUsedSafe(
        remembered.find((safe) =>
          verified.some(
            (candidate) =>
              candidate.toLowerCase() === safe.toLowerCase(),
          ),
        ) ?? null,
      );
      setDiscoveryStage(null);
      if (discoveryFailed && verified.length === 0) {
        setError(
          "Safe discovery service is unavailable. Paste a Sepolia Safe address below.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet.state.sessionRevision, connected]);

  useEffect(() => {
    if (!connected || storedProposals.length === 0) return;
    let cancelled = false;
    let timer: number | null = null;

    const readStatuses = async () => {
      const settled = await Promise.all(
        storedProposals.map(async (proposal) => {
          try {
            return {
              proposal,
              status: await getSafeProposalStatus(proposal.safeTxHash),
            };
          } catch {
            return { proposal, status: null };
          }
        }),
      );
      if (cancelled) return;
      setStoredStatuses((current) => {
        const next = { ...current };
        for (const { proposal, status } of settled) {
          if (status) next[proposal.safeTxHash] = status;
        }
        return next;
      });

      if (
        !cancelled &&
        settled.some(({ status }) => !status || !status.executed)
      ) {
        timer = window.setTimeout(() => void readStatuses(), 12_000);
      }
    };

    void readStatuses();
    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [connected, storedProposals]);

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

  async function createSafe() {
    if (!connected) return;
    const toastId = toasts.start(
      "CREATE PERSONAL SAFE",
      "Preparing a new one-owner Safe on Sepolia…",
    );
    setError(null);
    setResult(null);
    try {
      const deployed = await deployPersonalSafe({
        provider: wallet.state.selectedProvider!.provider,
        walletClient: wallet.state.walletClient!,
        account: wallet.state.account!,
        onStage: (nextStage) => {
          setDiscoveryStage(nextStage);
          toasts.update(toastId, nextStage);
        },
      });
      setOwnerSafes((current) =>
        current.some(
          (safe) => safe.toLowerCase() === deployed.safe.toLowerCase(),
        )
          ? current
          : [...current, deployed.safe],
      );
      await refreshConfiguration(
        deployed.safe,
        wallet.state.account!,
      );
      toasts.succeed(
        toastId,
        "Personal Safe created. Complete the one-time VeilBid setup next.",
      );
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Safe deployment failed.";
      setError(message);
      toasts.fail(toastId, message);
    } finally {
      setDiscoveryStage(null);
    }
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
      return completed;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Safe action failed.";
      setError(message);
      toasts.fail(toastId, message);
      return null;
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

  async function authorizeBalanceViewer() {
    if (!connected || !configuration) return;
    await runAction("AUTHORIZE BALANCE VIEW", (onStage) =>
      authorizeSafeBalanceViewer({
        configuration,
        provider: wallet.state.selectedProvider!.provider,
        account: wallet.state.account!,
        onStage,
      }),
    );
  }

  async function revealBalance() {
    if (!connected || !configuration) return;
    const toastId = toasts.start(
      "REVEAL SAFE BALANCE",
      "Requesting private access for the current vcUSDC handle…",
    );
    setRevealPending(true);
    setError(null);
    try {
      const value = await revealSafeConfidentialBalance({
        configuration,
        walletClient: wallet.state.walletClient!,
      });
      const handle = configuration.balances.confidentialHandle;
      if (handle) setRevealedSafeBalance({ handle, value });
      toasts.succeed(toastId, "Safe vcUSDC balance decrypted for this session.");
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Balance reveal failed.";
      setError(message);
      toasts.fail(toastId, message);
    } finally {
      setRevealPending(false);
    }
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

  const pendingProposals = storedProposals.filter((proposal) => {
    const status = storedStatuses[proposal.safeTxHash];
    return status && !status.executed;
  });
  const historicalProposals = storedProposals.filter((proposal) => {
    const status = storedStatuses[proposal.safeTxHash];
    return !status || status.executed;
  });
  const balanceResult =
    result?.kind === "view-balance" ? result : null;
  const preparationResult =
    result && ["setup", "fund"].includes(result.kind) ? result : null;
  const tenderResult = result?.kind === "tender" ? result : null;

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
            <p>
              Select a card to inspect its live configuration. VeilBid does not
              open or read full Safe details until you choose one.
            </p>
          </div>
          {ownerSafes.length > 0 && (
            <div className="safe-choice-list" aria-label="Owned Safe treasuries">
              {ownerSafes.map((safe, index) => {
                const cacheKey = safe.toLowerCase();
                const cached = configurationCache[cacheKey];
                const selected =
                  selectedSafe?.toLowerCase() === cacheKey;
                const loading = loadingSafe?.toLowerCase() === cacheKey;
                const lastUsed =
                  lastUsedSafe?.toLowerCase() === cacheKey;
                const demo =
                  safeReleaseConfiguration.safe.toLowerCase() === cacheKey;
                return (
                  <button
                    className={[
                      "safe-treasury-option",
                      selected ? "selected" : "",
                      loading ? "loading" : "",
                    ].filter(Boolean).join(" ")}
                    type="button"
                    key={safe}
                    aria-pressed={selected}
                    onClick={() =>
                      void refreshConfiguration(safe, wallet.state.account!)
                    }
                  >
                    <span className="safe-option-heading">
                      <span>
                        {demo ? "VEILBID DEMO SAFE" : `SAFE TREASURY ${index + 1}`}
                      </span>
                      <span className="safe-option-badges">
                        {lastUsed && (
                          <span className="safe-option-badge">LAST USED</span>
                        )}
                        {cached && (
                          <span
                            className="safe-option-badge"
                            data-ready={cached.ready}
                          >
                            {cached.ready ? "READY" : "SETUP REQUIRED"}
                          </span>
                        )}
                        {loading && (
                          <span className="safe-option-badge">READING…</span>
                        )}
                      </span>
                    </span>
                    <strong>{shortAddress(safe)}</strong>
                    <small>
                      {cached
                        ? `${cached.owners.length} owner(s) · threshold ${cached.threshold}`
                        : "Select to inspect live Sepolia status"}
                    </small>
                  </button>
                );
              })}
            </div>
          )}
          {!discoveryStage && ownerSafes.length === 0 && (
            <p className="safe-empty-list">
              No owned Safe was discovered. You can check a Safe address
              manually or create a personal Safe below.
            </p>
          )}
          <div className="safe-manual-entry">
            <div>
              <strong>USE A SAFE NOT LISTED</strong>
              <span>
                Enter its Sepolia address. Ownership is verified on-chain before
                VeilBid displays the details.
              </span>
            </div>
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
              disabled={discoveryStage !== null || loadingSafe !== null}
              onClick={() => void selectSafe()}
            >
              CHECK SAFE →
            </button>
          </div>
          <div className="safe-create-option">
            <div>
              <strong>NO SAFE YET?</strong>
              <span>
                Deploy a personal Safe 1/1 owned by this wallet. VeilBid setup
                remains a separate Safe proposal.
              </span>
            </div>
            <button
              className="primary-button"
              disabled={discoveryStage !== null}
              onClick={() => void createSafe()}
            >
              CREATE MY SAFE 1/1 →
            </button>
          </div>
          {discoveryStage && (
            <p className="progress-line" aria-live="polite">{discoveryStage}</p>
          )}
        </section>
      )}

      {selectedSafe && loadingSafe && !configuration && (
        <SafeConfigurationSkeleton safe={selectedSafe} />
      )}
      {safeReadWarning && (
        <p className="safe-read-warning" role="status">
          {safeReadWarning}
        </p>
      )}
      {connected && !selectedSafe && !discoveryStage && (
        <section className="safe-selection-empty" aria-label="No Safe selected">
          <span aria-hidden="true">01</span>
          <div>
            <strong>SELECT A SAFE TO CONTINUE</strong>
            <span>
              Safe authority, confidential vcUSDC, and VeilBid readiness will
              appear here after your selection.
            </span>
          </div>
        </section>
      )}

      {configuration && (
        <>
          {loadingSafe && (
            <p className="safe-refreshing" aria-live="polite">
              Refreshing selected Safe from Sepolia…
            </p>
          )}
          <SafeConfigurationCard
            configuration={configuration}
            revealedConfidentialBalance={
              revealedSafeBalance?.handle ===
              configuration.balances.confidentialHandle
                ? revealedSafeBalance.value
                : null
            }
            busy={loadingSafe !== null || stage !== null}
            revealPending={revealPending}
            onRefresh={() =>
              void refreshConfiguration(
                configuration.safe,
                wallet.state.account!,
              )
            }
            onToggleReveal={() => {
              if (!configuration.confidentialViewerAuthorized) {
                void authorizeBalanceViewer();
              } else if (revealedSafeBalance === null) {
                void revealBalance();
              } else {
                setRevealedSafeBalance(null);
              }
            }}
          />
          {stage && (
            <p className="progress-line safe-action-feedback" aria-live="polite">
              {stage}
            </p>
          )}
          {error && (
            <p className="inline-error safe-action-feedback" role="alert">
              {error}
            </p>
          )}
          {balanceResult && (
            <SafeActionHandoff
              result={balanceResult}
              busy={stage !== null}
              onRefresh={() => void refreshProposal()}
              onApprove={() => void approveProposal()}
            />
          )}
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
              <span>Test vcUSDC amount</span>
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
              ADD TEST vcUSDC →
            </button>
            {preparationResult && (
              <SafeActionHandoff
                result={preparationResult}
                busy={stage !== null}
                onRefresh={() => void refreshProposal()}
                onApprove={() => void approveProposal()}
              />
            )}
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
            {tenderResult && (
              <SafeActionHandoff
                result={tenderResult}
                busy={stage !== null}
                onRefresh={() => void refreshProposal()}
                onApprove={() => void approveProposal()}
              />
            )}
          </section>

          {pendingProposals.length > 0 && (
            <section className="write-form safe-recovery">
              <div className="form-heading">
                <p className="eyebrow">PENDING APPROVALS</p>
                <h2>Safe transactions waiting for signatures</h2>
                <p>
                  Status refreshes automatically. Execution remains impossible
                  until the Safe threshold is reached.
                </p>
              </div>
              <ul>
                {pendingProposals.map((proposal) => {
                  const status = storedStatuses[proposal.safeTxHash];
                  return (
                    <li key={proposal.safeTxHash}>
                      <div>
                        <strong>{safeActionLabel(proposal.kind)}</strong>
                        <span>{shortHash(proposal.safeTxHash)}</span>
                        <small>{new Date(proposal.createdAt).toLocaleString()}</small>
                        <small>
                          {status.confirmations}/{status.threshold} approvals
                        </small>
                      </div>
                      <div className="safe-handoff-actions">
                        <button
                          className="primary-button"
                          disabled={stage !== null}
                          onClick={() =>
                            void approveProposal(
                              proposal.safe,
                              proposal.safeTxHash,
                            )
                          }
                        >
                          APPROVE / EXECUTE
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {historicalProposals.length > 0 && (
            <details className="safe-history">
              <summary>
                <span>
                  <span className="eyebrow">TRANSACTION HISTORY</span>
                  <strong>
                    {historicalProposals.length} recent Safe action(s)
                  </strong>
                </span>
                <span aria-hidden="true">+</span>
              </summary>
              <div>
                <p>
                  Public action type, Safe transaction hash, timestamp, and
                  execution status are stored in this browser.
                </p>
                <ul>
                  {historicalProposals.map((proposal) => {
                    const status = storedStatuses[proposal.safeTxHash];
                    return (
                      <li key={proposal.safeTxHash}>
                        <div>
                          <strong>{safeActionLabel(proposal.kind)}</strong>
                          <span>{shortHash(proposal.safeTxHash)}</span>
                          <small>
                            {new Date(proposal.createdAt).toLocaleString()}
                          </small>
                          <small>
                            {status?.executed
                              ? "Executed"
                              : "Checking Safe Transaction Service…"}
                          </small>
                        </div>
                        <div className="safe-handoff-actions">
                          {!status && (
                            <button
                              className="secondary-button"
                              onClick={() => void refreshStored(proposal)}
                            >
                              CHECK NOW
                            </button>
                          )}
                          {status?.executionTransactionHash && (
                            <a
                              className="secondary-button"
                              href={`https://sepolia.etherscan.io/tx/${status.executionTransactionHash}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              ETHERSCAN ↗
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </details>
          )}
        </>
      )}
      {!configuration && error && (
        <p className="inline-error" role="alert">{error}</p>
      )}
    </main>
  );
}
