import { request } from "./http";
import type {
  Company,
  CompanyPage,
  CreateCompanyBody,
  ListCompaniesParams,
  UpdateCompanyBody,
} from "./schema";

export function listCompanies(params: ListCompaniesParams, signal?: AbortSignal) {
  return request<CompanyPage>("GET", "/companies", { query: params, signal });
}

export function getCompany(id: string, signal?: AbortSignal) {
  return request<Company>("GET", `/companies/${encodeURIComponent(id)}`, { signal });
}

export function createCompany(body: CreateCompanyBody) {
  return request<Company>("POST", "/companies", { body });
}

export function updateCompany(id: string, body: UpdateCompanyBody) {
  return request<Company>("PATCH", `/companies/${encodeURIComponent(id)}`, { body });
}
