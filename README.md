# Companies — Next.js assessment

A "Companies" feature for a B2B CRM: a filterable, sortable, paginated list with a URL-addressable drawer for viewing, creating and editing companies. Edits use optimistic concurrency, and a `409 Conflict` never throws away what the user typed.

## Running it

Requires Node 24 (`.nvmrc`) and pnpm 10.

```bash
nvm use
corepack enable pnpm
pnpm install
pnpm dev            # http://localhost:3000 → sign in → /companies
```

| Script           | What it does                                                         |
| ---------------- | -------------------------------------------------------------------- |
| `pnpm lint`      | ESLint (Next, TypeScript, TanStack Query rules)                      |
| `pnpm typecheck` | `next typegen` + `tsc --noEmit` (strict, `noUncheckedIndexedAccess`) |
| `pnpm test`      | Vitest: unit, route-handler and component tests                      |
| `pnpm build`     | Production build                                                     |

CI runs all four on every push (`.github/workflows/ci.yml`).

**Trying the 409 flow by hand:** open a company, change its name, then in the browser console run
`fetch("/api/v1/companies/cmp_001", { method: "PATCH", headers: { Authorization: "Bearer x", "Content-Type": "application/json" }, body: JSON.stringify({ if_version: 1, status: "qualified" }) })`
and press **Save**.

## Structure

```
src/
  app/
    [locale]/                 root layout per locale (via next/root-params)
      companies/page.tsx      thin server shell → <CompaniesScreen/>
      sign-in/page.tsx
    api/v1/companies/         mock API route handlers
  features/
    companies/                list, drawer, forms, URL state, form model
    auth/                     fake sign-in form
  lib/
    api/                      "generated" typed client: schema, http, endpoints, query options
    auth/                     token store, safe redirect
    query-client.ts           retry policy + global 401 handling
  mock-api/                   in-memory backend: seed, store, validation, pure query logic
  i18n/  messages/            next-intl routing/config, en + nl messages
  proxy.ts                    locale rewrite (Next 16's middleware)
test/                         MSW server, render helper, setup
```

`app/` stays thin, so routing is the only thing it does. `mock-api/` is treated as a foreign backend: the only thing it shares with the frontend is the contract types in `lib/api/schema.ts`. That's the role the generated OpenAPI types play against the real FastAPI service. The client's zod schema _mirrors_ the API rules; it doesn't import them.

## Decisions and why

**Data and caching**

- **TanStack Query for all server state.** `listCompaniesOptions` and `companyOptions` are the only way components read data, and `companyKeys` is a hierarchical key factory (`["companies", "list", params]` / `["companies", "detail", id]`), so one `invalidateQueries({ queryKey: companyKeys.all })` reaches everything.
- **Normalized list keys.** `normalizeListParams` makes defaults explicit and drops blank filters, so `?page=1`, no page, and `q="  "` all share one cache entry.
- **The table never remounts.** The list uses `useQuery` with `placeholderData: keepPreviousData`, not `useSuspenseQuery`, which would re-suspend on every key change. The `<table>` element is always rendered and only the `<tbody>` content switches between loading, error, empty, out-of-range and rows. A component test asserts that the same DOM node survives a filter change.
- **Retries.** 4xx responses are never retried; only network errors and 5xx are, up to twice. A 409 or 404 is an answer, not a glitch, and with the 300–800 ms latency the default 3 retries would hide errors for seconds.

**URL state** (nuqs, typed parsers)

- Filters, sort, page and the open drawer (`?company=<id>` or `?company=new`) all live in the URL.
- Invalid values (`?page=abc`, `?status=foo`) fall back to defaults.
- Typing in search _replaces_ the history entry (URL debounced 300 ms). Every other deliberate change _pushes_, so Back walks through filters and closes the drawer. Creating a company _replaces_ `company=new` with the new id, so Back doesn't reopen an empty form.
- **The drawer is a search param, not parallel or intercepting routes.** The list must stay mounted with its filters while the drawer is open, and a shared link must open the same view. A search param gives both with no extra route files. Row names are real `<a href>` links, so keyboard users get them for free and cmd-click opens the shareable URL in a new tab.

**The 409 flow** (the core of the exercise)

1. The edit form snapshots the company when it opens. The PATCH sends that snapshot's version, never whatever the cache holds now, so a background refetch can't silently defeat the conflict check.
2. The PATCH sends **only the fields the user changed**, so an untouched stale field can never overwrite someone else's edit.
3. On a 409 the cached copy is provably stale and gets invalidated. The form shows an `role="alert"` notice and keeps the draft.
4. **Load latest version** fetches the current record and rebases the draft on it (`rebaseDraft`): fields the user changed keep their value, untouched fields take the server's value, and the base version moves forward. Where both sides changed the same field, the other person's value is shown under it ("Saved by someone else: …") and linked to the field with `aria-describedby`.
5. Saving again sends the new version.

**Validation**

- The client zod schema mirrors the API exactly (non-empty trimmed name) and nothing stricter, because stricter client rules would reject input the backend accepts.
- The mock returns FastAPI-shaped 422s (`{ detail: [{ loc, msg, type }] }`). `body.<field>` errors attach to the matching field, and anything else is shown above the submit button.

**Auth**

- The token lives in `sessionStorage` behind `lib/auth/token-store.ts`, and the HTTP client reads it on every request.
- A missing token is treated as a local 401, so missing and expired tokens share one recovery path: the global `QueryCache`/`MutationCache` `onError` clears the token and redirects to `/sign-in?next=<path+query>`. `next` is validated (`safeNextPath`) against open redirects, and a shared drawer link survives sign-in.
- The query cache is cleared on sign-in and sign-out, so tenant data never outlives the session that fetched it.
- The token never goes in the URL, query keys, logs or server-rendered HTML.

**i18n** (next-intl, `next/root-params`)

- The locale is a root `[locale]` segment, read with `next/root-params`, so each locale gets its own static shell (`/en/companies`, `/nl/companies` show as `○` in the build output).
- `proxy.ts` rewrites with `localePrefix: "never"`, so URLs stay `/companies` as the spec requires. The choice is remembered in a cookie, and on a first visit it comes from `Accept-Language`.
- Only the active locale's messages reach the client.
- Dates format through `useFormatter` with a fixed `Europe/Amsterdam` time zone, so server and client output always match.
- Message keys are type-checked against `en.json`.

**Next 16 specifics**

- `cacheComponents` is kept on. It was the 16.4 scaffold default, and the docs say it becomes mandatory in the next major. `CompaniesScreen` sits under `<Suspense>` because URL state is request-specific.
- Route handlers read the auth header _before_ the artificial delay, which keeps them request-dynamic.
- `error.tsx` uses the `retry` prop, which became stable in 16.3.
- `error.tsx` only covers render crashes. Query errors are handled inline next to the data, with retry buttons, because a failed list fetch shouldn't replace the whole page.

**Accessibility**

- The drawer is a Radix Dialog: focus trap, Escape to close, focus returned on close, labelled by its title.
- Sort buttons sit inside `<th aria-sort>`.
- Every field has a `<label>`, plus `aria-invalid` and `aria-describedby` pointing at its hint, error and conflict text.
- Errors use `role="alert"`. The result count and "Saved" message use `role="status"`, so they're announced without stealing focus.

## Testing

Requests in component tests go through **MSW straight into the real route handlers**, with latency mocked out. Tests and the app therefore share one backend contract, with no second fake to drift.

- **Unit:**
  - query keys and normalization
  - URL ↔ params mapping and sort toggling
  - the form model: `toUpdateBody`, `rebaseDraft`, 422 splitting
  - mock-API filtering, sorting and pagination
  - safe redirects
  - HTTP client: bearer header, local 401, 422/409 parsing
- **Route handlers:** 401, list envelope, 201 with `version: 1`, 422, 404, version bump, 409.
- **Components:**
  - list: initial load, status filter (URL push plus same table node), debounced search (URL replace), restore from URL, sort toggle, empty state with clear filters, error with retry, 401
  - drawer: the full 409 flow, overlapping edits, client validation, API 422 on a field, create then edit, 404, Escape

I checked the 409 tests by sabotage: removing the rebase line makes both fail.

## Consciously left out

- **E2E tests (Playwright).** The component tests cover the risky logic through the real handlers. E2E would add browser-level coverage of the proxy rewrite, history and focus, which is what I'd add next.
- **Server prefetch + `HydrationBoundary`.** The fake token lives client-side, so the server can't call the API as the user. With a real IdP session cookie, I'd prefetch the first page in the server component and dehydrate it into TanStack Query.
- **Optimistic UI for saves.** With concurrency conflicts possible, a pessimistic save is the honest choice.
- **Seeding the drawer from list data.** The drawer could open instantly from list data with `initialData`, but it fetches the detail so the version it edits is fresh.
- **Localized API error messages.** 422 `msg` strings are shown as the API sends them (English). I'd map `type` codes to translations once the backend's set is known.
- **Field-level server rules beyond the spec** (domain format, uniqueness). I didn't invent API rules the spec doesn't define.

## With more time

- Playwright smoke tests for sign-in, shared links, back/forward and the locale switch.
- A "newer version available" hint while editing, when the background refetch sees a higher version, _before_ the user hits Save.
- Silent token refresh and a request queue during refresh, as with a real IdP.
- Per-user time zone instead of the fixed product zone.

## Known issues

- **Locale reverted once in dev.** During manual testing in `next dev`, the UI fell back from Dutch to English once, after switching locale and then opening a row. The proxy logged two 307s, which in next-intl's `never` mode means a document request for a locale-prefixed path such as `/en/companies` (that also rewrites the cookie). I couldn't reproduce it in three attempts with the same steps. next-intl's source notes that Next ≥ 16.3 revalidates previously visited routes of the locale you just switched away from, which fits. If it turns out to be real, the low-risk fix is a full reload on locale switch (set the cookie, then `location.reload()`), since switching language is rare.
- **The in-memory store is per process.** Deploying to serverless (for example Vercel) can route requests to different instances, so a created company may 404 or an edit may seem to vanish. Run it as a single Node process (`pnpm build && pnpm start`, or one instance on Render or Railway).
