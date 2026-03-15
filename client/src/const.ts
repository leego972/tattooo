export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Returns the local /login page URL.
 * Auth is handled via email/password on /login — no external OAuth.
 */
export const getLoginUrl = (returnTo?: string) => {
  const base = "/login";
  if (returnTo) return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  return base;
};
