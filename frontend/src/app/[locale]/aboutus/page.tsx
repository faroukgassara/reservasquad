import type { Metadata } from 'next';
import TemplateAboutUs from '@/components/Templates/TemplateAboutUs/TemplateAboutUs';

const titles: Record<string, string> = {
  fr: 'À propos',
  en: 'About Us',
  ar: 'من نحن',
};

const descriptions: Record<string, string> = {
  fr: 'Découvrez Biblio Squad, centre de formation et certification à Sfax, Tunisie. Notre mission, équipe et valeurs.',
  en: 'Discover Biblio Squad, a training and certification center in Sfax, Tunisia. Our mission, team and values.',
  ar: 'اكتشف Biblio Squad، مركز تدريب وشهادات في صفاقس، تونس. مهمتنا، فريقنا وقيمنا.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: titles[locale] || titles.fr, description: descriptions[locale] || descriptions.fr };
}

export default function AboutUsPage() {
    return <TemplateAboutUs />;
}
