import { readJsonBody, withMockApi } from "@/mock-api/http";
import { insertCompany, listCompanies } from "@/mock-api/store";
import { createCompanyInput, listCompaniesInput, validationErrorResponse } from "@/mock-api/validation";

export const GET = withMockApi(async (request) => {
  const query = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = listCompaniesInput.safeParse(query);
  if (!parsed.success) return validationErrorResponse(parsed.error, "query");
  return Response.json(listCompanies(parsed.data));
});

export const POST = withMockApi(async (request) => {
  const parsed = createCompanyInput.safeParse(await readJsonBody(request));
  if (!parsed.success) return validationErrorResponse(parsed.error, "body");
  return Response.json(insertCompany(parsed.data), { status: 201 });
});
