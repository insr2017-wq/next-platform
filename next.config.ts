import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Evita aviso de “multiple lockfiles” quando o projeto está dentro de uma pasta com outro package-lock acima. */
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      { source: "/admin-login", destination: "/login", permanent: false },
      { source: "/admin-login/direto", destination: "/login", permanent: false },
    ];
  },
};

export default nextConfig;

