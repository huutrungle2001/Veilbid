import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/shell/App";
import { PrimaryNavigation } from "../src/shell/PrimaryNavigation";

afterEach(cleanup);

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
      screen.getByRole("link", { name: /explore tenders/i }),
    ).toHaveAttribute("href", "/room");
    expect(
      screen.getByRole("link", { name: /skip to content/i }),
    ).toHaveAttribute("href", "#main-content");
    expect(screen.queryByText(/Reading finalized Sepolia logs/i)).toBeNull();
    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    expect(
      within(navigation)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["TENDERS", "DOCS", "EVIDENCE"]);
    expect(
      screen.getByRole("link", { name: "VeilBid home" }),
    ).toHaveAttribute("aria-current", "page");
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
    expect(screen.getByRole("link", { name: "DOCS" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "TENDERS" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("keeps the shared navigation stable and highlights evidence", () => {
    render(
      <MemoryRouter initialEntries={["/docs#evidence"]}>
        <App />
      </MemoryRouter>,
    );
    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    expect(
      within(navigation)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["TENDERS", "DOCS", "EVIDENCE"]);
    expect(
      within(navigation).getByRole("link", { name: "EVIDENCE" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(navigation).getByRole("link", { name: "DOCS" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("preserves one header instance while navigating between public pages", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    const header = container.querySelector(".topbar");
    expect(header).not.toBeNull();

    fireEvent.click(
      within(header as HTMLElement).getByRole("link", { name: "DOCS" }),
    );
    expect(container.querySelector(".topbar")).toBe(header);
    expect(
      within(header as HTMLElement).getByRole("link", { name: "DOCS" }),
    ).toHaveAttribute("aria-current", "page");

    fireEvent.click(
      within(header as HTMLElement).getByRole("link", { name: "EVIDENCE" }),
    );
    expect(container.querySelector(".topbar")).toBe(header);
    expect(
      within(header as HTMLElement).getByRole("link", { name: "EVIDENCE" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("marks Tenders active on the canonical tender route", () => {
    render(
      <MemoryRouter initialEntries={["/room"]}>
        <PrimaryNavigation />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "TENDERS" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
