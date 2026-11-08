# Part 1 — Written answers

### 1. Server vs Client Components

My default is a Server Component. A component becomes a Client Component only when it needs state, effects, event handlers or browser APIs, and I push that boundary as far down the tree as I can. On a CRM screen with a filterable table and a detail drawer, the **page shell** (heading, layout, translated static copy) is a Server Component: it ships no JS and can be prerendered per locale. The **table + drawer island** is a Client Component, because it reads URL state, owns TanStack Query subscriptions, and handles clicks, focus and forms. I draw the boundary at the interactive island (`<CompaniesScreen/>` in this repo), not at every leaf, so data, URL state and the drawer stay in one coherent client tree. Props crossing the boundary must be serializable, so I pass plain data or nothing, never functions or class instances.

### 2. Server fetching with TanStack Query

I fetch on the server when the first paint benefits: SEO-relevant or above-the-fold data, the first page of a list on a hard load, or data the client isn't allowed to fetch directly. To avoid fetching twice, I create a per-request `QueryClient` on the server and `prefetchQuery` with the **same `queryOptions`** the client uses (same key, same function). I then `dehydrate` it into a `<HydrationBoundary>`. The client's `useQuery(listCompaniesOptions(params))` finds the data under the identical key and doesn't refetch while it's fresh, as long as `staleTime` is above 0. The key-factory/options helpers are what make this safe: if server and client built their keys separately, they would drift and you'd get a double fetch.

### 3. Handling a 409 Conflict

The user should never lose their work. When the PATCH returns 409, I keep the form exactly as typed and show an alert along the lines of "someone else changed this company; your changes weren't saved", with a **Load latest version** action. In the cache, the detail entry is provably stale, so I invalidate it (and the lists, which may show stale names or statuses). The open form, though, keeps its own snapshot and is not reset by that refetch. On reload I rebase the draft. Fields the user changed keep the user's value. Untouched fields take the server's value. The base version becomes the new one. Where both sides changed the same field, I show the other person's value next to the user's. The user reviews and saves again with the new version. Sending only changed fields in the PATCH also prevents an untouched stale field from silently overwriting someone else's edit.

### 4. Filters, sorting and pagination state

That state lives in the **URL search params**: it's shareable, survives a refresh, and the browser's history gives Back/Forward for free. I read it with typed parsers (nuqs) that fall back to defaults on invalid input. Deliberate changes (filter, sort, page) push history entries, and typing in search replaces the entry and is debounced. Changing a filter or sort resets the page to 1. The query key is derived from the parsed URL state through one normalization function, so equivalent URLs produce the same key, and the URL is the single source of truth; nothing is copied into component state that could drift. `keepPreviousData` keeps the old rows visible while the new key loads.

### 5. Access token on a shared typed client

The client has one request function, and it asks a token provider for the current token **at request time**. That way every generated endpoint gets the `Authorization: Bearer` header without components knowing about it. With a real IdP, that provider is the IdP SDK's `getAccessToken()`, which returns a cached token or silently refreshes it. For expiry mid-session: proactive refresh shortly before `exp`, plus a reactive path where a 401 triggers one refresh-and-retry, with concurrent requests queued behind a single refresh. If the refresh fails, I clear the session, clear the query cache (so tenant data doesn't leak to the next user), and redirect to sign-in with a validated return path. The token must never end up in the URL or query strings, query keys, logs or error reporting, server-rendered HTML or RSC payloads, or `localStorage` (prefer memory or an httpOnly cookie handled by the auth layer).

### 6. Loading, error and empty states

I use `loading.tsx` for route-level navigation and Suspense boundaries placed around **independent** regions, so each loads on its own. The table and the drawer get separate boundaries, because a slow detail shouldn't block the list and vice versa. `error.tsx` catches render crashes for the segment and offers `retry`. Expected data errors (a failed fetch, a 404 for one record) I handle **inline**, next to the data, with their own retry, because they're normal states, not crashes. Empty is a successful result and is rendered by the component itself, never by a boundary. I don't wrap things whose identity must persist across updates. In particular, the table should not sit inside a Suspense boundary keyed on the filters, or every filter change would unmount it, losing focus and scroll. For that I use `keepPreviousData` (or a transition) to keep the old UI visible.

### 7. Dutch/English translations

Messages live in one file per locale. The locale is resolved on the server (a root `[locale]` segment read with `next/root-params`, set by the proxy from a cookie or `Accept-Language`). Server Components translate with `getTranslations`, and only the **active locale's** messages are passed to `NextIntlClientProvider` for client components. A large app would pass only the namespaces each client island needs. Dates and numbers go through the same i18n layer's `Intl` formatters, with an explicit time zone so server and client output match and don't cause hydration mismatches. I keep keys type-checked against the source-language file, so a missing translation fails the build instead of reaching users.

### 8. Measuring "slow" and fixing it

First I measure, in production builds and on realistic devices and networks: Core Web Vitals from real users (LCP, INP, CLS), TTFB, and the server timing of each data call. Then I check the network waterfall (sequential requests that could run in parallel), the client JS each route ships, and React Profiler or long tasks for interaction slowness. Only after that do I call it slow and name a cause. Two App Router features I'd reach for on a slow data-heavy page: **streaming with Suspense boundaries**, so the shell and fast parts render immediately while slow regions stream in, and **Cache Components / `use cache` with Partial Prerendering**, so the static shell is served instantly and data that tolerates staleness is cached with tags and revalidated on write. I'd also move data that's only displayed (not interactive) into Server Components to cut client JS.

### 9. Testing approach

- **Unit tests** cover pure logic with many edge cases and no UI: query-key normalization, URL ↔ params mapping, the 409 rebase and patch-building functions, 422 error mapping, and safe redirects. They're fast and pinpoint failures.
- **Component tests** (Testing Library + MSW at the network layer) cover behavior a user sees in one feature: filtering updates the URL and the rows, and the full 409 flow keeps the draft and saves on the new version. In this repo MSW forwards to the real mock route handlers, so the API contract isn't faked twice.
- **E2E tests** (Playwright) cover what only a real browser and server prove: sign-in and redirect, the proxy/locale rewrite, Back/Forward through real history, shared drawer links, and focus behavior. I keep them to a few critical journeys, because they're the slowest and most brittle.
