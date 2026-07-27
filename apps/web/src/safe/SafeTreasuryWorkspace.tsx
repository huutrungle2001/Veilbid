import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatEther,
  formatUnits,
  getAddress,
  isAddress,
  parseEther,
  parseUnits,
  zeroAddress,
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
  finalizeSafeUnwrap,
  findSafeUnwrapRequest,
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
  unwrapFullSafeConfidentialBalance,
  verifyOwnedSafes,
  withdrawSafeEth,
  withdrawSafeTestUsdc,
  type SafeAccountConfiguration,
  type SafePreparationResult,
  type SafeProposalStatus,
  type SafeTenderInput,
  type SafeUnwrapFinalization,
  type SafeUnwrapRequest,
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
        <p>Checking owners, threshold, balances, and VeilBid setup on Sepolia…</p>
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

function SafeTreasuryBalances({
  configuration,
  revealedConfidentialBalance,
  busy,
  revealPending,
  onRefresh,
  onAuthorizeViewer,
  onReveal,
  onHide,
}: {
  configuration: SafeAccountConfiguration;
  revealedConfidentialBalance: bigint | null;
  busy: boolean;
  revealPending: boolean;
  onRefresh: () => void;
  onAuthorizeViewer: () => void;
  onReveal: () => void;
  onHide: () => void;
}) {
  const hasConfidentialBalance =
    configuration.balances.confidential === "encrypted";
  return (
    <section className="safe-treasury-balances" aria-label="Safe treasury balances">
      <div className="safe-section-heading">
        <div>
          <p className="eyebrow">TREASURY BALANCES</p>
          <h2>Assets owned by this Safe</h2>
          <p>Public balances refresh from Sepolia. vcUSDC stays private.</p>
        </div>
        <div className="safe-section-actions">
          <button
            className="secondary-button"
            disabled={busy}
            onClick={onRefresh}
          >
            REFRESH BALANCES ↻
          </button>
          <a
            className="secondary-button"
            href={safeWalletUrl(configuration.safe)}
            target="_blank"
            rel="noreferrer"
          >
            OPEN IN SAFE ↗
          </a>
        </div>
      </div>
      <div className="safe-balance-grid">
        <article>
          <span>SEP ETH</span>
          <strong>{Number(formatEther(configuration.balances.eth)).toFixed(4)}</strong>
          <small>Public balance</small>
        </article>
        <article>
          <span>vUSDC</span>
          <strong>{formatUnits(configuration.balances.testUsdc, 6)}</strong>
          <small>Public test token</small>
        </article>
        <article className="confidential">
          <span>vcUSDC</span>
          <strong>
            {revealedConfidentialBalance !== null
              ? formatUnits(revealedConfidentialBalance, 6)
              : hasConfidentialBalance
                ? "••••••"
                : configuration.balances.confidential === "none"
                  ? "0"
                  : "Unavailable"}
          </strong>
          <small>
            {configuration.confidentialViewerAuthorized
              ? "Current handle authorized for this owner"
              : "Encrypted balance · per-handle access"}
          </small>
        </article>
      </div>
      {hasConfidentialBalance && (
        <div className="safe-balance-private-actions">
          {!configuration.confidentialViewerAuthorized ? (
            <button
              className="secondary-button"
              disabled={busy}
              onClick={onAuthorizeViewer}
            >
              AUTHORIZE PRIVATE VIEW →
            </button>
          ) : (
            <button
              className="secondary-button"
              disabled={revealPending}
              onClick={
                revealedConfidentialBalance === null ? onReveal : onHide
              }
            >
              {revealPending
                ? "DECRYPTING…"
                : revealedConfidentialBalance === null
                  ? "REVEAL vcUSDC"
                  : "HIDE vcUSDC"}
            </button>
          )}
          <p>
            Authorization applies only to the current encrypted balance handle.
            A new handle after funding, transfer, or unwrap requires approval again.
          </p>
        </div>
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
  const recoveredUnwrapTransactions = useRef(new Set<string>());
  const [lastUsedSafe, setLastUsedSafe] = useState<Address | null>(null);
  const [loadingSafe, setLoadingSafe] = useState<Address | null>(null);
  const [safeReadWarning, setSafeReadWarning] = useState<string | null>(null);
  const [revealedSafeBalance, setRevealedSafeBalance] = useState<{
    handle: Hex;
    value: bigint;
  } | null>(null);
  const [revealPending, setRevealPending] = useState(false);
  const [treasuryActionsOpen, setTreasuryActionsOpen] = useState(false);
  const [withdrawRecipient, setWithdrawRecipient] = useState("");
  const [withdrawEthAmount, setWithdrawEthAmount] = useState("");
  const [withdrawUsdcAmount, setWithdrawUsdcAmount] = useState("");
  const [unwrapRecipient, setUnwrapRecipient] = useState("");
  const [unwrapRequest, setUnwrapRequest] =
    useState<SafeUnwrapRequest | null>(null);
  const [unwrapRequestSafe, setUnwrapRequestSafe] = useState<Address | null>(null);
  const [unwrapFinalization, setUnwrapFinalization] =
    useState<SafeUnwrapFinalization | null>(null);
  const [unwrapStage, setUnwrapStage] = useState<string | null>(null);
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
    setTreasuryActionsOpen(false);
    setWithdrawRecipient("");
    setWithdrawEthAmount("");
    setWithdrawUsdcAmount("");
    setUnwrapRecipient("");
    setUnwrapRequest(null);
    setUnwrapRequestSafe(null);
    setUnwrapFinalization(null);
    setUnwrapStage(null);
    recoveredUnwrapTransactions.current.clear();
    setOwnerSafes([]);
    setStoredProposals([]);
    configurationCacheRef.current = {};
    setConfigurationCache({});
    inspectionRequestId.current += 1;
    if (!connected) return;
    let cancelled = false;
    const account = wallet.state.account!;
    setWithdrawRecipient(account);
    setUnwrapRecipient(account);
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

      for (const { proposal, status } of settled) {
        const executionHash = status?.executionTransactionHash;
        if (
          proposal.kind !== "unwrap" ||
          !status?.executed ||
          !executionHash ||
          recoveredUnwrapTransactions.current.has(executionHash)
        ) {
          continue;
        }
        recoveredUnwrapTransactions.current.add(executionHash);
        try {
          const request = await findSafeUnwrapRequest(executionHash);
          if (cancelled) return;
          setUnwrapRequest(request);
          setUnwrapRequestSafe(proposal.safe);
          setUnwrapFinalization(null);
        } catch {
          recoveredUnwrapTransactions.current.delete(executionHash);
        }
      }
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

  function treasuryRecipient(value: string) {
    if (!isAddress(value)) {
      throw new Error("Enter a valid Sepolia recipient address.");
    }
    const recipient = getAddress(value);
    if (recipient === zeroAddress) {
      throw new Error("Recipient cannot be the zero address.");
    }
    return recipient;
  }

  async function withdrawEth() {
    if (!connected || !configuration) return;
    let amount: bigint;
    let recipient: Address;
    try {
      amount = parseEther(withdrawEthAmount);
      recipient = treasuryRecipient(withdrawRecipient);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message.startsWith("Enter")
          ? cause.message
          : "Enter a positive ETH amount with at most 18 decimals.",
      );
      return;
    }
    await runAction("WITHDRAW SAFE ETH", (onStage) =>
      withdrawSafeEth({
        configuration,
        recipient,
        amount,
        provider: wallet.state.selectedProvider!.provider,
        account: wallet.state.account!,
        onStage,
      }),
    );
  }

  async function withdrawUsdc() {
    if (!connected || !configuration) return;
    let amount: bigint;
    let recipient: Address;
    try {
      amount = parseUnits(withdrawUsdcAmount, 6);
      recipient = treasuryRecipient(withdrawRecipient);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message.startsWith("Enter")
          ? cause.message
          : "Enter a positive vUSDC amount with at most 6 decimals.",
      );
      return;
    }
    await runAction("WITHDRAW SAFE vUSDC", (onStage) =>
      withdrawSafeTestUsdc({
        configuration,
        recipient,
        amount,
        provider: wallet.state.selectedProvider!.provider,
        account: wallet.state.account!,
        onStage,
      }),
    );
  }

  async function requestUnwrap() {
    if (!connected || !configuration) return;
    let recipient: Address;
    try {
      recipient = treasuryRecipient(unwrapRecipient);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid recipient.");
      return;
    }
    const completed = await runAction("UNWRAP SAFE vcUSDC", (onStage) =>
      unwrapFullSafeConfidentialBalance({
        configuration,
        recipient,
        provider: wallet.state.selectedProvider!.provider,
        account: wallet.state.account!,
        onStage,
      }),
    );
    if (!completed?.executed || !completed.executionTransactionHash) return;
    try {
      const request = await findSafeUnwrapRequest(
        completed.executionTransactionHash,
      );
      setUnwrapRequest(request);
      setUnwrapRequestSafe(completed.safe);
      setUnwrapFinalization(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not recover the unwrap request.",
      );
    }
  }

  async function finalizeUnwrap() {
    if (!connected || !configuration || !unwrapRequest) return;
    const toastId = toasts.start(
      "FINALIZE UNWRAP",
      "Waiting for the public decryption proof…",
    );
    setError(null);
    try {
      const finalized = await finalizeSafeUnwrap({
        requestHandle: unwrapRequest.requestHandle,
        walletClient: wallet.state.walletClient!,
        account: wallet.state.account!,
        onStage: (nextStage) => {
          setUnwrapStage(nextStage);
          toasts.update(toastId, nextStage);
        },
      });
      setUnwrapFinalization(finalized);
      toasts.succeed(
        toastId,
        `${formatUnits(finalized.plaintextAmount, 6)} vUSDC released.`,
      );
      await refreshConfiguration(configuration.safe, wallet.state.account!);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Unwrap finalization failed.";
      setError(message);
      toasts.fail(toastId, message);
    } finally {
      setUnwrapStage(null);
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
      const actionKind =
        result?.safeTxHash === safeTxHash
          ? result.kind
          : storedProposals.find(
              (proposal) => proposal.safeTxHash === safeTxHash,
            )?.kind;
      if (
        status.executed &&
        status.executionTransactionHash &&
        actionKind === "unwrap"
      ) {
        try {
          const request = await findSafeUnwrapRequest(
            status.executionTransactionHash,
          );
          setUnwrapRequest(request);
          setUnwrapRequestSafe(safe);
          setUnwrapFinalization(null);
        } catch {
          setError(
            "Safe executed the unwrap, but its request is still being indexed.",
          );
        }
      }
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
  const treasuryResult =
    result &&
    ["withdraw-eth", "withdraw-usdc", "unwrap"].includes(result.kind)
      ? result
      : null;
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
              Full balances and VeilBid readiness will appear here after your
              selection.
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
          <SafeConfigurationCard configuration={configuration} />
          <SafeTreasuryBalances
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
            onAuthorizeViewer={() => void authorizeBalanceViewer()}
            onReveal={() => void revealBalance()}
            onHide={() => setRevealedSafeBalance(null)}
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
          <section className="safe-treasury-actions">
            <button
              className="safe-actions-toggle"
              type="button"
              aria-expanded={treasuryActionsOpen}
              aria-controls="safe-treasury-actions-panel"
              onClick={() => setTreasuryActionsOpen((current) => !current)}
            >
              <span>
                <span className="eyebrow">TREASURY ACTIONS</span>
                <strong>Withdraw or unwrap Safe assets</strong>
              </span>
              <span aria-hidden="true">{treasuryActionsOpen ? "−" : "+"}</span>
            </button>
            {treasuryActionsOpen && (
              <div id="safe-treasury-actions-panel">
                <label className="safe-action-recipient">
                  <span>Public withdrawal recipient</span>
                  <input
                    value={withdrawRecipient}
                    onChange={(event) =>
                      setWithdrawRecipient(event.target.value)
                    }
                    placeholder="0x…"
                  />
                </label>
                <div className="safe-action-grid">
                  <article>
                    <div>
                      <p className="eyebrow">PUBLIC ASSET</p>
                      <h3>Withdraw SEP ETH</h3>
                      <p>
                        A standard Safe transfer requiring the configured
                        threshold.
                      </p>
                    </div>
                    <label>
                      <span>Amount</span>
                      <div className="safe-amount-input">
                        <input
                          value={withdrawEthAmount}
                          onChange={(event) =>
                            setWithdrawEthAmount(event.target.value)
                          }
                          inputMode="decimal"
                          placeholder="0.00"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setWithdrawEthAmount(
                              formatEther(configuration.balances.eth),
                            )
                          }
                        >
                          MAX
                        </button>
                      </div>
                    </label>
                    <button
                      className="secondary-button"
                      disabled={stage !== null}
                      onClick={() => void withdrawEth()}
                    >
                      PROPOSE ETH WITHDRAWAL →
                    </button>
                  </article>
                  <article>
                    <div>
                      <p className="eyebrow">PUBLIC ASSET</p>
                      <h3>Withdraw vUSDC</h3>
                      <p>
                        Transfers public Test USDC from the Safe to the chosen
                        recipient.
                      </p>
                    </div>
                    <label>
                      <span>Amount</span>
                      <div className="safe-amount-input">
                        <input
                          value={withdrawUsdcAmount}
                          onChange={(event) =>
                            setWithdrawUsdcAmount(event.target.value)
                          }
                          inputMode="decimal"
                          placeholder="0.00"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setWithdrawUsdcAmount(
                              formatUnits(
                                configuration.balances.testUsdc,
                                6,
                              ),
                            )
                          }
                        >
                          MAX
                        </button>
                      </div>
                    </label>
                    <button
                      className="secondary-button"
                      disabled={stage !== null}
                      onClick={() => void withdrawUsdc()}
                    >
                      PROPOSE vUSDC WITHDRAWAL →
                    </button>
                  </article>
                </div>
                <article className="safe-unwrap-action">
                  <div>
                    <p className="eyebrow">CONFIDENTIAL → PUBLIC</p>
                    <h3>Unwrap the full Safe vcUSDC balance</h3>
                    <p>
                      The Safe first burns its current encrypted balance. A
                      second permissionless transaction finalizes the public
                      proof and releases vUSDC.
                    </p>
                  </div>
                  <label>
                    <span>vUSDC recipient</span>
                    <input
                      value={unwrapRecipient}
                      onChange={(event) =>
                        setUnwrapRecipient(event.target.value)
                      }
                      placeholder="0x…"
                    />
                  </label>
                  <div className="safe-unwrap-warning">
                    <strong>PRIVACY CHANGE</strong>
                    <span>
                      Finalization publicly reveals the amount being unwrapped.
                      Bid values and unrelated confidential balances remain
                      private.
                    </span>
                  </div>
                  <button
                    className="primary-button"
                    disabled={
                      stage !== null ||
                      configuration.balances.confidential !== "encrypted"
                    }
                    onClick={() => void requestUnwrap()}
                  >
                    PROPOSE FULL UNWRAP →
                  </button>
                  {unwrapRequest &&
                    unwrapRequestSafe?.toLowerCase() ===
                      configuration.safe.toLowerCase() && (
                      <div className="safe-unwrap-finalize">
                        <div>
                          <strong>UNWRAP REQUEST READY</strong>
                          <span>{shortHash(unwrapRequest.requestHandle)}</span>
                          <small>
                            Receiver {shortAddress(unwrapRequest.receiver)}
                          </small>
                        </div>
                        {unwrapFinalization ? (
                          <a
                            className="secondary-button"
                            href={`https://sepolia.etherscan.io/tx/${unwrapFinalization.transactionHash}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {formatUnits(
                              unwrapFinalization.plaintextAmount,
                              6,
                            )} vUSDC RELEASED ↗
                          </a>
                        ) : unwrapRequest.finalized ? (
                          <strong>ALREADY FINALIZED ON-CHAIN</strong>
                        ) : (
                          <button
                            className="primary-button"
                            disabled={unwrapStage !== null}
                            onClick={() => void finalizeUnwrap()}
                          >
                            {unwrapStage ? "FINALIZING…" : "FINALIZE UNWRAP →"}
                          </button>
                        )}
                      </div>
                    )}
                </article>
                {treasuryResult && (
                  <SafeActionHandoff
                    result={treasuryResult}
                    busy={stage !== null}
                    onRefresh={() => void refreshProposal()}
                    onApprove={() => void approveProposal()}
                  />
                )}
              </div>
            )}
          </section>
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
