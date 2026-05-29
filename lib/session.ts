// Minimal cookie-based session for the lab.
//
// VULN (Lab 5): the `sid` cookie is set WITHOUT the `httpOnly` flag, so any
// injected JavaScript can read it via `document.cookie` and exfiltrate it.
// That is what makes the stored-XSS cookie-theft demo actually pay off.
// The Lab 9/10 patch adds `httpOnly: true` (and a CSP) as the backstop.
import { cookies } from "next/headers";

export const SESSION_COOKIE = "sid";

export function setSession(username: string) {
  cookies().set(SESSION_COOKIE, username, {
    path: "/",
    // httpOnly: false  <-- intentionally omitted (VULN: readable by JS)
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export function getSession(): string | null {
  return cookies().get(SESSION_COOKIE)?.value ?? null;
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}
