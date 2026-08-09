import type { Metadata } from 'next';
import TemplateShop from '@/components/Templates/TemplateShop/TemplateShop';

const titles: Record<string, string> = {
    fr: 'Boutique',
    en: 'Shop',
    ar: 'المتجر',
};

const descriptions: Record<string, string> = {
    fr: 'Parcourez notre catalogue d’objets personnalisables, façonnés dans notre atelier de Sfax.',
    en: 'Browse our catalog of customizable objects, crafted in our Sfax workshop.',
    ar: 'تصفّح كتالوج أغراضنا القابلة للتخصيص، المصنوعة في ورشتنا بصفاقس.',
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

export default function ShopPage() {
    return <TemplateShop />;
}
