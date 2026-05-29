"use client";
import { useEffect, useState } from "react";

type Comment = { id: number; author: string; body: string; createdAt: string };

export default function GuestbookPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");

  async function load() {
    const r = await fetch("/api/comments");
    const data = await r.json();
    setComments(data.comments);
  }

  useEffect(() => {
    load();
  }, []);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, body }),
    });
    setBody("");
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Guestbook (Lab 5 — stored XSS)</h1>
      <p className="text-sm text-slate-600">
        Leave a comment for everyone. Try posting{" "}
        <code>{"<img src=x onerror=alert(document.cookie)>"}</code> or the
        cookie-stealer from the README, then reload — it runs for every visitor.
      </p>

      <form onSubmit={post} className="space-y-2 max-w-md">
        <input
          className="border rounded w-full px-3 py-2"
          placeholder="your name"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <textarea
          className="border rounded w-full px-3 py-2"
          placeholder="your comment"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button className="bg-slate-900 text-white rounded px-4 py-2" type="submit">
          Post comment
        </button>
      </form>

      <ul className="space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="border rounded p-3">
            <div className="text-xs text-slate-500">{c.author}</div>
            {/* VULN (Lab 5 — stored XSS, CWE-79): comment body rendered as raw HTML. */}
            <div dangerouslySetInnerHTML={{ __html: c.body }} />
          </li>
        ))}
      </ul>
    </div>
  );
}
