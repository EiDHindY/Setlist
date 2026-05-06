import type { NextConfig } from "next";
import { execSync } from "child_process";

// Resolve build identity:
// - In production (Cloudflare Pages): CF_PAGES_COMMIT_SHA is injected automatically
// - In local dev: falls back to running `git rev-parse --short HEAD`
let buildSha = "dev";
let buildBranch = "local";
try {
  buildSha =
    process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) ??
    execSync("git rev-parse --short HEAD").toString().trim();
  buildBranch =
    process.env.CF_PAGES_BRANCH ??
    execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
} catch {
  // silently ignore if git is not available
}

const nextConfig: NextConfig = {
  // Disabling the compiler for now to save space on the Edge Worker
  reactCompiler: false,
  
  // Aggressively tree-shake these heavy libraries
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  env: {
    NEXT_PUBLIC_BUILD_SHA: buildSha,
    NEXT_PUBLIC_BUILD_BRANCH: buildBranch,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
