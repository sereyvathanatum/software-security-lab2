"use client";
import { useEffect, useState } from "react";

type Capture = { value: string; at: string; ua: string | null };

export default function DashboardPage() {
  const [cookie, setCookie] = useState("");
  const [stolen, setStolen] = useState<Capture[]>([]);

  async function refresh() {
    setCookie(document.cookie || "(none)");
    const r = await fetch("/api/steal");
    const data = await r.json();
    setStolen(data.stolen ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Dashboard</h1>

      <section>
        <h2 className="font-semibold">Your cookies (readable by JavaScript)</h2>
        <p className="text-sm text-slate-600">
          Because the session cookie has no <code>HttpOnly</code> flag, any
          injected script can read this — that is what the stored-XSS payload
          steals.
        </p>
        <pre className="bg-slate-900 text-green-300 p-3 rounded text-xs">{cookie}</pre>
      </section>

      <section>
        <h2 className="font-semibold">😈 Attacker&apos;s loot bag (/api/steal)</h2>
        <p className="text-sm text-slate-600">
          Cookies exfiltrated by the XSS payload land here. In a real attack this
          is the attacker&apos;s server.
        </p>
        {stolen.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing stolen yet.</p>
        ) : (
          <ul className="space-y-1">
            {stolen.map((s, i) => (
              <li key={i} className="bg-red-50 border border-red-200 rounded p-2 text-xs font-mono">
                <span className="text-red-700">{s.value}</span>
                <span className="text-slate-400"> — {s.at}</span>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={refresh}
          className="mt-2 bg-slate-200 rounded px-3 py-1 text-sm"
        >
          Refresh
        </button>
      </section>
    </div>
  );
}
