import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

const APP_URL = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/(private)/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
