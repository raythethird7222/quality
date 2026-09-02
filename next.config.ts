// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  images: {
    unoptimized: true // Ensures Next.js doesn't try to optimize local images
  }
};

module.exports = nextConfig;
