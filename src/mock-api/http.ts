import "server-only";
import type { HTTPError } from "@/lib/api/schema";
import { simulateLatency } from "./latency";

export function errorResponse(status: number, detail: string): Response {
  const body: HTTPError = { detail };
  return Response.json(body, { status });
}

function hasBearerToken(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  return /^Bearer\s+\S+/i.test(header);
}

export function withMockApi<Context>(handler: (request: Request, context: Context) => Promise<Response>) {
  return async (request: Request, context: Context): Promise<Response> => {
    const authorized = hasBearerToken(request);
    await simulateLatency();
    if (!authorized) {
      const response = errorResponse(401, "Not authenticated");
      response.headers.set("WWW-Authenticate", "Bearer");
      return response;
    }
    return handler(request, context);
  };
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
