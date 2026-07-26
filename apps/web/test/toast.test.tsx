import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ToastProvider,
  useToasts,
} from "../src/shell/ToastProvider";

function ToastHarness() {
  const toasts = useToasts();
  const toastId = useRef<string | null>(null);
  return (
    <>
      <button
        onClick={() => {
          toastId.current = toasts.start(
            "SUBMIT BID",
            "Checking vendor admission…",
          );
        }}
      >
        START
      </button>
      <button
        onClick={() => {
          if (toastId.current) {
            toasts.update(toastId.current, "Waiting for wallet signature…");
          }
        }}
      >
        UPDATE
      </button>
      <button
        onClick={() => {
          if (toastId.current) {
            toasts.succeed(toastId.current, "Bid confirmed on Sepolia.");
          }
        }}
      >
        SUCCEED
      </button>
      <button
        onClick={() => {
          if (toastId.current) {
            toasts.fail(toastId.current, "Wallet request was rejected.");
          }
        }}
      >
        FAIL
      </button>
    </>
  );
}

afterEach(cleanup);

describe("transaction toast notifications", () => {
  it("updates one toast through loading and success stages", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "START" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking vendor admission",
    );

    fireEvent.click(screen.getByRole("button", { name: "UPDATE" }));
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Waiting for wallet signature",
    );

    fireEvent.click(screen.getByRole("button", { name: "SUCCEED" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Bid confirmed on Sepolia",
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Dismiss SUBMIT BID notification",
      }),
    );
    expect(screen.queryByText("Bid confirmed on Sepolia.")).not.toBeInTheDocument();
  });

  it("announces failed actions as alerts", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "START" }));
    fireEvent.click(screen.getByRole("button", { name: "FAIL" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Wallet request was rejected",
    );
  });
});
