"use client";
import { useState } from "react";

export default function ToolsPage() {
  const [host, setHost] = useState("127.0.0.1");
  const [output, setOutput] = useState<string | null>(null);
  const [cmd, setCmd] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setOutput("running…");
    const r = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host }),
    });
    const data = await r.json();
    setCmd(data.cmd);
    setOutput(data.output);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Network Tools (Lab 3 — command injection)</h1>
      <p className="text-sm text-slate-600">
        Ping a host to check if it is reachable. Try <code>127.0.0.1</code>{" "}
        first, then try <code>127.0.0.1; id</code> or{" "}
        <code>127.0.0.1; cat /etc/passwd</code>.
      </p>

      <form onSubmit={run} className="flex gap-2 max-w-md">
        <input
          className="border rounded flex-1 px-3 py-2 font-mono"
          value={host}
          onChange={(e) => setHost(e.target.value)}
        />
        <button className="bg-slate-900 text-white rounded px-4 py-2" type="submit">
          Ping
        </button>
      </form>

      {cmd && <div className="text-xs font-mono text-slate-500">$ {cmd}</div>}
      {output && (
        <pre className="bg-slate-900 text-green-300 p-3 rounded text-xs overflow-auto whitespace-pre-wrap">
          {output}
        </pre>
      )}
    </div>
  );
}
