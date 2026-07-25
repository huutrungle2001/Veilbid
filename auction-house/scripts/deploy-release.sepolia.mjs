import { strict as assert } from "node:assert";
import {
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import Safe from "@safe-global/protocol-kit";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  getAddress,
  getContract,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const auctionHouseRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(auctionHouseRoot, "..");
const deploymentPath = resolve(
  auctionHouseRoot,
  "deployments/sepolia.release.json",
);
const temporaryDeploymentPath = `${deploymentPath}.tmp`;
const dryRun = process.argv.includes("--dry-run");
const maxUint48 = (1n << 48n) - 1n;

const artifactPaths = {
  VeilBidTestUSDC:
    "artifacts/contracts/test-assets/VeilBidTestAssets.sol/VeilBidTestUSDC.json",
  VeilBidConfidentialUSDC:
    "artifacts/contracts/test-assets/VeilBidTestAssets.sol/VeilBidConfidentialUSDC.json",
  VeilBidMarket:
    "artifacts/contracts/market/VeilBidMarket.sol/VeilBidMarket.json",
  VeilBidSafePreparationModule:
    "artifacts/contracts/safe/VeilBidSafePreparationModule.sol/VeilBidSafePreparationModule.json",
};

let stage = "CONFIGURATION";
let manifest;

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_MISSING`);
  return value;
}

function privateKeyFromEnvironment() {
  const raw = requiredEnvironment("SEPOLIA_PRIVATE_KEY");
  const value = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error("SEPOLIA_PRIVATE_KEY_INVALID");
  }
  return value;
}

function git(args) {
  const result = spawnSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error("GIT_COMMAND_FAILED");
  return result.stdout.trim();
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function saveManifest() {
  if (dryRun) return;
  writeFileSync(
    temporaryDeploymentPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    { mode: 0o644 },
  );
  renameSync(temporaryDeploymentPath, deploymentPath);
}

function assertSourceState(sourceCommit) {
  const upstreamCommit = git(["rev-parse", "@{upstream}"]);
  assert.equal(sourceCommit, upstreamCommit, "HEAD_NOT_PUSHED");
  const allowedPath = "auction-house/deployments/sepolia.release.json";
  const changes = git([
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ])
    .split("\n")
    .filter(Boolean);
  assert.equal(
    changes.every((line) => line.slice(3) === allowedPath),
    true,
    "WORKTREE_NOT_CLEAN",
  );
}

function newManifest(sourceCommit, deployer, safeSaltNonce) {
  return {
    schemaVersion: 1,
    network: "ethereum-sepolia",
    chainId: sepolia.id,
    kind: "release",
    deploymentState: "in-progress",
    verified: false,
    sourceCommit,
    deployedBy: deployer,
    safe: {
      version: "1.4.1",
      owners: [deployer],
      threshold: 1,
      saltNonce: safeSaltNonce,
    },
    contracts: {},
    configurationTransactions: {},
    sourceVerification: {
      provider: "sourcify-v2",
      status: "pending",
      checkedAt: null,
    },
    blockers: [],
    evidence: [],
    notes: [
      "This is VeilBid's canonical Ethereum Sepolia release deployment.",
      "The threshold-1 Safe is the documented browser-demo configuration; all Safe-owned spending still requires a normal Safe transaction.",
      "Source verification remains pending until exact Sourcify mappings and runtime bytecode checks pass.",
    ],
  };
}

async function main() {
  const rpcUrl = requiredEnvironment("SEPOLIA_RPC_URL");
  const privateKey = privateKeyFromEnvironment();
  const deployer = privateKeyToAccount(privateKey);
  const sourceCommit = git(["rev-parse", "HEAD"]);
  assertSourceState(sourceCommit);
  const safeSaltNonce = BigInt(`0x${sourceCommit}`).toString();

  if (existsSync(deploymentPath)) {
    manifest = readJson(deploymentPath);
    assert.equal(manifest.kind, "release");
    assert.equal(manifest.verified, false);
    assert.equal(manifest.sourceCommit, sourceCommit);
    assert.equal(
      getAddress(manifest.deployedBy),
      getAddress(deployer.address),
    );
    assert.equal(manifest.safe.saltNonce, safeSaltNonce);
  } else {
    manifest = newManifest(
      sourceCommit,
      deployer.address,
      safeSaltNonce,
    );
  }

  const artifacts = Object.fromEntries(
    Object.entries(artifactPaths).map(([name, relativePath]) => [
      name,
      readJson(resolve(auctionHouseRoot, relativePath)),
    ]),
  );
  const transport = http(rpcUrl);
  const publicClient = createPublicClient({
    chain: sepolia,
    transport,
  });
  const walletClient = createWalletClient({
    account: deployer,
    chain: sepolia,
    transport,
  });
  assert.equal(await publicClient.getChainId(), sepolia.id);

  const predictedSafeKit = await Safe.init({
    provider: rpcUrl,
    signer: privateKey,
    predictedSafe: {
      safeAccountConfig: {
        owners: [deployer.address],
        threshold: 1,
      },
      safeDeploymentConfig: {
        safeVersion: "1.4.1",
        saltNonce: safeSaltNonce,
      },
    },
  });
  const predictedSafeAddress = await predictedSafeKit.getAddress();

  if (dryRun) {
    console.log(
      JSON.stringify({
        mode: "dry-run",
        network: manifest.network,
        chainId: manifest.chainId,
        sourceCommit,
        deployer: deployer.address,
        predictedSafe: predictedSafeAddress,
        operations: [
          "deploy VeilBidTestUSDC",
          "deploy VeilBidConfidentialUSDC",
          "deploy VeilBidMarket and embedded VeilBidAwardReceipt",
          "deploy Safe 1.4.1",
          "deploy VeilBidSafePreparationModule",
          "enable module through Safe",
          "configure market through Safe",
          "authorize market as Safe token operator",
        ],
      }),
    );
    return;
  }

  saveManifest();

  async function confirmedReceipt(hash) {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 2,
    });
    assert.equal(receipt.status, "success");
    return receipt;
  }

  async function deployContract(name, artifact, args = []) {
    const current = manifest.contracts[name];
    if (current?.address) {
      const code = await publicClient.getCode({
        address: current.address,
      });
      assert.ok(code && code !== "0x");
      return getAddress(current.address);
    }

    let transactionHash = current?.deploymentTransaction;
    if (!transactionHash) {
      transactionHash = await walletClient.deployContract({
        abi: artifact.abi,
        account: deployer,
        args,
        bytecode: artifact.bytecode,
      });
      manifest.contracts[name] = {
        deploymentTransaction: transactionHash,
      };
      saveManifest();
    }
    const receipt = await confirmedReceipt(transactionHash);
    assert.ok(receipt.contractAddress);
    manifest.contracts[name] = {
      address: getAddress(receipt.contractAddress),
      deploymentTransaction: transactionHash,
      deploymentBlock: receipt.blockNumber.toString(),
    };
    saveManifest();
    return getAddress(receipt.contractAddress);
  }

  stage = "UNDERLYING_DEPLOYMENT";
  const underlyingAddress = await deployContract(
    "VeilBidTestUSDC",
    artifacts.VeilBidTestUSDC,
  );

  stage = "WRAPPER_DEPLOYMENT";
  const wrapperAddress = await deployContract(
    "VeilBidConfidentialUSDC",
    artifacts.VeilBidConfidentialUSDC,
    [underlyingAddress],
  );

  stage = "MARKET_DEPLOYMENT";
  const marketAddress = await deployContract(
    "VeilBidMarket",
    artifacts.VeilBidMarket,
    [wrapperAddress],
  );
  const market = getContract({
    address: marketAddress,
    abi: artifacts.VeilBidMarket.abi,
    client: publicClient,
  });
  const receiptAddress = getAddress(await market.read.awardReceipt());
  const receiptCode = await publicClient.getCode({
    address: receiptAddress,
  });
  assert.ok(receiptCode && receiptCode !== "0x");
  const marketDeployment = manifest.contracts.VeilBidMarket;
  manifest.contracts.VeilBidAwardReceipt = {
    address: receiptAddress,
    deploymentTransaction: marketDeployment.deploymentTransaction,
    deploymentBlock: marketDeployment.deploymentBlock,
  };
  saveManifest();

  stage = "SAFE_DEPLOYMENT";
  const existingSafe = manifest.contracts.VeilBidDemoSafe;
  if (existingSafe?.address) {
    assert.equal(
      getAddress(existingSafe.address),
      getAddress(predictedSafeAddress),
    );
    assert.equal(await predictedSafeKit.isSafeDeployed(), true);
  } else {
    let safeDeploymentHash = existingSafe?.deploymentTransaction;
    if (!safeDeploymentHash) {
      if (await predictedSafeKit.isSafeDeployed()) {
        throw new Error("SAFE_DEPLOYMENT_TRANSACTION_MISSING");
      }
      const transaction =
        await predictedSafeKit.createSafeDeploymentTransaction();
      safeDeploymentHash = await walletClient.sendTransaction({
        account: deployer,
        data: transaction.data,
        to: transaction.to,
        value: BigInt(transaction.value),
      });
      manifest.contracts.VeilBidDemoSafe = {
        deploymentTransaction: safeDeploymentHash,
      };
      saveManifest();
    }
    const safeDeploymentReceipt =
      await confirmedReceipt(safeDeploymentHash);
    assert.equal(await predictedSafeKit.isSafeDeployed(), true);
    manifest.contracts.VeilBidDemoSafe = {
      address: getAddress(predictedSafeAddress),
      deploymentTransaction: safeDeploymentHash,
      deploymentBlock: safeDeploymentReceipt.blockNumber.toString(),
    };
    saveManifest();
  }

  const safeKit = await predictedSafeKit.connect({
    safeAddress: predictedSafeAddress,
  });
  assert.equal(safeKit.getContractVersion(), "1.4.1");
  assert.deepEqual(
    (await safeKit.getOwners()).map((owner) => getAddress(owner)),
    [getAddress(deployer.address)],
  );
  assert.equal(await safeKit.getThreshold(), 1);

  stage = "MODULE_DEPLOYMENT";
  const moduleAddress = await deployContract(
    "VeilBidSafePreparationModule",
    artifacts.VeilBidSafePreparationModule,
    [predictedSafeAddress],
  );
  const module = getContract({
    address: moduleAddress,
    abi: artifacts.VeilBidSafePreparationModule.abi,
    client: publicClient,
  });
  const wrapper = getContract({
    address: wrapperAddress,
    abi: artifacts.VeilBidConfidentialUSDC.abi,
    client: publicClient,
  });

  async function executeSafeTransaction(label, transaction) {
    let hash = manifest.configurationTransactions[label]?.transactionHash;
    if (!hash) {
      const result = await safeKit.executeTransaction(transaction);
      hash = result.hash;
      manifest.configurationTransactions[label] = {
        transactionHash: hash,
      };
      saveManifest();
    }
    const receipt = await confirmedReceipt(hash);
    manifest.configurationTransactions[label] = {
      transactionHash: hash,
      block: receipt.blockNumber.toString(),
    };
    saveManifest();
  }

  async function executeSafeCall(label, to, data) {
    await executeSafeTransaction(
      label,
      await safeKit.createTransaction({
        transactions: [{ data, to, value: "0" }],
      }),
    );
  }

  stage = "MODULE_ENABLEMENT";
  if (!(await safeKit.isModuleEnabled(moduleAddress))) {
    await executeSafeTransaction(
      "enableModule",
      await safeKit.createEnableModuleTx(moduleAddress),
    );
  }
  assert.equal(await safeKit.isModuleEnabled(moduleAddress), true);

  stage = "MARKET_CONFIGURATION";
  const configuredMarket = await module.read.market();
  if (configuredMarket === "0x0000000000000000000000000000000000000000") {
    await executeSafeCall(
      "configureMarket",
      moduleAddress,
      encodeFunctionData({
        abi: artifacts.VeilBidSafePreparationModule.abi,
        functionName: "configureMarket",
        args: [marketAddress],
      }),
    );
  }
  assert.equal(
    getAddress(await module.read.market()),
    getAddress(marketAddress),
  );

  stage = "OPERATOR_AUTHORIZATION";
  if (
    !(await wrapper.read.isOperator([
      predictedSafeAddress,
      marketAddress,
    ]))
  ) {
    await executeSafeCall(
      "authorizeMarket",
      wrapperAddress,
      encodeFunctionData({
        abi: artifacts.VeilBidConfidentialUSDC.abi,
        functionName: "setOperator",
        args: [marketAddress, maxUint48],
      }),
    );
  }
  assert.equal(
    await wrapper.read.isOperator([
      predictedSafeAddress,
      marketAddress,
    ]),
    true,
  );

  manifest.contracts.VeilBidSafePreparationModule.enabled = true;
  manifest.deploymentState = "configured";
  manifest.blockers = [];
  saveManifest();
  console.log(
    JSON.stringify({
      manifest: "auction-house/deployments/sepolia.release.json",
      deploymentState: manifest.deploymentState,
      sourceCommit: manifest.sourceCommit,
      contracts: Object.fromEntries(
        Object.entries(manifest.contracts).map(([name, contract]) => [
          name,
          contract.address,
        ]),
      ),
      configurationTransactions:
        manifest.configurationTransactions,
    }),
  );
}

main().catch((error) => {
  const safeCode =
    error instanceof Error && /^[A-Z0-9_]+$/.test(error.message)
      ? error.message
      : `RELEASE_DEPLOYMENT_${stage}_FAILED`;
  if (manifest && !dryRun) {
    manifest.blockers ??= [];
    if (!manifest.blockers.includes(safeCode)) {
      manifest.blockers.push(safeCode);
    }
    saveManifest();
  }
  console.error(JSON.stringify({ stage, blocker: safeCode }));
  process.exitCode = 1;
});
