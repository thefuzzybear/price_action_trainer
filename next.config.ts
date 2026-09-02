import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /blog → /blog/ (trailing-slash canonical for static HTML in public/blog/)
      {
        source:      '/blog',
        destination: '/blog/',
        permanent:   true,
      },
    ];
  },
};

export default nextConfig;
