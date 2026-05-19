'use client';

import { ILayoutWrapper } from '@/interfaces';
import OrganismTopSection from '../Organisms/OrganismTopSection/OrganismTopSection';

export default function LayoutWrapper({
    title,
    subTitle,
    mainSection,
    rightActions,
    leftActions,
}: Readonly<ILayoutWrapper>) {
    const showHeader = Boolean(title || subTitle || leftActions || rightActions);

    return (
        <div className="flex min-h-dvh flex-col md:h-full md:min-h-0 md:flex-1">
            {showHeader ?
                <OrganismTopSection
                    title={title}
                    subTitle={subTitle}
                    rightActions={rightActions}
                    leftActions={leftActions}
                />
            :   null}

            <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8">
                {mainSection}
            </div>
        </div>
    );
}
