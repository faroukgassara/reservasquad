'use client';

import TopSection from '../Organisms/OrganismTopSection/OrganismTopSection';
import { ILayoutWrapper } from "@/interfaces";

export default function LayoutWrapper({ title, subTitle, mainSection, rightActions, leftActions }: Readonly<ILayoutWrapper>) {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <TopSection title={title} subTitle={subTitle} rightActions={rightActions} leftActions={leftActions} />

            <div className="flex-1 bg-gray-25 p-4 sm:p-6 lg:p-8">
                {mainSection}
            </div>
        </div>
    );
}
