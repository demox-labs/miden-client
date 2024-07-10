/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
        syncWebAssembly: true,
        topLevelAwait: true,
        layers: true,
      }
    }

    return config;
  }
};

module.exports = nextConfig;
