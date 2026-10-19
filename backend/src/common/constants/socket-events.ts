export const SOCKET_EVENTS = {
    CONTACT_MESSAGE_NEW: 'contact-message:new',
    NOTIFICATION_NEW: 'notification:new',
} as const;

export const SOCKET_ROOMS = {
    ADMINS: 'admins',
    STAFF: 'staff',
    user: (userId: string) => `user:${userId}`,
} as const;
