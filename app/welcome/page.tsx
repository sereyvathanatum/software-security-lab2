"use client";
import { useEffect, useRef } from "react";

export default function WelcomePage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // VULN (Lab 6 — DOM-based XSS, CWE-79): attacker-controlled location.hash
    // flows straight into the innerHTML sink. The server never sees the payload.
    // Try:  /welcome#<img src=x onerror=alert('dom-xss')>
    const name = decodeURIComponent(window.location.hash.slice(1)) || "guest";
    if (ref.current) {
      ref.current.innerHTML = `Welcome back, ${name}!`;
    }
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Welcome (Lab 6 — DOM-based XSS)</h1>
      <p className="text-sm text-slate-600">
        This page greets you using the part of the URL after the{" "}
        <code>#</code>. Try{" "}
        <code>/welcome#Alice</code>, then{" "}
        <code>{"/welcome#<img src=x onerror=alert('dom-xss')>"}</code>.
      </p>
      <div ref={ref} className="text-lg border rounded p-4 bg-white" />
    </div>
  );
}
