import type { Metadata } from 'next';
import TemplateContact from '@/components/Templates/TemplateContact/TemplateContact';

const titles: Record<string, string> = {
  fr: 'Contact',
  en: 'Contact',
  ar: 'اتصل بنا',
};

const descriptions: Record<string, string> = {
  fr: 'Contactez Biblio Squad à Sfax, Tunisie. Adresse, téléphone, email et formulaire de contact.',
  en: 'Contact Biblio Squad in Sfax, Tunisia. Address, phone, email and contact form.',
  ar: 'تواصل مع Biblio Squad في صفاقس، تونس. العنوان، الهاتف، البريد الإلكتروني ونموذج الاتصال.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: titles[locale] || titles.fr, description: descriptions[locale] || descriptions.fr };
}

export default function ContactPage() {
    return <TemplateContact />;
}
