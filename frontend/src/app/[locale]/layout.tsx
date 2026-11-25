import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import { Bricolage_Grotesque, Cairo, IBM_Plex_Sans_Arabic, Inter } from 'next/font/google';
import '@/app/globals.css';
import RouteProviders from '@/components/providers/RouteProviders';

const display = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  axes: ['opsz', 'wdth'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Bricolage Grotesque and Inter have no Arabic glyphs; globals.css swaps to these under lang="ar".
// Not preloaded so fr/en pages don't download them.
const cairo = Cairo({
  weight: ['600', '700'],
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
  preload: false,
});

const plexArabic = IBM_Plex_Sans_Arabic({
  weight: ['400', '500', '600'],
  subsets: ['arabic'],
  variable: '--font-plex-arabic',
  display: 'swap',
  preload: false,
});

const titlesByLocale: Record<string, string> = {
  fr: 'Biblio Squad',
  en: 'Biblio Squad',
  ar: 'Biblio Squad',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: titlesByLocale[locale] || titlesByLocale.fr,
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const session = await getServerSession(authOptions);

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className={`${display.variable} ${inter.variable} ${cairo.variable} ${plexArabic.variable}`} suppressHydrationWarning>
      <body className="bg-gray-25 text-gray-900 antialiased">
        <RouteProviders session={session} locale={locale} messages={messages}>
          {children}
        </RouteProviders>
      </body>
    </html>
  );
}
