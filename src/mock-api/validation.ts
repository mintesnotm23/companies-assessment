import { z } from "zod";
import { COMPANY_SORTS, COMPANY_STATUSES, type HTTPValidationError } from "@/lib/api/schema";

const name = z.string().trim().min(1, "Name must not be empty");

// undefined = leave unchanged; "" or null = clear
const domain = z
  .string()
  .trim()
  .nullable()
  .transform((value) => value || null)
  .optional();

const status = z.enum(COMPANY_STATUSES);

export const createCompanyInput = z.object({
  name,
  domain,
  status: status.optional(),
});

export const updateCompanyInput = z.object({
  if_version: z.number().int().positive(),
  name: name.optional(),
  domain,
  status: status.optional(),
});

export const listCompaniesInput = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  q: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  status: status.optional(),
  sort: z.enum(COMPANY_SORTS).default("-created_at"),
});

// FastAPI's 422 shape, so the client handles the real backend's errors unchanged
export function validationErrorResponse(error: z.ZodError, location: "body" | "query"): Response {
  const body: HTTPValidationError = {
    detail: error.issues.map((issue) => ({
      loc: [location, ...issue.path.map((p) => (typeof p === "symbol" ? String(p) : p))],
      msg: issue.message,
      type: issue.code,
    })),
  };
  return Response.json(body, { status: 422 });
}
