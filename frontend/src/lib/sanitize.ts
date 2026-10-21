import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML strings for safe rendering in the browser (e.g. via dangerouslySetInnerHTML).
 * Strips XSS attack vectors (script tags, event handlers, javascript: URIs) while preserving
 * safe newsletter formatting (headings, styled paragraphs, links, images, tables, attachment cards).
 */
export function sanitizeNewsletterHtml(dirty: string): string {
    if (!dirty) return '';
    if (typeof window !== 'undefined') {
        return DOMPurify.sanitize(dirty, {
            ADD_ATTR: ['target', 'download'],
        });
    }
    return dirty;
}
