export const Routes = {
    Login: '/login',
    ForgotPassword: '/forgot-password',
    ResetPassword: '/reset-password',
    Activate: {
        show: (token: string) => `/activate/${token}`,
    },
    Home: '/',
    Dashboard: '/dashboard',
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
} as const;

export const PublicRoutes = [
    Routes.Login,
    Routes.ForgotPassword,
    Routes.ResetPassword,
] as const;
