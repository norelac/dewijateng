import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/lapor', '/transparansi', '/edukasi'],
        disallow: ['/pengelola/', '/disbudparekraf/', '/api/'],
      },
    ],
  };
}
