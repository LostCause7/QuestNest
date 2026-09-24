import type { NextConfig } from "next";
import os from "os";

function lanOrigins() {
  const origins = ["localhost", "127.0.0.1"];
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family === "IPv4" && !addr.internal && !addr.address.startsWith("169.254.")) {
        origins.push(addr.address);
      }
    }
  }
  return origins;
}

const nextConfig: NextConfig = {
  allowedDevOrigins: lanOrigins(),
  experimental: {
    serverActions: {
      // Custom domain + Vercel proxy: without this, every save can fail with
      // "An unexpected response was received from the server."
      allowedOrigins: ["chorehall.net", "www.chorehall.net"],
    },
  },
};

export default nextConfig;
