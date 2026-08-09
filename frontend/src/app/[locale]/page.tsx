import TemplateHero from '@/components/Templates/TemplateHero/TemplateHero';
import TemplateOurServices from '@/components/Templates/TemplateOurServices/TemplateOurServices';
import TemplateProducts from '@/components/Templates/TemplateProducts/TemplateProducts';
import TemplateOurHistory from '@/components/Templates/TemplateOurHistory/TemplateOurHistory';
import TemplateTestimonials from '@/components/Templates/TemplateTestimonials/TemplateTestimonials';
import OrganismHomeCtaBanner from '@/components/Organisms/OrganismHomeCtaBanner/OrganismHomeCtaBanner';

export default function Home() {
    return (
        <>
            <TemplateHero />
            <TemplateOurServices />
            <TemplateProducts />
            <TemplateOurHistory />
            <TemplateTestimonials />
            <OrganismHomeCtaBanner />
        </>
    );
}
