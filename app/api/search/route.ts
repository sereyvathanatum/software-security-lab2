// VULN (Lab 2 — SQL injection / UNION dump, CWE-89): the product search builds
// a raw LIKE query by concatenating the `q` parameter, then runs it with
// $queryRawUnsafe. Because the SELECT exposes exactly 3 columns
// (id, name, description), an attacker can append a UNION that selects 3
// columns from ANY table and have them rendered as fake "products".
//
// Exploit (dump every user + the admin FLAG):
//   /api/search?q=%' UNION SELECT id, username, password || ' / ' || secret FROM User --
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";

  // Data concatenated into the command — the textbook SQLi mistake.
  const sql = `SELECT id, name, description FROM Product WHERE name LIKE '%${q}%'`;
  console.log("[search] running SQL:", sql);

  try {
    const rows = (await db.$queryRawUnsafe(sql)) as Array<{
      id: number;
      name: string;
      description: string;
    }>;
    return NextResponse.json({ results: rows });
  } catch (e: any) {
    // Verbose DB errors are themselves a leak — handy for the attacker.
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
