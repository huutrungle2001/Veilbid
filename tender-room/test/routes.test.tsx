import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "../src/shell/App";

describe("standalone public routes", () => {
  it("renders the landing page without entering the chain runtime", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: /Lowest valid bid/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open tender room/i }),
    ).toHaveAttribute("href", "/room");
    expect(
      screen.getByRole("link", { name: /skip to content/i }),
    ).toHaveAttribute("href", "#main-content");
    expect(screen.queryByText(/Reading finalized Sepolia logs/i)).toBeNull();
  });

  it("renders protocol docs with explicit non-claims", () => {
    render(
      <MemoryRouter initialEntries={["/docs"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", {
        name: /How VeilBid keeps procurement prices sealed/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/does not verify service quality/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /inspect public state/i }),
    ).toHaveAttribute("href", "/room");
  });
});
