export const SIGN_IN_PATH = "/sign-in";
export const DEFAULT_AFTER_SIGN_IN = "/companies";

// Same-origin paths only; blocks open redirects like "//evil.com" or "/\evil.com"
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return DEFAULT_AFTER_SIGN_IN;
  }
  return next;
}

export function signInUrl(next: string): string {
  return `${SIGN_IN_PATH}?next=${encodeURIComponent(next)}`;
}
