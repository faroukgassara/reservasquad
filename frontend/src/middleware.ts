import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { PublicRoutes, Routes } from './lib/routes';
import { getToken } from 'next-auth/jwt';
import { isRouteAllowed } from './lib/route-access';

const intlMiddleware = createMiddleware(routing);

function localizedLoginUrl(req: NextRequest, locale: string): URL {
  const path =
    locale === routing.defaultLocale ? Routes.Login : `/${locale}${Routes.Login}`;
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
      authorized: ({ token }) => token != null,
    },
    pages: {
      signIn: '/login',
    },
  },
);

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const localeMatch = pathname.match(`^/(${routing.locales.join('|')})(/.*)?$`);
  const locale = localeMatch?.[1] || routing.defaultLocale;
  const pathWithoutLocale = localeMatch?.[2] || pathname;

  const isHomePage =
    !pathWithoutLocale ||
    pathWithoutLocale === '/' ||
    pathWithoutLocale === `/${locale}`;
  const isActivatePath =
    pathWithoutLocale === '/activate' ||
    pathWithoutLocale.startsWith('/activate/');
  const isPublicPage =
    isHomePage ||
    isActivatePath ||
    PublicRoutes.some(
      (route) =>
        pathWithoutLocale === route || pathWithoutLocale.startsWith(route + '/'),
    );

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as { user?: { role?: string } } | null)?.user?.role;

  if (isHomePage) {
    if (token) {
      return NextResponse.redirect(localizedDashboardUrl(req, locale));
    }
    return NextResponse.redirect(localizedLoginUrl(req, locale));
  }

  if (isPublicPage) {
    if (token && !isActivatePath) {
      return NextResponse.redirect(localizedDashboardUrl(req, locale));
    }
    return intlMiddleware(req);
  }

  const authContext = { role };

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
    '/activate/:path*',
    '/(fr|en|ar)/activate/:path*',
  ],
};
