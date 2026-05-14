import { Routes } from '@/lib/routes';
import { Api } from '@/common/StandardApi/api';
import { Config } from '@/common';
import CredentialsProvider from 'next-auth/providers/credentials';

const config = Config.getInstance();
const api = new Api(config.API_URL);

export const authOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: 'jwt' as const,
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                rememberMe: { label: 'Remember Me', type: 'text' },
            },
            async authorize(credentials) {
                try {
                    const rememberMe = String(credentials?.rememberMe).toLowerCase() === 'true';

                    const apiRes = await api.post(
                        '/auth/login',
                        {
                            email: credentials?.email,
                            password: credentials?.password,
                            rememberMe,
                        },
                        {
                            'Content-Type': 'application/json',
                        }
                    );

                    const data = apiRes.data;

                    if (apiRes.status >= 200 && apiRes.status < 300 && data.data) {
                        return {
                            ...data.data,
                            rememberMe,
                            expires_at: Math.floor(Date.now() / 1000) + (data.data.expires_in || 0)
                        };
                    }
                    return null;
                } catch (error) {
                    console.error('Login error:', error);
                    return null;
                }
            },
        }),
    ],
    pages: {
        signIn: Routes.Login
    },
    events: {
        async signOut({ token }: any) {
            const refreshToken = token?.refreshToken;
            if (!refreshToken) return;

            try {
                await api.post(
                    '/auth/logout',
                    {},
                    {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${refreshToken}`,
                    }
                );
            } catch (error) {
                console.error('Logout API error:', error);
            }
        },
    },
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                const {
                    access_token,
                    refresh_token,
                    expires_at,
                    rememberMe,
                    expires_in,
                    refresh_expires_in,
                    ...safeUser
                } = user;
                void access_token;
                void refresh_token;
                void expires_at;
                void rememberMe;
                void expires_in;
                void refresh_expires_in;

                return {
                    accessToken: user.access_token,
                    refreshToken: user.refresh_token,
                    expiresAt: user.expires_at,
                    rememberMe: user.rememberMe,
                    user: safeUser,
                };
            }

            if (Date.now() / 1000 < token.expiresAt) {
                return token;
            }

            return refreshAccessToken(token);
        },
        async session({ session, token }: any) {
            if (token) {
                session.user = token.user;
                session.accessToken = token.accessToken;
                session.error = token.error;
                session.rememberMe = token.rememberMe;
            }
            return session;
        },
    },
};

async function refreshAccessToken(token: any) {
    try {
        const apiRes = await api.post(
            '/auth/refresh-token',
            {},
            {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.refreshToken}`,
            }
        );

        const data = apiRes.data;

        if (!(apiRes.status >= 200 && apiRes.status < 300)) throw data;

        const {
            access_token,
            refresh_token,
            rememberMe,
            expires_in,
            refresh_expires_in,
            ...safeUser
        } = data.data || {};
        void rememberMe;
        void expires_in;
        void refresh_expires_in;

        return {
            ...token,
            accessToken: access_token || data.data?.access_token,
            refreshToken: refresh_token || data.data?.refresh_token,
            expiresAt: Math.floor(Date.now() / 1000) + (data.data?.expires_in || 0),
            rememberMe: data.data?.rememberMe ?? token.rememberMe,
            user: safeUser,
        };
    } catch (error) {
        console.error('Refresh token error:', error);
        return {
            ...token,
            error: 'RefreshAccessTokenError',
        };
    }
}
