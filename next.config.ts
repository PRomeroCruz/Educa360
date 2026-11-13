import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignora los errores de ESLint durante el build en el pipeline
  eslint: {
    ignoreDuringBuilds: true,
  },
} as any;

export default nextConfig;