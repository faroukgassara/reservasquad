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

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
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
    <html lang={locale} className={`${poppins.variable} ${inter.variable}`}>
      <body className={`${inter.className} bg-gray-25 text-gray-900 antialiased`}>
        <RouteProviders session={session} locale={locale} messages={messages}>
          {children}
        </RouteProviders>
      </body>
    </html>
  );
}
