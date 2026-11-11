/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Foto aduan warga (2–8MB) dikirim lewat Server Action; default Next hanya 1MB.
    serverActions: {
      bodySizeLimit: '25mb',
    },
    // Mesin lokal ~7GB RAM; worker build default (jumlah core - 1) membuat proses
    // dibunuh OS saat "Collecting page data". Set BUILD_CPUS=1 bila perlu.
    ...(process.env.BUILD_CPUS ? { cpus: Number(process.env.BUILD_CPUS) } : {}),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
