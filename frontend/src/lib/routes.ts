export const Routes = {
    Login: '/login',
    ForgotPassword: '/forgot-password',
    ResetPassword: '/reset-password',
    Activate: {
        show: (token: string) => `/activate/${token}`,
    },
    Home: '/',
    Launcher: '/home',
    Today: '/today',
    Calendar: '/calendar',
    Rooms: {
        index: '/rooms',
    },
    Professors: {
        index: '/professors',
        show: (id: string) => `/professors/${id}`,
    },
    Reservations: {
        index: '/reservations',
        reports: '/reservations/reports',
    },
    DailyIncome: {
        index: '/daily-income',
        reports: '/daily-income/reports',
    },
    Pos: {
        index: '/caisse',
        register: '/caisse/register',
        sessions: '/caisse/sessions',
        session: (id: string) => `/caisse/sessions/${id}`,
        products: '/caisse/products',
        product: (id: string) => `/caisse/products/${id}`,
        categories: '/caisse/categories',
        clients: '/caisse/clients',
        client: (id: string) => `/caisse/clients/${id}`,
        sales: '/caisse/sales',
        sale: (id: string) => `/caisse/sales/${id}`,
        invoices: '/caisse/invoices',
        invoice: (id: string) => `/caisse/invoices/${id}`,
        subscriptions: '/caisse/subscriptions',
        subscription: (id: string) => `/caisse/subscriptions/${id}`,
        newSubscriptionFor: (clientId: string) => `/caisse/subscriptions/new?client=${clientId}`,
        analytics: '/caisse/analytics',
        newsletters: '/caisse/newsletters',
        newsletter: (id: string) => `/caisse/newsletters/${id}`,
    },
    Users: {
        index: '/users',
    },
    AuditLog: {
        index: '/audit-log',
    },
    RecycleBin: {
        index: '/recycle-bin',
    },
    Portal: {
        index: '/portal',
        book: '/portal/book',
        history: '/portal/history',
    },
    /** Public café menu, opened from the QR code — no login needed. */
    Menu: '/menu',
} as const;

/** Staff land on the module launcher; professors land on their portal. */
export function homePathForRole(role?: string | null): string {
    if (role === 'PROFESSOR') return Routes.Portal.index;
    return Routes.Launcher;
}

export const PublicRoutes = [
    Routes.Login,
    Routes.ForgotPassword,
    Routes.ResetPassword,
    '/newsletter/unsubscribe',
] as const;
