import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/http";
import { rebaseDraft, splitServerErrors, toUpdateBody, type CompanyFormValues } from "../company-form";

const base: CompanyFormValues = { name: "Acme", domain: "acme.com", status: "new" };

describe("toUpdateBody", () => {
  it("sends only changed fields with the base version", () => {
    expect(toUpdateBody({ ...base, status: "qualified" }, base, 4)).toEqual({
      if_version: 4,
      status: "qualified",
    });
  });

  it("clears the domain with null", () => {
    expect(toUpdateBody({ ...base, domain: "" }, base, 1)).toEqual({ if_version: 1, domain: null });
  });
});

describe("rebaseDraft", () => {
  it("keeps the user's edits and takes the server's value for untouched fields", () => {
    const draft = { ...base, name: "Acme BV" };
    const latest = { ...base, status: "contacted" as const };

    expect(rebaseDraft(draft, base, latest)).toEqual({
      values: { name: "Acme BV", domain: "acme.com", status: "contacted" },
      overlaps: {},
    });
  });

  it("reports fields both sides changed differently", () => {
    const draft = { ...base, name: "Mine" };
    const latest = { ...base, name: "Theirs" };

    expect(rebaseDraft(draft, base, latest).overlaps).toEqual({ name: "Theirs" });
  });

  it("does not report an overlap when both made the same change", () => {
    const same = { ...base, name: "Same" };
    expect(rebaseDraft(same, base, same).overlaps).toEqual({});
  });
});

describe("splitServerErrors", () => {
  it("routes body field errors to fields and the rest to the form", () => {
    const error = new ApiError(422, [
      { loc: ["body", "name"], msg: "Too short", type: "too_small" },
      { loc: ["body", "website"], msg: "Unknown", type: "x" },
    ]);

    expect(splitServerErrors(error)).toEqual({
      fieldErrors: { name: "Too short" },
      otherErrors: ["Unknown"],
    });
  });
});
