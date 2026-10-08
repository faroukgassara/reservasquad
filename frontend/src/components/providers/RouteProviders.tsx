'use client';

import { SessionProvider } from 'next-auth/react';
import { ModalsProvider } from '@/contexts/ModalsContext';
import { routing } from '@/i18n/routing';
import { NextIntlClientProvider } from 'next-intl';
import QueryProvider from './QueryProvider';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider } from 'next-themes';
import ToastProvider from '@/contexts/ToastContext';
import AuthSessionListener from '@/components/providers/AuthSessionListener';
import WithChildren from '@/types/WithChildren';
import 'react-toastify/dist/ReactToastify.css';

// The theme script only has to run from the server HTML; on the client React 19 warns about any executable <script>.
const themeScriptProps = typeof window === 'undefined' ? undefined : ({ type: 'application/json', suppressHydrationWarning: true } as const);

interface RouteProvidersProps extends WithChildren {
    session?: any;
    locale: (typeof routing.locales)[number];
    messages: any;
}

export default function RouteProviders({ children, session, locale, messages }: Readonly<RouteProvidersProps>) {
    return (
        <NextIntlClientProvider locale={locale} messages={messages} timeZone='Europe/Paris'>
            <ThemeProvider
                attribute='class'
                defaultTheme='system'
                enableSystem
                disableTransitionOnChange
                scriptProps={themeScriptProps}
            >
                <QueryProvider>
                    <SessionProvider session={session}>
                        <AuthSessionListener />
                        <ToastProvider>
                            <ToastContainer />
                            <ModalsProvider>
                                {children}
                            </ModalsProvider>
                        </ToastProvider>
                    </SessionProvider>
                </QueryProvider>
            </ThemeProvider>
        </NextIntlClientProvider>
    );
}
