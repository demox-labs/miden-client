// const ThreadsPlugin = require("threads-plugin")

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    // if (!isServer) {
      // Ensures that web workers can import scripts.
      // config.output.publicPath = '/_next/';
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    }
      // config.plugins.push(new ThreadsPlugin())
      // config.output.globalObject = 'self';
    // }

    return config;
  }
};

module.exports = nextConfig;
