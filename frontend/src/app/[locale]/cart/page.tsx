import type { Metadata } from 'next';
import TemplateCart from '@/components/Templates/TemplateCart/TemplateCart';

const titles: Record<string, string> = {
    fr: 'Votre panier',
    en: 'Your cart',
    ar: 'سلتك',
};

const descriptions: Record<string, string> = {
    fr: 'Consultez les articles de votre panier Conchas.',
    en: 'Review the items in your Conchas cart.',
    ar: 'راجع المنتجات في سلة كونشاس.',
};

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return {
        title: titles[locale] || titles.fr,
        description: descriptions[locale] || descriptions.fr,
    };
}

export default function CartPage() {
    return <TemplateCart />;
}
