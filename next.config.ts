import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  webpack: (cfg) => {
    cfg.resolve.extensionAlias = {
      ...cfg.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    return cfg;
  },
};

export default config;
