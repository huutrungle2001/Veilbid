import { describe, expect, it } from "vitest";
import {
  parseSafeTenderInput,
  safeReleaseConfiguration,
  serializeSafeTransactionHandoff,
} from "../src/safe/safePreparation";

const vendor = "0x1111111111111111111111111111111111111111";

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
});
