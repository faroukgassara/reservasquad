import type { Metadata } from 'next';
import TemplateCheckout from '@/components/Templates/TemplateCheckout/TemplateCheckout';

const titles: Record<string, string> = {
    en: 'Checkout',
    fr: 'Commande',
    ar: 'الطلب',
};

const descriptions: Record<string, string> = {
    en: 'Complete your Biblio Squad order.',
    fr: 'Finalisez votre commande Biblio Squad.',
    ar: 'أكمل طلبك من Biblio Squad.',
};

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return {
        title: titles[locale] ?? titles.en,
        description: descriptions[locale] ?? descriptions.en,
    };
}

export default function CheckoutPage() {
    return <TemplateCheckout />;
}
