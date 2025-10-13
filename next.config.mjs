/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // ✅ ESLint habilitado
  },
  typescript: {
    ignoreBuildErrors: false,  // ✅ TypeScript validación habilitada
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
