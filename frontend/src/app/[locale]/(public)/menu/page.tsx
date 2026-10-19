import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import MenuBrowser, { type MenuSection } from '@/components/Organisms/Menu/MenuBrowser';

interface ApiMenuSection extends Omit<MenuSection, 'name'> {
    name: string | null;
}

const REVALIDATE_SECONDS = 60;

async function fetchMenu(): Promise<ApiMenuSection[] | null> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    if (!apiUrl) return null;
    try {
        const res = await fetch(`${apiUrl}/public/menu`, { next: { revalidate: REVALIDATE_SECONDS } });
        if (!res.ok) return null;
        const body = (await res.json()) as { data?: { categories?: ApiMenuSection[] } };
        return body.data?.categories ?? [];
    } catch {
        return null;
    }
}

async function resolveLocale(params: Promise<{ locale: string }>) {
    const { locale } = await params;
    return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const locale = await resolveLocale(params);
    const t = await getTranslations({ locale, namespace: 'menu' });
    return { title: t('metaTitle'), description: t('subtitle') };
}

export default async function PublicMenuPage({ params }: { params: Promise<{ locale: string }> }) {
    const locale = await resolveLocale(params);
    const t = await getTranslations({ locale, namespace: 'menu' });
    const tCommon = await getTranslations({ locale, namespace: 'common' });
    const apiSections = await fetchMenu();
    const sections = apiSections?.map((section) => ({ ...section, name: section.name ?? t('otherCategory') })) ?? null;

    return <MenuBrowser sections={sections} logoAlt={tCommon('brandLogoAlt')} />;
}
