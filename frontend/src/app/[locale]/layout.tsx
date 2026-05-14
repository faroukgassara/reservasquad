import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import '@/app/globals.css';
import RouteProviders from '@/components/providers/RouteProviders';
import LocaleMarketingShell from '@/components/Layouts/LocaleMarketingShell';

const lato = Lato({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
    title: 'Reserva Squad — Salles d’étude',
    description:
        'Application de réservation de salles d’étude pour professeurs et administration.',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await the params promise instead of using React.use()
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const session = await getServerSession(authOptions);

  return (
    <html lang={locale}>
      <body className={`${lato.variable} font-sans antialiased`}>
        <RouteProviders session={session} locale={locale} messages={messages}>
          <LocaleMarketingShell>{children}</LocaleMarketingShell>
        </RouteProviders>
      </body>
    </html>
  );
}