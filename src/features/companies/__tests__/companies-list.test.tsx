import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { API, server } from "@test/msw-server";
import { renderWithProviders } from "@test/render";
import { CompaniesScreen } from "../components/companies-screen";

function bodyRows() {
  return within(screen.getByRole("table")).getAllByRole("row").slice(1);
}

describe("companies list", () => {
  it("shows the first page, newest first", async () => {
    renderWithProviders(<CompaniesScreen />);

    expect(await screen.findByText("40 companies")).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(20);
    expect(bodyRows()[0]).toHaveTextContent("North Sea Fisheries");
  });

  it("filters by status, pushes it to the URL and keeps the same table element", async () => {
    const onUrlUpdate = vi.fn();
    const { user } = renderWithProviders(<CompaniesScreen />, { onUrlUpdate });
    await screen.findByText("40 companies");
    const table = screen.getByRole("table");

    await user.click(screen.getByLabelText("Status"));
    await user.click(screen.getByRole("option", { name: "Qualified" }));

    expect(await screen.findByText("8 companies")).toBeInTheDocument();
    for (const row of bodyRows()) expect(row).toHaveTextContent("Qualified");
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryString: "?status=qualified",
        options: expect.objectContaining({ history: "push" }),
      }),
    );
    expect(screen.getByRole("table")).toBe(table);
  });

  it("searches name and domain, replacing history while typing", async () => {
    const onUrlUpdate = vi.fn();
    const { user } = renderWithProviders(<CompaniesScreen />, { onUrlUpdate });
    await screen.findByText("40 companies");

    await user.type(screen.getByLabelText("Search name or domain"), "nimbuscloud");

    expect(await screen.findByText("1 company")).toBeInTheDocument();
    expect(bodyRows()[0]).toHaveTextContent("Nimbus Cloud");
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryString: "?q=nimbuscloud",
        options: expect.objectContaining({ history: "replace" }),
      }),
    );
  });

  it("restores filters and sort from the URL", async () => {
    renderWithProviders(<CompaniesScreen />, { searchParams: "?status=rejected&sort=name" });

    expect(await screen.findByText("8 companies")).toBeInTheDocument();
    expect(bodyRows()[0]).toHaveTextContent("Dune Apparel");
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByLabelText("Status")).toHaveTextContent("Rejected");
  });

  it("toggles sort direction from the column header", async () => {
    const onUrlUpdate = vi.fn();
    const { user } = renderWithProviders(<CompaniesScreen />, { onUrlUpdate });
    await screen.findByText("40 companies");

    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(await screen.findByText("Acme Logistics")).toBeInTheDocument();
    expect(onUrlUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ queryString: "?sort=name" }));

    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(onUrlUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ queryString: "?sort=-name" }));
  });

  it("shows an empty state that clears filters", async () => {
    const { user } = renderWithProviders(<CompaniesScreen />, { searchParams: "?q=zzz" });

    expect(await screen.findByText("No companies match these filters.")).toBeInTheDocument();
    await user.click(within(screen.getByRole("table")).getByRole("button", { name: "Clear filters" }));

    expect(await screen.findByText("40 companies")).toBeInTheDocument();
  });

  it("resets search and status from the toolbar", async () => {
    const onUrlUpdate = vi.fn();
    const { user } = renderWithProviders(<CompaniesScreen />, {
      searchParams: "?q=a&status=qualified",
      onUrlUpdate,
    });
    await screen.findByRole("table");
    expect(screen.queryByText("40 companies")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset filters" }));

    expect(await screen.findByText("40 companies")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset filters" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Search name or domain")).toHaveValue("");
    expect(screen.getByLabelText("Status")).toHaveTextContent("All statuses");
    expect(onUrlUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ queryString: "" }));
  });

  it("shows an error with a working retry", async () => {
    server.use(
      http.get(`${API}/companies`, () => HttpResponse.json({ detail: "Boom" }, { status: 400 }), {
        once: true,
      }),
    );
    const { user } = renderWithProviders(<CompaniesScreen />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load companies.");
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("40 companies")).toBeInTheDocument();
  });

  it("reports a 401 so the app can send the user to sign-in", async () => {
    server.use(http.get(`${API}/companies`, () => HttpResponse.json({ detail: "Expired" }, { status: 401 })));
    const { onUnauthorized } = renderWithProviders(<CompaniesScreen />);

    await screen.findByRole("alert");
    expect(onUnauthorized).toHaveBeenCalled();
  });
});
