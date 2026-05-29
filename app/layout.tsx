import "./globals.css";
import Link from "next/link";

export const metadata = { title: "Ses8 — Injection & XSS Lab" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <div className="bg-red-700 text-white text-center py-1 text-sm font-bold">
          ⚠ INTENTIONALLY VULNERABLE APP — DO NOT DEPLOY. EDUCATIONAL USE ONLY.
        </div>
        <nav className="bg-white border-b px-6 py-3 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="font-bold">Ses8 Demo</Link>
          <Link href="/login">Login</Link>
          <Link href="/products">Products</Link>
          <Link href="/tools">Network Tools</Link>
          <Link href="/guestbook">Guestbook</Link>
          <Link href="/welcome">Welcome</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
        <main className="max-w-3xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
