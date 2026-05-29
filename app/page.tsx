import Link from "next/link";

const labs = [
  { n: 1, title: "SQL injection — authentication bypass", where: "/login", cwe: "CWE-89" },
  { n: 2, title: "SQL injection — UNION data dump", where: "/products", cwe: "CWE-89" },
  { n: 3, title: "OS command injection", where: "/tools", cwe: "CWE-78" },
  { n: 4, title: "Reflected XSS", where: "/products?q=…", cwe: "CWE-79" },
  { n: 5, title: "Stored XSS + cookie theft", where: "/guestbook", cwe: "CWE-79" },
  { n: 6, title: "DOM-based XSS", where: "/welcome#…", cwe: "CWE-79" },
  { n: 7, title: "Prevent SQLi — parameterized queries", where: "patch", cwe: "Module 6" },
  { n: 8, title: "Prevent command injection — validate + execFile", where: "patch", cwe: "Module 6" },
  { n: 9, title: "Prevent XSS — output encoding / auto-escape", where: "patch", cwe: "Module 6" },
  { n: 10, title: "Defense in depth — CSP + safe DOM sinks", where: "patch", cwe: "Module 6" },
];

export default function Home() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold">FESE311 — Session 8</h1>
        <p className="text-slate-600">
          Injection, SQL Injection &amp; XSS — Modules 4, 5, 6. You inherited a
          deliberately broken web app. Exploit each flaw, find the bug, patch it,
          and verify the exploit no longer works.
        </p>
      </section>

      <section className="rounded border bg-amber-50 border-amber-300 p-4 text-sm">
        <strong>Rules of engagement:</strong> run only on <code>localhost</code>.
        These are real, working vulnerabilities. Never point the exploit scripts
        at a system you do not own. Full walkthrough is in{" "}
        <code>README.md</code>.
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Labs</h2>
        <ol className="space-y-1">
          {labs.map((l) => (
            <li key={l.n} className="flex gap-3 text-sm border-b py-1">
              <span className="font-mono w-6 text-right">{l.n}.</span>
              <span className="flex-1">{l.title}</span>
              <span className="font-mono text-slate-400">{l.cwe}</span>
              <span className="font-mono text-blue-600 w-28 text-right">{l.where}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="text-sm text-slate-600">
        <p>
          Quick start: <Link className="text-blue-600 underline" href="/login">try the login</Link>{" "}
          with <code>{"admin' --"}</code> as the username and anything as the
          password.
        </p>
      </section>
    </div>
  );
}
