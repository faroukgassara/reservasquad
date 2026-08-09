import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { PublicRoutes, Routes } from './lib/routes';
import { getToken } from 'next-auth/jwt';
import { isRouteAllowed } from './lib/route-access';

const intlMiddleware = createMiddleware(routing);

/** Front-office pages accessible without auth; logged-in users may stay (no redirect to dashboard). */
const PUBLIC_MARKETING_PREFIXES = [
  Routes.AboutUs,
  Routes.Shop.index,
  Routes.Cart,
  Routes.Checkout,
  Routes.Faq,
  Routes.Contact,
  '/activate',
] as const;

function isPublicMarketingPath(path: string): boolean {
  return PUBLIC_MARKETING_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function isClientRole(role: unknown): boolean {
  return role === 'CLIENT';
}

function localizedHomeUrl(req: NextRequest, locale: string): URL {
  const path = locale === routing.defaultLocale ? Routes.Home : `/${locale}`;
  return new URL(path, req.url);
}

function localizedDashboardUrl(req: NextRequest, locale: string): URL {
  const path =
    locale === routing.defaultLocale
      ? Routes.Dashboard
      : `/${locale}${Routes.Dashboard}`;
  return new URL(path, req.url);
}

const authMiddleware = withAuth(
  (req) => intlMiddleware(req),
  {
    callbacks: {
      authorized: ({ token }) => token != null
    },
    pages: {
      signIn: '/login'
    }
  }
);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const localeMatch = pathname.match(`^/(${routing.locales.join('|')})(/.*)?$`);
  const locale = localeMatch?.[1] || routing.defaultLocale;
  const pathWithoutLocale = localeMatch?.[2] || pathname;

  const isHomePage = !pathWithoutLocale || pathWithoutLocale === '/' || pathWithoutLocale === `/${locale}`;
  const publicPagesWithoutHome = PublicRoutes.filter(route => route !== '/');
  const isPublicPage =
    isHomePage ||
    isPublicMarketingPath(pathWithoutLocale) ||
    publicPagesWithoutHome.some(
      (route) => pathWithoutLocale === route || pathWithoutLocale.startsWith(route + '/')
    );

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as { user?: { role?: string } } | null)?.user?.role;

  if (isPublicPage) {
    if (token && !isHomePage && !isPublicMarketingPath(pathWithoutLocale)) {
      // Auth pages (login, etc.): staff → dashboard, clients → home
      if (isClientRole(role)) {
        return NextResponse.redirect(localizedHomeUrl(req, locale));
      }
      return NextResponse.redirect(localizedDashboardUrl(req, locale));
    }
    return intlMiddleware(req);
  }

  // Backoffice / private routes: clients are not allowed
  if (token && isClientRole(role)) {
    return NextResponse.redirect(localizedHomeUrl(req, locale));
  }

  const authContext = {
    role,
  };

  if (token && !isRouteAllowed(pathWithoutLocale, authContext)) {
    return NextResponse.redirect(localizedDashboardUrl(req, locale));
  }

  return (authMiddleware as any)(req);
}

export const config = {
  matcher: [
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
    '/reset-password/:path*',
    '/(fr|en|ar)/reset-password/:path*',
    // JWT tokens contain dots; the catch-all above would skip them and break
    // unprefixed default-locale URLs (localePrefix: as-needed).
    '/activate/:path*',
    '/(fr|en|ar)/activate/:path*',
  ]
};
