import tokenAbiJson from "@veilbid/chain-bindings/abis/VeilBidTestUSDC";
import wrapperAbiJson from "@veilbid/chain-bindings/abis/VeilBidConfidentialUSDC";
import deployment from "@veilbid/chain-bindings/addresses/sepolia.release";
import { useCallback, useEffect, useState } from "react";
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
}

export type BalanceLoader = (account: Address) => Promise<WalletBalances>;
export type FaucetRequester = (
  walletClient: WalletClient,
  account: Address,
) => Promise<void>;

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
          ? "encrypted" as const
          : "none" as const,
      )
      .catch((cause: unknown) => {
        const message = cause instanceof Error ? cause.message : "";
        return message.includes("ERC7984ZeroBalance")
          ? "none" as const
          : "unavailable" as const;
      }),
  ]);
  if (typeof testUsdc !== "bigint") {
    throw new Error("Test USDC balance response is malformed.");
  }
  return {
    eth,
    testUsdc,
    confidential: confidentialResult,
  };
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
}: {
  wallet: WalletController;
  loadBalances?: BalanceLoader;
  requestFaucet?: FaucetRequester;
}) {
  const { state } = wallet;
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [faucetPending, setFaucetPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const connected =
    state.status === "connected" &&
    state.account &&
    state.walletClient;

  const refresh = useCallback(async () => {
    if (!state.account || state.status !== "connected") return;
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
      setBalances(null);
      setStatus("idle");
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
        <button
          className="balance-refresh"
          type="button"
          onClick={() => void refresh()}
          disabled={!connected || status === "loading"}
          aria-label="Refresh wallet balances"
        >
          ↻
        </button>
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
            <dd>{confidentialLabel}</dd>
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
        vcUSDC values stay private; only encrypted presence is shown.
      </p>
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
