const PRINT_STYLES = `
    @page { margin: 4mm; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { width: 72mm; }
    .pos-receipt { max-width: none !important; width: 100% !important; border: none !important; padding: 0 !important; }
    .pos-receipt * { color: #000 !important; border-color: #000 !important; }
`;

/**
 * Prints a rendered receipt in an isolated iframe (light theme, app stylesheets copied),
 * so modals, overlays and dark mode never leak into the ticket.
 */
export function printPosReceipt(element: HTMLElement | null): void {
    if (!element || typeof document === 'undefined') return;

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((node) => node.outerHTML)
        .join('');

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.right = '0';
    iframe.style.bottom = '0';

    iframe.onload = () => {
        const frameWindow = iframe.contentWindow;
        if (!frameWindow) return;
        const cleanup = () => setTimeout(() => iframe.remove(), 500);
        frameWindow.addEventListener('afterprint', cleanup);
        setTimeout(() => {
            frameWindow.focus();
            frameWindow.print();
        }, 150);
    };

    iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8">${styles}<style>${PRINT_STYLES}</style></head><body>${element.outerHTML}</body></html>`;
    document.body.appendChild(iframe);
}
