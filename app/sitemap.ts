import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://dewijateng.jatengprov.go.id'
  ).replace(/\/$/, '');
  const lastModified = new Date();

  return [
    { url: `${baseUrl}/`, lastModified, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/lapor`, lastModified, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/transparansi`, lastModified, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/edukasi`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/login`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/daftar`, lastModified, changeFrequency: 'monthly', priority: 0.4 },
  ];
}
