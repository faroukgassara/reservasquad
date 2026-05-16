import AtomDiv from '@/components/Atoms/AtomDiv/AtomDiv';
import AtomLabel from '@/components/Atoms/AtomLabel/AtomLabel';
import { EVariantLabel } from '@/Enum/Enum';
import { IOrganismTopSection } from '@/interfaces';

const OrganismTopSection = (props: IOrganismTopSection) => {

    return (
        <header className="flex justify-between items-center h-[100px] px-8 bg-white border-b border-gray-100 sticky top-0 z-40">
            <AtomDiv className="flex flex-row gap-4 items-center">
                {props?.leftActions}
                <AtomDiv className="flex flex-col">
                    <AtomLabel variant={EVariantLabel.h6} color="text-primary-500">
                        {props?.title}
                    </AtomLabel>
                    {props?.subTitle && (
                        <AtomLabel variant={EVariantLabel.bodySmall} color="text-gray-500">
                            {props?.subTitle}
                        </AtomLabel>
                    )}
                </AtomDiv>
            </AtomDiv>

            <AtomDiv className="flex flex-row items-center gap-4">
                {props?.rightActions}
            </AtomDiv>
        </header>
    );
}

export default OrganismTopSection
