import { getToken } from "@/lib/auth/token-store";
import type { HTTPError, ValidationErrorItem } from "./schema";

const API_BASE_PATH = "/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string | ValidationErrorItem[];

  constructor(status: number, detail: string | ValidationErrorItem[]) {
    super(typeof detail === "string" ? detail : `Request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }

  get validationErrors(): ValidationErrorItem[] {
    return Array.isArray(this.detail) ? this.detail : [];
  }
}

export function isApiError(error: unknown, status?: number): error is ApiError {
  return error instanceof ApiError && (status === undefined || error.status === status);
}

type QueryValue = string | number | undefined;

type RequestOptions = {
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
};

function buildUrl(path: string, query: RequestOptions["query"]): URL {
  const url = new URL(`${API_BASE_PATH}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  return url;
}

function isValidationErrorItem(value: unknown): value is ValidationErrorItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "loc" in value &&
    Array.isArray(value.loc) &&
    "msg" in value &&
    typeof value.msg === "string"
  );
}

async function readErrorDetail(response: Response): Promise<HTTPError["detail"] | ValidationErrorItem[]> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null && "detail" in body) {
      const detail: unknown = body.detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) return detail.filter(isValidationErrorItem);
    }
  } catch {
    // non-JSON error body
  }
  return response.statusText || `HTTP ${response.status}`;
}

export async function request<T>(
  method: "GET" | "POST" | "PATCH",
  path: string,
  { query, body, signal }: RequestOptions = {},
): Promise<T> {
  const token = getToken();
  // Missing token is a local 401: same recovery path as an expired one
  if (!token) throw new ApiError(401, "Not authenticated");

  const headers = new Headers({ Authorization: `Bearer ${token}`, Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorDetail(response));
  }
  return (await response.json()) as T;
}
