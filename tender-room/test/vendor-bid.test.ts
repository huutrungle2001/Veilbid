import { describe, expect, it } from "vitest";
import { parseVendorPrice } from "../src/transactions/vendorBid";

describe("vendor bid validation", () => {
  it("parses six-decimal prices within the public ceiling", () => {
    expect(parseVendorPrice("37.125001", 100_000_000n)).toBe(37_125_001n);
  });

  it.each(["", "0", "-1", "1.0000001", "1e2", " 01 "])(
    "rejects a malformed or zero private price: %s",
    (value) => {
      expect(() => parseVendorPrice(value, 100_000_000n)).toThrow();
    },
  );

  it("rejects a price above the public ceiling before encryption", () => {
    expect(() => parseVendorPrice("100.000001", 100_000_000n)).toThrow(
      "public ceiling",
    );
  });
});
