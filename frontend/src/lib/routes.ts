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
