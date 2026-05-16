'use client';

import { ILayoutWrapper } from "@/interfaces";
import OrganismTopSection from "../Organisms/OrganismTopSection/OrganismTopSection";

export default function LayoutWrapper({ title, subTitle, mainSection, rightActions, leftActions }: Readonly<ILayoutWrapper>) {
    return (
        <>
            <OrganismTopSection title={title} subTitle={subTitle} rightActions={rightActions} leftActions={leftActions} />

            <div className="h-[88%] p-8 bg-gray-50">
                {mainSection}
            </div>
        </>
    );
}
