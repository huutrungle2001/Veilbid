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
import type { WalletController } from "../src/wallet/WalletPanel";

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

const disconnectedWallet = {
  state: {
    status: "disconnected",
    providers: [],
    selectedProvider: null,
    account: null,
    chainId: null,
    walletClient: null,
    error: null,
    sessionRevision: 0,
  },
  connect: vi.fn(),
  switchToSepolia: vi.fn(),
  disconnect: vi.fn(),
} as unknown as WalletController;

function view(
  marketState: PublicMarketState,
  onRetry = vi.fn(),
  wallet?: WalletController,
) {
  return render(
    <MemoryRouter initialEntries={["/room"]}>
      <ExplorerView state={marketState} onRetry={onRetry} wallet={wallet} />
    </MemoryRouter>,
  );
}

describe("Tender Room public explorer", () => {
  it("renders a finalized public tender without wallet or bid plaintext", () => {
    view(state());
    expect(screen.getByText("1 tenders")).toBeInTheDocument();
    expect(
      screen.getByText(
        "TEST-E2E DEPLOYMENT · NOT SOURCE/DEPLOYMENT VERIFIED",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Confidential procurement #1").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("100 vUSDC").length).toBeGreaterThan(0);
    expect(screen.getByText("◆ ENCRYPTED PRICE")).toBeInTheDocument();
    expect(screen.queryByText("37 vUSDC")).not.toBeInTheDocument();
  });

  it("labels the canonical release from live deployment metadata", () => {
    const release = state();
    release.data = {
      ...release.data!,
      deploymentKind: "release",
      deploymentVerified: true,
    };
    view(release);
    expect(
      screen.getByText("RELEASE DEPLOYMENT · SOURCE/DEPLOYMENT VERIFIED"),
    ).toBeInTheDocument();
  });

  it("surfaces explicit non-transferable receipt evidence after award", () => {
    const awarded = state();
    const tender = awarded.data!.index.tenders[0];
    awarded.data = {
      ...awarded.data!,
      index: {
        ...awarded.data!.index,
        tenders: [
          {
            ...tender,
            status: "Awarded",
            closeBlock: 96n,
            winnerBidId: 1n,
            winner: buyer,
          },
        ],
      },
    };
    view(awarded);
    expect(
      screen.getByRole("region", { name: "Award receipt evidence" }),
    ).toHaveTextContent("Receipt #1");
    expect(screen.getByText("DISABLED")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /inspect on sepolia/i }),
    ).toHaveAttribute("href", expect.stringContaining("sepolia.etherscan.io"));
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

  it("opens Activity recovery without requiring a connected account", () => {
    render(
      <MemoryRouter initialEntries={["/room"]}>
        <ExplorerView
          state={state()}
          onRetry={vi.fn()}
          wallet={disconnectedWallet}
          activeRole="ACTIVITY"
          onRoleChange={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Resume, never restart." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/public tender IDs/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ACTIVITY" })).toBeEnabled();
  });

  it("opens the selective-disclosure Auditor workspace", () => {
    render(
      <MemoryRouter initialEntries={["/room"]}>
        <ExplorerView
          state={state()}
          onRetry={vi.fn()}
          wallet={disconnectedWallet}
          activeRole="AUDITOR"
          onRoleChange={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Reveal one granted bid." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/does not confer token/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "AUDITOR" })).toBeEnabled();
  });

  it("opens the preparation-only Safe Treasury workspace", () => {
    render(
      <MemoryRouter initialEntries={["/room"]}>
        <ExplorerView
          state={state()}
          onRetry={vi.fn()}
          wallet={disconnectedWallet}
          activeRole="SAFE TREASURY"
          onRoleChange={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Prepare. Then authorize." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/cannot execute from the Safe/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "SAFE TREASURY" }),
    ).toBeEnabled();
  });
});
