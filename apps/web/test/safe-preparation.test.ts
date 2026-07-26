import { describe, expect, it } from "vitest";
import { parseSafeTenderInput } from "../src/safe/safePreparation";

const vendor = "0x1111111111111111111111111111111111111111";

describe("Safe preparation terms", () => {
  it("binds normalized full tender terms and a one-time nonce", () => {
    const deadline = new Date(Date.now() + 600_000).toISOString();
    const parsed = parseSafeTenderInput({
      metadata: "Public procurement",
      ceiling: "10",
      deadline,
      vendors: vendor,
      nonce: "7",
    });
    expect(parsed.publicCeiling).toBe(10_000_000n);
    expect(parsed.approvedVendors).toEqual([vendor]);
    expect(parsed.nonce).toBe(7n);
  });

  it("rejects duplicate vendors and zero nonce", () => {
    const deadline = new Date(Date.now() + 600_000).toISOString();
    expect(() =>
      parseSafeTenderInput({
        metadata: "Public procurement",
        ceiling: "10",
        deadline,
        vendors: `${vendor}\n${vendor}`,
        nonce: "0",
      }),
    ).toThrow(/unique vendor/i);
  });
});
