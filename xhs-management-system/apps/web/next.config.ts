import type { NextConfig } from "next"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const appDirectory = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  turbopack: {
    root: resolve(appDirectory, "../.."),
  },
  transpilePackages: ["@workspace/ui"],
}

export default nextConfig
