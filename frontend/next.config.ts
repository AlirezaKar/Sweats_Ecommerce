import type { NextConfig } from "next";

const defaultApi = "http://127.0.0.1:8000";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? defaultApi;
const apiHost = new URL(apiUrl);

function mediaPattern(hostname: string, port: string) {
  return {
    protocol: apiHost.protocol.replace(":", "") as "http" | "https",
    hostname,
    port: port || undefined,
    pathname: "/media/**",
  };
}

const port = apiHost.port || (apiHost.protocol === "https:" ? "443" : "80");
const remotePatterns = [
  mediaPattern(apiHost.hostname, port),
  mediaPattern("127.0.0.1", port),
  mediaPattern("localhost", port),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
