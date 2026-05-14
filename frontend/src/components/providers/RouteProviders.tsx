'use client';

import { SessionProvider } from 'next-auth/react';
import { ModalsProvider } from '@/contexts/ModalsContext';
import WithChildren from '@/types/WithChildren';
import { NextIntlClientProvider } from 'next-intl';
import QueryProvider from './QueryProvider';
import { ToastContainer } from 'react-toastify';
import ToastProvider from '@/contexts/ToastContext';
import 'react-toastify/dist/ReactToastify.css';

interface RouteProvidersProps extends WithChildren {
    session?: any;
    locale: 'en' | 'fr';
    messages: any;
}


export default function RouteProviders({ children, session, locale, messages }: Readonly<RouteProvidersProps>) {
    return (
        <NextIntlClientProvider locale={locale} messages={messages} timeZone='Europe/Paris'>
            <QueryProvider>
                <SessionProvider session={session}>
                    <ToastProvider>
                        <ToastContainer />
                        <ModalsProvider>
                            {children}
                        </ModalsProvider>
                    </ToastProvider>
                </SessionProvider>
            </QueryProvider>
        </NextIntlClientProvider>
    );
}
