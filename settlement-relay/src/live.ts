import { createViemHandleClient, type HandleClient } from "@iexec-nox/handle";
import {
  buildPublicMarketIndex,
  decodeVeilBidPublicEvent,
  type PublicMarketIndex,
} from "@veilbid/chain-bindings";
import marketAbiJson from "@veilbid/chain-bindings/abis/VeilBidMarket" with {
  type: "json",
};
import deploymentJson from "@veilbid/chain-bindings/addresses/sepolia.test" with {
  type: "json",
};
import {
  createPublicClient,
  createWalletClient,
  http,
  type Abi,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import type { RelayConfig } from "./config.js";
import {
  ProofPendingError,
  type ActionReadiness,
  type RelayAction,
  type RelayAdapter,
} from "./types.js";

const confirmationDepth = 12n;
const blockChunkSize = 2_000n;
const marketAbi = marketAbiJson as Abi;

interface DeploymentContract {
  address: Address;
  deploymentBlock: string;
}

interface RelayDeployment {
  chainId: number;
  kind: string;
  verified: boolean;
  contracts: {
    VeilBidMarket: DeploymentContract;
  };
}

interface TenderRelayView {
  status: number;
  encryptedWinnerBidIdHandle: Hex;
}

export interface RelayHealth {
  status: "ok" | "degraded" | "unavailable";
  chainId: number | null;
  latestBlock: string | null;
  marketCodePresent: boolean;
  deploymentKind: string;
  deploymentVerified: boolean;
}

export interface RelaySnapshot {
  index: PublicMarketIndex;
  chainTimestamp: bigint;
  latestBlock: bigint;
  finalizedBlock: bigint;
}

const deployment = deploymentJson as RelayDeployment;
const marketAddress = deployment.contracts.VeilBidMarket.address;

function parseTender(value: unknown): TenderRelayView {
  if (!value || typeof value !== "object") {
    throw new Error("malformed-tender-state");
  }
  const candidate = value as Partial<TenderRelayView>;
  if (
    typeof candidate.status !== "number" ||
    typeof candidate.encryptedWinnerBidIdHandle !== "string"
  ) {
    throw new Error("malformed-tender-state");
  }
  return candidate as TenderRelayView;
}

export function classifyActionReadiness(
  action: RelayAction,
  status: number,
  canClose: boolean,
): ActionReadiness {
  if (action.kind === "close") {
    if (status > 1) return "resolved";
    return status === 1 && canClose ? "actionable" : "waiting";
  }
  if (status >= 3) return "resolved";
  return status === 2 ? "actionable" : "waiting";
}

async function waitForWinnerProof(
  handleClient: Pick<HandleClient, "publicDecrypt">,
  handle: Hex,
  attempts: number,
  delayMs: number,
): Promise<Hex> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const result = await handleClient.publicDecrypt(handle as never);
      return result.decryptionProof as Hex;
    } catch {
      if (attempt + 1 < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw new ProofPendingError();
}

export class LiveRelayAdapter implements RelayAdapter {
  readonly #publicClient: PublicClient;
  readonly #walletClient: WalletClient;
  readonly #config: RelayConfig;
  #handleClient: HandleClient | null = null;

  constructor(
    publicClient: PublicClient,
    walletClient: WalletClient,
    config: RelayConfig,
  ) {
    this.#publicClient = publicClient;
    this.#walletClient = walletClient;
    this.#config = config;
  }

  async inspect(action: RelayAction): Promise<ActionReadiness> {
    const tender = parseTender(
      await this.#publicClient.readContract({
        address: marketAddress,
        abi: marketAbi,
        functionName: "getTender",
        args: [action.tenderId],
      }),
    );
    const canClose =
      action.kind === "close" &&
      (await this.#publicClient.readContract({
        address: marketAddress,
        abi: marketAbi,
        functionName: "canClose",
        args: [action.tenderId],
      })) === true;
    return classifyActionReadiness(action, tender.status, canClose);
  }

  async execute(action: RelayAction): Promise<Hex> {
    const account = this.#walletClient.account;
    if (!account) throw new Error("missing-finalizer-account");

    let functionName: "closeTender" | "finalizeTender";
    let args: readonly unknown[];
    if (action.kind === "close") {
      functionName = "closeTender";
      args = [action.tenderId];
    } else {
      const tender = parseTender(
        await this.#publicClient.readContract({
          address: marketAddress,
          abi: marketAbi,
          functionName: "getTender",
          args: [action.tenderId],
        }),
      );
      if (tender.status !== 2) throw new Error("stale-finalize");
      this.#handleClient ??= await createViemHandleClient(this.#walletClient);
      const proof = await waitForWinnerProof(
        this.#handleClient,
        tender.encryptedWinnerBidIdHandle,
        this.#config.proofAttempts,
        this.#config.proofDelayMs,
      );
      functionName = "finalizeTender";
      args = [action.tenderId, proof];
    }

    const simulation = await this.#publicClient.simulateContract({
      account,
      address: marketAddress,
      abi: marketAbi,
      functionName,
      args,
    });
    const transactionHash = await this.#walletClient.writeContract(
      simulation.request,
    );
    const receipt = await this.#publicClient.waitForTransactionReceipt({
      hash: transactionHash,
    });
    if (receipt.status !== "success") throw new Error("relay-write-reverted");
    return transactionHash;
  }
}

export class LiveRelay {
  readonly config: RelayConfig;
  readonly publicClient: PublicClient;
  readonly walletClient: WalletClient | null;

  constructor(config: RelayConfig) {
    if (deployment.chainId !== sepolia.id) {
      throw new Error("deployment-chain-mismatch");
    }
    this.config = config;
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(config.rpcUrl),
    });
    this.walletClient =
      config.signerPrivateKey === null
        ? null
        : createWalletClient({
            account: privateKeyToAccount(config.signerPrivateKey),
            chain: sepolia,
            transport: http(config.rpcUrl),
          });
  }

  assertWritesAllowed(): void {
    if (this.walletClient === null) throw new Error("missing-finalizer-account");
    if (!deployment.verified && !this.config.allowUnverifiedDeployment) {
      throw new Error("unverified-deployment-write-disabled");
    }
  }

  adapter(): LiveRelayAdapter {
    this.assertWritesAllowed();
    return new LiveRelayAdapter(
      this.publicClient,
      this.walletClient!,
      this.config,
    );
  }

  async snapshot(): Promise<RelaySnapshot> {
    const latest = await this.publicClient.getBlock({ blockTag: "latest" });
    const finalizedBlock =
      latest.number > confirmationDepth
        ? latest.number - confirmationDepth
        : 0n;
    const fromBlock = BigInt(
      deployment.contracts.VeilBidMarket.deploymentBlock,
    );
    const events = [];
    if (finalizedBlock >= fromBlock) {
      for (
        let chunkStart = fromBlock;
        chunkStart <= finalizedBlock;
        chunkStart += blockChunkSize
      ) {
        const chunkEnd =
          chunkStart + blockChunkSize - 1n < finalizedBlock
            ? chunkStart + blockChunkSize - 1n
            : finalizedBlock;
        const logs = await this.publicClient.getLogs({
          address: marketAddress,
          fromBlock: chunkStart,
          toBlock: chunkEnd,
        });
        for (const log of logs) {
          if (
            log.blockNumber === null ||
            log.transactionHash === null ||
            log.logIndex === null ||
            log.topics.length === 0
          ) {
            continue;
          }
          events.push(
            decodeVeilBidPublicEvent({
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              logIndex: log.logIndex,
              data: log.data,
              topics: log.topics as [Hex, ...Hex[]],
            }),
          );
        }
      }
    }
    return {
      index: buildPublicMarketIndex(events),
      chainTimestamp: latest.timestamp,
      latestBlock: latest.number,
      finalizedBlock,
    };
  }

  async health(): Promise<RelayHealth> {
    try {
      const [chainId, block, code] = await Promise.all([
        this.publicClient.getChainId(),
        this.publicClient.getBlock({ blockTag: "latest" }),
        this.publicClient.getCode({ address: marketAddress }),
      ]);
      const marketCodePresent = code !== undefined && code !== "0x";
      const available = chainId === sepolia.id && marketCodePresent;
      return {
        status:
          !available
            ? "unavailable"
            : deployment.verified
              ? "ok"
              : "degraded",
        chainId,
        latestBlock: block.number.toString(),
        marketCodePresent,
        deploymentKind: deployment.kind,
        deploymentVerified: deployment.verified,
      };
    } catch {
      return {
        status: "unavailable",
        chainId: null,
        latestBlock: null,
        marketCodePresent: false,
        deploymentKind: deployment.kind,
        deploymentVerified: deployment.verified,
      };
    }
  }
}
