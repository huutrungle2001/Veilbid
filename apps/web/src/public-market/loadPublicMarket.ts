import {
  buildPublicMarketIndex,
  decodeVeilBidPublicEvent,
  type PublicMarketIndex,
} from "@veilbid/chain-bindings";
import deployment from "@veilbid/chain-bindings/addresses/sepolia.release";
import {
  createPublicClient,
  http,
  type Address,
  type Hex,
} from "viem";
import { sepolia } from "viem/chains";

const confirmationDepth = 12n;
const blockChunkSize = 2_000n;
export const defaultSepoliaRpcUrl = "https://11155111.rpc.thirdweb.com";

interface DeploymentContract {
  address: Address;
  deploymentBlock: string;
}

interface Deployment {
  chainId: number;
  kind: string;
  verified: boolean;
  contracts: {
    VeilBidMarket: DeploymentContract;
  };
}

const releaseDeployment = deployment as Deployment;

export interface LoadedPublicMarket {
  index: PublicMarketIndex;
  finalizedBlock: bigint;
  latestBlock: bigint;
  deploymentKind: string;
  deploymentVerified: boolean;
}

export async function loadPublicMarket(
  rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL ??
    defaultSepoliaRpcUrl,
): Promise<LoadedPublicMarket> {
  if (releaseDeployment.chainId !== sepolia.id) {
    throw new Error("Generated deployment chain does not match Sepolia");
  }
  const client = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });
  const latestBlock = await client.getBlockNumber();
  const finalizedBlock =
    latestBlock > confirmationDepth
      ? latestBlock - confirmationDepth
      : 0n;
  const fromBlock = BigInt(
    releaseDeployment.contracts.VeilBidMarket.deploymentBlock,
  );
  if (finalizedBlock < fromBlock) {
    return {
      index: buildPublicMarketIndex([]),
      finalizedBlock,
      latestBlock,
      deploymentKind: releaseDeployment.kind,
      deploymentVerified: releaseDeployment.verified,
    };
  }

  const decoded = [];
  for (
    let chunkStart = fromBlock;
    chunkStart <= finalizedBlock;
    chunkStart += blockChunkSize
  ) {
    const chunkEnd =
      chunkStart + blockChunkSize - 1n < finalizedBlock
        ? chunkStart + blockChunkSize - 1n
        : finalizedBlock;
    const logs = await client.getLogs({
      address: releaseDeployment.contracts.VeilBidMarket.address,
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
      decoded.push(
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

  return {
    index: buildPublicMarketIndex(decoded),
    finalizedBlock,
    latestBlock,
    deploymentKind: releaseDeployment.kind,
    deploymentVerified: releaseDeployment.verified,
  };
}
