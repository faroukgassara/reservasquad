import type { Metadata } from 'next';
import TemplateFaq from '@/components/Templates/TemplateFaq/TemplateFaq';

const titles: Record<string, string> = {
  fr: 'FAQ',
  en: 'FAQ',
  ar: 'الأسئلة الشائعة',
};

const descriptions: Record<string, string> = {
  fr: 'Questions fréquentes sur Biblio Squad : formations, certifications, coworking, tarifs et inscriptions.',
  en: 'Frequently asked questions about Biblio Squad: training, certifications, coworking, pricing and enrollment.',
  ar: 'الأسئلة الشائعة حول Biblio Squad: التدريب، الشهادات، مساحة العمل المشتركة، الأسعار والتسجيل.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: titles[locale] || titles.fr, description: descriptions[locale] || descriptions.fr };
}

export default function FaqPage() {
    return <TemplateFaq />;
}
