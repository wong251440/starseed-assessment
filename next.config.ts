import type { NextConfig } from 'next';

const onGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: onGitHubPages ? '/starseed-assessment/' : '',
};

export default nextConfig;
