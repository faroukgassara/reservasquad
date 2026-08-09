'use client';

import { SessionProvider } from 'next-auth/react';
import { ModalsProvider } from '@/contexts/ModalsContext';
import { CartProvider } from '@/contexts/CartContext';
import OrganismCartDrawer from '@/components/Organisms/OrganismCartDrawer/OrganismCartDrawer';
import { routing } from '@/i18n/routing';
import { NextIntlClientProvider } from 'next-intl';
import QueryProvider from './QueryProvider';
import { ToastContainer } from 'react-toastify';
import ToastProvider from '@/contexts/ToastContext';
import AuthSessionListener from '@/components/providers/AuthSessionListener';
import WithChildren from '@/types/WithChildren';
import 'react-toastify/dist/ReactToastify.css';

interface RouteProvidersProps extends WithChildren {
    session?: any;
    locale: (typeof routing.locales)[number];
    messages: any;
}


export default function RouteProviders({ children, session, locale, messages }: Readonly<RouteProvidersProps>) {
    return (
        <NextIntlClientProvider locale={locale} messages={messages} timeZone='Europe/Paris'>
            <QueryProvider>
                <SessionProvider session={session}>
                    <AuthSessionListener />
                    <ToastProvider>
                        <ToastContainer />
                        <ModalsProvider>
                            <CartProvider>
                                {children}
                                <OrganismCartDrawer />
                            </CartProvider>
                        </ModalsProvider>
                    </ToastProvider>
                </SessionProvider>
            </QueryProvider>
        </NextIntlClientProvider>
    );
}
