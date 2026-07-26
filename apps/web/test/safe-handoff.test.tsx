import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SafeActionHandoff } from "../src/safe/SafeTreasuryWorkspace";
import type { SafePreparationResult } from "../src/safe/safePreparation";

const result = {
  actionHash: `0x${"11".repeat(32)}`,
  transactionHash: `0x${"22".repeat(32)}`,
  safe: "0x6Cf73078c21dded41f02FdEF54E532Ce7b356817",
  target: "0x4444444444444444444444444444444444444444",
  safeTransactionData: `0x${"55".repeat(96)}`,
} as SafePreparationResult;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Safe transaction handoff", () => {
  it("exposes complete target/calldata and copies a zero-value transaction", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<SafeActionHandoff result={result} />);

    expect(screen.getByLabelText("Safe target contract")).toHaveValue(
      result.target,
    );
    expect(screen.getByLabelText("Safe transaction calldata")).toHaveValue(
      result.safeTransactionData,
    );
    expect(screen.getByRole("link", { name: /open safe/i })).toHaveAttribute(
      "href",
      expect.stringContaining(result.safe),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "COPY TRANSACTION JSON" }),
    );
    expect(writeText).toHaveBeenCalledOnce();
    expect(JSON.parse(writeText.mock.calls[0][0])).toEqual({
      to: result.target,
      value: "0",
      data: result.safeTransactionData,
    });
    expect(await screen.findByText("Transaction JSON copied.")).toBeInTheDocument();
  });
});
