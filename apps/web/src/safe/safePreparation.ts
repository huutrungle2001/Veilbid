import { createViemHandleClient } from "@iexec-nox/handle";
import type {
  Eip1193Provider as SafeEip1193Provider,
} from "@safe-global/protocol-kit";
import marketAbiJson from "@veilbid/chain-bindings/abis/VeilBidMarket";
import moduleAbiJson from "@veilbid/chain-bindings/abis/VeilBidSafePreparationModule";
import deployment from "@veilbid/chain-bindings/addresses/sepolia.release";
import {
  createPublicClient,
  encodeFunctionData,
  http,
  isAddress,
  keccak256,
  parseUnits,
  toHex,
  type Abi,
  type Address,
  type Hex,
  type EIP1193Provider,
  type WalletClient,
} from "viem";
import { sepolia } from "viem/chains";
import { defaultSepoliaRpcUrl } from "../public-market/loadPublicMarket";

const marketAbi = marketAbiJson as Abi;
const moduleAbi = moduleAbiJson as Abi;
const marketAddress = deployment.contracts.VeilBidMarket.address as Address;
const moduleAddress =
  deployment.contracts.VeilBidSafePreparationModule.address as Address;
const safeAddress = deployment.contracts.VeilBidDemoSafe.address as Address;
const legacySafeTransactionServiceUrl =
  "https://safe-transaction-sepolia.safe.global";
export const safeReleaseConfiguration = {
  safe: safeAddress,
  module: moduleAddress,
  moduleEnabled:
    deployment.contracts.VeilBidSafePreparationModule.enabled === true,
  walletUrl: `https://app.safe.global/home?safe=sep:${safeAddress}`,
} as const;
const safeReadAbi = [
  {
    type: "function",
    name: "isOwner",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "isModuleEnabled",
    stateMutability: "view",
    inputs: [{ name: "module", type: "address" }],
    outputs: [{ type: "bool" }],
  },
] as const;

export interface SafeTenderInput {
  metadata: string;
  ceiling: string;
  deadline: string;
  vendors: string;
  nonce: string;
}

export interface SafeBatchTransaction {
  to: Address;
  value: "0";
  data: Hex;
}

export interface SafePreparationResult {
  actionHash: Hex;
  safe: Address;
  target: Address;
  safeTransactionData: Hex;
  preparationTransactionData: Hex;
  transactions: readonly SafeBatchTransaction[];
  safeTxHash: Hex;
  threshold: number;
  confirmations: number;
  executed: boolean;
  executionTransactionHash: Hex | null;
}

export interface SafeProposalStatus {
  safeTxHash: Hex;
  threshold: number;
  confirmations: number;
  executed: boolean;
  executionTransactionHash: Hex | null;
}

async function safeApiKit() {
  const { default: SafeApiKit } = await import("@safe-global/api-kit");
  const apiKey = import.meta.env.VITE_SAFE_TRANSACTION_SERVICE_API_KEY?.trim();
  return new SafeApiKit(
    apiKey
      ? { chainId: BigInt(sepolia.id), apiKey }
      : {
          chainId: BigInt(sepolia.id),
          txServiceUrl: legacySafeTransactionServiceUrl,
        },
  );
}

async function protocolKit(
  provider: EIP1193Provider,
  account: Address,
) {
  const { default: Safe } = await import("@safe-global/protocol-kit");
  return Safe.init({
    provider: provider as SafeEip1193Provider,
    signer: account,
    safeAddress,
  });
}

export function parseSafeTenderInput(input: SafeTenderInput) {
  const metadata = input.metadata.trim();
  if (!metadata) throw new Error("Metadata is required.");
  const publicCeiling = parseUnits(input.ceiling, 6);
  if (publicCeiling <= 0n) throw new Error("Ceiling must be positive.");
  const bidDeadline = BigInt(Math.floor(new Date(input.deadline).getTime() / 1_000));
  if (bidDeadline <= BigInt(Math.floor(Date.now() / 1_000))) {
    throw new Error("Deadline must be in the future.");
  }
  const approvedVendors = input.vendors
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    approvedVendors.length < 1 ||
    approvedVendors.length > 8 ||
    approvedVendors.some((value) => !isAddress(value)) ||
    new Set(approvedVendors.map((value) => value.toLowerCase())).size !==
      approvedVendors.length
  ) {
    throw new Error("Provide 1–8 unique vendor addresses.");
  }
  if (!/^[1-9][0-9]*$/.test(input.nonce)) {
    throw new Error("Nonce must be a positive integer.");
  }
  return {
    metadataHash: keccak256(toHex(metadata)),
    publicCeiling,
    bidDeadline,
    approvedVendors: approvedVendors as Address[],
    nonce: BigInt(input.nonce),
  };
}

export async function prepareSafeTender({
  input,
  walletClient,
  provider,
  account,
  onStage,
  rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL ?? defaultSepoliaRpcUrl,
}: {
  input: SafeTenderInput;
  walletClient: WalletClient;
  provider: EIP1193Provider;
  account: Address;
  onStage: (stage: string) => void;
  rpcUrl?: string;
}) {
  const terms = parseSafeTenderInput(input);
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });
  onStage("Checking Safe owner and module status");
  const [isOwner, moduleEnabled] = await Promise.all([
    publicClient.readContract({
      address: safeAddress,
      abi: safeReadAbi,
      functionName: "isOwner",
      args: [account],
    }),
    publicClient.readContract({
      address: safeAddress,
      abi: safeReadAbi,
      functionName: "isModuleEnabled",
      args: [moduleAddress],
    }),
  ]);
  if (!isOwner) throw new Error("Connected wallet is not an owner of the demo Safe.");
  if (!moduleEnabled) throw new Error("Preparation module is disabled in the demo Safe.");

  const actionDataHash = (await publicClient.readContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "hashTenderAction",
    args: [
      safeAddress,
      terms.metadataHash,
      terms.publicCeiling,
      terms.bidDeadline,
      terms.approvedVendors,
    ],
  })) as Hex;
  const actionHash = (await publicClient.readContract({
    address: moduleAddress,
    abi: moduleAbi,
    functionName: "computeActionHash",
    args: [actionDataHash, terms.nonce],
  })) as Hex;

  onStage("Encrypting budget for preparation module");
  const handles = await createViemHandleClient(walletClient);
  const encrypted = await handles.encryptInput(
    terms.publicCeiling,
    "uint256",
    moduleAddress,
  );
  const preparationTransactionData = encodeFunctionData({
    abi: moduleAbi,
    functionName: "prepareInputForSafe",
    args: [
      encrypted.handle,
      encrypted.handleProof,
      account,
      marketAddress,
      actionDataHash,
      actionHash,
      terms.nonce,
    ],
  });
  const safeTransactionData = encodeFunctionData({
    abi: marketAbi,
    functionName: "createTenderAuthorized",
    args: [
      terms.metadataHash,
      terms.publicCeiling,
      terms.bidDeadline,
      terms.approvedVendors,
      moduleAddress,
      terms.nonce,
    ],
  });
  const transactions: SafeBatchTransaction[] = [
    { to: moduleAddress, value: "0", data: preparationTransactionData },
    { to: marketAddress, value: "0", data: safeTransactionData },
  ];

  onStage("Building one atomic Safe batch");
  const safeKit = await protocolKit(provider, account);
  const safeTransaction = await safeKit.createTransaction({ transactions });
  const safeTxHash = (await safeKit.getTransactionHash(safeTransaction)) as Hex;

  onStage("Awaiting one Safe owner approval");
  const signedTransaction = await safeKit.signTransaction(safeTransaction);
  const senderSignature = signedTransaction.getSignature(account)?.data;
  if (!senderSignature) throw new Error("Safe owner signature was not produced.");

  onStage("Publishing proposal to Safe Transaction Service");
  const apiKit = await safeApiKit();
  await apiKit.proposeTransaction({
    safeAddress,
    safeTransactionData: signedTransaction.data,
    safeTxHash,
    senderAddress: account,
    senderSignature,
    origin: "VeilBid Safe Buyer",
  });

  const threshold = await safeKit.getThreshold();
  let executionTransactionHash: Hex | null = null;
  if (threshold === 1) {
    onStage("Threshold reached; awaiting the execution transaction");
    const execution = await safeKit.executeTransaction(signedTransaction);
    executionTransactionHash = execution.hash as Hex;
    onStage("Safe batch submitted; waiting for Sepolia confirmation");
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: executionTransactionHash,
    });
    if (receipt.status !== "success") throw new Error("Safe batch reverted.");
  }

  return {
    actionHash,
    safe: safeAddress,
    target: marketAddress,
    safeTransactionData,
    preparationTransactionData,
    transactions,
    safeTxHash,
    threshold,
    confirmations: 1,
    executed: threshold === 1,
    executionTransactionHash,
  } satisfies SafePreparationResult;
}

export async function getSafeProposalStatus(
  safeTxHash: Hex,
): Promise<SafeProposalStatus> {
  const transaction = await (await safeApiKit()).getTransaction(safeTxHash);
  return {
    safeTxHash,
    threshold: transaction.confirmationsRequired,
    confirmations: transaction.confirmations?.length ?? 0,
    executed: transaction.isExecuted,
    executionTransactionHash:
      (transaction.transactionHash as Hex | null) ?? null,
  };
}

export async function approveAndExecuteSafeProposal({
  safeTxHash,
  provider,
  account,
  onStage,
  rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL ?? defaultSepoliaRpcUrl,
}: {
  safeTxHash: Hex;
  provider: EIP1193Provider;
  account: Address;
  onStage: (stage: string) => void;
  rpcUrl?: string;
}): Promise<SafeProposalStatus> {
  const safeKit = await protocolKit(provider, account);
  if (!(await safeKit.isOwner(account))) {
    throw new Error("Connected wallet is not an owner of the demo Safe.");
  }
  const apiKit = await safeApiKit();
  let transaction = await apiKit.getTransaction(safeTxHash);
  const alreadyConfirmed = transaction.confirmations?.some(
    ({ owner }) => owner.toLowerCase() === account.toLowerCase(),
  );
  if (!alreadyConfirmed) {
    onStage("Awaiting Safe owner approval");
    const signature = await safeKit.signHash(safeTxHash);
    await apiKit.confirmTransaction(safeTxHash, signature.data);
    transaction = await apiKit.getTransaction(safeTxHash);
  }
  const confirmations = transaction.confirmations?.length ?? 0;
  if (!transaction.isExecuted && confirmations >= transaction.confirmationsRequired) {
    onStage("Threshold reached; awaiting the execution transaction");
    const execution = await safeKit.executeTransaction(transaction);
    const executionTransactionHash = execution.hash as Hex;
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: executionTransactionHash,
    });
    if (receipt.status !== "success") throw new Error("Safe batch reverted.");
    return {
      safeTxHash,
      threshold: transaction.confirmationsRequired,
      confirmations,
      executed: true,
      executionTransactionHash,
    };
  }
  return getSafeProposalStatus(safeTxHash);
}

export function serializeSafeTransactionHandoff(
  result: Pick<SafePreparationResult, "transactions">,
): string {
  return JSON.stringify(result.transactions, null, 2);
}
