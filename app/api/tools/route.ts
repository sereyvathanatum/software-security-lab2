// VULN (Lab 3 — OS command injection, CWE-78): the "network diagnostics" tool
// builds a shell command by concatenating the user-supplied host, then runs it
// with child_process.exec — which spawns a real shell (/bin/sh -c "..."). Shell
// metacharacters in the input (; | && $() ` ) therefore run as extra commands.
//
// Exploit:  host = 127.0.0.1; id
//           host = 127.0.0.1; cat /etc/passwd
import { NextRequest, NextResponse } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const { host } = await req.json();

  // -c 1 = one ping packet. The host is pasted straight into the shell string.
  const cmd = `ping -c 1 ${host}`;
  console.log("[tools] running shell command:", cmd);

  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: 5000 });
    return NextResponse.json({ cmd, output: stdout + stderr });
  } catch (e: any) {
    // Even failures leak the injected command's output via stdout/stderr.
    return NextResponse.json({
      cmd,
      output: (e?.stdout ?? "") + (e?.stderr ?? "") + (e?.message ?? ""),
    });
  }
}
