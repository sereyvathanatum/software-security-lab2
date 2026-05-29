# Lab Notes — Session 8 (Injection & XSS)

Name: ____________________   Student ID: ____________________

For each lab fill in the exploit, the patch, and the verification. Cite the
**CWE** and the **OWASP prevention control** you applied.

## Lab 1 — SQL injection: authentication bypass (CWE-89)
- Exploit (one paragraph + screenshot ref):
- Patch (file + summary):
- Verify (command + result):

## Lab 2 — SQL injection: UNION data dump (CWE-89)
- Exploit (include the captured FLAG):
- Patch:
- Verify:

## Lab 3 — OS command injection (CWE-78)
- Exploit:
- Patch:
- Verify:

## Lab 4 — Reflected XSS (CWE-79)
- Exploit (the crafted link):
- Patch:
- Verify:

## Lab 5 — Stored XSS + cookie theft (CWE-79)
- Exploit:
- Patch (output encoding + cookie hardening):
- Verify:

## Lab 6 — DOM-based XSS (CWE-79)
- Exploit:
- Patch:
- Verify:

## Labs 7–10 — Prevention summary
- Parameterized queries (CWE-89): file + control:
- Validate + execFile (CWE-78): file + control:
- Output encoding (CWE-116): file + control:
- CSP + safe DOM sink: header value used + file:
- `npm run test:exploits` final summary (paste it):

## Reflection (≥150 words)

Pick the vulnerability you found most surprising. Explain why a developer might
write it without realizing it's dangerous (e.g. "the framework felt safe"), and
how your team's code review or CI tooling (SAST/DAST) could catch it before merge.
