/** @type {import('next').NextConfig} */
// NOTE: no Content-Security-Policy header here on purpose.
// Adding a CSP is the defense-in-depth backstop you build in Lab 10.
const nextConfig = { reactStrictMode: true };
module.exports = nextConfig;
