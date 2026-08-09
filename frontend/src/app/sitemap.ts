import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

const APP_URL = SITE_URL;
const locales = ['en', 'fr', 'ar'];
const defaultLocale = 'en';

const publicRoutes = [
  '',
  '/shop',
  '/cart',
  '/checkout',
  '/aboutus',
  '/contact',
  '/faq',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of publicRoutes) {
      const path = locale === defaultLocale ? route : `/${locale}${route}`;
      entries.push({
        url: `${APP_URL}${path || '/'}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1.0 : 0.8,
      });
    }
  }

  return entries;
}
