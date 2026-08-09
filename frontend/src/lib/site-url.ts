/**
 * Canonical public site URL, used for metadata, sitemap and robots.txt.
 *
 * Always forced to https regardless of NEXT_PUBLIC_FRONT_URL's protocol, so a
 * misconfigured env var (e.g. http://bibliosquad.tn) can't create a canonical /
 * hreflang protocol mismatch with the actually served https pages, which
 * confuses search engines and hurts indexing.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_FRONT_URL || 'https://bibliosquad.tn').replace(
    /^http:\/\//,
    'https://',
);
