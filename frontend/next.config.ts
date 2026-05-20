import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const config: NextConfig = {
    output: 'standalone',
    async redirects() {
        return [
            {
                source: '/favicon.ico',
                destination: '/branding/logo-biblio-squad-blanc.png',
                permanent: false,
            },
        ];
    },
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/i,
            use: ['@svgr/webpack'],
        });
        return config;
    },
    // Turbopack (Next.js 15 dev mode) needs separate SVG config
    turbopack: {
        rules: {
            '*.svg': {
                loaders: ['@svgr/webpack'],
                as: '*.js',
            },
        },
    },
};

export default withNextIntl(config);