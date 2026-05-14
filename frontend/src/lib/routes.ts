const CLIENTS_BASE = '/clients';

export const Routes = {
    Login: '/login',
    Register: '/register',
    ForgotPassword: '/forgot-password',
    ResetPassword: '/reset-password',
    Home: '/',

    Calendar: '/calendar',
    MyReservations: '/my-reservations',
    AdminReservations: '/admin/reservations',
    AdminRooms: '/admin/rooms',

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
    Routes.Register,
    Routes.ForgotPassword,
    Routes.ResetPassword,
    Routes.Home,
] as const;

export const PrivateRoutes = [
    Routes.Calendar,
    Routes.MyReservations,
    Routes.AdminReservations,
    Routes.AdminRooms,
] as const;
