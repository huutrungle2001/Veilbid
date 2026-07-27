import {
  getTenderReadiness,
  type PublicTender,
} from "@veilbid/chain-bindings";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  closeTenderForRecovery,
  resumeRecovery,
  type RecoveryStage,
} from "./recoveryActions";
import {
  readRecoveryRecords,
  recoveryChangedEvent,
  type RecoveryRecord,
} from "./recoveryStore";
import { WalletPanel, type WalletController } from "../wallet/WalletPanel";
import { ContextHelp } from "../shell/ContextHelp";
import { useToasts } from "../shell/ToastProvider";
import { transactionErrorMessage } from "../transactions/errors";

const stageLabel: Record<RecoveryStage, string> = {
  reading: "Reading canonical state",
  closing: "Simulating close",
  "waiting-close": "Waiting for close confirmation",
  "requesting-proof": "Requesting public Nox proof",
  simulating: "Simulating proof transaction",
  signing: "Awaiting wallet signature",
  confirming: "Waiting for confirmation",
  resolved: "Recovery resolved",
};

function shortHash(value: string) {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export function ActivityWorkspace({
  wallet,
  tenders,
  onRefresh,
}: {
  wallet: WalletController;
  tenders: readonly PublicTender[];
  onRefresh: () => void;
}) {
  const toasts = useToasts();
  const [records, setRecords] = useState<RecoveryRecord[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [stage, setStage] = useState<RecoveryStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const connected =
    wallet.state.status === "connected" &&
    wallet.state.account &&
    wallet.state.walletClient;
  const reload = useCallback(() => setRecords(readRecoveryRecords()), []);

  useEffect(() => {
    reload();
    window.addEventListener(recoveryChangedEvent, reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener(recoveryChangedEvent, reload);
      window.removeEventListener("storage", reload);
    };
  }, [reload]);

  useEffect(() => {
    setActiveKey(null);
    setStage(null);
    setError(null);
  }, [wallet.state.sessionRevision]);

  const trackable = useMemo(
    () =>
      tenders.filter((tender) => {
        if (
          records.some(
            (record) =>
              record.kind === "winner" &&
              record.tenderId === tender.tenderId.toString(),
          )
        ) {
          return false;
        }
        const readiness = getTenderReadiness(
          tender,
          BigInt(Math.floor(Date.now() / 1_000)),
        );
        return tender.status === "Closed" || readiness.canClose;
      }),
    [records, tenders],
  );

  async function resume(record: RecoveryRecord) {
    if (!connected) return;
    const toastId = toasts.startStack(
      "RESUME RECOVERY",
      "Reading the saved public checkpoint…",
    );
    const key = `${record.kind}:${record.tenderId}`;
    setActiveKey(key);
    setError(null);
    try {
      await resumeRecovery({
        record,
        walletClient: wallet.state.walletClient!,
        account: wallet.state.account!,
        onStage: (nextStage) => {
          setStage(nextStage);
          toasts.update(toastId, stageLabel[nextStage]);
        },
      });
      reload();
      onRefresh();
      toasts.succeed(toastId, "Recovery completed and public state refreshed.");
    } catch (cause) {
      toasts.fail(
        toastId,
        "Recovery stopped. The public checkpoint remains available.",
      );
      setError(
        transactionErrorMessage(cause, "Recovery attempt failed."),
      );
    } finally {
      setActiveKey(null);
      setStage(null);
    }
  }

  async function close(tender: PublicTender) {
    if (!connected) return;
    const toastId = toasts.startStack(
      "CLOSE TENDER",
      "Checking canonical tender readiness…",
    );
    const key = `close:${tender.tenderId.toString()}`;
    setActiveKey(key);
    setError(null);
    try {
      await closeTenderForRecovery({
        tenderId: tender.tenderId,
        knownTransactionHash: tender.updatedTransaction,
        walletClient: wallet.state.walletClient!,
        account: wallet.state.account!,
        onStage: (nextStage) => {
          setStage(nextStage);
          toasts.update(toastId, stageLabel[nextStage]);
        },
      });
      reload();
      onRefresh();
      toasts.succeed(
        toastId,
        "Close or proof tracking completed and state refreshed.",
      );
    } catch (cause) {
      toasts.fail(
        toastId,
        "Tender close or proof tracking stopped. Retry from Activity.",
      );
      setError(
        transactionErrorMessage(cause, "Tender close failed."),
      );
    } finally {
      setActiveKey(null);
      setStage(null);
    }
  }

  return (
    <main className="role-workspace activity-workspace" id="main-content">
      <section className="workspace-intro">
        <ContextHelp
          label="Help for Activity workspace"
          title="HOW TO USE ACTIVITY"
          steps={[
            "The web normally confirms funding immediately; the hosted relay remains a fallback and continues later lifecycle actions.",
            "Connect any Sepolia wallet with gas only when recovery is needed; these lifecycle writes are permissionless.",
            "Use Resume on a saved funding or winner-proof checkpoint; the app rereads required handles and proofs.",
            "Use manual Close & Track only if relay health is unavailable or delayed.",
          ]}
          note="Recovery persists public identifiers and transaction references only—never plaintext values, handles, or proofs."
        />
        <p className="eyebrow">ACTIVITY / AUTOMATION & RECOVERY</p>
        <h1>Automatic by default. Recoverable by design.</h1>
        <p>
          The web and relay can perform permissionless lifecycle writes. Manual
          recovery stores public IDs and transaction hashes only—never plaintext
          bids.
        </p>
      </section>
      <WalletPanel wallet={wallet} />

      <section className="activity-section">
        <header>
          <div>
            <p className="eyebrow">RECOVERABLE CHECKPOINTS</p>
            <h2>{records.length} pending</h2>
          </div>
          <button className="icon-button" onClick={reload} aria-label="Refresh recovery records">
            ↻
          </button>
        </header>
        {records.length === 0 ? (
          <p className="empty-activity">
            No interrupted funding or winner-proof requests in this browser.
          </p>
        ) : (
          <div className="activity-list">
            {records.map((record) => {
              const key = `${record.kind}:${record.tenderId}`;
              return (
                <article className="activity-card" key={key}>
                  <div>
                    <p className="eyebrow">
                      {record.kind === "funding"
                        ? "EXACT-FUNDING PROOF"
                        : "WINNER-ID PROOF"}
                    </p>
                    <h3>Tender {record.tenderId}</h3>
                    <span title={record.triggerTransactionHash}>
                      Trigger · {shortHash(record.triggerTransactionHash)}
                    </span>
                  </div>
                  <button
                    className="primary-button"
                    disabled={!connected || activeKey !== null}
                    onClick={() => void resume(record)}
                  >
                    {activeKey === key ? "RECOVERING…" : "RESUME →"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="activity-section">
        <header>
          <div>
            <p className="eyebrow">MANUAL RELAY FALLBACK</p>
            <h2>{trackable.length} ready</h2>
          </div>
        </header>
        {trackable.length === 0 ? (
          <p className="empty-activity">
            No confirmed public dossier is currently ready to close or track.
          </p>
        ) : (
          <div className="activity-list">
            {trackable.map((tender) => {
              const key = `close:${tender.tenderId.toString()}`;
              return (
                <article className="activity-card" key={key}>
                  <div>
                    <p className="eyebrow">
                      {tender.status === "Closed"
                        ? "TRACK CLOSED PROOF"
                        : "CLOSE READY"}
                    </p>
                    <h3>Tender {tender.tenderId.toString()}</h3>
                    <span>{tender.bidCount}/{tender.approvedVendorCount} vendors submitted</span>
                  </div>
                  <button
                    className="primary-button"
                    disabled={!connected || activeKey !== null}
                    onClick={() => void close(tender)}
                  >
                    {activeKey === key
                      ? "WORKING…"
                      : tender.status === "Closed"
                        ? "TRACK PROOF →"
                        : "CLOSE & TRACK →"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {stage && (
        <p className="progress-line activity-progress" aria-live="polite">
          <span className="signal-dot" aria-hidden="true" />
          {stageLabel[stage]}
        </p>
      )}
      {error && <p className="inline-error activity-error" role="alert">{error}</p>}
    </main>
  );
}
