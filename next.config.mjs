import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root so a stray lockfile in a parent directory is ignored.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  images: {
    unoptimized: true,
  },
}

export default nextConfig
