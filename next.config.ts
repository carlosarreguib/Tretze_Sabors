import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No generar AGENTS.md/CLAUDE.md automaticamente en cada build.
  agentRules: false,
};

export default nextConfig;
