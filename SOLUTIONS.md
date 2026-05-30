# Session 8 — Instructor Solutions

> **Withhold from students until the end of the session.** Full patches for every
> vulnerability, plus a grading rubric. File paths are relative to `app/`.

Each fix maps to a Module 6 control: **separate data from commands**, **validate
input**, **encode output**, **defense in depth**.

---

## Lab 1 & 2 — SQL injection → parameterized queries (CWE-89)

### `app/api/login/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const user = await db.user.findFirst({
    where: { username, password }, // parameterized by Prisma
    select: { id: true, username: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }
  setSession(user.username);
  return NextResponse.json({
    ok: true,
    username: user.username,
    role: user.role,
  });
}
```

### `app/api/search/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = await db.product.findMany({
    where: { name: { contains: q } }, // parameterized
    select: { id: true, name: true, description: true },
  });
  return NextResponse.json({ results });
}
```

> Raw-SQL alternative that is still safe: the tagged template binds `${}` as a
> parameter — `` db.$queryRaw`SELECT id, name, description FROM Product WHERE name LIKE ${"%" + q + "%"}` ``.
> The key teaching point: **`$queryRaw` (tagged template) is safe; `$queryRawUnsafe` (string) is not.**

**Defense in depth:** least-privilege DB user (no DDL), and don't echo raw DB
error strings back to the client.

**Verify:** `npm run exploit:sqli admin` and `npm run exploit:dump` both exit non-zero.

---

## Lab 3 — OS command injection → validate + `execFile` (CWE-78 / CWE-20)

### `app/api/tools/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);

const HOST_RE = /^[a-zA-Z0-9.-]{1,253}$/; // allowlist validation

export async function POST(req: NextRequest) {
  const { host } = await req.json();
  if (typeof host !== "string" || !HOST_RE.test(host)) {
    return NextResponse.json({ error: "invalid host" }, { status: 400 });
  }
  try {
    // execFile = no shell, args passed as an array → metacharacters are inert.
    const { stdout, stderr } = await execFileAsync("ping", ["-c", "1", host], {
      timeout: 5000,
    });
    return NextResponse.json({
      cmd: `ping -c 1 ${host}`,
      output: stdout + stderr,
    });
  } catch (e: any) {
    return NextResponse.json({
      cmd: `ping -c 1 ${host}`,
      output: (e?.stdout ?? "") + (e?.stderr ?? ""),
    });
  }
}
```

**Verify:** `npm run exploit:cmdi id` exits non-zero (host `127.0.0.1; id` rejected).

---

## Lab 4 — Reflected XSS → auto-escape (CWE-79 / CWE-116)

### `app/products/page.tsx`

Replace the `dangerouslySetInnerHTML` banner:

```tsx
{
  submitted !== null && (
    <div className="text-sm text-slate-700">
      Showing results for: <b>{submitted}</b>
    </div>
  );
}
```

JSX `{submitted}` is auto-escaped, so `<img onerror=...>` renders as text.

---

## Lab 5 — Stored XSS → encode output + harden cookie (CWE-79)

### `app/guestbook/page.tsx`

```tsx
<div>{c.body}</div>     {/* was dangerouslySetInnerHTML */}
```

### `app/api/comments/route.ts` (defense in depth — sanitize on input)

```ts
function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
// in POST:
const comment = await db.comment.create({
  data: {
    author: (author || "anon").slice(0, 40),
    body: escapeHtml(body ?? ""),
  },
});
```

> Rendering with `{c.body}` alone already stops the attack. Escaping on input is
> belt-and-suspenders and is what flips the `npm run exploit:xss` automated check,
> since that script inspects the stored/served body.

### `lib/session.ts` (kill the cookie-theft payoff)

```ts
cookies().set(SESSION_COOKIE, username, {
  path: "/",
  httpOnly: true, // document.cookie can no longer read it
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 8,
});
```

**Verify:** `npm run exploit:xss` exits non-zero.

---

## Lab 6 & 10 — DOM XSS → `textContent` + CSP backstop (CWE-79 / CWE-116)

### `app/welcome/page.tsx`

```ts
ref.current.textContent = `Welcome back, ${name}!`; // was innerHTML
```

### `next.config.js` (site-wide CSP)

```js
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'",
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
```

**Verify:** `/welcome#<img src=x onerror=alert(1)>` renders inert text;
`curl -I http://localhost:3000 | grep -i content-security-policy` shows the header.

---

## Final state

After all patches: `npm run test:exploits` → every row reads `patched`.

---
