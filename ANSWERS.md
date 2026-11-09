# Part 1: Written answers

### 1. Server vs Client Components

I start with a Server Component and only switch to a Client Component when I need state, event handlers or something like `sessionStorage`. On the companies screen, the page with the heading is a Server Component. The table, filters and drawer are one Client Component (`CompaniesScreen`). I keep those together instead of splitting them up, because they all depend on the same URL state and I don't want to pass that back and forth across a boundary.

### 2. Fetching in a Server Component

When the first load needs to show data right away (for SEO, or so the user doesn't see a spinner), or when the request needs a secret that can't go to the browser. To not fetch twice, I prefetch on the server with the same `queryOptions` the client uses and pass it down with `HydrationBoundary`. The client then finds the data in the cache under the same key and doesn't refetch, as long as `staleTime` isn't 0. In my submission I didn't do this, because the fake token only exists in the browser, so the server can't call the API as the user.

### 3. Handling a 409 Conflict

The user shouldn't lose what they typed. When the save returns 409, the form stays as it is and a message says someone else changed this company, with a button to load the latest version. I invalidate that company and the lists in the cache, since they're now out of date. The form keeps its own copy of the record it was opened with, though; otherwise a background refetch could quietly update the version and the conflict would never be caught.

When they load the latest version, I merge: fields the user changed keep their value, the rest take the server's value. If both people changed the same field, I show the other person's value under it so the user can decide. Then they save again with the new version.

### 4. Filter, sort and pagination state

In the URL. A refresh keeps it, Back and Forward just work, and you can send someone a link to the exact same view. I used nuqs to read it with types, so something like `?page=abc` falls back to the default instead of breaking. The query key is built from those URL values, so there's no second copy in `useState` that can go out of sync. One detail: typing in search replaces the history entry instead of pushing one, otherwise Back would undo one letter at a time.

### 5. Access token on a shared client

All requests go through one function in the client, and that function reads the token right before each request and adds the `Authorization` header. Components never touch the token. If it expires, the API returns 401. I'd try one silent refresh and retry, making sure parallel requests wait for that same refresh instead of each starting their own. If the refresh fails, I clear the token and the query cache (so the next user doesn't see the previous user's data) and redirect to sign-in with the current page as the return path.

The token should never be in the URL, query keys, logs, error reports or server-rendered HTML.

### 6. Loading, error and empty states

The table and the drawer get their own Suspense boundaries, so one being slow doesn't block the other. `error.tsx` is only for actual crashes. A failed request or a 404 shows inline next to the data with a retry button, because that's an expected situation, not a crash. An empty list isn't an error at all; the table just shows "No companies match these filters" with a button to clear them.

What I would not do is let the table suspend every time a filter changes. It would unmount and the user would lose focus and scroll position. I keep the previous rows on screen (`keepPreviousData`) while the new ones load.

### 7. Dutch and English translations

One JSON file per language, with the language decided on the server from a cookie (or the browser language on a first visit). Server Components use `getTranslations`, and client components only receive the messages for the active language, so Dutch users never download the English file. Dates go through the same library's formatter with a fixed time zone; otherwise the server and the browser can format a date differently and React complains about a hydration mismatch.

### 8. Measuring "slow"

I'd want numbers first: LCP, INP and CLS from a production build, server response time, and the network tab, to see if requests are running one after another when they could run in parallel. Without that you're guessing. The two features I'd use are streaming with Suspense, so the page shows up right away and slow parts fill in, and `use cache` with partial prerendering, so the static part of the page is served instantly.

### 9. Testing approach

Unit tests for the logic that has a lot of edge cases, like the 409 merge function and turning URL params into API params. They're fast and tell you exactly what broke.

Component tests for what the user actually does: filter the list, open a company, get a 409, load the latest, save. I run those against the real mock API through MSW, so I'm not keeping a second fake API in sync. To check the 409 tests were really testing something, I removed the merge line and made sure they failed.

End-to-end tests for what only a real browser shows, like Back and Forward, opening a shared link, and the language switch. I'd keep only a few, because they're slow and break easily.
