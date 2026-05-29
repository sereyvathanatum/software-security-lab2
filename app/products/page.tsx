"use client";
import { useEffect, useState } from "react";

type Product = { id: number; name: string; description: string };

export default function ProductsPage() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Read ?q= from the URL on first load so a crafted link works (reflected XSS).
  useEffect(() => {
    const urlQ = new URLSearchParams(window.location.search).get("q");
    if (urlQ !== null) {
      setQ(urlQ);
      runSearch(urlQ);
    }
  }, []);

  async function runSearch(query: string) {
    setSubmitted(query);
    setError(null);
    const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await r.json();
    if (data.error) {
      setError(data.error);
      setResults([]);
    } else {
      setResults(data.results);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set("q", q);
    window.history.replaceState({}, "", url);
    runSearch(q);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Products</h1>
      <p className="text-sm text-slate-600">
        Lab 2 (SQL injection via the search) and Lab 4 (reflected XSS via the
        echoed query). Try a normal term like <code>duck</code> first.
      </p>

      <form onSubmit={onSubmit} className="flex gap-2 max-w-md">
        <input
          className="border rounded flex-1 px-3 py-2"
          placeholder="search products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="bg-slate-900 text-white rounded px-4 py-2" type="submit">
          Search
        </button>
      </form>

      {submitted !== null && (
        // VULN (Lab 4 — reflected XSS, CWE-79): the raw query is injected into
        // the page as HTML. Try ?q=<img src=x onerror=alert('xss')>
        <div
          className="text-sm text-slate-700"
          dangerouslySetInnerHTML={{ __html: `Showing results for: <b>${submitted}</b>` }}
        />
      )}

      {error && (
        <pre className="bg-red-900 text-red-200 p-3 rounded text-xs overflow-auto">
          DB error: {error}
        </pre>
      )}

      <ul className="space-y-2">
        {results.map((p) => (
          <li key={`${p.id}-${p.name}`} className="border rounded p-3">
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-slate-600">{p.description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
