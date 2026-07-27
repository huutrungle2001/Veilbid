import { createViemHandleClient } from "@iexec-nox/handle";
import type {
  Eip1193Provider as SafeEip1193Provider,
} from "@safe-global/protocol-kit";
import factoryAbiJson from "@veilbid/chain-bindings/abis/VeilBidSafeModuleFactory";
import marketAbiJson from "@veilbid/chain-bindings/abis/VeilBidMarket";
import moduleAbiJson from "@veilbid/chain-bindings/abis/VeilBidSafePreparationModule";
import tokenAbiJson from "@veilbid/chain-bindings/abis/VeilBidTestUSDC";
import wrapperAbiJson from "@veilbid/chain-bindings/abis/VeilBidConfidentialUSDC";
import deployment from "@veilbid/chain-bindings/addresses/sepolia.release";
import {
  createPublicClient,
  encodeFunctionData,
  getAddress,
  http,
  isAddress,
  keccak256,
  maxUint48,
  parseUnits,
  toHex,
  zeroAddress,
  type Abi,
  type Address,
  type Hex,
  type EIP1193Provider,
  type WalletClient,
} from "viem";
import { sepolia } from "viem/chains";
import { defaultSepoliaRpcUrl } from "../public-market/loadPublicMarket";
import {
  readWalletBalances,
  type WalletBalances,
} from "../wallet/WalletBalancePanel";

const factoryAbi = factoryAbiJson as Abi;
const marketAbi = marketAbiJson as Abi;
const moduleAbi = moduleAbiJson as Abi;
const tokenAbi = tokenAbiJson as Abi;
const wrapperAbi = wrapperAbiJson as Abi;
const marketAddress = deployment.contracts.VeilBidMarket.address as Address;
const tokenAddress = deployment.contracts.VeilBidTestUSDC.address as Address;
const wrapperAddress = deployment.contracts
  .VeilBidConfidentialUSDC.address as Address;
const legacyModuleAddress =
  deployment.contracts.VeilBidSafePreparationModule.address as Address;
const demoSafeAddress = deployment.contracts.VeilBidDemoSafe.address as Address;
const legacySafeTransactionServiceUrl =
  "https://safe-transaction-sepolia.safe.global";
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
    name: "getOwners",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address[]" }],
  },
  {
    type: "function",
    name: "getThreshold",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "isModuleEnabled",
    stateMutability: "view",
    inputs: [{ name: "module", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "enableModule",
    stateMutability: "nonpayable",
    inputs: [{ name: "module", type: "address" }],
    outputs: [],
  },
] as const;

type ReleaseContracts = typeof deployment.contracts & {
  VeilBidSafeModuleFactory?: { address?: string };
};

export const safeReleaseConfiguration = {
  safe: demoSafeAddress,
  module: legacyModuleAddress,
  moduleEnabled:
    deployment.contracts.VeilBidSafePreparationModule.enabled === true,
  walletUrl: safeWalletUrl(demoSafeAddress),
} as const;

export interface SafeTenderInput {
  metadata: string;
  ceiling: string;
  deadline: string;
  vendors: string;
}

export interface SafeBatchTransaction {
  to: Address;
  value: "0";
  data: Hex;
}

export type SafeActionKind = "setup" | "fund" | "tender";

export interface SafePreparationResult {
  kind: SafeActionKind;
  actionHash: Hex | null;
  safe: Address;
  target: Address;
  safeTransactionData: Hex;
  preparationTransactionData: Hex | null;
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

export interface SafeAccountConfiguration {
  safe: Address;
  owners: readonly Address[];
  threshold: number;
  connectedOwner: boolean;
  factory: Address | null;
  module: Address | null;
  moduleDeployed: boolean;
  moduleEnabled: boolean;
  marketConfigured: boolean;
  marketAuthorized: boolean;
  legacyModule: boolean;
  balances: WalletBalances;
  ready: boolean;
}

export function safeWalletUrl(safe: Address) {
  return `https://app.safe.global/home?safe=sep:${safe}`;
}

export function configuredFactoryAddress(): Address | null {
  const manifestAddress = (deployment.contracts as ReleaseContracts)
    .VeilBidSafeModuleFactory?.address;
  const configured =
    import.meta.env.VITE_SAFE_MODULE_FACTORY_ADDRESS?.trim() || manifestAddress;
  return configured && isAddress(configured) ? getAddress(configured) : null;
}

export async function createSafeApiKit() {
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
  safe: Address,
) {
  const { default: Safe } = await import("@safe-global/protocol-kit");
  return Safe.init({
    provider: provider as SafeEip1193Provider,
    signer: account,
    safeAddress: safe,
  });
}

export async function discoverOwnerSafes(account: Address): Promise<Address[]> {
  const response = await (await createSafeApiKit()).getSafesByOwner(account);
  return response.safes
    .filter((safe) => isAddress(safe))
    .map((safe) => getAddress(safe));
}

export async function inspectSafeConfiguration({
  safe,
  account,
  rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL ?? defaultSepoliaRpcUrl,
}: {
  safe: Address;
  account: Address;
  rpcUrl?: string;
}): Promise<SafeAccountConfiguration> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });
  const bytecode = await client.getBytecode({ address: safe });
  if (!bytecode || bytecode === "0x") {
    throw new Error("The selected address is not a deployed Sepolia Safe.");
  }
  const [ownersResult, thresholdResult, connectedOwner, balances] =
    await Promise.all([
      client.readContract({
        address: safe,
        abi: safeReadAbi,
        functionName: "getOwners",
      }),
      client.readContract({
        address: safe,
        abi: safeReadAbi,
        functionName: "getThreshold",
      }),
      client.readContract({
        address: safe,
        abi: safeReadAbi,
        functionName: "isOwner",
        args: [account],
      }),
      readWalletBalances(safe, rpcUrl),
    ]);
  const owners = (ownersResult as Address[]).map(getAddress);
  const threshold = Number(thresholdResult);
  if (!connectedOwner) {
    throw new Error("Connected wallet is not an owner of the selected Safe.");
  }

  const configuredFactory = configuredFactoryAddress();
  const factoryBytecode = configuredFactory
    ? await client.getBytecode({ address: configuredFactory })
    : null;
  const factory =
    configuredFactory && factoryBytecode && factoryBytecode !== "0x"
      ? configuredFactory
      : null;
  let module: Address | null = null;
  let legacyModule = false;

  if (factory) {
    const [registered, predicted] = await Promise.all([
      client.readContract({
        address: factory,
        abi: factoryAbi,
        functionName: "moduleOf",
        args: [safe],
      }),
      client.readContract({
        address: factory,
        abi: factoryAbi,
        functionName: "predictModule",
        args: [safe],
      }),
    ]);
    if (registered !== zeroAddress) {
      module = getAddress(registered as Address);
    } else if (safe.toLowerCase() === demoSafeAddress.toLowerCase()) {
      module = legacyModuleAddress;
      legacyModule = true;
    } else {
      module = getAddress(predicted as Address);
    }
  } else if (safe.toLowerCase() === demoSafeAddress.toLowerCase()) {
    module = legacyModuleAddress;
    legacyModule = true;
  }

  const moduleBytecode = module
    ? await client.getBytecode({ address: module })
    : null;
  const moduleDeployed = Boolean(moduleBytecode && moduleBytecode !== "0x");
  const [moduleEnabled, configuredMarket, marketAuthorized] =
    module && moduleDeployed
      ? await Promise.all([
          client.readContract({
            address: safe,
            abi: safeReadAbi,
            functionName: "isModuleEnabled",
            args: [module],
          }) as Promise<boolean>,
          client.readContract({
            address: module,
            abi: moduleAbi,
            functionName: "market",
          }) as Promise<Address>,
          client.readContract({
            address: wrapperAddress,
            abi: wrapperAbi,
            functionName: "isOperator",
            args: [safe, marketAddress],
          }) as Promise<boolean>,
        ])
      : [false, zeroAddress, false] as const;
  const marketConfigured =
    configuredMarket.toLowerCase() === marketAddress.toLowerCase();

  return {
    safe,
    owners,
    threshold,
    connectedOwner: true,
    factory,
    module,
    moduleDeployed,
    moduleEnabled,
    marketConfigured,
    marketAuthorized,
    legacyModule,
    balances,
    ready:
      moduleDeployed &&
      moduleEnabled &&
      marketConfigured &&
      marketAuthorized,
  };
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
  return {
    metadataHash: keccak256(toHex(metadata)),
    publicCeiling,
    bidDeadline,
    approvedVendors: approvedVendors as Address[],
  };
}

async function unusedPreparationNonce({
  module,
  rpcUrl,
}: {
  module: Address;
  rpcUrl: string;
}) {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });
  const seed = BigInt(`0x${crypto.getRandomValues(new Uint8Array(16))
    .reduce((hex, byte) => `${hex}${byte.toString(16).padStart(2, "0")}`, "")}`);
  for (let offset = 0n; offset < 16n; offset += 1n) {
    const nonce = seed + offset + 1n;
    const used = await client.readContract({
      address: module,
      abi: moduleAbi,
      functionName: "usedNonces",
      args: [nonce],
    });
    if (!used) return nonce;
  }
  throw new Error("Could not allocate a fresh Safe preparation nonce.");
}

async function proposeSafeBatch({
  kind,
  safe,
  transactions,
  provider,
  account,
  onStage,
  actionHash = null,
  target = transactions[transactions.length - 1]?.to ?? safe,
  safeTransactionData = transactions[transactions.length - 1]?.data ?? "0x",
  preparationTransactionData = null,
  rpcUrl,
}: {
  kind: SafeActionKind;
  safe: Address;
  transactions: readonly SafeBatchTransaction[];
  provider: EIP1193Provider;
  account: Address;
  onStage: (stage: string) => void;
  actionHash?: Hex | null;
  target?: Address;
  safeTransactionData?: Hex;
  preparationTransactionData?: Hex | null;
  rpcUrl: string;
}): Promise<SafePreparationResult> {
  if (transactions.length === 0) throw new Error("Safe batch is empty.");
  const safeKit = await protocolKit(provider, account, safe);
  if (!(await safeKit.isOwner(account))) {
    throw new Error("Connected wallet is not an owner of the selected Safe.");
  }
  const apiKit = await createSafeApiKit();
  let nextNonce: number | undefined;
  try {
    nextNonce = Number(await apiKit.getNextNonce(safe));
  } catch {
    nextNonce = await safeKit.getNonce();
  }
  onStage("Building the Safe transaction");
  const safeTransaction = await safeKit.createTransaction({
    transactions: [...transactions],
    options: { nonce: nextNonce },
  });
  const safeTxHash = (await safeKit.getTransactionHash(safeTransaction)) as Hex;

  onStage("Awaiting one Safe owner approval");
  const signedTransaction = await safeKit.signTransaction(safeTransaction);
  const senderSignature = signedTransaction.getSignature(account)?.data;
  if (!senderSignature) throw new Error("Safe owner signature was not produced.");

  onStage("Publishing proposal to Safe Transaction Service");
  await apiKit.proposeTransaction({
    safeAddress: safe,
    safeTransactionData: signedTransaction.data,
    safeTxHash,
    senderAddress: account,
    senderSignature,
    origin: `VeilBid Safe ${kind}`,
  });

  const threshold = await safeKit.getThreshold();
  let executionTransactionHash: Hex | null = null;
  if (threshold === 1) {
    onStage("Threshold reached; awaiting the execution transaction");
    const execution = await safeKit.executeTransaction(signedTransaction);
    executionTransactionHash = execution.hash as Hex;
    onStage("Safe batch submitted; waiting for Sepolia confirmation");
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: executionTransactionHash,
    });
    if (receipt.status !== "success") throw new Error("Safe batch reverted.");
  }

  return {
    kind,
    actionHash,
    safe,
    target,
    safeTransactionData,
    preparationTransactionData,
    transactions,
    safeTxHash,
    threshold,
    confirmations: 1,
    executed: threshold === 1,
    executionTransactionHash,
  };
}

export async function setupSafeForVeilBid({
  configuration,
  provider,
  account,
  onStage,
  rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL ?? defaultSepoliaRpcUrl,
}: {
  configuration: SafeAccountConfiguration;
  provider: EIP1193Provider;
  account: Address;
  onStage: (stage: string) => void;
  rpcUrl?: string;
}) {
  const { safe, factory, module } = configuration;
  if (!module) {
    throw new Error("The Safe module factory is not deployed or configured.");
  }
  const transactions: SafeBatchTransaction[] = [];
  if (!configuration.moduleDeployed) {
    if (!factory) throw new Error("Module factory is required for this Safe.");
    transactions.push({
      to: factory,
      value: "0",
      data: encodeFunctionData({
        abi: factoryAbi,
        functionName: "deployModule",
        args: [safe],
      }),
    });
  }
  if (!configuration.moduleEnabled) {
    transactions.push({
      to: safe,
      value: "0",
      data: encodeFunctionData({
        abi: safeReadAbi,
        functionName: "enableModule",
        args: [module],
      }),
    });
  }
  if (!configuration.marketConfigured) {
    transactions.push({
      to: module,
      value: "0",
      data: encodeFunctionData({
        abi: moduleAbi,
        functionName: "configureMarket",
        args: [marketAddress],
      }),
    });
  }
  if (!configuration.marketAuthorized) {
    transactions.push({
      to: wrapperAddress,
      value: "0",
      data: encodeFunctionData({
        abi: wrapperAbi,
        functionName: "setOperator",
        args: [marketAddress, maxUint48],
      }),
    });
  }
  if (transactions.length === 0) {
    throw new Error("This Safe is already configured for VeilBid.");
  }
  return proposeSafeBatch({
    kind: "setup",
    safe,
    transactions,
    provider,
    account,
    onStage,
    rpcUrl,
  });
}

export async function fundSafeForVeilBid({
  configuration,
  amount,
  provider,
  account,
  onStage,
  rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL ?? defaultSepoliaRpcUrl,
}: {
  configuration: SafeAccountConfiguration;
  amount: bigint;
  provider: EIP1193Provider;
  account: Address;
  onStage: (stage: string) => void;
  rpcUrl?: string;
}) {
  if (amount <= 0n) throw new Error("Funding amount must be positive.");
  const transactions: SafeBatchTransaction[] = [];
  if (configuration.balances.testUsdc < amount) {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });
    const faucetAmount = await publicClient.readContract({
      address: tokenAddress,
      abi: tokenAbi,
      functionName: "FAUCET_AMOUNT",
    });
    if (typeof faucetAmount !== "bigint" || faucetAmount <= 0n) {
      throw new Error("Test USDC faucet configuration is unavailable.");
    }
    const shortfall = amount - configuration.balances.testUsdc;
    const faucetCalls = Number(
      (shortfall + faucetAmount - 1n) / faucetAmount,
    );
    if (faucetCalls > 8) {
      throw new Error("Funding amount exceeds the bounded demo faucet batch.");
    }
    for (let index = 0; index < faucetCalls; index += 1) {
      transactions.push({
        to: tokenAddress,
        value: "0",
        data: encodeFunctionData({
          abi: tokenAbi,
          functionName: "faucet",
        }),
      });
    }
  }
  transactions.push(
    {
      to: tokenAddress,
      value: "0",
      data: encodeFunctionData({
        abi: tokenAbi,
        functionName: "approve",
        args: [wrapperAddress, amount],
      }),
    },
    {
      to: wrapperAddress,
      value: "0",
      data: encodeFunctionData({
        abi: wrapperAbi,
        functionName: "wrap",
        args: [configuration.safe, amount],
      }),
    },
  );
  return proposeSafeBatch({
    kind: "fund",
    safe: configuration.safe,
    transactions,
    provider,
    account,
    onStage,
    rpcUrl,
  });
}

export async function prepareSafeTender({
  input,
  configuration,
  walletClient,
  provider,
  account,
  onStage,
  rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL ?? defaultSepoliaRpcUrl,
}: {
  input: SafeTenderInput;
  configuration: SafeAccountConfiguration;
  walletClient: WalletClient;
  provider: EIP1193Provider;
  account: Address;
  onStage: (stage: string) => void;
  rpcUrl?: string;
}) {
  if (!configuration.ready || !configuration.module) {
    throw new Error("Configure this Safe for VeilBid before creating a tender.");
  }
  const terms = parseSafeTenderInput(input);
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });
  const nonce = await unusedPreparationNonce({
    module: configuration.module,
    rpcUrl,
  });
  const actionDataHash = (await publicClient.readContract({
    address: marketAddress,
    abi: marketAbi,
    functionName: "hashTenderAction",
    args: [
      configuration.safe,
      terms.metadataHash,
      terms.publicCeiling,
      terms.bidDeadline,
      terms.approvedVendors,
    ],
  })) as Hex;
  const actionHash = (await publicClient.readContract({
    address: configuration.module,
    abi: moduleAbi,
    functionName: "computeActionHash",
    args: [actionDataHash, nonce],
  })) as Hex;

  onStage("Encrypting budget for the selected Safe module");
  const handles = await createViemHandleClient(walletClient);
  const encrypted = await handles.encryptInput(
    terms.publicCeiling,
    "uint256",
    configuration.module,
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
      nonce,
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
      configuration.module,
      nonce,
    ],
  });
  const transactions: SafeBatchTransaction[] = [
    {
      to: configuration.module,
      value: "0",
      data: preparationTransactionData,
    },
    { to: marketAddress, value: "0", data: safeTransactionData },
  ];

  return proposeSafeBatch({
    kind: "tender",
    safe: configuration.safe,
    transactions,
    provider,
    account,
    onStage,
    actionHash,
    target: marketAddress,
    safeTransactionData,
    preparationTransactionData,
    rpcUrl,
  });
}

export async function getSafeProposalStatus(
  safeTxHash: Hex,
): Promise<SafeProposalStatus> {
  const transaction = await (await createSafeApiKit()).getTransaction(safeTxHash);
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
  safe,
  safeTxHash,
  provider,
  account,
  onStage,
  rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL ?? defaultSepoliaRpcUrl,
}: {
  safe: Address;
  safeTxHash: Hex;
  provider: EIP1193Provider;
  account: Address;
  onStage: (stage: string) => void;
  rpcUrl?: string;
}): Promise<SafeProposalStatus> {
  const safeKit = await protocolKit(provider, account, safe);
  if (!(await safeKit.isOwner(account))) {
    throw new Error("Connected wallet is not an owner of the selected Safe.");
  }
  const apiKit = await createSafeApiKit();
  let transaction = await apiKit.getTransaction(safeTxHash);
  if (transaction.safe.toLowerCase() !== safe.toLowerCase()) {
    throw new Error("Safe proposal does not belong to the selected Safe.");
  }
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
