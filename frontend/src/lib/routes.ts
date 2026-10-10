export const Routes = {
    Login: '/login',
    ForgotPassword: '/forgot-password',
    ResetPassword: '/reset-password',
    Activate: {
        show: (token: string) => `/activate/${token}`,
    },
    Home: '/',
    Dashboard: '/dashboard',
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
    },
    DailyIncome: {
        index: '/daily-income',
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
} as const;

/** Staff (USER) land on Today; admins land on Dashboard. */
export function homePathForRole(role?: string | null): string {
    return role === 'ADMIN' ? Routes.Dashboard : Routes.Today;
}

export const PublicRoutes = [
    Routes.Login,
    Routes.ForgotPassword,
    Routes.ResetPassword,
] as const;
