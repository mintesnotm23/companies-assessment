import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { findCompany, updateCompany } from "@/mock-api/store";
import { API, server } from "@test/msw-server";
import { renderWithProviders } from "@test/render";
import { CompaniesScreen } from "../components/companies-screen";

async function openEditDrawer(id = "cmp_001") {
  const view = renderWithProviders(<CompaniesScreen />, { searchParams: `?company=${id}` });
  const dialog = await screen.findByRole("dialog", { name: "Edit company" });
  await within(dialog).findByLabelText("Name");
  return { ...view, dialog };
}

describe("company drawer", () => {
  describe("409 conflict", () => {
    it("keeps the user's edits, adopts untouched server changes and saves on the latest version", async () => {
      const { user, dialog } = await openEditDrawer();
      const name = within(dialog).getByLabelText("Name");
      await user.clear(name);
      await user.type(name, "Acme Logistics BV");

      // Someone else saves a different field first
      updateCompany("cmp_001", { if_version: 1, status: "qualified" });
      await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

      expect(await within(dialog).findByRole("alert")).toHaveTextContent("Someone else changed this company");
      expect(name).toHaveValue("Acme Logistics BV");

      await user.click(within(dialog).getByRole("button", { name: "Load latest version" }));

      expect(await within(dialog).findByText(/Loaded version 2/)).toBeInTheDocument();
      expect(within(dialog).getByLabelText("Name")).toHaveValue("Acme Logistics BV");
      expect(within(dialog).getByLabelText("Status")).toHaveValue("qualified");

      await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

      expect(await within(dialog).findByText("Changes saved.")).toBeInTheDocument();
      expect(findCompany("cmp_001")).toMatchObject({
        name: "Acme Logistics BV",
        status: "qualified",
        version: 3,
      });
    });

    it("shows the other person's value when both edited the same field", async () => {
      const { user, dialog } = await openEditDrawer();
      const name = within(dialog).getByLabelText("Name");
      await user.clear(name);
      await user.type(name, "Mine");

      updateCompany("cmp_001", { if_version: 1, name: "Theirs" });
      await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
      await user.click(await within(dialog).findByRole("button", { name: "Load latest version" }));

      expect(await within(dialog).findByText("Saved by someone else: Theirs")).toBeInTheDocument();
      expect(within(dialog).getByLabelText("Name")).toHaveValue("Mine");
      expect(within(dialog).getByLabelText("Name")).toHaveAccessibleDescription(
        /Saved by someone else: Theirs/,
      );
    });
  });

  describe("validation", () => {
    it("blocks an empty name on the client without calling the API", async () => {
      const { user, dialog } = await openEditDrawer();
      await user.clear(within(dialog).getByLabelText("Name"));
      await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

      expect(await within(dialog).findByRole("alert")).toHaveTextContent("Name is required.");
      expect(within(dialog).getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
      expect(findCompany("cmp_001")?.version).toBe(1);
    });

    it("shows API 422 errors next to the matching field", async () => {
      server.use(
        http.patch(`${API}/companies/:id`, () =>
          HttpResponse.json(
            {
              detail: [
                {
                  loc: ["body", "domain"],
                  msg: "Domain already belongs to another company",
                  type: "value_error",
                },
              ],
            },
            { status: 422 },
          ),
        ),
      );
      const { user, dialog } = await openEditDrawer();
      await user.type(within(dialog).getByLabelText("Domain"), "x");
      await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

      expect(await within(dialog).findByRole("alert")).toHaveTextContent(
        "Domain already belongs to another company",
      );
      expect(within(dialog).getByLabelText("Domain")).toHaveAttribute("aria-invalid", "true");
    });
  });

  it("creates a company and switches the drawer to edit mode", async () => {
    const { user } = renderWithProviders(<CompaniesScreen />, { searchParams: "?company=new" });
    const dialog = await screen.findByRole("dialog", { name: "New company" });

    await user.type(within(dialog).getByLabelText("Name"), "Gamma BV");
    await user.click(within(dialog).getByRole("button", { name: "Create company" }));

    const editDialog = await screen.findByRole("dialog", { name: "Edit company" });
    expect(within(editDialog).getByLabelText("Name")).toHaveValue("Gamma BV");
  });

  it("shows not found for an unknown id", async () => {
    renderWithProviders(<CompaniesScreen />, { searchParams: "?company=cmp_missing" });
    const dialog = await screen.findByRole("dialog");

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("This company does not exist");
  });

  it("closes on Escape", async () => {
    const { user } = await openEditDrawer();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
