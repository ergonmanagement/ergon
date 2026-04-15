import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Directory that contains this config file (the real app root). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Next can pick a parent folder when multiple package-lock.json files exist,
  // which skips this repo's .env.local and strips NEXT_PUBLIC_* from the client.
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
