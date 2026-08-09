import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import { Playfair_Display, Poppins } from 'next/font/google';
import '@/app/globals.css';
import RouteProviders from '@/components/providers/RouteProviders';
import LocaleMarketingShell from '@/components/Layouts/LocaleMarketingShell/LocaleMarketingShell';
import { SITE_URL } from '@/lib/site-url';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

// Charte Conchas: Playfair Display is the heading typeface (H1 / H2)
const playfair = Playfair_Display({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const APP_URL = SITE_URL;

const metadataByLocale: Record<string, Metadata> = {
  fr: {
    title: {
      default: 'Biblio Squad - Centre de Certification et Formation à Sfax, Tunisie',
      template: '%s | Biblio Squad',
    },
    description:
      'Biblio Squad est un centre de formation et certification professionnelle à Sfax, Tunisie. Formations IT, certifications, coworking et plus.',
    keywords: [
      'formation Sfax',
      'certification Tunisie',
      'formation professionnelle Sfax',
      'centre de formation Sfax',
      'coworking Sfax',
      'Biblio Squad',
      'certification IT Tunisie',
    ],
    openGraph: {
      title: 'Biblio Squad - Centre de Certification et Formation à Sfax',
      description:
        'Centre de formation et certification professionnelle à Sfax, Tunisie. Formations IT, certifications, coworking.',
      locale: 'fr_TN',
    },
    twitter: {
      title: 'Biblio Squad - Centre de Certification et Formation à Sfax',
      description:
        'Centre de formation et certification professionnelle à Sfax, Tunisie.',
    },
  },
  en: {
    title: {
      default: 'Biblio Squad - Training & Certification Center in Sfax, Tunisia',
      template: '%s | Biblio Squad',
    },
    description:
      'Biblio Squad is a professional training and certification center in Sfax, Tunisia. IT courses, certifications, coworking and more.',
    keywords: [
      'training Sfax',
      'certification Tunisia',
      'professional training Sfax',
      'training center Sfax',
      'coworking Sfax',
      'Biblio Squad',
      'IT certification Tunisia',
    ],
    openGraph: {
      title: 'Biblio Squad - Training & Certification Center in Sfax',
      description:
        'Professional training and certification center in Sfax, Tunisia. IT courses, certifications, coworking.',
      locale: 'en_TN',
    },
    twitter: {
      title: 'Biblio Squad - Training & Certification Center in Sfax',
      description:
        'Professional training and certification center in Sfax, Tunisia.',
    },
  },
  ar: {
    title: {
      default: 'Biblio Squad - مركز التدريب والشهادات في صفاقس، تونس',
      template: '%s | Biblio Squad',
    },
    description:
      'Biblio Squad مركز تدريب وشهادات مهنية في صفاقس، تونس. دورات تقنية، شهادات، مساحة عمل مشتركة والمزيد.',
    keywords: [
      'تدريب صفاقس',
      'شهادات تونس',
      'تدريب مهني صفاقس',
      'مركز تدريب صفاقس',
      'مساحة عمل مشتركة صفاقس',
      'Biblio Squad',
      'شهادات تقنية تونس',
    ],
    openGraph: {
      title: 'Biblio Squad - مركز التدريب والشهادات في صفاقس',
      description:
        'مركز تدريب وشهادات مهنية في صفاقس، تونس. دورات تقنية، شهادات، مساحة عمل مشتركة.',
      locale: 'ar_TN',
    },
    twitter: {
      title: 'Biblio Squad - مركز التدريب والشهادات في صفاقس',
      description:
        'مركز تدريب وشهادات مهنية في صفاقس، تونس.',
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
    <html lang={locale} className={`${poppins.variable} ${playfair.variable}`}>
      <body className={`${poppins.className} bg-gray-25 text-gray-900 antialiased`}>
        <RouteProviders session={session} locale={locale} messages={messages}>
          <LocaleMarketingShell>{children}</LocaleMarketingShell>
        </RouteProviders>
      </body>
    </html>
  );
}