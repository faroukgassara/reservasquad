export const SOCKET_EVENTS = {
    CONTACT_MESSAGE_NEW: 'contact-message:new',
} as const;

export function getSocketUrl(): string {
    const socketUrl = process.env.NEXT_APP_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || '';
    return socketUrl.replace(/\/$/, '');
}
