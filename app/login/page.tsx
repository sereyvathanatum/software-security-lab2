"use client";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await r.json();
    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Login (Lab 1 — SQL injection)</h1>
      <p className="text-sm text-slate-600">
        Try a normal login (e.g. <code>alice</code> / <code>password</code>).
        Then try the username <code>{"admin' -- "}</code> with any password, or{" "}
        <code>{"' OR '1'='1' -- "}</code> (note the trailing space after <code>--</code>).
      </p>
      <form onSubmit={submit} className="space-y-3 max-w-sm">
        <input
          className="border rounded w-full px-3 py-2"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="border rounded w-full px-3 py-2"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-slate-900 text-white rounded px-4 py-2" type="submit">
          Log in
        </button>
      </form>
      {result && (
        <pre className="bg-slate-900 text-green-300 p-3 rounded text-xs overflow-auto">
          {result}
        </pre>
      )}
    </div>
  );
}
