// Stored-comment API for the guestbook.
//
// VULN (Lab 5 — stored XSS, CWE-79): the comment `body` is saved verbatim and
// later rendered UNESCAPED in app/guestbook/page.tsx (via dangerouslySetInnerHTML).
// Any <script> / <img onerror> in a comment runs in every visitor's browser.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const comments = await db.comment.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const { author, body } = await req.json();
  // No sanitization, no encoding — stored exactly as received.
  const comment = await db.comment.create({
    data: { author: author || "anon", body: body ?? "" },
  });
  return NextResponse.json({ ok: true, id: comment.id });
}
