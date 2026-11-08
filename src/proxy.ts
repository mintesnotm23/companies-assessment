import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // API and static assets bypass locale handling
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
