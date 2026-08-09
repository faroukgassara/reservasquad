import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import '@/app/globals.css';
import RouteProviders from '@/components/providers/RouteProviders';
import { SITE_URL } from '@/lib/site-url';

// Charte Biblio Squad: Poppins = titres, Inter = textes
const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const APP_URL = SITE_URL;

const metadataByLocale: Record<string, Metadata> = {
  fr: {
    title: {
      default: 'Reserva Squad - Gestion des salles | Biblio Squad',
      template: '%s | Reserva Squad',
    },
    description:
      'Backoffice Reserva Squad — gérez les salles, professeurs et réservations de Biblio Squad.',
    keywords: [
      'Reserva Squad',
      'Biblio Squad',
      'réservation salles',
      'coworking Tunis',
    ],
    openGraph: {
      title: 'Reserva Squad - Gestion des salles',
      description:
        'Backoffice de réservation des salles et espaces Biblio Squad.',
      locale: 'fr_TN',
    },
    twitter: {
      title: 'Reserva Squad - Gestion des salles',
      description: 'Backoffice de réservation des salles Biblio Squad.',
    },
  },
  en: {
    title: {
      default: 'Reserva Squad - Room management | Biblio Squad',
      template: '%s | Reserva Squad',
    },
    description:
      'Reserva Squad backoffice — manage rooms, professors and reservations for Biblio Squad.',
    keywords: [
      'Reserva Squad',
      'Biblio Squad',
      'room booking',
      'coworking Tunis',
    ],
    openGraph: {
      title: 'Reserva Squad - Room management',
      description: 'Backoffice for Biblio Squad room and space reservations.',
      locale: 'en_TN',
    },
    twitter: {
      title: 'Reserva Squad - Room management',
      description: 'Backoffice for Biblio Squad room reservations.',
    },
  },
  ar: {
    title: {
      default: 'Reserva Squad - إدارة القاعات | Biblio Squad',
      template: '%s | Reserva Squad',
    },
    description:
      'لوحة تحكم Reserva Squad — إدارة القاعات والأساتذة والحجوزات لـ Biblio Squad.',
    keywords: [
      'Reserva Squad',
      'Biblio Squad',
      'حجز قاعات',
      'مساحة عمل مشتركة تونس',
    ],
    openGraph: {
      title: 'Reserva Squad - إدارة القاعات',
      description: 'لوحة تحكم لحجوزات قاعات ومساحات Biblio Squad.',
      locale: 'ar_TN',
    },
    twitter: {
      title: 'Reserva Squad - إدارة القاعات',
      description: 'لوحة تحكم لحجوزات قاعات Biblio Squad.',
    },
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const localized = metadataByLocale[locale] || metadataByLocale.fr;

  // With localePrefix: 'as-needed' and defaultLocale: 'en', English pages are
  // served without an /en prefix (e.g. the homepage is "/", not "/en"). URLs
  // must reflect that or the canonical/hreflang tags point at a URL that
  // redirects back to the unprefixed one, which confuses search engines.
  const defaultLocale = 'en';
  const localePath = (targetLocale: string) => (targetLocale === defaultLocale ? '' : `/${targetLocale}`);

  return {
    metadataBase: new URL(APP_URL),
    ...localized,
    openGraph: {
      ...localized.openGraph,
      url: `${APP_URL}${localePath(locale)}`,
      siteName: 'Biblio Squad',
      type: 'website',
    },
    twitter: {
      ...localized.twitter,
      card: 'summary_large_image',
    },
    alternates: {
      canonical: `${APP_URL}${localePath(locale)}`,
      languages: {
        fr: `${APP_URL}${localePath('fr')}`,
        en: `${APP_URL}${localePath('en')}`,
        ar: `${APP_URL}${localePath('ar')}`,
        'x-default': `${APP_URL}${localePath(defaultLocale)}`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
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
  // Await the params promise instead of using React.use()
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const session = await getServerSession(authOptions);

  return (
    <html lang={locale} className={`${poppins.variable} ${inter.variable}`}>
      <body className={`${inter.className} bg-gray-25 text-gray-900 antialiased`}>
        <RouteProviders session={session} locale={locale} messages={messages}>
          {children}
        </RouteProviders>
      </body>
    </html>
  );
}