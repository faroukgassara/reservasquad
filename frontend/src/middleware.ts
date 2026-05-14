import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { PublicRoutes, Routes } from './lib/routes';
import { getToken } from 'next-auth/jwt';
import { isRouteAllowed } from './lib/route-access';

const intlMiddleware = createMiddleware(routing);

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
  const isBlogPath =
    pathWithoutLocale === '/blog' || pathWithoutLocale.startsWith('/blog/');
  const isAboutUsPath =
    pathWithoutLocale === '/aboutus' || pathWithoutLocale.startsWith('/aboutus/');
  const publicPagesWithoutHome = PublicRoutes.filter((route) => route !== '/');
  const isPublicPage =
    isHomePage ||
    isBlogPath ||
    isAboutUsPath ||
    publicPagesWithoutHome.some(
      (route) => pathWithoutLocale === route || pathWithoutLocale.startsWith(route + '/'),
    );

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (isPublicPage) {
    const isAuthLanding =
      pathWithoutLocale === Routes.Login ||
      pathWithoutLocale.startsWith(`${Routes.Login}/`) ||
      pathWithoutLocale === Routes.Register ||
      pathWithoutLocale.startsWith(`${Routes.Register}/`) ||
      pathWithoutLocale === Routes.ForgotPassword ||
      pathWithoutLocale.startsWith(`${Routes.ForgotPassword}/`) ||
      pathWithoutLocale === '/reset-password' ||
      pathWithoutLocale.startsWith('/reset-password/');

    if (token && isAuthLanding) {
      return NextResponse.redirect(new URL(`/${locale}${Routes.Calendar}`, req.url));
    }
    return intlMiddleware(req);
  } else {
    const authContext = {
      role: (token)?.user?.role,
    };

    if (token && !isRouteAllowed(pathWithoutLocale, authContext)) {
      return NextResponse.redirect(new URL(`/${locale}${Routes.Calendar}`, req.url));
    }

    return (authMiddleware as any)(req);
  }
}

export const config = {
  matcher: [
    '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
    '/reset-password/:path*',
    '/(fr|en)/reset-password/:path*'
  ]
};