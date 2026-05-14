import { Div, Label } from '@/components/Atoms';
import { EVariantLabel } from '@/Enum/Enum';
import { IOrganismTopSection } from '@/interfaces';

const OrganismTopSection = (props: IOrganismTopSection) => {

    return (
        <header className="flex justify-between items-center h-[100px] px-8 bg-white border-b border-gray-100 sticky top-0 z-40">
            <Div className="flex flex-row gap-4 items-center">
                {props?.leftActions}
                <Div className="flex flex-col">
                    <Label variant={EVariantLabel.h6} color="text-primary-500">
                        {props?.title}
                    </Label>
                    {props?.subTitle && (
                        <Label variant={EVariantLabel.bodySmall} color="text-gray-500">
                            {props?.subTitle}
                        </Label>
                    )}
                </Div>
            </Div>

            <Div className="flex flex-row items-center gap-4">
                {props?.rightActions}
            </Div>
        </header>
    );
}

export default OrganismTopSection
