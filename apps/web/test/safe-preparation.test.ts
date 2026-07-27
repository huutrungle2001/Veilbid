import { describe, expect, it } from "vitest";
import tokenAbiJson from "@veilbid/chain-bindings/abis/VeilBidTestUSDC";
import wrapperAbiJson from "@veilbid/chain-bindings/abis/VeilBidConfidentialUSDC";
import unwrapPreparationAbiJson from "@veilbid/chain-bindings/abis/VeilBidSafeUnwrapPreparation";
import {
  decodeFunctionData,
  keccak256,
  toHex,
  type Abi,
  type Address,
  type Hex,
} from "viem";
import {
  assertSafeBatchExecution,
  buildFullSafeUnwrapTransaction,
  buildPartialSafeUnwrapTransactions,
  buildSafeBalanceViewerTransaction,
  buildSafeEthWithdrawalTransaction,
  buildSafeTestUsdcWithdrawalTransaction,
  noxComputeAddress,
  parseSafeTenderInput,
  safeReleaseConfiguration,
  safeTransactionServiceUrl,
  serializeSafeTransactionHandoff,
} from "../src/safe/safePreparation";

const vendor = "0x1111111111111111111111111111111111111111";
const safe = "0x2222222222222222222222222222222222222222" as Address;
const recipient = "0x3333333333333333333333333333333333333333" as Address;
const handle = `0x${"44".repeat(32)}` as Hex;
const inputProof = `0x${"55".repeat(64)}` as Hex;
const preparation =
  "0x5555555555555555555555555555555555555555" as Address;
const noxViewerAbi = [{
  type: "function",
  name: "addViewer",
  stateMutability: "nonpayable",
  inputs: [
    { name: "handle", type: "bytes32" },
    { name: "viewer", type: "address" },
  ],
  outputs: [],
}] as const;

describe("Safe preparation terms", () => {
  it("binds normalized full tender terms without asking for an internal nonce", () => {
    const deadline = new Date(Date.now() + 600_000).toISOString();
    const parsed = parseSafeTenderInput({
      metadata: "Public procurement",
      ceiling: "10",
      deadline,
      vendors: vendor,
    });
    expect(parsed.publicCeiling).toBe(10_000_000n);
    expect(parsed.approvedVendors).toEqual([vendor]);
    expect(parsed).not.toHaveProperty("nonce");
  });

  it("rejects duplicate vendors", () => {
    const deadline = new Date(Date.now() + 600_000).toISOString();
    expect(() =>
      parseSafeTenderInput({
        metadata: "Public procurement",
        ceiling: "10",
        deadline,
        vendors: `${vendor}\n${vendor}`,
      }),
    ).toThrow(/unique vendor/i);
  });

  it("reflects the canonical enabled module and serializes an atomic Safe batch", () => {
    expect(safeReleaseConfiguration.moduleEnabled).toBe(true);
    expect(safeReleaseConfiguration.walletUrl).toContain(
      safeReleaseConfiguration.safe,
    );
    expect(
      JSON.parse(
        serializeSafeTransactionHandoff({
          transactions: [{ to: vendor, value: "0", data: "0x1234" }],
        }),
      ),
    ).toEqual([{ to: vendor, value: "0", data: "0x1234" }]);
  });

  it("uses the Safe API v1 base path expected by API Kit", () => {
    expect(safeTransactionServiceUrl).toBe(
      "https://safe-transaction-sepolia.safe.global/api",
    );
  });

  it("requires the Safe's internal execution success event", () => {
    const successTopic = keccak256(
      toHex("ExecutionSuccess(bytes32,uint256)"),
    );
    const failureTopic = keccak256(
      toHex("ExecutionFailure(bytes32,uint256)"),
    );
    expect(() =>
      assertSafeBatchExecution(safe, [
        { address: safe, topics: [successTopic] },
      ]),
    ).not.toThrow();
    expect(() =>
      assertSafeBatchExecution(safe, [
        { address: safe, topics: [failureTopic] },
      ]),
    ).toThrow(/rejected the internal batch/i);
    expect(() =>
      assertSafeBatchExecution(safe, [
        { address: recipient, topics: [successTopic] },
      ]),
    ).toThrow(/could not be confirmed/i);
  });

  it("builds exact threshold-authorized treasury calls", () => {
    const viewer = buildSafeBalanceViewerTransaction(handle, recipient);
    expect(viewer.to).toBe(noxComputeAddress);
    expect(viewer.value).toBe("0");
    expect(decodeFunctionData({ abi: noxViewerAbi, data: viewer.data }))
      .toMatchObject({
        functionName: "addViewer",
        args: [handle, recipient],
      });

    expect(buildSafeEthWithdrawalTransaction(recipient, 123n)).toEqual({
      to: recipient,
      value: "123",
      data: "0x",
    });

    const usdc = decodeFunctionData({
      abi: tokenAbiJson as Abi,
      data: buildSafeTestUsdcWithdrawalTransaction(recipient, 456n).data,
    });
    expect(usdc).toMatchObject({
      functionName: "transfer",
      args: [recipient, 456n],
    });

    const unwrap = decodeFunctionData({
      abi: wrapperAbiJson as Abi,
      data: buildFullSafeUnwrapTransaction(safe, recipient, handle).data,
    });
    expect(unwrap).toMatchObject({
      functionName: "unwrap",
      args: [safe, recipient, handle],
    });

    const partial = buildPartialSafeUnwrapTransactions({
      preparation,
      safe,
      recipient,
      encryptedAmountHandle: handle,
      inputProof,
      inputOwner: recipient,
      expectedBalanceHandle: handle,
      nonce: 42n,
    });
    expect(partial).toHaveLength(2);
    expect(partial[0].to).toBe(preparation);
    expect(
      decodeFunctionData({
        abi: unwrapPreparationAbiJson as Abi,
        data: partial[0].data,
      }),
    ).toMatchObject({
      functionName: "preparePartialUnwrap",
      args: [handle, inputProof, recipient, handle, 42n],
    });
    expect(
      decodeFunctionData({
        abi: wrapperAbiJson as Abi,
        data: partial[1].data,
      }),
    ).toMatchObject({
      functionName: "unwrap",
      args: [safe, recipient, handle],
    });
  });
});
