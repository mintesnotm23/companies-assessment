import { errorResponse, readJsonBody, withMockApi } from "@/mock-api/http";
import { findCompany, updateCompany } from "@/mock-api/store";
import { updateCompanyInput, validationErrorResponse } from "@/mock-api/validation";

type Context = RouteContext<"/api/v1/companies/[id]">;

export const GET = withMockApi(async (_request, { params }: Context) => {
  const { id } = await params;
  const company = findCompany(id);
  return company ? Response.json(company) : errorResponse(404, "Company not found");
});

export const PATCH = withMockApi(async (request, { params }: Context) => {
  const { id } = await params;
  const parsed = updateCompanyInput.safeParse(await readJsonBody(request));
  if (!parsed.success) return validationErrorResponse(parsed.error, "body");

  const result = updateCompany(id, parsed.data);
  switch (result.kind) {
    case "updated":
      return Response.json(result.company);
    case "not_found":
      return errorResponse(404, "Company not found");
    case "conflict":
      return errorResponse(
        409,
        `Version mismatch: you sent ${parsed.data.if_version}, current is ${result.current.version}`,
      );
  }
});
