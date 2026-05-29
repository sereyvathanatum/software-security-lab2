// Smoke test: runs every exploit. Use it to confirm "still vulnerable" before
// patching, and "all fixed" after Labs 7–10.
//   exit 0 = exploit worked (vulnerable)   non-zero = patched
import { spawn } from "node:child_process";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

function run(cmd: string, args: string[]): Promise<number> {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: "inherit", env: { ...process.env, BASE_URL: BASE } });
    p.on("exit", (c) => resolve(c ?? 1));
  });
}

const tests = [
  ["SQLi login bypass (admin)", "tsx", ["scripts/sqli-login-bypass.ts", "admin"]],
  ["SQLi UNION dump",           "tsx", ["scripts/sqli-dump.ts"]],
  ["OS command injection (id)", "tsx", ["scripts/cmdi.ts", "id"]],
  ["Stored XSS cookie theft",   "tsx", ["scripts/xss-steal.ts"]],
] as const;

async function main() {
  const summary: Array<[string, number]> = [];
  for (const [name, cmd, args] of tests) {
    console.log(`\n=== ${name} ===`);
    const code = await run(cmd, [...args]);
    console.log(`exit code: ${code}  (0 = exploit worked, non-zero = patched)`);
    summary.push([name, code]);
  }

  console.log("\n========== SUMMARY ==========");
  for (const [name, code] of summary) {
    console.log(`  ${code === 0 ? "VULNERABLE" : "patched   "}  ${name}`);
  }
}

main();
