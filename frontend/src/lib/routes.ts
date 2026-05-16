export const Routes = {
    Login: '/login',
    ForgotPassword: '/forgot-password',
    ResetPassword: '/reset-password',
    Home: '/',

    Calendar: '/calendar',
    AdminCalendar: '/admin/calendar',
    AdminReservations: '/admin/reservations',
    AdminRooms: '/admin/rooms',
    AdminTeachers: '/admin/teachers',
} as const;

export const PublicRoutes = [
    Routes.Login,
    Routes.ForgotPassword,
    Routes.ResetPassword,
    Routes.Home,
    Routes.Calendar,
] as const;

export const PrivateRoutes = [
    Routes.AdminCalendar,
    Routes.AdminReservations,
    Routes.AdminRooms,
    Routes.AdminTeachers,
] as const;
