import { createViemHandleClient } from "@iexec-nox/handle";
import marketAbiJson from "@veilbid/chain-bindings/abis/VeilBidMarket";
import moduleAbiJson from "@veilbid/chain-bindings/abis/VeilBidSafePreparationModule";
import deployment from "@veilbid/chain-bindings/addresses/sepolia.test";
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
  account,
  onStage,
  rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL ?? defaultSepoliaRpcUrl,
}: {
  input: SafeTenderInput;
  walletClient: WalletClient;
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
  onStage("Simulating preparation-only write");
  const simulation = await publicClient.simulateContract({
    account,
    address: moduleAddress,
    abi: moduleAbi,
    functionName: "prepareInput",
    args: [
      encrypted.handle,
      encrypted.handleProof,
      marketAddress,
      actionDataHash,
      actionHash,
      terms.nonce,
    ],
  });
  onStage("Awaiting owner signature");
  const transactionHash = await walletClient.writeContract(simulation.request);
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: transactionHash,
  });
  if (receipt.status !== "success") throw new Error("Preparation transaction reverted.");

  return {
    actionHash,
    transactionHash,
    safe: safeAddress,
    target: marketAddress,
    safeTransactionData: encodeFunctionData({
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
    }),
  };
}
