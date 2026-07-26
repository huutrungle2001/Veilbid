import tokenAbiJson from "@veilbid/chain-bindings/abis/VeilBidTestUSDC";
import wrapperAbiJson from "@veilbid/chain-bindings/abis/VeilBidConfidentialUSDC";
import deployment from "@veilbid/chain-bindings/addresses/sepolia.release";
import { createViemHandleClient } from "@iexec-nox/handle";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createPublicClient,
  formatUnits,
  http,
  type Abi,
  type Address,
  type Hex,
  type WalletClient,
} from "viem";
import { sepolia } from "viem/chains";
import { defaultSepoliaRpcUrl } from "../public-market/loadPublicMarket";
import { ContextHelp } from "../shell/ContextHelp";
import type { WalletController } from "./WalletPanel";

const tokenAbi = tokenAbiJson as Abi;
const wrapperAbi = wrapperAbiJson as Abi;
const tokenAddress = deployment.contracts.VeilBidTestUSDC.address as Address;
const wrapperAddress = deployment.contracts
  .VeilBidConfidentialUSDC.address as Address;
const zeroHandle = `0x${"00".repeat(32)}` as Hex;

export type ConfidentialBalanceState =
  | "encrypted"
  | "none"
  | "unavailable";

export interface WalletBalances {
  eth: bigint;
  testUsdc: bigint;
  confidential: ConfidentialBalanceState;
  confidentialHandle: Hex | null;
}

export type BalanceLoader = (account: Address) => Promise<WalletBalances>;
export type FaucetRequester = (
  walletClient: WalletClient,
  account: Address,
) => Promise<void>;
export type BalanceRevealer = (
  walletClient: WalletClient,
  handle: Hex,
) => Promise<bigint>;

function compactAmount(value: bigint, decimals: number, precision: number) {
  const [whole, fraction = ""] = formatUnits(value, decimals).split(".");
  const visibleFraction = fraction
    .slice(0, precision)
    .replace(/0+$/, "");
  return visibleFraction ? `${whole}.${visibleFraction}` : whole;
}

export async function readWalletBalances(
  account: Address,
  rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL ?? defaultSepoliaRpcUrl,
): Promise<WalletBalances> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });
  const [eth, testUsdc, confidentialResult] = await Promise.all([
    client.getBalance({ address: account }),
    client.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: "balanceOf",
      args: [account],
    }),
    client
      .readContract({
        address: wrapperAddress,
        abi: wrapperAbi,
        functionName: "confidentialBalanceOf",
        args: [account],
      })
      .then((handle) =>
        typeof handle === "string" && handle !== zeroHandle
          ? {
              state: "encrypted" as const,
              handle: handle as Hex,
            }
          : {
              state: "none" as const,
              handle: null,
            },
      )
      .catch((cause: unknown) => {
        const message = cause instanceof Error ? cause.message : "";
        return message.includes("ERC7984ZeroBalance")
          ? {
              state: "none" as const,
              handle: null,
            }
          : {
              state: "unavailable" as const,
              handle: null,
            };
      }),
  ]);
  if (typeof testUsdc !== "bigint") {
    throw new Error("Test USDC balance response is malformed.");
  }
  return {
    eth,
    testUsdc,
    confidential: confidentialResult.state,
    confidentialHandle: confidentialResult.handle,
  };
}

export async function revealConfidentialBalance(
  walletClient: WalletClient,
  handle: Hex,
) {
  const handleClient = await createViemHandleClient(walletClient);
  const revealed = await handleClient.decrypt(handle as never);
  if (typeof revealed.value !== "bigint") {
    throw new Error("Confidential balance response is malformed.");
  }
  return revealed.value;
}

export async function requestTestUsdc(
  walletClient: WalletClient,
  account: Address,
  rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL ?? defaultSepoliaRpcUrl,
) {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });
  const simulation = await client.simulateContract({
    account,
    address: tokenAddress,
    abi: tokenAbi,
    functionName: "faucet",
  });
  const hash = await walletClient.writeContract(simulation.request);
  const receipt = await client.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error("Test USDC faucet transaction reverted.");
  }
}

export function WalletBalancePanel({
  wallet,
  loadBalances = readWalletBalances,
  requestFaucet = requestTestUsdc,
  revealBalance = revealConfidentialBalance,
}: {
  wallet: WalletController;
  loadBalances?: BalanceLoader;
  requestFaucet?: FaucetRequester;
  revealBalance?: BalanceRevealer;
}) {
  const { state } = wallet;
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [faucetPending, setFaucetPending] = useState(false);
  const [revealPending, setRevealPending] = useState(false);
  const [revealedBalance, setRevealedBalance] = useState<bigint | null>(
    null,
  );
  const [revealError, setRevealError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const revealRequestId = useRef(0);
  const connected =
    state.status === "connected" &&
    state.account &&
    state.walletClient;

  const refresh = useCallback(async () => {
    if (!state.account || state.status !== "connected") return;
    revealRequestId.current += 1;
    setRevealedBalance(null);
    setRevealPending(false);
    setRevealError(null);
    setStatus("loading");
    setMessage(null);
    try {
      setBalances(await loadBalances(state.account));
      setStatus("ready");
    } catch {
      setBalances(null);
      setStatus("error");
    }
  }, [loadBalances, state.account, state.status]);

  useEffect(() => {
    if (!connected) {
      revealRequestId.current += 1;
      setBalances(null);
      setStatus("idle");
      setRevealPending(false);
      setRevealedBalance(null);
      setRevealError(null);
      setMessage(null);
      return;
    }
    void refresh();
  }, [connected, refresh, state.sessionRevision]);

  async function faucet() {
    if (!connected) return;
    setFaucetPending(true);
    setMessage(null);
    try {
      await requestFaucet(state.walletClient!, state.account!);
      await refresh();
      setMessage("10,000 test USDC received.");
    } catch {
      setMessage("Faucet transaction was rejected or failed.");
    } finally {
      setFaucetPending(false);
    }
  }

  async function reveal() {
    if (
      !connected ||
      !balances?.confidentialHandle ||
      balances.confidential !== "encrypted"
    ) {
      return;
    }
    const requestId = revealRequestId.current + 1;
    revealRequestId.current = requestId;
    setRevealPending(true);
    setRevealError(null);
    try {
      const value = await revealBalance(
        state.walletClient!,
        balances.confidentialHandle,
      );
      if (revealRequestId.current === requestId) {
        setRevealedBalance(value);
      }
    } catch {
      if (revealRequestId.current === requestId) {
        setRevealError(
          "Balance reveal was rejected or is unavailable.",
        );
      }
    } finally {
      if (revealRequestId.current === requestId) {
        setRevealPending(false);
      }
    }
  }

  function hideRevealedBalance() {
    revealRequestId.current += 1;
    setRevealPending(false);
    setRevealedBalance(null);
    setRevealError(null);
  }

  const confidentialLabel =
    balances?.confidential === "encrypted"
      ? "ENCRYPTED"
      : balances?.confidential === "none"
        ? "NONE"
        : "UNAVAILABLE";

  return (
    <section className="sidebar-balances" aria-label="Wallet balances">
      <header>
        <strong>BALANCES</strong>
        <div className="balance-header-actions">
          <ContextHelp
            compact
            label="Help for wallet balances"
            title="HOW TO USE BALANCES"
            steps={[
              "SEP ETH pays Sepolia gas; acquire it from a Sepolia faucet if needed.",
              "GET TEST USDC requests demo tokens from the VeilBid faucet contract.",
              "Buyer actions wrap Test USDC into confidential vcUSDC when funding a tender.",
              "When vcUSDC shows ENCRYPTED, use the eye and authorize your wallet to reveal it for this session only.",
            ]}
            note="Refresh rereads Sepolia. Confidential values are never stored in the URL, browser storage, logs, or public evidence."
          />
          <button
            className="balance-refresh"
            type="button"
            onClick={() => void refresh()}
            disabled={!connected || status === "loading"}
            aria-label="Refresh wallet balances"
          >
            ↻
          </button>
        </div>
      </header>
      {!connected ? (
        <p className="balance-empty">
          {state.status === "wrong-chain"
            ? "SEPOLIA REQUIRED"
            : "CONNECT WALLET"}
        </p>
      ) : status === "loading" && !balances ? (
        <p className="balance-empty" aria-live="polite">READING SEPOLIA…</p>
      ) : status === "error" ? (
        <p className="balance-empty" role="alert">BALANCES UNAVAILABLE</p>
      ) : balances ? (
        <dl>
          <div>
            <dt>SEP ETH</dt>
            <dd>{compactAmount(balances.eth, 18, 4)}</dd>
          </div>
          <div>
            <dt>TEST USDC</dt>
            <dd>{compactAmount(balances.testUsdc, 6, 2)}</dd>
          </div>
          <div>
            <dt>vcUSDC</dt>
            <dd>
              <span className="confidential-balance">
                <span>
                  {revealedBalance === null
                    ? confidentialLabel
                    : compactAmount(revealedBalance, 6, 2)}
                </span>
                {balances.confidential === "encrypted" && (
                  <button
                    className="balance-reveal"
                    type="button"
                    onClick={() =>
                      revealedBalance === null
                        ? void reveal()
                        : hideRevealedBalance()
                    }
                    disabled={revealPending || status === "loading"}
                    aria-label={
                      revealedBalance === null
                        ? "Reveal confidential vcUSDC balance"
                        : "Hide confidential vcUSDC balance"
                    }
                    title={
                      revealedBalance === null
                        ? "Reveal with connected wallet"
                        : "Hide balance"
                    }
                  >
                    {revealedBalance === null ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        width="15"
                        height="15"
                      >
                        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        width="15"
                        height="15"
                      >
                        <path d="M3 3 21 21" />
                        <path d="M10.6 6.1A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a15.7 15.7 0 0 1-2.2 2.8M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a10.8 10.8 0 0 0 3.3-.5" />
                      </svg>
                    )}
                  </button>
                )}
              </span>
            </dd>
          </div>
        </dl>
      ) : null}
      <button
        className="balance-faucet"
        type="button"
        onClick={() => void faucet()}
        disabled={!connected || faucetPending}
      >
        {faucetPending ? "CONFIRMING…" : "GET TEST USDC"}
      </button>
      <p className="balance-note">
        Use the eye to decrypt vcUSDC with your wallet. The value stays
        in this browser session only.
      </p>
      {revealError && (
        <p className="balance-message" role="alert">
          {revealError}
        </p>
      )}
      {message && (
        <p
          className="balance-message"
          role={message.includes("failed") ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </section>
  );
}
