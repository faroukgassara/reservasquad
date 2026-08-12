'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30 * 1000,
                        retry: (failureCount, error: any) => {
                            if (error?.status >= 400 && error?.status < 500) {
                                return false;
                            }
                            return failureCount < 2;
                        },
                    },
                    mutations: {
                        retry: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
