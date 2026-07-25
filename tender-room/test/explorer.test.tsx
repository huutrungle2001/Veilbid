import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicMarketState } from "../src/public-market/usePublicMarket";
import { ExplorerView } from "../src/shell/App";

const buyer = "0x1111111111111111111111111111111111111111";
const transactionHash = `0x${"22".repeat(32)}` as const;

afterEach(cleanup);

function state(
  overrides: Partial<PublicMarketState> = {},
): PublicMarketState {
  return {
    status: "ready",
    error: null,
    refreshedAt: new Date("2026-07-26T00:00:00Z"),
    data: {
      finalizedBlock: 100n,
      latestBlock: 112n,
      deploymentKind: "test-e2e",
      deploymentVerified: false,
      index: {
        tenders: [
          {
            tenderId: 1n,
            buyer,
            paymentToken: buyer,
            metadataHash: `0x${"33".repeat(32)}`,
            publicCeiling: 100_000_000n,
            bidDeadline: 2_000_000_000n,
            closeBlock: null,
            bidCount: 1,
            status: "Open",
            winnerBidId: null,
            winner: null,
            viewerGrantCount: 0,
            createdBlock: 90n,
            updatedBlock: 95n,
            createdTransaction: transactionHash,
            updatedTransaction: transactionHash,
          },
        ],
        bids: [],
        checkpoint: { blockNumber: 95n, eventCount: 2 },
      },
    },
    ...overrides,
  };
}

function view(marketState: PublicMarketState, onRetry = vi.fn()) {
  return render(
    <MemoryRouter>
      <ExplorerView state={marketState} onRetry={onRetry} />
    </MemoryRouter>,
  );
}

describe("Tender Room public explorer", () => {
  it("renders a finalized public tender without wallet or bid plaintext", () => {
    view(state());
    expect(screen.getByText("1 tenders")).toBeInTheDocument();
    expect(
      screen.getAllByText("Confidential procurement #1").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("100 vUSDC").length).toBeGreaterThan(0);
    expect(screen.getByText("◆ ENCRYPTED PRICE")).toBeInTheDocument();
    expect(screen.queryByText("37 vUSDC")).not.toBeInTheDocument();
  });

  it("shows an explicit loading state without placeholder dossiers", () => {
    view(state({ status: "loading", data: null }));
    expect(
      screen.getByText("Reading finalized Sepolia logs"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Confidential procurement #/)).not.toBeInTheDocument();
  });

  it("shows RPC failure without mock fallback and supports retry", () => {
    const retry = vi.fn();
    view(
      state({
        status: "error",
        data: null,
        error:
          "Sepolia public state is unavailable. No fallback data is shown.",
      }),
      retry,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No fallback data is shown",
    );
    fireEvent.click(screen.getByRole("button", { name: /retry sepolia/i }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("keeps non-public role workspaces visibly unavailable", () => {
    view(state());
    expect(screen.getByRole("button", { name: "PUBLIC" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "BUYER" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "SAFE TREASURY" }),
    ).toBeDisabled();
  });
});
