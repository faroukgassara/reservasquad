import { IconComponentsEnum } from '@/Enum/Enum';
import { Routes } from './routes';

export type ModuleId = 'reservations' | 'caisse' | 'recettes' | 'admin';

/** Theme colour that identifies a module on the launcher card and in the module switcher. */
export type ModuleTone = 'primary' | 'accent' | 'success' | 'warning';

type StaffRole = 'ADMIN' | 'USER';

type SidebarLabelKey =
    | 'today'
    | 'calendar'
    | 'reservations'
    | 'rooms'
    | 'professors'
    | 'management'
    | 'reports'
    | 'caisseHome'
    | 'sessions'
    | 'subscriptions'
    | 'billing'
    | 'clientsSales'
    | 'clients'
    | 'products'
    | 'articles'
    | 'categories'
    | 'analytics'
    | 'newsletters'
    | 'dailyIncome'
    | 'users'
    | 'auditLog'
    | 'recycleBin'
    | 'settings';

export interface INavModuleItem {
    id: string;
    icon: IconComponentsEnum;
    /** Key in the `sidebar` translation namespace. */
    labelKey: SidebarLabelKey;
    href: string;
    roles?: StaffRole[];
    exact?: boolean;
    alsoActive?: string[];
    /** Nested items rendered in a dropdown under this link. */
    children?: INavModuleItem[];
}

export interface INavModule {
    id: ModuleId;
    icon: IconComponentsEnum;
    tone: ModuleTone;
    homeHref: string;
    roles: StaffRole[];
    pathPrefixes: string[];
    items: INavModuleItem[];
}

const STAFF: StaffRole[] = ['ADMIN', 'USER'];
const ADMIN_ONLY: StaffRole[] = ['ADMIN'];

export const NAV_MODULES: INavModule[] = [
    {
        id: 'reservations',
        icon: IconComponentsEnum.calendar,
        tone: 'primary',
        homeHref: Routes.Calendar,
        roles: STAFF,
        pathPrefixes: [Routes.Today, Routes.Calendar, Routes.Reservations.index, Routes.Rooms.index, Routes.Professors.index],
        items: [
            { id: 'today', icon: IconComponentsEnum.clock, labelKey: 'today', href: Routes.Today },
            { id: 'calendar', icon: IconComponentsEnum.calendar, labelKey: 'calendar', href: Routes.Calendar },
            {
                id: 'reservations',
                icon: IconComponentsEnum.bookOpenText,
                labelKey: 'reservations',
                href: Routes.Reservations.index,
                exact: true,
            },
            {
                id: 'management',
                icon: IconComponentsEnum.users,
                labelKey: 'management',
                href: Routes.Rooms.index,
                children: [
                    { id: 'rooms', icon: IconComponentsEnum.home, labelKey: 'rooms', href: Routes.Rooms.index },
                    { id: 'professors', icon: IconComponentsEnum.user, labelKey: 'professors', href: Routes.Professors.index },
                ],
            },
            {
                id: 'reservation-reports',
                icon: IconComponentsEnum.layers,
                labelKey: 'reports',
                href: Routes.Reservations.reports,
                roles: ADMIN_ONLY,
            },
        ],
    },
    {
        id: 'caisse',
        icon: IconComponentsEnum.shoppingCart,
        tone: 'accent',
        homeHref: Routes.Pos.index,
        roles: STAFF,
        pathPrefixes: [Routes.Pos.index],
        items: [
            { id: 'caisse-home', icon: IconComponentsEnum.home, labelKey: 'caisseHome', href: Routes.Pos.index, exact: true },
            {
                id: 'sessions',
                icon: IconComponentsEnum.clock,
                labelKey: 'sessions',
                href: Routes.Pos.sessions,
                roles: ADMIN_ONLY,
            },
            {
                id: 'clients-sales',
                icon: IconComponentsEnum.filetext,
                labelKey: 'clientsSales',
                href: Routes.Pos.sales,
                roles: ADMIN_ONLY,
                children: [
                    {
                        id: 'subscriptions',
                        icon: IconComponentsEnum.userCheck,
                        labelKey: 'subscriptions',
                        href: Routes.Pos.subscriptions,
                        roles: ADMIN_ONLY,
                    },
                    {
                        id: 'billing',
                        icon: IconComponentsEnum.filetext,
                        labelKey: 'billing',
                        href: Routes.Pos.sales,
                        roles: ADMIN_ONLY,
                        alsoActive: [Routes.Pos.invoices],
                    },
                    {
                        id: 'analytics',
                        icon: IconComponentsEnum.layers,
                        labelKey: 'analytics',
                        href: Routes.Pos.analytics,
                        roles: ADMIN_ONLY,
                    },
                    {
                        id: 'clients',
                        icon: IconComponentsEnum.users,
                        labelKey: 'clients',
                        href: Routes.Pos.clients,
                        roles: ADMIN_ONLY,
                    },
                ],
            },
            {
                id: 'articles',
                icon: IconComponentsEnum.layer,
                labelKey: 'articles',
                href: Routes.Pos.products,
                roles: ADMIN_ONLY,
                children: [
                    {
                        id: 'products',
                        icon: IconComponentsEnum.layer,
                        labelKey: 'products',
                        href: Routes.Pos.products,
                        roles: ADMIN_ONLY,
                    },
                    {
                        id: 'categories',
                        icon: IconComponentsEnum.squaresFour,
                        labelKey: 'categories',
                        href: Routes.Pos.categories,
                        roles: ADMIN_ONLY,
                    },
                ],
            },
            {
                id: 'newsletters',
                icon: IconComponentsEnum.message,
                labelKey: 'newsletters',
                href: Routes.Pos.newsletters,
                roles: ADMIN_ONLY,
            },
        ],
    },
    {
        id: 'recettes',
        icon: IconComponentsEnum.wallet,
        tone: 'success',
        homeHref: Routes.DailyIncome.index,
        roles: ADMIN_ONLY,
        pathPrefixes: [Routes.DailyIncome.index],
        items: [
            {
                id: 'daily-income',
                icon: IconComponentsEnum.squaresFour,
                labelKey: 'dailyIncome',
                href: Routes.DailyIncome.index,
                exact: true,
            },
        ],
    },
    {
        id: 'admin',
        icon: IconComponentsEnum.settings,
        tone: 'warning',
        homeHref: Routes.Users.index,
        roles: ADMIN_ONLY,
        pathPrefixes: [Routes.Users.index, Routes.AuditLog.index, Routes.RecycleBin.index, Routes.Settings.index],
        items: [
            { id: 'users', icon: IconComponentsEnum.user, labelKey: 'users', href: Routes.Users.index },
            { id: 'audit-log', icon: IconComponentsEnum.clock, labelKey: 'auditLog', href: Routes.AuditLog.index },
            { id: 'recycle-bin', icon: IconComponentsEnum.archive, labelKey: 'recycleBin', href: Routes.RecycleBin.index },
            { id: 'settings', icon: IconComponentsEnum.settings, labelKey: 'settings', href: Routes.Settings.index },
        ],
    },
];

const isUnder = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

const hasRole = (roles: StaffRole[] | undefined, role?: string | null) =>
    !roles || (role != null && (roles as string[]).includes(role));

export function moduleForPath(path: string): INavModule | undefined {
    return NAV_MODULES.find((module) => module.pathPrefixes.some((prefix) => isUnder(path, prefix)));
}

export function modulesForRole(role?: string | null): INavModule[] {
    return NAV_MODULES.filter((module) => hasRole(module.roles, role));
}

export function moduleItemsForRole(module: INavModule, role?: string | null): INavModuleItem[] {
    return module.items
        .filter((item) => hasRole(item.roles, role))
        .map((item) =>
            item.children
                ? { ...item, children: item.children.filter((child) => hasRole(child.roles, role)) }
                : item,
        )
        .filter((item) => !item.children || item.children.length > 0);
}
