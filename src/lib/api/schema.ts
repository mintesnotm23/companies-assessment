// Contract types; in production generated from the FastAPI OpenAPI schema.

export const COMPANY_STATUSES = ["new", "researching", "contacted", "qualified", "rejected"] as const;

export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export const COMPANY_SORTS = ["name", "-name", "created_at", "-created_at"] as const;

export type CompanySort = (typeof COMPANY_SORTS)[number];

export type Company = {
  id: string;
  name: string;
  domain: string | null;
  status: CompanyStatus;
  version: number;
  created_at: string;
  updated_at: string;
};

export type ListCompaniesParams = {
  limit?: number;
  offset?: number;
  q?: string;
  status?: CompanyStatus;
  sort?: CompanySort;
};

export type CompanyPage = {
  items: Company[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateCompanyBody = {
  name: string;
  domain?: string | null;
  status?: CompanyStatus;
};

export type UpdateCompanyBody = {
  if_version: number;
  name?: string;
  domain?: string | null;
  status?: CompanyStatus;
};

export type ValidationErrorItem = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

export type HTTPValidationError = { detail: ValidationErrorItem[] };

export type HTTPError = { detail: string };
