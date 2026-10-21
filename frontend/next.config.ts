import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const config: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '4000',
                pathname: '/**',
            },
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '4000',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: '**',
            },
        ],
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