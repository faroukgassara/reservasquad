const CLIENTS_BASE = '/clients'
const QUOTES_BASE = '/quotes'
const INVOICES_BASE = '/invoices'
const PRODUCTS_BASE = '/products'
const PRODUCT_CATEGORIES_BASE = '/product-categories'

export const Routes = {
    // Public routes
    Login: '/login',
    ForgotPassword: '/forgot-password',
    ResetPassword: '/reset-password',
    Activate: {
        show: (token: string) => `/activate/${token}`,
    },
    Home: '/',
    AboutUs: '/aboutus',
    Shop: {
        index: '/shop',
        detail: (slug: string) => `/shop/${slug}`,
    },
    Cart: '/cart',
    Checkout: '/checkout',

    // Private routes
    Dashboard: '/dashboard',
    Products: {
        index: PRODUCTS_BASE,
        new: `${PRODUCTS_BASE}/new`,
        edit: (id: string) => `${PRODUCTS_BASE}/${id}`,
    },
    ProductCategories: {
        index: PRODUCT_CATEGORIES_BASE,
    },
    ContactMessages: {
        index: '/contact-messages',
    },
    Orders: {
        index: '/orders',
    },
    Testimonials: {
        index: '/testimonials',
    },
    Users: {
        index: '/users',
    },
    Faq: '/faq',
    Faqs: {
        index: '/faqs',
    },
    FaqCategories: {
        index: '/faq-categories',
    },
    Contact: '/contact',
    Clients: {
        index: CLIENTS_BASE,
    },
    Quotes: {
        index: QUOTES_BASE,
        new: `${QUOTES_BASE}/new`,
        show: (id: string) => `${QUOTES_BASE}/${id}`,
    },
    Invoices: {
        index: INVOICES_BASE,
        show: (id: string) => `${INVOICES_BASE}/${id}`,
    },
} as const;

export const PublicRoutes = [
    Routes.Login,
    Routes.ForgotPassword,
    Routes.ResetPassword,
    Routes.Home,
] as const;

export const PrivateRoutes = [
    Routes.Clients,
    Routes.Dashboard,
    Routes.FaqCategories,
] as const;
