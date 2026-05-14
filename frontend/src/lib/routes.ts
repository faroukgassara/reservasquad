const CLIENTS_BASE = '/clients';

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

    Dashboard: '/dashboard',
    Formations: {
        index: '/formations',
        new: '/formations/new',
        edit: (id: string) => `/formations/${id}`,
    },
    FormationCategories: {
        index: '/formation-categories',
    },
    Blogs: {
        index: '/blogs',
        post: (slug: string) => `/blog/${slug}`,
    },
    ContactMessages: {
        index: '/contact-messages',
    },
    Contact: '/contact',
    Clients: {
        index: CLIENTS_BASE,
    },
    Resources: '/resources',
    Archive: '/archive',
    Projects: '/projects',
    Notifications: '/notifications',
    Configuration: '/configuration',
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
