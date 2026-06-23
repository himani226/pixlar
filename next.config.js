/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Required for FFmpeg.wasm - allows SharedArrayBuffer

  // Optimize images
  images: {
    unoptimized: true,   // required for static export
    formats: ['image/avif', 'image/webp'],
  },

  // Compress output
  compress: true,

  // Webpack: handle wasm + suppress node core module warnings (ffmpeg)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }
    return config
  },
}

module.exports = nextConfig
