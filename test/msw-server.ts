import { http } from "msw";
import { setupServer } from "msw/node";
import * as collection from "@/app/api/v1/companies/route";
import * as item from "@/app/api/v1/companies/[id]/route";

export const API = "http://localhost:3000/api/v1";

const itemContext = (id: unknown) => ({ params: Promise.resolve({ id: String(id) }) });

// Requests go through the real route handlers: tests and app share one backend contract
export const server = setupServer(
  http.get(`${API}/companies`, ({ request }) => collection.GET(request, {})),
  http.post(`${API}/companies`, ({ request }) => collection.POST(request, {})),
  http.get(`${API}/companies/:id`, ({ request, params }) => item.GET(request, itemContext(params.id))),
  http.patch(`${API}/companies/:id`, ({ request, params }) => item.PATCH(request, itemContext(params.id))),
);
