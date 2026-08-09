/**
 * Build a browser-safe URL for uploaded media stored on the NestJS backend.
 *
 * Production: leave NEXT_PUBLIC_MEDIA_URL unset so paths are same-origin
 * (e.g. /formations/uuid.jpg) and nginx proxies them to the backend.
 * Development: set NEXT_PUBLIC_MEDIA_URL=http://localhost:4000
 */
export function getMediaUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    const normalized = path.replace(/^\/+/, '');
    const base = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/$/, '') ?? '';

    return base ? `${base}/${normalized}` : `/${normalized}`;
}
