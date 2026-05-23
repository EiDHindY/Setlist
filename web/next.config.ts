import type { NextConfig } from "next";
import { execSync } from "child_process";

// Resolve build identity:
// - In production (Vercel): VERCEL_GIT_COMMIT_SHA is injected automatically
// - In local dev: falls back to running `git rev-parse --short HEAD`
let buildSha = "dev";
let buildBranch = "local";
let buildMessage = "";
try {
  buildSha =
    (process.env.VERCEL_GIT_COMMIT_SHA || process.env.CF_PAGES_COMMIT_SHA)?.slice(0, 7) ??
    execSync("git rev-parse --short HEAD").toString().trim();
  buildBranch =
    process.env.VERCEL_GIT_COMMIT_REF ?? process.env.CF_PAGES_BRANCH ??
    execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  buildMessage =
    process.env.VERCEL_GIT_COMMIT_MESSAGE ??
    execSync("git log -1 --pretty=%s").toString().trim(); // %s is subject only
    
  if (buildMessage.length > 40) {
    buildMessage = buildMessage.substring(0, 37) + "...";
  }
} catch {
  // silently ignore if git is not available
  buildMessage = "Development Build";
}

const nextConfig: NextConfig = {
  // Re-enabling the React Compiler for maximum performance on Vercel
  reactCompiler: true,
  
  // Keep the aggressive tree-shaking for libraries as it's good practice
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  env: {
    NEXT_PUBLIC_BUILD_SHA: buildSha,
    NEXT_PUBLIC_BUILD_BRANCH: buildBranch,
    NEXT_PUBLIC_BUILD_MESSAGE: buildMessage,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
