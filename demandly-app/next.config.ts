import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ['192.168.14.18', '10.239.16.236', '192.168.29.151'],
};

export default nextConfig;
