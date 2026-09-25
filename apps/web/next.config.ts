import path from "node:path";
import type { NextConfig } from "next";

// `next build` запускается из apps/web (pnpm --filter), корень монорепо — на два уровня выше
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  transpilePackages: ["@oracle/core", "@oracle/db"],
  poweredByHeader: false,
};

export default nextConfig;
