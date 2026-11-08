import type { UseFormSetError } from "react-hook-form";
import { z } from "zod";
import { isApiError, type ApiError } from "@/lib/api/http";
import {
  COMPANY_STATUSES,
  type Company,
  type CreateCompanyBody,
  type UpdateCompanyBody,
} from "@/lib/api/schema";

// Mirrors API rules only; anything stricter would reject what the backend accepts
export const companyFormSchema = z.object({
  name: z.string().trim().min(1),
  domain: z.string().trim(),
  status: z.enum(COMPANY_STATUSES),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;

export const COMPANY_FIELDS = ["name", "domain", "status"] as const;
export type CompanyField = (typeof COMPANY_FIELDS)[number];

export const EMPTY_COMPANY_FORM: CompanyFormValues = { name: "", domain: "", status: "new" };

export function toFormValues(company: Company): CompanyFormValues {
  return { name: company.name, domain: company.domain ?? "", status: company.status };
}

export function changedFields(values: CompanyFormValues, base: CompanyFormValues): CompanyField[] {
  return COMPANY_FIELDS.filter((field) => values[field] !== base[field]);
}

export function toCreateBody(values: CompanyFormValues): CreateCompanyBody {
  return { name: values.name, domain: values.domain || null, status: values.status };
}

// Only edited fields: a stale untouched field must never overwrite someone else's change
export function toUpdateBody(
  values: CompanyFormValues,
  base: CompanyFormValues,
  version: number,
): UpdateCompanyBody {
  const body: UpdateCompanyBody = { if_version: version };
  for (const field of changedFields(values, base)) {
    if (field === "name") body.name = values.name;
    if (field === "domain") body.domain = values.domain || null;
    if (field === "status") body.status = values.status;
  }
  return body;
}

export type RebasedDraft = {
  values: CompanyFormValues;
  // Fields both sides changed differently: user's value kept, theirs shown alongside
  overlaps: Partial<CompanyFormValues>;
};

export function rebaseDraft(
  draft: CompanyFormValues,
  base: CompanyFormValues,
  latest: CompanyFormValues,
): RebasedDraft {
  const values = { ...latest };
  const overlaps: Partial<CompanyFormValues> = {};
  for (const field of changedFields(draft, base)) {
    Object.assign(values, { [field]: draft[field] });
    if (latest[field] !== base[field] && latest[field] !== draft[field]) {
      Object.assign(overlaps, { [field]: latest[field] });
    }
  }
  return { values, overlaps };
}

function isCompanyField(value: unknown): value is CompanyField {
  return COMPANY_FIELDS.some((field) => field === value);
}

export function applyServerFieldErrors(error: unknown, setError: UseFormSetError<CompanyFormValues>) {
  if (!isApiError(error, 422)) return;
  const { fieldErrors } = splitServerErrors(error);
  for (const field of COMPANY_FIELDS) {
    const message = fieldErrors[field];
    if (message) setError(field, { type: "server", message });
  }
}

export function splitServerErrors(error: ApiError): {
  fieldErrors: Partial<Record<CompanyField, string>>;
  otherErrors: string[];
} {
  const fieldErrors: Partial<Record<CompanyField, string>> = {};
  const otherErrors: string[] = [];
  for (const { loc, msg } of error.validationErrors) {
    const [location, field] = loc;
    if (location === "body" && isCompanyField(field)) fieldErrors[field] = msg;
    else otherErrors.push(msg);
  }
  return { fieldErrors, otherErrors };
}
