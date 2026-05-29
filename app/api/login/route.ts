// VULN (Lab 1 — SQL injection, CWE-89): the username and password are
// concatenated straight into a SQL string and run with $queryRawUnsafe.
// Prisma would normally parameterize for you; $queryRawUnsafe opts OUT of that.
//
// Exploit: username = admin' --       (comments out the password check)
//      or: username = ' OR '1'='1' --  with any password (always-true WHERE,
//          trailing "-- " comments out the AND password = '...' clause)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  // The smoking gun: data and command mixed in one string.
  const sql = `SELECT id, username, role FROM User WHERE username = '${username}' AND password = '${password}'`;
  console.log("[login] running SQL:", sql);

  const rows = (await db.$queryRawUnsafe(sql)) as Array<{
    id: number;
    username: string;
    role: string;
  }>;

  if (rows.length === 0) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  const user = rows[0];
  setSession(user.username);
  return NextResponse.json({ ok: true, username: user.username, role: user.role });
}
