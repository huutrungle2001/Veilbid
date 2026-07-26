import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Address, WalletClient } from "viem";
import type { WalletController } from "../src/wallet/WalletPanel";
import {
  parseWrapAmount,
  WalletBalancePanel,
} from "../src/wallet/WalletBalancePanel";

const account = "0x1111111111111111111111111111111111111111" as Address;
const walletClient = {} as WalletClient;
const confidentialHandle = `0x${"22".repeat(32)}` as const;

function wallet(status: "connected" | "disconnected") {
  return {
    state: {
      status,
      providers: [],
      selectedProvider: null,
      account: status === "connected" ? account : null,
      chainId: status === "connected" ? 11155111 : null,
      walletClient: status === "connected" ? walletClient : null,
      error: null,
      sessionRevision: 0,
    },
    connect: vi.fn(),
    switchToSepolia: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as WalletController;
}

afterEach(cleanup);

describe("workspace wallet balances", () => {
  it("validates six-decimal Test USDC wrap amounts", () => {
    expect(parseWrapAmount("25.5")).toBe(25_500_000n);
    expect(() => parseWrapAmount("0")).toThrow(/greater than zero/i);
    expect(() => parseWrapAmount("1.0000001")).toThrow(/6 decimals/i);
  });

  it("shows public balances without decrypting confidential vcUSDC", async () => {
    const loadBalances = vi.fn().mockResolvedValue({
      eth: 1_234_500_000_000_000_000n,
      testUsdc: 1_250_000_000n,
      confidential: "encrypted",
      confidentialHandle,
    });

    render(
      <WalletBalancePanel
        wallet={wallet("connected")}
        loadBalances={loadBalances}
      />,
    );

    await waitFor(() => expect(screen.getByText("1.2345")).toBeInTheDocument());
    const balanceHelp = screen.getByRole("button", {
      name: "Help for wallet balances",
    });
    expect(balanceHelp).toHaveAttribute("aria-describedby");
    fireEvent.mouseEnter(balanceHelp);
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "HOW TO USE BALANCES",
    );
    fireEvent.mouseLeave(balanceHelp);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(screen.getByText("1250")).toBeInTheDocument();
    expect(screen.getByText("ENCRYPTED")).toBeInTheDocument();
    expect(screen.getByText(/browser session only/i)).toBeInTheDocument();
    expect(screen.queryByText(confidentialHandle)).not.toBeInTheDocument();
    expect(loadBalances).toHaveBeenCalledWith(account);
  });

  it("reveals vcUSDC only after an explicit wallet action and can hide it", async () => {
    const loadBalances = vi.fn().mockResolvedValue({
      eth: 1n,
      testUsdc: 0n,
      confidential: "encrypted",
      confidentialHandle,
    });
    const revealBalance = vi.fn().mockResolvedValue(42_500_000n);

    render(
      <WalletBalancePanel
        wallet={wallet("connected")}
        loadBalances={loadBalances}
        revealBalance={revealBalance}
      />,
    );
    await screen.findByText("ENCRYPTED");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Reveal confidential vcUSDC balance",
      }),
    );

    await screen.findByText("42.5");
    expect(revealBalance).toHaveBeenCalledWith(
      walletClient,
      confidentialHandle,
    );
    expect(screen.queryByText(confidentialHandle)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Hide confidential vcUSDC balance",
      }),
    );
    expect(screen.getByText("ENCRYPTED")).toBeInTheDocument();
    expect(screen.queryByText("42.5")).not.toBeInTheDocument();
  });

  it("requests test USDC through the connected wallet and refreshes", async () => {
    const loadBalances = vi.fn().mockResolvedValue({
      eth: 1n,
      testUsdc: 0n,
      confidential: "none",
      confidentialHandle: null,
    });
    const requestFaucet = vi.fn().mockResolvedValue(undefined);

    render(
      <WalletBalancePanel
        wallet={wallet("connected")}
        loadBalances={loadBalances}
        requestFaucet={requestFaucet}
      />,
    );
    await screen.findByText("NONE");
    expect(
      screen.getByRole("button", {
        name: "No confidential vcUSDC balance to reveal",
      }),
    ).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "GET TEST USDC" }),
    );

    await waitFor(() =>
      expect(requestFaucet).toHaveBeenCalledWith(walletClient, account),
    );
    await screen.findByText("10,000 test USDC received.");
    expect(loadBalances).toHaveBeenCalledTimes(2);
  });

  it("approves and wraps a chosen Test USDC amount, then refreshes", async () => {
    const loadBalances = vi.fn().mockResolvedValue({
      eth: 1n,
      testUsdc: 1_250_000_000n,
      confidential: "none",
      confidentialHandle: null,
    });
    const requestWrap = vi
      .fn()
      .mockImplementation(
        async (
          _client,
          _account,
          _amount,
          onStage: (stage: "approving" | "wrapping") => void,
        ) => {
          onStage("approving");
          onStage("wrapping");
        },
      );

    render(
      <WalletBalancePanel
        wallet={wallet("connected")}
        loadBalances={loadBalances}
        requestWrap={requestWrap}
      />,
    );
    await screen.findByText("1250");

    fireEvent.click(
      screen.getByRole("button", { name: "WRAP TO vcUSDC" }),
    );
    fireEvent.change(screen.getByLabelText("TEST USDC AMOUNT"), {
      target: { value: "25.5" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "APPROVE & WRAP" }),
    );

    await waitFor(() =>
      expect(requestWrap).toHaveBeenCalledWith(
        walletClient,
        account,
        25_500_000n,
        expect.any(Function),
      ),
    );
    await screen.findByText("25.5 Test USDC wrapped to vcUSDC.");
    expect(loadBalances).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole("button", { name: "WRAP TO vcUSDC" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps faucet and refresh actions disabled without a wallet", () => {
    render(<WalletBalancePanel wallet={wallet("disconnected")} />);

    expect(screen.getByText("CONNECT WALLET")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "GET TEST USDC" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Refresh wallet balances" }),
    ).toBeDisabled();
  });
});
